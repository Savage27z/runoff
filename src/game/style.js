// The style score (RUNOFF's): every move feeds a combo. Keep moving to keep the chain alive (each move gives it
// COMBO_WINDOW more); vary the moves for a bigger multiplier (a repeat in one combo is worth half); a bail or a fall
// loses the combo. When the chain runs out it is banked: its points times its multiplier. On the Trizen runner the moves
// are the runner's states as it enters them, its tricks (the moves it plays), the bounce pads and the beams.

// A move: its name and points. The runner's states, as it enters them.
const STATES = {
	vaulting: { name: 'Vault', pts: 40 },
	wallRunning: { name: 'Wall Run', pts: 60 },
	sliding: { name: 'Slide', pts: 20 },
	rolling: { name: 'Roll', pts: 50 },
	catchingLedge: { name: 'Catch', pts: 30 },
	climbingUp: { name: 'Climb', pts: 15 },
	onBar: { name: 'Bar Swing', pts: 70 },
	onZipline: { name: 'Zipline', pts: 50 },
	onPole: { name: 'Pole Slide', pts: 40 },
	onPipe: { name: 'Pipe Climb', pts: 30 },
	onLadder: { name: 'Ladder', pts: 15 },
	onRope: { name: 'Rope', pts: 40 },
};

// The runner's tricks, by the move it plays (Trizen's names): flips are worth the most.
const TRICKS = {
	frontFlip: { name: 'Front Flip', pts: 100, flip: true },
	frontFlipRepeat: { name: 'Front Flip', pts: 100, flip: true },
	sideFlip: { name: 'Side Flip', pts: 120, flip: true },
	sideFlipRepeat: { name: 'Side Flip', pts: 120, flip: true },
	spinFrontFlip: { name: 'Spin Flip', pts: 160, flip: true },
	diveFrontFlip: { name: 'Dive Flip', pts: 140, flip: true },
	backflip: { name: 'Backflip', pts: 150, flip: true },
	runningBackflip: { name: 'Backflip', pts: 150, flip: true },
	standingBackflip: { name: 'Backflip', pts: 150, flip: true },
	heldBackflip: { name: 'Backflip', pts: 150, flip: true },
	layoutBackflip: { name: 'Layout', pts: 180, flip: true },
	backCork: { name: 'Back Cork', pts: 220, flip: true },
	vortex: { name: 'Vortex', pts: 200, flip: true },
	vortexRepeat: { name: 'Vortex', pts: 200, flip: true },
	cartwheel: { name: 'Cartwheel', pts: 60 },
	kongVault: { name: 'Kong', pts: 70 },
	kong: { name: 'Kong', pts: 70 },
	dive: { name: 'Dive', pts: 50 },
	spinDive: { name: 'Spin Dive', pts: 90 },
	diveRoll: { name: 'Dive Roll', pts: 50 },
	spinDiveRoll: { name: 'Dive Roll', pts: 50 },
};

const EXTRA = {
	bounce: { name: 'Bounce', pts: 40 },
	kick: { name: 'Wall Kick', pts: 80 },
	beam: { name: 'Beam', pts: 30 },
};

// A combo stays open this long after its last move (s).
export const COMBO_WINDOW = 2.2;
// A move shows in the feed this long (s), the feed this many at most.
const FEED_TIME = 2.4, FEED_LENGTH = 5;

export class Style {

	constructor() {

		/** Told of each move scored, each combo banked or lost. */
		this.onMove = () => {};
		this.onBank = () => {};
		this.reset();

	}

	reset() {

		this.total = 0;
		this.bestCombo = 0;
		this.combo = null;
		this.feed = [];
		this.lastTrick = null;
		this.onBeam = false;

	}

	/** The combo's multiplier: more for variety and for length (RUNOFF's), at most ×10. */
	get mult() {

		const c = this.combo;
		return c ? Math.min( 10, 1 + Math.floor( ( c.seen.size - 1 ) * 0.5 + ( c.moves - 1 ) * 0.25 ) ) : 1;

	}

	/** The combo's points so far, times its multiplier (0 when there is none). */
	get comboValue() {

		return this.combo ? this.combo.pts * this.mult : 0;

	}

	add( move ) {

		if ( ! move ) return null;
		const c = ( this.combo ??= { pts: 0, moves: 0, seen: new Set(), timer: COMBO_WINDOW } );
		const fresh = ! c.seen.has( move.name );
		const pts = fresh ? move.pts : Math.round( move.pts * 0.5 );
		c.seen.add( move.name );
		c.pts += pts;
		c.moves ++;
		c.timer = COMBO_WINDOW;
		const item = { name: move.name, pts, fresh, big: Boolean( move.flip ), t: 0 };
		this.feed.unshift( item );
		if ( this.feed.length > FEED_LENGTH ) this.feed.pop();
		this.onMove( item );
		return item;

	}

	/** A run event (the session's): a state the runner entered, a bounce, a fall. */
	event( event, runner ) {

		if ( event.type === 'bounce' ) this.add( EXTRA.bounce );
		if ( event.type === 'fell' || event.type === 'backToCheckpoint' ) this.lose();
		if ( ! event.to ) return;
		if ( event.to === 'bailing' ) return this.lose();
		// Out of a wall run upward (Jump off it): the kick.
		if ( event.from === 'wallRunning' && event.to === 'rising' && runner.velocity.y > 5 ) this.add( EXTRA.kick );
		this.add( STATES[ event.to ] );

	}

	/** Every frame of the run: the tricks the runner plays, the beams it walks, the combo running out. */
	update( dt, runner ) {

		const playing = runner.motion?.moves.playing()?.name ?? null;
		if ( playing !== this.lastTrick ) {

			this.lastTrick = playing;
			if ( TRICKS[ playing ] ) this.add( TRICKS[ playing ] );

		}

		const onBeam = Boolean( runner.grounded && runner.mover?.floor?.solid?.tags.includes( 'beam' ) );
		if ( onBeam && ! this.onBeam ) this.add( EXTRA.beam );
		this.onBeam = onBeam;

		for ( const item of this.feed ) item.t += dt;
		this.feed = this.feed.filter( ( item ) => item.t < FEED_TIME );
		if ( this.combo && ( this.combo.timer -= dt ) <= 0 ) this.bank();

	}

	/** Banks the combo: its points times its multiplier go to the total. */
	bank() {

		if ( ! this.combo ) return 0;
		const value = this.comboValue, moves = this.combo.moves;
		this.total += value;
		this.bestCombo = Math.max( this.bestCombo, value );
		this.combo = null;
		this.onBank( { value, moves, lost: false } );
		return value;

	}

	/** A bail or a fall: the combo is lost. */
	lose() {

		if ( ! this.combo ) return 0;
		const value = this.comboValue;
		this.combo = null;
		this.onBank( { value, moves: 0, lost: true } );
		return value;

	}

	/** The run's end: the combo still open is banked; the score. */
	finish() {

		this.bank();
		return { total: this.total, bestCombo: this.bestCombo };

	}

}
