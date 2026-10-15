// What every course file uses to place its checkpoints and its hints. Courses run toward +z; facing +z, +x is on the
// runner's left.

// A checkpoint gate across x0..x1 at z, on a floor at y: the volume that counts as passing it, where its curtain is
// drawn (vis), and the spawn after it (a fall or Q comes back there).
export const gate = ( x0, x1, y, z, { h = 4.5, yaw = 0, y0 = y, spawnX = ( x0 + x1 ) / 2, vis = [ x0, x1 ] } = {} ) => ( {
	x0, x1, y0, y1: y + h, z0: z - 0.5, z1: z + 0.5, visY: y, visX0: vis[ 0 ], visX1: vis[ 1 ], spawn: { x: spawnX, y, z: z + 1, yaw },
} );

// A hint shown while the runner is in the box z0..z1 (and y0..y1, x0..x1 when given).
export const hint = ( z0, z1, text, y0 = - 100, y1 = 1000, x0 = - 1000, x1 = 1000 ) => ( { x0, x1, y0, y1, z0, z1, text } );
