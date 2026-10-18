// The runner's gear from the Locker: something on the head, on the face, on the back, and a trail. The game measures
// each runner's body at its bind pose (the head's outline at several heights, the eyes, the ears, the shoulders, the
// back) and grows every piece to that shape, then fixes it to a bone so it moves with the takes.

import * as THREE from 'three/webgpu';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// The pieces each slot offers: all free to wear (`stars` is kept at 0 for the Locker's check).
export const GEAR = {
	head: [
		{ id: null, name: 'None', stars: 0 },
		{ id: 'cap', name: 'Cap', stars: 0 },
		{ id: 'backcap', name: 'Backwards Cap', stars: 0 },
		{ id: 'beanie', name: 'Beanie', stars: 0 },
		{ id: 'headband', name: 'Headband', stars: 0 },
		{ id: 'headphones', name: 'Headphones', stars: 0 },
		{ id: 'cat', name: 'Cat Ears', stars: 0 },
		{ id: 'crown', name: 'Crown', stars: 0 },
		{ id: 'halo', name: 'Halo', stars: 0 },
	],
	face: [
		{ id: null, name: 'None', stars: 0 },
		{ id: 'shades', name: 'Shades', stars: 0 },
		{ id: 'mask', name: 'Bandana', stars: 0 },
		{ id: 'visor', name: 'Cyber Visor', stars: 0 },
	],
	back: [
		{ id: null, name: 'None', stars: 0 },
		{ id: 'backpack', name: 'Backpack', stars: 0 },
		{ id: 'scarf', name: 'Scarf', stars: 0 },
		{ id: 'jetpack', name: 'Jetpack', stars: 0 },
		{ id: 'wings', name: 'Wings', stars: 0 },
	],
	trail: [
		{ id: null, name: 'None', stars: 0 },
		{ id: 'ember', name: 'Ember', stars: 0, color: '#ff6a2b' },
		{ id: 'volt', name: 'Volt', stars: 0, color: '#c6ff3d' },
		{ id: 'ice', name: 'Ice', stars: 0, color: '#7fe3ff' },
		{ id: 'pink', name: 'Neon Pink', stars: 0, color: '#ff2e88' },
		{ id: 'gold', name: 'Gold Rush', stars: 0, color: '#ffd24a' },
		{ id: 'rainbow', name: 'Rainbow', stars: 0, color: 'rainbow' },
	],
};

export const DEFAULT_GEAR = Object.freeze( { head: null, face: null, back: 'backpack', trail: 'ember' } );

// ---- Materials and textures

const mat = ( color, extra = {} ) => new THREE.MeshStandardMaterial( { color, roughness: 0.75, ...extra } );
const glowMat = ( color, extra = {} ) => new THREE.MeshBasicMaterial( { color, toneMapped: false, ...extra } );

// A small canvas texture, drawn once and repeated.
function canvasTexture( size, draw, repeat = [ 1, 1 ] ) {

	if ( typeof document === 'undefined' ) return null;
	const canvas = document.createElement( 'canvas' );
	canvas.width = canvas.height = size;
	draw( canvas.getContext( '2d' ), size );
	const texture = new THREE.CanvasTexture( canvas );
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set( ...repeat );
	texture.colorSpace = THREE.SRGBColorSpace;
	return texture;

}

// Knitting: ribs down the wool.
const knit = ( color, ribs = 24 ) => canvasTexture( 64, ( c, s ) => {

	c.fillStyle = color;
	c.fillRect( 0, 0, s, s );
	for ( let x = 0; x < s; x += 4 ) {

		c.fillStyle = 'rgba(0,0,0,0.18)';
		c.fillRect( x, 0, 1, s );
		c.fillStyle = 'rgba(255,255,255,0.08)';
		c.fillRect( x + 2, 0, 1, s );

	}

}, [ ribs / 16, 1 ] );

// A bandana: dots and a border on red.
const bandana = () => canvasTexture( 64, ( c, s ) => {

	c.fillStyle = '#a3202a';
	c.fillRect( 0, 0, s, s );
	c.fillStyle = 'rgba(255,255,255,0.85)';
	for ( let y = 4; y < s; y += 12 ) for ( let x = ( y / 12 % 2 ) * 6 + 3; x < s; x += 12 ) {

		c.beginPath();
		c.arc( x, y, 1.6, 0, Math.PI * 2 );
		c.fill();

	}

}, [ 6, 2 ] );

const meshOf = ( geometry, material, cast = true ) => {

	const m = new THREE.Mesh( geometry, material );
	m.castShadow = cast;
	return m;

};

const tube = ( points, radius, closed = false, segments = 48 ) => new THREE.TubeGeometry( new THREE.CatmullRomCurve3( points, closed, 'centripetal' ), segments, radius, 8, closed );

// ---- The body, measured at its bind pose

