/**
 * TODO:
 * Confirm loads after set time
 * Confirm infoWindow can be clicked and custom version loads
 */

describe('ZweiFood', () => {
	beforeAll(async () => {
		await page.goto('http://localhost:1555');
	});

	it('should be titled "ZweiFood"', async () => {
		await expect(page.title()).resolves.toMatch('ZweiFood');
	});
});
