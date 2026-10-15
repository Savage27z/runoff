// The screens over the game: home, the courses, the Locker, the settings, help, the pause menu and the results, plus
// the HUD while running (hud.js). Plain DOM in #ui, styled by theme.css. Every screen can be driven from the keyboard:
// the arrow keys move between its buttons, Enter presses one, Esc goes back.

import { THEMES } from '../world/world.js';
import { MEDALS } from '../game/trial.js';
import { TINTS, courseOpen } from '../game/game.js';
import { GEAR } from '../figure/gear.js';
import { DEFAULT_SETTINGS } from '../game/save.js';
import { fmtTime } from '../util.js';
import { Hud } from './hud.js';

const html = ( text ) => {

	const template = document.createElement( 'template' );
	template.innerHTML = text.trim();
	return template.content.firstElementChild;

};

const MOODS = { dusk: 'Dusk', night: 'Night', day: 'Day', haze: 'Haze', hall: 'Indoor' };

// A course card's art: its sky's gradient and a skyline cut against it, seeded by the course.
function courseArt( map, index ) {

	const T = THEMES[ map.theme ] ?? THEMES.dusk;
	let seed = 11 + index * 97, x = - 4, parts = '';
	const rand = () => ( seed = ( seed * 16807 ) % 2147483647 ) / 2147483647;
	while ( x < 300 ) {

		const w = 14 + rand() * 30, h = 30 + rand() * 60;
		parts += `<rect x="${x.toFixed( 1 )}" y="${( 100 - h ).toFixed( 1 )}" width="${w.toFixed( 1 )}" height="${h.toFixed( 1 )}" fill="#0d0b16" opacity="0.88"/>`;
		for ( let wx = x + 3; wx < x + w - 3; wx += 5 ) for ( let wy = 104 - h; wy < 98; wy += 6 ) {

			if ( rand() < 0.18 ) parts += `<rect x="${wx.toFixed( 1 )}" y="${wy.toFixed( 1 )}" width="1.6" height="2.4" fill="${T.windows > 0 ? '#ffb26b' : '#e8eef4'}" opacity="${T.windows > 0 ? 0.8 : 0.25}"/>`;

		}

		x += w + 2 + rand() * 6;

	}

	return `<div class="art" style="background: linear-gradient(180deg, ${T.skyTop}, ${T.skyMid} 55%, ${T.skyHorizon})">
		<span class="mood">${MOODS[ map.theme ] ?? map.theme}</span>
		<svg viewBox="0 0 300 100" preserveAspectRatio="none">${parts}</svg>
		<span class="num">${String( index + 1 ).padStart( 2, '0' )}</span>
	</div>`;

}

const pips = ( medal ) => MEDALS.map( ( m, i ) => `<i class="pip ${i <= medal ? 'on' : ''}" style="${i <= medal ? `background:${m.color}` : ''}" title="${m.name}"></i>` ).join( '' );

const CONTROLS = [
	[ 'Run', 'W A S D', 'L stick' ],
	[ 'Look', 'Mouse', 'R stick' ],
	[ 'Jump · kick off a wall', 'Space', 'A' ],
	[ 'Slide (hold) · roll a landing', 'Shift / C', 'B' ],
	[ 'Front flip (in the air, with W)', 'E', 'Y' ],
	[ 'Side flip · spin', 'F', 'X' ],
	[ 'Backflip', 'G', '—' ],
	[ 'Grab (hop up, stride)', 'L mouse', 'LT' ],
	[ 'Back to last checkpoint', 'Q', 'D-pad ↑' ],
	[ 'Restart', 'R', 'Select' ],
	[ 'First person', 'V', 'D-pad →' ],
	[ 'Runner Vision', 'B', '—' ],
	[ 'Slow motion', 'R mouse', 'RB' ],
	[ 'Pause', 'Esc', 'Start' ],
];

