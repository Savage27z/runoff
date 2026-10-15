// Fits a Mixamo-rigged character to the Y Bot's skeleton, so the runner's takes (made on the Y Bot: a hips height and
// one rotation per bone, in each bone's parent's frame) pose it as they pose the Y Bot.
//
// Mixamo characters share the Y Bot's bone names and hierarchy, but not its frames: a raw export stands in centimetres
// under a 0.01-scaled node, may face -z, and each bone's rest axes differ from the Y Bot's by up to tens of degrees (the
// shoulders, the feet), so the Y Bot's rotations would twist its limbs. The fit, once, as the model loads:
//
// 1. poses the character in its T-pose (its `TPose` clip if it has one, else its bind pose);
// 2. bakes every skinned mesh into the space the Y Bot stands in: metres, the feet on y = 0, the hips over the origin,
//    facing +z, scaled so the hips stand as high as the Y Bot's (the takes carry the Y Bot's hips height);
// 3. gives every bone the Y Bot's rest rotation (in that space), keeping where its joint is, adds the Y Bot's bones the
//    character lacks (finger tips, the head's top), and binds the meshes to the new rest.
//
// A take's rotation of a bone then turns it from the same rest frame as on the Y Bot, about its own joint: the same
// motion on another body. Rendering only; the run never reads a pose.

import { Bone, Matrix4, Object3D, PropertyBinding, Quaternion, Skeleton, Vector3 } from 'three/webgpu';

const PREFIX = 'mixamorig';

/**
 * @param {{ scene: Object3D, animations: AnimationClip[] }} gltf a loaded Mixamo-rigged character (changed in place)
 * @param {{ bones: Object<string, { parent: string|null, p: number[], q: number[], local: number[] }> }} rest the Y Bot's
 *   rest skeleton (src/figure/ybot-rest.json)
 */
export function fitCharacter( gltf, rest ) {

	const scene = gltf.scene;
	scene.updateMatrixWorld( true );

	// The bones by their Mixamo names: a prefix of the exporter's ('mixamorig:', 'mixamorig1', none) becomes 'mixamorig'.
	const bones = [];
	scene.traverse( ( o ) => o.isBone && bones.push( o ) );
	const hips = bones.find( ( b ) => /Hips$/.test( b.name ) );
	if ( ! hips ) throw new Error( 'fitCharacter: no Hips bone; is this a Mixamo-rigged model?' );
	const prefix = hips.name.slice( 0, - 'Hips'.length );
	for ( const bone of bones ) if ( bone.name.startsWith( prefix ) ) bone.name = PREFIX + bone.name.slice( prefix.length );
	const byName = new Map( bones.map( ( b ) => [ b.name, b ] ) );

	// 1. The T-pose.
	const tpose = gltf.animations.find( ( clip ) => /t-?pose/i.test( clip.name ) );
	if ( tpose ) {

		for ( const track of tpose.tracks ) {

			const { nodeName, propertyName } = PropertyBinding.parseTrackName( track.name );
			const node = byName.get( nodeName.startsWith( prefix ) ? PREFIX + nodeName.slice( prefix.length ) : nodeName );
			if ( ! node ) continue;
			if ( propertyName === 'quaternion' ) node.quaternion.fromArray( track.values, 0 );

		}

		scene.updateMatrixWorld( true );

	}

	const meshes = [];
	scene.traverse( ( o ) => o.isSkinnedMesh && meshes.push( o ) );

	// 2. The space the Y Bot stands in. Facing: the turn about up that brings the character's left hip where the Y
	// Bot's is (its left is +x, facing +z).
	const worldOf = ( o ) => o.getWorldPosition( new Vector3() );
	const leftHip = worldOf( byName.get( `${PREFIX}LeftUpLeg` ) ).sub( worldOf( hips ) );
	const ybotLeft = new Vector3().fromArray( rest.bones[ `${PREFIX}LeftUpLeg` ].p ).sub( new Vector3().fromArray( rest.bones[ `${PREFIX}Hips` ].p ) );
	const turn = Math.atan2( ybotLeft.x, ybotLeft.z ) - Math.atan2( leftHip.x, leftHip.z );
	const facing = new Quaternion().setFromAxisAngle( new Vector3( 0, 1, 0 ), turn );

	const baked = meshes.map( ( mesh ) => bakePose( mesh, facing ) );
	let ground = Infinity;
	for ( const { position } of baked ) for ( let i = 1; i < position.length; i += 3 ) ground = Math.min( ground, position[ i ] );

	const hipsAt = worldOf( hips ).applyQuaternion( facing );
	const scale = rest.bones[ `${PREFIX}Hips` ].p[ 1 ] / ( hipsAt.y - ground );
	const origin = new Vector3( hipsAt.x, ground, hipsAt.z );
	const place = ( v ) => v.applyQuaternion( facing ).sub( origin ).multiplyScalar( scale );

	for ( const { position } of baked ) {

		for ( let i = 0; i < position.length; i += 3 ) {

			// Already turned by bakePose: only moved and scaled here.
			position[ i ] = ( position[ i ] - origin.x ) * scale;
			position[ i + 1 ] = ( position[ i + 1 ] - origin.y ) * scale;
			position[ i + 2 ] = ( position[ i + 2 ] - origin.z ) * scale;

		}

	}

	// 3. The new rest: each joint where it is (placed), each bone in the Y Bot's rest rotation. Bones the Y Bot lacks
	// keep their own rotation, turned to face +z.
	const placed = new Map();
	for ( const bone of bones ) {

		const r = rest.bones[ bone.name ];
		const rotation = r ? new Quaternion().fromArray( r.q ) : facing.clone().multiply( bone.getWorldQuaternion( new Quaternion() ) );
		placed.set( bone, { position: place( worldOf( bone ) ), rotation } );

	}

	// A clean hierarchy: the scene, an armature at the origin, the hips under it; the meshes beside it, unmoved.
	const armature = new Object3D();
	armature.name = 'Armature';
	scene.add( armature );
	armature.add( hips );
	setRest( hips, armature, placed );

	// The Y Bot's bones the character lacks, added where the Y Bot has them (relative to their parent, scaled).
	for ( const [ name, r ] of Object.entries( rest.bones ) ) {

		if ( byName.has( name ) || ! r.parent || ! byName.has( r.parent ) ) continue;
		const parent = byName.get( r.parent );
		const bone = new Bone();
		bone.name = name;
		const parentRotation = placed.get( parent ).rotation;
		bone.position.fromArray( r.local );
		bone.quaternion.copy( parentRotation.clone().invert().multiply( new Quaternion().fromArray( r.q ) ) );
		parent.add( bone );
		byName.set( name, bone );
		bones.push( bone );
		placed.set( bone, { position: null, rotation: new Quaternion().fromArray( r.q ) } );

	}

	// Everything else the export carried (its root nodes, cameras, lights) goes; the meshes stay, at the origin.
	for ( const child of [ ...scene.children ] ) if ( child !== armature ) scene.remove( child );
	scene.position.set( 0, 0, 0 );
	scene.quaternion.identity();
	scene.scale.set( 1, 1, 1 );
	scene.updateMatrixWorld( true );

	const skeleton = new Skeleton( bones );
	skeleton.calculateInverses();
	meshes.forEach( ( mesh, i ) => {

		const geometry = mesh.geometry.clone();
		geometry.setAttribute( 'position', geometry.getAttribute( 'position' ).clone() );
		geometry.attributes.position.array.set( baked[ i ].position );
		if ( geometry.attributes.normal ) {

			geometry.setAttribute( 'normal', geometry.getAttribute( 'normal' ).clone() );
			geometry.attributes.normal.array.set( baked[ i ].normal );

		}

		// The skin indices pointed into the mesh's own skeleton: point them at the same bones in the shared one.
		const order = mesh.skeleton.bones.map( ( bone ) => bones.indexOf( bone ) );
		const index = geometry.getAttribute( 'skinIndex' ).clone();
		for ( let k = 0; k < index.array.length; k ++ ) index.array[ k ] = order[ index.array[ k ] ];
		geometry.setAttribute( 'skinIndex', index );
		geometry.deleteAttribute( 'tangent' );
		geometry.computeBoundingBox();
		geometry.computeBoundingSphere();

		mesh.geometry = geometry;
		mesh.position.set( 0, 0, 0 );
		mesh.quaternion.identity();
		mesh.scale.set( 1, 1, 1 );
		scene.add( mesh );
		mesh.updateMatrixWorld( true );
		mesh.bind( skeleton, new Matrix4() );

	} );

	gltf.animations = [];
	return gltf;

}

