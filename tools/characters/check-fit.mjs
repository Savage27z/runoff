// Checks a fitted character against the Y Bot: both posed by the same frames of a few takes, each limb's direction
// (joint to the next joint) compared. A good fit points every limb the same way within a few degrees.
// `node tools/characters/check-fit.mjs <model.glb> [take …]`
import '../headless/env.mjs';

const THREE = await import( 'three' );
const { GLTFLoader } = await import( 'three/addons/loaders/GLTFLoader.js' );
const fs = await import( 'node:fs' );
const { fitCharacter } = await import( '../../src/figure/fit.js' );
const REST = JSON.parse( fs.readFileSync( 'src/figure/ybot-rest.json', 'utf8' ) );

async function load( file ) {

	const data = fs.readFileSync( file );
	const loader = new GLTFLoader().register( () => ( { name: 'noTextures', loadTexture: () => Promise.resolve( null ) } ) );
	return new Promise( ( done, fail ) => loader.parse( data.buffer.slice( data.byteOffset, data.byteOffset + data.byteLength ), '', done, fail ) );

}

const [ file, ...takeNames ] = process.argv.slice( 2 );
const takes = takeNames.length ? takeNames : [ 'ground_idle', 'ground_run_lean_left', 'wall_run_left', 'trick_front_flip', 'ledge_hang_climb' ].filter( ( t ) => fs.existsSync( `public/data/takes/${t}.json` ) );
const ybot = ( await load( 'public/models/ybot.glb' ) ).scene;
const fitted = fitCharacter( await load( file ), REST ).scene;

const LIMBS = [ [ 'LeftArm', 'LeftForeArm' ], [ 'LeftForeArm', 'LeftHand' ], [ 'RightArm', 'RightForeArm' ], [ 'RightForeArm', 'RightHand' ], [ 'LeftUpLeg', 'LeftLeg' ], [ 'LeftLeg', 'LeftFoot' ], [ 'RightUpLeg', 'RightLeg' ], [ 'RightLeg', 'RightFoot' ], [ 'LeftFoot', 'LeftToeBase' ], [ 'Spine', 'Neck' ], [ 'Neck', 'Head' ], [ 'LeftShoulder', 'LeftArm' ] ];
const bone = ( scene, name ) => scene.getObjectByName( `mixamorig${name}` );
const dir = ( scene, a, b ) => bone( scene, b ).getWorldPosition( new THREE.Vector3() ).sub( bone( scene, a ).getWorldPosition( new THREE.Vector3() ) ).normalize();

for ( const take of takes ) {

	const clip = JSON.parse( fs.readFileSync( `public/data/takes/${take}.json`, 'utf8' ) );
	const frame = Math.floor( clip.times.length / 2 );
	for ( const scene of [ ybot, fitted ] ) {

		for ( const [ track, values ] of Object.entries( clip.tracks ) ) {

			const [ name, property ] = track.split( '.' );
			const node = scene.getObjectByName( name );
			if ( ! node ) continue;
			if ( property === 'quaternion' ) node.quaternion.fromArray( values, frame * 4 );

		}

		scene.updateMatrixWorld( true );

	}

	const errors = LIMBS.map( ( [ a, b ] ) => [ `${a}>${b}`, THREE.MathUtils.radToDeg( dir( ybot, a, b ).angleTo( dir( fitted, a, b ) ) ) ] );
	const worst = errors.reduce( ( w, e ) => e[ 1 ] > w[ 1 ] ? e : w );
	if ( process.env.VERBOSE ) for ( const [ n, e ] of errors ) console.log( `    ${n.padEnd( 22 )} ${e.toFixed( 1 )}°` );
	console.log( `${take.padEnd( 24 )} mean ${( errors.reduce( ( s, e ) => s + e[ 1 ], 0 ) / errors.length ).toFixed( 1 )}°  worst ${worst[ 0 ]} ${worst[ 1 ].toFixed( 1 )}°` );

}

process.exit( 0 );
