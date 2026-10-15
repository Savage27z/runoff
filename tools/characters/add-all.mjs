// Adds every character dropped in characters-in/ (FBX from mixamo.com) to the Locker: each one converted to a glTF
// (convert.mjs, through Blender) and checked against the Y Bot's skeleton (check-fit.mjs). The file's name gives the
// runner's id and name ("Dark Elf.fbx" is the runner "Dark Elf", id dark-elf); one already in the Locker is skipped.
// `npm run add-characters` (docs/CHARACTERS.md)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'characters-in';
if ( ! fs.existsSync( DIR ) ) fs.mkdirSync( DIR );
const files = fs.readdirSync( DIR ).filter( ( f ) => /\.fbx$/i.test( f ) );
if ( ! files.length ) {

	console.log( `add-characters: no .fbx in ${DIR}/ (download from mixamo.com: docs/CHARACTERS.md)` );
	process.exit( 0 );

}

const known = new Set( JSON.parse( fs.readFileSync( 'src/figure/characters.json', 'utf8' ) ).map( ( c ) => c.id ) );
for ( const file of files ) {

	const base = path.basename( file, path.extname( file ) );
	const id = base.toLowerCase().replace( /[^a-z0-9]+/g, '-' ).replace( /^-|-$/g, '' );
	const name = base.replace( /[_-]+/g, ' ' ).replace( /\b\w/g, ( c ) => c.toUpperCase() ).trim();
	if ( known.has( id ) ) {

		console.log( `add-characters: ${name} is in the Locker already (${id})` );
		continue;

	}

	execFileSync( process.execPath, [ 'tools/characters/convert.mjs', path.join( DIR, file ), id, name ], { stdio: 'inherit' } );
	execFileSync( process.execPath, [ 'tools/characters/check-fit.mjs', path.join( 'public', 'characters', `${id}.glb` ) ], { stdio: 'inherit' } );

}
