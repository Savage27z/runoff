// Copies the runner's assets out of @trizendigital/parkour-demo: the Y Bot model, its rig and ragdoll descriptions,
// the move table, the mocap takes and the body sounds. The core package carries no character or motion data; the demo
// package is where the Y Bot and its takes live. Runs after every `npm install` (postinstall).

import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join( dirname( fileURLToPath( import.meta.url ) ), '..' );
const demo = join( root, 'node_modules', '@trizendigital', 'parkour-demo' );

if ( ! existsSync( demo ) ) {

	console.warn( 'sync-assets: @trizendigital/parkour-demo is not installed; skipping' );
	process.exit( 0 );

}

const copies = [
	[ 'public/models/ybot.glb', 'public/models/ybot.glb' ],
	[ 'public/data/moves.json', 'public/data/moves.json' ],
	[ 'public/data/takes', 'public/data/takes' ],
	[ 'public/sounds', 'public/sounds' ],
	[ 'src/data/ybot.json', 'src/data/ybot.json' ],
	[ 'src/data/ybot-ragdoll.json', 'src/data/ybot-ragdoll.json' ],
];

for ( const [ from, to ] of copies ) {

	const target = join( root, to );
	mkdirSync( dirname( target ), { recursive: true } );
	cpSync( join( demo, from ), target, { recursive: true } );

}

console.log( `sync-assets: copied ${copies.length} asset groups from @trizendigital/parkour-demo` );
