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
	bower_fonts: 'src/components/**/*.{otf,ttf,woff,woff2,eof,svg}'
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
gulp.task('build-assets', ['copy-bower_fonts']);

gulp.task('copy-bower_fonts', function(cb) {
	pump([
			gulp.src(paths.bower_fonts),
			rename({dirname: '/fonts'}),
			gulp.dest('dist/lib')
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

	// devices API
	router.get('/api/device/:id?', function(req, res) {
		var select_sql = 'SELECT d.id, d.Nume, d.TID, d.MID, d.LastSeen, d.SettlementOra, d.SettlementMinut, d.Statie, d.UpdateOra, d.UpdateMinut, d.SN, s.Nume AS NumeStatie FROM devices d, statii s WHERE d.Statie = s.id';
		if(req.params.id) {
			select_sql += ' AND d.id = ?';
			var selects = [req.params.id];
			select_sql = mysql.format(select_sql, selects);
			gutil.log("GET device id="+req.params.id);
		} else {
			gutil.log("GET * devices");
		}
		dbConnection.query(select_sql, function(error, results, fields) {
			if(error) throw error;
			res.send(results);
		});
	});

	router.post('/api/device', function(req, res) {
		var insert_sql = 'INSERT INTO devices (Nume, TID, MID, SettlementOra, SettlementMinut, Statie, UpdateOra, UpdateMinut, SN) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
		var inserts = [req.body.Nume, req.body.TID, req.body.MID, req.body.SettlementOra, req.body.SettlementMinut, req.body.Statie, req.body.UpdateOra, req.body.UpdateMinut, req.body.SN];
		insert_sql = mysql.format(insert_sql, inserts);
		gutil.log("Add device: " + insert_sql);
		dbConnection.query(insert_sql, function(error, results, fields) {
			if(error) throw error;
			res.send(results);
		});
	});

	router.put('/api/device/:id', function(req, res) {
		var update_sql = 'UPDATE devices SET Nume = ?, TID = ?, MID = ?, SettlementOra = ?, SettlementMinut = ?, Statie = ?, UpdateOra = ?, UpdateMinut = ?, SN = ? WHERE id = ?';
		var updates = [req.body.Nume, req.body.TID, req.body.MID, req.body.SettlementOra, req.body.SettlementMinut, req.body.Statie, req.body.UpdateOra, req.body.UpdateMinut, req.body.SN, req.params.id];
		update_sql = mysql.format(update_sql, updates);
		gutil.log("Update device: " + update_sql);
		dbConnection.query(update_sql, function(error, results, fields) {
			if(error) throw error;
			res.send(results);
		});
	});

	router.delete('/api/device/:id', function(req, res) {
		var delete_sql = 'DELETE FROM devices WHERE id = ?';
		var deletes = [req.params.id];
		delete_sql = mysql.format(delete_sql, deletes);
		gutil.log("DELETE device id="+req.params.id);
		dbConnection.query(delete_sql, function(error, results, fields) {
			if(error) throw error;
			res.send(results);
		});
	});
	// end devices API

	// templates API
	router.get('/api/template/:id?', function(req, res) {
		var select_sql = 'SELECT * FROM templates';
		if(req.params.id) {
			select_sql += ' where id = ?';
			var selects = [req.params.id];
			select_sql = mysql.format(select_sql, selects);
			gutil.log("GET device id="+req.params.id);
		} else {
			gutil.log("GET * templates");
		}
		dbConnection.query(select_sql, function(error, results, fields) {
			if(error) throw error;
			res.send(results);
		});
	});

	router.post('/api/template', function(req, res) {
		var insert_sql = 'INSERT INTO templates (Nume, MID, SettlementOra, SettlementMinut, UpdateOra, UpdateMinut) values (?, ?, ?, ?, ?, ?)';
		var inserts = [req.body.Nume, req.body.MID, req.body.SettlementOra, req.body.SettlementMinut, req.body.UpdateOra, req.body.UpdateMinut];
		insert_sql = mysql.format(insert_sql, inserts);
		gutil.log("Add template: " + insert_sql);
		dbConnection.query(insert_sql, function(error, results, fields) {
			if(error) throw error;
			res.send(results);
		});
	});

	router.put('/api/template/:id', function(req, res) {
		var update_sql = 'UPDATE templates SET Nume = ?, MID = ?, SettlementOra = ?, SettlementMinut = ?, UpdateOra = ?, UpdateMinut = ? WHERE id = ?';
		var updates = [req.body.Nume, req.body.MID, req.body.SettlementOra, req.body.SettlementMinut, req.body.UpdateOra, req.body.UpdateMinut, req.params.id];
		update_sql = mysql.format(update_sql, updates);
		gutil.log("Update template: " + update_sql);
		dbConnection.query(update_sql, function(error, results, fields) {
			if(error) throw error;
			res.send(results);
		});
	});

	router.delete('/api/template/:id', function(req, res) {
		var delete_sql = 'DELETE FROM templates WHERE id = ?';
		var deletes = [req.params.id];
		delete_sql = mysql.format(delete_sql, deletes);
		gutil.log("DELETE template id="+req.params.id);
		dbConnection.query(delete_sql, function(error, results, fields) {
			if(error) throw error;
			res.send(results);
		});
	});
	// end templates API

	router.get('/api/statii', function(req, res) {
		gutil.log("GET * statii");
		dbConnection.query('SELECT * FROM statii', function(error, results, fields) {
			if(error) throw error;
			res.send(results);
		});
	});

    // import/export api
    var csvHeaders = ['Nume','TID','MID','SettlementMinut','SettlementOra','UpdateOra','UpdateMinut','Statie','SN'];

    router.get('/api/export', function(req, res) {
        // get the information needed from database
        dbConnection.query('SELECT * FROM devices', function(error, results, fields) {
            if(error) {
                res.status(500).send("Internal error");
                return;
            }

            // convert the data into CVS format
            csv.stringify(results, {header:true, columns: csvHeaders}, function(error, output) {
                if(error) {
                    res.status(500).send("Internal error");
                    return;
                }

                // set http headers regarding the the file type and name
                res.writeHead(200, { "Content-Type": "text/plain", "Content-Disposition": "attachment; filename='devices.csv'" });
                res.end(output,  'utf8');
            });
        });
    });

    router.post('/api/import', function(req, res) {
        csv.parse(req.body.text, {columns: true, delimiter: ','}, function(error, output){
            // check error first
            if (error) {
                res.status(400).send(error.message);
                return;
            }

            // check if there is anything to add
            if (output.length == 0) {
                res.status(400).send("No valid data found");
                return;
            }

            var keys = Object.keys(output[0]);
            var db_values = [];

            // check if the keys are valid
            for (var key = 0; key < keys.length ; key++) {
                if (csvHeaders.indexOf(keys[key]) == -1) {
                    res.status(400).send('Invalid header \'' + keys[key]);
                    return;
                }
            }

            // create list of values to add to the database
            for (var row = 0 ; row < output.length; row++ ) {
                var values = [];
                
                for (var key = 0; key < keys.length ; key++) {
                    values.push(output[row][keys[key]]);
                }

                db_values.push(values);
            }

            // insert the values into database
            dbConnection.query('INSERT INTO devices ('+ keys.join(',') +') VALUES ?', 
                            [db_values], 
                            function(err) {
                if (err) {
                    console.log(err);
                    res.status(400).send("Error"); // do not pass the err, security risk
                    return;
                } else {
                    res.send("OK");
                    return;
                }
            });
            return;
        });
    });
    // end import/export api

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
