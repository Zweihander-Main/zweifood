// var gulp = require('gulp'),
// ngrok = require('ngrok'),
// psi = require('psi'),
// site = '';
///////////////////////////////////////////////////
// PSI Section -- will re-enable on move to ES6+ //
///////////////////////////////////////////////////

// gulp.task('ngrok-url', async function(done) {
// 	var url = await ngrok.connect(portVal);
// 	console.log(url);
// 	done();
// });

// gulp.task('psi-desktop', function(done) {
// 	psi.output(
// 		site,
// 		{
// 			strategy: 'desktop',
// 			threshold: 1
// 		},
// 		done
// 	);
// });

// gulp.task('psi-mobile', function(done) {
// 	psi.output(
// 		site,
// 		{
// 			strategy: 'mobile',
// 			threshold: 1
// 		},
// 		done
// 	);
// });

// gulp.task(
// 	'psi-seq',
// 	gulp.series('serve:dist', 'ngrok-url', 'psi-desktop', 'psi-mobile')
// );

// gulp.task(
// 	'psi',
// 	gulp.series('psi-seq', function() {
// 		console.log('Check out your page speed scores!');
// 		process.exit();
// 	})
// );

// gulp.task(
// 	'psi:no-kill',
// 	gulp.series('psi-seq', function() {
// 		console.log('Check out your page speed scores!');
// 	})
// );