// The head's outline at a height: the furthest skin (or hair) from the head's axis in each of BINS directions round it,
// with spikes (a bun of hair, the nose) pulled in toward the rest so a hat goes round the head, not round its buns.
const BINS = 48;

class Body {

	constructor( points, center ) {

		this.points = points;
		this.center = center;
		this.cache = new Map();

	}

	/** Radii (m) round the axis at height y, BINS of them from the front (+z) toward the left (+x). */
	outline( y, { center = this.center, band = 0.008, reach = 0.17 } = {} ) {

		const key = `${y.toFixed( 4 )}:${center.x.toFixed( 3 )}:${center.z.toFixed( 3 )}:${reach}`;
		if ( this.cache.has( key ) ) return this.cache.get( key );
		const r = new Float64Array( BINS );
		for ( const p of this.points ) {

			if ( Math.abs( p.y - y ) > band ) continue;
			const dx = p.x - center.x, dz = p.z - center.z, d = Math.hypot( dx, dz );
			if ( d > reach ) continue;
			const i = ( ( Math.round( Math.atan2( dx, dz ) / ( Math.PI * 2 ) * BINS ) % BINS ) + BINS ) % BINS;
			if ( d > r[ i ] ) r[ i ] = d;

		}

		// Gaps from their neighbours; spikes in to the median; smoothed.
		for ( let pass = 0; pass < BINS; pass ++ ) for ( let i = 0; i < BINS; i ++ ) if ( ! r[ i ] ) r[ i ] = Math.max( r[ ( i + 1 ) % BINS ], r[ ( i + BINS - 1 ) % BINS ] );
		const median = [ ...r ].sort( ( a, b ) => a - b )[ BINS >> 1 ] || 0.08;
		for ( let i = 0; i < BINS; i ++ ) r[ i ] = THREE.MathUtils.clamp( r[ i ], median * 0.8, median * 1.12 );
		for ( let pass = 0; pass < 2; pass ++ ) {

			const s = Float64Array.from( r );
			for ( let i = 0; i < BINS; i ++ ) r[ i ] = ( s[ ( i + BINS - 1 ) % BINS ] + 2 * s[ i ] + s[ ( i + 1 ) % BINS ] ) / 4;

		}

		this.cache.set( key, r );
		return r;

	}

	/** The radius at an angle (0 the front, + toward the left), between the bins either side. */
	radius( y, angle, options ) {

		const r = this.outline( y, options ), f = ( ( angle / ( Math.PI * 2 ) * BINS ) % BINS + BINS ) % BINS;
		const i = Math.floor( f ), k = f - i;
		return r[ i % BINS ] * ( 1 - k ) + r[ ( i + 1 ) % BINS ] * k;

	}

	/** The point on the outline at a height and an angle, `pad` out from the skin. */
	at( y, angle, pad = 0, options = {} ) {

		const c = options.center ?? this.center, d = this.radius( y, angle, options ) + pad;
		return new THREE.Vector3( c.x + Math.sin( angle ) * d, y, c.z + Math.cos( angle ) * d );

	}

	/** The highest point of the body near a place (x, z) within `reach`, or the lowest, the furthest forward, back. */
	most( filter, value, fallback ) {

		let best = - Infinity;
		for ( const p of this.points ) if ( filter( p ) ) best = Math.max( best, value( p ) );
		return best === - Infinity ? fallback : best;

	}

}

// A surface over the head: rings of its outline at the heights given (bottom up, each `pad` out from the skin), between
// two angles (the whole way round by default), closed at the top over the axis at `top` if given.
function shell( body, levels, { top = null, a0 = - Math.PI, a1 = Math.PI, segments = 48 } = {} ) {

	const full = Math.abs( a1 - a0 - Math.PI * 2 ) < 1e-6, columns = full ? segments : segments + 1;
	const position = [], uv = [], index = [];
	levels.forEach( ( { y, pad }, j ) => {

		for ( let k = 0; k < columns; k ++ ) {

			const a = a0 + ( a1 - a0 ) * k / segments, p = body.at( y, a, pad );
			position.push( p.x, p.y, p.z );
			uv.push( k / segments, j / Math.max( 1, levels.length - 1 ) );

		}

	} );
	for ( let j = 0; j < levels.length - 1; j ++ ) for ( let k = 0; k < segments; k ++ ) {

		const a = j * columns + k, b = j * columns + ( k + 1 ) % columns, c = a + columns, d = b + columns;
		index.push( a, b, c, b, d, c );

	}

	if ( top ) {

		const apex = position.length / 3, last = ( levels.length - 1 ) * columns;
		position.push( body.center.x, top, body.center.z );
		uv.push( 0.5, 1 );
		for ( let k = 0; k < segments; k ++ ) index.push( last + k, last + ( k + 1 ) % columns, apex );

	}

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( position, 3 ) );
	geometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( uv, 2 ) );
	geometry.setIndex( index );
	geometry.computeVertexNormals();
	return geometry;

}

