/* eslint-env node */
/* eslint no-console: 0 */
var _ = require('lodash'),
	glob = require('glob'),
	env = 'development';

var paths = {
	app: {
		jsAll: ['app/js/**/*.js', 'app/vendor/**/*.js'],
		jsUser: ['app/js/**/*.js'],
		cssAll: ['app/css/**/*.css', 'app/vendor/**/*.css'],
		cssUser: ['app/css/**/*.css'],
		imgAll: ['app/**/*.{gif,jpg,png,ico,svg}'],
		htmlAll: ['app/*.html'],
		etcCopy: [
			'app/*',
			//copy all fonts
			'app/**/*.{otf,eot,svg,ttf,woff,woff2}',
			'app/**/*.json',
			'!app/*.html',
			'!app/templates',
			'!app/**/*.css',
			'!app/**/*.js'
		]
	},
	tmp: {
		cssCom: ['.tmp/**/combined.css'],
		htmlAll: ['.tmp/**/*.html'],
		etcCopy: ['.tmp/**/*.*', '!.tmp/**/*.css', '.tmp/**/combined.css'],
		clean: ['.tmp/*']
	},
	dist: {
		clean: ['.tmp/*', 'dist/*', '!dist/.git']
	}
};

var constants = {
	default: {
		portVal: 3020,
		logPrefix: 'ZF',
		shouldCacheBust: false
	},
	development: {},
	staging: {},
	production: {}
};

var plugin = {
	default: {
		htmlMinOptions: {
			collapseWhitespace: true,
			ignoreCustomFragments: [/<%[\s\S]*?%>/, /<\?[=|php]?[\s\S]*?\?>/],
			removeComments: false,
			minifyJS: true,
			minifyCSS: true
		},

		cssNanoOptions: {
			preset: [
				'default',
				{
					discardComments: {
						removeAll: true
					}
				}
			]
		},

		uncssOptions: {
			html: glob.sync('.tmp/**/*.html'),
			ignore: [/.*fonts-stage-.*/, /.*svg.*/],
			timeout: 10000
		},

		AUTOPREFIXER_BROWSERS: [
			'ie >= 10',
			'ie_mob >= 10',
			'ff >= 30',
			'chrome >= 34',
			'safari >= 7',
			'opera >= 23',
			'ios >= 7',
			'android >= 4.4',
			'bb >= 10'
		],

		inlineOptions: {
			rootpath: '.tmp/'
		},

		userefOptions: {
			searchPath: '[.tmp,app]'
		},

		cacheBustOptions: {}
	},
	development: {},
	staging: {},
	production: {}
};

var pluginOpts = _.merge({}, plugin.default, plugin[env]);
var constantsOpts = _.merge({}, constants.default, constants[env]);

module.exports.paths = paths;
module.exports.constants = constantsOpts;
module.exports.plugin = pluginOpts;
