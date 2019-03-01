/* eslint-env node */
/* eslint no-console: 0 */

var log = require('fancy-log'),
	browserSync = require('browser-sync');

function logPluginError(pluginName) {
	return function(error) {
		// When plugin error occured
		// logging error stack via fancy-log
		log(pluginName, error.stack);
		// and send notify to browser
		browserSync.notify(error.stack, 10000);
		this.emit('end');
	};
}

module.exports.logPluginError = logPluginError;
