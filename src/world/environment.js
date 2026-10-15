// A course's surroundings and light, from its theme (src/world/world.js THEMES): the painted sky (a background node:
// gradient, sun or moon disc, stars), the hemisphere and sun light, the haze, the clouds and hills on the horizon, the
// animated sea and the gulls. RUNOFF's GLSL sky and sea, rewritten in TSL for the WebGPU renderer.

import * as THREE from 'three/webgpu';
import {
	Fn, cameraPosition, clamp, dot, float, floor, fract, length, max, mix, normalize, positionWorld,
	positionWorldDirection, pow, reflect, select, sin, smoothstep, step, uniform, vec2, vec3,
} from 'three/tsl';
import { THEMES } from './world.js';
import { makeBirds, makeClouds, makeHills } from './env.js';

const color = ( hex ) => new THREE.Color( hex );

// The sky as a background: a gradient over the horizon, the sun's glow and disc, stars on a night.
function skyNode( T, sunDir ) {

	const top = uniform( color( T.skyTop ) ), mid = uniform( color( T.skyMid ) ), horizon = uniform( color( T.skyHorizon ) );
	const bottom = uniform( color( T.skyBottom ) ), sunColor = uniform( color( T.sunColor ) ), sun = uniform( sunDir.clone() );
	const sunSize = float( T.sunSize ), stars = float( T.stars ), discBoost = float( T.moon ? 1.4 : 2.2 );

	const hash = ( p ) => {

		const q = fract( p.mul( 0.3183099 ).add( 0.1 ) ).mul( 17 );
		return fract( q.x.mul( q.y ).mul( q.z ).mul( q.x.add( q.y ).add( q.z ) ) );

	};

	return Fn( () => {

		const d = normalize( positionWorldDirection );
		const h = d.y;
		const above = mix( mix( horizon, mid, smoothstep( 0, 0.18, h ) ), top, smoothstep( 0.15, 0.7, h ) );
		const below = mix( horizon, bottom, smoothstep( 0, 0.12, h.negate() ) );
		const col = select( h.greaterThan( 0 ), above, below ).toVar();
		const sd = max( dot( d, normalize( sun ) ), 0 );
		const disc = smoothstep( float( 1 ).sub( sunSize.mul( 0.02 ) ), float( 1 ).sub( sunSize.mul( 0.012 ) ), sd );
		col.addAssign( sunColor.mul( pow( sd, 8 ).mul( 0.35 ).add( pow( sd, 90 ).mul( 0.6 ) ) ) );
		col.assign( mix( col, sunColor.mul( discBoost ), disc ) );
		if ( T.stars > 0 ) {

			const cell = floor( d.mul( 280 ) );
			const s = hash( cell );
			const twinkle = float( 0.5 ).add( hash( cell.add( 3.1 ) ).mul( 0.5 ) );
			col.addAssign( vec3( step( 0.996, s ).mul( stars ).mul( smoothstep( 0.05, 0.4, h ) ).mul( twinkle ) ) );

		}

		return col;

	} )();

}

