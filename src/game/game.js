// The game: the stage, the course on it and the run on the course, and what the player is doing with them: on the
// home screen and the menus (the runner stands idle on the course while the camera circles it), playing a time trial,
// paused, or looking at their result. It loads courses and runners (a new run on the course each time), keeps the
// player's progress (save.js), plays the sound, and tells the UI (src/ui/ui.js) what changed.

import * as THREE from 'three/webgpu';
import { TUNING_DEFAULTS } from '@trizendigital/parkour/sim/tuning.js';
import { MAPS } from '../courses/maps.js';
import { buildCourse } from '../courses/build.js';
import { setupEnvironment } from '../world/environment.js';
import { Session } from '../sim/session.js';
import { RunnerFigure } from '../figure/runnerFigure.js';
import { CHARACTERS, characterById } from '../figure/characters.js';
import { Trial, medalFor } from './trial.js';
import { Save } from './save.js';
import { Sound } from '../audio/sound.js';

// A frame counts as at most this long (s): after a stall everything goes on from where it was.
const LONGEST_FRAME = 1 / 20;

// The menus' camera: circling the runner (radius, height over its middle, turn per second), with the runner shown off
// to one side of the screen (a share of the width: + right) so the menu has the other.
const ORBIT = {
	home: { radius: 4.4, height: 0.7, speed: 0.12, side: 0.2, fov: 40 },
	locker: { radius: 2.9, height: 0.35, speed: 0, side: - 0.2, fov: 38 },
	page: { radius: 5.5, height: 1.1, speed: 0.06, side: 0, fov: 42 },
};

// The tints the Locker offers (the runner's colours multiplied by one), and the stars each needs.
export const TINTS = [
	{ id: null, name: 'Original', stars: 0 },
	{ id: '#ff5a1f', name: 'Ember', stars: 0 },
	{ id: '#3fa9ff', name: 'Sky', stars: 0 },
	{ id: '#c6ff3d', name: 'Lime', stars: 1 },
	{ id: '#ff2e88', name: 'Neon', stars: 2 },
	{ id: '#ffcf40', name: 'Gold', stars: 4 },
	{ id: '#9b6bff', name: 'Violet', stars: 6 },
	{ id: '#2fd6b5', name: 'Mint', stars: 8 },
	{ id: '#3a3d46', name: 'Shadow', stars: 10 },
];

// Graphics by quality: pixels drawn per CSS pixel (at most), and shadows.
const QUALITY = { high: { scale: 1.5, shadows: true }, medium: { scale: 1, shadows: true }, low: { scale: 0.75, shadows: false } };

/** Whether a course can be played: rebuilt for the new runner, and its stars earned. */
export function courseOpen( map, stars ) {

	return Boolean( map.rebuilt ) && stars >= ( map.unlock ?? 0 );

}

export class Game {

	constructor( stage ) {

		this.stage = stage;
		this.save = Save.load();
		this.sound = new Sound();
		this.sound.setVolume( this.save.data.settings.volume );
		this.maps = MAPS;
		this.characters = CHARACTERS;
		this.mode = 'loading';
		this.ui = null;

		this.playCamera = new THREE.PerspectiveCamera( 70, innerWidth / innerHeight, 0.05, 2600 );
		this.menuCamera = new THREE.PerspectiveCamera( 40, innerWidth / innerHeight, 0.05, 2600 );
		this.orbit = { angle: 0.7, mode: null };
		stage.onResize.push( () => {

			for ( const camera of [ this.playCamera, this.menuCamera ] ) {

				camera.aspect = innerWidth / innerHeight;
				camera.updateProjectionMatrix();

			}

		} );

		this.map = null;
		this.course = null;
		this.env = null;
		this.session = null;
		this.trial = null;
		this.elapsed = 0;

		for ( const type of [ 'pointerdown', 'keydown' ] ) addEventListener( type, () => this.sound.unlock(), { capture: true } );

	}

	get stars() {

		return this.save.stars();

	}

	get character() {

		return characterById( this.save.data.character ?? CHARACTERS[ 0 ].id );

	}

	// ---- Loading

	/**
	 * Loads a course and a run on it with the chosen runner (the run before it let go of).
	 * @param {string} id the course's id
	 * @param {(text: string) => void} progress told what is loading
	 */
	async load( id, progress = () => {} ) {

		const map = this.maps.find( ( m ) => m.id === id ) ?? this.maps[ 0 ];
		if ( map !== this.map ) {

			this.unloadCourse();
			progress( `Building ${map.name}…` );
			this.map = map;
			this.course = buildCourse( map, this.stage.scene );
			this.env = setupEnvironment( this.stage, map.theme, map.env || {} );

		}

		await this.loadRun( progress );
		this.save.data.lastCourse = map.id;
		this.save.persist();

	}

