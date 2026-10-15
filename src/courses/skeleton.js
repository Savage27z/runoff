// Skeleton (day): the tower site, rebuilt for the Trizen runner. A vertical course: up the site cabin and the scaffold,
// floor by floor through the concrete frame (each floor face a climb the metrics say works: a 2.4 m catch from three
// metres out or a 3.6 m wall to run up, with a ladder or a pipe beside the hard ones), across the girder over the void
// with the safety net under it, to the top deck, out along the crane's jib, and down the hoist cable to the finish at
// the site gate. Built to docs/METRICS.md. Courses run toward +z; facing +z, +x is on the runner's left.
//
//  start   vault the pallets, climb the site cabin, catch the scaffold deck from its edge
//  L1      slide under the beam, vault the crates · fork: wall-run the core on the left and kick off it, or the bar
//  L2..L4  run up the wall (or the ladder), catch the floor above (or the pipe)
//  void    run the girder; the net under it throws a fall back up onto L5
//  L5..L6  slide under the low beam, slide-jump the gap
//  L7..top the pipe or the wall, a catch, the wall or the ladder, a catch: the top deck
//  jib     out along the jib to the cab; the hoist cable down to the finish

import * as THREE from 'three';
import { gate, hint } from './gates.js';

// A floor's face: a concrete wall from the floor below up to it, the floor slab behind it.
function floor( b, z0, z1, below, y ) {

	b.box( - 6, below, z0, 6, y, z0 + 1, 'concrete', { shade: [ 0.8, 1 ] } );
	b.slab( - 6, z0, 6, z1, y );

}

