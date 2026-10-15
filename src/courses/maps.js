// Map definitions. Courses run toward +z. Checkpoints are listed in order; the last one is the finish.
import * as THREE from 'three';
import { CONT } from '../world/builder.js';
import { gate, hint } from './gates.js';
import { ROOFTOPS } from './rooftops.js';
import { DOCKS } from './docks.js';
import { SKELETON } from './skeleton.js';
import { PARK } from './park.js';
import { OLDTOWN } from './oldtown.js';

// Background old-town fill: rows of timber houses with the odd modern poster block.
function townFill(b, keep, { x0 = -90, x1 = 90, z0 = -60, z1 = 400, skip = null } = {}) {
  const fac = ['fac_shoji', 'fac_shoji2', 'fac_shoji3'], roofs = ['tile_roof', 'tile_roof2', 'tile_roof3'];
  for (let x = x0; x < x1; x += 13) {
    for (let z = z0; z < z1; z += 12) {
      const w = b.r(8, 11), d = b.r(8, 10.5), bx = x + b.r(0, 12 - w), bz = z + b.r(0, 11 - d);
      if (keep.some(([a0, c0, a1, c1]) => bx < a1 && bx + w > a0 && bz < c1 && bz + d > c0)) continue;
      if (skip && skip(bx, bz, w, d)) continue;
      if (b.rng() < 0.13) {
        b.building(bx, bz, bx + w, bz + d, b.r(14, 30), b.pick(['fac_conc', 'fac_conc2', 'fac_grey']), '', { roof: 'pav_light', trim: 'trim_green' });
        b.poster(bx + w / 2, b.r(5, 9), bz - 0.03, 3, 4, Math.PI, (b.rng() * 4) | 0);
      } else {
        b.house(bx, bz, bx + w, bz + d, b.r(4, 9), b.r(1.6, 3), b.rng() < 0.5 ? 'x' : 'z', b.pick(fac), b.pick(roofs), { walk: false });
      }
    }
  }
}

