// Builds a course: its meshes (one per material, under world.group), its solids, and the world description the
// runner takes. The same build runs headless for the route bot, where it lays down solids only.

import { World } from '../world/world.js';
import { Builder } from '../world/builder.js';
import { toWorld } from '../world/toWorld.js';

// The builder's random stream is seeded from the course's id, so a course is the same on every load.
function hashString( text ) {

	let hash = 2166136261;
	for ( const c of text ) hash = Math.imul( hash ^ c.charCodeAt( 0 ), 16777619 );
	return hash >>> 0;

}

/**
 * @param {object} map a course from src/courses/maps.js
 * @param {Scene} scene where its meshes go
 * @param {World} [world] a World to build into (cleared first); a new one otherwise
 */
export function buildCourse( map, scene, world = new World( scene ) ) {

	world.clear();
	world.setTheme( map.theme );
	map.build( new Builder( world, hashString( map.id ) ) );
	world.finalize();
	return { world, ...toWorld( map, world.col ) };

}
