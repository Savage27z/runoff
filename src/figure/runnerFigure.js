// The runner the player sees: a Mixamo-rigged character (src/figure/characters.json lists them; the first is the default)
// posed by the Trizen runner from its mocap takes. Every character wears the Y Bot's rig description, ragdoll and
// takes: a character other than the Y Bot is fitted to the Y Bot's skeleton as it loads (fit.js), so the takes pose it
// the same way.

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RiggedFigure } from '@trizendigital/parkour/figure/RiggedFigure.js';
import YBOT from '../data/ybot.json' with { type: 'json' };
import RAGDOLL from '../data/ybot-ragdoll.json' with { type: 'json' };
import REST from './ybot-rest.json' with { type: 'json' };
import { fitCharacter } from './fit.js';
import { CHARACTERS, characterById } from './characters.js';

const BASE = import.meta.env.BASE_URL;

// The models to fit as they load, by URL. The core's figure loads its model itself (a GLTFLoader of its own), so the
// fit rides on the loader: a model on this list is fitted before the figure sees it.
const FITTED = new Set();
const loadAsync = GLTFLoader.prototype.loadAsync;
GLTFLoader.prototype.loadAsync = async function ( url, onProgress ) {

	const gltf = await loadAsync.call( this, url, onProgress );
	return FITTED.has( url ) ? fitCharacter( gltf, REST ) : gltf;

};

export class RunnerFigure extends RiggedFigure {

	/**
	 * @param {object} [options]
	 * @param {string} [options.character] a character's id (src/figure/characters.json); the first by default
	 */
	constructor( { character = CHARACTERS[ 0 ].id } = {} ) {

		const entry = characterById( character );
		const model = `${BASE}${entry.model}`;
		if ( entry.fit ) FITTED.add( model );
		super( { rig: { ...YBOT, model }, ragdoll: RAGDOLL, takes: `${BASE}data/takes/`, name: entry.name } );
		this.character = entry;

	}

}
