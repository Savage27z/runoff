// Lists the solids of a course near a box: `node tools/near.mjs <course> x0 y0 z0 x1 y1 z1`
import './headless/env.mjs';

const THREE = await import( 'three' );
const { MAPS } = await import( '../src/courses/maps.js' );
const { buildCourse } = await import( '../src/courses/build.js' );

const [ id, ...box ] = process.argv.slice( 2 );
const [ x0, y0, z0, x1, y1, z1 ] = box.map( Number );
const course = buildCourse( MAPS.find( ( m ) => m.id === id ), new THREE.Scene() );
for ( const s of course.description.solids ) {

	const b = new THREE.Box3();
	if ( s.shape.kind === 'box' ) {

		const p = new THREE.Vector3( ...s.position ), h = new THREE.Vector3( ...s.shape.halfExtents );
		b.set( p.clone().sub( h ), p.clone().add( h ) );

	} else if ( s.shape.points ) b.setFromArray( s.shape.points.flat() );
	else if ( s.shape.vertices ) b.setFromArray( s.shape.vertices.flat() );
	else { console.log( 'shape?', s.id, s.shape.kind, Object.keys( s.shape ) ); continue; }

	if ( b.max.x < x0 || b.min.x > x1 || b.max.y < y0 || b.min.y > y1 || b.max.z < z0 || b.min.z > z1 ) continue;
	const f = ( v ) => `${v.x.toFixed( 2 )},${v.y.toFixed( 2 )},${v.z.toFixed( 2 )}`;
	console.log( `${s.id} ${s.shape.kind} ${f( b.min )} .. ${f( b.max )} ${( s.tags ?? [] ).join( ' ' )}` );

}

process.exit( 0 );
