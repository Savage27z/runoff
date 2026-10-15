import { defineConfig } from 'vite';

export default defineConfig( {
	// reference/ holds the original RUNOFF as the porting source: never served, scanned or watched.
	server: { port: 5173, strictPort: true, watch: { ignored: [ '**/reference/**' ] } },
	preview: { port: 5174, strictPort: true },
	build: { target: 'es2022', chunkSizeWarningLimit: 3000 },
	// One three.js for the page and the runner: the WebGPU build, which carries every core class too.
	resolve: { alias: [ { find: /^three$/, replacement: 'three/webgpu' } ] },
	// box3d's backend loads its engine on demand, which the dependency scan cannot follow.
	// The runner's packages are served as they are, not pre-bundled: one instance of each module whether imported by
	// path or through the index, and src/sim/arcade.js rebinds the action table before the input module reads it.
	// three.js is served as it is too, so the game and the runner share one copy of each of its modules (the character
	// fit hooks the glTF loader the runner's figure uses).
	optimizeDeps: { entries: [ 'index.html' ], include: [ 'box3d.js/inline' ], exclude: [ 'three', '@trizendigital/parkour', '@trizendigital/parkour-box3d' ] },
} );
