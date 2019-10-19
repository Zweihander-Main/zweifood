/* global oauthSignature */

import image_marker1 from '../img/marker-1.png';
import image_marker2 from '../img/marker-2.png';
import image_marker3 from '../img/marker-3.png';
import image_marker4 from '../img/marker-4.png';
import image_markerEmpty from '../img/marker-empty.png';
import image_markerHeart from '../img/marker-heart.png';
import image_markerDefault from '../img/marker-default.png';

/**
 * Config object which defines a lot of developer settings, map styles, and API
 * information. API information was chose to be listed here to make it easy to
 * add new ones. Object uses defineProperties for granular control, particularly
 * where API settings for actually calling the APIs is listed.
 * @type {Object}
 */

var appConfigObject = {};

Object.defineProperties(appConfigObject, {
	lowMarkerOpacity: {
		get: function() {
			return 0.35;
		},
		enumberable: true,
	},
	highMarkerOpacity: {
		value: 1.0,
		enumberable: true,
	},
	maxMarkerLimit: {
		get: function() {
			return 4000;
		},
		enumberable: true,
	},
	defaultLat: {
		get: function() {
			return 41.699;
		},
		enumberable: true,
	},
	defaultLng: {
		get: function() {
			return -73.925;
		},
		enumberable: true,
	},
	defaultZoom: {
		value: 15,
		enumberable: true,
	},
	defaultMobileZoom: {
		value: 12,
		enumberable: true,
	},
	markerLimitRemoveBulkAmount: {
		value: 1000,
		enumberable: true,
	},
	//Define non-google APIs
	configuredSearchTypes: {
		value: ['yelp', 'locu', 'foursquare'],
		enumberable: true,
	},
	latLngAccuracy: {
		value: 0.001,
		enumberable: true,
	},
	minFuzzyMatch: {
		value: 0.5,
		enumberable: true,
	},
	/**
	 * Define server to model mappings - oType is observable type
	 * oType 0 means no observable
	 * oType 1 means regular observable
	 * oType 2 means observableArray
	 * @type {Object}
	 */
	APIMappingsForModel: {
		value: {
			google: [
				{
					server: 'place_id',
					model: 'google_placeId',
					oType: 0,
				},
				{
					server: 'name',
					model: 'google_name',
					oType: 1,
				},
				{
					server: 'geometry',
					model: 'google_geometry',
					oType: 1,
				},
				{
					server: 'rating',
					model: 'google_rating',
					oType: 1,
				},
				{
					server: 'vicinity',
					model: 'google_vicinity',
					oType: 1,
				},
				{
					server: 'price_level',
					model: 'google_priceLevel',
					oType: 1,
				},
				{
					server: 'adr_address',
					model: 'google_adrAddress',
					oType: 1,
				},
				{
					server: 'formatted_phone_number',
					model: 'google_formattedPhone',
					oType: 1,
				},
				{
					server: 'html_attributions',
					model: 'google_singleLocAttributionsArray',
					oType: 2,
				},
				{
					server: 'opening_hours',
					model: 'google_openingHoursObject',
					oType: 1,
				},
				{
					server: 'photos',
					model: 'google_photos',
					oType: 1,
				},
				{
					server: 'reviews',
					model: 'google_reviews',
					oType: 2,
				},
				{
					server: 'user_ratings_total',
					model: 'google_totalRatings',
					oType: 1,
				},
				{
					server: 'utc_offset',
					model: 'google_UTCOffset',
					oType: 1,
				},
				{
					server: 'url',
					model: 'google_URL',
					oType: 1,
				},
				{
					server: 'website',
					model: 'google_website',
					oType: 1,
				},
			],
			yelp: [
				{
					server: 'id',
					model: 'yelp_id',
					oType: 1,
				},
				{
					server: 'is_closed',
					model: 'yelp_isPermaClosed',
					oType: 1,
				},
				{
					server: 'name',
					model: 'yelp_name',
					oType: 1,
				},
				{
					server: 'image_url',
					model: 'yelp_imageURL',
					oType: 1,
				},
				{
					server: 'url',
					model: 'yelp_URL',
					oType: 1,
				},
				{
					server: 'display_phone',
					model: 'yelp_displayPhone',
					oType: 1,
				},
				{
					server: 'review_count',
					model: 'yelp_reviewCount',
					oType: 1,
				},
				{
					server: 'rating',
					model: 'yelp_rating',
					oType: 1,
				},
				{
					server: 'snippet_text',
					model: 'yelp_snippetText',
					oType: 1,
				},
				{
					server: 'reservation_url',
					model: 'yelp_reservationURL',
					oType: 1,
				},
				{
					server: 'categories',
					model: 'yelp_categories',
					oType: 2,
				},
				{
					server: 'reviews',
					model: 'yelp_reviews',
					oType: 2,
				},
				{
					server: 'location',
					model: 'yelp_location',
					oType: 1,
				},
				{
					server: 'rating_img_url',
					model: 'yelp_ratingImgURL',
					oType: 1,
				},
			],
			locu: [
				{
					server: 'id',
					model: 'locu_id',
					oType: 1,
				},
				{
					server: 'name',
					model: 'locu_name',
					oType: 1,
				},
				{
					server: 'website_url',
					model: 'locu_websiteURL',
					oType: 1,
				},
				{
					server: 'has_menu',
					model: 'locu_hasMenu',
					oType: 1,
				},
				{
					server: 'phone',
					model: 'locu_phone',
					oType: 1,
				},
				{
					server: 'resource_uri',
					model: 'locu_resourceURI',
					oType: 1,
				},
				{
					server: 'street_address',
					model: 'locu_streetAddress',
					oType: 1,
				},
				{
					server: 'locality',
					model: 'locu_locality',
					oType: 1,
				},
				{
					server: 'region',
					model: 'locu_region',
					oType: 1,
				},
				{
					server: 'postal_code',
					model: 'locu_postalCode',
					oType: 1,
				},
				{
					server: 'country',
					model: 'locu_country',
					oType: 1,
				},
				{
					server: 'lat',
					model: 'locu_lat',
					oType: 1,
				},
				{
					server: 'long',
					model: 'locu_long',
					oType: 1,
				},
				{
					server: 'cuisines',
					model: 'locu_cuisines',
					oType: 1,
				},
				{
					server: 'facebook_url',
					model: 'locu_facebookURL',
					oType: 1,
				},
				{
					server: 'twitter_id',
					model: 'locu_twitterID',
					oType: 1,
				},
				{
					server: 'similar_venues',
					model: 'locu_similarVenues',
					oType: 1,
				},
				{
					server: 'menus',
					model: 'locu_menus',
					oType: 2,
				},
			],
			foursquare: [
				{
					server: 'id',
					model: 'foursquare_id',
					oType: 1,
				},
				{
					server: 'name',
					model: 'foursquare_name',
					oType: 1,
				},
				{
					server: 'contact',
					model: 'foursquare_contact',
					oType: 1,
				},
				{
					server: 'location',
					model: 'foursquare_location',
					oType: 1,
				},
				{
					server: 'verified',
					model: 'foursquare_verified',
					oType: 1,
				},
				{
					server: 'stats',
					model: 'foursquare_stats',
					oType: 1,
				},
				{
					server: 'url',
					model: 'foursquare_url',
					oType: 1,
				},
				{
					server: 'price',
					model: 'foursquare_price',
					oType: 1,
				},
				{
					server: 'rating',
					model: 'foursquare_rating',
					oType: 1,
				},
				{
					server: 'hereNow',
					model: 'foursquare_hereNow',
					oType: 1,
				},
				{
					server: 'storeId',
					model: 'foursquare_storeId',
					oType: 1,
				},
				{
					server: 'description',
					model: 'foursquare_description',
					oType: 1,
				},
				{
					server: 'createdAt',
					model: 'foursquare_createdAt',
					oType: 1,
				},
				{
					server: 'tips',
					model: 'foursquare_tips',
					oType: 1,
				},
				{
					server: 'tags',
					model: 'foursquare_tags',
					oType: 2,
				},
				{
					server: 'shortUrl',
					model: 'foursquare_shortUrl',
					oType: 1,
				},
				{
					server: 'canonicalUrl',
					model: 'foursquare_canonicalUrl',
					oType: 1,
				},
				{
					server: 'photos',
					model: 'foursquare_photos',
					oType: 1,
				},
				{
					server: 'likes',
					model: 'foursquare_likes',
					oType: 1,
				},
				{
					server: 'phrases',
					model: 'foursquare_phrases',
					oType: 1,
				},
			],
		},
		enumberable: true,
	},
	mapStyle: {
		value: [
			{
				featureType: 'all',
				elementType: 'labels.text.fill',
				stylers: [
					{
						saturation: 36,
					},
					{
						color: '#000000',
					},
					{
						lightness: 40,
					},
				],
			},
			{
				featureType: 'all',
				elementType: 'labels.text.stroke',
				stylers: [
					{
						visibility: 'on',
					},
					{
						color: '#000000',
					},
					{
						lightness: 16,
					},
				],
			},
			{
				featureType: 'poi',
				elementType: 'labels.icon',
				stylers: [
					{
						saturation: '-89',
					},
					{
						lightness: '-55',
					},
				],
			},
			{
				featureType: 'all',
				elementType: 'labels.icon',
				stylers: [
					{
						visibility: 'off',
					},
				],
			},
			{
				featureType: 'administrative',
				elementType: 'geometry.fill',
				stylers: [
					{
						color: '#000000',
					},
					{
						lightness: 3,
					},
				],
			},
			{
				featureType: 'administrative',
				elementType: 'geometry.stroke',
				stylers: [
					{
						color: '#000000',
					},
					{
						lightness: 0,
					},
					{
						weight: 1.2,
					},
				],
			},
			{
				featureType: 'landscape',
				elementType: 'all',
				stylers: [
					{
						visibility: 'on',
					},
				],
			},
			{
				featureType: 'landscape',
				elementType: 'geometry',
				stylers: [
					{
						color: '#000000',
					},
					{
						lightness: 3,
					},
				],
			},
			{
				featureType: 'poi',
				elementType: 'geometry',
				stylers: [
					{
						color: '#000000',
					},
					{
						lightness: 4,
					},
				],
			},
			{
				featureType: 'road',
				elementType: 'labels.icon',
				stylers: [
					{
						visibility: 'off',
					},
				],
			},
			{
				featureType: 'road.highway',
				elementType: 'geometry.fill',
				stylers: [
					{
						color: '#000000',
					},
					{
						lightness: 17,
					},
				],
			},
			{
				featureType: 'road.highway',
				elementType: 'geometry.stroke',
				stylers: [
					{
						color: '#000000',
					},
					{
						lightness: 29,
					},
					{
						weight: 0.2,
					},
				],
			},
			{
				featureType: 'road.arterial',
				elementType: 'geometry',
				stylers: [
					{
						color: '#000000',
					},
					{
						lightness: 18,
					},
				],
			},
			{
				featureType: 'road.local',
				elementType: 'geometry',
				stylers: [
					{
						color: '#000000',
					},
					{
						lightness: 16,
					},
				],
			},
			{
				featureType: 'transit',
				elementType: 'geometry',
				stylers: [
					{
						color: '#000000',
					},
					{
						lightness: 19,
					},
				],
			},
			{
				featureType: 'transit.station',
				elementType: 'labels.icon',
				stylers: [
					{
						visibility: 'on',
					},
					{
						saturation: '-100',
					},
					{
						lightness: '-51',
					},
				],
			},
			{
				featureType: 'water',
				elementType: 'geometry',
				stylers: [
					{
						color: '#000000',
					},
					{
						lightness: 17,
					},
				],
			},
		],
		enumberable: true,
	},
	markerImageURLDefault: {
		value: image_markerDefault,
		enumberable: true,
	},
	markerImageURLEmpty: {
		value: image_markerEmpty,
		enumberable: true,
	},
	markerImageURL1: {
		value: image_marker1,
		enumberable: true,
	},
	markerImageURL2: {
		value: image_marker2,
		enumberable: true,
	},
	markerImageURL3: {
		value: image_marker3,
		enumberable: true,
	},
	markerImageURL4: {
		value: image_marker4,
		enumberable: true,
	},
	markerImageURLFav: {
		value: image_markerHeart,
		enumberable: true,
	},
	markerImageSize: {
		value: [40, 75],
		enumberable: true,
	},
	markerImageOrigin: {
		value: [0, 0],
		enumberable: true,
	},
	markerImageAnchor: {
		value: [20, 65],
		enumberable: true,
	},
	defaultMarkerShape: {
		value: {
			coords: [
				20,
				0,
				19,
				0,
				0,
				19,
				0,
				20,
				19,
				39,
				19,
				62,
				17,
				63,
				17,
				66,
				18,
				67,
				21,
				67,
				22,
				66,
				22,
				63,
				20,
				62,
				20,
				39,
				39,
				20,
				39,
				19,
			],
			type: 'poly',
		},
		enumberable: true,
	},
	callAPITimeout: {
		value: 60000,
		enumberable: true,
	},
	defaultPriceButtonFilter: {
		get: function() {
			return [true, true, true, true, true];
		},
		enumberable: true,
	},
	defaultMinRatingButtonFilter: {
		get: function() {
			return 0;
		},
		enumberable: true,
	},
	defaultOpenButtonFilter: {
		get: function() {
			return false;
		},
		enumberable: true,
	},
	defaultFavoriteButtonFilter: {
		get: function() {
			return false;
		},
		enumberable: true,
	},
	// Should be on a server in an ideal world
	searchAPIInfo: {
		value: {
			yelp: {
				consumerKey: '***REMOVED***',
				consumerSecret: '***REMOVED***',
				token: '***REMOVED***',
				tokenSecret: '***REMOVED***',
				baseURL: 'https://api.yelp.com/v2/',
			},
			locu: {
				baseURL: 'https://api.locu.com/v1_0/venue/',
				APIKey: '***REMOVED***',
			},
			foursquare: {
				clientID: '***REMOVED***',
				clientSecret:
					'***REMOVED***',
				baseURL: 'https://api.foursquare.com/v2/venues/',
			},
		},
		enumberable: true,
	},
	// Information for return object can be found in callAPIInfo function
	yelp_searchAPIProperties: {
		get: function() {
			var self = this;
			/**
			 * Generates a random number and returns it as a string for OAuthentication
			 * @return {string}
			 */
			function nonce_generate() {
				return Math.floor(Math.random() * 1e12).toString();
			}

			var returnObject = {};
			var parameters = {
				oauth_consumer_key: self.searchAPIInfo.yelp.consumerKey,
				oauth_token: self.searchAPIInfo.yelp.token,
				oauth_nonce: nonce_generate(),
				oauth_timestamp: Math.floor(Date.now() / 1000),
				oauth_signature_method: 'HMAC-SHA1',
				oauth_version: '1.0',
				/**
				 * This is crucial to include for jsonp implementation in AJAX or
				 * else the oauth-signature will be wrong.
				 */
				callback: 'cb',
				actionlinks: true,
			};

			var settings = {
				method: 'GET',
				timeout: self.callAPITimeout,
				data: parameters,
				/**
				 * This is crucial to include as well to prevent jQuery from
				 * adding on a cache-buster parameter '_=23489489749837',
				 * invalidating our oauth-signature
				 */
				cache: true,
				dataType: 'jsonp',
			};

			var basicExtraParameters = {
				bounds: function(lat, lng) {
					return (
						lat -
						self.latLngAccuracy +
						',' +
						(lng - self.latLngAccuracy) +
						'|' +
						(lat + self.latLngAccuracy) +
						',' +
						(lng + self.latLngAccuracy)
					);
				},
				term: 'food',
				sort: 1, //sort by distance
			};

			var allExtraParameters = {
				oauth_signature: function(url, fullParameters) {
					return oauthSignature.generate(
						'GET',
						url,
						fullParameters,
						self.searchAPIInfo.yelp.consumerSecret,
						self.searchAPIInfo.yelp.tokenSecret
					);
				},
			};

			var workerHandler = {
				lat: ['location', 'coordinate', 'latitude'],
				lng: ['location', 'coordinate', 'longitude'],
			};

			returnObject.settings = settings;
			returnObject.basicExtraParameters = basicExtraParameters;
			returnObject.allExtraParameters = allExtraParameters;
			returnObject.basic_URL =
				self.searchAPIInfo.yelp.baseURL + 'search/';
			returnObject.detailed_URL =
				self.searchAPIInfo.yelp.baseURL + 'business/';
			returnObject.basic_returnType = 'businesses';
			returnObject.workerHandler = workerHandler;

			return returnObject;
		},
		enumberable: true,
	},
	locu_searchAPIProperties: {
		get: function() {
			var self = this;
			var returnObject = {};
			var parameters = {
				api_key: self.searchAPIInfo.locu.APIKey,
			};

			var settings = {
				timeout: self.callAPITimeout,
				method: 'GET',
				data: parameters,
				cache: true,
				dataType: 'jsonp',
			};

			var basicExtraParameters = {
				bounds: function(lat, lng) {
					return (
						lat +
						self.latLngAccuracy +
						',' +
						(lng - self.latLngAccuracy) +
						'|' +
						(lat - self.latLngAccuracy) +
						',' +
						(lng + self.latLngAccuracy)
					);
				},
			};

			var workerHandler = {
				lng: ['long'],
			};

			returnObject.settings = settings;
			returnObject.basicExtraParameters = basicExtraParameters;
			returnObject.basic_URL =
				self.searchAPIInfo.locu.baseURL + 'search/';
			returnObject.detailed_URL = self.searchAPIInfo.locu.baseURL;
			returnObject.extraSlash = true;
			returnObject.basic_returnType = 'objects';
			returnObject.detailed_returnType = ['objects', 0];
			returnObject.workerHandler = workerHandler;

			return returnObject;
		},
		enumberable: true,
	},
	foursquare_searchAPIProperties: {
		get: function() {
			var self = this;
			var returnObject = {};
			var parameters = {
				client_id: self.searchAPIInfo.foursquare.clientID,
				client_secret: self.searchAPIInfo.foursquare.clientSecret,
				v: '20150711',
			};

			var settings = {
				timeout: self.callAPITimeout,
				method: 'GET',
				data: parameters,
				cache: true,
				dataType: 'jsonp',
			};

			var basicExtraParameters = {
				radius: function(lat, lng) {
					return self.distanceBetweenTwoPointsInMeters(
						lat,
						lng,
						lat + self.latLngAccuracy,
						lng + self.latLngAccuracy
					);
				},
				ll: function(lat, lng) {
					return lat + ',' + lng;
				},
				limit: 50,
				categoryId: '4d4b7105d754a06374d81259', //food
				intent: 'checkin',
			};

			var workerHandler = {
				lat: ['location', 'lat'],
				lng: ['location', 'lng'],
			};

			returnObject.settings = settings;
			returnObject.basicExtraParameters = basicExtraParameters;
			returnObject.basic_URL =
				self.searchAPIInfo.foursquare.baseURL + 'search';
			returnObject.detailed_URL = self.searchAPIInfo.foursquare.baseURL;
			returnObject.basic_returnType = ['response', 'venues'];
			returnObject.detailed_returnType = ['response', 'venue'];
			returnObject.workerHandler = workerHandler;

			return returnObject;
		},
		enumberable: true,
	},
	// neccessary for sending to worker
	distanceBetweenTwoPointsInMeters: {
		value: function(lat1, lon1, lat2, lon2) {
			var p = 0.017453292519943295; // Math.PI / 180
			var c = Math.cos;
			var a =
				0.5 -
				c((lat2 - lat1) * p) / 2 +
				(c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))) / 2;
			// 2 * R; R = 6371 km * 1000 for meters
			return 12742000 * Math.asin(Math.sqrt(a));
		},
		enumberable: true,
	},
});

export default appConfigObject;
