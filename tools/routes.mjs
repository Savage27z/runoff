// Runs the route bot headless over every course (or one): `node tools/routes.mjs [course] [route]`
import './headless/env.mjs';

await import( '../src/sim/arcade.js' );
const THREE = await import( 'three' );
const { MAPS } = await import( '../src/courses/maps.js' );
const { buildCourse } = await import( '../src/courses/build.js' );
const { Session } = await import( '../src/sim/session.js' );
const { runRoute, ROUTES } = await import( '../src/dev/bot.js' );
const { Figure } = await import( '@trizendigital/parkour' );

const [ only, onlyRoute ] = process.argv.slice( 2 );
runRoute.verbose = Boolean( process.env.VERBOSE );
for ( const [ id, routes ] of Object.entries( ROUTES ) ) {

	if ( only && id !== only ) continue;
	const map = MAPS.find( ( m ) => m.id === id );
	const course = buildCourse( map, new THREE.Scene() );
	const session = await new Session( { map, course, figure: new Figure() } ).load();
	for ( const [ name, waypoints ] of Object.entries( routes ) ) {

		if ( onlyRoute && name !== onlyRoute ) continue;
		const result = runRoute( session, waypoints );
		console.log( `${id}/${name}: ${result.finish != null ? `FINISH ${result.finish.toFixed( 2 )}s` : `FAIL (${result.checkpoints}/${map.checkpoints.length} checkpoints)`}  [medals ${map.medals.join( ' / ' )}]` );
		console.log( result.log.join( '\n' ) );

	}

	session.dispose();

}

process.exit( 0 );
