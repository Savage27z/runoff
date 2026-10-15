// A run on a course: the Trizen simulation (the box3d engine, the runner's figure, the arcade tuning and controls)
// on a built course, stepped every frame with the assist, plus what RUNOFF adds around the runner: bounce pads, the
// kill height and the checkpoint the runner goes back to.

import { ARCADE_TUNING, Assist, applyArcade } from './arcade.js';
import { Vector3 } from 'three';
import { Simulation, World } from '@trizendigital/parkour';
import { Motion } from '@trizendigital/parkour/motion/Motion.js';
import { STEP } from '@trizendigital/parkour/sim/Simulation.js';
import box3d from '@trizendigital/parkour-box3d';
import { RunnerFigure } from '../figure/runnerFigure.js';

const BASE = import.meta.env.BASE_URL;

// A bounce pad throws the runner up at this speed (m/s): RUNOFF's 15.5, a 4.3 m rise under the arcade gravity.
const BOUNCE_SPEED = 15.5;
// ...or at this share of the speed it landed with, if more.
const BOUNCE_KEEP = 0.8;
// Speed over the run pace bleeds off at this rate on the ground (m/s²).
const OVER_DECAY = 2;

// Out of a swing bar the runner flies on at least this fast ahead and up (m/s).
const BAR_LAUNCH = { ahead: 9, up: 7 };

// A jump pressed this soon after running off an edge (s) still jumps (RUNOFF's coyote time), and so does one
// pressed this soon before it (s).
const COYOTE_TIME = 0.12;
const JUMP_BUFFER = 0.1;

// A slide lasts at least this long (s) once started, and ends when Shift is let go if there is this much room (m)
// above the sliding body's centre for the standing body.
const SLIDE_LEAST = 0.3;
// A slide kicks the speed up by this much (m/s), to at most this (m/s): RUNOFF's.
const SLIDE_BOOST = 2.6;
const SLIDE_BOOST_MAX = 15;
// The core's own slide conditions, for the slide the game starts over a landing's move: this much speed ahead (m/s),
// room for a sphere this size (m) this far ahead (m); the landing's move blends out over this long (s).
const SLIDE_LEAST_SPEED = 4;
const SLIDE_ROOM = 0.8;
const SLIDE_ROOM_RADIUS = 0.2;
const SLIDE_BLEND = 0.1;
const STAND_ROOM = 1.6;
const UP = new Vector3( 0, 1, 0 );

// A landing roll comes out this much faster than it went in (m/s): RUNOFF's roll bonus.
const ROLL_BONUS = 0.8;

// The states the run's speed is read in.
const RUNNING = new Set( [ 'sprinting', 'sliding', 'rising', 'falling', 'wallRunning' ] );

// The wall run's take carries the runner along the wall at about this speed (m/s); met faster, it plays quicker, at
// most this many times its pace (quicker still looks hurried).
const WALL_RUN_PACE = 4.7;
const WALL_RUN_QUICKEST = 1.6;

// Some moves play a little quicker than their takes, the whole run with them (so the body and its moves keep in step,
// nothing slides): the climbs, the ladders and pipes, the vault and the roll, which RUNOFF's time trials want brisk.
// More than about half again looks hurried.
const QUICKER = new Map( [ [ 'catchingLedge', 1.5 ], [ 'hanging', 1.5 ], [ 'climbingUp', 1.5 ], [ 'wallPlanted', 1.3 ], [ 'onLadder', 1.4 ], [ 'onPipe', 1.4 ], [ 'toppingOut', 1.4 ], [ 'vaulting', 1.25 ], [ 'rolling', 1.3 ] ] );

// Sets the runner's horizontal speed, keeping its direction.
function setSpeed( runner, speed ) {

	const now = runner.speed;
	if ( now < 1e-6 ) return;
	runner.velocity.x *= speed / now;
	runner.velocity.z *= speed / now;

}

export class Session {

	/**
	 * @param {object} options
	 * @param {object} options.map the course (src/courses/maps.js)
	 * @param {object} options.course its build (src/courses/build.js): `description`, `surfaces`, `spawns`
	 * @param {PerspectiveCamera} [options.camera] the camera the follow camera moves
	 * @param {HTMLCanvasElement} [options.canvas] where the pointer is captured
	 * @param {Figure} [options.figure] the body drawn; the runner's figure by default
	 * @param {object} [options.page] the core's page options (a headless run gives none)
	 */
	constructor( { map, course, camera, canvas = null, figure = new RunnerFigure(), page } ) {

		this.map = map;
		this.course = course;
		this.sim = new Simulation( {
			world: new World( course.description ), engine: box3d, camera, canvas, figure, page,
			motion: new Motion( { moves: `${BASE}data/moves.json` } ),
		} );
		applyArcade( this.sim );
		this.assist = new Assist();
		/** The spawn a fall or Q goes back to: an index into course.spawns. */
		this.checkpoint = 0;
		/** Called with each event of the run: the runner's state changes, 'bounce', 'fell', 'backToCheckpoint'. */
		this.onEvent = () => {};
		/** Raw device state a script sets each frame (the route bot), after the assist. */
		this.feed = null;
		this.time = 0;

	}

