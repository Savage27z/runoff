// Training Yard (haze): the parkour yard beside the old hall, rebuilt for the Trizen runner. Every move in the book,
// each station with a fast line and a safe one: the vault line or the lanes, the beam over the pit or the swing bar,
// two wall-runs over the pit (or the balance beam, the bar), the tower's walls to run up (or its ladder and drainpipe),
// the cable down or the pole and the slide bar, the pillars or the long beam, the trampoline up onto the high deck (or
// its wall, its ladder), the slide-jump, the drop into the finish. Built to docs/METRICS.md. Courses run toward +z;
// facing +z, +x is on the runner's left.
//
//  Z1  the vault garden: vault the blocks down the middle, or the lanes beside them (bars to slide, rails to vault)
//  Z2  up the ramp to deck A; over the pit along the beam, or swing the bar on the left
//  Z3  deck B: wall-run the green panel on the left across the pit (or walk the balance beam on the right) to deck C;
//      wall-run the panel on the right (or swing the bar on the left) to deck D
//  Z4  the tower: E's wall to run up (or its ladder), T's wall (or its drainpipe)
//  Z5  down off T: the cable over the yard, or the pole and the slide bar
//  Z6  the clay courtyard under the torii
//  Z7  the second pit: hop the pillars, or the ramp and the long beam on the right
//  Z8  deck F: run over the trampoline and bounce up onto H, run up H's wall, or its ladder
//  Z9  slide under the duct on H and jump the gap to K
//  Z10 drop and roll into the finish courtyard, or the stairs on the right

import { gate, hint } from './gates.js';
import { townFill } from './town.js';

// The decks over the pits and the tower's two storeys (m).
const DECK = 2.5, E = 6.1, T = 9.7;
// The pillars over the second pit: 3 m long, 3.5 m apart (a running jump from one lands on the next), rising.
const PILLARS = Array.from( { length: 4 }, ( _, i ) => ( { z: 236 + i * 6.5, top: 1 + i * 0.4 } ) );

