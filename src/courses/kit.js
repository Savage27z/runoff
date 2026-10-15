// The traversal kit's test yard (not a course in the game): one lane per thing to take hold of, each starting at its
// own spawn with the runner facing +z, at sizes the arcade runner should manage. tools/kit.mjs runs every lane.

export const KIT = {
	id: 'kit',
	name: 'Kit yard',
	theme: 'day',
	medals: [ 60, 50, 40, 30 ],
	killY: - 10,
	spawn: { x: 0, y: 0, z: - 4, yaw: 0 },
	checkpoints: [],
	hints: [],
	env: { hills: false },
	lanes: [
		// Each lane: its spawn (x), what to hold and when (by distance travelled), and the state to reach.
		{ name: 'pole', x: 0, expect: 'onPole', press: [ [ 'jump', 3.2 ] ] },
		{ name: 'pipe', x: 8, expect: 'onPipe' },
		{ name: 'ladder', x: 16, expect: 'onLadder' },
		{ name: 'zipline', x: 24, y: 4, expect: 'onZipline', press: [ [ 'jump', 3.0 ] ] },
		{ name: 'bar', x: 32, expect: 'onBar', press: [ [ 'jump', 3.4 ] ] },
		{ name: 'beam', x: 40, y: 1, expect: 'onBeam', pose: true },
	],
	build( b ) {

		b.box( - 10, - 1, - 10, 50, 0, 40, 'pav_light' );
		// Pole: 3 m up a post past a gap.
		b.pole( 0, 2, 0, 6 );
		// Pipe: up a 5 m wall facing the runner (-z face at z = 3).
		b.box( 6, 0, 3, 10, 5, 7, 'conc' );
		b.pipe( 8, 3, 0, 5, '-z' );
		// Ladder: up a 5 m wall.
		b.box( 14, 0, 3, 18, 5, 7, 'conc' );
		b.ladder( 16, 3, 0, 5, '-z' );
		// Zipline: from a 4 m deck down 20 m along +z (the deck is the lane's start).
		b.box( 22, 0, - 6, 26, 4, 1, 'conc' );
		b.zipline( [ 24, 6.4, 3 ], [ 24, 2.6, 23 ] );
		// Bar: 2.2 m up, 2 m past the lane's run-up.
		b.swingBar( 30.5, 2, 33.5, 2, 2.3, 0 );
		// Beam: a 0.15 m beam 1 m up between two blocks.
		b.box( 38, 0, - 6, 42, 1, 1, 'conc' );
		b.balanceBeam( 40, 1, 40, 7, 1, 0 );
		b.box( 38, 0, 7, 42, 1, 12, 'conc' );

	},
};
