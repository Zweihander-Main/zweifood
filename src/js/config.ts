/// <reference types="jquery" />

import imageMarker1 from '../img/marker-1.png';
import imageMarker2 from '../img/marker-2.png';
import imageMarker3 from '../img/marker-3.png';
import imageMarker4 from '../img/marker-4.png';
import imageMarkerEmpty from '../img/marker-empty.png';
import imageMarkerHeart from '../img/marker-heart.png';
import imageMarkerDefault from '../img/marker-default.png';
import yelpStars0 from '../img/yelpStars/small_0.png';
import yelpStars1 from '../img/yelpStars/small_1.png';
import yelpStars15 from '../img/yelpStars/small_1_half.png';
import yelpStars2 from '../img/yelpStars/small_2.png';
import yelpStars25 from '../img/yelpStars/small_2_half.png';
import yelpStars3 from '../img/yelpStars/small_3.png';
import yelpStars35 from '../img/yelpStars/small_3_half.png';
import yelpStars4 from '../img/yelpStars/small_4.png';
import yelpStars45 from '../img/yelpStars/small_4_half.png';
import yelpStars5 from '../img/yelpStars/small_5.png';
import imageReticle from '../img/reticle.png';

export interface Point {
	//TODO implement more
	lat: number;
	lng: number;
}
/**
 * Object with the following properties: //TODO
 * settings 			settings for jQuery Ajax call
 * basicOnlyParameters parameters to parse through for call,
 * 						can include functions which will be fed
 * 						lat, lng parameters
 * basicURL            URL for basic searches
 * detailedURL         URL for detailed searches
 * extraSlash           optional, adds extra slash after detailed id
 * basicReturnType     define where the results array for parsing is located
 * 						in the results
 * detailedReturnType  define where the results array for parsing is located
 * 						in the results
 * workerHandler        object to be parsed by the worker for API
 *  					specific instructions
 * @type {object}
 */

export interface ApiConfigObject {
	settings: JQuery.AjaxSettings;
	apiParameters: {
		[key: string]: (apiInfo: {
			[key: string]: string;
		}) => string | ((jqXHR: JQueryXHR) => false | void);
		beforeSend?: (apiInfo: {
			[key: string]: string;
		}) => (jqXHR: JQueryXHR) => false | void;
	};
	basicOnlyParameters: JQuery.PlainObject;
	basicURL: string;
	detailedURL: string;
	extraSlash?: boolean;
	basicReturnType?: string | number | Array<string | number>;
	detailedReturnType?: string | number | Array<string | number>;
	workerHandler: {
		lat: Array<string>;
		lng: Array<string>;
	};
}

/**
 * Config object which defines a lot of developer settings, map styles, and API
 * information. Object uses defineProperties for granular control, particularly
 * where API settings for actually calling the APIs is listed.
 * @type {Object}
 */

export const LOW_MARKER_OPACITY = 0.35;
export const HIGH_MARKER_OPACITY = 1.0;
export const MAX_MARKER_LIMIT = 4000;
export const DEFAULT_LAT = 41.699;
export const DEFAULT_LNG = -73.925;
export const DEFAULT_ZOOM = 15;
export const DEFAULT_MOBILE_ZOOM = 12;
export const MARKER_LIMIT_REMOVAL_BULK_AMOUNT = 1000;
export const LAT_LNG_ACCURACY = 0.001;
export const MIN_FUZZY_MATCH = 0.5;

/**
 * Define server to model mappings - oType is observable type
 * oType 0 means no observable
 * oType 1 means regular observable
 * oType 2 means observableArray
 * @type {Object}
 */
export const API_MAPPINGS_FOR_MODEL = {
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
};

export const MAP_STYLE = [
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
];

export const MARKER_IMAGE_RETICLE = imageReticle;
export const MARKER_IMAGE_URL_DEFAULT = imageMarkerDefault;
export const MARKER_IMAGE_URL_EMPTY = imageMarkerEmpty;
export const MARKER_IMAGE_URL_1 = imageMarker1;
export const MARKER_IMAGE_URL_2 = imageMarker2;
export const MARKER_IMAGE_URL_3 = imageMarker3;
export const MARKER_IMAGE_URL_4 = imageMarker4;
export const MARKER_IMAGE_URL_FAV = imageMarkerHeart;
export const MARKER_IMAGE_SIZE = [40, 75];
export const MARKER_IMAGE_ORIGIN = [0, 0];
export const MARKER_IMAGE_ANCHOR = [20, 65];
export const DEFAULT_MARKER_SHAPE = {
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
} as google.maps.MarkerShape;
export const YELP_STAR_IMAGES = {
	0: yelpStars0,
	1: yelpStars1,
	15: yelpStars15,
	2: yelpStars2,
	25: yelpStars25,
	3: yelpStars3,
	35: yelpStars35,
	4: yelpStars4,
	45: yelpStars45,
	5: yelpStars5,
};

export const DEFAULT_PRICE_BUTTON_FILTER = [true, true, true, true, true];
export const DEFAULT_MIN_RATING_BUTTON_FILTER = 0;
export const DEFAULT_OPEN_BUTTON_FILTER = false;
export const DEFAULT_FAVORITE_BUTTON_FILTER = false;

