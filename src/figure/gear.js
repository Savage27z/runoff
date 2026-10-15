// The runner's gear from the Locker (RUNOFF's costumes, on the Mixamo runners): something on the head, on the face, on
// the back, and a trail. Each piece is made here, sized to the runner's head (its head bone to the top of its skull) and
// fixed to a bone, so it moves with the takes. A piece is laid out in the model's own frame (up +y, forward +z) at the
// bind pose and carried into its bone's frame, so it sits the same on every runner whatever its bones' axes.

import * as THREE from 'three/webgpu';

// The pieces each slot offers and the stars each needs.
export const GEAR = {
	head: [
		{ id: null, name: 'None', stars: 0 },
		{ id: 'cap', name: 'Cap', stars: 0 },
		{ id: 'backcap', name: 'Backwards Cap', stars: 0 },
		{ id: 'beanie', name: 'Beanie', stars: 1 },
		{ id: 'headband', name: 'Headband', stars: 2 },
		{ id: 'headphones', name: 'Headphones', stars: 4 },
		{ id: 'cat', name: 'Cat Ears', stars: 6 },
		{ id: 'crown', name: 'Crown', stars: 12 },
		{ id: 'halo', name: 'Halo', stars: 16 },
	],
	face: [
		{ id: null, name: 'None', stars: 0 },
		{ id: 'shades', name: 'Shades', stars: 0 },
		{ id: 'mask', name: 'Bandana', stars: 3 },
		{ id: 'visor', name: 'Cyber Visor', stars: 8 },
	],
	back: [
		{ id: null, name: 'None', stars: 0 },
		{ id: 'backpack', name: 'Backpack', stars: 0 },
		{ id: 'scarf', name: 'Scarf', stars: 2 },
		{ id: 'jetpack', name: 'Jetpack', stars: 10 },
		{ id: 'wings', name: 'Wings', stars: 14 },
	],
	trail: [
		{ id: null, name: 'None', stars: 0 },
		{ id: 'ember', name: 'Ember', stars: 0, color: '#ff6a2b' },
		{ id: 'volt', name: 'Volt', stars: 3, color: '#c6ff3d' },
		{ id: 'ice', name: 'Ice', stars: 5, color: '#7fe3ff' },
		{ id: 'pink', name: 'Neon Pink', stars: 7, color: '#ff2e88' },
		{ id: 'gold', name: 'Gold Rush', stars: 11, color: '#ffd24a' },
		{ id: 'rainbow', name: 'Rainbow', stars: 18, color: 'rainbow' },
	],
};

export const DEFAULT_GEAR = Object.freeze( { head: null, face: null, back: 'backpack', trail: 'ember' } );

const mat = ( color, extra = {} ) => new THREE.MeshStandardMaterial( { color, roughness: 0.6, ...extra } );
const glowMat = ( color ) => new THREE.MeshBasicMaterial( { color, toneMapped: false } );
const mesh = ( geometry, material, [ x, y, z ] = [ 0, 0, 0 ], [ rx, ry, rz ] = [ 0, 0, 0 ], [ sx, sy, sz ] = [ 1, 1, 1 ] ) => {

	const m = new THREE.Mesh( geometry, material );
	m.position.set( x, y, z );
	m.rotation.set( rx, ry, rz );
	m.scale.set( sx, sy, sz );
	m.castShadow = true;
	return m;

};