const MOVES = [
	[ 'Vault', 'Run straight into a waist-high wall: you go over it without slowing.' ],
	[ 'Climb', 'Jump into a ledge and keep holding W to pull up.' ],
	[ 'Wall-climb', 'Jump into a tall wall (up to about 3.8 m) to run up it to the edge.' ],
	[ 'Wall-run', 'Jump at a wall at a shallow angle, then Space to kick off it across the gap.' ],
	[ 'Slide', 'Hold Shift at a run to slide under things; let go to stand. Jump out of it to keep the boost.' ],
	[ 'Roll', 'Hold Space (or Shift) as you land a big drop to roll out of it at speed.' ],
	[ 'Zipline', 'Jump up at the cable to grab it; it lets you go at the low end.' ],
	[ 'Pole', 'Jump at a pole to grab it and slide down: the fast way down a storey or two.' ],
	[ 'Swing bar', 'Jump at the bar: you swing and it throws you forward across the gap.' ],
	[ 'Pipes & ladders', 'Run into a drainpipe or a ladder to climb it and over the top.' ],
	[ 'Bounce', 'Striped awnings throw you high: land on one to reach a roof above.' ],
	[ 'Flips', 'In the air: E with W for a front flip, F for a side flip, G for a backflip.' ],
];

export class UI {

	constructor( game, root ) {

		this.game = game;
		this.root = root;
		this.screens = {};
		this.current = null;
		this.settingsTab = 'controls';
		this.hud = new Hud( root );
		this.build();
		this.listen();

	}

	build() {

		const add = ( name, element ) => {

			element.classList.add( 'hidden' );
			this.root.appendChild( element );
			this.screens[ name ] = element;
			return element;

		};

		add( 'home', html( `
			<section class="screen home">
				<div class="brand"><div class="logo">RUN<b>OFF</b></div><div class="tagline">rooftop parkour · time trials</div></div>
				<nav class="menu">
					<button class="menu-item main" data-nav data-go="courses"><small>01</small><span>PLAY</span></button>
					<button class="menu-item" data-nav data-go="locker"><small>02</small>LOCKER</button>
					<button class="menu-item" data-nav data-go="settings"><small>03</small>SETTINGS</button>
					<button class="menu-item" data-nav data-go="help"><small>04</small>HOW TO PLAY</button>
				</nav>
				<div class="profile">
					<span class="label">Runner</span>
					<span class="who"></span>
					<div class="row"><span>Stars</span><span class="stars"></span></div>
					<div class="row"><span>Courses cleared</span><span class="mono cleared"></span></div>
				</div>
				<div class="keys-hint"><span><k>↑</k><k>↓</k> choose</span><span><k>Enter</k> go</span></div>
			</section>` ) );

		add( 'courses', html( `
			<section class="screen page">
				<div class="topbar"><button class="btn small" data-nav data-back><span>← Back</span></button><h2>Choose a <span>course</span></h2><span class="stars"></span></div>
				<div class="body"><div class="course-grid"></div></div>
			</section>` ) );

		add( 'locker', html( `
			<section class="screen page see-through">
				<div class="topbar"><button class="btn small" data-nav data-back><span>← Back</span></button><h2><span>Locker</span></h2><span class="stars"></span></div>
				<div class="locker-panel">
					<span class="section-label">Runner</span>
					<div class="runner-list"></div>
					<span class="section-label">Colour</span>
					<div class="swatches"></div>
					<div class="gear"></div>
				</div>
				<div class="drag-hint">drag to turn</div>
			</section>` ) );

		add( 'settings', html( `
			<section class="screen page">
				<div class="topbar"><button class="btn small" data-nav data-back><span>← Back</span></button><h2><span>Settings</span></h2></div>
				<div class="body"><div class="settings">
					<div class="tabs"></div>
					<div class="rows"></div>
				</div></div>
			</section>` ) );

		add( 'help', html( `
			<section class="screen page">
				<div class="topbar"><button class="btn small" data-nav data-back><span>← Back</span></button><h2>How to <span>play</span></h2></div>
				<div class="body"><div class="help">
					<div><h3>Controls</h3><div class="keys-table">${CONTROLS.map( ( [ what, key, pad ] ) => `<div><span>${what}</span><k>${key}</k><span class="pad">${pad}</span></div>` ).join( '' )}</div></div>
					<div><h3>Moves</h3><div class="moves">${MOVES.map( ( [ name, how ] ) => `<div class="move"><b>${name}</b><p>${how}</p></div>` ).join( '' )}</div></div>
				</div></div>
			</section>` ) );

		add( 'pause', html( `
			<section class="screen overlay">
				<div class="card">
					<h2>Paused</h2>
					<div class="actions">
						<button class="btn primary" data-nav data-act="resume"><span>Resume</span></button>
						<button class="btn" data-nav data-act="restart"><span>Restart <k>R</k></span></button>
						<button class="btn" data-nav data-act="settings"><span>Settings</span></button>
						<button class="btn" data-nav data-act="quit"><span>Quit to menu</span></button>
					</div>
				</div>
			</section>` ) );

		add( 'results', html( `<section class="screen overlay results"><div class="card"></div></section>` ) );

	}