// necessary for sending to worker
export const DISTANCE_BETWEEN_TWO_POINTS_IN_METERS = (
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number
): number => {
	const p = 0.017453292519943295; // Math.PI / 180
	const a =
		0.5 -
		Math.cos((lat2 - lat1) * p) / 2 +
		(Math.cos(lat1 * p) *
			Math.cos(lat2 * p) *
			(1 - Math.cos((lon2 - lon1) * p))) /
			2;
	// 2 * R; R = 6371 km * 1000 for meters
	return 12742000 * Math.asin(Math.sqrt(a));
};

/**
 * API Specific Code
 */

export const CONFIGURED_SEARCH_TYPES = ['yelp', 'locu', 'foursquare'];
const CALL_API_TIMEOUT = 60000;

/**
 * If set, will override any keys stored in localStorage and force
 * client-side calls
 */
export const API_KEYS = {
	yelp: {
		APIKey: '',
	},
	locu: {
		APIKey: '',
	},
	foursquare: {
		clientID: '',
		clientSecret: '',
	},
};

export const LOCAL_API_FORWARDER_URL =
	process.env.LOCAL_API_FORWARDER || '/.netlify/functions/apifetch?url='; //TODO test without local_API_forwarder

export const REMOTE_API_CORS_FORWARDER_URL =
	'https://cors-anywhere.herokuapp.com/';

export const API_URLS = {
	yelp: process.env.YELP_URL,
	locu: process.env.LOCU_URL,
	foursquare: process.env.FOURSQUARE_URL,
};

// Information for return object can be found in callAPIInfo function
export const YELP_SEARCH_API_PROPERTIES = (): ApiConfigObject => {
	const workerHandler = {
		lat: ['location', 'coordinate', 'latitude'],
		lng: ['location', 'coordinate', 'longitude'],
	};

	const settings = {
		method: 'GET',
		timeout: CALL_API_TIMEOUT,
		data: {},
	};

	const apiParameters = {
		beforeSend: (apiInfo: {
			[key: string]: string;
		}): ((xhr: JQueryXHR) => void) => {
			return (xhr): void => {
				xhr.setRequestHeader(
					'Authorization',
					'Bearer ' + apiInfo.APIKey
				);
			};
		},
	};

	const basicOnlyParameters = {
		latitude: (point: Point): number => {
			return point.lat;
		},
		longitude: (point: Point): number => {
			return point.lng;
		},
		term: 'food',
		sort_by: 'distance', // eslint-disable-line @typescript-eslint/camelcase
	};

	return {
		basicURL: '/search',
		detailedURL: '/',
		basicReturnType: 'businesses',
		workerHandler: workerHandler,
		settings,
		apiParameters,
		basicOnlyParameters,
	};
};

export const LOCU_SEARCH_API_PROPERTIES = (): ApiConfigObject => {
	const workerHandler = {
		lat: [],
		lng: ['long'],
	};

	const settings = {
		timeout: CALL_API_TIMEOUT,
		method: 'GET',
		data: {},
		cache: true,
		dataType: 'jsonp',
	};

	const apiParameters = {
		// eslint-disable-next-line @typescript-eslint/camelcase
		api_key: (apiInfo: { [key: string]: string }): string => {
			return apiInfo.APIKey;
		},
	};

	const basicOnlyParameters = {
		bounds: (point: Point): string => {
			return (
				point.lat +
				LAT_LNG_ACCURACY +
				',' +
				(point.lng - LAT_LNG_ACCURACY) +
				'|' +
				(point.lat - LAT_LNG_ACCURACY) +
				',' +
				(point.lng + LAT_LNG_ACCURACY)
			);
		},
	};

	return {
		basicURL: 'search/',
		detailedURL: '',
		extraSlash: true,
		basicReturnType: 'objects',
		detailedReturnType: ['objects', 0],
		workerHandler,
		settings,
		apiParameters,
		basicOnlyParameters,
	};
};

export const FOURSQUARE_SEARCH_API_PROPERTIES = (): ApiConfigObject => {
	const parameters = {
		v: '20150711',
	};

	const settings = {
		timeout: CALL_API_TIMEOUT,
		method: 'GET',
		data: parameters,
		cache: true,
		dataType: 'jsonp',
	};

	const basicOnlyParameters = {
		radius: (point: Point): number => {
			return DISTANCE_BETWEEN_TWO_POINTS_IN_METERS(
				point.lat,
				point.lng,
				point.lat + LAT_LNG_ACCURACY,
				point.lng + LAT_LNG_ACCURACY
			);
		},
		ll: (point: Point): string => {
			return point.lat + ',' + point.lng;
		},
		limit: 50,
		categoryId: '4d4b7105d754a06374d81259', //food
		intent: 'checkin',
	};

	const apiParameters = {
		// eslint-disable-next-line @typescript-eslint/camelcase
		client_id: (apiInfo: { [key: string]: string }): string => {
			return apiInfo.clientID;
		},
		// eslint-disable-next-line @typescript-eslint/camelcase
		client_secret: (apiInfo: { [key: string]: string }): string => {
			return apiInfo.clientSecret;
		},
	};

	const workerHandler = {
		lat: ['location', 'lat'],
		lng: ['location', 'lng'],
	};

	return {
		settings,
		basicURL: 'search',
		detailedURL: '',
		basicReturnType: ['response', 'venues'],
		detailedReturnType: ['response', 'venue'],
		workerHandler,
		basicOnlyParameters,
		apiParameters,
	};
};