// The pieces, each a Group laid out about its anchor in the model's frame (m), for a head `h` tall (bone to skull top).
const HEAD = {
	cap( h, r ) {

		const g = new THREE.Group(), red = mat( '#ff5a1f' ), dark = mat( '#1b1f2a' );
		g.add( mesh( new THREE.SphereGeometry( r * 1.08, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2 ), red, [ 0, - h * 0.32, 0 ], [ 0, 0, 0 ], [ 1, 0.8, 1.08 ] ) );
		g.add( mesh( new THREE.CylinderGeometry( r * 0.95, r * 0.95, 0.012, 24, 1, false, - Math.PI / 2, Math.PI ), dark, [ 0, - h * 0.3, r * 0.7 ], [ 0.12, 0, 0 ], [ 1, 1, 0.8 ] ) );
		g.add( mesh( new THREE.SphereGeometry( 0.012, 8, 6 ), dark, [ 0, - h * 0.32 + r * 0.86, 0 ] ) );
		return g;

	},
	backcap( h, r ) {

		const g = HEAD.cap( h, r );
		g.rotation.y = Math.PI;
		const outer = new THREE.Group();
		outer.add( g );
		return outer;

	},
	beanie( h, r ) {

		const g = new THREE.Group(), wool = mat( '#2f5fd8', { roughness: 0.95 } ), band = mat( '#f1ead8', { roughness: 0.95 } );
		g.add( mesh( new THREE.SphereGeometry( r * 1.1, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2 ), wool, [ 0, - h * 0.34, 0 ], [ 0, 0, 0 ], [ 1, 1.05, 1.08 ] ) );
		g.add( mesh( new THREE.TorusGeometry( r * 1.08, r * 0.14, 8, 28 ), band, [ 0, - h * 0.33, 0 ], [ Math.PI / 2, 0, 0 ], [ 1, 1.08, 1 ] ) );
		g.add( mesh( new THREE.SphereGeometry( r * 0.3, 12, 10 ), band, [ 0, - h * 0.34 + r * 1.12, 0 ] ) );
		return g;

	},
	headband( h, r ) {

		const g = new THREE.Group();
		g.add( mesh( new THREE.TorusGeometry( r * 1.04, r * 0.11, 8, 32 ), mat( '#ff2e88' ), [ 0, - h * 0.42, 0.005 ], [ Math.PI / 2 - 0.12, 0, 0 ], [ 1, 1.1, 1 ] ) );
		return g;

	},
	headphones( h, r ) {

		const g = new THREE.Group(), shell = mat( '#1b1f2a', { roughness: 0.4 } ), pad = mat( '#ff5a1f' );
		g.add( mesh( new THREE.TorusGeometry( r * 1.12, r * 0.08, 8, 24, Math.PI ), shell, [ 0, - h * 0.45, 0 ], [ 0, 0, 0 ], [ 1, 1.05, 1 ] ) );
		for ( const s of [ - 1, 1 ] ) {

			g.add( mesh( new THREE.CylinderGeometry( r * 0.42, r * 0.42, r * 0.32, 18 ), shell, [ s * r * 1.12, - h * 0.48, 0 ], [ 0, 0, Math.PI / 2 ] ) );
			g.add( mesh( new THREE.CylinderGeometry( r * 0.3, r * 0.3, r * 0.34, 18 ), pad, [ s * r * 1.14, - h * 0.48, 0 ], [ 0, 0, Math.PI / 2 ] ) );

		}

		return g;

	},
	cat( h, r ) {

		const g = new THREE.Group(), fur = mat( '#1b1f2a', { roughness: 0.9 } ), pink = mat( '#ff8ac8' );
		for ( const s of [ - 1, 1 ] ) {

			g.add( mesh( new THREE.ConeGeometry( r * 0.32, r * 0.6, 4 ), fur, [ s * r * 0.55, - h * 0.12, 0 ], [ 0, Math.PI / 4, s * - 0.25 ] ) );
			g.add( mesh( new THREE.ConeGeometry( r * 0.18, r * 0.36, 4 ), pink, [ s * r * 0.55, - h * 0.14, r * 0.06 ], [ 0, Math.PI / 4, s * - 0.25 ] ) );

		}

		return g;

	},
	crown( h, r ) {

		const g = new THREE.Group(), gold = mat( '#e8b640', { metalness: 0.9, roughness: 0.25 } );
		g.add( mesh( new THREE.CylinderGeometry( r * 0.8, r * 0.75, r * 0.32, 20, 1, true ), gold, [ 0, - h * 0.02, 0 ] ) );
		for ( let i = 0; i < 6; i ++ ) {

			const a = i / 6 * Math.PI * 2;
			g.add( mesh( new THREE.ConeGeometry( r * 0.13, r * 0.36, 6 ), gold, [ Math.sin( a ) * r * 0.78, - h * 0.02 + r * 0.32, Math.cos( a ) * r * 0.78 ] ) );

		}

		g.add( mesh( new THREE.SphereGeometry( r * 0.1, 10, 8 ), glowMat( '#ff2e88' ), [ 0, - h * 0.02, r * 0.8 ] ) );
		return g;

	},
	halo( h, r ) {

		const g = new THREE.Group();
		g.add( mesh( new THREE.TorusGeometry( r * 0.85, r * 0.07, 8, 36 ), glowMat( '#ffe58a' ), [ 0, r * 0.45, 0 ], [ Math.PI / 2 + 0.15, 0, 0 ] ) );
		return g;

	},
};

