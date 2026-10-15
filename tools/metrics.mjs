// Measures what the arcade runner can do, headless, on lanes built for the purpose: the widest gap it clears (by
// landing rise, from a sprint and from a slide), what gets it over or onto an obstacle by height, and how far a wall
// run carries. The numbers the courses are built to (docs/METRICS.md). `node tools/metrics.mjs [gaps|heights|walls]`
import './headless/env.mjs';

await import( '../src/sim/arcade.js' );
const THREE = await import( 'three' );
const { SolidCollector } = await import( '../src/world/solids.js' );
const { toWorld } = await import( '../src/world/toWorld.js' );
const { Session } = await import( '../src/sim/session.js' );
const { pressKeys } = await import( '../src/dev/bot.js' );
const { Figure } = await import( '@trizendigital/parkour' );

const only = process.argv[ 2 ];

// A lane as a session: boxes [ x0, y0, z0, x1, y1, z1 ], the runner at z = -25 facing +z on a deck at y = 0.
async function lane( boxes ) {

	const collector = new SolidCollector();
	collector.add( - 3, - 20, - 30, 3, 0, 0 );
	for ( const b of boxes ) collector.add( ...b );
	const map = { name: 'lane', killY: - 15, spawn: { x: 0, y: 0, z: - 25, yaw: 0 }, checkpoints: [] };
	const session = await new Session( { map, course: toWorld( map, collector ), figure: new Figure() } ).load();
	return session;

}

// Runs a lane with forward held; `act( feet, runner, keys )` adds keys each frame. Returns the frames' last feet and
// the states seen.
function run( session, act, seconds = 5 ) {

	session.respawn( 0 );
	const keys = new Set(), states = [];
	session.feed = pressKeys( keys );
	session.onEvent = ( e ) => e.to && states.push( e.to );
	let fell = false;
	session.onEvent = ( e ) => {

		if ( e.to ) states.push( e.to );
		if ( e.type === 'fell' ) fell = true;

	};
	for ( let f = 0; f < seconds * 60 && ! fell; f ++ ) {

		keys.clear();
		keys.add( 'KeyW' );
		act( session.feet, session.runner, keys );
		session.frame( 1 / 60 );

	}

	session.dispose();
	return { feet: session.feet, states, fell };

}

// A jump tapped at a point: Space held two frames from there.
const tapAt = ( z ) => {

	let frames = 0;
	return ( feet, runner, keys ) => {

		if ( frames === 0 && feet.z >= z && runner.grounded ) frames = 2;
		if ( frames > 0 ) {

			keys.add( 'Space' );
			frames = frames === 1 ? - 1 : frames - 1;

		}

	};

};

async function gaps() {

	console.log( 'Widest gap cleared, taking off within 0.3 m of the edge (m):' );
	console.log( 'rise      sprint   slide-jump' );
	for ( const rise of [ 2, 1, 0.5, 0, - 1, - 2, - 3, - 5 ] ) {

		const widest = async ( slide ) => {

			let best = 0;
			for ( let g = 2; g <= 14; g += 0.25 ) {

				const session = await lane( [ [ - 3, - 20, g, 3, rise, g + 25 ] ] );
				const tap = tapAt( - 0.3 );
				const r = run( session, ( feet, runner, keys ) => {

					if ( slide && feet.z > - 7 && feet.z < - 6.6 && runner.grounded ) keys.add( 'ShiftLeft' );
					if ( slide && runner.state === 'sliding' ) keys.add( 'ShiftLeft' );
					tap( feet, runner, keys );

				}, 4 );
				if ( ! r.fell && r.feet.z > g && r.feet.y > rise - 0.2 ) best = g;
				else if ( g - best > 1 ) break;

			}

			return best;

		};

		console.log( `${String( rise ).padStart( 4 )} m    ${( await widest( false ) ).toFixed( 2 ).padStart( 6 )}   ${( await widest( true ) ).toFixed( 2 ).padStart( 6 )}` );

	}

}

async function heights() {

	console.log( '\nAn obstacle 3 m deep at z = 0, met square at a sprint: what gets onto or over it (on top = feet at its top):' );
	console.log( 'height   run      jump@1.0  jump@2.0  jump@3.0' );
	for ( let h = 0.4; h <= 5.01; h += h < 1.6 ? 0.2 : 0.4 ) {

		const cells = [];
		for ( const at of [ null, 1, 2, 3 ] ) {

			const session = await lane( [ [ - 3, 0, 0, 3, h, 3 ], [ - 3, - 20, 3, 3, 0, 30 ] ] );
			const r = run( session, at == null ? () => {} : tapAt( - at ), 4 );
			const over = r.feet.z > 3.2;
			const on = ! over && r.feet.y > h - 0.1 && r.feet.z > 0;
			const how = r.states.includes( 'vaulting' ) ? 'vault' : r.states.includes( 'climbingUp' ) ? 'climb' : r.states.includes( 'hanging' ) ? 'hang' : '';
			cells.push( ( over ? 'over' : on ? 'on' : '-' ) + ( how ? `(${how})` : '' ) );

		}

		console.log( `${h.toFixed( 1 ).padStart( 4 )} m   ${cells.map( ( c ) => c.padEnd( 10 ) ).join( '' )}` );

	}

}

async function walls() {

	console.log( '\nWall run along a wall 1 m to the left (x = 1), jumped at from the deck end at an angle:' );
	for ( const angle of [ 5, 15, 25, 35, 45 ] ) {

		const session = await lane( [ [ 1, - 20, - 1, 2, 6, 40 ] ] );
		// The deck ends at z = 0; the runner aims at the wall by turning the view.
		const yaw = angle * Math.PI / 180;
		let start = null, end = null;
		const tap = tapAt( - 0.5 );
		const r = run( session, ( feet, runner, keys ) => {

			session.sim.view.yaw = feet.z > - 0.6 ? yaw : 0;
			tap( feet, runner, keys );
			if ( runner.state === 'wallRunning' ) {

				start ??= { ...feet };
				end = { ...feet };

			}

		}, 4 );
		console.log( `  ${String( angle ).padStart( 2 )}°  ${start ? `ran ${( end.z - start.z ).toFixed( 1 )} m along it, rising ${( end.y - start.y ).toFixed( 1 )} m` : 'no wall run'}  (${r.states.filter( ( s, i ) => s !== r.states[ i - 1 ] ).slice( 3 ).join( ' > ' )})` );

	}

}

if ( ! only || only === 'gaps' ) await gaps();
if ( ! only || only === 'heights' ) await heights();
if ( ! only || only === 'walls' ) await walls();
process.exit( 0 );