	async load( progress ) {

		await this.sim.load( progress );
		this.sim.onStep = () => this.afterStep();
		this.sim.onKeys = ( input ) => {

			if ( input.pressed( 'backToMark' ) ) this.onEvent( { type: 'backToCheckpoint' } );
			if ( input.pressed( 'restart' ) ) this.onEvent( { type: 'restart' } );

		};
		this.respawn( 0 );
		return this;

	}

	get runner() {

		return this.sim.runner;

	}

	/** The runner's feet, between its last two steps. */
	get feet() {

		return { x: this.sim.position.x, y: this.sim.position.y - 0.9215, z: this.sim.position.z };

	}

	/** Starts the run again from a spawn (the start: 0), with everything as it loaded. */
	respawn( index = 0 ) {

		this.sim.respawn( index );
		this.setCheckpoint( index );
		this.time = 0;
		this.before = null;
		this.runSpeed = 0;
		this.offEdge = 0;
		this.rolledIn = 0;
		this.stepTime = 0;
		this.jumpPressedAt = - Infinity;

	}

	/** The spawn a fall and Q go back to. */
	setCheckpoint( index ) {

		this.checkpoint = index;
		const spawn = this.course.spawns[ index ];
		this.sim.mark = { position: spawn.position.clone(), yaw: spawn.yaw };

	}

	/** Back to the checkpoint, the run going on (its clock too). */
	backToCheckpoint() {

		this.sim.backToMark();

	}

	/**
	 * One rendered frame of the run.
	 * @param {number} dt
	 * @param {object} [options] `muted`: the player's devices reach nothing (behind the menus the runner stands idle)
	 */
	frame( dt, { muted = false } = {} ) {

		const sim = this.sim;
		// The run's clock is the player's time: a ledge climb played quicker takes less of it.
		this.time += dt;
		const quicken = QUICKER.get( sim.runner.state ) ?? 1;
		if ( muted ) sim.paused = false;
		sim.frame( dt * quicken, ( input ) => {

			if ( muted ) return input.clear();
			this.assist.apply( input, sim.runner );
			this.feed?.( input );

		} );
		for ( const event of sim.frameEvents ) this.onEvent( event );

		// Below the course's kill height, or somewhere the course calls a fall (the ground under a tower): back to the
		// checkpoint.
		if ( sim.position.y - 0.9215 < this.map.killY || this.map.isDead?.( this.feet, this.checkpoint ) ) {

			this.onEvent( { type: 'fell' } );
			this.backToCheckpoint();

		}

	}