	listen() {

		const game = this.game;

		this.root.addEventListener( 'click', ( event ) => {

			const target = event.target.closest( 'button' );
			if ( ! target || target.disabled ) return;
			if ( target.dataset.back !== undefined ) return this.back();
			game.sound.click();
			if ( target.dataset.go ) this.go( target.dataset.go );
			const act = target.dataset.act;
			if ( act === 'resume' ) game.resume();
			if ( act === 'restart' ) game.start();
			if ( act === 'settings' ) {

				this.returnTo = 'pause';
				this.show( 'settings' );

			}

			if ( act === 'quit' ) game.toMenu( 'home' );
			if ( act === 'retry' ) game.start();
			if ( act === 'next' ) game.play( target.dataset.course );
			if ( act === 'menu' ) game.toMenu( 'courses' );

		} );

		this.root.addEventListener( 'pointerover', ( event ) => {

			const target = event.target.closest( 'button' );
			if ( target && target !== this.hovered ) game.sound.hover();
			this.hovered = target;

		} );

		addEventListener( 'keydown', ( event ) => {

			const screen = this.screens[ this.current ];
			if ( ! screen || this.current === 'hud' ) return;
			if ( event.code === 'Escape' ) {

				event.preventDefault();
				if ( this.current === 'pause' ) return game.resume();
				return this.back();

			}

			if ( this.current === 'results' && event.code === 'KeyR' ) return game.start();
			const moves = { ArrowDown: 1, ArrowRight: 1, ArrowUp: - 1, ArrowLeft: - 1 };
			if ( moves[ event.code ] ) {

				event.preventDefault();
				const items = [ ...screen.querySelectorAll( '[data-nav]' ) ].filter( ( el ) => ! el.disabled && el.offsetParent );
				const at = items.indexOf( document.activeElement );
				const next = items[ ( at + moves[ event.code ] + items.length ) % items.length ];
				next?.focus();
				game.sound.hover();

			}

		} );

		// Turning the runner in the Locker: drag across the screen.
		let drag = null;
		addEventListener( 'pointerdown', ( event ) => {

			if ( this.current === 'locker' && ! event.target.closest( '.locker-panel, .topbar' ) ) drag = event.clientX;

		} );
		addEventListener( 'pointermove', ( event ) => {

			if ( drag === null ) return;
			game.orbit.angle -= ( event.clientX - drag ) * 0.01;
			drag = event.clientX;

		} );
		addEventListener( 'pointerup', () => drag = null );

		// Clicking the game while running takes the mouse again (after it was let go of).
		game.stage.renderer.domElement.addEventListener( 'click', () => {

			if ( game.mode === 'play' && ! game.session?.sim.input.enabled ) game.session.sim.input.capture();

		} );

	}

	/** Goes to a screen from the menus. */
	go( name ) {

		if ( name === 'courses' || name === 'locker' || name === 'settings' || name === 'help' || name === 'home' ) {

			this.returnTo = this.current === 'pause' ? 'pause' : 'home';
			this.game.toMenu( name );

		}

	}

	back() {

		this.game.sound.back();
		if ( this.returnTo === 'pause' && this.current === 'settings' ) {

			this.returnTo = null;
			return this.show( 'pause' );

		}

		if ( this.current !== 'home' ) this.game.toMenu( 'home' );

	}

	/** Shows a screen (and nothing else), filled in afresh. */
	show( name ) {

		this.current = name;
		for ( const [ key, element ] of Object.entries( this.screens ) ) element.classList.toggle( 'hidden', key !== name );
		this.hud.root.classList.toggle( 'hidden', name !== 'hud' );
		const fill = { home: () => this.fillHome(), courses: () => this.fillCourses(), locker: () => this.fillLocker(), settings: () => this.fillSettings() }[ name ];
		fill?.();
		requestAnimationFrame( () => this.screens[ name ]?.querySelector( '[data-nav]' )?.focus( { preventScroll: true } ) );

	}

