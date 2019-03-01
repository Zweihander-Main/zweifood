/* eslint-env node */
/* eslint no-console: 0 */

var gulp = require('gulp'),
	config = require('./gulpConfig'),
	error = require('./gulpErrorLogging'),
	gulpLoadPlugins = require('gulp-load-plugins'),
	$ = gulpLoadPlugins(),
	browserSync = require('browser-sync'),
	del = require('del'),
	autoprefixer = require('autoprefixer'),
	cssnano = require('cssnano'),
	uncss = require('uncss'),
	stylelint = require('stylelint'),
	postcssReporter = require('postcss-reporter'),
	imageminJpegRecompress = require('imagemin-jpeg-recompress');

// Lint JavaScript
gulp.task('eslint', function() {
	return gulp
		.src(config.paths.app.jsUser)
		.pipe($.eslint())
		.pipe($.eslint.format())
		.pipe($.if(!browserSync.active, $.eslint.failAfterError()))
		.on('error', error.logPluginError('eslint'));
});

// Lint CSS
gulp.task('stylelint', function() {
	return gulp
		.src(config.paths.app.cssUser)
		.pipe(
			$.postcss([
				stylelint({}),
				postcssReporter({ clearReportedMessages: true })
			])
		)
		.on('error', error.logPluginError('stylelint'));
});

// Optimize images
gulp.task('images', function() {
	return gulp
		.src(config.paths.app.imgAll)
		.pipe(
			$.imagemin([
				$.imagemin.gifsicle({ interlaced: true }),
				imageminJpegRecompress({
					progressive: true,
					max: 80,
					min: 70
				}),
				$.imagemin.optipng({ optimizationLevel: 3 }),
				$.imagemin.svgo({ plugins: [{ removeViewBox: false }] })
			])
		)
		.pipe(gulp.dest('.tmp'))
		.pipe($.size({ title: 'images' }))
		.on('error', error.logPluginError('images'));
});

// Copy all files at the root level (app) plus all fonts excluding html and template files except the ones which have already been processed
gulp.task('copy', function() {
	return gulp
		.src(config.paths.app.etcCopy, {
			dot: true
		})
		.pipe(gulp.dest('.tmp'))
		.pipe($.size({ title: 'copy' }))
		.on('error', error.logPluginError('copy'));
});

// Copy all files in .tmp to dist, cache bust if neccessary
gulp.task('copy-final-dist', function() {
	return gulp
		.src(config.paths.tmp.etcCopy, {
			dot: true
		})
		.pipe(
			$.if(
				config.constants.shouldCacheBust,
				$.if(
					/.*\.(html|htm|php)/,
					$.cacheBust(config.plugin.cacheBustOptions)
				)
			)
		)
		.pipe(gulp.dest('dist'))
		.pipe($.size({ title: 'copy-final-dist' }))
		.on('error', error.logPluginError('copy-final-dist'));
});

// Compile and automatically prefix stylesheets
gulp.task('styles-app', function() {
	return gulp
		.src(config.paths.app.cssAll)
		.pipe($.changed('.tmp', { extension: '.css' }))
		.pipe($.postcss([autoprefixer(config.plugin.AUTOPREFIXER_BROWSERS)]))
		.pipe(gulp.dest('.tmp'))
		.pipe($.if(browserSync.active, $.if('*.css', browserSync.stream())))
		.pipe($.size({ title: 'css-app' }))
		.on('error', error.logPluginError('styles-app'));
});

gulp.task('styles-dist', function() {
	return gulp
		.src(config.paths.app.cssAll)
		.pipe(
			$.postcss([
				autoprefixer(config.plugin.AUTOPREFIXER_BROWSERS),
				cssnano(config.plugin.cssNanoOptions)
			])
		)
		.pipe($.if('*.css', gulp.dest('.tmp')))
		.pipe($.size({ title: 'css-dist' }))
		.on('error', error.logPluginError('styles-dist'));
});

gulp.task('styles-uncss', function() {
	return gulp
		.src(config.paths.tmp.cssCom)
		.pipe(
			$.postcss([
				uncss.postcssPlugin(config.plugin.uncssOptions),
				autoprefixer(config.plugin.AUTOPREFIXER_BROWSERS),
				cssnano(config.plugin.cssNanoOptions)
			])
		)
		.pipe(gulp.dest('.tmp'))
		.pipe($.size({ title: 'css-uncss' }))
		.on('error', error.logPluginError('styles-uncss'));
});

// Concatenate and minify JavaScript
gulp.task('scripts', function() {
	return (
		gulp
			.src(config.paths.app.jsAll)
			.pipe($.uglify())
			// Output files
			.pipe(gulp.dest('.tmp'))
			.pipe($.size({ title: 'js' }))
			.on('error', error.logPluginError('scripts'))
	);
});

// Scan your HTML and useref it
gulp.task('html-useref', function() {
	return (
		gulp
			.src(config.paths.app.htmlAll)
			.pipe($.useref(config.plugin.userefOptions))
			.pipe($.if('*.js', $.uglify()))
			.pipe(
				$.if(
					'*.css',
					$.postcss([
						autoprefixer(config.plugin.AUTOPREFIXER_BROWSERS),
						cssnano(config.plugin.cssNanoOptions)
					])
				)
			)
			// Output files
			.pipe(gulp.dest('.tmp'))
			.pipe($.size({ title: 'html-useref' }))
			.on('error', error.logPluginError('html-useref'))
	);
});

// Minimize html and inline
gulp.task('html-final', function() {
	return (
		gulp
			.src(config.paths.tmp.htmlAll)
			//Inline files
			.pipe($.inlineSource(config.plugin.inlineOptions))
			// Minify any HTML
			.pipe($.if('*.html', $.htmlmin(config.plugin.htmlMinOptions)))
			// Output files
			.pipe(gulp.dest('.tmp'))
			.pipe($.size({ title: 'html-final' }))
			.on('error', error.logPluginError('html-final'))
	);
});

// Clean just tmp directory
gulp.task('clean-app', function(done) {
	del(config.paths.tmp.clean, { dot: true }).then(function() {
		done();
	});
});

// Clean output directory and tmp directory
gulp.task('clean', function(done) {
	del(config.paths.dist.clean, { dot: true }).then(function() {
		done();
	});
});
