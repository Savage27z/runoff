// Prints a Mixamo-rigged glTF's skeleton as the runner needs it: the node chain above the hips (and its scales), the
// bone names, the hips' rest height in metres, and each main bone's rest rotation against the Y Bot's.
// `node tools/characters/inspect.mjs <model.glb> [<model.glb> …]`
import '../headless/env.mjs';

const THREE = await import( 'three' );
const { GLTFLoader } = await import( 'three/addons/loaders/GLTFLoader.js' );
const fs = await import( 'node:fs' );

async function load( file ) {

	const data = fs.readFileSync( file );
	// Headless there is no image decoding: the skeleton is all this needs, so textures load as none.
	const loader = new GLTFLoader().register( () => ( { name: 'noTextures', loadTexture: () => Promise.resolve( null ) } ) );
	return new Promise( ( done, fail ) => loader.parse( data.buffer.slice( data.byteOffset, data.byteOffset + data.byteLength ), '', done, fail ) );

}

const MAIN = [ 'Hips', 'Spine', 'Spine2', 'Neck', 'Head', 'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'RightUpLeg', 'RightLeg', 'RightFoot' ];
const files = [ 'public/models/ybot.glb', ...process.argv.slice( 2 ) ];
const models = [];
for ( const file of files ) {

	const gltf = await load( file );
	const scene = gltf.scene;
	scene.updateMatrixWorld( true );
	const bones = [];
	scene.traverse( ( o ) => o.isBone && bones.push( o ) );
	const hips = bones.find( ( b ) => /hips$/i.test( b.name ) );
	const prefix = hips.name.slice( 0, - 4 );
	const chain = [];
	for ( let o = hips.parent; o; o = o.parent ) chain.push( `${o.name || o.type}(s=${o.scale.x.toFixed( 3 )})` );
	const box = new THREE.Box3().setFromObject( scene );
	const meshes = [];
	scene.traverse( ( o ) => o.isMesh && meshes.push( `${o.name}${o.isSkinnedMesh ? '*' : ''}:${[ o.material ].flat().map( ( m ) => m.name ).join( '/' )}` ) );
	console.log( `\n=== ${file}` );
	console.log( `bones ${bones.length}, prefix "${prefix}", hips local y ${hips.position.y.toFixed( 3 )}, hips world y ${hips.getWorldPosition( new THREE.Vector3() ).y.toFixed( 3 )} m, bounds h ${( box.max.y - box.min.y ).toFixed( 2 )} m` );
	console.log( `above hips: ${chain.join( ' < ' )}` );
	console.log( `meshes: ${meshes.join( ', ' )}` );
	console.log( `animations: ${gltf.animations.map( ( a ) => a.name ).join( ', ' ) || '-'}` );
	models.push( { file, prefix, bones: new Map( bones.map( ( b ) => [ b.name.slice( prefix.length ), b ] ) ) } );

}

const [ ybot, ...others ] = models;
for ( const m of others ) {

	const missing = [ ...ybot.bones.keys() ].filter( ( n ) => ! m.bones.has( n ) );
	console.log( `\n${m.file} vs Y Bot: missing bones ${missing.length ? missing.join( ' ' ) : 'none'}` );
	for ( const name of MAIN ) {

		const a = ybot.bones.get( name ), b = m.bones.get( name );
		if ( ! a || ! b ) continue;
		const angle = THREE.MathUtils.radToDeg( a.quaternion.angleTo( b.quaternion ) );
		const wa = a.getWorldQuaternion( new THREE.Quaternion() ), wb = b.getWorldQuaternion( new THREE.Quaternion() );
		console.log( `  ${name.padEnd( 13 )} local rest differs ${angle.toFixed( 1 ).padStart( 6 )}°   world rest differs ${THREE.MathUtils.radToDeg( wa.angleTo( wb ) ).toFixed( 1 ).padStart( 6 )}°   length ${b.position.length().toFixed( 2 )} vs ${a.position.length().toFixed( 2 )}` );

	}

}

process.exit( 0 );