// Heights from a to b, n of them, each with its pad.
const between = ( a, b, n, pad ) => Array.from( { length: n }, ( _, i ) => ( { y: a + ( b - a ) * i / ( n - 1 ), pad: typeof pad === 'function' ? pad( i / ( n - 1 ) ) : pad } ) );

// The ring round the outline at a height, as points (for a tube).
const ring = ( body, y, pad, n = 40, a0 = - Math.PI, a1 = Math.PI ) => Array.from( { length: n }, ( _, i ) => body.at( y, a0 + ( a1 - a0 ) * i / ( a1 - a0 >= Math.PI * 2 - 1e-6 ? n : n - 1 ), pad ) );

// A brim: a curved plate out from the outline at a height, round the angle `at` (± `half`), `width` at its middle.
function brim( body, y, at, half, width, pad ) {

	const n = 28, position = [], index = [], front = new THREE.Vector3( Math.sin( at ), 0, Math.cos( at ) );
	for ( let k = 0; k <= n; k ++ ) {

		const a = at - half + 2 * half * k / n, t = ( a - at ) / half;
		const inner = body.at( y, a, pad );
		const radial = new THREE.Vector3( Math.sin( a ), 0, Math.cos( a ) );
		const out = radial.lerp( front, 0.55 ).normalize();
		const w = width * Math.pow( Math.max( 0, Math.cos( t * Math.PI / 2 ) ), 0.55 );
		const outer = inner.clone().addScaledVector( out, w ).add( new THREE.Vector3( 0, - w * 0.22, 0 ) );
		position.push( ...inner.toArray(), ...outer.toArray() );

	}

	for ( let k = 0; k < n; k ++ ) index.push( k * 2, k * 2 + 1, k * 2 + 2, k * 2 + 1, k * 2 + 3, k * 2 + 2 );
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( position, 3 ) );
	geometry.setIndex( index );
	geometry.computeVertexNormals();
	const edge = Array.from( { length: n + 1 }, ( _, k ) => new THREE.Vector3( position[ k * 6 + 3 ], position[ k * 6 + 4 ], position[ k * 6 + 5 ] ) );
	return { geometry, edge };

}

// ---- The pieces. Each is built in the runner's bind pose (metres, facing +z, its left +x), from what was measured of
// it (`m`: the head's outline, crown, brow, eyes and ears; the back, the shoulders, the chest's front, the neck).

