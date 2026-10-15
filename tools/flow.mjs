// The flow check: runs each bot route headless and lists the stretches of plain running (on the ground, sprinting,
// nothing to do) longer than a limit, where a course wants something in the runner's way, and how many moves a run
// makes. `node tools/flow.mjs [course] [route] [limit s = 2]`
import './headless/env.mjs';

await import( '../src/sim/arcade.js' );
const THREE = await import( 'three' );
const { MAPS } = await import( '../src/courses/maps.js' );
const { buildCourse } = await import( '../src/courses/build.js' );
const { Session } = await import( '../src/sim/session.js' );
const { runRoute, ROUTES } = await import( '../src/dev/bot.js' );
const { Figure } = await import( '@trizendigital/parkour' );

const [ only, onlyRoute, limitArg = '2' ] = process.argv.slice( 2 );
const limit = Number( limitArg );
const PLAIN = new Set( [ 'sprinting', 'running', 'walking', 'standing' ] );
for ( const [ id, routes ] of Object.entries( ROUTES ) ) {

	if ( only && only !== 'all' && id !== only ) continue;
	const map = MAPS.find( ( m ) => m.id === id );
	const session = await new Session( { map, course: buildCourse( map, new THREE.Scene() ), figure: new Figure() } ).load();
	for ( const [ name, waypoints ] of Object.entries( routes ) ) {

		if ( onlyRoute && onlyRoute !== 'all' && name !== onlyRoute ) continue;
		let from = null, moves = 0, last = null;
		const stretches = [];
		const step = session.afterStep.bind( session );
		session.afterStep = function () {

			step();
			const r = this.sim.runner, f = this.feed ? this.feet : this.feet;
			const plain = r.grounded && PLAIN.has( r.state );
			if ( r.state !== last && ! PLAIN.has( r.state ) && r.state !== 'falling' ) moves ++;
			last = r.state;
			if ( plain && ! from ) from = { t: this.time, z: f.z, y: f.y };
			if ( ! plain && from ) {

				if ( this.time - from.t > limit ) stretches.push( `${( this.time - from.t ).toFixed( 1 )}s z ${from.z.toFixed( 0 )}..${f.z.toFixed( 0 )} (y ${from.y.toFixed( 1 )})` );
				from = null;

			}

		};
		const result = runRoute( session, waypoints );
		session.afterStep = step;
		const time = result.finish ?? 0;
		console.log( `${id}/${name}: ${result.finish != null ? `${time.toFixed( 1 )}s` : 'FAIL'}, ${moves} moves (one every ${( time / Math.max( moves, 1 ) ).toFixed( 1 )}s); plain runs over ${limit}s: ${stretches.length}` );
		for ( const s of stretches ) console.log( `    ${s}` );

	}

	session.dispose();

}

process.exit( 0 );
