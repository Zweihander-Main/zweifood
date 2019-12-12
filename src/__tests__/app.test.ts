/**
@jest-environment jsdom
*/

import app from '../js/app';

describe('App', () => {
	describe('has three exposed methods: ', () => {
		it('googleLoaded', (done) => {
			expect(
				Object.prototype.hasOwnProperty.call(app, 'googleLoaded')
			).toEqual(true);
			done();
		});
		it('googleFailedToLoad', (done) => {
			expect(
				Object.prototype.hasOwnProperty.call(app, 'googleFailedToLoad')
			).toEqual(true);
			done();
		});
		it('preloadFontsAndImages', (done) => {
			expect(
				Object.prototype.hasOwnProperty.call(
					app,
					'preloadFontsAndImages'
				)
			).toEqual(true);
			done();
		});
	});
});
