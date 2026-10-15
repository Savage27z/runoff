// Runs the traversal kit's test yard (src/courses/kit.js) headless: each lane from its spawn with forward held and its
// presses, and whether the runner reaches the state the lane expects. `node tools/kit.mjs [lane]`
import './headless/env.mjs';

await import( '../src/sim/arcade.js' );
const THREE = await import( 'three' );
const { KIT } = await import( '../src/courses/kit.js' );
const { buildCourse } = await import( '../src/courses/build.js' );
const { Session } = await import( '../src/sim/session.js' );
const { pressKeys } = await import( '../src/dev/bot.js' );
const { Figure } = await import( '@trizendigital/parkour' );

const only = process.argv[ 2 ];
const course = buildCourse( KIT, new THREE.Scene() );
const session = await new Session( { map: KIT, course, figure: new Figure() } ).load();
let failed = 0;
for ( const lane of KIT.lanes.filter( ( l ) => ! only || l.name === only ) ) {

	session.sim.respawn( { position: [ lane.x, ( lane.y ?? 0 ) + 0.9215, - 4 ], yaw: 0 } );
	const keys = new Set();
	session.feed = pressKeys( keys );
	const states = [];
	session.onEvent = ( e ) => e.to && states.push( e.to );
	const presses = ( lane.press ?? [] ).map( ( [ key, at ] ) => ( { key, at, frames: 0 } ) );
	for ( let f = 0; f < 300 && ! states.includes( lane.expect ); f ++ ) {

		keys.clear();
		keys.add( 'KeyW' );
		const travelled = session.feet.z + 4;
		for ( const p of presses ) {

			if ( p.frames === 0 && travelled >= p.at ) p.frames = 2;
			if ( p.frames > 0 ) {

				keys.add( p.key === 'jump' ? 'Space' : p.key );
				p.frames = p.frames === 1 ? - 1 : p.frames - 1;

			}

		}

		session.frame( 1 / 60 );
		// A pose input (walking a beam) is read off the runner's pose inputs, not its state.
		if ( lane.pose && session.sim.poseInputs[ lane.expect ] ) states.push( lane.expect );

	}

	const ok = states.includes( lane.expect );
	if ( ! ok ) failed ++;
	console.log( `${ok ? 'PASS' : 'FAIL'} ${lane.name.padEnd( 8 )} -> ${lane.expect.padEnd( 10 )} ${states.filter( ( s, i ) => s !== states[ i - 1 ] ).join( ' > ' )}` );

}

process.exit( failed ? 1 : 0 );
