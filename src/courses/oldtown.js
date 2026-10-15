// Old Town (haze): the lantern quarter, rebuilt for the Trizen runner. Tiled roofs to run up and over, and a choice at
// every drop and climb: drop and roll or the pole, run up the wall or the stairs, catch the eaves or the ladder,
// wall-run the tall block or walk the beam, ride the cable over the canal or cross the bridge, bounce off the awning
// or climb the ladder, drop off the temple or the pole. Built to docs/METRICS.md. Courses run toward +z; facing +z, +x
// is on the runner's left.
//
//  S0      the poster block (12 m): the start
//  S1, S2  timber houses: run up and over the ridges
//  C       the courtyard (1.5 m): drop and roll, or the pole down on the right
//  T       the terrace (5 m): run up its 3.5 m wall, or the stairs on the right
//  H3      catch its eaves, or the ladder on the right; over the ridge to the shrine
//  shrine  the platform under the torii (8 m)
//  lane    L1, L2 over the ridges; the drying decks L3 and L4 (6.8 m) either side of a lane: wall-run the tall block
//          on the left and kick off it, or walk the beam on the right
//  canal   from L4 ride the cable over it, or drop to the stone bridge
//  market  stalls under bouncing awnings; bounce off the last one up onto the poster block P (8 m), or its ladder
//  temple  over its roof: drop and roll to the plaza, or the pole on the right; the finish under the great torii

import * as THREE from 'three';
import { gate, hint } from './gates.js';
import { townFill } from './town.js';

// The drying decks either side of the lane, and the tall block on its left.
const DECK = 6.8;

