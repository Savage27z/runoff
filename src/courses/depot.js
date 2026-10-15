// The Depot (hall): the indoor parkour gym in an old rail depot, rebuilt for the Trizen runner. Plywood boxes, foam
// pits (land in the foam and you start over at the last gate), the truss bridge, the mezzanine, the block hops and the
// finish tower; at every station a fast line and a safe one. Built to docs/METRICS.md. Courses run toward +z; facing +z,
// +x is on the runner's left.
//
//  Z1  the floor flow: vault the boxes and the rails, slide under the bar down the middle, or run the lanes
//  Z2  P1 (3.6 m): vault up the box stairs on the left, or run up its red face
//  Z3  the first foam pit: wall-run the panel on the left, kick off onto the island and jump on to P2; or the truss
//      bridge and its rails
//  Z4  down to the floor: hurdles and the slide bar; the mezzanine M's wall to run up, or its ladder on the left
//  Z5  M: slide under the duct and slide-jump the second pit to B, or walk the beam on the right
//  Z6  the long pit: hop the blocks and catch the tower's edge, or the long beam on the right and the tower's ladder

import { gate, hint } from './gates.js';

// The platforms' storey (m): one is a wall to run up.
const P = 3.6;
// The tower's top: a catch (2.4 m) over the last block.
const TOWER = 7.2;
// The blocks over the long pit: 3 m long, 3.5 m apart (a running jump from one lands on the next), rising to 4.8 m.
const HOPS = Array.from( { length: 4 }, ( _, i ) => ( { z: 206.5 + i * 6.5, top: P + i * 0.4 } ) );