// Sets a bone's rest (and its children's, down the tree) from where each should be, in the armature's space.
function setRest( bone, parent, placed, parentRotation = new Quaternion(), parentPosition = new Vector3() ) {

	const { position, rotation } = placed.get( bone );
	const inverse = parentRotation.clone().invert();
	bone.position.copy( position ).sub( parentPosition ).applyQuaternion( inverse );
	bone.quaternion.copy( inverse ).multiply( rotation );
	bone.scale.set( 1, 1, 1 );
	for ( const child of bone.children ) if ( child.isBone ) setRest( child, bone, placed, rotation, position );

}

// A skinned mesh's vertices and normals as posed now, in world space, turned by `facing` (not yet moved or scaled).
function bakePose( mesh, facing ) {

	const geometry = mesh.geometry, skeleton = mesh.skeleton;
	const positions = geometry.getAttribute( 'position' ), normals = geometry.getAttribute( 'normal' );
	const skinIndex = geometry.getAttribute( 'skinIndex' ), skinWeight = geometry.getAttribute( 'skinWeight' );
	const boneMatrices = skeleton.bones.map( ( bone, i ) => new Matrix4().multiplyMatrices( bone.matrixWorld, skeleton.boneInverses[ i ] ) );
	const outer = new Matrix4().makeRotationFromQuaternion( facing ).multiply( mesh.matrixWorld ).multiply( mesh.bindMatrixInverse );
	const position = new Float32Array( positions.count * 3 ), normal = normals ? new Float32Array( normals.count * 3 ) : null;
	const skin = new Matrix4(), full = new Matrix4(), v = new Vector3(), n = new Vector3(), weighted = new Matrix4();

	for ( let i = 0; i < positions.count; i ++ ) {

		skin.set( 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 );
		for ( let k = 0; k < 4; k ++ ) {

			const w = skinWeight.getComponent( i, k );
			if ( w === 0 ) continue;
			weighted.copy( boneMatrices[ skinIndex.getComponent( i, k ) ] ).multiplyScalar( w );
			for ( let e = 0; e < 16; e ++ ) skin.elements[ e ] += weighted.elements[ e ];

		}

		full.copy( outer ).multiply( skin ).multiply( mesh.bindMatrix );
		v.fromBufferAttribute( positions, i ).applyMatrix4( full );
		position.set( [ v.x, v.y, v.z ], i * 3 );
		if ( normal ) {

			n.fromBufferAttribute( normals, i ).transformDirection( full );
			normal.set( [ n.x, n.y, n.z ], i * 3 );

		}

	}

	return { position, normal };

}