	// After every 120 Hz step: the run's clock, RUNOFF's momentum, and the bounce pads.
	afterStep() {

		const runner = this.sim.runner, p = this.sim.tuning.values;
		const speed = runner.speed, before = this.before;

		if ( before ) {

			// Leaving the ground keeps the speed it had: the core holds a walk off an edge to 6.5 m/s and a jump out of a
			// slide to 8.5, where RUNOFF carried a slide's boost over the gap. A jump out of a slide rises as a jump.
			const tookOff = before.grounded && ! runner.grounded && ( runner.state === 'rising' || runner.state === 'falling' );
			if ( tookOff && speed < before.speed && speed > 0.01 ) setSpeed( runner, before.speed );
			if ( tookOff && before.state === 'sliding' && runner.state === 'rising' ) runner.velocity.y = Math.max( runner.velocity.y, p.runningJumpSpeed );

			// A slide kicks the speed by RUNOFF's 2.6 m/s (to at most 15), where the core kicks it by half again.
			if ( runner.state === 'sliding' && before.state !== 'sliding' && runner.grounded ) {

				setSpeed( runner, Math.min( runner.speed, Math.max( before.speed, Math.min( before.speed + SLIDE_BOOST, SLIDE_BOOST_MAX ) ) ) );

			}

			// A swing bar throws the runner as far as RUNOFF's speeds want: the core's launch (5.85 m/s on, 4.25 up) carries
			// 2.3 m under the arcade gravity, too short to cross a gap; out of a bar it flies on at least BAR_LAUNCH.
			if ( before.state === 'onBar' && ( runner.state === 'falling' || runner.state === 'rising' ) ) {

				setSpeed( runner, Math.max( runner.speed, this.runSpeed, BAR_LAUNCH.ahead ) );
				runner.velocity.y = Math.max( runner.velocity.y, BAR_LAUNCH.up );

			}

			// A wall run met at a sprint plays its take quicker, in step with the speed it was met with: its own travel then
			// carries that speed and the feet keep to the wall (the core plays it at its own pace, about 3.4 m/s along it).
			if ( runner.state === 'wallRunning' && before.state !== 'wallRunning' ) {

				const clip = runner.walls.attachment?.clip;
				if ( clip ) runner.motion.moves.retime( clip, { rate: Math.min( Math.max( before.speed / WALL_RUN_PACE, 1 ), WALL_RUN_QUICKEST ) } );

			}

			// Out of a landing roll the run goes on at the speed it rolled in with and a little more (RUNOFF's roll kept the
			// speed; the core's roll ends at its take's own pace).
			if ( runner.state === 'rolling' && before.state !== 'rolling' ) this.rolledIn = this.runSpeed;
			if ( before.state === 'rolling' && runner.state !== 'rolling' && this.rolledIn > runner.speed ) {

				const ahead = runner.forward();
				runner.velocity.x = ahead.x * ( this.rolledIn + ROLL_BONUS );
				runner.velocity.z = ahead.z * ( this.rolledIn + ROLL_BONUS );

			}

			// Running faster than the run pace, the speed over it bleeds off slowly (RUNOFF's 2 m/s²), so a clean chain
			// keeps its speed; the core would brake it down to the pace at once.
			if ( runner.state === 'sprinting' && runner.grounded && before.speed > p.sprintSpeed && speed < before.speed - OVER_DECAY * STEP ) {

				setSpeed( runner, Math.max( p.sprintSpeed, before.speed - OVER_DECAY * STEP ) );

			}

		}

		// Coyote time (RUNOFF's): a jump pressed just after running off an edge still jumps, as from the edge; so does
		// one pressed just before it that the edge came too soon for.
		const input = this.sim.input;
		this.stepTime += STEP;
		if ( input.pressed( 'jump' ) ) this.jumpPressedAt = this.stepTime;
		const walkedOff = before?.grounded && ! runner.grounded && runner.state === 'falling' && runner.velocity.y > 0;
		if ( walkedOff ) this.offEdge = COYOTE_TIME;
		if ( this.offEdge > 0 ) {

			this.offEdge = runner.grounded || runner.state !== 'falling' ? 0 : this.offEdge - STEP;
			const pressedLate = this.offEdge > 0 && input.pressed( 'jump' );
			const pressedEarly = walkedOff && this.stepTime - this.jumpPressedAt < JUMP_BUFFER;
			if ( pressedLate || pressedEarly ) {

				runner.motion.moves.stop( 'walkOffHop' );
				runner.velocity.y = p.runningJumpSpeed;
				runner.openAirComboSoon();
				runner.setState( 'rising' );
				this.offEdge = 0;
				this.onEvent( { type: 'coyoteJump' } );

			}

		}

		// Shift held running: a slide, even while a landing's move still plays (the core waits for it to end; RUNOFF slid
		// at once). The core starts every other slide itself.
		if ( input.held( 'slide' ) && runner.grounded && runner.state === 'sprinting' && ! runner.stunt && runner.motion.moves.busy() && ! runner.clock.held( 'slideCooldown' ) && runner.velocity.dot( runner.forward() ) > SLIDE_LEAST_SPEED ) {

			const clear = runner.position.clone().addScaledVector( runner.forward(), SLIDE_ROOM );
			if ( ! this.sim.queries.sphereCast( runner.position, clear, SLIDE_ROOM_RADIUS ) ) {

				const speed = runner.speed;
				runner.motion.moves.stop( undefined, SLIDE_BLEND );
				if ( runner.slides.begin() ) setSpeed( runner, Math.min( runner.speed, Math.max( speed, Math.min( speed + SLIDE_BOOST, SLIDE_BOOST_MAX ) ) ) );

			}

		}

		// A slide lasts while Shift is held (RUNOFF's), at least SLIDE_LEAST, where there is room to stand up.
		if ( runner.state === 'sliding' && runner.grounded && ! input.held( 'slide' ) && runner.stateTime > SLIDE_LEAST && this.roomToStand( runner ) ) {

			runner.slides.end();

		}

		const floor = this.sim.mover.floor;
		if ( runner.grounded && floor?.solid?.tags.includes( 'bounce' ) && runner.velocity.y <= 0.01 ) {

			const impact = before?.fall ?? 0;
			runner.velocity.y = Math.max( BOUNCE_SPEED, impact * BOUNCE_KEEP );
			runner.grounded = false;
			runner.setState( 'rising' );
			this.onEvent( { type: 'bounce', impact } );

		}

		// The speed the runner last ran or flew with, for the moves that carry it.
		if ( RUNNING.has( runner.state ) ) this.runSpeed = runner.speed;
		this.before = { grounded: runner.grounded, state: runner.state, speed: runner.speed, fall: runner.grounded ? 0 : Math.max( 0, - runner.velocity.y ) };

	}

	// Whether a sliding runner has room above it to stand: rays up through where the standing body would be.
	roomToStand( runner ) {

		const queries = this.sim.queries, ahead = runner.forward().multiplyScalar( 0.18 );
		for ( const offset of [ 0, 1, - 1 ] ) {

			const from = runner.position.clone().addScaledVector( ahead, offset );
			if ( queries.ray( from, UP, STAND_ROOM, 'probe' ) ) return false;

		}

		return true;

	}

	dispose() {

		this.sim.dispose();

	}

}

export { ARCADE_TUNING };