	frame( dt ) {

		if ( this.current === 'hud' && this.game.trial ) this.hud.frame( { trial: this.game.trial, session: this.game.session, style: this.game.style, dt, hints: this.game.save.data.settings.hints } );

	}

	fps( text ) {

		this.hud.fps( this.game.save.data.settings.showFps ? text : '' );

	}

	// ---- Filling the screens

	starsEverywhere() {

		for ( const el of this.root.querySelectorAll( '.stars' ) ) el.textContent = this.game.stars;

	}

	fillHome() {

		const s = this.screens.home, game = this.game;
		s.querySelector( '.who' ).textContent = game.character.name;
		s.querySelector( '.cleared' ).textContent = `${game.maps.filter( ( m ) => game.save.course( m.id ).best != null ).length} / ${game.maps.filter( ( m ) => m.rebuilt ).length}`;
		this.starsEverywhere();

	}

	fillCourses() {

		const game = this.game, grid = this.screens.courses.querySelector( '.course-grid' );
		grid.innerHTML = game.maps.map( ( map, i ) => {

			const record = game.save.course( map.id ), open = courseOpen( map, game.stars );
			const lock = ! map.rebuilt ? '<div class="lock"><big>Under construction</big>being rebuilt for the new runner</div>'
				: ! open ? `<div class="lock"><big>★ ${map.unlock}</big>stars to unlock</div>` : '';
			return `<button class="course ${open ? '' : 'locked'}" data-nav data-course="${map.id}" ${open ? '' : 'disabled'}>
				${courseArt( map, i )}
				<div class="info">
					<h3>${map.name}</h3>
					<span class="line">${map.tagline}</span>
					<div class="stats">${pips( record.medal )}<span class="best">${record.best != null ? fmtTime( record.best ) : '--.---'}</span></div>
				</div>
				${lock}
			</button>`;

		} ).join( '' );
		for ( const card of grid.querySelectorAll( '.course:not(.locked)' ) ) card.addEventListener( 'click', () => game.play( card.dataset.course ) );
		this.starsEverywhere();

	}

	fillLocker() {

		const game = this.game, s = this.screens.locker;
		const list = s.querySelector( '.runner-list' );
		list.innerHTML = game.characters.map( ( c ) => `<button class="runner-card ${c.id === game.character.id ? 'on' : ''}" data-nav data-runner="${c.id}">
			<span class="badge">${c.name[ 0 ]}</span>
			<span><span class="name">${c.name}</span><br><span class="note">${c.fit ? 'Mixamo runner' : 'The test dummy'}</span></span>
			${c.id === game.character.id ? '<span class="check">Running</span>' : ''}
		</button>` ).join( '' );
		for ( const card of list.querySelectorAll( '[data-runner]' ) ) {

			card.addEventListener( 'click', async () => {

				await game.setCharacter( card.dataset.runner );
				this.fillLocker();

			} );

		}

		const swatches = s.querySelector( '.swatches' ), stars = game.stars, tint = game.save.data.tint;
		swatches.innerHTML = TINTS.map( ( t, i ) => {

			const locked = stars < t.stars;
			return `<button class="swatch ${t.id ? '' : 'none'} ${t.id === tint ? 'on' : ''} ${locked ? 'locked' : ''}" data-nav data-tint="${i}" data-stars="${t.stars}" title="${t.name}${locked ? ` · ★ ${t.stars}` : ''}" style="background:${t.id ?? 'transparent'}" ${locked ? 'disabled' : ''}></button>`;

		} ).join( '' );
		for ( const sw of swatches.querySelectorAll( '[data-tint]' ) ) {

			sw.addEventListener( 'click', () => {

				game.setTint( TINTS[ sw.dataset.tint ].id );
				this.fillLocker();

			} );

		}

		// The gear, slot by slot: what is worn lit, what needs more stars locked.
		const SLOTS = { head: 'Head', face: 'Face', back: 'Back', trail: 'Trail' };
		const worn = game.save.data.gear, box = s.querySelector( '.gear' );
		box.innerHTML = Object.entries( SLOTS ).map( ( [ slot, label ] ) => `<span class="section-label">${label}</span><div class="chips">${GEAR[ slot ].map( ( g ) => {

			const locked = stars < g.stars, on = ( worn[ slot ] ?? null ) === g.id;
			const dot = g.color ? `<i style="background:${g.color === 'rainbow' ? 'linear-gradient(90deg,#ff2e88,#ffd24a,#c6ff3d,#27e8ff,#9b6bff)' : g.color}"></i>` : '';
			return `<button class="chip ${on ? 'on' : ''} ${locked ? 'locked' : ''}" data-nav data-slot="${slot}" data-gear="${g.id ?? ''}" ${locked ? 'disabled' : ''}>${dot}${g.name}${locked ? ` <small>★ ${g.stars}</small>` : ''}</button>`;

		} ).join( '' )}</div>` ).join( '' );
		for ( const chip of box.querySelectorAll( '[data-slot]' ) ) {

			chip.addEventListener( 'click', () => {

				game.setGear( chip.dataset.slot, chip.dataset.gear || null );
				this.fillLocker();

			} );

		}

		this.starsEverywhere();

	}

