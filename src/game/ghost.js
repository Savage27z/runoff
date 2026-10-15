// Ghosts: the runner's best run on a course, recorded as it is drawn and played back beside the next run as a
// see-through runner. A ghost is a pose track (the figure's place, its body's drop, every bone's turn, the root's and
// hips' travel) sampled RATE times a second, so it outlives any change to the runner's tuning or takes, and it plays on
// any character (they all share the Y Bot's bone names). Ghosts live in the browser's IndexedDB, one per course.

import * as THREE from 'three/webgpu';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

// Samples a second.
const RATE = 15;
// Finger bones are left out (a ghost's hands are not worth a third of its size).
const FINGERS = /Thumb|Index|Middle|Ring|Pinky/;
// Per sample: the time (1), the figure's place and turn (7), its body's drop (1); the root's and the hips' travel (3
// each); per bone its turn (4).
const HEAD = 9;

const DB = 'runoff2', STORE = 'ghosts';

function openDb() {

	return new Promise( ( resolve, reject ) => {

		const request = indexedDB.open( DB, 1 );
		request.onupgradeneeded = () => request.result.createObjectStore( STORE );
		request.onsuccess = () => resolve( request.result );
		request.onerror = () => reject( request.error );

	} );

}

/** The ghost kept for a course, or null (no ghost yet, or no IndexedDB here). */
export async function loadGhost( course ) {

	try {

		const db = await openDb();
		return await new Promise( ( resolve ) => {

			const request = db.transaction( STORE ).objectStore( STORE ).get( course );
			request.onsuccess = () => resolve( request.result ?? null );
			request.onerror = () => resolve( null );

		} );

	} catch {

		return null;

	}

}

/** Keeps a ghost for a course (in place of the one before). */
export async function saveGhost( course, ghost ) {

	try {

		const db = await openDb();
		await new Promise( ( resolve ) => {

			const tx = db.transaction( STORE, 'readwrite' );
			tx.objectStore( STORE ).put( ghost, course );
			tx.oncomplete = tx.onerror = () => resolve();

		} );

	} catch {}

}

/** Forgets every course's ghost (with the progress they were the best runs of). */
export async function clearGhosts() {

	try {

		const db = await openDb();
		await new Promise( ( resolve ) => {

			const tx = db.transaction( STORE, 'readwrite' );
			tx.objectStore( STORE ).clear();
			tx.oncomplete = tx.onerror = () => resolve();

		} );

	} catch {}

}

// The bones a ghost keeps, in order: the model's, the fingers left out.
function bonesOf( model ) {

	const bones = [];
	model.traverse( ( o ) => o.isBone && ! FINGERS.test( o.name ) && bones.push( o ) );
	return bones;

}

/** Records a run as it is drawn: `sample()` each frame with the run's clock, `take()` at the end. */
export class GhostRecorder {

	constructor( figure ) {

		this.figure = figure;
		this.bones = bonesOf( figure.model );
		this.roots = [ figure.model.getObjectByName( figure.roles.root ), figure.model.getObjectByName( figure.roles.hips ) ];
		this.reset();

	}

	reset() {

		this.samples = [];
		this.next = 0;

	}

	sample( t ) {

		if ( t < this.next ) return;
		this.next = t + 1 / RATE;
		const f = this.figure, row = [ t, ...f.root.position.toArray(), ...f.root.quaternion.toArray(), f.body.position.y ];
		for ( const root of this.roots ) row.push( ...root.position.toArray() );
		for ( const bone of this.bones ) row.push( ...bone.quaternion.toArray() );
		this.samples.push( row );

	}

	/** The ghost: the run's time, its bones' names and its samples (one Float32Array, a row per sample). */
	take( time, character ) {

		const width = this.samples[ 0 ]?.length ?? 0;
		const data = new Float32Array( this.samples.length * width );
		this.samples.forEach( ( row, i ) => data.set( row, i * width ) );
		return { version: 1, time, character, rate: RATE, width, bones: this.bones.map( ( b ) => b.name ), data };

	}

}

const p0 = new THREE.Vector3(), p1 = new THREE.Vector3(), q0 = new THREE.Quaternion(), q1 = new THREE.Quaternion();

/** Plays a ghost on a see-through copy of a runner's model: `show( t )` with the run's clock each frame. */
export class GhostPlayer {

	/**
	 * @param {object} ghost a recorder's take (from loadGhost)
	 * @param {object} figure the runner on the stage, whose model the ghost wears
	 * @param {Object3D} parent where the ghost goes
	 */
	constructor( ghost, figure, parent ) {

		this.ghost = ghost;
		this.root = new THREE.Group();
		this.root.name = 'ghost';
		this.body = new THREE.Group();
		this.root.add( this.body );
		this.model = cloneSkinned( figure.model );
		this.body.add( this.model );
		this.material = new THREE.MeshBasicMaterial( { color: '#8fdcff', transparent: true, opacity: 0.45, depthWrite: false } );
		this.model.traverse( ( o ) => {

			if ( ! o.isMesh ) return;
			o.material = this.material;
			o.castShadow = o.receiveShadow = false;
			o.frustumCulled = false;
			o.renderOrder = 2;

		} );
		const byName = new Map();
		this.model.traverse( ( o ) => o.isBone && byName.set( o.name, o ) );
		this.bones = ghost.bones.map( ( name ) => byName.get( name ) ?? null );
		this.roots = [ this.model.getObjectByName( figure.roles.root ), this.model.getObjectByName( figure.roles.hips ) ];
		this.count = ghost.data.length / ghost.width;
		parent.add( this.root );

	}

	/** Poses the ghost at a time of its run (s): between the samples either side. Hidden past its end. */
	show( t ) {

		const { data, width } = this.ghost, last = this.count - 1;
		if ( last < 0 ) return;
		let i = Math.min( last, Math.max( 0, Math.floor( t * this.ghost.rate ) ) );
		while ( i < last && data[ ( i + 1 ) * width ] <= t ) i ++;
		while ( i > 0 && data[ i * width ] > t ) i --;
		const j = Math.min( last, i + 1 ), a = i * width, b = j * width;
		const span = data[ b ] - data[ a ], k = span > 0 ? THREE.MathUtils.clamp( ( t - data[ a ] ) / span, 0, 1 ) : 0;
		this.root.visible = t <= data[ last * width ] + 0.5;

		const vec = ( at, out, other ) => out.set( data[ at ], data[ at + 1 ], data[ at + 2 ] ).lerp( other.set( data[ at - a + b ], data[ at - a + b + 1 ], data[ at - a + b + 2 ] ), k );
		const quat = ( at, out ) => out.set( data[ at ], data[ at + 1 ], data[ at + 2 ], data[ at + 3 ] ).slerp( q1.set( data[ at - a + b ], data[ at - a + b + 1 ], data[ at - a + b + 2 ], data[ at - a + b + 3 ] ), k );

		this.root.position.copy( vec( a + 1, p0, p1 ) );
		this.root.quaternion.copy( quat( a + 4, q0 ) );
		this.body.position.y = data[ a + 8 ] + ( data[ b + 8 ] - data[ a + 8 ] ) * k;
		let at = a + HEAD;
		for ( const root of this.roots ) {

			if ( root ) root.position.copy( vec( at, p0, p1 ) );
			at += 3;

		}

		for ( const bone of this.bones ) {

			if ( bone ) bone.quaternion.copy( quat( at, q0 ) );
			at += 4;

		}

	}

	dispose() {

		this.root.removeFromParent();
		this.material.dispose();

	}

}
