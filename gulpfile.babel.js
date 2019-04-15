/* eslint-env node */

import gulp from 'gulp';
import GulpGuruRegistry from 'gulp-guru';
const config = require('./gulpGuruConfig.json');

gulp.registry(new GulpGuruRegistry(config));