const FACE = {
	shades( h, r, f ) {

		const g = new THREE.Group(), lens = mat( '#0b0d12', { roughness: 0.1, metalness: 0.8 } ), frame = mat( '#1b1f2a' );
		for ( const s of [ - 1, 1 ] ) g.add( mesh( new THREE.SphereGeometry( r * 0.3, 14, 10 ), lens, [ s * r * 0.36, - h * 0.48, f ], [ 0, 0, 0 ], [ 1.15, 0.7, 0.3 ] ) );
		g.add( mesh( new THREE.BoxGeometry( r * 0.3, r * 0.05, r * 0.05 ), frame, [ 0, - h * 0.45, f + 0.006 ] ) );
		return g;

	},
	mask( h, r, f ) {

		const g = new THREE.Group();
		g.add( mesh( new THREE.CylinderGeometry( f + 0.004, f * 0.88, h * 0.32, 24, 1, true, - Math.PI * 0.62, Math.PI * 1.24 ), mat( '#9e1b24', { roughness: 0.95, side: THREE.DoubleSide } ), [ 0, - h * 0.72, 0 ] ) );
		return g;

	},
	visor( h, r, f ) {

		const g = new THREE.Group();
		g.add( mesh( new THREE.CylinderGeometry( f + 0.012, f + 0.012, r * 0.32, 28, 1, true, - Math.PI * 0.42, Math.PI * 0.84 ), glowMat( '#27e8ff' ), [ 0, - h * 0.47, 0 ] ) );
		g.children[ 0 ].material.side = THREE.DoubleSide;
		return g;

	},
};

