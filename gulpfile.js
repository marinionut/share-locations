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

	router.get('/api/families/:id?', passport.authenticate('jwt', {session: false}), function(req, res) {
		var select_sql = "SELECT * FROM families";
		if(req.params.id) {
			select_sql += " WHERE id = ?";
			select_sql = mysql.format(select_sql, req.params.id);
		}
		dbConnection.query(select_sql, function(error, results, fields) {
			if(results.length != 0) {
				res.json(results);
			} else {
				res.send("fail");
			}
		});
	});

	router.put('/api/family', passport.authenticate('jwt', {session: false}), function(req, res) {
		var checkName = function(nume) {
			var select_sql = "SELECT nume FROM families WHERE nume = ?";
			select_sql = mysql.format(select_sql, req.body.nume);
			dbConnection.query(select_sql, function(error, results, fields) {
				if(results.length == 0) {
					insertFamily(nume);
				} else {
					res.send({success: false, msg: 'Nume de familie existent!'});
				}
			});
		}

		var insertFamily = function(nume) {
			var insert_sql = "INSERT INTO families(nume) VALUES (?)";	
			insert_sql = mysql.format(insert_sql, req.body.nume);
			dbConnection.query(insert_sql, function(error, results, fields) {
				if(results.affectedRows == 1) {
					gutil.log("Familie inregistrata: "+req.body.nume);
					res.send({success: true, msg: results.insertId});
				} else {
					res.send({success: false, msg: "Eroare la adaugarea familiei!"});
				}
			});
		}

		if(req.body.nume) {
			checkName(req.body.nume);
		} else {
			res.send({success: false, msg: 'Completati numele de familie!'});
		}
	});

	router.delete('/api/family/:id', passport.authenticate('jwt', {session: false}), function(req, res) {
		var delete_sql = "DELETE FROM families WHERE id = ?";
		delete_sql = mysql.format(delete_sql, req.params.id);
		dbConnection.query(delete_sql, function(error, results, fields) {
			if(results.affectedRows == 1) {
				res.send({success: true, msg: "Familie stearsa!"});
			} else {
				res.send({success: false, msg: "Eroare la stergerea familiei!"});
			}
		});
	});

	router.put('/api/register', function(req, res) {
		var checkUsername = function(username, password) {
			var select_sql = "SELECT username FROM users WHERE username = ?";
			select_sql = mysql.format(select_sql, username);
			dbConnection.query(select_sql, function(error, results, fields) {
				if(results.length == 0) {
					insertUser(username, password);
				} else {
					res.send({success: false, msg: 'Nume de utilizator existent!'});
				}
			});
		}

		var insertUser = function(username, password) {
			var insert_sql = "INSERT INTO users(username, password, family) VALUES (?, ?, 1)";
			insert_sql = mysql.format(insert_sql, [req.body.username, req.body.password]);
			dbConnection.query(insert_sql, function(error, results, fields) {
				if(results.affectedRows == 1) {
					gutil.log("Utilizator inregistrat: "+username);
					res.send({success: true, msg: 'Inregistrare efectuata!'});
				} else {
					res.send({success: false, msg: 'Eroare la adaugare utilizator!'});	
				}
			});
		}

		if(req.body.username && req.body.password){
			checkUsername(req.body.username, req.body.password);
		} else {
			res.send({success: false, msg: 'Completati numele de utilizator cat si parola!'});
		}
	});

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
							gutil.log("Utilizator autentificat: "+results[0].username);
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
					var info = {id: results[0].id, username: results[0].username, familie: results[0].family};
					res.json({success: true, msg: info});
				} else {
					res.status(403).send({success: false, msg: 'Nume utilizator inexistent!'});
				}
			});
		} else {
			res.status(403).send({success: false, msg: 'Nu exista token!'});
		}
	});

	router.post('/api/user/:id', passport.authenticate('jwt', {session: false}), function(req, res) {
		var update_sql = "UPDATE users SET family = ? WHERE id = ?";
		update_sql = mysql.format(update_sql, [req.body.id, req.params.id]);
		dbConnection.query(update_sql, function(error, results, fields) {
			if(results.affectedRows == 1) {
				gutil.log("Familie actualizata!");
				res.send({success: true, msg: 'Familie actualizata!'});
			} else {
				res.send({success: false, msg: 'Eroare la actualizare familie utilizator!'});
			}
		});
	});

	router.get('/api/members/:id', passport.authenticate('jwt', {session: false}), function(req, res) {
		var select_sql = "SELECT * FROM users WHERE family = ?";
		select_sql = mysql.format(select_sql, req.params.id);
		dbConnection.query(select_sql, function(error, results, fields) {
			if(results.length > 0) {
				res.json(results);
			} else {
				res.send("fail");
			}
		});
	});

	router.get('/api/locations/:id', passport.authenticate('jwt', {session: false}), function(req, res) {
		var select_sql = "SELECT l.latitude, l.longitude, l.message, l.uid FROM locations l, users u WHERE l.uid = u.id AND u.family = ?";
		select_sql = mysql.format(select_sql, req.params.id);
		dbConnection.query(select_sql, function(error, results, fields) {
			if(results.length > 0) {
				res.json(results);
			} else {
				res.send("fail");
			}
		});
	});

	router.put('/api/locations/:id', passport.authenticate('jwt', {session: false}), function(req, res) {
		var insert_sql = "INSERT INTO locations(latitude, longitude, message, uid) VALUES ";
		for(var i=0; i<req.body.length; i++) {
			insert_sql += "("+req.body[i].lat+", "+req.body[i].lng+", '"+req.body[i].message+"', "+req.params.id+")";
			if(i < req.body.length-1)
				insert_sql += ", "
		}
		dbConnection.query(insert_sql, function(error, results, fields) {
			res.send(results);
		});
	});

    router.get('/api/exportLocations/:id', passport.authenticate('jwt', {session: false}), function(req, res) {
        var select_sql = "SELECT l.latitude, l.longitude, l.message, l.uid FROM locations l, users u WHERE l.uid = u.id AND u.family = ?";
        select_sql = mysql.format(select_sql, req.params.id);
        dbConnection.query(select_sql, function(error, results, fields) {
            if(results.length > 0) {
                var objs = [];
                for (var i = 0;i < results.length; i++) {
                    objs.push({message: results[i].message,
						latitude: results[i].latitude,
                        longitude: results[i].longitude
                    });
                }
                res.send(JSON.stringify(objs));
            } else {
                res.send("fail");
            }
        });
    });

    router.put('/api/importLocations/:id', passport.authenticate('jwt', {session: false}), function(req, res) {
        var insert_sql = "INSERT INTO locations(latitude, longitude, message, uid) VALUES ";
        for(var i=0; i<req.body.length; i++) {
            insert_sql += "("+req.body[i].latitude+", "+req.body[i].longitude+", '"+req.body[i].message+"', "+req.params.id+")";
            if(i < req.body.length-1)
                insert_sql += ", "
        }
        dbConnection.query(insert_sql, function(error, results, fields) {
        	if (error !== null) {
        		throw error;
			}
            res.send(results);
        });
    });


	app.use('/', router);
	var server = http.createServer(app);
    var HTTP_PORT = 8888;
    server.listen(HTTP_PORT, function() {
        gutil.log("Listening on port "+HTTP_PORT);
    });
});

/**
 * Gulp tasks
 */
gulp.task('build', ['usemin', 'build-assets', 'build-custom']);
gulp.task('dev', ['express', 'watch']);
gulp.task('default', ['build', 'dev']);
