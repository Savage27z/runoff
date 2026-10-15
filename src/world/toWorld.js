// The world adapter: a built RUNOFF course (its collected solids, spawn and checkpoints) turned into the world
// description the Trizen runner takes (AGENTS.md, Adapting a world, in @trizendigital/parkour). Solids keep the order
// the builder laid them down in, so the same course always gives the engine the same solids in the same order.
//
// Units and axes match already: metres, Y up, a yaw of 0 faces +Z. RUNOFF places the runner by its feet; the runner
// places its capsule by its centre, 0.9215 m above the floor.

import { Vector3 } from 'three';
import { boxSolid, hullSolid } from '@trizendigital/parkour/world/solids.js';

/** How far a capsule's centre stands above the floor (m): half its height plus the gap it floats at. */
export const SPAWN_LIFT = 0.9215;

// A box thinner than this (m) on any axis is made this thick: a zero-thickness box is no solid to an engine.
const THINNEST = 0.01;

// Below the course's kill height by this much (m) the runner itself gives up; the game respawns it long before.
const FLOOR_BELOW_KILL = 25;

/**
 * @param {object} map the course (src/courses/maps.js)
 * @param {import( './solids.js' ).SolidCollector} collector what the course's build laid down
 * @returns {{ description: object, surfaces: Map<string, string>, spawns: object[] }} the world description, each
 *   solid's surface by its id, and the spawns (the start, then each checkpoint's) in the runner's terms
 */
export function toWorld( map, collector ) {

	const solids = [];
	const surfaces = new Map();

	collector.pieces.forEach( ( piece, index ) => {

		// A feature's solid carries its feature's id (a pole's must); the rest are numbered in the order laid down.
		const id = piece.id ?? `s${index}`;
		const tags = [ ...piece.tags ];
		if ( piece.surface === 'bounce' ) tags.push( 'bounce', 'noClimb' );
		surfaces.set( id, piece.surface );

		if ( piece.kind === 'box' ) {

			const hx = Math.max( ( piece.x1 - piece.x0 ) / 2, THINNEST / 2 );
			const hy = Math.max( ( piece.y1 - piece.y0 ) / 2, THINNEST / 2 );
			const hz = Math.max( ( piece.z1 - piece.z0 ) / 2, THINNEST / 2 );
			solids.push( boxSolid( { id, position: [ ( piece.x0 + piece.x1 ) / 2, ( piece.y0 + piece.y1 ) / 2, ( piece.z0 + piece.z1 ) / 2 ], halfExtents: [ hx, hy, hz ], tags } ) );

		} else if ( piece.kind === 'turnedBox' ) {

			solids.push( boxSolid( { id, position: piece.centre, rotation: piece.rotation, halfExtents: piece.halfExtents, tags } ) );

		} else {

			solids.push( hullSolid( { id, points: piece.points.flat(), polygons: piece.polygons, tags } ) );

		}

	} );

	const spawnOf = ( s ) => ( { position: new Vector3( s.x, s.y + SPAWN_LIFT, s.z ), yaw: s.yaw ?? 0 } );
	const spawns = [ spawnOf( map.spawn ), ...map.checkpoints.map( ( cp ) => spawnOf( cp.spawn ) ) ];

	// The things to take hold of, with their vectors as the runner takes them.
	const v = ( a ) => new Vector3( ...a );
	const f = collector.features;
	const features = {
		poles: f.poles.map( ( p ) => ( { ...p, bottom: v( p.bottom ), top: v( p.top ) } ) ),
		pipes: f.pipes.map( ( p ) => ( { ...p, start: v( p.start ), end: v( p.end ), forward: v( p.forward ) } ) ),
		ziplines: f.ziplines.map( ( z ) => ( { ...z, start: v( z.start ), end: v( z.end ), forward: v( z.forward ) } ) ),
		ladders: f.ladders.map( ( l ) => ( { ...l, start: v( l.start ), end: v( l.end ), forward: v( l.forward ) } ) ),
		ropes: f.ropes.map( ( r ) => ( { ...r, anchor: v( r.anchor ), end: v( r.end ) } ) ),
	};

	return {
		description: { name: map.name, spawns, solids, ...features, floor: map.killY - FLOOR_BELOW_KILL },
		surfaces,
		spawns,
	};

}