// The back pieces, laid out from the back's surface behind the chest bone (z 0 there, behind is -z), in metres for the
// Y Bot's build, times `k` the runner's (broader shoulders, a bigger pack). The scarf from the neck: `neck` its joint
// to the back of the neck (m, behind is -).
const BACK = {
	backpack( k ) {

		const g = new THREE.Group(), bag = mat( '#2f6e45', { roughness: 0.85 } ), dark = mat( '#1b1f2a' );
		g.add( mesh( new THREE.BoxGeometry( 0.3 * k, 0.38 * k, 0.13 * k ), bag, [ 0, - 0.08 * k, - 0.07 * k ] ) );
		g.add( mesh( new THREE.BoxGeometry( 0.22 * k, 0.14 * k, 0.05 * k ), bag, [ 0, - 0.17 * k, - 0.155 * k ] ) );
		g.add( mesh( new THREE.TorusGeometry( 0.035 * k, 0.008 * k, 6, 12, Math.PI ), dark, [ 0, 0.11 * k, - 0.07 * k ] ) );
		for ( const s of [ - 1, 1 ] ) g.add( mesh( new THREE.BoxGeometry( 0.035 * k, 0.3 * k, 0.012 * k ), dark, [ s * 0.09 * k, 0.02 * k, - 0.003 ] ) );
		return g;

	},
	scarf( k, neck ) {

		const g = new THREE.Group(), wool = mat( '#ffc629', { roughness: 0.95 } );
		g.add( mesh( new THREE.TorusGeometry( Math.abs( neck ) + 0.012, 0.028 * k, 10, 24 ), wool, [ 0, - 0.02 * k, 0 ], [ Math.PI / 2 + 0.2, 0, 0 ] ) );
		g.add( mesh( new THREE.BoxGeometry( 0.07 * k, 0.32 * k, 0.018 * k ), wool, [ 0.035 * k, - 0.19 * k, neck - 0.03 * k ], [ 0.22, 0, 0.12 ] ) );
		return g;

	},
	jetpack( k ) {

		const g = new THREE.Group(), steel = mat( '#d9dde3', { metalness: 0.85, roughness: 0.3 } ), flame = glowMat( '#ff8a2b' );
		for ( const s of [ - 1, 1 ] ) {

			g.add( mesh( new THREE.CylinderGeometry( 0.06 * k, 0.06 * k, 0.32 * k, 16 ), steel, [ s * 0.07 * k, - 0.06 * k, - 0.07 * k ] ) );
			g.add( mesh( new THREE.ConeGeometry( 0.05 * k, 0.06 * k, 16 ), steel, [ s * 0.07 * k, 0.13 * k, - 0.07 * k ] ) );
			g.add( mesh( new THREE.ConeGeometry( 0.035 * k, 0.11 * k, 12 ), flame, [ s * 0.07 * k, - 0.28 * k, - 0.07 * k ], [ Math.PI, 0, 0 ] ) );

		}

		return g;

	},
	wings( k ) {

		const g = new THREE.Group(), feather = new THREE.MeshBasicMaterial( { color: '#ff5a1f', toneMapped: false, transparent: true, opacity: 0.85, side: THREE.DoubleSide } );
		const r = 0.05 * k, shape = new THREE.Shape();
		shape.moveTo( 0, 0 );
		shape.bezierCurveTo( r * 2, r * 3.4, r * 7, r * 3.2, r * 9, r * 1.4 );
		shape.bezierCurveTo( r * 6, r * 1.2, r * 4, - r * 0.6, r * 3.4, - r * 3 );
		shape.bezierCurveTo( r * 2, - r * 1.6, r * 0.8, - r * 1, 0, 0 );
		const geometry = new THREE.ShapeGeometry( shape, 16 );
		for ( const s of [ - 1, 1 ] ) g.add( mesh( geometry, feather, [ s * 0.02 * k, 0.01 * k, - 0.03 * k ], [ 0, s * 0.45, 0 ], [ s, 1, 1 ] ) );
		return g;

	},
};

// A bone's world matrix at the bind pose (where the gear is laid out).
function restMatrix( skinned, bone ) {

	const i = skinned.skeleton.bones.indexOf( bone );
	return i < 0 ? null : new THREE.Matrix4().copy( skinned.skeleton.boneInverses[ i ] ).invert();

}

/** The gear on a runner: `set( gear )` with { head, face, back, trail } ids; `update( dt )` each frame for the trail. */
export class Gear {

	constructor( figure, scene ) {

		this.figure = figure;
		this.scene = scene;
		this.pieces = [];
		this.trail = null;
		const model = figure.model;
		let skinned = null;
		model.traverse( ( o ) => o.isSkinnedMesh && ! skinned && ( skinned = o ) );
		this.skinned = skinned;
		this.head = model.getObjectByName( figure.roles.head );
		this.chest = model.getObjectByName( figure.roles.chest );
		this.hips = model.getObjectByName( figure.roles.hips );
		this.neck = model.getObjectByName( 'mixamorigNeck' );
		this.headRest = restMatrix( skinned, this.head );
		this.chestRest = restMatrix( skinned, this.chest );
		this.neckRest = this.neck && restMatrix( skinned, this.neck );
		this.measure( model, model.getObjectByName( 'mixamorigHeadTop_End' ) );

	}