export const YARD = {
	id: 'yard',
	name: 'Training Yard',
	tagline: 'The parkour yard beside the old hall',
	blurb: 'Every move in the book: vaults, beams, wall-runs, the tower, the cable, the pillars, the trampoline.',
	theme: 'haze',
	unlock: 9,
	rebuilt: true,
	medals: [ 59.5, 51, 45.5, 41.5 ],
	spawn: { x: 0, y: 0, z: - 6, yaw: 0 },
	killY: - 6,
	// The pits' floors are a fall.
	isDead: ( feet ) => feet.y < - 1.5,
	env: { birds: [ 0, 30, 120 ], hills: { radius: 650, count: 18, height: [ 140, 320 ] }, clouds: 18 },
	checkpoints: [
		gate( - 14, 14, 0, 30, { h: 5 } ),
		gate( - 8, 8, DECK, 66 ),
		gate( - 8, 8, DECK, 92 ),
		gate( - 8, 8, DECK, 113 ),
		gate( - 8, 8, DECK, 132 ),
		gate( - 6, 6, T, 154.5 ),
		gate( - 14, 14, 0, 212, { h: 7 } ),
		gate( - 8, 8, DECK, 267 ),
		gate( - 8, 8, E, 283 ),
		gate( - 14, 14, 0, 330, { h: 6 } ),
	],
	hints: [
		hint( - 12, 2, 'Training Yard: every move in the book. Keep the flow.' ),
		hint( 2, 14, 'Vault the line down the middle · or the lanes: <b>slide</b> and vault' ),
		hint( 70, 77, 'Run the beam · or swing the <b>bar</b> ←', 1 ),
		hint( 90, 100, '← <b>Wall-run</b> the green panel, <k>Space</k> to kick off · or walk the <b>beam</b> →', 1 ),
		hint( 110, 118, '<b>Wall-run</b> the panel → · or swing the <b>bar</b> ←', 1 ),
		hint( 130, 140, 'Jump <b>into</b> the wall to run up it · or the <b>ladder</b> →', 1, 5 ),
		hint( 140.5, 148, 'Up again · or the <b>drainpipe</b> ←', 5 ),
		hint( 149, 158, 'Jump up at the <b>cable</b> · or the <b>pole</b> down →', 8 ),
		hint( 165, 174, 'Hold <k>Shift</k>: <b>slide</b> under the bar', - 1, 3 ),
		hint( 220, 232, 'Hop the pillars · or the ramp and the <b>beam</b> →' ),
		hint( 262, 271, 'Run over the <b>trampoline</b> · run up the wall · or the <b>ladder</b> ←', 1, 5 ),
		hint( 278, 286, 'Hold <k>Shift</k>: <b>slide</b> under the duct, then jump the gap', 5 ),
		hint( 300, 310, 'Drop and <b>roll</b> (hold <k>Space</k>) · or the stairs →', 4 ),
	],
	build( b ) {

		// The ground: the yard floor, the two pits, the street outside; the perimeter walls.
		b.box( - 14, - 3, - 12, 14, 0, 58.25, { top: 'pav_light', side: 'conc' } );
		b.box( - 14, - 6, 58, 14, - 4, 146, { top: 'clay', side: 'conc' } );
		b.box( - 14, - 3, 146, 14, 0, 186, { top: 'pav_light', side: 'conc' } );
		b.box( - 14, - 3, 186, 14, 0, 232, { top: 'clay', side: 'conc' } );
		b.box( - 14, - 6, 232, 14, - 4, 262, { top: 'clay', side: 'conc' } );
		b.box( - 14, - 3, 262, 14, 0, 310, { top: 'pav_light', side: 'conc' } );
		b.box( - 14, - 3, 310, 14, 0, 362, { top: 'clay', side: 'conc' } );
		b.box( - 90, - 3, - 60, - 14, 0, 400, { top: 'pav_warm', side: 'stone' } );
		b.box( 14, - 3, - 60, 90, 0, 400, { top: 'pav_warm', side: 'stone' } );
		for ( const sd of [ - 1, 1 ] ) {

			const x = sd * 14;
			b.yardBlock( Math.min( x, x + sd * 0.8 ), - 12, Math.max( x, x + sd * 0.8 ), 362, - 6, 3.2, sd > 0 ? 'w' : 'e' );

		}

		for ( let z = - 8; z < 360; z += 16 ) {

			if ( ( z > 44 && z < 150 ) || ( z > 226 && z < 266 ) ) continue;
			b.lampPost( - 12.8, 0, z, 5 ); b.lampPost( 12.8, 0, z + 8, 5 );

		}

		// Z1: the vault garden. The vault line down the middle (0.9 to 1.25 m, vaulted at a run); the lanes beside it
		// (x ±3.5) clear; climb-on blocks (1.6 to 2.4 m) and green panels to play on out at the sides.
		for ( const [ z, h ] of [ [ 6, 1.0 ], [ 14, 1.1 ], [ 22, 1.2 ], [ 30, 0.9 ], [ 38, 1.25 ] ] ) b.yardBlock( - 1.5, z, 1.5, z + 1.2, 0, h, 's' );
		for ( const [ x0, z0, x1, z1, h, g ] of [
			[ - 11, 4, - 7, 8, 1.6, 'e' ], [ 7, 10, 11, 14, 2.2, 'w' ], [ - 11, 18, - 7, 22, 2.4, 'e' ],
			[ 7, 26, 11, 30, 1.8, 'w' ], [ - 11, 34, - 7, 38, 1.2, '' ], [ 7, 42, 11, 46, 1.6, 'w' ],
		] ) b.yardBlock( x0, z0, x1, z1, 0, h, g );
		b.wallPanel( - 6.6, 12, - 6, 18, 0, 3.4 ); b.wallPanel( 6, 30, 6.6, 36, 0, 3.4 );
		// The lanes: bars to slide under and rails to vault, by turns (a slide wants 1.8 s before the next one).
		for ( const [ sd, z, slide ] of [ [ 1, 10, true ], [ 1, 22, false ], [ 1, 34, true ], [ 1, 46, false ], [ - 1, 16, true ], [ - 1, 28, false ], [ - 1, 40, true ] ] ) {

			const x0 = sd > 0 ? 2.1 : - 5.4, x1 = sd > 0 ? 5.4 : - 2.1;
			if ( ! slide ) {

				b.pipeRail( x0, z, x1, z, 0, 1.0 );
				continue;

			}

			b.box( x0, 1.0, z, x1, 1.6, z + 0.8, { side: 'conc', top: 'trim_yellow', bottom: 'conc' }, { keepBottom: true } );
			for ( const x of [ x0 + 0.15, x1 - 0.15 ] ) b.box( x - 0.15, 0, z + 0.1, x + 0.15, 1.0, z + 0.7, 'conc' );

		}

		b.pipeRail( - 12, 26, - 12, 44, 0 ); b.pipeRail( 12, 2, 12, 20, 0 );

		// Z2: the ramp up to deck A; over the first pit along the beam, or the swing bar on the left; deck B.
		b.ramp( - 4, 4, 51, 58, 0, DECK, null, { land: 0.5 } );
		b.yardBlock( - 8, 58.25, 8, 77, - 4, DECK, 'n' );
		b.pipeRail( - 7.8, 58.25, - 7.8, 77, DECK );
		b.yardBlock( - 3, 64.6, 4.5, 65.8, DECK, DECK + 1.0, 's' );
		b.beam( 0, 77, 84, DECK, 0.5, - 4 );
		b.swingBar( 1.5, 78.6, 4.5, 78.6, DECK + 2.3, - 4 );
		b.yardBlock( - 8, 84, 8, 100, - 4, DECK, 's' );
		b.yardBlock( 0, 88, 6, 89.2, DECK, DECK + 1.0, 's' );

		// Z3: the wall-run lanes. The green panel on the left (its face at x 5) across to deck C, or the balance beam on
		// the right; the panel on the right (its face at x -5) across to deck D, or the bar on the left.
		b.wallPanel( 5, 94, 5.7, 112, - 4, 8.5 );
		b.balanceBeam( - 4, 100, - 4, 106.5, DECK, - 4, { width: 0.3 } );
		b.yardBlock( - 8, 106.5, 8, 118, - 4, DECK, 'ns' );
		b.wallPanel( - 5.7, 112, - 5, 130, - 4, 8.5 );
		b.swingBar( 1.5, 119.6, 4.5, 119.6, DECK + 2.3, - 4 );
		b.yardBlock( - 8, 124.5, 8, 140, - 4, DECK, 's' );
		b.arrow( 4.97, 4.6, 99, 4, 1, - Math.PI / 2, '#ff5a1f' ); b.arrow( - 4.97, 4.6, 117, 4, 1, Math.PI / 2, '#ff5a1f' );

		// Z4: the tower. E's wall (3.6 m) to run up, or its ladder on the right; T's (3.6 m), or its drainpipe on the left.
		b.yardBlock( - 6, 140, 6, 148, - 4, E, 'sw' );
		b.ladder( - 4, 140, DECK, E - DECK, '-z' );
		b.yardBlock( - 6, 148, 6, 158, 0, T, 'se' );
		b.pipe( 4, 148, E, T, '-z' );
		b.scaffold( - 7.4, 140, - 6, 158, 0, T + 1.4 ); b.scaffold( 6, 140, 7.4, 158, 0, T + 1.4 );
		b.pipeRail( - 5.85, 150, - 5.85, 158, T ); b.pipeRail( 5.85, 150, 5.85, 158, T );

		// Z5: down off T on the cable over the yard, or the pole (on the right) and the bar to slide under.
		b.zipline( [ 0, T + 2.4, 152 ], [ 0, 2.6, 200 ] );
		b.pole( - 4, 159.6, 0, T + 1.6 );
		b.box( - 13.2, 1.0, 171.6, 13.2, 1.6, 172.4, { side: 'conc', top: 'trim_yellow', bottom: 'conc' }, { keepBottom: true } );
		for ( const x of [ - 13, 13 ] ) b.box( x - 0.2, 0, 171.7, x + 0.2, 1.0, 172.3, 'conc' );
		b.yardBlock( - 3, 182, 3, 183.2, 0, 1.0, 's' );

		// Z6: the clay courtyard: the torii, the rocks, the trees.
		b.torii( 0, 0, 212, 9, 6 );
		b.rock( - 9, 0, 196, 1.3 ); b.rock( 9, 0, 204, 1.0 ); b.rock( 10, 0, 224, 1.2 );
		b.tree( - 10, 0, 218, 1.2 ); b.tree( 10, 0, 190, 1.0 );
		b.yardBlock( - 3, 221, 3, 222.2, 0, 1.0, 's' );
		b.yardBlock( - 8, 196, - 2, 197.2, 0, 1.0, 's' );
		for ( const [ x, z ] of [ [ - 12, 206 ], [ 12, 214 ] ] ) b.stoneLantern( x, 0, z );

		// Z7: the second pit: the pillars down the middle, or the ramp and the long beam on the right; deck F.
		for ( const { z, top } of PILLARS ) b.yardBlock( - 1.25, z, 1.25, z + 3, - 4, top, 's' );
		b.ramp( - 8, - 3, 220, 232, 0, DECK, null, { land: 0.5 } );
		b.beam( - 5.5, 232.25, 262, DECK, 0.5, - 4 );
		// Half way along the beam, a platform with a block to vault.
		b.yardBlock( - 7, 245, - 4, 249, - 4, DECK, '' );
		b.yardBlock( - 7, 246.4, - 4, 247.4, DECK, DECK + 1.0, 's' );

		// Z8: deck F with its trampoline (flush in the deck: run over it); H 3.6 m up: bounce onto it, run up its wall,
		// or its ladder on the left.
		b.yardBlock( - 8, 262, 8, 271.5, 0, DECK, 'n' );
		b.yardBlock( - 8, 271.5, - 2, 274.5, 0, DECK, '' ); b.yardBlock( 2, 271.5, 8, 274.5, 0, DECK, '' );
		b.yardBlock( - 8, 274.5, 8, 277, 0, DECK, '' );
		b.awning( - 2, 271.5, 2, 274.5, DECK, 'canvas_blue', false );
		b.yardBlock( - 8, 277, 8, 290, 0, E, 'sw' );
		b.ladder( 4, 277, DECK, E - DECK, '-z' );
		b.pipeRail( - 7.8, 277, - 7.8, 290, E ); b.pipeRail( 7.8, 277, 7.8, 290, E );

		// Z9: the duct on H to slide under, the gap to K (a storey down).
		b.duct( - 7.6, E + 1, 286.4, 7.6, E + 1.7, 287.2 );
		for ( const x of [ - 7.8, 7.8 ] ) b.box( x - 0.2, E, 286.4, x + 0.2, E + 1, 287.2, 'steel' );
		b.yardBlock( - 8, 295.5, 8, 310, 0, 5, 'sw' );
		b.scaffold( - 8, 295.5, - 6.6, 310, 0, 6.4 );

		// Z10: off K into the finish courtyard: drop and roll, or the stairs on the right; the finish under the torii.
		b.stairs( - 8, - 3, 318.75, 0, 25, { rise: 0.2, run: 0.35, dir: - 1 } );
		b.rock( - 9, 0, 340, 1.2 ); b.rock( 8, 0, 352, 1.4 ); b.tree( 10, 0, 322, 1.1 ); b.tree( - 10, 0, 356, 1.2 );
		for ( const [ x, z ] of [ [ - 12, 326 ], [ 12, 326 ] ] ) b.stoneLantern( x, 0, z );
		b.torii( 0, 0, 330, 11, 7 );
		b.lanternLine( - 14, 8, 336, 14, 8, 336, { n: 8 } );

		// The hall and the town.
		b.box( 16, 0, 120, 48, 5, 280, { side: 'stone', top: 'pav_warm' } );
		b.house( 18, 124, 46, 276, 15, 4, 'z', 'fac_shoji3', 'tile_roof', { base: 5, walk: false } );
		b.house( 24, 150, 40, 250, 23, 3.5, 'z', 'fac_shoji', 'tile_roof', { base: 19, walk: false } );
		for ( let z = 130; z < 272; z += 9 ) b.lantern( 17.9, 13.2, z, 'lantern_red', 1.3 );
		townFill( b, [ [ - 16, - 20, 16, 366 ], [ 14, 118, 50, 282 ] ], { z1: 460 } );
		b.lattice( - 52, 0, 150, - 46, 70, 156, 'beam', 'y', 4 );
		b.light( - 49, 71, 153, '#ff3030', 2.2, true );
		b.backdrop( { x0: - 400, x1: 400, z0: 480, z1: 750, cell: 40, hMin: 30, hMax: 110, fill: 0.55, roofDeco: false, facades: [ 'fac_conc', 'fac_conc2', 'fac_grey', 'fac_office' ] } );

	},
};
