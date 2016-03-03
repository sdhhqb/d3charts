({
	appDir: '../src',
	baseUrl: './',
	optimize: 'none',
	// optimize: 'uglify',
	name: 'd3charts',
	useSourceUrl: false,
	packages: [
		{
			name: 'd3charts',
			location: './',
			main: 'd3charts'
		}
	],
	include:[
        'd3charts/chart/pie',
        'd3charts/chart/bar'
    ],
	dir: '../dist'
})