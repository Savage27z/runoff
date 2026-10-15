// Map definitions. Courses run toward +z. Checkpoints are listed in order; the last one is the finish.
import * as THREE from 'three';
import { CONT } from '../world/builder.js';
import { gate, hint } from './gates.js';
import { ROOFTOPS } from './rooftops.js';
import { DOCKS } from './docks.js';
import { SKELETON } from './skeleton.js';
import { PARK } from './park.js';
import { OLDTOWN } from './oldtown.js';
import { YARD } from './yard.js';

export const MAPS = [
  ROOFTOPS,

  DOCKS,

  SKELETON,

  PARK,

  OLDTOWN,

  YARD,

  {
    id: 'depot',
    name: 'The Depot',
    tagline: 'Indoor parkour gym in an old rail depot',
    blurb: 'Box stairs, a truss bridge over the foam pit, the wall maze, the mezzanine and the tower.',
    theme: 'hall',
    unlock: 11,
    medals: [52, 43, 37.5, 33],
    spawn: { x: 0, y: 0, z: -8, yaw: 0 },
    killY: -8,
    isDead: (p) => p.y < -1,
    env: { hills: false, clouds: 14, shadow: 75 },
    checkpoints: [
      gate(-30, 30, 0, 30, { h: 4, vis: [-10, 10] }),
      gate(-6, 6, 4.8, 84),
      gate(-6, 6, 4.8, 123),
      gate(-30, 30, 0, 150, { h: 4, vis: [-10, 10] }),
      gate(-8, 8, 4.2, 190),
      gate(-6, 6, 3, 237),
      gate(-5, 5, 6.6, 276, { h: 5 }),
    ],
    hints: [
      hint(-14, 4, 'The Depot — land in the foam and you start over at the last gate'),
      hint(56, 62, 'Vault up the box stairs'),
      hint(86, 92, 'Truss bridge — or wall-run the red panel ←'),
      hint(170, 178, 'Jump <b>into</b> the red wall to run up it'),
      hint(205, 214, '<b>Slide</b>, then jump the pit'),
      hint(228, 234, 'Block hops to the tower'),
    ],
    build(b) {
      // floor (with pits cut out), mats
      b.box(-30, -1, -14, 30, 0, 92, { top: 'gym_floor', side: 'conc' });
      b.box(-30, -1, 118, 30, 0, 214, { top: 'gym_floor', side: 'conc' });
      b.box(-30, -1, 220.5, 30, 0, 232, { top: 'gym_floor', side: 'conc' });
      b.box(-30, -1, 268, 30, 0, 290, { top: 'gym_floor', side: 'conc' });
      b.box(-14, -3.6, 92, 14, -2.5, 118, 'conc'); // pit floor under the foam (collides -> dead zone)
      b.box(-30, -1, 92, -14, 0, 118, { top: 'gym_floor', side: 'conc' }); b.box(14, -1, 92, 30, 0, 118, { top: 'gym_floor', side: 'conc' });
      b.foamPit(-14, 92, 14, 118);
      b.foamPit(-30, 214, 30, 220.5);
      b.foamPit(-30, 232, 30, 268);
      for (const [x0, z0, x1, z1, m] of [[-4, 2, 4, 58, 'mat_dark'], [-4, 136, 4, 176, 'mat_red'], [-10, 272, 10, 288, 'mat_dark']]) b.box(x0, 0, z0, x1, 0.02, z1, m, { collide: false });

      // the building
      b.hall(-30, -14, 30, 290, 17, { roll: [[-6, 6, -13.95], [-6, 6, 289.95]] });
      // side mezzanines with stairs (walkable, off the racing line)
      for (const sd of [-1, 1]) {
        const xa = sd < 0 ? -30 : 22, xb = sd < 0 ? -22 : 30;
        b.w.box(xa, 4.25, 0, xb, 4.5, 280, { top: 'plywood', side: 'rail_dark', bottom: 'rail_dark' }, { keepBottom: true });
        for (let z = 4; z < 280; z += 12) b.column(sd < 0 ? -22.3 : 22.3, z, 0, 4.25, 0.15, 'rail_dark');
        b.meshRail(sd < 0 ? -22.05 : 22.05, 0, sd < 0 ? -22.05 : 22.05, 280, 4.5);
        b.stairs(sd < 0 ? -25 : 23, sd < 0 ? -23 : 25, 10, 0, 15, { rise: 0.3, run: 0.35, dir: 1, top: 'plywood' });
        for (let z = 20; z < 270; z += 22) b.plyBox(xa + 1, z, xb - 1, z + 4, 4.5, 7.5 + ((z / 22) % 2) * 1.5, (z / 22) % 3 ? '' : 'ew');
      }

      // Z1 — floor flow
      b.plyBox(-2, 6, 2, 7.4, 0, 1.0, 'n');
      b.pipeRail(-3, 12, 3, 12, 0, 1.0);
      b.plyBox(-1.6, 18, 1.6, 20, 0, 1.25, '', true);
      b.plyBox(-10, 24, -9.4, 34, 0, 3.5, 'e', true); b.plyBox(9.4, 24, 10, 34, 0, 3.5, 'w', true);
      b.plyBox(-1.2, 27, 1.2, 36, 0, 0.6);
      b.plyBox(-2, 42, 2, 44, 0, 1.2, 'ns');
      b.plyBox(-1.5, 50, 1.5, 52, 0, 1.0, 'n', true);
      for (const [x0, z0, x1, z1, h, r, c] of [[-16, 8, -12, 12, 1.5, 'e', false], [12, 14, 17, 17, 2.4, '', true], [-18, 30, -13, 33, 1.2, 'n', false], [13, 36, 16, 42, 3.0, 'w', true], [-16, 46, -12, 52, 2.0, '', true], [12, 52, 18, 55, 1.0, 'n', false]]) b.plyBox(x0, z0, x1, z1, 0, h, r, c);
      b.pipeRail(-18, 20, -12, 20, 0, 1.1); b.pipeRail(12, 26, 18, 26, 0, 1.1);

      // Z2 — box stairs up to P1
      b.plyBox(-5, 62, 5, 66, 0, 1.2, 's');
      b.plyBox(-5, 66, 5, 70, 0, 2.4, 's', true);
      b.plyBox(-5, 70, 5, 74, 0, 3.6, 's');
      b.plyBox(-5, 74, 5, 78, 0, 4.8, 's', true);
      b.plyBox(-6, 78, 6, 92, 0, 4.8, 'ew');
      b.pipeRail(-5.9, 78, -5.9, 92, 4.8);

      // Z3 — the foam pit: truss bridge, or wall-run the red panel
      b.trussBridge(0, 92, 118, 4.8, 2);
      b.plyBox(6, 93, 6.6, 117, -2.5, 8, 'ew', true);
      b.plyBox(-6, 118, 6, 130, 0, 4.8, 'n');
      b.pipeRail(-5.9, 118, -5.9, 130, 4.8); b.pipeRail(5.9, 118, 5.9, 130, 4.8);

      // Z4 — the wall maze on the floor
      b.plyBox(-14, 140, 14, 140.6, 0, 3.2, 'ns', true);
      b.plyBox(-14, 156, 14, 156.5, 0, 1.2, 'n');
      for (const sd of [-1, 1]) b.plyBox(sd * 8 - 0.3, 144, sd * 8 + 0.3, 170, 0, 3.5, sd < 0 ? 'e' : 'w', true);
      b.plyBox(-1, 162, 1, 166, 0, 1.0);
      b.plyBox(-8, 178, 8, 178.6, 0, 4.2, 's', true);

      // Z5 — mezzanine run
      b.plyBox(-8, 178.6, 8, 214, 0, 4.2, 'ew');
      b.meshRail(-7.95, 178.6, -7.95, 214, 4.2); b.meshRail(7.95, 178.6, 7.95, 214, 4.2);
      b.pipeRail(-6, 186, 6, 186, 4.2, 1.0);
      b.box(-8, 5.15, 193.6, 8, 5.7, 194.4, { side: 'rail_dark', top: 'rail_dark', bottom: 'rail_dark' }, { keepBottom: true });
      b.pipeRail(-6, 202, 6, 202, 4.2, 1.0);
      b.plyBox(-6, 220.5, 6, 232, 0, 4.2, 's', true);

      // Z6 — block hops over the long pit, the finish tower
      const hops = [[235, 3.0], [242, 1.8], [249, 3.0], [256, 4.2], [263, 5.4]];
      hops.forEach(([z, h], i) => b.plyBox(-2.5, z, 2.5, z + 4, -2.5, h, i % 2 ? 'ns' : '', i % 2 === 0));
      b.plyBox(-5, 270, 5, 282, 0, 6.6, 'sew', true);
      b.pipeRail(-4.9, 270, -4.9, 282, 6.6); b.pipeRail(4.9, 270, 4.9, 282, 6.6);
      b.sign(0, 11, 289.3, 14, 3, 'THE DEPOT', '#ff5a1f', Math.PI);

      // outside: a few buildings seen through the windows
      b.backdrop({ x0: -300, x1: 300, z0: -200, z1: 500, cell: 40, hMin: 14, hMax: 60, fill: 0.6, avoid: [[-40, -30, 40, 300]], roofDeco: false });
      b.street(-0.05);
    },
  },
];

export const mapById = (id) => MAPS.find((m) => m.id === id) || MAPS[0];
