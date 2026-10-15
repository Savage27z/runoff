// The route bot: drives the real runner (a Session: the Trizen simulation with the arcade controls and assist)
// through a course along a route's waypoints, pressing keys as a player would, and reports the checkpoint splits and
// the finish time, or where it got stuck. It proves a course can be finished with the arcade tuning, and times it.
// Headless: `node tools/routes.mjs [course]`; in the page's console: `await RUNOFF.test()`.
//
// Waypoint fields (RUNOFF's): x, z the target; r the radius that counts as there; jumpAt / slideAt / slideHeld (feet)
// what to press where; roll: hold Jump through a fast fall, the runner's landing roll; wallJump: jump off a wall run
// that has lasted this long (s).

import { ROUTES } from './routes.js';

// A jump is a press held this many frames, then let go (the runner jumps as Jump is let go).
const JUMP_FRAMES = 2;

/**
 * @param {Session} session a loaded session on the route's course
 * @param {object[]} waypoints
 * @param {object} [options] `seconds` to give up after, `dt` the frame time
 */
export function runRoute( session, waypoints, { seconds = 120, dt = 1 / 60 } = {} ) {

	const map = session.map, sim = session.sim;
	session.respawn( 0 );
	const log = [];
	let w = 0, cp = 0, finish = null, jumpFrames = 0, falls = 0;
	const keys = new Set();
	session.onEvent = ( event ) => {

		if ( event.type === 'fell' ) falls ++;
		if ( event.to && ( runRoute.verbose || [ 'wallRunning', 'vaulting', 'hanging', 'climbingUp', 'sliding', 'landingRoll', 'bailing', 'wallPlanted' ].includes( event.to ) ) ) {

			const f = session.feet;
			const r = session.runner;
			log.push( `    ${session.time.toFixed( 2 )} ${event.to} @ ${f.x.toFixed( 1 )},${f.y.toFixed( 1 )},${f.z.toFixed( 1 )} v=${r.speed.toFixed( 1 )} vy=${r.velocity.y.toFixed( 1 )}` );

		}

	};
	session.feed = pressKeys( keys );

	for ( let frame = 0; frame < seconds / dt; frame ++ ) {

		const p = session.feet, runner = session.runner;
		const W = waypoints[ Math.min( w, waypoints.length - 1 ) ];
		const dx = W.x - p.x, dz = W.z - p.z;
		if ( w < waypoints.length - 1 && Math.hypot( dx, dz ) < ( W.r || 1.0 ) ) w ++;

		// Steer by turning the view at the waypoint, forward held.
		sim.view.yaw = Math.atan2( dx, dz );
		keys.clear();
		keys.add( 'KeyW' );
		const onGround = runner.grounded || runner.state === 'sliding';
		if ( jumpFrames > 0 ) {

			keys.add( 'Space' );
			jumpFrames --;

		} else if ( W.jumpAt && onGround && W.jumpAt( p ) ) {

			jumpFrames = JUMP_FRAMES;
			keys.add( 'Space' );

		}

		if ( ( W.slideAt && runner.grounded && W.slideAt( p ) ) || ( W.slideHeld && W.slideHeld( p ) && runner.state === 'sliding' ) ) keys.add( 'ShiftLeft' );
		if ( W.roll && ! runner.grounded && runner.velocity.y < - 5 ) keys.add( 'Space' );
		// Jump off a wall run once it has carried a while: the kick off the wall.
		if ( W.wallJump && runner.state === 'wallRunning' && runner.stateTime > W.wallJump && jumpFrames === 0 ) {

			jumpFrames = JUMP_FRAMES;
			keys.add( 'Space' );

		}

		session.frame( dt );

		const c = map.checkpoints[ cp ], f = session.feet;
		if ( c && f.x + 0.3 > c.x0 && f.x - 0.3 < c.x1 && f.y + 1.8 > c.y0 && f.y < c.y1 && f.z + 0.3 > c.z0 && f.z - 0.3 < c.z1 ) {

			log.push( `  CP${cp + 1}  ${session.time.toFixed( 2 )}s` );
			if ( ++ cp === map.checkpoints.length ) {

				finish = session.time;
				break;

			}

		}

		if ( falls > 0 ) {

			log.push( `  FELL @ ${f.x.toFixed( 1 )},${f.y.toFixed( 1 )},${f.z.toFixed( 1 )} t=${session.time.toFixed( 2 )} (${runner.state}), waypoint ${w + 1}/${waypoints.length}` );
			break;

		}

	}

	if ( finish == null && falls === 0 ) {

		const f = session.feet;
		log.push( `  DID NOT FINISH — stuck @ ${f.x.toFixed( 1 )},${f.y.toFixed( 1 )},${f.z.toFixed( 1 )} (${session.runner.state}), waypoint ${w + 1}/${waypoints.length}` );

	}

	session.feed = null;
	return { finish, log, checkpoints: cp };

}

/**
 * A feed that holds exactly the keys in a set each frame: what it held before and no longer does is let go.
 * @param {Set<string>} keys
 */
export function pressKeys( keys ) {

	const held = new Set();
	return ( input ) => {

		for ( const code of held ) if ( ! keys.has( code ) ) input.keys.delete( code );
		held.clear();
		for ( const code of keys ) {

			input.keys.add( code );
			held.add( code );

		}

	};

}

export { ROUTES };
