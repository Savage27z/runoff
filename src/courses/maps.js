// Map definitions, one file each. Courses run toward +z. Checkpoints are listed in order; the last one is the finish.
import { ROOFTOPS } from './rooftops.js';
import { DOCKS } from './docks.js';
import { SKELETON } from './skeleton.js';
import { PARK } from './park.js';
import { OLDTOWN } from './oldtown.js';
import { YARD } from './yard.js';
import { DEPOT } from './depot.js';

export const MAPS = [ ROOFTOPS, DOCKS, SKELETON, PARK, OLDTOWN, YARD, DEPOT ];

export const mapById = ( id ) => MAPS.find( ( m ) => m.id === id ) || MAPS[ 0 ];