export const MAPS = [
  ROOFTOPS,

  DOCKS,

  SKELETON,

  PARK,

  OLDTOWN,

  {
    id: 'yard',
    name: 'Training Yard',
    tagline: 'The parkour yard beside the old hall',
    blurb: 'Vault garden, balance beams, wall-run lanes, the scaffold tower and the big launch.',
    theme: 'haze',
    unlock: 9,
    medals: [66, 54, 47, 41],
    spawn: { x: 0, y: 0, z: -6, yaw: 0 },
    killY: -6,
    isDead: (p) => p.y < -1.5,
    env: { birds: [0, 30, 120], hills: { radius: 650, count: 18, height: [140, 320] }, clouds: 18 },
    checkpoints: [
      gate(-14, 14, 0, 30, { h: 5 }),
      gate(-8, 8, 2.5, 66),
      gate(-8, 8, 2.5, 92),
      gate(-8, 8, 2.5, 116),
      gate(-8, 8, 2.5, 133),
      gate(-6, 6, 7.3, 149),
      gate(-8, 8, 1.5, 200, { h: 5 }),
      gate(-12, 12, 0.5, 248, { h: 6 }),
      gate(-8, 8, 2.5, 299),
      gate(-8, 8, 9.2, 321),
      gate(-8, 8, 8.2, 337),
      gate(-12, 12, 0.5, 375, { h: 6 }),
    ],
    hints: [
      hint(-12, 4, 'Training Yard — vault, run, flip. Keep the flow.'),
      hint(70, 74, 'Walk the beam — don\'t fall in the pit'),
      hint(97, 100, '← Wall-run the green panel'),
      hint(119, 122, 'Now the other side →'),
      hint(190, 195, 'Slide under the bar'),
      hint(209, 221, 'Launch off the deck — flip it!'),
      hint(252, 262, 'Pillar jumps — one full jump each'),
      hint(309, 315, 'Jump <b>into</b> the green wall to run up it'),
      hint(322, 327, '<b>Slide</b>, then jump the gap'),
    ],
    build(b) {
      const G = 'paint_green';
      // ground: the yard floor, a deep pit through the middle section, the street outside
      b.box(-14, -3, -12, 14, 0, 58, { top: 'pav_light', side: 'conc' });
      b.box(-14, -6, 58, 14, -4, 146, { top: 'clay', side: 'conc' });
      b.box(-14, -3, 146, 14, 0, 262, { top: 'pav_light', side: 'conc' });
      b.box(-14, -6, 262, 14, -4, 295, { top: 'clay', side: 'conc' });
      b.box(-14, -3, 295, 14, 0, 396, { top: 'pav_light', side: 'conc' });
      b.box(-90, -3, -60, -14, 0, 400, { top: 'pav_warm', side: 'stone' });
      b.box(14, -3, -60, 90, 0, 400, { top: 'pav_warm', side: 'stone' });
      // perimeter walls
      for (const sd of [-1, 1]) {
        const x = sd * 14;
        b.yardBlock(Math.min(x, x + sd * 0.8), -12, Math.max(x, x + sd * 0.8), 396, -6, 3.2, sd > 0 ? 'w' : 'e');
      }
      for (let z = -8; z < 392; z += 16) { if ((z > 44 && z < 150) || (z > 250 && z < 300)) continue; b.lampPost(-12.8, 0, z, 5); b.lampPost(12.8, 0, z + 8, 5); }

      // Z1 — vault garden
      const blocks = [
        [-1.6, 5, 1.6, 6.2, 1.0, 'n'], [-10, 4, -6, 7, 1.2, ''], [6, 8, 9, 11, 1.6, 'w'],
        [-2, 12, 2, 13.2, 1.1, ''], [-11, 13, -8, 17, 1.8, 'e'], [7, 16, 11, 18, 0.9, ''],
        [-1.4, 20, 1.4, 21.4, 1.2, 'n'], [-8, 24, -4, 26, 1.0, ''], [4, 25, 8, 28, 2.2, 'w'],
        [-1.8, 34, 1.8, 35.2, 0.9, ''], [-11, 36, -7, 40, 2.4, 'e'], [7, 38, 11, 41, 1.2, ''],
        [-1.5, 44, 1.5, 45.3, 1.25, 'n'], [-6, 48, -3, 51, 1.6, ''], [5, 49, 9, 52, 1.0, ''],
      ];
      for (const [x0, z0, x1, z1, h, g] of blocks) b.yardBlock(x0, z0, x1, z1, 0, h, g);
      b.wallPanel(-4.3, 28, -3.7, 33, 0, 3.4); b.wallPanel(3.7, 30, 4.3, 36, 0, 3.4);
      b.pipeRail(-12, 8, -12, 20, 0); b.pipeRail(12, 20, 12, 44, 0);

      // Z2 — ramp up, deck, balance beams over the pit, deck
      b.ramp(-4, 4, 54, 58, 0, 2.5);
      b.box(-4, -3, 54, 4, 0, 58, 'conc', { collide: false });
      b.yardBlock(-8, 58, 8, 74, -4, 2.5, 'n');
      b.pipeRail(-7.8, 58, -7.8, 74, 2.5); b.pipeRail(7.8, 58, 7.8, 74, 2.5);
      b.beam(0, 74, 86, 2.5, 0.6, -4);
      b.beam(4.5, 74, 86, 2.5, 0.45, -4);
      b.beam(-4.5, 76, 84, 2.5, 0.45, -4);
      b.yardBlock(-8, 86, 8, 100, -4, 2.5, 's');
      b.yardBlock(-7, 92, -4, 95, 2.5, 3.5, '');

      // Z3 — wall-run lanes over the pit (left panel, then right panel)
      b.wallPanel(5, 97, 5.7, 113, -4, 6.5);
      b.yardBlock(-8, 110, 8, 122, -4, 2.5, 'ns');
      b.wallPanel(-5.7, 119, -5, 135, -4, 6.5);
      b.yardBlock(-8, 132, 8, 146, -4, 2.5, 's');

      // Z4 — scaffold stair tower
      b.stairs(-2, 2, 134, 2.5, 8, { rise: 0.3, run: 0.4, dir: 1, rails: false, top: 'wood' });
      b.plankDeck(-6, 137.2, 6, 141, 4.9);
      b.stairs(-2, 2, 141, 4.9, 8, { rise: 0.3, run: 0.4, dir: 1, rails: false, top: 'wood', base: 4.7 });
      b.plankDeck(-6, 144.2, 6, 152, 7.3);
      b.scaffold(-6, 134, 6, 152, 0, 8.8);
      b.pipeRail(-6, 144.2, -6, 152, 7.3); b.pipeRail(6, 144.2, 6, 152, 7.3);
      b.yardBlock(-6, 156, 6, 166, 0, 7, 'swe');

      // Z5 — stepped tiers, slide bar, ramp to the launch deck
      b.yardBlock(-7, 170, 7, 178, 0, 4.5, 's');
      b.yardBlock(-7, 181, 7, 189, 0, 3, 'e');
      b.yardBlock(-8, 189, 8, 205, 0, 1.5, '');
      b.box(-8, 2.45, 195.6, 8, 3.0, 196.4, { side: 'conc', top: 'trim_yellow', bottom: 'conc' }, { keepBottom: true });
      for (const x of [-7.7, 7.7]) b.box(x - 0.3, 1.5, 195.7, x + 0.3, 2.45, 196.3, 'conc');
      b.ramp(-4, 4, 205, 209, 1.5, 4);
      b.yardBlock(-8, 209, 8, 221, 0, 4, 'nw');
      b.pipeRail(-7.8, 209, -7.8, 221, 4); b.pipeRail(7.8, 209, 7.8, 221, 4);
      b.wallPanel(-8, 205, -7.4, 209, 0, 5.5);

      // Z6 — clay courtyard finish beside the hall
      b.box(-14, 0, 224, 14, 0.5, 262, { top: 'clay', side: 'conc' });
      b.rock(-6, 0.5, 236, 1.3); b.rock(7, 0.5, 242, 1.0); b.tree(-10, 0.5, 254, 1.2); b.tree(10, 0.5, 230, 1.0);
      b.torii(0, 0.5, 248, 9, 6);

      // Z7 — pillar jumps over the second pit
      [1.3, 1.8, 2.3, 2.0, 2.5].forEach((h, k) => {
        const z0 = 265 + k * 6;
        b.yardBlock(-1.25, z0, 1.25, z0 + 2.5, -4, h, k % 2 ? 'n' : 's');
      });
      b.beam(-5, 266, 290, 2.2, 0.45, -4);
      // Z8 — deck, ledge climb, the green climbing wall
      b.yardBlock(-8, 295, 8, 305, 0, 2.5, 's');
      b.yardBlock(-8, 305, 8, 315, 0, 5, 's');
      b.wallPanel(-8, 315, 8, 317, 0, 9.2);
      b.yardBlock(-8, 317, 8, 327, 0, 9.2, 'e');
      b.pipeRail(-7.8, 317, -7.8, 327, 9.2); b.pipeRail(7.8, 317, 7.8, 327, 9.2);
      b.scaffold(-8, 305, -6, 327, 0, 10.5);
      // Z9 — slide-jump gap to the hurdle deck
      b.yardBlock(-8, 334, 8, 350, 0, 8.2, 'sw');
      b.pipeRail(-6, 339, 6, 339, 8.2); b.pipeRail(-6, 344.5, 6, 344.5, 8.2);
      b.pipeRail(-7.8, 334, -7.8, 350, 8.2); b.pipeRail(7.8, 334, 7.8, 350, 8.2);
      // Z10 — launch into the second courtyard, finish torii
      b.box(-14, 0, 355, 14, 0.5, 396, { top: 'clay', side: 'conc' });
      b.rock(-7, 0.5, 365, 1.2); b.rock(8, 0.5, 384, 1.4); b.tree(10, 0.5, 362, 1.1); b.tree(-10, 0.5, 388, 1.2);
      for (const [x, z] of [[-12, 370], [12, 370]]) b.stoneLantern(x, 0.5, z);
      b.torii(0, 0.5, 375, 11, 7);
      b.lanternLine(-14, 8, 380, 14, 8, 380, { n: 8 });

      // the hall and the town
      b.box(16, 0, 120, 48, 5, 280, { side: 'stone', top: 'pav_warm' });
      b.house(18, 124, 46, 276, 15, 4, 'z', 'fac_shoji3', 'tile_roof', { base: 5, walk: false });
      b.house(24, 150, 40, 250, 23, 3.5, 'z', 'fac_shoji', 'tile_roof', { base: 19, walk: false });
      for (let z = 130; z < 272; z += 9) b.lantern(17.9, 13.2, z, 'lantern_red', 1.3);
      townFill(b, [[-16, -20, 16, 400], [14, 118, 50, 282]], { z1: 460 });
      b.lattice(-52, 0, 150, -46, 70, 156, 'beam', 'y', 4);
      b.light(-49, 71, 153, '#ff3030', 2.2, true);
      b.backdrop({ x0: -400, x1: 400, z0: 480, z1: 750, cell: 40, hMin: 30, hMax: 110, fill: 0.55, roofDeco: false, facades: ['fac_conc', 'fac_conc2', 'fac_grey', 'fac_office'] });
    },
  },

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
