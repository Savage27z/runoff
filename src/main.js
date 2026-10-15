// Boot: the stage, the game with its last course and runner loaded behind the loading screen, the screens over it, and
// the render loop. `?course=<id>` and `?character=<id>` pick what loads first.
//
// The arcade module rebinds the runner's controls, so it is imported before anything that loads the runner.

import './sim/arcade.js';
import './ui/theme.css';
import * as THREE from 'three/webgpu';
import { Stage } from './stage/renderer.js';
import { Game } from './game/game.js';
import { UI } from './ui/ui.js';
import { Session } from './sim/session.js';
import { runRoute, ROUTES } from './dev/bot.js';
import { Figure } from '@trizendigital/parkour';

const loading = window.loading;

// The motion data (the move table and 138 takes, 18 MB) is read again for every new run (another course, another
// runner): kept here once fetched, so a new run only parses it.
const fetched = new Map();
const fetchPage = window.fetch.bind( window );
window.fetch = ( url, options ) => {

	const text = String( url );
	if ( ! /\/data\/(takes\/.+|moves)\.json$/.test( text ) ) return fetchPage( url, options );
	if ( ! fetched.has( text ) ) fetched.set( text, fetchPage( url, options ).then( ( response ) => response.text() ) );
	return fetched.get( text ).then( ( body ) => new Response( body, { headers: { 'Content-Type': 'application/json' } } ) );

};

async function main() {

	loading.step( 'Starting the renderer…' );
	const stage = await new Stage( document.getElementById( 'app' ) ).init();
	const game = new Game( stage );

	const page = new URLSearchParams( location.search );
	if ( page.has( 'character' ) ) game.save.data.character = page.get( 'character' );
	const asked = game.maps.find( ( m ) => m.id === ( page.get( 'course' ) ?? game.save.data.lastCourse ) );
	await game.load( asked?.rebuilt ? asked.id : game.maps.find( ( m ) => m.rebuilt ).id, ( text ) => loading.step( text ) );

	const ui = new UI( game, document.getElementById( 'ui' ) );
	game.ui = ui;
	game.toMenu( 'home' );

	// The page's handles for the console: `await RUNOFF.test()` runs the route bot on the course on show.
	window.RUNOFF = {
		THREE, stage, game,
		async test( route ) {

			const routes = ROUTES[ game.map.id ] ?? {}, out = [];
			for ( const [ name, waypoints ] of Object.entries( routes ) ) {

				if ( route && name !== route ) continue;
				const bot = await new Session( { map: game.map, course: game.course, figure: new Figure(), page: { storage: null, eventWindow: null, eventDocument: null, navigator: null } } ).load();
				const result = runRoute( bot, waypoints );
				bot.dispose();
				out.push( `${game.map.id}/${name}: ${result.finish != null ? `FINISH ${result.finish.toFixed( 2 )}s` : 'FAIL'}`, ...result.log );

			}

			return out.join( '\n' );

		},
	};

	const timer = new THREE.Timer();
	timer.connect( document );
	let fpsTime = 0, fpsFrames = 0;
	stage.renderer.setAnimationLoop( ( time ) => {

		timer.update( time );
		const dt = timer.getDelta();
		game.frame( dt );

		fpsTime += dt;
		fpsFrames ++;
		if ( fpsTime > 0.5 ) {

			ui.fps( `${Math.round( fpsFrames / fpsTime )} FPS · ${stage.backendName}` );
			fpsTime = fpsFrames = 0;

		}

	} );

	loading.done();

}

main().catch( ( error ) => {

	console.error( error );
	loading.fail( `Couldn't start · ${error.message}` );

} );
