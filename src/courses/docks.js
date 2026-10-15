// Docks (night): the container yard, rebuilt for the Trizen runner. Containers stack in 2.6 m storeys (one is a climb,
// two a ladder or a pole), and the course runs from the warehouse over the stacks, splits into the high line along
// one-wide container rows and the alley below, meets again on the big stack, then rides the zipline over the quay to
// the barge, crosses the pontoons and climbs the container pyramid on Terminal 2. Built to docs/METRICS.md. Courses run
// toward +z; facing +z, +x is on the runner's left.
//
//  A   the warehouse roof · vault the skylight, jump the first stacks
//  S3  fork: the high line ahead (narrow rows, a wall run along a four-high stack and its kick over the wide gap) or the pole down to the alley
//      on the right (crates to vault, a duct to slide under, the ladder up the big stack)
//  C   the big stack: the zipline over the quay
//  B   the barge: vault its hatches, off the stern onto the pontoons
//  P   the pontoons: the swing bar over the water, or the mooring beam
//  T   Terminal 2: the pyramid, four climbs to the finish

import * as THREE from 'three';
import { CONT } from '../world/builder.js';
import { gate, hint } from './gates.js';

// A container's storey (m).
const H = CONT.H;

export const DOCKS = {
	id: 'docks',
	name: 'Docks',
	tagline: 'Container yard, after midnight',
	blurb: 'The high line or the alley, a zipline over the quay, the pontoons and the pyramid.',
	theme: 'night',
	unlock: 1,
	rebuilt: true,
	medals: [ 60, 51, 45.5, 42 ],
	spawn: { x: 0, y: 8, z: - 16, yaw: 0 },
	killY: - 0.8,
	env: { water: { y: - 1.2 }, birds: [ 0, 16, 90 ] },
	checkpoints: [
		gate( - 2.44, 2.44, 3 * H, 31 ),
		gate( - 8, 1.22, 2 * H, 63, { y0: 0, h: 4.8, spawnX: 0, vis: [ - 1.22, 1.22 ] } ),
		gate( - 7.32, 7.32, 3 * H, 113 ),
		gate( - 14, 14, 2.4, 184, { vis: [ - 8, 8 ] } ),
		gate( - 5, 5, 1, 213 ),
		gate( - 8, 8, 0, 246 ),
		gate( - 4.88, 4.88, H, 262 ),
		gate( - 4.88, 4.88, 4 * H, 300, { h: 5 } ),
	],
	hints: [
		hint( - 22, 6, 'Jump the stacks · keep your speed' ),
		hint( 41, 53, 'High line ahead · or grab the <b>pole</b> → down to the alley' ),
		hint( 76, 86, '← <b>Wall-run</b> the stack, <k>Space</k> to kick off it' ),
		hint( 94, 104, 'Jump at the big stack from the edge and <b>climb</b>' ),
		hint( 108, 119, 'Jump up at the <b>cable</b>: ride it to the barge' ),
		hint( 200, 208, 'Off the stern onto the pontoons' ),
		hint( 209, 219, 'Swing the <b>bar</b> · or walk the mooring <b>beam</b> →' ),
		hint( 250, 268, 'Climb the pyramid: jump from a few steps out' ),
	],
	build( b ) {

		const cols = [ 'c_red', 'c_blue', 'c_green', 'c_orange', 'c_white', 'c_teal', 'c_grey', 'c_yellow' ];

		// The quay (the sea comes from env), its edge, its bollards.
		b.box( - 60, - 3, - 40, 60, 0, 168, { top: 'pav_light', side: 'concrete' } );
		for ( let x = - 58; x <= 58; x += 6 ) b.box( x - 0.3, 0, 167.2, x + 0.3, 0.6, 167.8, 'hazard' );
		for ( let x = - 56; x <= 56; x += 8 ) b.put( new THREE.CylinderGeometry( 0.28, 0.32, 0.8, 12 ), 'steel', x + 3, 0.4, 166.6, 1, 1, 1 );

		// A: the warehouse roof.
		b.building( - 12, - 22, 12, 6, 8, 'metal', '', { roof: 'metal' } );
		b.box( - 12, 8, - 22, 12, 8.3, - 21.7, 'metal' );
		b.vent( - 8, 8, - 18 ); b.vent( 8, 8, - 12 );
		// The roof's skylight ridge, to vault on the way to the stacks.
		b.box( - 3.2, 8, - 6.6, 3.2, 9, - 5.8, { side: 'steel', top: 'glass' }, { surface: 'metal' } );
		b.bunting( - 2.44, 9.5, 8, - 2.44, 9.2, 20, { n: 12, sag: 0.6 } );

		// S1, S2: three high; S3 two high, the fork at its end.
		b.stack( - 2.44, 9, true, 2, 3, [ 'c_red', 'c_blue', 'c_white' ] );
		b.stack( - 2.44, 25, true, 2, 3, [ 'c_orange', 'c_teal', 'c_white' ] );
		b.stack( - 2.44, 41, true, 2, 2, [ 'c_green', 'c_grey' ] );

		// The high line: one-wide rows two high, a gap too wide to jump beside a three-high stack to run along.
		b.stack( - 1.22, 57.2, true, 1, 2, [ 'c_teal', 'c_red' ] );
		b.stack( - 1.22, 73.4, true, 1, 2, [ 'c_blue', 'c_orange' ] );
		b.stack( 1.22, 84, true, 1, 4, [ 'c_yellow', 'c_red', 'c_blue', 'c_white' ] );
		b.arrow( 1.2, 6.6, 88, 5, 1.2, - Math.PI / 2, '#ff2e88' );
		b.stack( - 3.66, 92, true, 2, 2, [ 'c_white', 'c_green' ] );
		b.light( 0, 5.6, 57.4, '#b6ff3b', 1.2 ); b.light( 0, 5.6, 92.2, '#b6ff3b', 1.2 );

		// The alley (x -8 .. -1.5), down the pole: crates to vault, a duct to slide under, the ladder up the big stack.
		b.pole( - 3.4, 54.6, 0, 5.8 );
		b.stack( - 10.88, 57, true, 1, 2, [ 'c_green', 'c_orange' ], 4 );
		b.box( - 8.4, 0, 66, - 1.6, 1.0, 67.2, 'wood' );
		b.duct( - 8.4, 1.0, 78, - 1.6, 1.7, 78.8 );
		b.box( - 8.4, 0, 78, - 8, 1.0, 78.8, 'steel' );
		b.sign( - 5, 3.2, 78.9, 6, 1.4, 'LOW CLEARANCE', '#ffb020', Math.PI, { font: 'bold 110px Anton, Impact, sans-serif' } );
		b.box( - 8.4, 0, 90, - 1.6, 1.1, 91.2, 'wood' );
		for ( let z = 60; z < 106; z += 6 ) b.cone( - 7.6, 0, z );

		// C: the big stack, three high; its ladder for the alley; the zipline's mast at its far end.
		b.stack( - 7.32, 107.2, true, 6, 3, [ 'c_orange', 'c_teal', 'c_grey', 'c_red', 'c_blue', 'c_white' ] );
		b.ladder( - 5, 107.2, 0, 3 * H, '-z' );
		b.zipline( [ 0, 3 * H + 2.4, 117.6 ], [ 0, 5.0, 176 ] );
		b.stringLights( - 7.32, 9.4, 111, 7.32, 9.8, 111, { color: '#ffb86a' } );
		// The cranes over the quay, the cable running between them.
		for ( const cx of [ - 16, 14 ] ) {

			b.lattice( cx - 1.2, 0, 140, cx + 1.2, 34, 142.4, 'beam_yellow', 'y', 3 );
			b.lattice( cx - 1.2, 0, 150, cx + 1.2, 34, 152.4, 'beam_yellow', 'y', 3 );
			b.lattice( cx - 1, 34, 128, cx + 1, 36, 196, 'beam_yellow', 'z', 3 );
			b.light( cx, 36.5, 196, '#ff3030', 1.5, true );

		}

		// B: the barge, its deck 2.4 m over the quay; hatches to vault; the bridge.
		b.box( - 14, - 1.2, 172, 14, 2.4, 204, { side: 'hull', top: 'deck' }, { surface: 'metal' } );
		b.box( - 14, 0.3, 171.9, 14, 0.9, 204.1, 'hull_red', { collide: false } );
		b.box( - 6, 2.4, 186, 6, 3.5, 188.4, 'steel' );
		b.box( - 6, 2.4, 195, 6, 3.5, 197.4, 'steel' );
		b.building( 7, 190, 14, 204, 14, 'fac_dark', '', { base: 2.4 } );
		b.box( 8.5, 14, 194, 12.5, 16.5, 200, 'white' );
		b.antenna( 10.5, 16.5, 197, 6 );
		b.stack( - 14, 174, false, 2, 2, [ 'c_red', 'c_blue' ] );
		b.sign( 0, 9.5, 203.9, 18, 3.6, 'ORIENT LINE', '#27e8ff', Math.PI );

		// P: two pontoons over the water; the swing bar between them on its mooring posts, or the beam beside it.
		for ( const [ z0, z1 ] of [ [ 208, 218 ], [ 224, 234 ] ] ) {

			b.box( - 5, - 1.2, z0, 5, 1, z1, { top: 'deck', side: 'hull_red' }, { surface: 'metal' } );
			for ( const x of [ - 4.6, 4.6 ] ) b.put( new THREE.CylinderGeometry( 0.2, 0.2, 0.6, 10 ), 'steel', x, 1.3, ( z0 + z1 ) / 2, 1, 1, 1 );

		}

		b.swingBar( - 2, 219.4, 1.4, 219.4, 3.3, - 1.2 );
		// Cargo lashed on the second pontoon, to vault.
		b.box( - 4.2, 1, 227, 4.2, 2, 228.2, 'wood' );
		b.balanceBeam( 3.4, 218, 3.4, 224, 1, - 1.2 );
		b.lamp( - 5.5, 1, 221, 5, '#9fd8ff' ); b.lamp( 5.5, 1, 221, 5, '#9fd8ff' );

		// T: Terminal 2, its quay; the pyramid, four storeys to the finish.
		b.box( - 60, - 3, 238, 60, 0, 380, { top: 'pav_light', side: 'concrete' } );
		for ( let x = - 58; x <= 58; x += 6 ) b.box( x - 0.3, 0, 238.2, x + 0.3, 0.6, 238.8, 'hazard' );
		b.stack( - 4.88, 256, true, 4, 1, [ 'c_blue', 'c_red', 'c_white', 'c_teal' ] );
		b.stack( - 4.88, 268.2, true, 4, 2, [ 'c_orange', 'c_green' ] );
		b.stack( - 4.88, 280.4, true, 4, 3, [ 'c_yellow', 'c_red', 'c_blue' ] );
		b.stack( - 4.88, 292.6, true, 4, 4, [ 'c_white', 'c_teal', 'c_orange', 'c_grey' ] );
		b.pipe( 3.6, 292.6, 3 * H, 4 * H, '-z' );
		b.sign( 0, 13.6, 304.7, 14, 3, 'LAST STOP', '#ff2e88', Math.PI );
		for ( let z = 242; z < 254; z += 4 ) {

			b.cone( - 6, 0, z );
			b.cone( 6, 0, z + 2 );

		}

		// The yard around it: warehouses that keep the lines the only lines, stacks, lamps.
		b.building( - 44, 20, - 12, 106, 11, 'metal', '', { roof: 'metal' } );
		b.sign( - 11.9, 8, 50, 16, 4, 'DOCK 9', '#ff2e88', Math.PI / 2 );
		b.building( 14, 0, 44, 60, 13, 'metal', '', { roof: 'metal' } );
		b.sign( 13.9, 9, 30, 18, 4, 'NIGHT FREIGHT', '#b6ff3b', - Math.PI / 2 );
		b.building( 12, 62, 44, 106, 12, 'metal', '', { roof: 'metal' } );
		b.sign( 11.9, 9, 84, 18, 4, 'RUNOFF FREIGHT', '#27e8ff', - Math.PI / 2 );
		for ( let i = 0; i < 6; i ++ ) b.stack( - 40 + i * 4.3, 124, true, 1, 1 + ( i % 3 ), [ b.pick( cols ), b.pick( cols ) ], 2 );
		for ( let i = 0; i < 5; i ++ ) b.stack( 14 + i * 4.3, 124, true, 1, 1 + ( ( i * 2 ) % 3 ), [ b.pick( cols ), b.pick( cols ) ], 2 );
		b.crates( - 20, 0, 150, 4 ); b.crates( 22, 0, 160, 3 );
		for ( const [ x, z ] of [ [ - 10, 0 ], [ 10, 20 ], [ - 10, 110 ], [ 10, 130 ], [ - 8, 160 ], [ 8, 160 ] ] ) b.lamp( x, 0, z, 8 );
		b.building( 16, 244, 50, 330, 14, 'metal', '', { roof: 'metal' } );
		b.sign( 15.9, 10, 280, 18, 4, 'TERMINAL 2', '#b6ff3b', - Math.PI / 2 );
		b.building( - 50, 248, - 16, 320, 12, 'metal', '', { roof: 'metal' } );
		for ( const [ x, z ] of [ [ - 10, 244 ], [ 10, 262 ], [ - 10, 290 ], [ 10, 320 ] ] ) b.lamp( x, 0, z, 8 );
		for ( const cx of [ - 26, 24 ] ) {

			b.lattice( cx - 1.2, 0, 256, cx + 1.2, 34, 258.4, 'beam_yellow', 'y', 3 );
			b.lattice( cx - 1.2, 0, 268, cx + 1.2, 34, 270.4, 'beam_yellow', 'y', 3 );
			b.lattice( cx - 1, 34, 244, cx + 1, 36, 306, 'beam_yellow', 'z', 3 );

		}

		// Far shores.
		b.backdrop( { x0: - 500, x1: 500, z0: 440, z1: 640, cell: 36, hMin: 15, hMax: 90, roofDeco: false, fill: 0.7 } );
		b.backdrop( { x0: - 300, x1: 300, z0: - 260, z1: - 60, cell: 30, hMin: 10, hMax: 40, fill: 0.6 } );

	},
};
