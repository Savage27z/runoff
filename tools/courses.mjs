// Builds every course headless and drops the runner at each spawn: the solids load into the physics engine and the
// runner stands. `node tools/courses.mjs [id]`
import './headless/env.mjs';

const THREE = await import( 'three' );
const { MAPS } = await import( '../src/courses/maps.js' );
const { buildCourse } = await import( '../src/courses/build.js' );
const { Simulation, World, Figure } = await import( '@trizendigital/parkour' );
const { Motion } = await import( '@trizendigital/parkour/motion/Motion.js' );
const box3d = ( await import( '@trizendigital/parkour-box3d' ) ).default;

const only = process.argv[ 2 ];
for ( const map of MAPS.filter( ( m ) => ! only || m.id === only ) ) {

	const started = performance.now();
	const course = buildCourse( map, new THREE.Scene() );
	const solids = course.description.solids;
	const hulls = solids.filter( ( s ) => s.shape.kind === 'hull' ).length;
	const sim = new Simulation( { world: new World( course.description ), engine: box3d, figure: new Figure(), motion: new Motion( { moves: './data/moves.json' } ) } );
	await sim.load();
	const built = performance.now() - started;
	const report = [];
	for ( let i = 0; i < course.spawns.length; i ++ ) {

		sim.respawn( i );
		for ( let f = 0; f < 90; f ++ ) sim.frame( 1 / 60 );
		const r = sim.runner;
		report.push( `${i}:${r.state === 'standing' ? 'ok' : r.state}${r.grounded ? '' : '(air)'}@${r.position.y.toFixed( 2 )}` );

	}

	console.log( `${map.id.padEnd( 10 )} ${String( solids.length ).padStart( 5 )} solids (${hulls} hulls) built+loaded ${built.toFixed( 0 )} ms  spawns ${report.join( ' ' )}` );
	sim.dispose();

}

process.exit( 0 );
