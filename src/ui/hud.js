// The HUD over a run: the clock and the split at each gate, checkpoints and the next medal, speed, the course's hints
// and the start prompt. Plain DOM in #ui (src/ui/theme.css styles it); the results are ui.js's.

import { fmtDiff, fmtTime } from '../util.js';
import { MEDALS } from '../game/trial.js';

const html = ( text ) => {

	const template = document.createElement( 'template' );
	template.innerHTML = text.trim();
	return template.content.firstElementChild;

};

// A split stays up this long (s).
const SPLIT_TIME = 2.2;

export class Hud {

	constructor( root ) {

		this.root = html( `
			<div class="hud hidden">
				<div class="hud-time"><div class="clock">0.000</div><div class="split"></div></div>
				<div class="hud-right"><div class="cps">0<small>/0</small></div><div class="target"></div></div>
				<div class="hud-speed"><div class="value">0.0<small>M/S</small></div><div class="bar"><i></i></div></div>
				<div class="hud-hint"></div>
				<div class="hud-prompt"></div>
				<div class="hud-fps"></div>
			</div>` );
		root.appendChild( this.root );
		const $ = ( selector ) => this.root.querySelector( selector );
		this.el = {
			clock: $( '.clock' ), split: $( '.split' ), cps: $( '.cps' ), target: $( '.target' ), speed: $( '.hud-speed .value' ),
			bar: $( '.hud-speed .bar i' ), hint: $( '.hud-hint' ), prompt: $( '.hud-prompt' ), fps: $( '.hud-fps' ),
		};
		this.splitLeft = 0;
		this.lastHint = null;

	}

	/** Ready for a run on a course. */
	reset( map ) {

		this.splitLeft = 0;
		this.el.split.classList.remove( 'show' );
		this.el.cps.innerHTML = `0<small>/${map.checkpoints.length}</small>`;
		this.lastHint = undefined;

	}

	prompt( title, small = '' ) {

		this.el.prompt.innerHTML = title ? `${title}${small ? `<small>${small}</small>` : ''}` : '';

	}

	split( { index, time, diff, count } ) {

		const el = this.el.split;
		el.textContent = diff == null ? fmtTime( time ) : `${fmtTime( time )}  ${fmtDiff( diff )}`;
		el.className = `split show ${diff == null ? '' : diff <= 0 ? 'ahead' : 'behind'}`;
		this.splitLeft = SPLIT_TIME;
		this.el.cps.innerHTML = `${index + 1}<small>/${count}</small>`;

	}

	fps( text ) {

		this.el.fps.textContent = text;

	}

	frame( { trial, session, dt, hints = true } ) {

		const el = this.el;
		el.clock.textContent = fmtTime( trial.t );
		if ( trial.started && el.prompt.innerHTML ) this.prompt( '' );

		this.splitLeft -= dt;
		if ( this.splitLeft <= 0 ) el.split.classList.remove( 'show' );

		// The best medal still in reach.
		const medals = trial.map.medals;
		let next = - 1;
		for ( let i = medals.length - 1; i >= 0; i -- ) if ( trial.t <= medals[ i ] ) {

			next = i;
			break;

		}

		el.target.innerHTML = next >= 0 ? `<span style="color:${MEDALS[ next ].color}">${MEDALS[ next ].name}</span> <b>${fmtTime( medals[ next ] )}</b>` : 'no medal';

		const speed = session.runner.speed, pace = session.sim.tuning.values.sprintSpeed;
		el.speed.innerHTML = `${speed.toFixed( 1 )}<small>M/S</small>`;
		el.bar.style.width = `${Math.min( 100, speed / ( pace * 1.6 ) * 100 )}%`;
		el.bar.classList.toggle( 'over', speed > pace + 0.2 );

		const hint = hints ? trial.hintAt( session.feet ) : null;
		if ( hint !== this.lastHint ) {

			this.lastHint = hint;
			if ( hint ) el.hint.innerHTML = hint;
			el.hint.classList.toggle( 'show', Boolean( hint ) );

		}

	}

}
