// RUNOFF's feel on the Trizen runner: the controls RUNOFF players know, the fast arcade tuning, and the assist that
// stands in for RUNOFF's automatic moves (run at a wall to climb it, jump at a wall to run along it, hold a ledge to
// pull up).
//
// The controls are the core's action table (@trizendigital/parkour/data/actions.js) rebound here, before any
// simulation reads it: this module must be imported before the core's Input is first used. The assist works through
// the raw input alone: each frame, before the input is sampled, it holds virtual keys that the rebound actions listen
// to. The runner itself is never touched, so everything it does is still one of its own moves.

import { ACTIONS } from '@trizendigital/parkour/data/actions.js';
import { Landings } from '@trizendigital/parkour/runner/Landings.js';
import { Runner } from '@trizendigital/parkour/runner/Runner.js';
import { BLENDS } from '@trizendigital/parkour/motion/graph/blends.js';
import { DirectionalBlend } from '@trizendigital/parkour/motion/graph/DirectionalBlend.js';

// The virtual keys the assist holds.
const VIRTUAL = { look: 'ArcadeLook', grab: 'ArcadeGrab', jump: 'ArcadeJump' };

const MOVE = [ 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight' ];
const FORWARD = [ 'KeyW', 'ArrowUp' ];

/** Every binding the arcade controls change, keyboard and mouse. The pad keeps the core's. */
const KEYS = {
	// Always running: any movement key sprints.
	sprint: MOVE,
	// Space jumps as it goes down (the assist turns its press into a one-frame tap: the runner jumps as Jump is let go).
	jump: [ VIRTUAL.jump ],
	// In the air, Space or Shift held arms the landing roll.
	tuck: [ 'Space', 'ShiftLeft', 'ShiftRight', 'KeyC' ],
	// Held by the assist in the air and on things; the left mouse button holds it anywhere (hops, strides).
	grab: [ 'Mouse0', VIRTUAL.grab ],
	slide: [ 'ShiftLeft', 'ShiftRight', 'KeyC' ],
	dive: [ 'KeyT' ],
	// Front flips (E + W), dive flips and spins; side flips and spins on F; back flips on G.
	wheel: [ 'KeyE' ],
	flip: [ 'KeyF' ],
	backflip: [ 'KeyG' ],
	precision: [ 'KeyX' ],
	interact: [ 'KeyX' ],
	toggleView: [ 'KeyV' ],
	// Free look always: the mouse turns the view in the air too (RUNOFF never took it away).
	freeLook: [ 'Mouse1', VIRTUAL.look ],
	// The game's own: R restarts the course, Q goes back to the last checkpoint (the runner's mark).
	restart: [ 'KeyR', 'Backspace' ],
	backToMark: [ 'KeyQ' ],
	setMark: [],
	easyMode: [],
	captureReplay: [],
	replayLibrary: [],
	benchmark: [],
	toggleUi: [ 'KeyH' ],
};

for ( const [ name, keys ] of Object.entries( KEYS ) ) ACTIONS[ name ].keys = keys;

// The keyboard draws trick directions too (the core reads them from the pad's left stick or a mouse flick): E with W
// held is a front flip, with S a dive flip. The mouse only looks.
ACTIONS.stick.keys = { forward: 'KeyW', back: 'KeyS', left: 'KeyA', right: 'KeyD' };
delete ACTIONS.mouseFlick.mouse;

// The core judges a landing by its speed: a hard landing past 8.5 m/s, a bail past 12.5 unless rolled, past 18.5
// even rolled. RUNOFF judged by its own: clean under 17 m/s (a 5 m drop), a roll wanted from 17 (else a stumble),
// a crash only past 34 (a 20 m drop). A landing's speed is mapped from RUNOFF's bands onto the core's, so the core
// lands, stumbles (its hard landing), rolls and bails where RUNOFF would have.
const RUNOFF_ROLL = 17, RUNOFF_CRASH = 34;
const CORE_HARD = 8.5, CORE_HARD_TOP = 12.4, CORE_ROLL_LIMIT = 18.5;

function coreLandingSpeed( speed ) {

	if ( speed < RUNOFF_ROLL ) return speed * CORE_HARD / RUNOFF_ROLL;
	if ( speed < RUNOFF_CRASH ) return CORE_HARD + ( speed - RUNOFF_ROLL ) * ( CORE_HARD_TOP - CORE_HARD ) / ( RUNOFF_CRASH - RUNOFF_ROLL );
	return CORE_ROLL_LIMIT + ( speed - RUNOFF_CRASH );

}

const land = Landings.prototype.land;
Landings.prototype.land = function ( fallSpeed, input ) {

	return land.call( this, - coreLandingSpeed( Math.max( 0, - fallSpeed ) ), input );

};

// The core bails in the air past 25.5 m/s of fall (19 m under its gravity, 11.6 m under RUNOFF's): judged on the
// speed scaled to RUNOFF's crash instead (a 23 m fall).
const AIR_BAIL_SCALE = 36 / 25.5;
const checkFall = Runner.prototype.checkFall;
Runner.prototype.checkFall = function () {

	const vertical = this.velocity.y;
	this.velocity.y = vertical / AIR_BAIL_SCALE;
	checkFall.call( this );
	this.velocity.y = vertical;

};

// The run's blend places its sprint takes at 5.85 m/s, the core's sprint: run faster and the take played at that
// pace leaves the feet sliding over the ground. The same takes placed at 15 m/s too keep the stride in step with any
// speed up to it: the legs turn over faster as the runner does (a take with a stride plays at the rate its speed
// calls for). The core's blend table is frozen, so the run's blend takes this one in its place as it first updates.
const RUN = BLENDS.runTurn, LEAN = RUN.samples[ 1 ].at[ 0 ], TOP_SPEED = 15;
const FAST_RUN = {
	...RUN,
	axes: [ RUN.axes[ 0 ], { ...RUN.axes[ 1 ], max: TOP_SPEED } ],
	samples: [ ...RUN.samples, { take: 'ground_run_lean_left', at: [ - LEAN, TOP_SPEED ] }, { take: 'ground_run_lean_right', at: [ LEAN, TOP_SPEED ] } ],
	triangles: [ ...RUN.triangles, [ 0, 1, 4 ], [ 1, 5, 4 ] ],
};
const blendUpdate = DirectionalBlend.prototype.update;
DirectionalBlend.prototype.update = function ( graph ) {

	if ( this.blend === RUN ) {

		const takes = graph.library.takes;
		this.blend = FAST_RUN;
		this.rates = FAST_RUN.samples.map( ( sample ) => {

			const take = takes.get( sample.take );
			return take.stride ? sample.at[ 1 ] * take.length / take.stride : 1;

		} );
		this.players = FAST_RUN.samples.map( () => ( { owner: this } ) );

	}

	return blendUpdate.call( this, graph );

};

/**
 * The arcade tuning: RUNOFF's run pace (8.5 m/s), gravity (28 m/s², 2.86 × 9.8) and jump (10 m/s up, a 1.8 m apex
 * and 6 m across the level at a run), a full jump on any tap, a longer wall run, quicker turns and more air control.
 */
export const ARCADE_TUNING = {
	walkSpeed: 3.2,
	sprintSpeed: 8.5,
	acceleration: 30,
	groundFriction: 12,
	braking: 26,
	groundTurnRate: 10,
	airTurnRate: 2.4,
	gravityScale: 2.86,
	runningJumpSpeed: 10,
	standingJumpSpeed: 8.5,
	jumpChargeStart: 1,
	jumpChargeRate: 0,
	airControl: 0.55,
	airFriction: 0.25,
	wallRunTime: 0.85,
	wallRunReach: 0.8,
	wallJumpSideSpeed: 5,
	wallJumpUpSpeed: 9.5,
	wallKickSpeed: 7,
	wallKickUpSpeed: 9.5,
	slideBraking: 3.2,
	ziplineSpeed: 12,
	fov: 110 * Math.PI / 180,
};

/** Puts the arcade tuning on a simulation (after it is made, before or after it loads). */
export function applyArcade( sim, overrides = {} ) {

	sim.tuning.values = { ...sim.tuning.values, ...ARCADE_TUNING, ...overrides };

}

// States in which the runner holds on to something: the assist keeps Grab held there, or it would let go.
const HOLDING = new Set( [ 'hanging', 'catchingLedge', 'leapingToLedge', 'wallRunning', 'wallPlanted', 'onBar', 'onRope', 'onPipe', 'onLadder', 'toppingOut', 'onPole', 'onZipline' ] );

// A hang climbs up once it has settled this long (s) with forward held.
const CLIMB_AFTER = 0.08;

// The assist vaults a low obstacle ahead when running at least this fast (m/s).
const VAULT_SPEED = 4;

const DROP = [ 'ShiftLeft', 'ShiftRight', 'KeyC' ];

/**
 * The assist: each frame, before the input is sampled, it holds the virtual keys.
 *
 * - Jump: Space going down is a one-frame tap of Jump, so the runner jumps a frame after the press, not when the key
 *   comes up (RUNOFF jumped on the press).
 * - Grab: held in the air and while holding on, so the runner catches ledges, runs along walls and takes poles,
 *   bars and ziplines it meets, as RUNOFF did on its own; Shift or C held lets go.
 * - Climb: a hang with forward held taps Jump, which pulls up.
 * - Vault: running forward at a low obstacle the runner can vault, it holds Grab and taps Jump, which vaults it.
 * - Pipes, ladders, ziplines: Grab is held walking into a pipe or a ladder, and pressed afresh at a zipline.
 */
export class Assist {

	constructor() {

		this.space = false;
		this.tap = 0;
		this.zipline = 0;

	}

	/** @param {object} input the simulation's Input, before it samples @param {object} runner */
	apply( input, runner ) {

		const keys = input.keys;
		keys.add( VIRTUAL.look );

		const forward = FORWARD.some( ( code ) => keys.has( code ) );
		const dropping = DROP.some( ( code ) => keys.has( code ) );
		const space = keys.has( 'Space' );
		const spacePressed = space && ! this.space;
		this.space = space;

		const airborne = ! runner.grounded && runner.state !== 'sliding';
		let grab = ( airborne || HOLDING.has( runner.state ) ) && ! dropping;
		let tap = spacePressed;

		if ( runner.state === 'hanging' && forward && runner.stateTime > CLIMB_AFTER ) tap = true;

		// A drainpipe or a ladder walked into: Grab takes hold (the core catches them with Grab held, on the ground too).
		const at = runner.pipesAndZiplines?.volumes.current;
		if ( forward && runner.grounded && ( at?.pipe || at?.ladder ) ) grab = true;

		// A zipline is caught by Grab going down at it in the air: the held Grab is let go for a frame, then pressed.
		if ( airborne && at?.zipline && runner.state !== 'onZipline' && ! dropping ) {

			if ( this.zipline === 0 ) grab = false;
			this.zipline = Math.min( 2, this.zipline + 1 );

		} else this.zipline = 0;

		if ( forward && runner.grounded && runner.speed > VAULT_SPEED && runner.state !== 'sliding' && this.lowObstacleAhead( runner ) ) {

			grab = true;
			tap = true;

		}

		if ( grab ) keys.add( VIRTUAL.grab );
		else keys.delete( VIRTUAL.grab );

		// A tap holds Jump for one sample and lets go on the next; a tap asked for while one is held waits for it.
		if ( this.tap === 1 ) {

			keys.delete( VIRTUAL.jump );
			this.tap = 0;

		} else if ( tap ) {

			keys.add( VIRTUAL.jump );
			this.tap = 1;

		} else keys.delete( VIRTUAL.jump );

	}

	// A low obstacle the runner can vault, right ahead (the runner's own probes, as Grab with Jump would find it).
	lowObstacleAhead( runner ) {

		const ledges = runner.ledges;
		if ( ! ledges.canVault() ) return false;
		const low = ledges.probes.scan( 'lowObstacle' );
		return Boolean( low ) && ! ledges.probes.vaultBlocked( low );

	}

}
