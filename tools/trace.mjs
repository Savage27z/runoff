// Runs a bot route headless and prints the runner at every step between two times (s): what a landing or a catch did,
// and on what. `node tools/trace.mjs <course> <route> <from> <to>`
import './headless/env.mjs';
await import( '../src/sim/arcade.js' );
const THREE = await import( 'three' );
const { MAPS } = await import( '../src/courses/maps.js' );
const { buildCourse } = await import( '../src/courses/build.js' );
const { Session } = await import( '../src/sim/session.js' );
const { runRoute, ROUTES } = await import( '../src/dev/bot.js' );
const { Figure } = await import( '@trizendigital/parkour' );
const [ id, route, t0, t1 ] = process.argv.slice( 2 );
const map = MAPS.find( ( m ) => m.id === id );
const session = await new Session( { map, course: buildCourse( map, new THREE.Scene() ), figure: new Figure() } ).load();
const step = session.afterStep.bind( session );
session.afterStep = function () {
	step();
	const r = this.sim.runner, f = this.feet;
	if ( this.time >= Number( t0 ) && this.time <= Number( t1 ) ) console.log( `${this.time.toFixed( 3 )} ${r.state.padEnd( 12 )} g=${r.grounded ? 1 : 0} v=${r.speed.toFixed( 2 )} vel=${r.velocity.toArray().map( ( v ) => v.toFixed( 2 ) ).join( ',' )} feet=${f.x.toFixed( 2 )},${f.y.toFixed( 2 )},${f.z.toFixed( 2 )} floor=${this.sim.mover.floor?.solid?.id ?? '-'} n=${this.sim.mover.floor?.normal?.toArray().map( ( v ) => v.toFixed( 2 ) ).join( ',' ) ?? ''}` );
};
runRoute( session, ROUTES[ id ][ route ] );
process.exit( 0 );
