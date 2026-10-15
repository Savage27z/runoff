// What a course collides with and takes hold of, as the builder lays it down: axis-aligned boxes (most of everything),
// turned boxes (swing bars), convex hulls (ramps, roof slopes, poles, pipes) and the things the runner takes hold of
// (poles, drainpipes, ziplines, ladders, ropes). Kept in the order they were added, which never changes for a course,
// because the physics engines' answers depend on the order solids are added (toWorld.js turns these into the runner's
// world description).
//
// Same add() signature as the original RUNOFF Collision, so the builder's calls carry over unchanged.

import { Quaternion, Vector3 } from 'three';

// A prism round a line has this many sides: 16 for poles and pipes, 8 for thin rails.
const SIDES = 16;

export class SolidCollector {

	constructor() {

		this.pieces = [];
		this.features = { poles: [], pipes: [], ziplines: [], ladders: [], ropes: [] };
		this.count = 0;

	}

	clear() {

		this.pieces.length = 0;
		for ( const list of Object.values( this.features ) ) list.length = 0;
		this.count = 0;

	}

	/** A name for a feature and its solid, unique in the course: `pole3`. */
	id( kind ) {

		return `${kind}${this.count ++}`;

	}

	/** A box from its corners, and the surface it is (footsteps, bounce pads). */
	add( x0, y0, z0, x1, y1, z1, surface = 'concrete', tags = [] ) {

		const piece = { kind: 'box', x0: Math.min( x0, x1 ), y0: Math.min( y0, y1 ), z0: Math.min( z0, z1 ), x1: Math.max( x0, x1 ), y1: Math.max( y0, y1 ), z1: Math.max( z0, z1 ), surface, tags };
		this.pieces.push( piece );
		return piece;

	}

	/** A turned box: its centre, rotation ([ x, y, z, w ]) and half extents. */
	addTurnedBox( centre, rotation, halfExtents, { surface = 'metal', tags = [], id = null } = {} ) {

		const piece = { kind: 'turnedBox', centre, rotation, halfExtents, surface, tags, id };
		this.pieces.push( piece );
		return piece;

	}

	/**
	 * A convex hull from its corners ([ [ x, y, z ], … ]) and its faces (each a list of corner indices in order round
	 * it), and the surface it is.
	 */
	addHull( points, polygons, surface = 'concrete', tags = [], id = null ) {

		const piece = { kind: 'hull', points, polygons, surface, tags, id };
		this.pieces.push( piece );
		return piece;

	}

	/** A prism round the line from a to b ([ x, y, z ]): poles, pipes, rails. */
	addPrism( a, b, radius, { sides = SIDES, surface = 'metal', tags = [], id = null } = {} ) {

		const A = new Vector3( ...a ), B = new Vector3( ...b );
		const axis = new Vector3().subVectors( B, A ).normalize();
		const helper = Math.abs( axis.y ) < 0.9 ? new Vector3( 0, 1, 0 ) : new Vector3( 1, 0, 0 );
		const u = new Vector3().crossVectors( axis, helper ).normalize(), v = new Vector3().crossVectors( axis, u );
		const points = [];
		for ( const end of [ A, B ] ) {

			for ( let i = 0; i < sides; i ++ ) {

				const angle = i / sides * Math.PI * 2;
				points.push( end.clone().addScaledVector( u, Math.cos( angle ) * radius ).addScaledVector( v, Math.sin( angle ) * radius ).toArray() );

			}

		}

		const ring = ( offset ) => Array.from( { length: sides }, ( _, i ) => offset + i );
		const polygons = [ ring( 0 ), ring( sides ) ];
		for ( let i = 0; i < sides; i ++ ) polygons.push( [ i, ( i + 1 ) % sides, sides + ( i + 1 ) % sides, sides + i ] );
		return this.addHull( points, polygons, surface, tags, id );

	}

