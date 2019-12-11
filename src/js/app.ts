/* global google */
'use strict';

import $ from 'jquery';
import 'jquery-migrate';
if (process.env.NODE_ENV === 'production') {
	$.migrateMute = true;
}
window['$'] = window['jQuery'] = $;
import ko from 'knockout';
window['ko'] = ko;
import 'jquery-ui';
import 'jquery-ui/ui/widget';
import 'jquery-ui/ui/version';
import 'jquery-ui/ui/unique-id';
import 'jquery-ui/ui/position';
import 'jquery-ui/ui/safe-active-element';
import 'jquery-ui/ui/keycode';
import 'jquery-ui/ui/widgets/mouse';
import 'jquery-ui/ui/widgets/selectable';
import 'jquery-ui/ui/widgets/sortable';
import 'jquery-ui/ui/widgets/autocomplete';
import 'jquery-ui/ui/widgets/menu';
import 'jquery-ui/ui/widgets/slider';
import 'jquery-ui/ui/widgets/tooltip';
import 'jquery-ui/ui/widgets/dialog';
import 'jquery-ui/ui/effect';
import 'jquery-ui/ui/effects/effect-drop';
import 'jquery-ui/ui/effects/effect-fade';
import 'jquery-ui/ui/effects/effect-fold';
import 'jquery-ui/ui/effects/effect-highlight';
import 'jquery-ui/ui/effects/effect-puff';
import 'jquery-ui/ui/effects/effect-scale';
import 'jquery-ui/ui/effects/effect-size';
import 'jquery-ui/ui/effects/effect-slide';

import 'bootstrap/dist/js/bootstrap.js';

import '../vendor/slidebars.min.js';
import 'jquery.rateit';
import '../vendor/jquery.scrollintoview.custom.js';

import WebFont from 'webfontloader';

import * as config from './config';
import { preload, throttle } from './util';
import ViewModel from './ViewModel';
import './bindingHandlers';

/**
 * App contains the view model, model definitions, and
 * success/fail functions for Google maps (that create the map and view model).
 * Kept as anonymous function to minimize any global name space problems.
 * Success/fail functions returned for Google maps API to call. Preload
 * functions called right after maps API starts loading.
 */
