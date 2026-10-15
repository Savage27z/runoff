// The time trial: the checkpoint gates, the clock (it starts on the first step), splits against the best run,
// medals, and the checkpoint the runner goes back to after a fall. RUNOFF's trial, on the Trizen runner; the gates'
// chevron curtain is a TSL material for the WebGPU renderer.

import * as THREE from 'three/webgpu';
import { Fn, abs, float, fract, pow, smoothstep, uniform, uv, vec3 } from 'three/tsl';
import { checker } from '../world/textures.js';

export const MEDALS = [
	{ id: 'bronze', name: 'Bronze', color: '#d98a4a' },
	{ id: 'silver', name: 'Silver', color: '#c9d2dc' },
	{ id: 'gold', name: 'Gold', color: '#ffcf40' },
	{ id: 'ace', name: 'Ace', color: '#c6ff3d' },
];

/** The best medal a time earns on a course (an index into MEDALS), or -1. */
export function medalFor( map, time ) {

	let medal = - 1;
	for ( let i = 0; i < map.medals.length; i ++ ) if ( time <= map.medals[ i ] ) medal = i;
	return medal;

}

// The gates' animation clock, shared by every curtain.
const clock = uniform( 0 );

// The curtain across a gate: chevrons sweeping through, brighter at its edges, fading out at the top.
function curtainMaterial( color, width ) {

	const material = new THREE.MeshBasicNodeMaterial( { transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending } );
	const tint = uniform( new THREE.Color( color ) ), opacity = uniform( 1 );
	const bands = Fn( () => {

		const u = uv();
		const chevron = fract( u.x.mul( width ).mul( 0.5 ).sub( abs( u.y.sub( 0.5 ) ).mul( 1.2 ) ).add( clock.mul( 1.4 ) ) );
		return smoothstep( 0, 0.1, chevron ).mul( float( 1 ).sub( smoothstep( 0.35, 0.45, chevron ) ) );

	} )();
	material.colorNode = vec3( tint ).mul( bands.add( 1 ) );
	material.opacityNode = Fn( () => {

		const u = uv();
		const edge = pow( abs( u.y.sub( 0.5 ) ).mul( 2 ), 6 );
		return float( 0.08 ).add( bands.mul( 0.22 ) ).add( edge.mul( 0.4 ) ).mul( opacity ).mul( float( 1 ).sub( smoothstep( 0.85, 1, u.y ) ) );

	} )();
	material.userData.opacity = opacity;
	return material;

}

export class Trial {

	/**
	 * @param {object} map the course
	 * @param {import( '../sim/session.js' ).Session} session the run on it
	 * @param {Object3D} parent where the gates go
	 * @param {object} [best] the best run so far: `time` and `splits`
	 */
	constructor( map, session, parent, best = null ) {

		this.map = map;
		this.session = session;
		this.best = best;
		this.group = new THREE.Group();
		parent.add( this.group );
		this.gates = map.checkpoints.map( ( cp, i ) => this.buildGate( cp, i === map.checkpoints.length - 1 ) );
		/** Told when a gate is passed, the run finishes, the runner goes back to a checkpoint. */
		this.onSplit = () => {};
		this.onFinish = () => {};
		this.start();

	}

