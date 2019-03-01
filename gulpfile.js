/* eslint-env node */
/* eslint no-console: 0 */

var gulp = require('gulp'),
	reqDir = require('require-dir'),
	tasks = reqDir('gulp');

gulp.on('err', function(e) {
	console.log(e.err.stack);
});
