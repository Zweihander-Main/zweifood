const request = require('request');
const util = require('util');
const path = require('path');
// TODO document
const isProduction = process.env.NODE_ENV === 'production';
if (!isProduction) {
	console.log('Loading dotenv config...');
	require('dotenv').config({
		path: path.resolve(process.cwd(), '.env.development'),
	});
}

const urlWhitelist = [
	process.env.YELP_URL,
	process.env.LOCU_URL,
	process.env.FOURSQUARE_URL,
];

const API_KEYS = {
	yelp: {
		APIKey: process.env.YELP_API_KEY,
	},
	locu: {
		APIKey: process.env.LOCU_API_KEY,
	},
	foursquare: {
		clientID: process.env.FOURSQUARE_CLIENT_ID,
		clientSecret: process.env.FOURSQUARE_CLIENT_SECRET,
	},
};

const standardHeaders = {
	'Access-Control-Allow-Origin': process.env.CORS,
	'Access-Control-Allow-Methods': 'GET, POST, PUT',
	'Access-Control-Allow-Headers': 'Authorization', // For Yelp
};

exports.handler = function(event, context, callback) {
	try {
		//preflight
		if (event.httpMethod === 'OPTIONS') {
			callback(null, {
				statusCode: 204,
				headers: standardHeaders,
				body: JSON.stringify({}),
			});
		} else {
			// copy headers
			const headers = { ...event.headers };
			delete headers['origin'];
			delete headers['host'];
			const parameters = { ...event.queryStringParameters };
			delete parameters['url'];

			const replaceKeys = (objectToIterate) => {
				const entries = Object.entries(objectToIterate);
				for (let i = 0, len = entries.length; i < len; i++) {
					const [key, value] = entries[i];
					const matches = value.match(/<<<(.*)\|\|\|(.*)>>>/m); //`<<<${service}|||${apiParam}>>>`;
					if (matches !== null) {
						const service = matches[1];
						const apiParam = matches[2];
						objectToIterate[key] = objectToIterate[key].replace(
							/<<<.*\|\|\|.*>>>/gm,
							API_KEYS[service][apiParam]
						);
					}
				}
			};
			replaceKeys(headers);
			replaceKeys(parameters);

			const redirectURL = event.queryStringParameters.url;

			if (
				!urlWhitelist.find((url) => {
					return redirectURL.startsWith(url);
				})
			) {
				throw new Error('URL Not Allowed');
			}
			const options = {
				url: redirectURL,
				method: event.httpMethod,
				headers: headers,
				qs: parameters,
				gzip: true,
			};

			request(options, (error, response, body) => {
				if (error || !response || !response.statusCode) {
					console.log('Error from request: ');
					console.log(error);
					callback(null, {
						statusCode: 500,
						body: JSON.stringify({ msg: error }),
					});
				} else {
					if (
						response.statusCode < 200 ||
						response.statusCode >= 300
					) {
						console.log('Bad response: ');
						console.log(response);
					}
					const returnHeaders = {
						...response.headers,
						'content-encoding': '',
						...standardHeaders,
					};
					callback(null, {
						statusCode: response.statusCode,
						headers: returnHeaders,
						body: response.body,
					});
				}
			});
		}
	} catch (err) {
		console.log('Error caught: ');
		console.log(err); // output to netlify function log
		callback(null, {
			statusCode: 500,
			body: JSON.stringify({ msg: err.message }),
		});
	}
};
