// Runner Vision (Mirror's Edge's): the world fades to a lit off-white and what the runner can use glows red, so the
// line reads at a glance. One uniform (0 off, 1 on) blends every world material between its own colour and its vision
// colour; the materials are wired once as they are made (setupVision), and the toggle only moves the uniform.

import * as THREE from 'three/webgpu';
import { materialColor, materialEmissive, mix, uniform, vec4 } from 'three/tsl';

/** The blend: 0 the world as it is, 1 Runner Vision. */
export const vision = uniform( 0 );

// What the runner takes hold of, runs along, bounces off, or reads as an edge: red.
const USABLE = /^(pole|pipe|bar|cable|ladder|red_panel|paint_green|trim_yellow|canvas_)/;
// The world's glow and the water keep a little of themselves.
const KEEP = { water: 0.35 };

const WHITE = new THREE.Color( '#ecebe6' ), RED = new THREE.Color( '#ff3b2f' );

/** Wires a course's materials (world.js's, by key) for Runner Vision. */
export function setupVision( mats ) {

	for ( const [ key, def ] of Object.entries( mats ) ) {

		const material = def.mat;
		if ( ! material || material.userData.vision ) continue;
		material.userData.vision = true;
		const usable = USABLE.test( key );
		const c = usable ? RED : WHITE, target = uniform( c.clone() ), glow = uniform( c.clone().multiplyScalar( usable ? 0.55 : 0.32 ) );
		const keep = KEEP[ key ] ?? 0, amount = vision.mul( 1 - keep );
		// The renderer keys its compiled shaders by a material's plain values: every material with a colour node would
		// share the first one's shader, and its colours. Each kind of vision colour gets its own.
		material.customProgramCacheKey = () => `vision:${usable ? 'red' : 'white'}:${keep}`;
		// A textured material's colour has the texture's alpha too (a mesh fence's holes): kept.
		material.colorNode = material.map ? vec4( mix( materialColor.rgb, target, amount ), materialColor.a ) : mix( materialColor, target, amount );
		// Lit from within as well, so the white reads at night and the red glows.
		if ( material.isMeshStandardMaterial ) material.emissiveNode = mix( materialEmissive, glow, amount );
	}

}

/** Eases the blend toward on or off (s). */
export function updateVision( on, dt ) {

	const to = on ? 1 : 0;
	vision.value += Math.sign( to - vision.value ) * Math.min( Math.abs( to - vision.value ), dt / 0.35 );

}