	/**
	 * A ramp across x0..x1 rising from y0 at z0 to y1 at z1 (either way along z), down to `base`: a wedge with a true
	 * slope, where RUNOFF stepped it in 0.28 m boxes.
	 */
	addRampZ( x0, x1, z0, z1, y0, y1, base, surface = 'concrete' ) {

		const lo = Math.min( x0, x1 ), hi = Math.max( x0, x1 );
		const points = [
			[ lo, base, z0 ], [ hi, base, z0 ], [ hi, base, z1 ], [ lo, base, z1 ],
			[ lo, y0, z0 ], [ hi, y0, z0 ], [ hi, y1, z1 ], [ lo, y1, z1 ],
		];
		return this.addHull( points, PRISM_FACES, surface );

	}

	/**
	 * A slab under a sloped strip: the four top corners given ([ a0, a1, b1, b0 ] round the strip, each [ x, y, z ]),
	 * down to `base`. Used for each slice of a curved roof.
	 */
	addSlopedSlab( top, base, surface = 'concrete' ) {

		const points = [ ...top.map( ( [ x, , z ] ) => [ x, base, z ] ), ...top ];
		return this.addHull( points, PRISM_FACES, surface );

	}

	// ---- Things to take hold of. Each comes as the runner's world takes it (World.js): vectors as [ x, y, z ].

	/** A pole from `bottom` to `top`: its solid shares its id and carries the 'pole' tag. */
	addPole( bottom, top, radius ) {

		const id = this.id( 'pole' );
		this.addPrism( bottom, top, radius, { tags: [ 'pole' ], id } );
		this.features.poles.push( { id, bottom, top, radius } );
		return id;

	}

	/** A drainpipe from `start` (low) to `end` (high), `forward` into its wall: the runner climbs facing the wall. */
	addPipe( start, end, forward, radius ) {

		const id = this.id( 'pipe' );
		this.addPrism( start, end, radius, { id } );
		this.features.pipes.push( { id, start, end, forward, radius } );
		return id;

	}

	/** A zipline ridden from `start` (the high end) to `end`; nothing collides with it. */
	addZipline( start, end, radius = 0.02 ) {

		const id = this.id( 'zipline' );
		const forward = new Vector3( end[ 0 ] - start[ 0 ], 0, end[ 2 ] - start[ 2 ] ).normalize().toArray();
		this.features.ziplines.push( { id, start, end, forward, radius } );
		return id;

	}

	/** A ladder from `start` (its foot) to `end` (its top), `forward` into its wall, `width` across. */
	addLadder( start, end, forward, width ) {

		const id = this.id( 'ladder' );
		this.features.ladders.push( { id, start, end, forward, width } );
		return id;

	}

	/** A rope hanging from `anchor` to `end`; nothing collides with it. */
	addRope( anchor, end ) {

		const id = this.id( 'rope' );
		const length = Math.hypot( end[ 0 ] - anchor[ 0 ], end[ 1 ] - anchor[ 1 ], end[ 2 ] - anchor[ 2 ] );
		this.features.ropes.push( { id, anchor, end, length } );
		return id;

	}

	/** A swing bar from a to b, thick `radius`: a turned box along it with the 'bar' tag. */
	addBar( a, b, radius ) {

		const id = this.id( 'bar' );
		const A = new Vector3( ...a ), B = new Vector3( ...b );
		const along = new Vector3().subVectors( B, A );
		const rotation = new Quaternion().setFromUnitVectors( new Vector3( 1, 0, 0 ), along.clone().normalize() );
		this.addTurnedBox( A.clone().add( B ).multiplyScalar( 0.5 ).toArray(), rotation.toArray(), [ along.length() / 2, radius, radius ], { tags: [ 'bar' ], id } );
		return id;

	}

}

// The faces of a hull of eight corners: the bottom four (0–3) and the top four (4–7) above them, in the same order.
const PRISM_FACES = [ [ 0, 1, 2, 3 ], [ 4, 5, 6, 7 ], [ 0, 1, 5, 4 ], [ 1, 2, 6, 5 ], [ 2, 3, 7, 6 ], [ 3, 0, 4, 7 ] ];