	// The body as it stands at its bind pose (facing +z, as every fitted runner does): the top of its skull over the
	// head bone, the head's half width, the face's front, the back's surface behind the chest and the neck. Rigs put their
	// joints in different places inside a body (a Mixamo spine runs near the back, a Biped spine through the middle), so
	// the gear sits on the body's surfaces, not at offsets from its joints.
	measure( model, top ) {

		const points = [], v = new THREE.Vector3();
		model.traverse( ( o ) => {

			if ( ! o.isSkinnedMesh ) return;
			const position = o.geometry.attributes.position;
			for ( let i = 0; i < position.count; i ++ ) points.push( v.fromBufferAttribute( position, i ).applyMatrix4( o.bindMatrix ).clone() );

		} );
		const most = ( list, value, fallback ) => list.length ? Math.max( ...list.map( value ) ) : fallback;
		const least = ( list, value, fallback ) => list.length ? Math.min( ...list.map( value ) ) : fallback;
		const head = new THREE.Vector3().setFromMatrixPosition( this.headRest );
		const near = ( p, at, radius ) => Math.hypot( p.x - at.x, p.z - at.z ) < radius;
		const topRest = top && restMatrix( this.skinned, top );
		const topBone = topRest ? new THREE.Vector3().setFromMatrixPosition( topRest ) : head.clone().add( new THREE.Vector3( 0, 0.2, 0 ) );
		const crown = most( points.filter( ( p ) => p.y > head.y && near( p, head, 0.05 ) ), ( p ) => p.y, topBone.y );
		this.top = new THREE.Vector3( head.x, crown, head.z );
		this.h = Math.max( 0.12, crown - head.y );
		const ears = head.y + this.h * 0.45, eyes = crown - this.h * 0.48;
		// (At most half the head's height: a full head of hair is wider than the head a hat sits on.)
		this.r = Math.min( this.h * 0.5, most( points.filter( ( p ) => Math.abs( p.y - ears ) < 0.02 && near( p, head, 0.2 ) ), ( p ) => Math.abs( p.x - head.x ), this.h * 0.5 ) );
		this.f = most( points.filter( ( p ) => Math.abs( p.y - eyes ) < 0.02 && Math.abs( p.x - head.x ) < 0.03 && Math.abs( p.z - head.z ) < 0.2 ), ( p ) => p.z - head.z, this.r );
		const chest = new THREE.Vector3().setFromMatrixPosition( this.chestRest );
		const back = least( points.filter( ( p ) => Math.abs( p.y - chest.y ) < 0.05 && Math.abs( p.x - chest.x ) < 0.08 && p.z < chest.z + 0.05 ), ( p ) => p.z, chest.z - 0.1 );
		this.back = new THREE.Vector3( chest.x, chest.y, back );
		if ( this.neckRest ) {

			this.neckAt = new THREE.Vector3().setFromMatrixPosition( this.neckRest );
			const neck = this.neckAt;
			this.neckBack = least( points.filter( ( p ) => Math.abs( p.y - neck.y ) < 0.02 && Math.abs( p.x - neck.x ) < 0.04 && Math.abs( p.z - neck.z ) < 0.15 ), ( p ) => p.z - neck.z, - 0.06 );

		}

		// A runner's build against the Y Bot's: its shoulders (the joints of its upper arms) against the Y Bot's 0.375 m.
		const arm = ( side ) => {

			const bone = model.getObjectByName( `mixamorig${side}Arm` ), rest = bone && restMatrix( this.skinned, bone );
			return rest ? new THREE.Vector3().setFromMatrixPosition( rest ) : null;

		};
		const left = arm( 'Left' ), right = arm( 'Right' );
		this.k = left && right ? THREE.MathUtils.clamp( left.distanceTo( right ) / 0.375, 0.85, 1.2 ) : 1;

	}

	// Fixes a piece to a bone: laid out about `anchor` (bind-pose world) in the model's frame, carried into the bone's.
	attach( group, bone, rest, anchor ) {

		const layout = new THREE.Matrix4().makeTranslation( anchor.x, anchor.y, anchor.z );
		group.matrixAutoUpdate = false;
		group.matrix.copy( rest.clone().invert().multiply( layout ) );
		group.traverse( ( o ) => {

			if ( o !== group ) o.updateMatrix();
			o.userData.gear = true;

		} );
		bone.add( group );
		this.pieces.push( group );

	}

	set( gear ) {

		this.clear();
		const { h, r, f, k } = this;
		const head = HEAD[ gear.head ], face = FACE[ gear.face ], back = BACK[ gear.back ];
		if ( head ) this.attach( head( h, r ), this.head, this.headRest, this.top );
		if ( face ) this.attach( face( h, r, f ), this.head, this.headRest, this.top );
		if ( back === BACK.scarf && this.neckRest ) this.attach( back( k, this.neckBack ), this.neck, this.neckRest, this.neckAt );
		else if ( back && this.chestRest ) this.attach( back( k ), this.chest, this.chestRest, this.back );
		const trail = GEAR.trail.find( ( t ) => t.id === gear.trail );
		if ( trail?.id ) this.trail = new Trail( trail.color, this.scene );

	}