const HEAD = {
	cap( m, { back = false } = {} ) {

		const g = new THREE.Group(), cloth = mat( '#ff5a1f', { roughness: 0.85, side: THREE.DoubleSide } ), dark = mat( '#1b1f2a', { roughness: 0.6, side: THREE.DoubleSide } );
		const base = m.brow, crown = m.crown;
		g.add( meshOf( shell( m.body, between( base, crown - 0.012, 8, ( t ) => 0.007 + 0.004 * ( 1 - t ) ), { top: crown + 0.008 } ), cloth ) );
		g.add( meshOf( tube( ring( m.body, base, 0.009 ), 0.0045, true, 64 ), dark ) );
		const { geometry, edge } = brim( m.body, base + 0.003, back ? Math.PI : 0, Math.PI * 0.42, 0.072, 0.009 );
		g.add( meshOf( geometry, dark ) );
		g.add( meshOf( tube( edge, 0.003 ), dark ) );
		g.add( meshOf( new THREE.SphereGeometry( 0.008, 10, 8 ), dark ) ).position.set( m.body.center.x, crown + 0.012, m.body.center.z );
		return g;

	},
	backcap( m ) {

		return HEAD.cap( m, { back: true } );

	},
	beanie( m ) {

		const g = new THREE.Group(), wool = mat( '#2f5fd8', { roughness: 0.95, map: knit( '#2f5fd8' ), side: THREE.DoubleSide } );
		const cuffWool = mat( '#f1ead8', { roughness: 0.95, map: knit( '#f1ead8' ), side: THREE.DoubleSide } );
		const base = m.brow + 0.014, crown = m.crown;
		g.add( meshOf( shell( m.body, between( base, crown - 0.01, 9, ( t ) => 0.012 + 0.01 * t * t ), { top: crown + 0.035 } ), wool ) );
		g.add( meshOf( shell( m.body, between( base - 0.004, base + 0.036, 3, 0.02 ) ), cuffWool ) );
		g.add( meshOf( tube( ring( m.body, base - 0.004, 0.02 ), 0.006, true, 64 ), cuffWool ) );
		g.add( meshOf( new THREE.SphereGeometry( 0.032, 16, 12 ), cuffWool ) ).position.set( m.body.center.x, crown + 0.06, m.body.center.z );
		return g;

	},
	headband( m ) {

		const g = new THREE.Group(), cloth = mat( '#ff2e88', { roughness: 0.9, side: THREE.DoubleSide } );
		const y0 = m.brow + 0.004, y1 = m.brow + 0.034;
		g.add( meshOf( shell( m.body, between( y0, y1, 3, 0.006 ) ), cloth ) );
		for ( const y of [ y0, y1 ] ) g.add( meshOf( tube( ring( m.body, y, 0.006 ), 0.003, true, 64 ), cloth ) );
		return g;

	},
	headphones( m ) {

		const g = new THREE.Group(), shell_ = mat( '#1b1f2a', { roughness: 0.35, metalness: 0.2 } ), pad = mat( '#ff5a1f', { roughness: 0.9 } );
		const y = m.ears, c = m.body.center;
		const cups = [ 1, - 1 ].map( ( s ) => m.body.at( y, s * Math.PI / 2, 0.006 ) );
		cups.forEach( ( p, i ) => {

			const s = i === 0 ? 1 : - 1;
			const cup = meshOf( new THREE.CylinderGeometry( 0.042, 0.04, 0.03, 24 ), shell_ );
			cup.rotation.z = Math.PI / 2;
			cup.position.set( p.x + s * 0.017, p.y, p.z );
			g.add( cup );
			const cushion = meshOf( new THREE.CylinderGeometry( 0.036, 0.036, 0.012, 24 ), pad );
			cushion.rotation.z = Math.PI / 2;
			cushion.position.set( p.x + s * 0.002, p.y, p.z );
			g.add( cushion );

		} );
		// The band: up each side from the cups' tops, over the crown.
		const side = ( s ) => between( y + 0.035, m.crown - 0.025, 5, 0.012 ).map( ( { y: yy } ) => m.body.at( yy, s * Math.PI / 2, 0.012 ) );
		const path = [ ...side( 1 ), new THREE.Vector3( c.x, m.crown + 0.014, c.z ), ...side( - 1 ).reverse() ];
		g.add( meshOf( tube( path, 0.009, false, 64 ), shell_ ) );
		return g;

	},
	cat( m ) {

		const g = new THREE.Group(), fur = mat( '#1b1f2a', { roughness: 0.9 } ), pink = mat( '#ff8ac8', { roughness: 0.8 } );
		for ( const s of [ - 1, 1 ] ) {

			const a = s * Math.PI * 0.27, y = m.crown - 0.03, p = m.body.at( y, a, - 0.004 );
			const out = new THREE.Vector3( Math.sin( a ) * 0.45, 1, Math.cos( a ) * 0.25 ).normalize();
			const ear = meshOf( new THREE.ConeGeometry( 0.032, 0.06, 4 ), fur );
			ear.position.copy( p ).addScaledVector( out, 0.026 );
			ear.quaternion.setFromUnitVectors( new THREE.Vector3( 0, 1, 0 ), out );
			ear.rotateY( Math.PI / 4 );
			g.add( ear );
			const inner = meshOf( new THREE.ConeGeometry( 0.018, 0.036, 4 ), pink );
			inner.position.copy( ear.position ).add( new THREE.Vector3( Math.sin( a ) * 0.004, - 0.004, Math.cos( a ) * 0.004 + 0.008 ) );
			inner.quaternion.copy( ear.quaternion );
			g.add( inner );

		}

		return g;

	},
	crown( m ) {

		const g = new THREE.Group(), gold = mat( '#e8b640', { metalness: 0.9, roughness: 0.25, side: THREE.DoubleSide } ), gem = glowMat( '#ff2e88' );
		const y0 = m.crown - 0.05, y1 = m.crown - 0.016;
		g.add( meshOf( shell( m.body, between( y0, y1, 3, 0.008 ) ), gold ) );
		g.add( meshOf( tube( ring( m.body, y0, 0.009 ), 0.004, true, 64 ), gold ) );
		for ( let i = 0; i < 8; i ++ ) {

			const a = i / 8 * Math.PI * 2, p = m.body.at( y1, a, 0.008 );
			const spike = meshOf( new THREE.ConeGeometry( 0.011, 0.034, 6 ), gold );
			spike.position.set( p.x, p.y + 0.016, p.z );
			g.add( spike );
			const stone = meshOf( new THREE.SphereGeometry( 0.0065, 8, 6 ), i % 2 ? gold : gem );
			const q = m.body.at( ( y0 + y1 ) / 2, a, 0.012 );
			stone.position.copy( q );
			g.add( stone );

		}

		return g;

	},
	halo( m ) {

		const g = new THREE.Group(), c = m.body.center;
		const radius = m.body.radius( m.crown - 0.04, 0 ) * 0.95;
		const halo = meshOf( new THREE.TorusGeometry( radius, 0.009, 10, 48 ), glowMat( '#ffe58a' ), false );
		halo.rotation.x = Math.PI / 2;
		halo.position.set( c.x, m.crown + 0.07, c.z - 0.01 );
		g.add( halo );
		return g;

	},
};

