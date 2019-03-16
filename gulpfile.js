/* eslint-env node */
/* eslint no-console: 0 */

var gulp = require('gulp');
var GulpGuruRegistry = require('gulp-guru');

gulp.registry(
	new GulpGuruRegistry({
		config: {
			paths: {
				app: {
					etcCopy: ['app/*.*']
				}
			}
		}
	})
);
