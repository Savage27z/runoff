// The game's sound, on Web Audio. The runner's body: footsteps and rungs fired by the mocap takes themselves (the
// run's sound cues), and jumps, landings, rolls, slides, catches and bails from what the runner does; the wind,
// rising with speed; and the game's own synthesised cues (menu ticks, checkpoints, the finish). The body sounds are
// the recordings @trizendigital/parkour-demo ships (public/sounds/). A page stays silent until the player first
// clicks or presses a key in it (the browser's rule).

const BASE = import.meta.env.BASE_URL;

const files = ( name, count ) => Array.from( { length: count }, ( _, i ) => `${name}_${i + 1}` );

// Each sound: its files (one picked at random), its level, how many may play at once, and the least time between two
// plays of it (s), so a cue fired twice in one frame plays once.
const SOUNDS = {
	step: { files: files( 'step', 4 ), level: 0.32, voices: 3, gap: 0.06 },
	rung: { files: files( 'rung', 5 ), level: 0.6, voices: 2, gap: 0.06 },
	jump: { files: [ 'jump' ], level: 0.75, voices: 1, gap: 0.1 },
	land: { files: [ 'land' ], level: 0.65, voices: 2, gap: 0.1 },
	roll: { files: [ 'roll' ], level: 0.55, voices: 1, gap: 0.15 },
	slide: { files: [ 'slide' ], level: 0.75, voices: 1, gap: 0.2 },
	catch: { files: [ 'catch' ], level: 0.8, voices: 2, gap: 0.12 },
	bail: { files: [ 'bail' ], level: 1, voices: 1, gap: 0.5 },
};

// What the runner's state changes sound like: the state it goes into, the sound, and its level.
const ON_STATE = {
	rising: [ 'jump', 1 ],
	rolling: [ 'roll', 1 ],
	sliding: [ 'slide', 1 ],
	vaulting: [ 'roll', 0.6 ],
	catchingLedge: [ 'catch', 1 ],
	hanging: [ 'catch', 0.5 ],
	wallRunning: [ 'catch', 0.6 ],
	wallPlanted: [ 'catch', 0.8 ],
	onBar: [ 'catch', 1 ],
	onPole: [ 'catch', 1 ],
	onPipe: [ 'catch', 0.8 ],
	onLadder: [ 'catch', 0.8 ],
	onZipline: [ 'catch', 1 ],
	bailing: [ 'bail', 1 ],
};

const AIR = new Set( [ 'rising', 'falling', 'airStunt' ] );

// The wind: silent below this speed (m/s), full at the top one.
const WIND = { from: 6, full: 16, level: 0.5 };

export class Sound {

	constructor() {

		this.ctx = null;
		this.buffers = new Map();
		this.playing = new Map();
		this.last = new Map();
		this.volume = 0.8;
		this.loading = null;

	}

	/** Starts the audio on the first gesture (the browser's rule), and loads the recordings. */
	unlock() {

		if ( this.ctx ) {

			if ( this.ctx.state === 'suspended' ) this.ctx.resume();
			return;

		}

		const ctx = this.ctx = new AudioContext();
		this.master = ctx.createGain();
		this.master.gain.value = this.volume;
		this.master.connect( ctx.destination );
		this.windGain = ctx.createGain();
		this.windGain.gain.value = 0;
		this.windGain.connect( this.master );
		this.loading = this.load();

	}

	async load() {

		const names = new Set( [ ...Object.values( SOUNDS ).flatMap( ( s ) => s.files ), 'wind' ] );
		await Promise.all( [ ...names ].map( async ( name ) => {

			try {

				const data = await ( await fetch( `${BASE}sounds/${name}.opus` ) ).arrayBuffer();
				this.buffers.set( name, await this.ctx.decodeAudioData( data ) );

			} catch {

				// A sound that fails to load stays silent.

			}

		} ) );
		const wind = this.buffers.get( 'wind' );
		if ( wind ) {

			const source = this.ctx.createBufferSource();
			source.buffer = wind;
			source.loop = true;
			source.connect( this.windGain );
			source.start();

		}

	}

	setVolume( volume ) {

		this.volume = volume;
		if ( this.master ) this.master.gain.setTargetAtTime( volume, this.ctx.currentTime, 0.05 );

	}