const FACE = {
	shades( m ) {

		const g = new THREE.Group(), frame = mat( '#15171c', { roughness: 0.35, metalness: 0.4 } );
		const lens = new THREE.MeshStandardMaterial( { color: '#0b0d12', roughness: 0.08, metalness: 0.9, transparent: true, opacity: 0.92, side: THREE.DoubleSide } );
		const w = 0.05 * m.s, h = 0.034 * m.s, rr = 0.012 * m.s;
		const outline = new THREE.Shape();
		outline.moveTo( - w / 2 + rr, - h / 2 );
		outline.lineTo( w / 2 - rr, - h / 2 );
		outline.quadraticCurveTo( w / 2, - h / 2, w / 2, - h / 2 + rr );
		outline.lineTo( w / 2, h / 2 - rr * 0.4 );
		outline.quadraticCurveTo( w / 2, h / 2, w / 2 - rr * 0.4, h / 2 );
		outline.lineTo( - w / 2 + rr * 0.4, h / 2 );
		outline.quadraticCurveTo( - w / 2, h / 2, - w / 2, h / 2 - rr * 0.4 );
		outline.lineTo( - w / 2, - h / 2 + rr );
		outline.quadraticCurveTo( - w / 2, - h / 2, - w / 2 + rr, - h / 2 );
		const rim = outline.getPoints( 12 ).map( ( p ) => new THREE.Vector3( p.x, p.y, 0 ) );
		const inner = [];
		for ( const eye of m.eyes ) {

			const s = Math.sign( eye.x - m.body.center.x ) || 1;
			const lensGroup = new THREE.Group();
			lensGroup.add( meshOf( new THREE.ShapeGeometry( outline, 6 ), lens, false ) );
			lensGroup.add( meshOf( tube( rim, 0.0022, true, 48 ), frame ) );
			lensGroup.position.set( eye.x + s * 0.004, eye.y + 0.002, eye.front + 0.014 );
			lensGroup.rotation.y = s * 0.16;
			g.add( lensGroup );
			lensGroup.updateMatrix();
			inner.push( new THREE.Vector3( - s * w / 2, h * 0.25, 0 ).applyMatrix4( lensGroup.matrix ) );
			// The arm: from the lens's outer edge back along the side of the head to the ear, and down behind it.
			const edge = new THREE.Vector3( s * w / 2, h * 0.25, 0 ).applyMatrix4( lensGroup.matrix );
			const y = eye.y + 0.006;
			const arm = [ edge, m.body.at( y, s * Math.PI * 0.36, 0.005 ), m.body.at( y, s * Math.PI * 0.5, 0.006 ), m.body.at( y - 0.004, s * Math.PI * 0.6, 0.006 ), m.body.at( y - 0.02, s * Math.PI * 0.66, 0.004 ) ];
			g.add( meshOf( tube( arm, 0.0022, false, 32 ), frame ) );

		}

		// The bridge over the nose.
		if ( inner.length === 2 ) {

			const mid = inner[ 0 ].clone().add( inner[ 1 ] ).multiplyScalar( 0.5 );
			mid.y += 0.004;
			mid.z = Math.max( mid.z, m.noseBridge + 0.006 );
			g.add( meshOf( tube( [ inner[ 0 ], mid, inner[ 1 ] ], 0.0022, false, 12 ), frame ) );

		}

		return g;

	},
	mask( m ) {

		const g = new THREE.Group(), cloth = mat( '#a3202a', { roughness: 0.95, map: bandana(), side: THREE.DoubleSide } );
		const top = m.eyes[ 0 ].y - 0.03, bottom = top - 0.095;
		g.add( meshOf( shell( m.body, between( bottom, top, 6, ( t ) => 0.006 + 0.01 * ( 1 - t ) ), { a0: - Math.PI * 0.68, a1: Math.PI * 0.68, segments: 40 } ), cloth ) );
		// The point hanging under the chin, and the knot at the back.
		const left = m.body.at( bottom, Math.PI * 0.3, 0.016 ), right = m.body.at( bottom, - Math.PI * 0.3, 0.016 ), tip = m.body.at( bottom - 0.05, 0, 0.03 );
		const flap = new THREE.BufferGeometry().setFromPoints( [ left, right, tip ] );
		flap.computeVertexNormals();
		g.add( meshOf( flap, cloth ) );
		g.add( meshOf( new THREE.SphereGeometry( 0.016, 10, 8 ), cloth ) ).position.copy( m.body.at( top - 0.02, Math.PI, 0.008 ) );
		return g;

	},
	visor( m ) {

		const g = new THREE.Group(), glass = glowMat( '#27e8ff', { transparent: true, opacity: 0.78, side: THREE.DoubleSide } ), frame = mat( '#1b1f2a', { roughness: 0.4, metalness: 0.5 } );
		const y = m.eyes[ 0 ].y, clear = Math.max( 0.016, m.eyeFront - m.body.radius( y, 0 ) + 0.016 );
		g.add( meshOf( shell( m.body, between( y - 0.02, y + 0.022, 3, clear ), { a0: - Math.PI * 0.55, a1: Math.PI * 0.55, segments: 40 } ), glass, false ) );
		for ( const yy of [ y - 0.02, y + 0.022 ] ) g.add( meshOf( tube( ring( m.body, yy, clear, 24, - Math.PI * 0.55, Math.PI * 0.55 ), 0.0028, false, 40 ), frame ) );
		// The strap round the back.
		g.add( meshOf( tube( ring( m.body, y + 0.006, 0.006, 24, Math.PI * 0.55, Math.PI * 1.45 ), 0.006, false, 40 ), frame ) );
		return g;

	},
};