	buildGate( cp, finish ) {

		const g = new THREE.Group();
		const w = cp.visX1 - cp.visX0, h = Math.min( cp.y1 - cp.visY, 6 );
		const cx = ( cp.visX0 + cp.visX1 ) / 2, cz = ( cp.z0 + cp.z1 ) / 2;
		const color = finish ? '#ffffff' : '#ff5a1f';
		const curtain = new THREE.Mesh( new THREE.PlaneGeometry( w, h ), curtainMaterial( color, w ) );
		curtain.position.set( cx, cp.visY + h / 2, cz );
		curtain.renderOrder = 2;
		g.add( curtain );
		const postMat = new THREE.MeshStandardMaterial( { color: finish ? '#f4f4f4' : '#1b1f2a', roughness: 0.4, emissive: new THREE.Color( color ), emissiveIntensity: 0.25 } );
		for ( const x of [ cp.visX0 + 0.12, cp.visX1 - 0.12 ] ) {

			const post = new THREE.Mesh( new THREE.CylinderGeometry( 0.1, 0.1, h + 0.4, 10 ), postMat );
			post.position.set( x, cp.visY + ( h + 0.4 ) / 2, cz );
			post.castShadow = true;
			g.add( post );

		}

		if ( finish ) {

			const tex = checker();
			const map = tex ? tex.clone() : null;
			if ( map ) {

				map.needsUpdate = true;
				map.repeat.set( Math.max( 2, Math.round( w / 1.2 ) ), 1 );

			}

			const banner = new THREE.Mesh( new THREE.BoxGeometry( w, 0.8, 0.12 ), new THREE.MeshStandardMaterial( { map, roughness: 0.6 } ) );
			banner.position.set( cx, cp.visY + h + 0.2, cz );
			banner.castShadow = true;
			g.add( banner );

		} else {

			const bar = new THREE.Mesh( new THREE.BoxGeometry( w, 0.12, 0.12 ), postMat );
			bar.position.set( cx, cp.visY + h + 0.35, cz );
			g.add( bar );

		}

		this.group.add( g );
		return { g, curtain, cp, finish };

	}

	/** Ready at the start line: the clock waits for the first step. */
	start() {

		this.t = 0;
		this.started = false;
		this.done = false;
		this.next = 0;
		this.splits = [];
		this.respawns = 0;
		this.refreshGates();

	}

	refreshGates() {

		this.gates.forEach( ( gate, i ) => {

			gate.g.visible = i >= this.next;
			gate.curtain.material.userData.opacity.value = i === this.next ? 1 : 0.25;

		} );

	}

	/** The runner went back to its checkpoint (a fall, or Q). */
	respawned() {

		this.respawns ++;

	}

	/** Every frame after the run's frame. */
	update( dt, time ) {

		clock.value = time;
		if ( this.done ) return;

		const runner = this.session.runner;
		if ( ! this.started ) {

			if ( runner.speed > 0.5 ) this.started = true;
			else return;

		}

		this.t += dt;
		const gate = this.gates[ this.next ];
		const f = this.session.feet;
		if ( gate ) {

			const c = gate.cp;
			if ( f.x + 0.3 > c.x0 && f.x - 0.3 < c.x1 && f.y + 1.8 > c.y0 && f.y < c.y1 && f.z + 0.3 > c.z0 && f.z - 0.3 < c.z1 ) this.pass( this.next );

		}

	}

	pass( i ) {

		this.splits.push( this.t );
		const best = this.best?.splits?.[ i ];
		const diff = best != null ? this.t - best : null;
		const finish = i === this.map.checkpoints.length - 1;
		this.next = i + 1;
		// A checkpoint's spawn is the world's spawn after it (the start is spawn 0).
		if ( ! finish ) this.session.setCheckpoint( i + 1 );
		this.refreshGates();
		this.onSplit( { index: i, time: this.t, diff, count: this.map.checkpoints.length, finish } );
		if ( finish ) {

			this.done = true;
			this.onFinish( { time: this.t, splits: this.splits.slice(), medal: medalFor( this.map, this.t ), respawns: this.respawns } );

		}

	}

	/** The hint for where the runner stands, if the course has one there. */
	hintAt( f ) {

		for ( const h of this.map.hints ?? [] ) {

			if ( f.x >= h.x0 && f.x <= h.x1 && f.z >= h.z0 && f.z <= h.z1 && f.y >= h.y0 && f.y <= h.y1 ) return h.text;

		}

		return null;

	}

	dispose() {

		this.group.traverse( ( o ) => {

			o.geometry?.dispose();
			o.material?.dispose?.();

		} );
		this.group.removeFromParent();

	}

}