	fillSettings() {

		const game = this.game, s = this.screens.settings, set = game.save.data.settings;
		const tabs = { controls: 'Controls', camera: 'Camera', video: 'Video', audio: 'Audio', game: 'Game' };
		s.querySelector( '.tabs' ).innerHTML = Object.entries( tabs ).map( ( [ id, name ] ) => `<button class="tab ${id === this.settingsTab ? 'on' : ''}" data-nav data-tab="${id}"><span>${name}</span></button>` ).join( '' );
		for ( const tab of s.querySelectorAll( '[data-tab]' ) ) {

			tab.addEventListener( 'click', () => {

				this.settingsTab = tab.dataset.tab;
				this.fillSettings();

			} );

		}

		const slider = ( key, label, help, min, max, step, show ) => `<div class="row-set"><span class="label">${label}<span class="help">${help}</span></span>
			<label class="slider"><input type="range" data-nav data-key="${key}" min="${min}" max="${max}" step="${step}" value="${set[ key ]}"><output>${show( set[ key ] )}</output></label></div>`;
		const toggle = ( key, label, help ) => `<div class="row-set"><span class="label">${label}<span class="help">${help}</span></span>
			<button class="toggle ${set[ key ] ? 'on' : ''}" data-nav data-toggle="${key}" aria-pressed="${set[ key ]}"></button></div>`;
		const segments = ( key, label, help, options ) => `<div class="row-set"><span class="label">${label}<span class="help">${help}</span></span>
			<div class="segments">${options.map( ( [ v, name ] ) => `<button class="${set[ key ] === v ? 'on' : ''}" data-nav data-seg="${key}" data-value="${v}">${name}</button>` ).join( '' )}</div></div>`;
		const shows = { sensitivity: ( v ) => `${Number( v ).toFixed( 2 )}×`, fov: ( v ) => `${v}°`, cameraDistance: ( v ) => `${Number( v ).toFixed( 1 )} m`, volume: ( v ) => `${Math.round( v * 100 )}%` };

		const rows = {
			controls: slider( 'sensitivity', 'Mouse sensitivity', 'How far the view turns for a move of the mouse.', 0.2, 3, 0.05, shows.sensitivity ) + toggle( 'invertY', 'Invert mouse Y', 'Push the mouse up to look down.' ),
			camera: slider( 'fov', 'Field of view', 'Wider shows more and feels faster.', 80, 130, 1, shows.fov ) + slider( 'cameraDistance', 'Camera distance', 'How far behind the runner the camera sits.', 2, 5, 0.1, shows.cameraDistance ),
			video: segments( 'quality', 'Graphics', 'Lower draws fewer pixels and drops the shadows: smoother on laptops.', [ [ 'high', 'High' ], [ 'medium', 'Medium' ], [ 'low', 'Low' ] ] ) + toggle( 'showFps', 'Show frame rate', 'The frames a second, in the corner while running.' ),
			audio: slider( 'volume', 'Volume', 'Footsteps, landings, the wind and the game\'s sounds.', 0, 1, 0.05, shows.volume ),
			game: toggle( 'hints', 'Course hints', 'The tips that show where each move is first needed.' ) +
				toggle( 'ghost', 'Ghost', 'Your best run on the course, running beside you.' ) +
				toggle( 'vision', 'Runner Vision', 'The world white and what you can use red, so the line reads at a glance. B in a run.' ) +
				`<div class="row-set"><span class="label">Reset progress<span class="help">Forget every best time, medal and star. Settings and your runner stay.</span></span><button class="btn danger small" data-nav data-reset><span>Reset</span></button></div>` +
				`<div class="row-set"><span class="label">Default settings<span class="help">Every setting back to how it started.</span></span><button class="btn small" data-nav data-defaults><span>Restore</span></button></div>`,
		};
		const box = s.querySelector( '.rows' );
		box.innerHTML = rows[ this.settingsTab ];

		for ( const input of box.querySelectorAll( 'input[data-key]' ) ) {

			input.addEventListener( 'input', () => {

				const key = input.dataset.key, value = Number( input.value );
				input.nextElementSibling.textContent = shows[ key ]( value );
				game.setSetting( key, value );

			} );

		}

		for ( const button of box.querySelectorAll( '[data-toggle]' ) ) {

			button.addEventListener( 'click', () => {

				game.setSetting( button.dataset.toggle, ! set[ button.dataset.toggle ] );
				this.fillSettings();

			} );

		}

		for ( const button of box.querySelectorAll( '[data-seg]' ) ) {

			button.addEventListener( 'click', () => {

				game.setSetting( button.dataset.seg, button.dataset.value );
				this.fillSettings();

			} );

		}

		box.querySelector( '[data-reset]' )?.addEventListener( 'click', ( event ) => {

			const button = event.currentTarget;
			if ( button.dataset.sure ) {

				game.save.reset();
				game.forgetGhosts();
				button.querySelector( 'span' ).textContent = 'Done';
				return;

			}

			button.dataset.sure = '1';
			button.querySelector( 'span' ).textContent = 'Sure? Press again';

		} );
		box.querySelector( '[data-defaults]' )?.addEventListener( 'click', () => {

			for ( const [ key, value ] of Object.entries( DEFAULT_SETTINGS ) ) game.save.data.settings[ key ] = value;
			game.save.persist();
			game.applySettings();
			this.fillSettings();

		} );

	}