// The back pieces. The pack, the jetpack and the wings sit on the back's surface behind the chest (`m.back`), the scarf
// round the neck; all scale with the runner's build (`m.k`, its shoulders against the Y Bot's).
const BACK = {
	backpack( m ) {

		const g = new THREE.Group(), k = m.k, bag = mat( '#2f6e45', { roughness: 0.85 } ), dark = mat( '#1b1f2a', { roughness: 0.6 } );
		const b = m.back, top = b.y + 0.12 * k, bottom = b.y - 0.27 * k;
		const pack = meshOf( new RoundedBoxGeometry( 0.29 * k, top - bottom, 0.13 * k, 4, 0.035 * k ), bag );
		pack.position.set( b.x, ( top + bottom ) / 2, b.z - 0.068 * k );
		g.add( pack );
		const pocket = meshOf( new RoundedBoxGeometry( 0.21 * k, 0.14 * k, 0.05 * k, 3, 0.018 * k ), bag );
		pocket.position.set( b.x, bottom + 0.1 * k, b.z - 0.15 * k );
		g.add( pocket );
		g.add( meshOf( tube( [ new THREE.Vector3( b.x - 0.035, top + 0.01, b.z - 0.07 * k ), new THREE.Vector3( b.x, top + 0.035, b.z - 0.07 * k ), new THREE.Vector3( b.x + 0.035, top + 0.01, b.z - 0.07 * k ) ], 0.006, false, 12 ), dark ) );
		// The straps: from the top of the pack over each shoulder, down the chest and back under the arm.
		for ( const s of [ 1, - 1 ] ) {

			const shoulder = m.shoulders[ s > 0 ? 0 : 1 ];
			const path = [
				new THREE.Vector3( b.x + s * 0.075 * k, top - 0.03, b.z - 0.012 ),
				new THREE.Vector3( shoulder.x * 0.8 + b.x * 0.2, shoulder.y + 0.012, ( shoulder.z + b.z ) / 2 ),
				new THREE.Vector3( shoulder.x * 0.75 + b.x * 0.25, shoulder.y - 0.02, shoulder.z + 0.05 ),
				new THREE.Vector3( b.x + s * 0.1 * k, b.y - 0.03, m.chestFront + 0.008 ),
				new THREE.Vector3( b.x + s * 0.13 * k, b.y - 0.13 * k, m.chestFront - 0.02 ),
				new THREE.Vector3( b.x + s * 0.145 * k, bottom + 0.05 * k, b.z - 0.03 ),
			];
			const strap = meshOf( tube( path, 0.0075, false, 48 ), dark );
			g.add( strap );

		}

		return g;

	},
	scarf( m ) {

		const g = new THREE.Group(), wool = mat( '#ffc629', { roughness: 0.95, map: knit( '#ffc629', 12 ) } );
		const n = m.neck, options = { center: n, reach: 0.11 };
		const loop = ( y, pad ) => Array.from( { length: 36 }, ( _, i ) => m.body.at( y, i / 36 * Math.PI * 2, pad, options ) );
		g.add( meshOf( tube( loop( n.y + 0.005, 0.02 ), 0.022, true, 64 ), wool ) );
		g.add( meshOf( tube( loop( n.y - 0.03, 0.026 ), 0.021, true, 64 ), wool ) );
		// The tails down the chest.
		const front = m.body.at( n.y - 0.03, 0.25, 0.03, options );
		for ( const [ dx, len ] of [ [ 0.0, 0.3 ], [ 0.035, 0.24 ] ] ) {

			const path = [ front.clone().add( new THREE.Vector3( dx, 0, 0 ) ), new THREE.Vector3( front.x + dx + 0.01, front.y - len * 0.45, m.chestFront + 0.03 ), new THREE.Vector3( front.x + dx + 0.015, front.y - len, m.chestFront + 0.035 ) ];
			const tail = meshOf( tube( path, 0.018, false, 16 ), wool );
			tail.scale.set( 1, 1, 0.45 );
			tail.position.z = path[ 0 ].z * 0.55;
			g.add( tail );

		}

		return g;

	},
	jetpack( m ) {

		const g = new THREE.Group(), k = m.k, b = m.back;
		const steel = mat( '#d9dde3', { metalness: 0.85, roughness: 0.3 } ), dark = mat( '#1b1f2a', { roughness: 0.5 } ), flame = glowMat( '#ff8a2b' );
		const frame = meshOf( new RoundedBoxGeometry( 0.2 * k, 0.3 * k, 0.04 * k, 3, 0.012 * k ), dark );
		frame.position.set( b.x, b.y - 0.06 * k, b.z - 0.02 * k );
		g.add( frame );
		for ( const s of [ - 1, 1 ] ) {

			const x = b.x + s * 0.075 * k, z = b.z - 0.085 * k;
			g.add( meshOf( new THREE.CylinderGeometry( 0.058 * k, 0.058 * k, 0.32 * k, 20 ), steel ) ).position.set( x, b.y - 0.06 * k, z );
			g.add( meshOf( new THREE.SphereGeometry( 0.058 * k, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2 ), steel ) ).position.set( x, b.y + 0.1 * k, z );
			g.add( meshOf( new THREE.CylinderGeometry( 0.032 * k, 0.045 * k, 0.05 * k, 16 ), dark ) ).position.set( x, b.y - 0.245 * k, z );
			const fire = meshOf( new THREE.ConeGeometry( 0.03 * k, 0.12 * k, 12 ), flame, false );
			fire.rotation.x = Math.PI;
			fire.position.set( x, b.y - 0.33 * k, z );
			g.add( fire );

		}

		return g;

	},
	wings( m ) {

		const g = new THREE.Group(), k = m.k, b = m.back;
		const feather = new THREE.MeshBasicMaterial( { color: '#ff5a1f', toneMapped: false, transparent: true, opacity: 0.85, side: THREE.DoubleSide } );
		const r = 0.05 * k, shape = new THREE.Shape();
		shape.moveTo( 0, 0 );
		shape.bezierCurveTo( r * 2, r * 3.4, r * 7, r * 3.2, r * 9, r * 1.4 );
		shape.bezierCurveTo( r * 6, r * 1.2, r * 4, - r * 0.6, r * 3.4, - r * 3 );
		shape.bezierCurveTo( r * 2, - r * 1.6, r * 0.8, - r * 1, 0, 0 );
		const geometry = new THREE.ShapeGeometry( shape, 16 );
		for ( const s of [ - 1, 1 ] ) {

			const wing = meshOf( geometry, feather, false );
			wing.position.set( b.x + s * 0.02 * k, b.y + 0.01 * k, b.z - 0.03 * k );
			wing.rotation.y = s * 0.45;
			wing.scale.set( s, 1, 1 );
			g.add( wing );

		}

		return g;

	},
};

