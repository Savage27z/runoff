// The runners the Locker offers (characters.json): Mixamo characters fitted to the Y Bot's skeleton as they load
// (fit.js), and the Y Bot itself. The first is the default. A character from mixamo.com is added with
// `node tools/characters/convert.mjs <file.fbx> <id> "<Name>"`, which writes its glTF to public/characters/ and its entry
// to characters.json.

import CHARACTER_LIST from './characters.json' with { type: 'json' };

export const CHARACTERS = CHARACTER_LIST;

export const characterById = ( id ) => CHARACTERS.find( ( c ) => c.id === id ) ?? CHARACTERS[ 0 ];
