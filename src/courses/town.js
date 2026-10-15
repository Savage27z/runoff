// The old town's background fill, shared by the courses set in it: rows of timber houses with the odd modern poster
// block, kept off the course (`keep`: [ x0, z0, x1, z1 ] boxes) and off whatever `skip` says.
export function townFill( b, keep, { x0 = - 90, x1 = 90, z0 = - 60, z1 = 400, skip = null } = {} ) {

	const fac = [ 'fac_shoji', 'fac_shoji2', 'fac_shoji3' ], roofs = [ 'tile_roof', 'tile_roof2', 'tile_roof3' ];
	for ( let x = x0; x < x1; x += 13 ) {

		for ( let z = z0; z < z1; z += 12 ) {

			const w = b.r( 8, 11 ), d = b.r( 8, 10.5 ), bx = x + b.r( 0, 12 - w ), bz = z + b.r( 0, 11 - d );
			if ( keep.some( ( [ a0, c0, a1, c1 ] ) => bx < a1 && bx + w > a0 && bz < c1 && bz + d > c0 ) ) continue;
			if ( skip && skip( bx, bz, w, d ) ) continue;
			if ( b.rng() < 0.13 ) {

				b.building( bx, bz, bx + w, bz + d, b.r( 14, 30 ), b.pick( [ 'fac_conc', 'fac_conc2', 'fac_grey' ] ), '', { roof: 'pav_light', trim: 'trim_green' } );
				b.poster( bx + w / 2, b.r( 5, 9 ), bz - 0.03, 3, 4, Math.PI, ( b.rng() * 4 ) | 0 );

			} else {

				b.house( bx, bz, bx + w, bz + d, b.r( 4, 9 ), b.r( 1.6, 3 ), b.rng() < 0.5 ? 'x' : 'z', b.pick( fac ), b.pick( roofs ), { walk: false } );

			}

		}

	}

}
