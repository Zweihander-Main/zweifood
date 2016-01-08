var gulp = require('gulp'),
    ngrok = require('ngrok'),
    psi = require('psi'),
    sequence = require('run-sequence'),
    browserSync = require('browser-sync'),
    fs = require('fs'),
    path = require('path'),
    del = require('del'),
    gulpLoadPlugins = require('gulp-load-plugins'),
    pkg = require('./package.json'),
    portVal = 3020,
    site = '',
    $ = gulpLoadPlugins(),
    inlinesource = require('gulp-inline-source'),
    reload = browserSync.reload;


gulp.on('err', function(e) {
  console.log(e.err.stack);
});

gulp.task('ngrok-url', function(cb) {
  return ngrok.connect(portVal, function (err, url) {
    site = url;
    if (err) {
      console.log(err);
      console.log(site);
      process.exit();
    }
    console.log('serving your tunnel from: ' + site);
    cb();
  });
});

gulp.task('psi-desktop', function (cb) {
  psi.output(site, {
    strategy: 'desktop',
    threshold: 1
  }, cb);
});

gulp.task('psi-mobile', function (cb) {
  psi.output(site, {
    strategy: 'mobile',
    threshold: 1
  }, cb);
});

gulp.task('psi-seq', function (cb) {
  return sequence(
    'serve:dist',
    'ngrok-url',
    'psi-desktop',
    'psi-mobile',
    cb
    );
});

gulp.task('psi', ['psi-seq'], function() {
  console.log('Check out your page speed scores!');
  process.exit();
});

gulp.task('psi:no-kill', ['psi-seq'], function() {
  console.log('Check out your page speed scores!');
});

// Lint JavaScript
gulp.task('jshint', function() {
  gulp.src(['app/js/**/*.js'])
    .pipe(reload({stream: true, once: true}))
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
});

// Optimize images
gulp.task('images', function() {
  gulp.src(['app/**/*.{gif,jpg,png}'])
    .pipe($.imagemin({
      progressive: true,
      interlaced: true,
    }))
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'images'}));
});

// Copy all files at the root level (app)
gulp.task('copy', function() {
  gulp.src([
    'app/*',
    //copy all fonts
    'app/**/*.{otf,eot,svg,ttf,woff,woff2}',
    '!app/*.html',
  ], {
    dot: true
  }).pipe(gulp.dest('dist'))
    .pipe($.size({title: 'copy'}));
});

// Compile and automatically prefix stylesheets
gulp.task('styles', function() {
  var AUTOPREFIXER_BROWSERS = [
    'ie >= 10',
    'ie_mob >= 10',
    'ff >= 30',
    'chrome >= 34',
    'safari >= 7',
    'opera >= 23',
    'ios >= 7',
    'android >= 4.4',
    'bb >= 10'
  ];

  return gulp.src([
    'app/**/*.css',
  ])
    .pipe($.changed('.tmp/styles', {extension: '.css'}))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(gulp.dest('.tmp/styles'))
    // Concatenate and minify styles
    .pipe($.if('*.css', $.minifyCss()))
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'css'}));
});

// Concatenate and minify JavaScript
gulp.task('scripts', function() {
  gulp.src([
    'app/**/*.js',
  ])
    .pipe($.uglify({preserveComments: false}))
    // Output files
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'js'}));
});

// Scan your HTML for assets & optimize them
gulp.task('html', function() {
  var assets = $.useref.assets({searchPath: '{.tmp,app}'});

  return gulp.src(['app/**/*.html'])

    .pipe(assets)
    // Concatenate and minify styles
    // In case you are still using useref build blocks
    .pipe($.if('*.css', $.minifyCss()))
    .pipe($.if('*.js',$.uglify({preserveComments: false})))
    .pipe(assets.restore())
    .pipe($.useref())

    //Inline files
    .pipe(inlinesource())

    // Minify any HTML
    .pipe($.if('*.html', $.minifyHtml()))
    // Output files
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'html'}));
});

// Clean output directory
gulp.task('clean', function (cb) { del(['.tmp', 'dist/*', '!dist/.git'], {dot: true}, cb);});

// Watch files for changes & reload
gulp.task('serve', ['styles'], function() {
  browserSync({
    notify: false,
    logPrefix: 'WSK',
    https: true,
    server: ['.tmp', 'app']
  });

  gulp.watch(['app/**/*.html'], reload);
  gulp.watch(['app/**/*.css'], ['styles', reload]);
  gulp.watch(['app/**/*.js'], ['jshint', reload]);
  gulp.watch(['app/**/*.png', 'app/**/*.gif', 'app/**/*.jpg'], reload);
});

// Build and serve the output from the dist build
gulp.task('serve:dist', ['default'], function (cb) {
  browserSync({
    notify: false,
    logPrefix: 'WSK',
    https: false,//ngrok
    server: 'dist',
    baseDir: 'dist',
    port: portVal
  }, function() {cb();});
});

// Build production files, the default task
gulp.task('default', ['clean'], function (cb) {
  sequence(
    'styles',
    ['jshint', 'html', 'scripts', 'images', 'copy'],
    cb
  );
});