// Turns a character downloaded from mixamo.com (FBX, "With Skin", T-pose) into a glTF the game loads, and adds it to
// the Locker's list (src/figure/characters.json). Blender does the conversion, in the background: it imports the FBX
// with its embedded textures and exports a binary glTF with them packed in. The game fits it to the Y Bot's skeleton
// as it loads (src/figure/fit.js), so nothing else is needed.
//
//   node tools/characters/convert.mjs <character.fbx> <id> "<Name>"
//
// BLENDER can name the Blender executable; otherwise the usual install folders are tried.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [ input, id, name = id ] = process.argv.slice( 2 );
if ( ! input || ! id || ! /^[a-z0-9_-]+$/.test( id ) ) {

	console.error( 'usage: node tools/characters/convert.mjs <character.fbx> <id: a-z 0-9 _ -> "<Name>"' );
	process.exit( 1 );

}

function findBlender() {

	if ( process.env.BLENDER ) return process.env.BLENDER;
	const roots = [ 'C:/Program Files/Blender Foundation', '/Applications/Blender.app/Contents/MacOS', '/usr/bin' ];
	for ( const root of roots ) {

		if ( ! fs.existsSync( root ) ) continue;
		if ( fs.existsSync( path.join( root, 'blender' ) ) ) return path.join( root, 'blender' );
		const versions = fs.readdirSync( root ).filter( ( d ) => /^Blender/.test( d ) ).sort().reverse();
		for ( const v of versions ) {

			const exe = path.join( root, v, 'blender.exe' );
			if ( fs.existsSync( exe ) ) return exe;

		}

	}

	throw new Error( 'Blender not found: set BLENDER to its executable' );

}

const output = path.resolve( 'public', 'characters', `${id}.glb` );
const script = path.join( os.tmpdir(), `runoff-convert-${process.pid}.py` );
fs.writeFileSync( script, `
import bpy, sys
args = sys.argv[ sys.argv.index( '--' ) + 1: ]
source, target = args[ 0 ], args[ 1 ]
bpy.ops.wm.read_factory_settings( use_empty = True )
bpy.ops.import_scene.fbx( filepath = source, use_image_search = True )
bpy.ops.file.pack_all()
bpy.ops.export_scene.gltf( filepath = target, export_format = 'GLB', export_yup = True, export_skins = True, export_animations = True, export_apply = False, export_image_format = 'AUTO' )
` );

execFileSync( findBlender(), [ '--background', '--factory-startup', '--python', script, '--', path.resolve( input ), output ], { stdio: [ 'ignore', 'inherit', 'inherit' ] } );
fs.rmSync( script );

const listFile = 'src/figure/characters.json';
const list = JSON.parse( fs.readFileSync( listFile, 'utf8' ) ).filter( ( c ) => c.id !== id );
// New characters go before the Y Bot, which stays last.
list.splice( list.length - 1, 0, { id, name, model: `characters/${id}.glb`, fit: true } );
const entry = ( c ) => `{ ${Object.entries( c ).map( ( [ key, value ] ) => `${JSON.stringify( key )}: ${JSON.stringify( value )}` ).join( ', ' )} }`;
fs.writeFileSync( listFile, '[\n' + list.map( ( c ) => '\t' + entry( c ) ).join( ',\n' ) + '\n]\n' );
console.log( `convert: ${path.relative( '.', output )} (${( fs.statSync( output ).size / 1048576 ).toFixed( 1 )} MB), added "${name}" to ${listFile}` );
