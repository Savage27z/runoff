// Writes the Y Bot's rest skeleton (src/figure/ybot-rest.json): each bone's parent, rest position and rest rotation
// in the model's space (metres, facing +z), which src/figure/fit.js fits other Mixamo characters to, so the takes (made
// on the Y Bot) pose them the same way. `node tools/characters/ybot-rest.mjs`
import '../headless/env.mjs';

const THREE = await import( 'three' );
const { GLTFLoader } = await import( 'three/addons/loaders/GLTFLoader.js' );
const fs = await import( 'node:fs' );

const data = fs.readFileSync( 'public/models/ybot.glb' );
const loader = new GLTFLoader().register( () => ( { name: 'noTextures', loadTexture: () => Promise.resolve( null ) } ) );
const gltf = await new Promise( ( done, fail ) => loader.parse( data.buffer.slice( data.byteOffset, data.byteOffset + data.byteLength ), '', done, fail ) );
const scene = gltf.scene;
scene.updateMatrixWorld( true );

const bones = {};
const round = ( v ) => Math.round( v * 1e6 ) / 1e6;
scene.traverse( ( o ) => {

	if ( ! o.isBone ) return;
	const p = o.getWorldPosition( new THREE.Vector3() ), q = o.getWorldQuaternion( new THREE.Quaternion() );
	bones[ o.name ] = { parent: o.parent.isBone ? o.parent.name : null, p: p.toArray().map( round ), q: q.toArray().map( round ), local: o.position.toArray().map( round ) };

} );

fs.writeFileSync( 'src/figure/ybot-rest.json', JSON.stringify( { bones }, null, '\t' ) + '\n' );
console.log( `ybot-rest: ${Object.keys( bones ).length} bones, hips at ${bones.mixamorigHips.p[ 1 ]} m` );
process.exit( 0 );