	// A new run on the course: the chosen runner, the trial, the settings.
	async loadRun( progress = () => {} ) {

		this.unloadRun();
		const figure = new RunnerFigure( { character: this.character.id } );
		const session = await new Session( { map: this.map, course: this.course, camera: this.playCamera, canvas: this.stage.renderer.domElement, figure } ).load( progress );
		this.session = session;
		this.stage.scene.add( figure.root );
		this.applyTint();
		this.applySettings();
		session.onEvent = ( event ) => this.onRunEvent( event );
		session.sim.input.onCaptureChange = ( on ) => {

			if ( ! on && this.mode === 'play' ) this.pause();

		};
		this.trial = new Trial( this.map, session, this.course.world.group, this.save.course( this.map.id ).best != null ? this.save.course( this.map.id ) : null );
		this.trial.onSplit = ( split ) => {

			this.sound.checkpoint( split.diff == null || split.diff <= 0 );
			this.ui?.hud.split( split );

		};
		this.trial.onFinish = ( result ) => this.finish( result );

	}

	unloadRun() {

		if ( ! this.session ) return;
		this.trial?.dispose();
		this.session.dispose();
		this.session.sim.figure.root.removeFromParent();
		this.session.sim.figure.root.traverse( ( o ) => {

			o.geometry?.dispose();
			for ( const m of [ o.material ].flat() ) m?.dispose?.();

		} );
		this.session = this.trial = null;

	}

	unloadCourse() {

		this.unloadRun();
		if ( this.course ) {

			this.course.world.clear();
			this.course.world.group.removeFromParent();
			this.env?.dispose();

		}

		this.course = this.env = this.map = null;

	}

	// ---- What the player does

	/** To a screen of the menus (home, courses, locker, settings, help). */
	toMenu( screen = 'home' ) {

		if ( this.mode === 'play' || this.mode === 'paused' || this.mode === 'results' ) {

			this.session?.sim.input.releaseCapture();
			this.session?.respawn( 0 );
			this.trial?.start();

		}

		this.mode = 'menu';
		const orbit = screen === 'locker' ? 'locker' : screen === 'home' ? 'home' : 'page';
		// The camera comes round to the runner's front (a little to its side) on the home screen and in the Locker.
		if ( orbit !== this.orbit.mode && orbit !== 'page' ) this.orbit.angle = ( this.session?.runner.yaw ?? 0 ) + ( orbit === 'locker' ? 0.35 : 0.7 );
		this.orbit.mode = orbit;
		this.sound.hush();
		this.ui?.show( screen );

	}

	/** Plays a course (loading it, and the runner, if they are not the ones on the stage). */
	async play( id = this.map.id ) {

		if ( id !== this.map?.id ) {

			window.loading.show( 'Loading the course', 8 );
			await this.load( id, ( text ) => window.loading.step( text ) );
			window.loading.done();

		}

		this.start();

	}

	/** The trial from the start line. */
	start() {

		this.session.respawn( 0 );
		this.trial.best = this.save.course( this.map.id ).best != null ? this.save.course( this.map.id ) : null;
		this.trial.start();
		this.mode = 'play';
		this.ui?.show( 'hud' );
		this.ui?.hud.reset( this.map );
		this.ui?.hud.prompt( 'Move to start', 'the clock starts on your first step' );
		this.session.sim.input.capture();

	}

	pause() {

		if ( this.mode !== 'play' ) return;
		this.mode = 'paused';
		this.session.sim.paused = true;
		this.sound.hush();
		this.ui?.show( 'pause' );

	}

	resume() {

		if ( this.mode !== 'paused' ) return;
		this.mode = 'play';
		this.session.sim.input.clear();
		this.session.sim.paused = false;
		this.ui?.show( 'hud' );
		this.session.sim.input.capture();

	}

	finish( result ) {

		const record = this.save.course( this.map.id ), before = this.stars;
		const pb = record.best == null || result.time < record.best;
		record.runs ++;
		if ( pb ) {

			record.best = result.time;
			record.splits = result.splits;

		}

		record.medal = Math.max( record.medal, result.medal );
		this.save.persist();
		const after = this.stars;
		const opened = this.maps.filter( ( m ) => m.rebuilt && ( m.unlock ?? 0 ) > before && ( m.unlock ?? 0 ) <= after );
		this.sound.finish( result.medal );
		this.mode = 'results';
		this.session.sim.input.releaseCapture();
		this.ui?.showResults( { map: this.map, result, pb, record, stars: { before, after }, opened } );

	}