// The sea: a big plane whose colour is worked out per pixel from a sum of travelling waves (normal by finite
// differences), a fresnel sky reflection, a sun glint, and its own haze.
function makeSea( T, sunDir, y = 0, size = 4000 ) {

	const time = uniform( 0 );
	const deep = uniform( color( T.waterDeep ) ), shallow = uniform( color( T.waterShallow ) );
	const skyMid = uniform( color( T.skyMid ) ), skyHorizon = uniform( color( T.skyHorizon ) );
	const sun = uniform( sunDir.clone() ), sunColor = uniform( color( T.sunColor ) ), fog = uniform( color( T.fog ) );
	const fogNear = float( T.fogNear ), fogFar = float( T.fogFar ), glint = float( T.moon ? 1.5 : 3 );

	const height = ( p, dist ) => sin( p.x.mul( 0.35 ).add( time.mul( 1.1 ) ) ).mul( 0.5 )
		.add( sin( p.y.mul( 0.27 ).sub( time.mul( 0.9 ) ) ).mul( 0.5 ) )
		.add( sin( p.x.add( p.y ).mul( 0.8 ).add( time.mul( 1.7 ) ) ).mul( 0.25 ) )
		.add( sin( p.x.mul( 1.7 ).sub( p.y.mul( 1.3 ) ).add( time.mul( 2.3 ) ) ).mul( 0.15 ) )
		.add( sin( p.x.mul( 3.1 ).add( p.y.mul( 2.3 ) ).sub( time.mul( 3.1 ) ) ).mul( 0.07 ).mul( float( 1 ).sub( smoothstep( 20, 120, dist ) ) ) );

	const material = new THREE.MeshBasicNodeMaterial();
	material.fog = false;
	material.colorNode = Fn( () => {

		const world = positionWorld;
		const p = world.xz;
		const dist = length( world.sub( cameraPosition ) );
		const e = 0.12;
		const dx = height( p.add( vec2( e, 0 ) ), dist ).sub( height( p.sub( vec2( e, 0 ) ), dist ) ).div( 2 * e );
		const dz = height( p.add( vec2( 0, e ) ), dist ).sub( height( p.sub( vec2( 0, e ) ), dist ) ).div( 2 * e );
		const calm = float( 1 ).sub( smoothstep( 60, 420, dist ) );
		const n = normalize( vec3( dx.mul( - 0.32 ).mul( calm ), 1, dz.mul( - 0.32 ).mul( calm ) ) );
		const V = normalize( cameraPosition.sub( world ) );
		const fresnel = pow( float( 1 ).sub( max( dot( n, V ), 0 ) ), 4 );
		const R = reflect( V.negate(), n );
		const sky = mix( skyHorizon, skyMid, clamp( R.y.mul( 2.5 ), 0, 1 ) );
		const col = mix( deep, shallow, float( 0.35 ).add( height( p.mul( 0.4 ), dist ).mul( 0.25 ) ) ).toVar();
		col.assign( mix( col, sky, float( 0.2 ).add( fresnel.mul( 0.7 ) ) ) );
		col.addAssign( sunColor.mul( pow( max( dot( R, normalize( sun ) ), 0 ), 220 ).mul( glint ) ) );
		return mix( col, fog, smoothstep( fogNear, fogFar.mul( 1.6 ), dist ).mul( 0.9 ) );

	} )();

	const mesh = new THREE.Mesh( new THREE.PlaneGeometry( size, size, 1, 1 ), material );
	mesh.rotation.x = - Math.PI / 2;
	mesh.position.y = y;
	mesh.userData.update = ( t ) => {

		time.value = t;

	};

	return mesh;

}

/**
 * Lights the stage for a course's theme and adds the course's scenery.
 * @param {import( '../stage/renderer.js' ).Stage} stage
 * @param {string} theme a THEMES key
 * @param {object} [opts] the course's `env`: `water` ({ y }), `birds` ([ x, y, z ]), `hills`, `clouds`, `seed`
 * @returns {{ group: Group, update: (t: number) => void, theme: object, dispose: () => void }}
 */
export function setupEnvironment( stage, theme, opts = {} ) {

	const T = THEMES[ theme ];
	const scene = stage.scene;
	const sunDir = new THREE.Vector3( ...T.sunDir ).normalize();

	scene.backgroundNode = skyNode( T, sunDir );
	scene.fog = new THREE.Fog( color( T.fog ), T.fogNear, T.fogFar );

	stage.hemi.color.set( T.hemiSky );
	stage.hemi.groundColor.set( T.hemiGround );
	stage.hemi.intensity = T.hemiIntensity;
	stage.sun.color.set( T.sunColor );
	stage.sun.intensity = T.sunIntensity;
	stage.sun.position.copy( sunDir ).multiplyScalar( 100 );
	stage.sun.target.position.set( 0, 0, 0 );
	stage.renderer.toneMappingExposure = T.exposure;

	const group = new THREE.Group();
	const updaters = [];
	const far = new THREE.Group();
	const clouds = makeClouds( T, sunDir, opts.seed || 7, opts.clouds ?? 26 );
	far.add( clouds );
	updaters.push( ( t ) => {

		clouds.rotation.y = t * 0.002;

	} );
	if ( opts.hills !== false ) far.add( makeHills( T, ( opts.seed || 3 ) + 1, opts.hills || {} ) );
	group.add( far );
	if ( opts.water ) {

		const sea = makeSea( T, sunDir, opts.water.y ?? 0 );
		group.add( sea );
		updaters.push( sea.userData.update );

	}

	if ( opts.birds ) {

		const birds = makeBirds( new THREE.Vector3( ...opts.birds ), 9, 5, T.moon ? '#9aa4c8' : '#f4f4f4' );
		group.add( birds );
		updaters.push( birds.userData.update );

	}

	scene.add( group );

	return {
		group, far, theme: T, sunDir,
		update( t ) {

			for ( const update of updaters ) update( t );

		},
		/** Keeps the horizon scenery centred on the runner, so it stays on the horizon. */
		center( x, z ) {

			far.position.set( x, 0, z );

		},
		dispose() {

			scene.remove( group );
			group.traverse( ( object ) => {

				object.geometry?.dispose();
				for ( const material of [ object.material ].flat() ) material?.dispose?.();

			} );

		},
	};

}