	clear() {

		for ( const piece of this.pieces ) {

			piece.removeFromParent();
			piece.traverse( ( o ) => {

				o.geometry?.dispose();
				o.material?.dispose?.();

			} );

		}

		this.pieces = [];
		this.trail?.dispose();
		this.trail = null;

	}

	/** Every frame: the trail follows the hips. */
	update( dt, visible = true ) {

		if ( ! this.trail ) return;
		this.trail.mesh.visible = visible;
		this.trail.push( this.hips.getWorldPosition( new THREE.Vector3() ), dt );

	}

	dispose() {

		this.clear();

	}

}

// The trail: a ribbon over the hips' last positions, bright at the runner and fading out (additive, so black is none).
const TRAIL_POINTS = 28, TRAIL_WIDTH = 0.16, TRAIL_EVERY = 1 / 60;

class Trail {

	constructor( color, scene ) {

		this.rainbow = color === 'rainbow';
		this.color = new THREE.Color( this.rainbow ? '#ff5a1f' : color );
		this.points = [];
		this.time = 0;
		this.since = 0;
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( new Float32Array( TRAIL_POINTS * 2 * 3 ), 3 ) );
		geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( new Float32Array( TRAIL_POINTS * 2 * 3 ), 3 ) );
		const index = [];
		for ( let i = 0; i < TRAIL_POINTS - 1; i ++ ) index.push( i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2 );
		geometry.setIndex( index );
		this.mesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false } ) );
		this.mesh.frustumCulled = false;
		this.mesh.renderOrder = 3;
		scene.add( this.mesh );

	}

	push( at, dt ) {

		this.time += dt;
		this.since += dt;
		if ( this.since >= TRAIL_EVERY || ! this.points.length ) {

			this.since = 0;
			this.points.unshift( at.clone() );
			if ( this.points.length > TRAIL_POINTS ) this.points.pop();

		} else this.points[ 0 ].copy( at );

		const pos = this.mesh.geometry.attributes.position, col = this.mesh.geometry.attributes.color;
		const n = this.points.length, side = new THREE.Vector3(), up = new THREE.Vector3( 0, 1, 0 ), c = new THREE.Color();
		for ( let i = 0; i < TRAIL_POINTS; i ++ ) {

			const p = this.points[ Math.min( i, n - 1 ) ], q = this.points[ Math.min( i + 1, n - 1 ) ];
			side.subVectors( p, q ).cross( up );
			if ( side.lengthSq() < 1e-8 ) side.set( TRAIL_WIDTH, 0, 0 );
			else side.setLength( TRAIL_WIDTH );
			// Ribbon upright across the motion, thinning and fading to nothing at its end.
			const k = 1 - i / ( TRAIL_POINTS - 1 ), w = 0.35 + 0.65 * k;
			pos.setXYZ( i * 2, p.x, p.y + TRAIL_WIDTH * w, p.z );
			pos.setXYZ( i * 2 + 1, p.x, p.y - TRAIL_WIDTH * w, p.z );
			if ( this.rainbow ) c.setHSL( ( this.time * 0.3 + i / TRAIL_POINTS ) % 1, 1, 0.55 );
			else c.copy( this.color );
			// Brighter at speed: a standing runner leaves nothing.
			const speed = i + 1 < n ? p.distanceTo( q ) / TRAIL_EVERY : 0;
			c.multiplyScalar( k * k * Math.min( 1, speed / 6 ) );
			col.setXYZ( i * 2, c.r, c.g, c.b );
			col.setXYZ( i * 2 + 1, c.r, c.g, c.b );

		}

		pos.needsUpdate = col.needsUpdate = true;

	}

	dispose() {

		this.mesh.removeFromParent();
		this.mesh.geometry.dispose();
		this.mesh.material.dispose();

	}

}
