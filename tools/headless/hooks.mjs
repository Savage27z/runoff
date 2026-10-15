// Module resolution for headless runs: `three` is `three/webgpu`, as the page's bundler resolves it, so the game and
// three.js's addons share one copy of three.js; `import.meta.env` is Vite's, so give modules a stand-in.

export async function resolve( specifier, context, next ) {

	if ( specifier === 'three' ) return next( 'three/webgpu', context );
	return next( specifier, context );

}

export async function load( url, context, next ) {

	const result = await next( url, context );
	if ( url.includes( '/src/' ) && ! url.includes( 'node_modules' ) && result.source ) {

		const source = String( result.source );
		if ( source.includes( 'import.meta.env' ) ) return { ...result, source: source.replaceAll( 'import.meta.env.BASE_URL', '"./"' ) };

	}

	return result;

}
