var bodyParser = require('body-parser'),
	express = require('express'),
	fs = require('fs'),
	gulp = require('gulp'),
	concat = require('gulp-concat'),
	minifyCss = require('gulp-cssnano'),
	minifyHTML = require('gulp-htmlmin'),
	less = require('gulp-less'),
	rename = require('gulp-rename'),
	minifyJs = require('gulp-uglify'),
	usemin = require('gulp-usemin'),
	gutil = require('gulp-util'),
	http = require('http'),
	mysql = require('mysql'),
	path = require('path'),
	pump = require('pump'),
    csv = require('csv');
var dbConfig = require('./config').DB;

var paths = {
	scripts: 'src/js/**/*.*',
	styles: 'src/less/**/*.*',
	images: 'src/img/**/*.*',
	templates: 'src/templates/**/*.html',
	index: 'src/index.html',
	bower_fonts: 'src/components/**/*.{otf,ttf,woff,woff2,eof,svg}',
	bower_images: 'src/components/**/*.png'
};

/**
 * Handle bower components from index
 */
gulp.task('usemin', function(cb) {
	pump([
			gulp.src(paths.index),
			usemin({
				js: [minifyJs(), 'concat'],
				css: [minifyCss({keepSpecialComments: 0}), 'concat']
			}),
			gulp.dest('dist/')
		],
		cb
	);
});

/**
 * Copy assets
 */
gulp.task('build-assets', ['copy-bower_fonts', 'copy-bower_images']);

gulp.task('copy-bower_fonts', function(cb) {
	pump([
			gulp.src(paths.bower_fonts),
			rename({dirname: '/fonts'}),
			gulp.dest('dist/lib')
		],
		cb
	);
});

gulp.task('copy-bower_images', function(cb) {
	pump([
			gulp.src(paths.bower_images),
			rename({dirname: '/images'}),
			gulp.dest('dist/lib/css')
		],
		cb
	);
});

/**
 * Handle custom files
 */
gulp.task('build-custom', ['custom-images', 'custom-js', 'custom-less', 'custom-templates']);

gulp.task('custom-images', function(cb) {
	pump([
			gulp.src(paths.images),
			gulp.dest('dist/img')
		],
		cb
	);
});

gulp.task('custom-js', function(cb) {
	pump([
			gulp.src(paths.scripts),
			minifyJs(),
			concat('dashboard.min.js'),
			gulp.dest('dist/js')
		],
		cb
	);
});

gulp.task('custom-less', function(cb) {
	pump([
			gulp.src(paths.styles),
			less(),
			gulp.dest('dist/css')
		],
		cb
	);
});

gulp.task('custom-templates', function(cb) {
	pump([
			gulp.src(paths.templates),
			minifyHTML(),
			gulp.dest('dist/templates')
		], 
		cb
	);
});

/**
 * Watch custom files
 */
gulp.task('watch', function() {
	gulp.watch([paths.images], ['custom-images']);
	gulp.watch([paths.styles], ['custom-less']);
	gulp.watch([paths.scripts], ['custom-js']);
	gulp.watch([paths.templates], ['custom-templates']);
	gulp.watch([paths.index], ['usemin']);
});

/**
 * Express web server
 */
gulp.task('express', function() {
	var app = express();
	var router = express.Router();
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({extended: true}));
	app.use(express.static(path.join(__dirname, 'dist')));

	var dbConnection = mysql.createConnection(dbConfig);

	router.get('/test_link', function(req, res) {
		res.send("OK");
	});

	app.use('/', router);
	var server = http.createServer(app);
    var HTTP_PORT = 8888;
    server.listen(HTTP_PORT, function() {
        console.log("Listening on port "+HTTP_PORT);
    });
});

/**
 * Gulp tasks
 */
gulp.task('build', ['usemin', 'build-assets', 'build-custom']);
gulp.task('dev', ['express', 'watch']);
gulp.task('default', ['build', 'dev']);
