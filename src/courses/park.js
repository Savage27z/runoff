// Concrete Park (day): brutalist terraces by the river, rebuilt for the Trizen runner. More than one line everywhere:
// down the skate bank, the stairs or the drop; over the alley or swinging across it; up to the walkway and the brick
// roof's zipline, or through the street below; across the river on the footbridge or hopping the pylons; and the long
// ramp to slide down to the finish. Built to docs/METRICS.md. Courses run toward +z; facing +z, +x is on the runner's
// left.
//
//  T1      the start terrace (6 m) · down to T2: slide the skate bank on the left, the stairs, or drop
//  T2      jump the alley · or swing the bar on the right
//  T3      fork: run up the plinth on the left to the walkway and the brick roof (the zipline over the plaza, the
//          pole down, or drop and roll), or drop to the street ahead (the rail to vault, the duct to slide under, the
//          stairs up)
//  plaza   both lines meet
//  river   the footbridge (slide under its gantry) · or hop the pylons on the left
//  bank    jump the gap, up the plinth (run up it, or its drainpipe) to the walkway, the brick roof, the ramp down to
//          the finish

import { gate, hint } from './gates.js';

// The river's pylons on the left of the footbridge: 4 m long, 2.5 m apart (a running jump's length apart, so a hop
// lands about where the last one took off), stepping up 0.3 m each from 1.2 m to the far bank's 3 m.
const PYLONS = Array.from( { length: 7 }, ( _, i ) => ( { z: 161 + i * 6.5, top: 1.2 + i * 0.3 } ) );

