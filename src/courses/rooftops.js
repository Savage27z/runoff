// Rooftops (dusk): the first course, rebuilt for the Trizen runner. It teaches a move at each beat and offers a second
// line at the forks, built to docs/METRICS.md on a 3.1 m storey grid (roofs at 6.2, 9.8, 10.6, 11.2, 12.4, 16.2,
// 17.4, 18.6, 22.2 m). Courses run toward +z; facing +z, +x is on the runner's left, where the sea is.
//
//  A  start roof · slide under the duct, jump the gap
//  B  vault the parapet · fork: wall-run the tower on the left and kick off it, or swing the bar on the right
//  C  run up the 3.6 m wall to D, or climb its drainpipe
//  D  ride the zipline across the street down to E
//  E  slide, then slide-jump the long gap to F
//  F  fork down to G: drop onto the striped awning and bounce up onto H, or slide the pole down and climb the ladder
//  H  vault, then wall-run the tower on the right across to J
//  J  climb the ladder (or the pipe) two storeys to K
//  K  swing the bar across the gap to L
//  L  the big drop to M: roll it
//  M  run up the last wall to the finish on N

import { gate, hint } from './gates.js';

export const ROOFTOPS = {
	id: 'rooftops',
	name: 'Rooftops',
	tagline: 'Dusk over the old district',
	blurb: 'Learn to flow: slide, vault, wall-run, climb, ziplines, poles and bars.',
	theme: 'dusk',
	unlock: 0,
	// Rebuilt for the Trizen runner (the courses not yet rebuilt show as under construction).
	rebuilt: true,
	medals: [ 64, 55, 49, 45 ],
	spawn: { x: 0, y: 18.6, z: - 6, yaw: 0 },
	killY: 3,
	checkpoints: [
		gate( - 6, 6, 18.6, 31 ),
		gate( - 6, 6, 18.6, 62 ),
		gate( - 7, 7, 22.2, 86 ),
		gate( - 6, 6, 12.4, 128 ),
		gate( - 6, 6, 11.2, 152 ),
		gate( - 6, 6, 10.6, 188 ),
		gate( - 6, 6, 11.2, 224 ),
		gate( - 7, 7, 17.4, 246 ),
		gate( - 6, 6, 16.2, 274 ),
		gate( - 6, 6, 6.2, 294, { y0: 5.5, h: 12 } ),
		gate( - 7, 7, 9.8, 320, { h: 5 } ),
	],
	hints: [
		hint( - 14, 4, '<k>W A S D</k> run · <k>Mouse</k> look' ),
		hint( 4, 12, 'Hold <k>Shift</k> to <b>slide</b> under' ),
		hint( 14, 22, '<k>Space</k> to <b>jump</b> the gap' ),
		hint( 28, 35, 'Run into low walls to <b>vault</b>' ),
		hint( 38, 50, '← <b>Wall-run</b> the tower, <k>Space</k> to kick off it · or swing the <b>bar</b> →' ),
		hint( 64, 80, 'Jump <b>into</b> the tall wall to run up it · or climb the <b>drainpipe</b>' ),
		hint( 87, 96, 'Jump up at the <b>cable</b> to ride the zipline' ),
		hint( 128, 140, '<b>Slide</b>, then <k>Space</k>: carry the speed over the gap' ),
		hint( 153, 168, 'Drop onto the <b>awning</b> to bounce up · or grab the <b>pole</b> ←' ),
		hint( 199, 210, 'Wall on your right this time →' ),
		hint( 226, 238, 'Run into the <b>ladder</b> or the <b>pipe</b> to climb' ),
		hint( 247, 256, 'Jump at the <b>bar</b> to swing across' ),
		hint( 274, 282, 'Big drop: hold <k>Space</k> to <b>roll</b>' ),
		hint( 296, 306, 'Run up the last wall' ),
	],
	env: { water: { y: - 0.6 }, birds: [ 30, 22, 80 ] },
	build( b ) {

		// The street grid on the city side, the promenade and the sea on the left (+x).
		b.street( 0, 0, [ - 700, 56, - 700, 700 ] );
		b.box( 56, - 3, - 400, 63, 0.05, 700, { top: 'pav_light', side: 'concrete' }, { collide: false } );
		b.box( 63, - 3, - 400, 64, 0.9, 700, { top: 'parapet', side: 'concrete' }, { collide: false } );
		for ( let z = - 60; z < 380; z += 18 ) b.palm( 59.5, 0.05, z, 6 + b.r( 0, 2 ) );
		for ( let z = - 40; z < 360; z += 36 ) b.lamp( 62.3, 0, z + 9, 6 );
		for ( let z = - 40; z < 350; z += 22 ) b.tree( - 13.6, 0, z, 0.8 );
		b.streetLife( { x: - 11, from: - 40, to: 340, cars: 14, trees: false } );
		for ( const z of [ 25, 53, 108, 143, 214, 264 ] ) b.streetLife( { z, from: - 60, to: 50, cars: 3, trees: false } );

		// A: the start roof, the duct to slide under, the first gap.
		b.building( - 7, - 12, 7, 22, 18.6, 'fac_coral', 's', { roof: 'pav_warm' } );
		b.railing( - 6.85, - 12, - 6.85, 22, 18.6 ); b.railing( 6.85, - 12, 6.85, 22, 18.6 );
		b.housing( - 6.5, - 11, - 3.5, - 8, 18.6, 2.6, 'fac_peach' );
		b.ac( 5, 18.6, - 6 ); b.antenna( 5.5, 18.6, - 10, 7 ); b.vent( - 5, 18.6, 4 );
		b.duct( - 7, 19.55, 12, 7, 20.3, 12.8 );
		b.box( - 6.9, 18.6, 12.2, - 6.5, 19.55, 12.6, 'steel' ); b.box( 6.5, 18.6, 12.2, 6.9, 19.55, 12.6, 'steel' );

		// B: the parapet to vault; the fork at its end.
		b.building( - 6, 27, 6, 50, 18.6, 'fac_peach', '', { roof: 'pav_lav' } );
		b.railing( - 5.85, 27, - 5.85, 46, 18.6 ); b.railing( 5.85, 27, 5.85, 43, 18.6 );
		b.box( - 6, 18.6, 35, 6, 19.6, 35.35, 'parapet' );
		b.ac( - 4.4, 18.6, 41 );
		// The left line: the tower's wall to run along (its face at x = 6).
		b.building( 6, 44, 12, 70, 32, 'fac_office', '', { roof: 'pav_light' } );
		b.arrow( 5.94, 20.4, 52, 5, 1.2, - Math.PI / 2, '#ffb020' );
		b.sign( 5.93, 24.6, 54, 9, 2.2, 'RUN THE WALL', '#27e8ff', - Math.PI / 2 );
		// The right line: a swing bar over the gap, on a steel gantry from the street.
		b.swingBar( - 5, 51.4, - 1.5, 51.4, 20.9, 0 );

		// C: a skylight, then D's wall: 3.6 m to run up, or its drainpipe.
		b.building( - 6, 56, 6, 80, 18.6, 'fac_sky', '', { roof: 'pav_light' } );
		b.railing( - 5.85, 56, - 5.85, 80, 18.6 ); b.railing( 5.85, 70, 5.85, 80, 18.6 );
		b.box( - 5, 18.6, 64, - 2.4, 18.85, 70, { top: 'glass', side: 'steel' } );
		b.ac( 4.4, 18.6, 74 );

		// D: up 3.6 m, the zipline's mast at its far end.
		b.building( - 7, 80, 7, 100, 22.2, 'fac_brick', '', { roof: 'pav_mint' } );
		b.railing( - 6.85, 80, - 6.85, 100, 22.2 ); b.railing( 6.85, 80, 6.85, 100, 22.2 );
		b.pipe( - 4, 80, 18.6, 22.2, '-z' );
		b.waterTower( - 4.2, 22.2, 92 );
		b.antenna( 5.6, 22.2, 84, 5 );
		// The zipline: from over D's end, across the street, down to E.
		b.zipline( [ 2, 25.4, 93 ], [ 2, 15.1, 122.5 ] );

		// E: lands off the zipline; the duct to slide under; the long gap to F.
		b.building( - 6, 116, 6, 140, 12.4, 'fac_lemon', '', { roof: 'pav_warm' } );
		b.railing( - 5.85, 116, - 5.85, 140, 12.4 ); b.railing( 5.85, 116, 5.85, 140, 12.4 );
		b.duct( - 6, 13.35, 132, 6, 14.1, 132.8 );
		b.vent( - 4.6, 12.4, 120 );

		// F: the fork down to G.
		b.building( - 6, 146.5, 6, 168, 11.2, 'fac_mint', '', { roof: 'pav_lav' } );
		b.railing( - 5.85, 146.5, - 5.85, 162, 11.2 ); b.railing( 5.85, 146.5, 5.85, 168, 11.2 );
		b.ac( 4.2, 11.2, 156 );
		// The safe line: the pole down to G (on the right).
		b.pole( - 4, 169.6, 6.2, 12.8 );

		// G: two storeys down; the striped awning to bounce off up onto H, H's ladder for the pole's line.
		b.building( - 6, 168, 6, 179, 6.2, 'fac_brick2', '', { roof: 'pav_warm' } );
		b.railing( - 5.85, 168, - 5.85, 179, 6.2 ); b.railing( 5.85, 168, 5.85, 179, 6.2 );
		b.awning( - 2.6, 170, 2.6, 176.5, 7.0, 'canvas_red' );
		for ( const [ x, z ] of [ [ - 2.4, 170.2 ], [ 2.4, 170.2 ], [ - 2.4, 176.3 ], [ 2.4, 176.3 ] ] ) b.box( x - 0.05, 6.2, z - 0.05, x + 0.05, 6.88, z + 0.05, 'rail' );

		// H: vault the parapet; the tower on the right to run along to J.
		b.building( - 6, 179, 6, 210, 10.6, 'fac_peach', '', { roof: 'pav_warm' } );
		b.railing( 5.85, 179, 5.85, 210, 10.6 );
		b.ladder( - 4, 179, 6.2, 4.4, '-z' );
		b.box( - 6, 10.6, 197, 6, 11.6, 197.35, 'parapet' );
		b.building( - 12, 206, - 6, 232, 30, 'fac_office', '', { roof: 'pav_light' } );
		b.arrow( - 5.94, 12.4, 214, 5, 1.2, Math.PI / 2, '#ffb020' );

		// J: a storey lower; K's wall two storeys up: its ladder or its pipe.
		b.building( - 6, 213.5, 6, 238, 11.2, 'fac_sky', '', { roof: 'pav_light' } );
		b.railing( 5.85, 213.5, 5.85, 238, 11.2 );
		b.ac( 4, 11.2, 224 ); b.vent( - 3.6, 11.2, 228 );
		b.building( - 7, 238, 7, 256, 17.4, 'fac_brick', '', { roof: 'pav_mint' } );
		b.railing( - 6.85, 238, - 6.85, 256, 17.4 ); b.railing( 6.85, 238, 6.85, 256, 17.4 );
		b.ladder( 2, 238, 11.2, 6.2, '-z' );
		b.pipe( - 3, 238, 11.2, 17.4, '-z' );
		b.antenna( - 5.8, 17.4, 242, 5 );

		// K to L: a swing bar over the gap.
		b.swingBar( - 2, 257.6, 2, 257.6, 19.7, 0 );

		// L: the big drop; M; N, 3.6 m up, the finish.
		b.building( - 6, 264, 6, 282, 16.2, 'fac_lemon', '', { roof: 'pav_warm' } );
		b.railing( - 5.85, 264, - 5.85, 282, 16.2 ); b.railing( 5.85, 264, 5.85, 282, 16.2 );
		b.building( - 6, 288, 6, 306, 6.2, 'fac_mint', '', { roof: 'pav_lav' } );
		b.railing( - 5.85, 288, - 5.85, 306, 6.2 ); b.railing( 5.85, 288, 5.85, 306, 6.2 );
		b.building( - 7, 306, 7, 330, 9.8, 'fac_office', 'n', { roof: 'pav_light' } );
		b.railing( - 6.85, 306, - 6.85, 330, 9.8 ); b.railing( 6.85, 306, 6.85, 330, 9.8 );
		b.housing( 3.5, 323, 6.6, 329.5, 9.8, 3, 'fac_coral' );
		b.sign( 0, 14.8, 329.2, 12, 3, 'RUNOFF', '#ff5a1f', Math.PI );

		// The city around it (the sea side kept open).
		const avoid = [ [ - 15, - 20, 15, 340 ] ];
		b.backdrop( { x0: - 140, x1: 50, z0: - 120, z1: 440, avoid, hMin: 10, hMax: 42 } );
		b.backdrop( { x0: - 380, x1: 50, z0: 440, z1: 700, cell: 40, hMin: 20, hMax: 90, roofDeco: false } );
		b.backdrop( { x0: - 380, x1: 50, z0: - 400, z1: - 120, cell: 40, hMin: 20, hMax: 90, roofDeco: false } );
		b.backdrop( { x0: - 380, x1: - 140, z0: - 120, z1: 440, cell: 40, hMin: 20, hMax: 90, roofDeco: false } );

	},
};