// A bone's world matrix at the bind pose (where the gear is laid out).
function restMatrix( skinned, bone ) {

	const i = skinned.skeleton.bones.indexOf( bone );
	return i < 0 ? null : new THREE.Matrix4().copy( skinned.skeleton.boneInverses[ i ] ).invert();

}

const restPosition = ( skinned, bone ) => {

	const m = bone && restMatrix( skinned, bone );
	return m ? new THREE.Vector3().setFromMatrixPosition( m ) : null;

};

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
		this.measure( model );

	}

	// The runner as it stands at its bind pose (facing +z, as every fitted runner does): the head's outline, the top of
	// its skull, its brow, eyes and ears; the back behind the chest, the shoulders' tops, the chest's front and the neck.
	// Rigs put their joints in different places inside a body, so the gear is built on the body's surfaces.
	measure( model ) {

		const points = [], v = new THREE.Vector3();
		model.traverse( ( o ) => {

			if ( ! o.isSkinnedMesh ) return;
			const position = o.geometry.attributes.position;
			for ( let i = 0; i < position.count; i ++ ) points.push( v.fromBufferAttribute( position, i ).applyMatrix4( o.bindMatrix ).clone() );

		} );
		const s = this.skinned, head = restPosition( s, this.head );
		const near = ( p, x, z, r ) => Math.hypot( p.x - x, p.z - z ) < r;

		// The head's axis: over its bone, half way between the face and the back of the skull at the bone.
		const front = points.filter( ( p ) => Math.abs( p.y - head.y ) < 0.015 && Math.abs( p.x - head.x ) < 0.03 && near( p, head.x, head.z, 0.16 ) );
		const z0 = front.length ? Math.min( ...front.map( ( p ) => p.z ) ) : head.z - 0.09, z1 = front.length ? Math.max( ...front.map( ( p ) => p.z ) ) : head.z + 0.09;
		const center = new THREE.Vector3( head.x, head.y, ( z0 + z1 ) / 2 );
		const body = new Body( points.filter( ( p ) => p.y > head.y - 0.2 && near( p, center.x, center.z, 0.3 ) || p.y <= head.y - 0.2 ), center );
		const crown = body.most( ( p ) => p.y > head.y && near( p, center.x, center.z, 0.05 ), ( p ) => p.y, head.y + 0.18 );
		const h = Math.max( 0.12, crown - head.y );

		// The eyes: the rig's eye bones where it has them (Mixamo's LeftEye, a Biped's LEye), else about half way down.
		const eyeBones = [];
		model.traverse( ( o ) => o.isBone && /(LeftEye|RightEye|LEye|REye)$/.test( o.name ) && eyeBones.push( o ) );
		let eyes = eyeBones.map( ( b ) => restPosition( s, b ) ).filter( Boolean );
		const eyeY = eyes.length ? eyes.reduce( ( y, e ) => y + e.y, 0 ) / eyes.length : crown - h * 0.48;
		const halfWidth = body.radius( eyeY, Math.PI / 2 );
		if ( eyes.length !== 2 ) eyes = [ 1, - 1 ].map( ( sd ) => new THREE.Vector3( center.x + sd * halfWidth * 0.42, eyeY, center.z ) );
		// Each eye's front: the skin just in front of it (the lens sits that far out and a little more).
		for ( const e of eyes ) e.front = body.most( ( p ) => Math.abs( p.x - e.x ) < 0.012 && Math.abs( p.y - e.y ) < 0.012 && p.z > center.z, ( p ) => p.z, center.z + 0.08 );
		const noseBridge = body.most( ( p ) => Math.abs( p.x - center.x ) < 0.008 && Math.abs( p.y - eyeY ) < 0.01 && p.z > center.z, ( p ) => p.z, eyes[ 0 ].front );

		// The back: its surface behind the chest bone; the chest's front; the shoulders' tops; the neck.
		const chest = restPosition( s, this.chest );
		const backZ = body.most( ( p ) => Math.abs( p.y - chest.y ) < 0.05 && Math.abs( p.x - chest.x ) < 0.08 && p.z < chest.z + 0.05, ( p ) => - p.z, - ( chest.z - 0.1 ) );
		const chestFront = body.most( ( p ) => Math.abs( p.y - ( chest.y - 0.04 ) ) < 0.03 && Math.abs( Math.abs( p.x - chest.x ) - 0.09 ) < 0.02, ( p ) => p.z, chest.z + 0.1 );
		const shoulders = [ 'Left', 'Right' ].map( ( side ) => {

			const arm = restPosition( s, this.figure.model.getObjectByName( `mixamorig${side}Arm` ) ) ?? chest.clone().add( new THREE.Vector3( side === 'Left' ? 0.17 : - 0.17, 0.1, 0 ) );
			const x = arm.x * 0.75 + chest.x * 0.25;
			const y = body.most( ( p ) => Math.abs( p.x - x ) < 0.025 && Math.abs( p.z - arm.z ) < 0.06 && p.y < crown - h, ( p ) => p.y, arm.y + 0.05 );
			return new THREE.Vector3( x, y, arm.z );

		} );
		const neck = ( this.neckRest ? restPosition( s, this.neck ) : chest.clone().add( new THREE.Vector3( 0, 0.15, 0 ) ) );
		const k = THREE.MathUtils.clamp( shoulders[ 0 ].distanceTo( shoulders[ 1 ] ) / 0.3, 0.85, 1.2 );

		this.m = {
			body, crown, h, eyes, eyeFront: Math.max( ...eyes.map( ( e ) => e.front ) ), noseBridge,
			brow: eyeY + 0.03, ears: eyeY - 0.012, s: THREE.MathUtils.clamp( halfWidth / 0.075, 0.85, 1.2 ),
			back: new THREE.Vector3( chest.x, chest.y, - backZ ), chestFront, shoulders, neck, k,
		};

	}

	// Fixes a piece, built in the bind pose's world, to a bone: carried into the bone's frame, so it moves with it.
	attach( group, bone, rest ) {

		group.matrixAutoUpdate = false;
		group.matrix.copy( rest.clone().invert() );
		group.traverse( ( o ) => {

			if ( o !== group ) o.updateMatrix();
			o.userData.gear = true;

		} );
		bone.add( group );
		this.pieces.push( group );

	}

	set( gear ) {

		this.clear();
		const m = this.m;
		const head = HEAD[ gear.head ], face = FACE[ gear.face ], back = BACK[ gear.back ];
		if ( head ) this.attach( head( m ), this.head, this.headRest );
		if ( face ) this.attach( face( m ), this.head, this.headRest );
		if ( back === BACK.scarf && this.neckRest ) this.attach( back( m ), this.neck, this.neckRest );
		else if ( back && this.chestRest ) this.attach( back( m ), this.chest, this.chestRest );
		const trail = GEAR.trail.find( ( t ) => t.id === gear.trail );
		if ( trail?.id ) this.trail = new Trail( trail.color, this.scene );

	}

	clear() {

		for ( const piece of this.pieces ) {

			piece.removeFromParent();
			piece.traverse( ( o ) => {

				o.geometry?.dispose();
				o.material?.map?.dispose();
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