const app: App = ((): App => {
	// Preloading 3 assets, declare variables to wait for them
	let imagesPreloaded = false;
	let fontsPreloaded = false;
	let googlePreloaded = false;

	/**
	 * Called if the Google Maps API has failed to load, lets the user know
	 * to try again later
	 */
	const googleFailedToLoad = (): void => {
		alert('Google Maps failed to load. Please try again later.');
	};

	/**
	 * Called if the Google Maps API has successfully loaded.
	 */
	const googleLoaded = (): void => {
		googlePreloaded = true;
	};

	/**
	 * Function to create the google map as well as create and setup the
	 * viewModel
	 */
	const createMap = (): void => {
		// Double check API is really loaded
		if (typeof google === 'undefined') {
			googleFailedToLoad();
		} else {
			// Setup default options from config object
			const defaultLatLng = new google.maps.LatLng(
					config.DEFAULT_LAT,
					config.DEFAULT_LNG
				),
				defaultZoom =
					window.innerWidth < 992
						? config.DEFAULT_MOBILE_ZOOM
						: config.DEFAULT_ZOOM,
				mapElement = document.getElementById('mapDiv'),
				defaultStyle = config.MAP_STYLE;

			const mapOptions = {
				center: defaultLatLng,
				zoom: defaultZoom,
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				mapTypeControlOptions: {
					mapTypeIds: [],
				}, //remove some controls
				styles: defaultStyle as Array<google.maps.MapTypeStyle>,
			};

			// Define reticle to be pegged at center of map
			const reticleImage = {
				url: config.MARKER_IMAGE_RETICLE, // marker image
				size: new google.maps.Size(16, 16), // marker size
				origin: new google.maps.Point(0, 0), // marker origin
				anchor: new google.maps.Point(8, 8),
			}; // marker anchor point

			const reticleShape: google.maps.MarkerShape = {
				coords: [8, 8, 8, 8], // 1px
				type: 'rect', // rectangle
			};

			// Create map and viewModel using map
			const mainGoogleMap = new google.maps.Map(mapElement, mapOptions);
			const viewModel1 = new ViewModel(mainGoogleMap);
			ko.applyBindings(viewModel1, document.body);

			// Setup and add center reticle
			const reticleMarker = new google.maps.Marker({
				position: mainGoogleMap.getCenter(),
				map: mainGoogleMap,
				icon: reticleImage,
				shape: reticleShape,
				optimized: false,
				zIndex: 5,
			});

			/**
			 * Keep center reticle centered, throttle as panning would call
			 * too frequently and performance is the same
			 */
			const centerReticle = throttle(
				(center: google.maps.LatLng): void => {
					reticleMarker.setPosition(center);
				},
				16,
				{
					leading: false,
				}
			);

			/**
			 * Function called when map pans that calls radar and nearby search
			 * functions from viewModel. Manages the call array dedicated to
			 * these that stops pagination from happening if a map pan occurs -
			 * this attempts to minimize total amount of calls made to google
			 * servers - also tries to prioritize information more pertinent
			 * to current map center rather than map center from original call.
			 * Throttled to avoid over-query errors.
			 */
			const callAPIs = throttle(
				(): void => {
					if (
						typeof viewModel1
							.getRestaurantsFromGoogleMapsAPICallArray[
							viewModel1.getRestaurantsFromGoogleMapsAPICallArray
								.length - 1
						] !== 'undefined'
					) {
						viewModel1.getRestaurantsFromGoogleMapsAPICallArray[
							viewModel1.getRestaurantsFromGoogleMapsAPICallArray
								.length - 1
						] = false;
					}
					viewModel1.getRestaurantsFromGoogleMapsAPICallArray.push(
						true
					);
					viewModel1.getRestaurantsFromGoogleMapsAPI(
						viewModel1.getRestaurantsFromGoogleMapsAPICallArray
							.length - 1
					);
				},
				1200,
				{
					trailing: false,
				}
			);

			/**
			 * Function called when map pans that updates center of map and then
			 * calls callAPIs function
			 * @param  {object} map.getCenter() coordinates object
			 */
			const boundsChange = throttle(
				(center: google.maps.LatLng): void => {
					viewModel1.checkIfOnMap(viewModel1.mainMap.getBounds());
					viewModel1.mainMapCenter(center);
					callAPIs();
				},
				50,
				{
					leading: false,
				}
			);

			/**
			 * Event listener for map panning/bounds changing. Calls the bounds
			 * changed function and also updates center reticle coordinates.
			 */
			google.maps.event.addListener(
				mainGoogleMap,
				'bounds_changed',
				(): void => {
					const center = mainGoogleMap.getCenter();
					boundsChange(center);
					centerReticle(center);
				}
			);

			/**
			 * If the user starts dragging, set userDrag to true to stop the
			 * infoWindow from moving.
			 */
			google.maps.event.addListener(
				mainGoogleMap,
				'dragstart',
				(): void => {
					viewModel1.userDrag(true);
				}
			);

			/**
			 * Check localStorage, if mapCenter is preset, sets map to that
			 * center. If localStorage isn't available, asks the browser for its
			 * location.
			 */
			if (viewModel1.storageAvailable === true) {
				const mapCenter = JSON.parse(localStorage.getItem('mapCenter'));
				if (
					!localStorage.getItem('mapCenter') ||
					typeof mapCenter.lat === 'undefined' ||
					mapCenter.lat === null
				) {
					viewModel1.getNavWithCallback();
				}
			} else {
				viewModel1.getNavWithCallback();
			}
		}
	};

	/**
	 * Called when preloading starts. Waits for images, fonts, and maps API to
	 * load and then calls createMap() to init map and viewModel. Finally,
	 * removes loading screen.
	 */
	const waitUntilEverythingLoaded = (): void => {
		const waitForAllLoadedVariables = (): Promise<() => void> => {
			const poll = (resolve: () => void): void => {
				if (
					imagesPreloaded === true &&
					fontsPreloaded === true &&
					googlePreloaded === true
				) {
					// eslint-disable-next-line no-console
					console.log(
						'ZweiFood loaded. Version: ' +
							process.env.npm_package_version
					);
					resolve();
				} else setTimeout(() => poll(resolve), 100);
			};
			return new Promise(poll);
		};

		waitForAllLoadedVariables().then((): void => {
			createMap();
			$('#loading').fadeOut(500);
		});
	};

	/**
	 * Called from HTML right after maps API script starts to load. Loads
	 * web fonts and sets functions to declare fontsPreloaded as true when
	 * either a success, failure, or 10 seconds are up. Also preload marker
	 * images for map as that takes the longest for Google Maps to fetch.
	 * Finally calls function to wait for images, fonts, and API to load.
	 */
	const preloadFontsAndImages = (): void => {
		const WebFontConfig = {
			google: {
				families: [
					'Lato:400,400italic,700:latin',
					'Scheherazade:400,700:latin',
				],
			},
			timeout: 10000,
			active: (): void => {
				fontsPreloaded = true;
			},
			// Fails to load, proceed anyway
			inactive: (): void => {
				fontsPreloaded = true;
				console.warn('Fonts were not loaded.');
			},
		};
		WebFont.load(WebFontConfig);

		preload(
			[
				config.MARKER_IMAGE_URL_1,
				config.MARKER_IMAGE_URL_2,
				config.MARKER_IMAGE_URL_3,
				config.MARKER_IMAGE_URL_4,
				config.MARKER_IMAGE_URL_EMPTY,
				config.MARKER_IMAGE_URL_FAV,
				config.MARKER_IMAGE_URL_DEFAULT,
				config.MARKER_IMAGE_RETICLE,
				config.YELP_STAR_IMAGES[0],
				config.YELP_STAR_IMAGES[1],
				config.YELP_STAR_IMAGES[15],
				config.YELP_STAR_IMAGES[2],
				config.YELP_STAR_IMAGES[25],
				config.YELP_STAR_IMAGES[3],
				config.YELP_STAR_IMAGES[35],
				config.YELP_STAR_IMAGES[4],
				config.YELP_STAR_IMAGES[45],
				config.YELP_STAR_IMAGES[5],
			],
			(): void => {
				imagesPreloaded = true;
			}
		);
		waitUntilEverythingLoaded();
	};

	/**
	 * Expose only success and fail functions to the rest of the page
	 */
	return {
		googleLoaded: googleLoaded,
		googleFailedToLoad: googleFailedToLoad,
		preloadFontsAndImages: preloadFontsAndImages,
	};
})();

export default window.app = app;

/* exported app */
