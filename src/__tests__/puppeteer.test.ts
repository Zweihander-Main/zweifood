describe('ZweiFood', () => {
	beforeAll(async () => {
		await page.goto('http://localhost:1555');
	});

	it('should be titled "ZweiFood"', async () => {
		await expect(page.title()).resolves.toMatch('ZweiFood');
	});
});
