// Runs a course headless with a held set of keys and prints what the runner does: a quick look at the feel.
// `node tools/probe.mjs <course> <seconds> <keys,...> [spawn]`
import './headless/env.mjs';

await import( '../src/sim/arcade.js' );
const THREE = await import( 'three' );
const { MAPS } = await import( '../src/courses/maps.js' );
const { buildCourse } = await import( '../src/courses/build.js' );
const { Session } = await import( '../src/sim/session.js' );
const { Figure } = await import( '@trizendigital/parkour' );

const [ id = 'rooftops', seconds = '6', keyList = 'KeyW', spawn = '0' ] = process.argv.slice( 2 );
const map = MAPS.find( ( m ) => m.id === id );
const course = buildCourse( map, new THREE.Scene() );
const session = await new Session( { map, course, figure: new Figure() } ).load();
session.respawn( Number( spawn ) );
const keys = keyList.split( ',' ).filter( Boolean );
session.feed = ( input ) => {

	for ( const k of keys ) input.keys.add( k );

};
const events = [];
session.onEvent = ( e ) => events.push( `${session.time.toFixed( 2 )} ${e.type ?? `${e.from}->${e.to}`}` );
let next = 0;
for ( let t = 0; t < Number( seconds ); t += 1 / 60 ) {

	session.frame( 1 / 60 );
	if ( t >= next ) {

		const r = session.runner, f = session.feet;
		console.log( `t=${t.toFixed( 2 )} ${r.state.padEnd( 14 )} v=${r.speed.toFixed( 2 )} vy=${r.velocity.y.toFixed( 2 )} feet=(${f.x.toFixed( 1 )}, ${f.y.toFixed( 2 )}, ${f.z.toFixed( 1 )})` );
		next += 0.25;

	}

}

console.log( events.join( '\n' ) );
process.exit( 0 );