export const PARK = {
	id: 'park',
	name: 'Concrete Park',
	tagline: 'Terraces by the river, golden afternoon',
	blurb: 'A skate bank, the alley, the walkway or the street, the pylons over the river, the long slide home.',
	theme: 'day',
	unlock: 5,
	rebuilt: true,
	medals: [ 58, 49.5, 44, 40.5 ],
	spawn: { x: 0, y: 6, z: - 8, yaw: 0 },
	killY: - 1.4,
	env: { water: { y: - 1.5 }, birds: [ 0, 20, 150 ], hills: { radius: 1400, height: [ 40, 110 ] } },
	// The street and the promenade are the only ground on the route: down anywhere else (the alleys, under the far
	// walkway) is a fall.
	isDead: ( feet ) => feet.y < 1 && ( feet.z < 63.5 || ( feet.z > 207.5 && feet.z < 311.5 ) ),
	checkpoints: [
		gate( - 12, 12, 3, 20 ),
		gate( - 12, 12, 3, 44 ),
		gate( - 16, 16, 1.5, 110, { y0: 0, h: 9, vis: [ - 8, 8 ] } ),
		gate( - 10, 12, 0, 147 ),
		gate( - 4, 10, 3, 184, { y0: 1, spawnX: 0, vis: [ - 3, 3 ] } ),
		gate( - 14, 14, 3, 220 ),
		gate( - 14, 14, 3, 246 ),
		gate( - 8, 10, 6.6, 300 ),
		gate( - 14, 14, 1.5, 330, { h: 6 } ),
	],
	hints: [
		hint( - 14, 2, 'Concrete Park: more than one line everywhere' ),
		hint( 3, 10, '← Hold <k>Shift</k> to <b>slide</b> down the skate bank · stairs · or drop' ),
		hint( 26, 34, 'Jump the alley · or swing the <b>bar</b> →' ),
		hint( 39, 47, '← Run up the plinth or its <b>ladder</b> to the walkway · or drop to the street ahead' ),
		hint( 66, 84, 'Vault the rail · hold <k>Shift</k> to <b>slide</b> under the duct', - 1, 2 ),
		hint( 84, 92, '← Jump up at the <b>cable</b>: ride it over the plaza', 5, 10 ),
		hint( 93, 102, 'Grab the <b>pole</b> down · or drop and <b>roll</b> (hold <k>Space</k>)', 5, 10, 0, 16 ),
		hint( 146, 158, 'The footbridge · or hop the <b>pylons</b> ←' ),
		hint( 185, 192, 'Hold <k>Shift</k>: <b>slide</b> under the gantry', 2, 6, - 3, 3 ),
		hint( 244, 256, 'Run up the plinth · or climb its <b>drainpipe</b> ←' ),
		hint( 300, 312, 'Hold <k>Shift</k>: <b>slide</b> the ramp down to the finish' ),
	],
	build( b ) {

		// The ground, the river's edge, the far bank.
		b.box( - 70, - 3, - 45, 70, 0, 158, { top: 'pav_light', side: 'conc' } );
		b.meshRail( - 70, 157.8, - 3.4, 157.8, 0 ); b.meshRail( 3.4, 157.8, 6, 157.8, 0 ); b.meshRail( 10, 157.8, 70, 157.8, 0 );
		for ( let x = - 60; x <= 60; x += 12 ) if ( Math.abs( x ) > 14 ) b.lamp( x, 0, 156.6, 5, '#ffe3b0' );
		b.box( - 70, - 3, 208, 70, 0, 360, { top: 'pav_light', side: 'conc' } );

		// T1: the start terrace, the bowl beside it, the block behind.
		b.terrace( - 9, - 12, 9, 10, 6, 'pav_light' );
		b.terrace( - 24, - 12, - 9, - 9, 6 ); b.terrace( - 24, 5, - 9, 10, 6 ); b.terrace( - 24, - 9, - 19, 5, 6 );
		b.bowl( - 19, - 9, - 9, 5, 6, 1.8 );
		b.concPlanter( 5, - 11, 8.6, - 6.5, 6 );
		b.bench( - 7.6, 6, - 2, 1 );
		b.meshRail( 8.9, - 12, 8.9, 2, 6 ); b.meshRail( - 23.9, - 12, - 23.9, 10, 6 );
		b.vines( - 24, 10.02, - 9, 10.02, 6, { density: 0.8, len: [ 1, 3.2 ], out: [ 0, 1 ] } );
		b.building( - 12, - 28, 8, - 12, 15, 'fac_conc', '', { roof: 'pav_light', trim: 'conc' } );
		b.fireEscape( 8, - 24, 0, 15, 1 );
		// Down to T2: the skate bank (left), the stairs (middle), the plain drop (right).
		b.ramp( 4, 9, 10, 18, 6, 3, 0 );
		b.stairs( - 3, 3, 14.5, 3, 20, { rise: 0.15, run: 0.225, dir: - 1, base: 0 } );

		// T2: planters to vault; the alley after it, its bar on the right.
		b.terrace( - 12, 14, 12, 34, 3, 'pav_warm' );
		b.concPlanter( - 3, 25, 3, 26.2, 3, 0.9, { tree: false } );
		b.concPlanter( - 11.4, 15, - 7, 21, 3 ); b.concPlanter( 8, 27, 11.4, 32, 3 );
		b.meshRail( - 11.9, 14, - 11.9, 34, 3 ); b.meshRail( 11.9, 14, 11.9, 34, 3 );
		b.vines( - 12, 34.02, 12, 34.02, 3, { density: 0.7, len: [ 0.6, 2.4 ], out: [ 0, 1 ] } );
		b.dumpster( 8.5, 36.4 ); b.crates( - 3, 0, 36.6, 2 );
		b.swingBar( - 8, 35, - 4.5, 35, 5.3, 0 );

		// T3: the plinth up to the bridge walkway (its face 3.6 m: run up it, or its ladder), the block on the right.
		b.terrace( - 12, 39, 12, 64, 3, 'pav_light' );
		b.building( - 12, 46, - 4, 60, 10, 'fac_conc2', '', { roof: 'pav_light', trim: 'conc' } );
		b.box( 4, 3, 47.5, 8, 6.6, 51.2, { top: 'pav_light', side: 'conc' } );
		b.ladder( 7.2, 47.5, 3, 3.6, '-z' );
		b.walkway( 4, 8, 51.2, 82, 6.6 );
		b.meshRail( 11.9, 39, 11.9, 64, 3 );
		b.vines( 4, 51.2, 4, 82, 6.15, { density: 0.35, len: [ 0.8, 2.5 ], out: [ - 1, 0 ] } );

		// The street (z 64 .. 104): the rail to vault, the pipe to slide under, the stairs up to the plaza.
		b.building( - 34, 64, - 12, 102, 12, 'fac_redbrick', '', { roof: 'roof' } );
		b.fireEscape( - 12, 66, 0, 12, 1 ); b.fireEscape( - 12, 92, 0, 12, 1 );
		b.meshRail( - 12, 74, 16, 74, 0, 1.0 );
		b.duct( - 12, 1.0, 86, 2, 1.7, 86.8 );
		b.box( 1.6, 0, 86, 2, 1.0, 86.8, 'steel' );
		b.sign( - 5, 3, 86.9, 6, 1.4, 'LOW CLEARANCE', '#ffb020', Math.PI, { font: 'bold 110px Anton, Impact, sans-serif' } );
		b.stairs( - 10, - 4, 98, 0, 10, { rise: 0.15, run: 0.4, dir: 1, land: 0.5 } );
		for ( const z of [ 70, 80, 92 ] ) b.cone( - 1.5, 0, z );

		// The brick roof at the walkway's end: the zipline over the plaza, or its pole down.
		b.building( 2, 82, 16, 102, 6.6, 'fac_redbrick', '', { roof: 'roof' } );
		b.ac( 13.5, 6.6, 85 ); b.vent( 14.5, 6.6, 97 );
		b.zipline( [ 9, 9, 92 ], [ 9, 4.1, 138 ] );
		b.meshRail( 2.2, 82, 2.2, 102, 6.6 );
		b.pole( 6, 103.6, 1.5, 8.2 );

		// The plaza.
		// (Its edge steps back where the street's stairs land on it, so the runner meets the stairs' landing first.)
		b.terrace( - 16, 102.25, 16, 142.5, 1.5, 'pav_light' );
		b.terrace( - 16, 102, - 10, 102.25, 1.5, 'pav_light' ); b.terrace( - 4, 102, 16, 102.25, 1.5, 'pav_light' );
		b.concPlanter( - 15.4, 110, - 11, 117, 1.5 ); b.concPlanter( 11, 119, 15.4, 126, 1.5 );
		b.concPlanter( - 3, 124, 3, 125.4, 1.5, 0.9, { tree: false } );
		b.concPlanter( - 15.4, 130, - 11, 137, 1.5 );
		b.bench( 12.5, 1.5, 112, 1 ); b.bench( - 9, 1.5, 128, 0 );
		for ( const [ x, z ] of [ [ - 6, 118 ], [ - 6, 138 ] ] ) b.lamp( x, 1.5, z, 5, '#ffe3b0' );
		b.stairs( - 8, 12, 145, 0, 10, { rise: 0.15, run: 0.25, dir: - 1 } );

		// The promenade; the footbridge over the river with its gantry to slide under; the pylons on its left.
		for ( const x of [ - 30, - 18, 18, 30 ] ) b.tree( x, 0, 150, 1.2 );
		b.stairs( - 3, 3, 149.5, 0, 20, { rise: 0.15, run: 0.4, dir: 1, land: 0.5 } );
		b.walkway( - 3, 3, 157.75, 210, 3, { columns: 12 } );
		b.box( - 3, 4.0, 191.6, 3, 4.6, 192.4, { side: 'conc', top: 'trim_yellow', bottom: 'conc' }, { keepBottom: true } );
		for ( const x of [ - 2.8, 2.8 ] ) b.box( x - 0.2, 3, 191.7, x + 0.2, 4.0, 192.3, 'conc' );
		for ( let z = 158.5; z < 208; z += 12 ) b.box( - 0.7, - 3, z - 0.2, 0.7, 0, z + 0.9, 'conc' );
		for ( const { z, top } of PYLONS ) b.box( 6.8, - 3, z, 9.2, top, z + 4, { top: 'pav_light', side: 'conc' }, { shade: [ 0.5, 1 ] } );

		// The far bank: T4, the gap to T5, the plinth up to the walkway (its face 3.6 m: run up it, or its drainpipe), the
		// brick roof, the ramp down, the finish plaza.
		b.terrace( - 14, 208, 14, 232, 3, 'pav_warm' );
		b.concPlanter( - 13, 214, - 8.5, 221, 3 ); b.concPlanter( 8.5, 222, 13, 229, 3 );
		b.concPlanter( - 2.5, 223, 2.5, 224.2, 3, 0.9, { tree: false } );
		b.meshRail( - 13.9, 208, - 13.9, 232, 3 ); b.meshRail( 13.9, 208, 13.9, 232, 3 );
		b.terrace( - 14, 236.5, 14, 256, 3, 'pav_light' );
		b.building( - 14, 240, - 5, 254, 11, 'fac_conc', '', { roof: 'pav_light', trim: 'conc' } );
		b.concPlanter( 6, 241, 13, 246, 3 );
		b.box( - 2.5, 3, 256, 2.5, 6.6, 261.25, { top: 'pav_light', side: 'conc' } );
		b.pipe( 1.6, 256, 3, 6.6, '-z' );
		b.walkway( - 2.5, 2.5, 261.25, 290, 6.6 );
		b.building( - 8, 290, 10, 310, 6.6, 'fac_redbrick', '', { roof: 'roof' } );
		b.ac( 6.5, 6.6, 296 ); b.vent( - 6, 6.6, 300 );
		b.ramp( - 3, 3, 310, 324, 6.6, 1.5, 0 );
		b.terrace( - 14, 312, 14, 345, 1.5, 'pav_lav' );
		b.concPlanter( - 13.4, 318, - 9, 325, 1.5 ); b.concPlanter( 9, 334, 13.4, 341, 1.5 );
		b.bunting( - 10, 6.5, 336, 10, 6.5, 336, { n: 16, sag: 0.7 } );
		for ( const [ x, z ] of [ [ - 6, 322 ], [ 6, 338 ] ] ) b.lamp( x, 1.5, z, 5, '#ffe3b0' );
		b.building( - 44, 214, - 18, 260, 20, 'fac_redbrick', '', {} );
		b.building( 18, 214, 44, 250, 26, 'fac_conc2', '', { roof: 'pav_light', trim: 'conc' } );
		b.building( 18, 262, 40, 300, 18, 'fac_brick2', '', {} );
		b.fireEscape( 18, 268, 0, 15, - 1 );

		// The blocks around it, the far shores, the road bridge downriver.
		b.building( 18, - 30, 40, 20, 22, 'fac_conc', '', { roof: 'pav_light', trim: 'conc' } );
		b.building( 18, 30, 36, 64, 16, 'fac_redbrick', '', {} );
		b.building( 22, 104, 44, 140, 26, 'fac_conc2', '', { roof: 'pav_light', trim: 'conc' } );
		b.building( - 48, 108, - 24, 140, 20, 'fac_brick2', '', {} );
		b.building( - 48, - 30, - 28, 40, 18, 'fac_redbrick', '', {} );
		b.fireEscape( 18, 36, 0, 15, - 1 );
		b.backdrop( { x0: - 200, x1: 200, z0: - 220, z1: - 40, cell: 30, hMin: 14, hMax: 50, fill: 0.7 } );
		b.backdrop( { x0: - 500, x1: 500, z0: 400, z1: 700, cell: 34, hMin: 20, hMax: 110, fill: 0.75, roofDeco: false, facades: [ 'fac_conc', 'fac_conc2', 'fac_office', 'fac_grey', 'fac_redbrick', 'fac_brick2' ] } );
		b.backdrop( { x0: - 300, x1: - 50, z0: 210, z1: 400, cell: 34, hMin: 14, hMax: 60, fill: 0.7, roofDeco: false } );
		b.backdrop( { x0: 50, x1: 300, z0: 210, z1: 400, cell: 34, hMin: 14, hMax: 60, fill: 0.7, roofDeco: false } );
		b.box( - 900, 16, 150, - 300, 17.2, 214, { top: 'asphalt', side: 'conc', bottom: 'conc' }, { collide: false, keepBottom: true } );

	},
};
