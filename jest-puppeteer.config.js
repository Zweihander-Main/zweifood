// jest-puppeteer.config.js
module.exports = {
	server: {
		command: 'npm run dev -- --port 1555',
		debug: true,
		port: 1555,
		launchTimeout: 30000,
		protocol: 'http',
		waitOnScheme: {
			delay: 500,
		},
	},
};
