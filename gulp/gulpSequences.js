/* eslint-env node */
/* eslint no-console: 0 */

var gulp = require('gulp'),
	browserSync = require('browser-sync'),
	reload = browserSync.reload,
	config = require('./gulpConfig');

// Build non-production files
gulp.task('default-app', gulp.series('clean-app', 'styles-app'));

// Build production files, the default task
gulp.task(
	'default',
	gulp.series(
		'clean',
		gulp.parallel('styles-dist', 'scripts', 'images'),
		'html-useref',
		'copy',
		'styles-uncss',
		'html-final',
		'copy-final-dist'
	)
);

// Watch files for changes & reload
gulp.task(
	'serve',
	gulp.series('default-app', function(done) {
		browserSync(
			{
				injectChanges: true,
				notify: false,
				logPrefix: config.constants.logPrefix,
				https: true,
				server: ['.tmp', 'app']
			},
			function() {
				gulp.watch(config.paths.app.htmlAll).on(
					'all',
					gulp.series(reload)
				);
				gulp.watch(config.paths.app.cssAll).on(
					'all',
					gulp.series('styles-app', 'stylelint')
				);
				gulp.watch(config.paths.app.jsAll).on(
					'all',
					gulp.series('eslint', reload)
				);
				gulp.watch(config.paths.app.imgAll).on(
					'all',
					gulp.series(reload)
				);
				done();
			}
		);
	})
);

// Just serve the output from the dist build
gulp.task(
	'serve:dist:skip',
	gulp.series(function(done) {
		browserSync(
			{
				notify: false,
				logPrefix: config.constants.logPrefix,
				https: false, //ngrok
				server: 'dist',
				baseDir: 'dist',
				port: config.constants.portVal
			},
			function() {
				done();
			}
		);
	})
);

// Build and serve the output from the dist build
gulp.task('serve:dist', gulp.series('default', 'serve:dist:skip'));