	/** The next course to play after this one (open, after it in the list), or null. */
	nextCourse() {

		const i = this.maps.indexOf( this.map );
		return this.maps.slice( i + 1 ).find( ( m ) => courseOpen( m, this.stars ) ) ?? null;

	}

	onRunEvent( event ) {

		if ( this.mode !== 'play' ) return;
		if ( event.type === 'fell' || event.type === 'backToCheckpoint' ) this.trial.respawned();
		if ( event.type === 'restart' ) this.start();
		if ( event.type === 'bounce' ) this.sound.bounce();

	}

	// ---- The Locker and the settings

	async setCharacter( id ) {

		if ( id === this.character.id ) return;
		this.save.data.character = id;
		this.save.persist();
		window.loading.show( `Loading ${characterById( id ).name}`, 4 );
		await this.loadRun( ( text ) => window.loading.step( text ) );
		window.loading.done();

	}

	setTint( id ) {

		this.save.data.tint = id;
		this.save.persist();
		this.applyTint();

	}

	// The runner's materials multiplied by the tint (their own colours kept to go back to).
	applyTint() {

		const tint = this.save.data.tint;
		this.session?.sim.figure.root.traverse( ( o ) => {

			if ( ! o.isMesh ) return;
			for ( const m of [ o.material ].flat() ) {

				m.userData.color ??= m.color.clone();
				if ( tint ) m.color.copy( m.userData.color ).multiply( new THREE.Color( tint ) ).lerp( new THREE.Color( tint ), 0.25 );
				else m.color.copy( m.userData.color );

			}

		} );

	}

	setSetting( key, value ) {

		this.save.data.settings[ key ] = value;
		this.save.persist();
		this.applySettings();

	}

	applySettings() {

		const s = this.save.data.settings, renderer = this.stage.renderer;
		const quality = QUALITY[ s.quality ] ?? QUALITY.high;
		this.stage.pixelScale = quality.scale;
		renderer.setPixelRatio( Math.min( devicePixelRatio, quality.scale ) );
		renderer.setSize( innerWidth, innerHeight );
		this.stage.sun.castShadow = quality.shadows;
		this.sound.setVolume( s.volume );
		const sim = this.session?.sim;
		if ( ! sim ) return;
		const v = sim.tuning.values;
		v.mouseSensitivity = TUNING_DEFAULTS.mouseSensitivity * s.sensitivity;
		v.fov = THREE.MathUtils.degToRad( s.fov );
		v.cameraDistance = s.cameraDistance;
		sim.input.preferences.values.invertMouseY = s.invertY;

	}

	// ---- Every frame

	frame( rawDt ) {

		const dt = Math.min( rawDt, LONGEST_FRAME );
		this.elapsed += dt;
		const session = this.session;
		if ( ! session ) return;

		// Paused, the run holds still (no frames at all, so a key pressed on the pause menu never reaches it).
		const playing = this.mode === 'play' || this.mode === 'paused';
		if ( this.mode !== 'paused' ) session.frame( dt, { muted: ! playing } );

		if ( this.mode === 'play' ) {

			if ( session.sim.paused ) this.pause();
			this.trial.update( dt, this.elapsed );
			this.sound.frame( session );

		} else this.trial?.update( 0, this.elapsed );

		this.course.world.update( this.elapsed, dt );
		this.env.update( this.elapsed );
		this.env.center( session.sim.position.x, session.sim.position.z );
		this.ui?.frame( dt );

		const camera = playing ? this.playCamera : this.circle( dt );
		this.stage.render( camera );

	}

	// The menus' camera, circling the runner as it stands.
	circle( dt ) {

		const o = ORBIT[ this.orbit.mode ], camera = this.menuCamera, at = this.session.sim.position;
		this.orbit.angle += o.speed * dt;
		const a = this.orbit.angle;
		camera.position.set( at.x + Math.sin( a ) * o.radius, at.y + o.height, at.z + Math.cos( a ) * o.radius );
		camera.lookAt( at.x, at.y + 0.15, at.z );
		if ( camera.fov !== o.fov ) {

			camera.fov = o.fov;
			camera.updateProjectionMatrix();

		}

		// The runner shown off to the side: the view slid the other way.
		const w = innerWidth, h = innerHeight;
		if ( o.side ) camera.setViewOffset( w, h, - o.side * w, 0, w, h );
		else camera.clearViewOffset();
		return camera;

	}

}

export { medalFor };