	showResults( { map, result, pb, record, stars, opened } ) {

		const game = this.game, medal = MEDALS[ result.medal ];
		const next = game.nextCourse();
		const card = this.screens.results.querySelector( '.card' );
		card.innerHTML = `
			<div class="course-name">${map.name}</div>
			<div class="medal" style="color:${medal ? medal.color : 'var(--muted)'}">${medal ? medal.name : 'No medal'}</div>
			<div class="time">${fmtTime( result.time )}</div>
			<div class="sub ${pb ? 'pb' : ''}">${pb ? 'New personal best' : `Best ${fmtTime( record.best )}`}${result.respawns ? ` · ${result.respawns} respawn${result.respawns > 1 ? 's' : ''}` : ''}</div>
			${result.style ? `<div class="style-score"><span>Style</span><b>${result.style.total.toLocaleString()}</b><small>best combo ${result.style.bestCombo.toLocaleString()}${record.style > result.style.total ? ` · record ${record.style.toLocaleString()}` : result.style.total > 0 ? ' · record' : ''}</small></div>` : ''}
			<div class="ladder">${map.medals.map( ( t, i ) => `<b style="color:${MEDALS[ i ].color}">${MEDALS[ i ].name}</b>` ).join( '' )}${map.medals.map( ( t ) => `<span>${fmtTime( t )}</span>` ).join( '' )}</div>
			${stars.after > stars.before ? `<div class="unlock">★ +${stars.after - stars.before} · ${stars.after} stars${opened.length ? ` · ${opened.map( ( m ) => m.name ).join( ', ' )} unlocked` : ''}</div>` : ''}
			<div class="actions row">
				<button class="btn primary" data-nav data-act="retry"><span>Retry <k>R</k></span></button>
				${next ? `<button class="btn" data-nav data-act="next" data-course="${next.id}"><span>Next: ${next.name}</span></button>` : ''}
				<button class="btn" data-nav data-act="menu"><span>Courses</span></button>
			</div>`;
		this.show( 'results' );

	}

}