export const SKELETON = {
	id: 'skeleton',
	name: 'Skeleton',
	tagline: 'Tower site, high noon',
	blurb: 'Up through the frame floor by floor, along the girder, out on the jib, down the hoist cable.',
	theme: 'day',
	unlock: 3,
	rebuilt: true,
	medals: [ 65, 56, 50, 45.5 ],
	spawn: { x: 0, y: 0, z: - 14, yaw: 0 },
	killY: - 3,
	// Up on the frame, the ground is a fall (the safety net and the finish are not).
	isDead: ( feet, checkpoint ) => checkpoint >= 1 && feet.y < 1 && feet.z < 276,
	env: { birds: [ 0, 30, 80 ] },
	checkpoints: [
		gate( - 6, 6, 5, 26 ),
		gate( - 6, 6, 5, 52 ),
		gate( - 6, 6, 11, 80 ),
		gate( - 6, 6, 11, 108 ),
		gate( - 6, 6, 10.4, 130 ),
		gate( - 6, 6, 14, 146 ),
		gate( - 6, 6, 20, 176 ),
		gate( - 6, 6, 22.4, 190 ),
		gate( - 8, 8, 0, 294, { h: 5 } ),
	],
	hints: [
		hint( - 20, - 4, 'Up is the only way: climb the site cabin' ),
		hint( 1, 6, 'Jump at the scaffold deck from the edge and <b>climb</b>' ),
		hint( 23, 29, 'Hold <k>Shift</k>: <b>slide</b> under the beam' ),
		hint( 33, 40, '← <b>Wall-run</b> the core, <k>Space</k> to kick off · or swing the <b>bar</b> →' ),
		hint( 54, 62, 'Jump <b>into</b> the wall to run up it · or the <b>ladder</b> →' ),
		hint( 84, 90, 'Run the girder. Miss it and the net throws you back up' ),
		hint( 105, 118, '<b>Slide</b>, then <k>Space</k>: carry the speed over the gap' ),
		hint( 186, 200, 'Topped out: along the jib' ),
		hint( 220, 232, 'Jump up at the <b>hoist cable</b>: ride it down' ),
	],
	build( b ) {

		b.box( - 80, - 2, - 60, 80, 0, 340, { top: 'dirt', side: 'dirt' } );
		b.street( - 0.02 );
		for ( let z = - 40; z < 320; z += 4 ) {

			b.box( - 30, 0, z, - 29.9, 2.2, z + 3.9, 'steel', { collide: false } );
			b.box( 29.9, 0, z, 30, 2.2, z + 3.9, 'steel', { collide: false } );

		}

		// The start: pallets, the site cabin (2.6 m), the scaffold deck (5 m) with its hoarding under its edge.
		b.box( - 3, 0, - 8, 3, 1.0, - 6.8, 'wood' );
		b.box( - 4, 0, 0, 4, 2.6, 6, { side: 'c_white', top: 'metal' }, { shade: [ 0.7, 1 ] } );
		b.sign( 0, 2.0, - 0.01, 4, 0.8, 'SITE OFFICE', '#1b1f2a', Math.PI, { glow: false, bg: '#f5c518' } );
		b.box( - 4, 0, 8.8, 4, 4.8, 9, 'plywood' );
		b.plankDeck( - 4, 9, 4, 22, 5.0 );
		b.scaffold( - 4, 9, 4, 22, 0, 6.5 );
		// Pallets stacked on the deck, to vault.
		b.box( - 4, 5.0, 15, 4, 6.0, 16.2, 'wood' );

		// L1: the beam to slide under, the crates to vault, hazard rails along its sides.
		b.slab( - 6, 22, 6, 40, 5.0 );
		b.ibeam( - 6, 29.8, 6, 30.2, 6.6 );
		b.box( - 6, 5, 29.8, - 5.6, 6.6, 30.2, 'beam' ); b.box( 5.6, 5, 29.8, 6, 6.6, 30.2, 'beam' );
		b.box( - 6, 5, 35, 6, 6.0, 35.6, 'wood' );
		b.box( - 6, 5, 22, - 5.85, 6.0, 40, 'hazard' );

		// The core on the left (its face at x = 6, tall enough to run along); the bar over the gap on the right.
		b.box( 6, 0, 38, 9, 30, 64, 'concrete', { shade: [ 0.6, 1 ] } );
		b.arrow( 5.94, 6.6, 44, 4, 1, - Math.PI / 2, '#ff5a1f' );
		b.swingBar( - 4.5, 41.6, - 1.5, 41.6, 7.3, 0 );

		// L2 to L4: the wall to run up (or the ladder), the floor to catch (or the pipe).
		b.slab( - 6, 46.5, 6, 62, 5.0 );
		floor( b, 62, 74, 5.0, 8.6 );
		b.ladder( - 4, 62, 5.0, 3.6, '-z' );
		floor( b, 74, 90, 8.6, 11.0 );
		b.pipe( 4, 74, 8.6, 11.0, '-z' );
		// Formwork stacked on L4, to vault.
		b.box( - 6, 11.0, 82, 6, 12.0, 83.2, 'plywood' );

		// The void: the girder across, a second one beside it, the safety net under them.
		b.ibeam( - 0.25, 90, 0.25, 104, 11.0, 'beam_yellow' );
		b.ibeam( - 3.75, 90, - 3.25, 104, 11.0, 'beam_yellow' );
		for ( const x of [ - 3.5, 0 ] ) b.column( x, 97, 0, 10.55, 0.18, 'steel' );
		b.awning( - 6, 90.6, 6, 103.4, 6.9, 'canvas_green', false );
		for ( const [ x, z ] of [ [ - 6, 90.6 ], [ 6, 90.6 ], [ - 6, 103.4 ], [ 6, 103.4 ] ] ) b.put( new THREE.CylinderGeometry( 0.05, 0.05, 6.9, 6 ), 'steel', x, 3.45, z, 1, 1, 1 );

		// L5: the low beam to slide under; the gap to slide-jump; L6 a little lower.
		b.slab( - 6, 104, 6, 118, 11.0 );
		b.ibeam( - 6, 111.8, 6, 112.2, 12.6 );
		b.box( - 6, 11, 111.8, - 5.6, 12.6, 112.2, 'beam' ); b.box( 5.6, 11, 111.8, 6, 12.6, 112.2, 'beam' );
		b.slab( - 6, 124.5, 6, 140, 10.4 );

		// L7 to the top deck: the wall (or the pipe), a catch, the wall (or the ladder), a catch.
		floor( b, 140, 154, 10.4, 14.0 );
		b.pipe( - 4, 140, 10.4, 14.0, '-z' );
		floor( b, 154, 168, 14.0, 16.4 );
		floor( b, 168, 182, 16.4, 20.0 );
		b.ladder( 4, 168, 16.4, 3.6, '-z' );
		floor( b, 182, 200, 20.0, 22.4 );
		// Formwork on the top deck, to vault.
		b.box( - 6, 22.4, 190, 6, 23.4, 191.2, 'plywood' );
		b.box( - 6, 22.4, 198.6, - 2, 25, 198.8, 'plywood', { collide: false } );
		b.sign( - 4, 24.2, 198.5, 4, 1, 'TOPPED OUT', '#ff5a1f', Math.PI, { glow: false, bg: '#1b1f2a' } );

		// The jib: its catwalk out to the cab, railed; the jib's lattice under it; the tower crane's mast.
		b.box( - 1, 22.0, 200, 1, 22.4, 226, { top: 'metal', side: 'beam_yellow' } );
		b.pipeRail( - 1.05, 200, - 1.05, 226, 22.4 );
		b.pipeRail( 1.05, 200, 1.05, 226, 22.4 );
		// The crane's trolley hangs over the catwalk: slide under it.
		b.box( - 1.1, 23.4, 213, 1.1, 24.3, 214.4, { side: 'beam_yellow', top: 'metal', bottom: 'beam_yellow' }, { keepBottom: true } );
		b.lattice( - 1, 20.4, 200, 1, 22.0, 232, 'beam_yellow', 'z', 2 );
		b.box( - 2.5, 21.0, 226, 2.5, 22.4, 232, { side: 'c_yellow', top: 'metal' } );
		b.lattice( 8.8, 0, 210, 11.2, 30, 212.4, 'beam_yellow', 'y', 2.4 );
		b.box( 1, 20.4, 209.5, 11.2, 22.0, 213, 'beam_yellow', { collide: false } );
		b.box( - 2.4, 22.4, 230, 2.4, 25.2, 232, { side: 'glass', top: 'metal' }, { collide: false } );

		// The hoist cable down to the gate.
		b.zipline( [ 0, 24.8, 229.5 ], [ 0, 2.6, 288 ] );
		b.box( - 10, 0, 296, - 8, 4, 297, 'beam_yellow' ); b.box( 8, 0, 296, 10, 4, 297, 'beam_yellow' );
		b.sign( 0, 4.6, 296.4, 8, 1.4, 'SITE GATE', '#1b1f2a', Math.PI, { glow: false, bg: '#f5c518' } );

		// The other tower crane, rebar and clutter, the site around it.
		b.lattice( 12, 0, 120, 14.4, 40, 122.4, 'beam_yellow', 'y', 2.4 );
		b.lattice( - 30, 40, 120.2, 30, 42, 122.2, 'beam_yellow', 'x', 3 );
		b.box( 11.6, 38, 118, 14.8, 41, 124.4, { side: 'beam_yellow', top: 'metal' }, { collide: false } );
		b.box( - 20, 42, 120.4, - 12, 44, 122, 'concrete', { collide: false } );
		const floorAt = ( z ) => z < 40 ? 5 : z < 62 ? 5 : z < 74 ? 8.6 : z < 90 ? 11 : z < 118 ? 11 : z < 140 ? 10.4 : z < 154 ? 14 : z < 168 ? 16.4 : z < 182 ? 20 : 22.4;
		for ( let i = 0; i < 40; i ++ ) {

			const z = b.r( 22, 196 ), x = b.r( - 5.5, 5.5 );
			if ( ( z > 88 && z < 106 ) || ( z > 116 && z < 126 ) ) continue;
			const y = floorAt( z );
			b.box( x - 0.02, y, z - 0.02, x + 0.02, y + b.r( 0.3, 0.9 ), z + 0.02, 'steel', { collide: false } );

		}

		for ( const [ x, z, c ] of [ [ - 14, - 8, 'c_blue' ], [ - 12.6, - 8, 'c_orange' ], [ - 11.2, - 8, 'c_green' ] ] ) b.box( x - 0.6, 0, z - 0.6, x + 0.6, 2.3, z + 0.6, c, { shade: [ 0.8, 1 ] } );
		b.crates( 12, 0, 4, 4 ); b.crates( - 12, 0, 30, 3 ); b.crates( 14, 0, 60, 4 );
		b.put( new THREE.CylinderGeometry( 0.9, 0.9, 1.6, 16 ), 'c_orange', 16, 1.6, 20, 1, 1, 1, 0.5, 0, 0 );
		for ( let z = - 10; z < 0; z += 4 ) b.cone( - 6, 0, z );
		b.bunting( 13.2, 38, 121.2, - 6, 22.4, 196, { n: 20, sag: 2 } );
		for ( const [ x, z ] of [ [ - 22, - 20 ], [ 22, - 20 ], [ - 24, 40 ], [ 24, 70 ], [ - 26, 110 ], [ 26, 150 ], [ - 24, 175 ], [ 22, 300 ] ] ) b.tree( x, 0, z, 1.1 );
		b.building( - 40, 30, - 22, 70, 46, 'fac_office', '', {} );
		b.building( 22, - 10, 44, 30, 34, 'fac_grey', '', {} );
		b.building( 24, 150, 50, 190, 58, 'fac_office', '', {} );
		b.building( - 44, 200, - 22, 250, 50, 'fac_grey', '', {} );
		b.building( 24, 270, 48, 310, 40, 'fac_sky', '', {} );
		b.backdrop( { x0: - 400, x1: 400, z0: - 300, z1: 620, cell: 45, hMin: 18, hMax: 80, fill: 0.55, avoid: [ [ - 80, - 60, 80, 340 ] ], roofDeco: false } );

	},
};