	/** Plays a recorded sound by name, at a level. */
	play( name, level = 1 ) {

		const sound = SOUNDS[ name ], ctx = this.ctx;
		if ( ! sound || ! ctx ) return;
		const now = ctx.currentTime;
		if ( now - ( this.last.get( name ) ?? - 1 ) < sound.gap ) return;
		const buffer = this.buffers.get( sound.files[ Math.floor( Math.random() * sound.files.length ) ] );
		if ( ! buffer ) return;
		this.last.set( name, now );

		const voices = this.playing.get( name ) ?? [];
		if ( voices.length >= sound.voices ) voices.shift().stop();
		const source = ctx.createBufferSource(), gain = ctx.createGain();
		source.buffer = buffer;
		source.playbackRate.value = 0.94 + Math.random() * 0.12;
		gain.gain.value = sound.level * level;
		source.connect( gain ).connect( this.master );
		source.start();
		voices.push( source );
		this.playing.set( name, voices );
		source.onended = () => voices.splice( voices.indexOf( source ), 1 );

	}

	/** A run's frame: its mocap cues, its state changes, the wind by speed. */
	frame( session ) {

		if ( ! this.ctx ) return;
		const sim = session.sim, runner = sim.runner;
		for ( const cue of sim.frameSounds ) this.play( cue.name, cue.weight ?? 1 );
		for ( const event of sim.frameEvents ) {

			if ( ! event.to ) continue;
			const sound = ON_STATE[ event.to ];
			if ( sound && ! ( event.to === 'rising' && AIR.has( event.from ) ) ) this.play( ...sound );
			if ( AIR.has( event.from ) && ! AIR.has( event.to ) && runner.grounded ) this.play( 'land', 1 );

		}

		const speed = Math.hypot( runner.velocity.x, runner.velocity.y, runner.velocity.z );
		const wind = Math.min( 1, Math.max( 0, ( speed - WIND.from ) / ( WIND.full - WIND.from ) ) ) * WIND.level;
		this.windGain.gain.setTargetAtTime( sim.paused ? 0 : wind, this.ctx.currentTime, 0.15 );

	}

	/** Silences the wind (in menus). */
	hush() {

		if ( this.windGain ) this.windGain.gain.setTargetAtTime( 0, this.ctx.currentTime, 0.1 );

	}

	// ---- The game's own cues, synthesised.

	// A short tone: a frequency (Hz), a length (s), a level, a waveform, and a pitch it slides to.
	tone( freq, length, level = 0.2, type = 'triangle', to = freq, delay = 0 ) {

		const ctx = this.ctx;
		if ( ! ctx ) return;
		const t = ctx.currentTime + delay;
		const osc = ctx.createOscillator(), gain = ctx.createGain();
		osc.type = type;
		osc.frequency.setValueAtTime( freq, t );
		osc.frequency.exponentialRampToValueAtTime( to, t + length );
		gain.gain.setValueAtTime( 0.0001, t );
		gain.gain.exponentialRampToValueAtTime( level, t + 0.01 );
		gain.gain.exponentialRampToValueAtTime( 0.0001, t + length );
		osc.connect( gain ).connect( this.master );
		osc.start( t );
		osc.stop( t + length + 0.02 );

	}

	hover() {

		this.tone( 1400, 0.04, 0.05, 'sine' );

	}

	click() {

		this.tone( 520, 0.07, 0.12, 'square', 760 );

	}

	back() {

		this.tone( 600, 0.08, 0.1, 'square', 380 );

	}

	/** A gate passed: brighter when ahead of the best split. */
	checkpoint( ahead ) {

		const base = ahead ? 880 : 660;
		this.tone( base, 0.12, 0.16 );
		this.tone( base * 1.5, 0.18, 0.14, 'triangle', base * 1.5, 0.08 );

	}

	finish( medal ) {

		[ 523, 659, 784, 1047 ].slice( 0, 2 + Math.max( 0, medal ) ).forEach( ( f, i ) => this.tone( f, 0.35, 0.16, 'triangle', f, i * 0.09 ) );

	}

	bounce() {

		this.tone( 180, 0.3, 0.25, 'sine', 720 );

	}

}
