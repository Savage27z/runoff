// The stage: the WebGPU renderer (WebGL2 where WebGPU is missing), the scene, and the sun with soft cascaded shadows.
// What lights the scene (sky, haze, the sun's colour and direction) comes from a course's theme (src/world/world.js).
// Rendering only: nothing here touches a run.

import * as THREE from 'three/webgpu';
import { Fn, float, reference, renderGroup, texture, vec2 } from 'three/tsl';
import { CSMShadowNode } from 'three/addons/csm/CSMShadowNode.js';

// A 4 × 4 percentage-closer filter spread over the shadow's radius: softer edges than the built-in 2 × 2.
const softShadowFilter = Fn( ( { depthTexture, shadowCoord, shadow, depthLayer } ) => {

	const mapSize = reference( 'mapSize', 'vec2', shadow ).setGroup( renderGroup );
	const radius = reference( 'radius', 'float', shadow ).setGroup( renderGroup );
	const step = radius.div( 1.5 ).div( mapSize );
	let sum = float( 0 );
	for ( let y = 0; y < 4; y ++ ) {

		for ( let x = 0; x < 4; x ++ ) {

			let depth = texture( depthTexture, shadowCoord.xy.add( vec2( x - 1.5, y - 1.5 ).mul( step ) ) );
			if ( depthTexture.isArrayTexture ) depth = depth.depth( depthLayer );
			sum = sum.add( depth.compare( shadowCoord.z ) );

		}

	}

	return sum.div( 16 );

} );

// Cascaded shadows whose penumbra keeps one width in metres in every cascade.
class SoftCSM extends CSMShadowNode {

	constructor( light, data, { softness = 0.04, normalBias = 1.2 } = {} ) {

		super( light, data );
		this.softness = softness;
		this.normalBiasTexels = normalBias;

	}

	_init( builder ) {

		super._init( builder );
		for ( const light of this.lights ) light.shadow.filterNode = softShadowFilter;

	}

	_updateShadowBounds() {

		super._updateShadowBounds();
		for ( const light of this.lights ) {

			const shadow = light.shadow, texel = ( shadow.camera.right - shadow.camera.left ) / shadow.mapSize.x;
			shadow.radius = THREE.MathUtils.clamp( this.softness / texel, 1.5, 3 );
			shadow.normalBias = texel * this.normalBiasTexels;

		}

	}

}

export class Stage {

	constructor( container ) {

		this.container = container;
		this.scene = new THREE.Scene();
		this.onResize = [];
		this.waiting = [];
		this.pipeline = null;

	}

	async init() {

		const renderer = new THREE.WebGPURenderer( { antialias: true } );
		renderer.setPixelRatio( Math.min( devicePixelRatio, 1.5 ) );
		renderer.setSize( innerWidth, innerHeight );
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFShadowMap;
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		await renderer.init();
		this.container.appendChild( renderer.domElement );
		this.renderer = renderer;

		// Four cascades over the nearest 160 m; the light reaches 60 m past each so rooftops outside a cascade still cast
		// into it.
		const sun = new THREE.DirectionalLight();
		sun.castShadow = true;
		sun.shadow.mapSize.set( 2048, 2048 );
		sun.shadow.bias = - 0.0002;
		sun.shadow.camera.near = 0.5;
		sun.shadow.camera.far = 600;
		this.csm = new SoftCSM( sun, { cascades: 4, maxFar: 160, mode: 'practical', lightMargin: 60 } );
		this.csm.fade = true;
		sun.shadow.shadowNode = this.csm;
		this.hemi = new THREE.HemisphereLight( 0xffffff, 0x777777, 1.5 );
		this.scene.add( sun, sun.target, this.hemi );
		this.sun = sun;
		this.csmCamera = '';

		addEventListener( 'resize', () => this.resize() );
		return this;

	}

	get backendName() {

		return this.renderer.backend.isWebGPUBackend ? 'WebGPU' : 'WebGL2';

	}

	resize() {

		// The screen's density can change with the window (dragged to another monitor, zoomed); the graphics setting
		// caps it (Game.applySettings sets pixelScale).
		this.renderer.setPixelRatio( Math.min( devicePixelRatio, this.pixelScale ?? 1.5 ) );
		this.renderer.setSize( innerWidth, innerHeight );
		for ( const callback of this.onResize ) callback();

	}

	render( camera ) {

		// The shadow cascades are fitted to a camera's frustum: again whenever the camera or its projection changes.
		const csm = this.csm, projection = camera.projectionMatrix.elements;
		const key = `${camera.uuid}:${projection[ 0 ]}:${projection[ 5 ]}`;
		if ( csm.camera !== null && key !== this.csmCamera ) {

			csm.camera = camera;
			csm.updateFrustums();

		}

		this.csmCamera = key;
		if ( this.pipeline && this.pipeline.camera === camera ) this.pipeline.render();
		else this.renderer.render( this.scene, camera );

		for ( const wait of this.waiting ) if ( -- wait.left <= 0 ) wait.done();
		this.waiting = this.waiting.filter( ( wait ) => wait.left > 0 );

	}

	/** Waits for `count` frames to be drawn. */
	frames( count ) {

		return new Promise( ( done ) => this.waiting.push( { left: count, done } ) );

	}

}
