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
	passport = require('passport'),
	JwtStrategy = require('passport-jwt').Strategy,
	ExtractJwt = require('passport-jwt').ExtractJwt,
	jwt = require('jwt-simple');
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
	var dbConnection = mysql.createConnection(dbConfig);

	var app = express();
	var router = express.Router();
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({extended: true}));
	app.use(passport.initialize());
	app.use(express.static(path.join(__dirname, 'dist')));

	var opts = {};
	opts.secretOrKey = dbConfig.database;
	opts.jwtFromRequest = ExtractJwt.fromAuthHeader();

	passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
		var select_sql = "SELECT * FROM users WHERE username = ?";
		select_sql = mysql.format(select_sql, jwt_payload.username);
		dbConnection.query(select_sql, function(error, results, fields) {
			if(results.length == 1) {
				done(null, results[0]);
			} else {
				done(null, false);
			}
		});
	}));

	router.post('/api/authenticate', function(req, res) {
		var select_sql = "SELECT * FROM users WHERE username = ?";
		if(req.body.username) {
			select_sql = mysql.format(select_sql, req.body.username);
			dbConnection.query(select_sql,  function(error, results, fields) {
				if(results.length == 0) {
					res.send({success: false, msg:'Nume utilizator gresit!'});
				} else {
					if(req.body.password) {
						if(results[0].password === req.body.password) {
							console.log("Logare "+results[0].username);
							var token = jwt.encode(results[0], dbConfig.database);
							res.json({success: true, token: 'JWT ' + token, msg: 'Authentification '});
						} else {
							res.send({success: false, msg:'Parola gresita!'});
						}	
					} else {
						res.send({success: false, msg:'Parola necompletata!'});
					}
				}
			});	
		} else {
			res.send({success: false, msg:'Nume utilizator necompletat!'});
		}
	});

	router.get('/api/memberinfo', passport.authenticate('jwt', {session: false}), function(req, res) {
		var getToken = function(headers) {
			if(headers && headers.authorization) {
				var parted = headers.authorization.split(' ');
				if(parted.length == 2) {
					return parted[1];
				} else {
					return null;
				}
			} else {
				return null;
			}
		}

		var token = getToken(req.headers);
		if(token) {
			var decoded = jwt.decode(token, dbConfig.database);
			var select_sql = "SELECT * FROM users WHERE username = ?";
			select_sql = mysql.format(select_sql, decoded.username);
			dbConnection.query(select_sql, function(error, results, fields) {
				if(results.length == 1) {
					var info = {username: decoded.username, familie: decoded.family};
					res.json({success: true, msg: info});
				} else {
					res.status(403).send({success: false, msg: 'Nume utilizator inexistent!'});
				}
			});
		} else {
			res.status(403).send({success: false, msg: 'Nu exista token!'});
		}
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
