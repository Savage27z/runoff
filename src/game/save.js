// The player's progress and preferences, kept in the browser (localStorage): the settings, the runner they chose and
// its tint, each course's best run (time, splits, medal) and the course last played. Stars are earned per course, one
// per medal tier reached (Bronze 1 … Ace 4), and unlock courses.

const KEY = 'runoff2.save';

export const DEFAULT_SETTINGS = Object.freeze( {
	// Mouse look: times the runner's default sensitivity.
	sensitivity: 1,
	invertY: false,
	// Horizontal field of view (degrees).
	fov: 110,
	// How far behind the runner the camera sits (m).
	cameraDistance: 3,
	// 'high', 'medium' or 'low': the render scale and the shadows.
	quality: 'high',
	// Master volume, 0–1.
	volume: 0.8,
	hints: true,
	// Your best run on a course, run beside you as a ghost.
	ghost: true,
	showFps: false,
} );

const blank = () => ( { settings: { ...DEFAULT_SETTINGS }, character: null, tint: null, courses: {}, lastCourse: 'rooftops' } );

export const Save = {

	data: blank(),

	load() {

		try {

			const stored = JSON.parse( localStorage.getItem( KEY ) || 'null' );
			if ( stored ) this.data = { ...blank(), ...stored, settings: { ...DEFAULT_SETTINGS, ...stored.settings } };

		} catch {

			this.data = blank();

		}

		return this;

	},

	persist() {

		try {

			localStorage.setItem( KEY, JSON.stringify( this.data ) );

		} catch {}

	},

	/** A course's record: `{ best, splits, medal, runs }` (medal -1 for none yet). */
	course( id ) {

		return ( this.data.courses[ id ] ??= { best: null, splits: null, medal: - 1, runs: 0 } );

	},

	/** Stars earned over every course: a star per medal tier reached. */
	stars() {

		return Object.values( this.data.courses ).reduce( ( sum, c ) => sum + ( c.medal + 1 ), 0 );

	},

	reset() {

		const settings = this.data.settings, character = this.data.character, tint = this.data.tint;
		this.data = { ...blank(), settings, character, tint };
		this.persist();

	},

};