export const DEPOT = {
	id: 'depot',
	name: 'The Depot',
	tagline: 'Indoor parkour gym in an old rail depot',
	blurb: 'The box stairs, a wall-run onto the island, the mezzanine, the slide-jump, the block hops and the tower.',
	theme: 'hall',
	unlock: 11,
	rebuilt: true,
	medals: [ 45.5, 39, 35, 32 ],
	spawn: { x: 0, y: 0, z: - 8, yaw: 0 },
	killY: - 8,
	// The foam: a fall.
	isDead: ( feet ) => feet.y < - 1,
	env: { hills: false, clouds: 14, shadow: 75 },
	checkpoints: [
		gate( - 30, 30, 0, 30, { h: 9, vis: [ - 10, 10 ] } ),
		gate( - 6, 6, P, 68 ),
		gate( - 6, 6, P, 103 ),
		gate( - 30, 30, 0, 133, { h: 9, vis: [ - 10, 10 ] } ),
		gate( - 8, 8, P, 169 ),
		gate( - 8, 8, P, 198 ),
		gate( - 6, 6, TOWER, 239, { h: 5 } ),
	],
	hints: [
		hint( - 14, 2, 'The Depot: land in the foam and you start over at the last gate' ),
		hint( 2, 14, 'Vault the boxes, <b>slide</b> under the bar · or run the lanes' ),
		hint( 46, 58, '← Vault up the box stairs · or jump <b>into</b> the red wall to run up it', - 1, 3 ),
		hint( 68, 74, '← <b>Wall-run</b> the panel, <k>Space</k> to kick onto the island · or the truss bridge', 2 ),
		hint( 105, 109, 'Drop down and keep running', 2 ),
		hint( 143, 153, 'Jump <b>into</b> the wall to run up it · or the <b>ladder</b> ←', - 1, 3 ),
		hint( 175, 187, 'Hold <k>Shift</k>: <b>slide</b> under the duct, then jump the pit · or walk the <b>beam</b> →', 2 ),
		hint( 195, 203, 'Hop the blocks · or the long <b>beam</b> →', 2 ),
		hint( 223, 232, 'Jump from the block\'s end to catch the tower\'s edge · or its <b>ladder</b>', 2 ),
	],
	build( b ) {

		// The floor (the pits cut out) and the foam pits; the mats.
		b.box( - 30, - 1, - 14, 30, 0, 74, { top: 'gym_floor', side: 'conc' } );
		b.box( - 30, - 1, 74, - 14, 0, 96.5, { top: 'gym_floor', side: 'conc' } ); b.box( 14, - 1, 74, 30, 0, 96.5, { top: 'gym_floor', side: 'conc' } );
		b.box( - 30, - 1, 96.5, 30, 0, 187, { top: 'gym_floor', side: 'conc' } );
		b.box( - 30, - 1, 192.5, 30, 0, 203, { top: 'gym_floor', side: 'conc' } );
		b.box( - 30, - 1, 232.5, 30, 0, 253, { top: 'gym_floor', side: 'conc' } );
		b.foamPit( - 14, 74, 14, 96.5 );
		b.foamPit( - 30, 187, 30, 192.5 );
		b.foamPit( - 30, 203, 30, 232.5 );
		for ( const [ x0, z0, x1, z1, m ] of [ [ - 4, 2, 4, 46, 'mat_dark' ], [ - 4, 111, 4, 149, 'mat_red' ] ] ) b.box( x0, 0, z0, x1, 0.02, z1, m, { collide: false } );

		// The building; the side mezzanines (walkable, off the line), their stairs, the boxes on them.
		b.hall( - 30, - 14, 30, 253, 17, { roll: [ [ - 6, 6, - 13.95 ], [ - 6, 6, 252.95 ] ] } );
		for ( const sd of [ - 1, 1 ] ) {

			const xa = sd < 0 ? - 30 : 22, xb = sd < 0 ? - 22 : 30;
			b.w.box( xa, 4.25, 22.25, xb, 4.5, 243, { top: 'plywood', side: 'rail_dark', bottom: 'rail_dark' }, { keepBottom: true } );
			for ( let z = 26; z < 243; z += 12 ) b.column( sd < 0 ? - 22.3 : 22.3, z, 0, 4.25, 0.15, 'rail_dark' );
			b.meshRail( sd < 0 ? - 22.05 : 22.05, 22.25, sd < 0 ? - 22.05 : 22.05, 243, 4.5 );
			b.stairs( sd < 0 ? - 25 : 23, sd < 0 ? - 23 : 25, 10, 0, 30, { rise: 0.15, run: 0.4, dir: 1, top: 'plywood', land: 0.5 } );
			for ( let z = 30; z < 230; z += 22 ) b.plyBox( xa + 1, z, xb - 1, z + 4, 4.5, 7.5 + ( Math.round( z / 22 ) % 2 ) * 1.5, Math.round( z / 22 ) % 3 ? '' : 'ew' );

		}

		// Z1: the floor flow down the middle (boxes and rails to vault, the bar to slide under), the lanes clear at x ±4.5,
		// climb-on boxes and red panels out at the sides.
		b.plyBox( - 2, 6, 2, 7.2, 0, 1.0, 'n' );
		b.pipeRail( - 3, 14, 3, 14, 0, 1.0 );
		b.box( - 3.5, 1.0, 22, 3.5, 1.6, 22.8, { side: 'rail_dark', top: 'trim_yellow', bottom: 'rail_dark' }, { keepBottom: true } );
		for ( const x of [ - 3.5, 3.5 ] ) b.box( x - 0.15, 0, 22.1, x + 0.15, 1.0, 22.7, 'rail_dark' );
		b.plyBox( - 2, 32, 2, 33.2, 0, 1.2, 'ns' );
		b.pipeRail( - 3, 42, 3, 42, 0, 1.0 );
		b.plyBox( - 10, 24, - 9.4, 34, 0, 3.5, 'e', true ); b.plyBox( 9.4, 24, 10, 34, 0, 3.5, 'w', true );
		for ( const [ x0, z0, x1, z1, h, r, c ] of [
			[ - 16, 8, - 12, 12, 1.6, 'e', false ], [ 12, 14, 17, 17, 2.4, '', true ], [ - 18, 30, - 13, 33, 1.2, 'n', false ],
			[ 13, 36, 16, 42, 2.4, 'w', true ], [ - 16, 46, - 12, 52, 1.8, '', true ], [ 12, 52, 18, 55, 1.0, 'n', false ],
		] ) b.plyBox( x0, z0, x1, z1, 0, h, r, c );
		b.pipeRail( - 18, 20, - 12, 20, 0, 1.1 ); b.pipeRail( 12, 26, 18, 26, 0, 1.1 );

		// Z2: P1, its red face 3.6 m (run up it), the box stairs on the left (1.2 m risers to vault up).
		b.plyBox( 2.5, 51, 6.5, 54, 0, 1.2, 's' );
		b.plyBox( 2.5, 54, 6.5, 57, 0, 2.4, 's', true );
		b.plyBox( 2.5, 57, 6.5, 60, 0, P, 's' );
		b.plyBox( - 6, 60, 6, 74, 0, P, 'sew' );
		b.pipeRail( - 5.9, 60, - 5.9, 74, P );

		// Z3: the first foam pit. The panel on the left (its face at x 6) to wall-run, kicking off onto the island, then
		// the jump on to P2. Or the truss bridge down the middle, its rails to vault.
		b.plyBox( 6, 68, 6.6, 92, - 2.5, 10, 'w', true );
		b.plyBox( 1, 80.5, 6, 91.5, - 2.5, P, 'n', true );
		b.trussBridge( 0, 74, 96.5, P, 2 );
		for ( const z of [ 81, 88 ] ) b.pipeRail( - 1, z, 1, z, P, 1.0 );
		b.plyBox( - 6, 96.5, 6, 109, 0, P, 'ns' );
		b.pipeRail( - 5.9, 96.5, - 5.9, 109, P ); b.pipeRail( 5.9, 96.5, 5.9, 109, P );

		// Z4: down to the floor: a rail, the bar to slide under, a box; M's wall (3.6 m) to run up, or its ladder.
		b.pipeRail( - 5, 119, 5, 119, 0, 1.0 );
		b.box( - 6, 1.0, 129, 6, 1.6, 129.8, { side: 'rail_dark', top: 'trim_yellow', bottom: 'rail_dark' }, { keepBottom: true } );
		for ( const x of [ - 6, 6 ] ) b.box( x - 0.15, 0, 129.1, x + 0.15, 1.0, 129.7, 'rail_dark' );
		b.plyBox( - 2, 139, 2, 140.2, 0, 1.0, 'n' );
		for ( const sd of [ - 1, 1 ] ) b.plyBox( sd * 9 - 0.3, 115, sd * 9 + 0.3, 149, 0, 3.5, sd < 0 ? 'e' : 'w', true );

		// Z5: M, the mezzanine run: a rail to vault, the duct to slide under, the second pit to slide-jump to B, or the
		// beam on the right.
		b.plyBox( - 8, 153, 8, 187, 0, P, 'sew' );
		b.ladder( 4, 153, 0, P, '-z' );
		b.meshRail( - 7.95, 153, - 7.95, 187, P ); b.meshRail( 7.95, 153, 7.95, 187, P );
		b.pipeRail( - 4.5, 161, 4.5, 161, P, 1.0 );
		b.duct( - 2.5, P + 1, 183.5, 7.6, P + 1.7, 184.3 );
		for ( const x of [ - 2.5, 7.6 ] ) b.box( x - 0.15, P, 183.5, x + 0.15, P + 1, 184.3, 'rail_dark' );
		b.balanceBeam( - 4, 187, - 4, 192.5, P, - 2.5, { width: 0.3 } );
		b.plyBox( - 8, 192.5, 8, 203, 0, P, 'ns', true );

		// Z6: the long pit: the blocks to hop, rising, then the catch onto the tower; or the long beam on the right and
		// the tower's ladder. The finish on the tower.
		HOPS.forEach( ( { z, top }, i ) => b.plyBox( - 2.5, z, 2.5, z + 3, - 2.5, top, i % 2 ? 'ns' : '', i % 2 === 0 ) );
		b.beam( - 4, 203, 232.5, P, 0.8, - 2.5 );
		b.plyBox( - 6, 232.5, 6, 245, 0, TOWER, 'sew', true );
		b.ladder( - 4, 232.5, P, TOWER - P, '-z' );
		b.pipeRail( - 5.9, 235, - 5.9, 245, TOWER ); b.pipeRail( 5.9, 235, 5.9, 245, TOWER );
		b.sign( 0, 11, 252.3, 14, 3, 'THE DEPOT', '#ff5a1f', Math.PI );

		// Outside: a few buildings seen through the windows.
		b.backdrop( { x0: - 300, x1: 300, z0: - 200, z1: 460, cell: 40, hMin: 14, hMax: 60, fill: 0.6, avoid: [ [ - 40, - 30, 40, 263 ] ], roofDeco: false } );
		b.street( - 0.05 );

	},
};