export const OLDTOWN = {
	id: 'oldtown',
	name: 'Old Town',
	tagline: 'Lantern quarter in the haze',
	blurb: 'Tiled roofs, a wall-run over the lane, a cable over the canal, the market\'s awnings and the temple.',
	theme: 'haze',
	unlock: 7,
	rebuilt: true,
	medals: [ 58, 50, 44.5, 41 ],
	spawn: { x: 0, y: 12, z: - 6, yaw: 0 },
	killY: - 0.8,
	// The streets are the only ground: down there is a fall.
	isDead: ( feet ) => feet.y < 1,
	env: { water: { y: - 1.2 }, birds: [ 0, 30, 160 ], hills: { radius: 650, count: 18, height: [ 140, 320 ] }, clouds: 18 },
	checkpoints: [
		gate( - 15, 15, 1.5, 56, { h: 9 } ),
		gate( - 15, 15, 5, 88 ),
		gate( - 8, 8, 8, 116 ),
		gate( - 6, 4.5, DECK, 157.5 ),
		gate( - 6, 4.5, DECK, 177 ),
		gate( - 5, 5, 3, 202, { h: 7 } ),
		gate( - 12, 12, 3, 236 ),
		gate( - 6, 6, 8, 266 ),
		gate( - 14, 14, 3, 322, { h: 6 } ),
	],
	hints: [
		hint( - 14, 12, 'Old Town: roofs are ramps, run up and over the ridges' ),
		hint( 38, 44, 'Drop and <b>roll</b> (hold <k>Space</k>) · or grab the <b>pole</b> →', 6 ),
		hint( 64, 79, 'Jump <b>into</b> the wall to run up it · or take the stairs →', 0, 4 ),
		hint( 86, 95, 'Jump at the eaves from a few steps out · or the <b>ladder</b> →', 4, 8 ),
		hint( 155, 166, '← <b>Wall-run</b> the tall block, <k>Space</k> to kick off · or walk the <b>beam</b> →', 6 ),
		hint( 174, 182, 'Jump up at the <b>cable</b>: ride it over the canal · or drop to the bridge', 6 ),
		hint( 238, 248, 'Jump on the <b>awning</b>: bounce up onto the roof · or the <b>ladder</b> ←', 2, 6 ),
		hint( 291, 299, 'Drop and <b>roll</b> · or grab the <b>pole</b> →', 8 ),
	],
	build( b ) {

		// The streets (the canal cut out): falling into a street means a respawn.
		b.box( - 90, - 3, - 60, 90, 0, 186, { top: 'pav_warm', side: 'stone' } );
		b.box( - 90, - 3, 218, 90, 0, 420, { top: 'pav_warm', side: 'stone' } );
		for ( const z of [ 186, 218 ] ) b.box( - 90, - 3, z - 1, 90, 0.6, z + 1, { top: 'stone', side: 'stone' }, { collide: false } );

		// S0: the modern block with posters, its scaffolding, a water tank on the roof.
		b.building( - 6, - 12, 6, 12, 12, 'fac_conc2', '', { roof: 'pav_light', trim: 'trim_green' } );
		b.poster( 6.03, 8, - 4, 3, 4.2, Math.PI / 2, 0 ); b.poster( - 6.03, 7, 2, 3, 4.2, - Math.PI / 2, 1 ); b.poster( 0, 9, - 12.03, 4, 5, Math.PI, 2 );
		b.scaffold( - 8.4, - 10, - 6, 10, 0, 13.5 );
		b.put( new THREE.CylinderGeometry( 1.3, 1.3, 2.6, 18 ), 'metal', - 3.4, 13.9, - 8.5, 1, 1, 1 );
		b.w.col.add( - 4.7, 12, - 9.8, - 2.1, 15.2, - 7.2, 'metal' );
		b.meshRail( - 5.9, - 12, - 5.9, 12, 12 ); b.meshRail( 5.9, - 12, 5.9, 12, 12 );

		// S1, S2: timber houses to run up and over.
		b.house( - 7, 15, 7, 29, 10, 2.6, 'x', 'fac_shoji', 'tile_roof' );
		b.house( - 6, 32, 6, 44, 8.5, 2.4, 'x', 'fac_shoji2', 'tile_roof' );
		b.lanternLine( - 7, 12.6, 30.5, 6, 12.2, 30.5, { n: 6 } );
		// The pole down to the courtyard (on the right).
		b.pole( - 3, 45.6, 1.5, 10.2 );

		// C: the clay courtyard behind stone walls; boulders, stone lanterns.
		b.box( - 15, 0, 45, 15, 1.5, 80, { top: 'clay', side: 'stone' } );
		b.rock( - 6, 1.5, 58, 1.3 ); b.rock( 6, 1.5, 63, 1.0 ); b.rock( 0.5, 1.5, 67, 0.75 ); b.rock( 10, 1.5, 70, 1.1 );
		for ( const [ x, z ] of [ [ - 13, 49 ], [ 13, 49 ], [ - 13.4, 66 ], [ 13, 76 ] ] ) b.stoneLantern( x, 1.5, z );
		b.tree( - 12.5, 1.5, 58, 1.1 ); b.tree( 11.5, 1.5, 54, 0.9 );
		// The main hall on the left: a stone base, the timber body, tiered roofs.
		b.box( 15, 0, 40, 42, 6, 126, { side: 'stone', top: 'pav_warm' } );
		b.house( 17, 44, 40, 122, 16, 4, 'z', 'fac_shoji3', 'tile_roof', { base: 6 } );
		b.house( 22, 60, 35, 106, 24, 3.5, 'z', 'fac_shoji', 'tile_roof', { base: 20, walk: false } );
		for ( let z = 50; z < 120; z += 8 ) b.lantern( 15.9, 14.2, z, 'lantern_red', 1.2 );

		// T: the terrace, 3.5 m over the courtyard: its wall to run up, its stairs on the right. (Where the stairs land
		// its edge steps back, so the runner meets the stairs' landing first.)
		b.stairs( - 11, - 6, 70, 1.5, 25, { rise: 0.14, run: 0.4, dir: 1, land: 0.5 } );
		b.box( - 15, 0, 80, - 11, 5, 96, { top: 'pav_warm', side: 'stone' } );
		b.box( - 11, 0, 80.25, - 6, 5, 96, { top: 'pav_warm', side: 'stone' } );
		b.box( - 6, 0, 80, 15, 5, 96, { top: 'pav_warm', side: 'stone' } );
		for ( const x of [ - 13, 9 ] ) { b.lantern( x, 7.8, 88, 'lantern_warm', 1 ); b.put( new THREE.CylinderGeometry( 0.06, 0.06, 2.6, 6 ), 'timber', x, 6.3, 88, 1, 1, 1 ); }
		b.house( - 15, 84, - 8.5, 94, 8, 1.8, 'z', 'fac_shoji2', 'tile_roof3' );
		b.house( 9.5, 84, 15, 94, 8, 1.8, 'z', 'fac_shoji', 'tile_roof3' );

		// H3: its eaves 2.5 m up to catch, or its ladder on the right; S6 the shrine platform beyond.
		b.house( - 7, 96, 7, 107, 7.5, 2.2, 'x', 'fac_shoji3', 'tile_roof2' );
		b.ladder( - 4, 96, 5, 2.5, '-z' );
		b.box( - 8, 0, 110, 8, 8, 126, { top: 'pav_light', side: 'stone' } );
		b.torii( 0, 8, 118, 6, 4.2 );
		b.stoneLantern( - 6.5, 8, 113 ); b.stoneLantern( 6.5, 8, 113 );

		// The lantern lane: L1 and L2 over the ridges, the drying decks L3 and L4, the tall block on the left (its face at
		// x 4.5) to wall-run across the lane between them, the beam on the right.
		b.house( - 6, 129, 6, 139, 7.5, 1.6, 'x', 'fac_shoji', 'tile_roof' );
		b.house( - 6, 142, 6, 152, 8, 2.4, 'x', 'fac_shoji2', 'tile_roof3' );
		for ( const [ z0, z1 ] of [ [ 155, 166 ], [ 172.5, 185 ] ] ) {

			b.box( - 6, 0, z0, 4.5, DECK, z1, { side: 'fac_shoji3', top: 'wood' }, { shade: [ 0.4, 1 ], surface: 'wood' } );
			b.box( - 6.12, DECK - 0.35, z0 - 0.12, 4.5, DECK, z1 + 0.12, 'timber', { collide: false } );
			b.stringLights( - 5.6, DECK + 2.2, z0 + 1, - 5.6, DECK + 2.2, z1 - 1, { n: 10, sag: 0.4, glow: false } );

		}

		b.balanceBeam( - 4, 166, - 4, 172.5, DECK, 0, { width: 0.3 } );
		b.building( 4.5, 154, 10, 186, 16, 'fac_conc', '', { roof: 'pav_light', trim: 'trim_green' } );
		b.poster( 4.47, 11, 168, 3, 4, - Math.PI / 2, 3 ); b.poster( 4.47, 11, 178, 3, 4, - Math.PI / 2, 1 );
		b.arrow( 4.45, DECK + 2.2, 167, 4.5, 1.1, - Math.PI / 2, '#ffb020' );
		b.lanternLine( - 6, 10.8, 140.5, 6, 10.8, 140.5, { n: 6 } );
		b.lanternLine( - 6, 11.4, 153.5, 4.4, 11.4, 153.5, { n: 5 } );
		b.lanternLine( - 6, 11.2, 169, 4.4, 11.6, 169, { n: 5, sag: 1.2 } );

		// The canal: the stone bridge (3 m), and the cable from L4 over it to the market.
		b.box( - 5, 0.6, 186, 5, 3, 218, { top: 'pav_light', side: 'stone', bottom: 'stone' }, { keepBottom: true } );
		b.box( - 5, - 2, 197, 5, 0.6, 207, 'stone', { collide: false } );
		b.box( - 5.3, 3, 186, - 5, 4, 218, 'stone' ); b.box( 5, 3, 186, 5.3, 4, 218, 'stone' );
		for ( const z of [ 190, 202, 214 ] ) b.stoneLantern( - 4.3, 3, z );
		b.zipline( [ 0, DECK + 2.4, 180 ], [ 0, 5.6, 222 ], { side: 2.5 } );

		// The market: stalls under awnings that bounce, crates to vault; the last awning in the street throws the
		// runner up onto P, or P's ladder (on the left).
		b.box( - 12, 0, 218, 12, 3, 254, { top: 'pav_warm', side: 'stone' } );
		for ( let z = 222; z < 246; z += 7 ) {

			b.house( - 12, z, - 8, z + 5, 5.4, 1.2, 'z', 'fac_shoji2', 'tile_roof3', { base: 3, walk: false } );
			b.house( 8, z, 12, z + 5, 5.4, 1.2, 'z', 'fac_shoji', 'tile_roof', { base: 3, walk: false } );
			b.awning( - 8, z + 0.5, - 6, z + 4.5, 4.4, z % 2 ? 'canvas_red' : 'canvas_blue' );
			b.awning( 6, z + 0.5, 8, z + 4.5, 4.4, z % 2 ? 'canvas_green' : 'canvas_yellow' );

		}

		b.crates( - 3.5, 3, 240, 3 ); b.crates( 3, 3, 232, 2 );
		b.lanternLine( - 8, 7.5, 229, 8, 7.5, 229, { n: 6 } ); b.lanternLine( - 8, 7.5, 243, 8, 7.5, 243, { n: 6 } );
		b.awning( - 2.5, 247.5, 2.5, 251, 4.4, 'canvas_red' );

		// P: the poster block (8 m), its ladder, the scaffold up its face.
		b.building( - 6, 254, 6, 276, 8, 'fac_conc2', '', { roof: 'pav_light', trim: 'trim_green' } );
		b.ladder( 4, 254, 3, 5, '-z' );
		b.scaffold( 2.6, 252.6, 5.4, 254, 3, 9.2 );
		b.poster( 6.03, 5, 262, 3, 4.2, Math.PI / 2, 2 ); b.poster( - 6.03, 5, 270, 3, 4.2, - Math.PI / 2, 0 );
		b.ac( 4, 8, 270 ); b.vent( - 4.4, 8, 259 );

		// The temple: over its roof, drop and roll to the plaza, or the pole (on the right); the finish under the torii.
		b.house( - 9, 279, 9, 299, 9, 3.5, 'x', 'fac_shoji3', 'tile_roof2' );
		b.pole( - 5, 300.6, 3, 10.7 );
		b.box( - 14, 0, 299, 14, 3, 342, { top: 'pav_light', side: 'stone' } );
		b.torii( 0, 3, 322, 11, 7 );
		for ( const z of [ 310, 332 ] ) { b.stoneLantern( - 10, 3, z ); b.stoneLantern( 10, 3, z ); }
		b.tree( - 11, 3, 338, 1.2 ); b.tree( 11, 3, 338, 1.2 );

		// The rest of the town: rows of houses, a few modern blocks with posters, a lattice tower.
		townFill( b, [ [ - 16, - 20, 16, 345 ], [ 14, 38, 44, 128 ] ], { x0: - 80, x1: 80, z0: - 50, skip: ( bx, bz, w, d ) => bz < 218 && bz + d > 186 } );
		for ( let z = - 20; z < 380; z += 36 ) b.lanternLine( - 16, 7, z + 10, - 30, 7.5, z + 10, { n: 5 } );
		b.lattice( 52, 0, 150, 58, 70, 156, 'beam', 'y', 4 );
		b.lattice( 53.5, 70, 151.5, 56.5, 84, 154.5, 'beam', 'y', 3 );
		b.light( 55, 85, 153, '#ff3030', 2.2, true );
		b.backdrop( { x0: - 400, x1: 400, z0: 430, z1: 700, cell: 40, hMin: 30, hMax: 110, fill: 0.55, roofDeco: false, facades: [ 'fac_conc', 'fac_conc2', 'fac_grey', 'fac_office' ] } );

	},
};
