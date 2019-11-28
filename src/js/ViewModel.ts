/* global google, ko, $ */
import {
	storageAvailable,
	workersAvailable,
	checkNested,
	debounce,
	throttle,
	allValuesSameInTwoArray,
	matchBasedOnName,
} from './util';
import * as config from './config';
import {
	MAX_MARKER_LIMIT,
	LOW_MARKER_OPACITY,
	DEFAULT_PRICE_BUTTON_FILTER,
	DEFAULT_MIN_RATING_BUTTON_FILTER,
	DEFAULT_OPEN_BUTTON_FILTER,
	DEFAULT_FAVORITE_BUTTON_FILTER,
} from './config'; // For observable wrapped data
import LocationModel from './LocationModel';
import DetailedAPILock from './DetailedAPILock';

interface OptMarkerImage {
	anchor?: google.maps.Point;
	labelOrigin?: google.maps.Point;
	origin?: google.maps.Point;
	scaledSize?: google.maps.Size;
	size?: google.maps.Size;
	url?: string;
}
interface ErrorInterface {
	customMessage: string;
	textStatus: string;
	verbose: boolean;
	killOnMarkers: boolean;
}
type SortType = 'count' | 'alpha' | 'rating' | 'distance';

////////////////////////////
// Section IV: View Model //
////////////////////////////

/**
 * View Model for initialized Google map
 * @param {object} map Google map viewModel is to use
 */

export default class ViewModel {
	mainMap: google.maps.Map;
	mainMapCenter: KnockoutObservable<google.maps.LatLng>;
	service: google.maps.places.PlacesService;
	storageAvailable: boolean;
	workersAvailable: boolean;
	maxMarkerLimit: KnockoutObservable<number>;
	lowMarkerOpacity: KnockoutObservable<number>;

	APIKeys_yelp: KnockoutObservable<{ [key: string]: string }>;
	APIKeys_locu: KnockoutObservable<{ [key: string]: string }>;
	APIKeys_foursquare: KnockoutObservable<{ [key: string]: string }>;

	defaultMarkerImage: OptMarkerImage;

	markedLocations: KnockoutObservableArray<LocationModel>;
	locationModelNumber: number;
	currentlySelectedLocation: KnockoutObservable<LocationModel>;
	scrolledItem: KnockoutObservable<LocationModel>;
	shouldScroll: KnockoutObservable<boolean>;
	attributionsArray: KnockoutObservableArray<string>;
	favoriteArray: KnockoutObservableArray<LocationModel>;
	getRestaurantsFromGoogleMapsAPICallArray: Array<boolean>;
	currentDetailedAPIInfoBeingFetched: DetailedAPILock;
	errors: KnockoutObservable<boolean | ErrorInterface>;
	verboseErrors: KnockoutObservable<boolean>;
	checkNested: (obj, level, ...rest) => boolean; //TODO
	markerToggled: KnockoutObservable<boolean>;
	optionsToggled: KnockoutObservable<boolean>;
	regularInfoWindowPan: KnockoutObservable<boolean>;
	userDrag: KnockoutObservable<boolean>;
	currentInfoWindowCheck: NodeJS.Timeout;
	sortType: KnockoutObservable<SortType>;
	searchQuery: KnockoutObservable<string>;
	priceButtonFilter: KnockoutObservableArray<boolean>;
	minRatingButtonFilter: KnockoutObservable<number>;
	openButtonFilter: KnockoutObservable<boolean>;
	favoriteButtonFilter: KnockoutObservable<boolean>;
	infoWindowHTMLTemplate: string;
	idArray: ko.PureComputed<{
		all: Array<string>;
		nearby: Array<string>;
	}>;
	priceButtonFilterHasChanged: ko.PureComputed<boolean>;
	listableEntries: ko.PureComputed<{
		entries: Array<LocationModel>;
		allNames: Array<string>;
	}>;
	sortedEntries: ko.PureComputed<Array<LocationModel>>;

	constructor(map) {
		// Initialize
		this.mainMap = map;
		// Keep track of map center for saving - is set by createMap
		this.mainMapCenter = ko.observable(undefined);
		this.service = new google.maps.places.PlacesService(this.mainMap);
		// Check if localStorage and web workers are available
		this.storageAvailable = storageAvailable('localStorage');
		this.workersAvailable = workersAvailable();
		// Get config variables that can be changed
		this.maxMarkerLimit = ko.observable(MAX_MARKER_LIMIT);
		this.lowMarkerOpacity = ko.observable(LOW_MARKER_OPACITY);
		for (const service of config.CONFIGURED_SEARCH_TYPES) {
			this['APIKeys_' + service] = { ...config.API_KEYS[service] };
			const keyEntries = Object.entries(this['APIKeys_' + service]);
			for (let i = 0, len = keyEntries.length; i < len; i++) {
				const [propName, keyValue] = keyEntries[i];
				this['APIKeys_' + service][propName] = ko.observable(keyValue);
			}
			this['APIURLs_' + service] = config.API_URLS[service];
		}
		// Set default marker image object based on config object
		this.defaultMarkerImage = {
			size: new google.maps.Size(
				config.MARKER_IMAGE_SIZE[0],
				config.MARKER_IMAGE_SIZE[1]
			),
			origin: new google.maps.Point(
				config.MARKER_IMAGE_ORIGIN[0],
				config.MARKER_IMAGE_ORIGIN[1]
			),
			anchor: new google.maps.Point(
				config.MARKER_IMAGE_ANCHOR[0],
				config.MARKER_IMAGE_ANCHOR[1]
			),
		};

		// Array of models
		this.markedLocations = ko.observableArray([]);
		// Model number which iterates when a new model is created
		this.locationModelNumber = 0;
		// Set when a model is selected
		this.currentlySelectedLocation = ko.observable(undefined);
		// Set to currentlySelectedLocation when an item needs to be scrolled to
		this.scrolledItem = ko.observable(undefined);
		// Controls if an item needs to be scrolled to - handled by bindinghandler
		this.shouldScroll = ko.observable(false);
		// Array of attributions found while radar and nearby searching
		this.attributionsArray = ko.observableArray([]);
		// Array of all favorite models
		this.favoriteArray = ko.observableArray([]);
		// Array of current API calls - used to throttle calls when scrolling
		this.getRestaurantsFromGoogleMapsAPICallArray = [];
		// Object to control API calls from non-Google services
		this.currentDetailedAPIInfoBeingFetched = new DetailedAPILock();
		// Observable that is set when an error comes up
		this.errors = ko.observable(false);
		// User set variable to show more verbose errors
		this.verboseErrors = ko.observable(false);
		// Bring the checkNested function into the viewModel
		this.checkNested = checkNested;
		// Track the states of the menus in mobile UI mode
		this.markerToggled = ko.observable(false);
		this.optionsToggled = ko.observable(false);
		// Stop the infoWindow move checker for the native Google method
		this.regularInfoWindowPan = ko.observable(false);
		// Stop the infoWindow move checker if the user drags
		this.userDrag = ko.observable(false);
		// Track the status of the infoWindow move checker
		this.currentInfoWindowCheck = undefined;

		// Variables for sort types and filter types
		this.sortType = ko.observable('count' as SortType);
		this.searchQuery = ko.observable('');
		this.priceButtonFilter = ko.observableArray(
			DEFAULT_PRICE_BUTTON_FILTER.slice()
		);
		this.minRatingButtonFilter = ko.observable(
			DEFAULT_MIN_RATING_BUTTON_FILTER
		);
		this.openButtonFilter = ko.observable(DEFAULT_OPEN_BUTTON_FILTER);
		this.favoriteButtonFilter = ko.observable(
			DEFAULT_FAVORITE_BUTTON_FILTER
		);

		/**
		 * Initial HTML that gets parsed through knockout applyBindings and sets
		 * up template for infoWindow
		 * @type {String}
		 */
		this.infoWindowHTMLTemplate =
			'<div class = "info-window-template" ' +
			'data-bind = "infoWindowTemplate: true"></div>';

		/**
		 * Subscribe to lowMarkerOpacity user set variable to set all markers to
		 * new opacity
		 */
		this.lowMarkerOpacity.subscribe((newValue) => {
			newValue = +Number(newValue).toFixed(2);
			ko.utils.arrayForEach(this.markedLocations(), (item) => {
				if (item.isListed() === false) {
					item.marker().setOpacity(newValue);
				}
			});
		});

		this.lowMarkerOpacity.extend({
			numeric: 2,
		});

		// When map center changes, save it to localStorage
		this.mainMapCenter.subscribe((newValue) => {
			this.setLocalStorage(
				'mapCenter',
				JSON.stringify({
					lat: newValue.lat(),
					lng: newValue.lng(),
					zoom: this.mainMap.getZoom(),
				})
			);
		});

		// When user inputs new API keys, save them client-side to localStorage
		for (const service of config.CONFIGURED_SEARCH_TYPES) {
			const entries = Object.entries(this['APIKeys_' + service]);
			for (let i = 0; i < entries.length; ++i) {
				const [key, value] = entries[i] as [
					string,
					KnockoutObservable<string>
				];
				value.subscribe((newValue) => {
					this.setLocalStorage(
						`APIKeys_${service}|||${key}`,
						newValue
					);
				});

				// Prevent frequent calls to localStorage
				value.extend({
					rateLimit: 2000,
				});
			}
		}

		/**
		 * Subscribe to markedLocations to start removing locations if the
		 * maxMarkerLimit is exceeded
		 */
		this.markedLocations.subscribe((newValue) => {
			if (newValue.length > this.maxMarkerLimit()) {
				this.removeMultipleLocations(newValue);
			}
		});

		// Subscribe to favoriteArray to save it to localStorage at intervals
		this.favoriteArray.subscribe((newValue) => {
			const favoritesArray = [];
			ko.utils.arrayForEach(newValue, (item) => {
				favoritesArray.push(item.toJSON());
			});
			const favoritesString = JSON.stringify(favoritesArray);
			if (favoritesArray.length !== 0) {
				this.setLocalStorage('favoritesArray', favoritesString);
			} else {
				this.setLocalStorage('favoritesArray', '[]');
			}
		});

		// Prevent frequent calls to localStorage
		this.favoriteArray.extend({
			rateLimit: 2000,
		});

		/**
		 * Subscribe to currentlySelectedLocation and call scrollToItem on
		 * change. Stop the infoWindow move listener.
		 */
		this.currentlySelectedLocation.subscribe(
			debounce((newValue) => {
				if (typeof newValue !== 'undefined') {
					this.scrollToItem();
					this.userDrag(false);
				}
			}, 5)
		);

		// Computed array of all IDs and nearby/places search only ids
		this.idArray = ko.pureComputed(() => {
			const returnArray = {
				all: [],
				nearby: [],
			};
			ko.utils.arrayMap(this.markedLocations(), (item) => {
				if (
					item.googleSearchType() === 'Nearby' ||
					item.googleSearchType() === 'Places'
				) {
					returnArray.nearby.push(item.google_placeId);
				}
				returnArray.all.push(item.google_placeId);
			});
			return returnArray;
		});

		// Computed check if priceButtonFilter has changed
		this.priceButtonFilterHasChanged = ko.pureComputed(() => {
			return !allValuesSameInTwoArray(this.priceButtonFilter(), [
				true,
				true,
				true,
				true,
				true,
			]);
		});

		/**
		 * Computed object, returns markedLocations that are Nearby/Places
		 * searched and not filtered. Returns both an array of filtered models
		 * and an array of the names of those models.
		 */
		this.listableEntries = ko.computed(() => {
			const returnArray = {
				entries: [],
				allNames: [],
			};
			returnArray.entries = ko.utils.arrayFilter(
				this.markedLocations(),
				(item) => {
					if (
						(item.googleSearchType() === 'Nearby' ||
							item.googleSearchType() === 'Places') &&
						item.isInViewOnMap() === true &&
						this.isSearchFiltered(item) === false &&
						this.isButtonFiltered(item) === false
					) {
						item.isListed(true);
						returnArray.allNames.push(item.google_name());
						return true;
					} else {
						item.isListed(false);
						return false;
					}
				}
			);
			return returnArray;
		});

		/**
		 * Computed array, takes listableEntries computed entries array and
		 * sorts it according to sortType observable
		 */
		this.sortedEntries = ko.pureComputed(() => {
			const returnArray = this.listableEntries().entries;
			if (this.sortType() === 'count') {
				returnArray.sort((left, right) => {
					return left.modelNumber < right.modelNumber ? -1 : 1;
				});
			} else if (this.sortType() === 'alpha') {
				returnArray.sort((left, right) => {
					return left.google_name() === right.google_name()
						? 0
						: left.google_name() < right.google_name()
						? -1
						: 1;
				});
			} else if (this.sortType() === 'rating') {
				// Sort undefined to the end of the list
				returnArray.sort((left, right) => {
					if (typeof left.google_rating() === 'undefined') {
						if (typeof right.google_rating() === 'undefined') {
							return 0;
						} else {
							return 1;
						}
					} else if (typeof right.google_rating() === 'undefined') {
						return -1;
					} else {
						return left.google_rating() < right.google_rating()
							? 1
							: -1;
					}
				});
			} else if (this.sortType() === 'distance') {
				returnArray.sort((left, right) => {
					const x1 = left.google_geometry().location.lat();
					const x2 = right.google_geometry().location.lat();
					const x3 = this.mainMapCenter().lat();
					const y1 = left.google_geometry().location.lng();
					const y2 = right.google_geometry().location.lng();
					const y3 = this.mainMapCenter().lng();
					const dist1 = config.DISTANCE_BETWEEN_TWO_POINTS_IN_METERS(
						x1,
						y1,
						x3,
						y3
					);
					const dist2 = config.DISTANCE_BETWEEN_TWO_POINTS_IN_METERS(
						x2,
						y2,
						x3,
						y3
					);
					return dist1 === dist2 ? 0 : dist1 < dist2 ? -1 : 1;
				});
			}
			return returnArray;
		});

		// Limit resorting, slows down too much otherwise
		this.listableEntries.extend({
			rateLimit: 50,
		});

		this.singleErrorMessages();
		this.getLocalStorage();
	}

	/**
	 * Called from model when it's listed to change the
	 * currentlySelectedLocation
	 * @param  {boolean} newValue isListed subscribed value
	 * @param  {object} model     model which changed
	 */
	changeCurrentlySelectedItem(newValue, model): void {
		if (newValue === true) {
			this.currentlySelectedLocation(model);
		} else {
			this.currentlySelectedLocation(undefined);
		}
	}

	/**
	 * Called from model when it's favorited to updated favoriteArray
	 * @param  {boolean} newValue isFavorite subscribed value
	 * @param  {object} model     model which changed
	 */
	changeFavoriteArray(newValue, model): void {
		if (newValue === true) {
			this.favoriteArray.push(model);
		} else {
			this.favoriteArray.remove(model);
		}
	}

	/**
	 * Function called when an infoWindow handles a closeclick
	 * event - sets the currentlySelectedLocation to not selected
	 */
	markerCloseClick(): void {
		if (typeof this.currentlySelectedLocation() !== 'undefined') {
			this.currentlySelectedLocation().hasBeenOpened = false;
			this.currentlySelectedLocation().isSelected(false);
		}
	}

	/**
	 * Function called when an infoWindow handles a domReady event - sets
	 * up infoWindow with content if it doesn't have it already.
	 * Called every time the marker is clicked as of API 3.23 as window
	 * needs to be re-rendered
	 */
	markerDomReady(): void {
		if (!this.currentlySelectedLocation().hasBeenOpened) {
			ko.applyBindings(
				this,
				this.currentlySelectedLocation().infoWindow.getContent() as Node
			);
			this.currentlySelectedLocation().hasBeenOpened = true;
		}
	}

	/**
	 * Function called when an infoWindow handles a click event -
	 * sets the markerList to scroll to this model,
	 * starts the data fetching process with Google Places API, closes
	 * previous info and opens this one, sets markerAnimation going
	 * @param  {object} model model that contains infoWindow
	 */
	markerClick(model): void {
		/* Change in API as of 3.23: infoWindow needs to be forced to
												re-render if marker is re-clicked */
		if (model.hasBeenOpened === true) {
			model.hasBeenOpened = false;
		}
		this.shouldScroll(true);
		this.getDetailedGooglePlacesAPIInfo(
			model,
			this.callSearchAPIs.bind(this)
		);
		if (typeof this.currentlySelectedLocation() !== 'undefined') {
			this.currentlySelectedLocation().infoWindow.close();
			this.currentlySelectedLocation().isSelected(false);
		}
		model.isSelected(true);
		this.markerAnimation(model);
		model.infoWindow.open(model.marker().map, model.marker());
	}

	/**
	 * Function called from markerClick that animates one frame of bouncing
	 * animation
	 * @param  {model} loc  model with marker to animate
	 */
	markerAnimation(loc): void {
		loc.marker().setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(() => {
			loc.marker().setAnimation(null);
		}, 750);
	}

	/**
	 * Called to pick an icon when isFavorite or priceLevel is changed
	 * on a model
	 * @param  {Boolean} isFavorite model's isFavorite property
	 * @param  {number}  priceLevel model's google_priceLevel property
	 * @return {object}             markerObject that can be fed into icon
	 *                              property of marker
	 */
	markerImageCreator(isFavorite, priceLevel): OptMarkerImage {
		const markerObject = this.defaultMarkerImage;
		if (isFavorite === true) {
			markerObject.url = config.MARKER_IMAGE_URL_FAV;
			return markerObject;
		}
		switch (priceLevel) {
			case 1:
				markerObject.url = config.MARKER_IMAGE_URL_1;
				return markerObject;
			case 2:
				markerObject.url = config.MARKER_IMAGE_URL_2;
				return markerObject;
			case 3:
				markerObject.url = config.MARKER_IMAGE_URL_3;
				return markerObject;
			case 4:
				markerObject.url = config.MARKER_IMAGE_URL_4;
				return markerObject;
			default:
				markerObject.url = config.MARKER_IMAGE_URL_EMPTY;
				return markerObject;
		}
	}

	/**
	 * Get browser location and send it to panning function
	 */
	getNavWithCallback(): void | false {
		if (navigator.geolocation) {
			return navigator.geolocation.getCurrentPosition(
				this.mapPanFromNavigation.bind(this)
			);
		} else {
			return false;
		}
	}

	/**
	 * Pan to given position from browser navigation. Close infoWindow
	 * and options window.
	 * @param  {object} position browser position coordinates
	 */
	mapPanFromNavigation(position): void {
		this.mapPan(position.coords.latitude, position.coords.longitude);
		this.markerCloseClick();
		this.optionsToggled(false);
	}

	/**
	 * Pans to map to the given coordinates
	 * @param  {number} lat latitude
	 * @param  {number} lng longitude
	 */
	mapPan(lat, lng): void {
		const userLatLng = new google.maps.LatLng(lat, lng);
		this.mainMap.panTo(userLatLng);
	}

	/**
	 * Function to remove references and dispose of multiple locations when
	 * max location limit has been reached - called from markedLocations
	 * subscriber
	 * @param  {Array}  newValue       newValue of markedLocations array
	 */
	removeMultipleLocations(...args): void {
		return throttle(
			(newValue) => {
				//Push favorite to front
				this.markedLocations.sort((left, right) => {
					return left.isFavorite() === true
						? 1
						: left.modelNumber < right.modelNumber
						? -1
						: 1;
				});
				for (
					let i = 0;
					i < config.MARKER_LIMIT_REMOVAL_BULK_AMOUNT;
					i++
				) {
					newValue[i].dispose();
				}
				this.markedLocations.splice(
					0,
					config.MARKER_LIMIT_REMOVAL_BULK_AMOUNT
				);
			},
			1000,
			{
				trailing: false,
			}
		).apply(this, args);
	}

	/**
	 * Called when a model is created, iterates locationModelNumber when
	 * called. Allows for sorting models by when they were received
	 * @return {number} number to assign model
	 */
	getLocationModelNumber(): number {
		this.locationModelNumber++;
		return this.locationModelNumber - 1;
	}

	/**
	 * Function called to set localStorage with desired properties -
	 * throttled to avoid too many calls at once
	 * @param  {string} name                name of property to set
	 * @param  {string} item)               value of property to set
	 */
	setLocalStorage(...args): (name: string, item: string) => void {
		return throttle(
			(name, item) => {
				if (this.storageAvailable === true) {
					localStorage.setItem(name, item);
				}
			},
			1000,
			{
				trailing: false,
			}
		).apply(this, args);
	}

	/**
	 * Function to create a limited copy of some listableEntries properties
	 * to pass to web workers
	 * @return {array} array of limited-info models
	 */
	locationArrayForWorkers(): Array<object> {
		return ko.utils.arrayMap(this.listableEntries().entries, (item) => {
			return {
				lat: item.google_geometry().location.lat(),
				lng: item.google_geometry().location.lng(),
				name: item.google_name(),
				google_placeId: item.google_placeId, //eslint-disable-line @typescript-eslint/camelcase
			};
		});
	}

	/**
	 * Function to check if a model is filtered by the current searchQuery
	 * observable the user has entered
	 * @param  {object}  item model to check
	 * @return {Boolean}      if the model is filtered by the query
	 */
	isSearchFiltered(item): boolean {
		if (typeof this.searchQuery() !== 'undefined') {
			if (
				item
					.google_name()
					.toLowerCase()
					.indexOf(this.searchQuery().toLowerCase()) >= 0
			) {
				return false;
			} else {
				return true;
			}
		} else {
			return false;
		}
	}

	/**
	 * Function to check if a model is filtered by the current button
	 * filters the user has selected
	 * @param  {object}  item model to check
	 * @return {Boolean}      if the model is filtered by the filters
	 *                        selected
	 */
	isButtonFiltered(item): boolean {
		if (this.priceButtonFilterHasChanged() === true) {
			if (typeof item.google_priceLevel() !== 'undefined') {
				for (let i = 0; i < 5; i++) {
					if (this.priceButtonFilter()[i] !== true) {
						if (item.google_priceLevel() === i) {
							return true;
						}
					}
				}
				// 0 button should be the only one which filters undefined
			} else {
				if (this.priceButtonFilter()[0] !== true) {
					return true;
				}
			}
		}
		if (this.minRatingButtonFilter() !== 0) {
			if (typeof item.google_rating() !== 'undefined') {
				if (item.google_rating() < this.minRatingButtonFilter()) {
					return true;
				}
			} else {
				return true;
			}
		}
		if (this.openButtonFilter() !== false) {
			if (item.isItOpenRightNow() !== 'Open') {
				return true;
			}
		}
		if (this.favoriteButtonFilter() !== false) {
			if (item.isFavorite() !== true) {
				return true;
			}
		}

		return false;
	}

	/**
	 * If a location is selected and shouldScroll is enabled, scroll to that
	 * location and keep scroll locked to it even if new models are added to
	 * the marker list
	 */
	scrollToItem(): void {
		if (
			typeof this.currentlySelectedLocation() !== 'undefined' &&
			this.shouldScroll() === true
		) {
			this.scrolledItem(this.currentlySelectedLocation());
		}
	}

	/**
	 * Parse the initial HTML which will be inserted into an infoWindow
	 * and which will then call the infoWindow template when applyBindings
	 * is called on it
	 * @return {object} HTML nodes of the initial insertion content
	 */
	makeInfoWindowContent(): Node {
		const html = this.infoWindowHTMLTemplate;
		const returnNode = $.parseHTML(html)[0];
		return returnNode;
	}

	/**
	 * Called every-time the bounds change to check all the markedLocations
	 * markers to see if they're on the map. Sets the isInViewOnMap of those
	 * marker.
	 * @param  {object} currentBounds map.getBounds() from Google API
	 */
	checkIfOnMap(currentBounds): void {
		ko.utils.arrayForEach(this.markedLocations(), (item) => {
			if (
				currentBounds.contains(item.google_geometry().location) ===
				false
			) {
				item.isInViewOnMap(false);
			} else {
				item.isInViewOnMap(true);
			}
		});
	}

	/**
	 * Compare a google_placeId to all markedLocations models and return
	 * the first model that matches or null
	 * @param  {string} iDToCompare google_placeId to use as comparison
	 * @return {object/null}        return model if found, null if not
	 */
	compareIDs(iDToCompare): LocationModel | null {
		return ko.utils.arrayFirst(this.markedLocations(), (item) => {
			return item.google_placeId === iDToCompare;
		});
	}

	/**
	 * Function to handle API success, parse through results, call workers.
	 * @param  {array} results                Array of result objects from
	 *                                        server
	 * @param  {object} selectedPlace         model that is being updated
	 * @param  {function} setResultSearchType function to set search type
	 * @param  {string} service               name of api service
	 * @param  {object} clonedMarkedLocations clone of listableLocations to
	 *                                        pass to worker
	 * @param  {object} initialPoint          object with lat and lng props
	 *                                        for worker
	 * @param  {object} workerHandler         object to be parsed by worker
	 *                                        that is specific to the api
	 *                                        being called and is defined
	 *                                        in the config object
	 */
	successAPIFunction(
		results,
		selectedPlace,
		setResultSearchType,
		service,
		clonedMarkedLocations?,
		initialPoint?,
		workerHandler?
	): void {
		let type;
		if (typeof clonedMarkedLocations !== 'undefined') {
			type = 'basic';
		} else {
			type = 'detailed';
		}

		if (type === 'basic') {
			const match = matchBasedOnName(
				results,
				selectedPlace.google_name()
			);
			// Match will be a number if there's been a match
			if (typeof match === 'number') {
				setResultSearchType(selectedPlace);
				selectedPlace.update(service, results[match]);
				results.splice(match, 1);
			} else {
				setResultSearchType(selectedPlace, 'Not Found');
				this.failAPIFunction(
					service.toProperCase() + ' Search Problem',
					'No Match Found',
					undefined,
					true
				);
			}
			// Call worker irregardless of match
			const workerArray = {
				resultsArray: results,
				locationsArray: clonedMarkedLocations,
				initialPoint: initialPoint,
				maxDistance: config.LAT_LNG_ACCURACY,
				service: service,
				minFuzzyMatch: config.MIN_FUZZY_MATCH,
				workerHandler: workerHandler,
			};

			this.workerHandler(workerArray, service, setResultSearchType);
		} else {
			setResultSearchType(selectedPlace);
			selectedPlace.update(service, results);
		}
	}

	/**
	 * Creates an error that is shown to the user (or not if verbose and
	 * verbose is turned off). Converts some Google errors into more
	 * readable and useful information.
	 * @param  {string} customMessage Custom message to accompany error
	 * @param  {string} textStatus    Text of the error
	 * @param  {object} errorThrown   Error object thrown - optional
	 * @param  {boolean} verbose      If the error is verbose or not
	 */
	failAPIFunction(
		customMessage,
		textStatus,
		errorThrown?,
		verbose = false
	): void {
		let customTextStatus, killOnMarkers;
		switch (textStatus) {
			case 'ZERO_RESULTS':
				customTextStatus =
					'No results found from Google. ' + 'Try zooming out?';
				killOnMarkers = true;
				break;
			case 'OVER_QUERY_LIMIT':
				customTextStatus =
					'Requests are being throttled by Google. ' +
					'Usually caused by panning the map too quickly. ' +
					'Give it 10-20 seconds';
				killOnMarkers = false;
				break;
			default:
				customTextStatus = textStatus;
				killOnMarkers = false;
		}
		const errorObject = {
			customMessage,
			textStatus: customTextStatus,
			verbose,
			killOnMarkers,
		};
		this.errors(errorObject);
		if (errorThrown) {
			console.warn(errorThrown);
		}
	}

	/**
	 * Function to call a type of API's detailed data (used when switching
	 * tabs in infoWindow). Will check if a basic call is already in
	 * progress and will schedule the call after the basic data comes back.
	 * This is necessary as all detailed calls will tend to require an ID
	 * which is acquired from the basic call.
	 * @param  {string} service       name of API to call
	 * @param  {object} selectedPlace model to update with data
	 */
	getDetailedAPIData(service, selectedPlace): void {
		if (selectedPlace.searchType(service)() === 'None') {
			if (
				this.currentDetailedAPIInfoBeingFetched.findID(
					service,
					'basic',
					selectedPlace
				) === -1
			) {
				this.callBasicAPIData(service, selectedPlace);
			}
			this.currentDetailedAPIInfoBeingFetched.interceptIDPush(
				service,
				'detailed',
				selectedPlace
			);
		} else if (selectedPlace.searchType(service)() === 'Basic') {
			if (
				this.currentDetailedAPIInfoBeingFetched.findID(
					service,
					'detailed',
					selectedPlace
				) === -1
			) {
				this.currentDetailedAPIInfoBeingFetched.pushID(
					service,
					'detailed',
					selectedPlace
				);
				this.callAPIInfo('detailed', service, selectedPlace);
			}
		}
	}

	/**
	 * Calls basic API's for all services when an infoWindow is opened.
	 * Creates a markedLocations clone to pass to webWorkers to parse
	 * through. Does not call if a basic API call is already in progress
	 * or completed previously for a particular service.
	 * @param  {object} currentLoc model to update with info
	 */
	callSearchAPIs(currentLoc): void {
		const clonedMarkedLocations = ko.toJS(this.locationArrayForWorkers());
		for (
			let i = 0, len = config.CONFIGURED_SEARCH_TYPES.length;
			i < len;
			i++
		) {
			const currentServiceType = config.CONFIGURED_SEARCH_TYPES[i];
			if (currentLoc.searchType(currentServiceType)() === 'None') {
				if (
					this.currentDetailedAPIInfoBeingFetched.findID(
						currentServiceType,
						'basic',
						currentLoc
					) === -1
				) {
					this.callBasicAPIData(
						currentServiceType,
						currentLoc,
						clonedMarkedLocations
					);
				}
			}
		}
	}

	/**
	 * Call basic API of a given service for a given model
	 * @param  {string} service               service to call API for
	 * @param  {object} selectedPlace         model to update
	 * @param  {object} clonedMarkedLocations clone of markedLocations for
	 *                                        web workers
	 */
	callBasicAPIData(
		service,
		selectedPlace,
		clonedMarkedLocations = ko.toJS(this.locationArrayForWorkers())
	): void {
		this.currentDetailedAPIInfoBeingFetched.pushID(
			service,
			'basic',
			selectedPlace
		);
		this.callAPIInfo(
			'basic',
			service,
			selectedPlace,
			clonedMarkedLocations
		);
	}

	/**
	 * Adds any found attributions for generalized results to an attributions
	 * array that displays in the credits modal
	 * @param  {array} attributionsArray array of attributions found
	 */
	checkAndAddFullAttributions(attributionsArray): void {
		const attributionsToPush = [];
		for (let z = 0, len = attributionsArray.length; z < len; z++) {
			if (this.attributionsArray.indexOf(attributionsArray[z]) === -1) {
				attributionsToPush.push(attributionsArray[z]);
			}
		}
		this.attributionsArray.push(...attributionsToPush);
	}

	/**
	 * Process the results from a nearby Google search. Paginates if there
	 * are more pages and the map hasn't panned.
	 * @param  {object} results        results object from server
	 * @param  {object} status         status object from server
	 * @param  {object} pagination     pagination object from server
	 * @param  {number} callArrayIndex index of google call array of
	 *                                 current set of calls
	 */
	processNearbyResults(results, status, pagination, callArrayIndex): void {
		if (status !== google.maps.places.PlacesServiceStatus.OK) {
			this.failAPIFunction('Google Maps Nearby Search Error', status);
			return;
		} else {
			// Add all markers and push at once into markedLocations for performance
			const markerList = [];
			for (let i = 0, len = results.length; i < len; i++) {
				// If marker as nearby or places searchType doesn't exist
				if (!this.idArray().nearby.includes(results[i].place_id)) {
					// If marker doesn't exist, create new
					if (!this.idArray().all.includes(results[i].place_id)) {
						const newLoc = new LocationModel(this, 'Nearby');
						this.successAPIFunction(
							results[i],
							newLoc,
							() => {
								return;
							},
							'google'
						);
						markerList.push(newLoc);
					} else {
						// Marker exists as radar, simply update
						const matchedLocation = this.compareIDs(
							results[i].place_id
						);
						if (matchedLocation) {
							this.successAPIFunction(
								results[i],
								matchedLocation,
								this.setAPIResultSearchType('Nearby', 'google')
									.setSearchType,
								'google'
							);
						}
					}
					if (results[i].html_attributions.length !== 0) {
						this.checkAndAddFullAttributions(
							results[i].html_attributions
						);
					}
				}
			}
			this.markedLocations.push(...markerList);
			if (pagination && pagination.hasNextPage) {
				setTimeout(() => {
					if (
						this.getRestaurantsFromGoogleMapsAPICallArray[
							callArrayIndex
						] === true
					) {
						pagination.nextPage();
					}
				}, 2000);
			}
		}
	}

	/**
	 * Process the results from a radar Google search.
	 * @param  {object} results results from server
	 * @param  {object} status  status object from server
	 */
	processRadarResults(results, status): void {
		if (status !== google.maps.places.PlacesServiceStatus.OK) {
			this.failAPIFunction('Google Maps Radar Search Error', status);
			return;
		} else {
			/**
			 * Add all markers and push at once into markedLocations
			 *  for performance
			 */
			const markerList = [];
			for (let i = 0, len = results.length; i < len; i++) {
				// If marker doesn't exist yet, create
				if (!this.idArray().all.includes(results[i].place_id)) {
					const newLoc = new LocationModel(this, 'Radar');
					this.successAPIFunction(
						results[i],
						newLoc,
						() => {
							return null;
						},
						'google'
					);
					markerList.push(newLoc);
				}
				/**
				 * not going to update for performance and because no
				 * info to update
				 */
				if (results[i].html_attributions.length !== 0) {
					this.checkAndAddFullAttributions(
						results[i].html_attributions
					);
				}
			}
			this.markedLocations.push(...markerList);
		}
	}

	/**
	 * Function called to populate map markers with data from google -
	 * called initially and on map pan
	 * @param  {number} callArrayIndex index of the current call in the
	 *                                 google call array - if true,
	 *                                 pagination of radar results should
	 *                                 continue. if not, map has panned and
	 *                                 pagination should cancel.
	 */
	getRestaurantsFromGoogleMapsAPI(callArrayIndex): void {
		const currentMapBounds = this.mainMap.getBounds();

		// Only search in current bounds and for restaurants
		const request = {
			rankby: 'distance',
			bounds: currentMapBounds,
			type: 'restaurant',
		};

		// Call radar and nearby search
		// this.service.radarSearch(request, this.processRadarResults);
		this.service.nearbySearch(request, (results, status, pagination) => {
			this.processNearbyResults(
				results,
				status,
				pagination,
				callArrayIndex
			);
		});
	}

	/**
	 * Get detailed info on a place from google API when infoWindow is
	 * opened
	 * @param  {object}   selectedPlace model to update
	 * @param  {Function} callback      callback function - usually to call
	 *                                  other search APIs when this is
	 *                                  finished. Needs to be synced like
	 *                                  that as this could be fetching
	 *                                  data for a radar place which has
	 *                                  no discernible information to match
	 *                                  against for the other APIs.
	 */
	getDetailedGooglePlacesAPIInfo(selectedPlace, callback): void {
		if (
			this.currentDetailedAPIInfoBeingFetched.findID(
				'google',
				'detailed',
				selectedPlace
			) === -1
		) {
			this.currentDetailedAPIInfoBeingFetched.pushID(
				'google',
				'detailed',
				selectedPlace
			);

			this.service.getDetails(
				{
					placeId: selectedPlace.google_placeId,
				},
				(result, status): void => {
					this.currentDetailedAPIInfoBeingFetched
						.removeID('google', 'detailed', selectedPlace)
						.forEach((modelTuple): void => {
							this.getDetailedAPIData(...modelTuple);
						});
					if (status !== google.maps.places.PlacesServiceStatus.OK) {
						this.failAPIFunction(
							'Google Places Search Error',
							status
						);
						return;
					}
					this.successAPIFunction(
						result,
						selectedPlace,
						this.setAPIResultSearchType('Places', 'google')
							.setSearchType,
						'google'
					);
					callback(selectedPlace);
				}
			);
		}
	}

	/**
	 * Function constructor object that takes in type and service to
	 * create a setSearchType function to be passed into success
	 * function and more importantly, passed into workers. Makes inputs
	 * private. Is not very memory efficient but doesn't need to be for
	 * this use case.
	 * @param {string}    type          type of search
	 * @param {string}    service       API being searched
	 * @return {function} setSearchType constructed function to pass
	 */
	setAPIResultSearchType(
		type,
		service
	): {
		setSearchType: (
			result: { searchType: (a: string) => (b: string) => void },
			override: string
		) => void;
	} {
		const inputs = {
			type,
			service,
		};
		/**
		 * Set the search type of a model
		 * @param {object} result   model to be set
		 * @param {string} override override if not found for matching
		 */
		const setSearchType = (
			result: { searchType: (a: string) => (b: string) => void }, //TODO
			override: string
		): void => {
			let toSet = inputs.type.toProperCase();
			if (override) {
				toSet = override;
			}
			result.searchType(inputs.service)(toSet);
		};

		return {
			setSearchType,
		};
	}

	/**
	 * Function that can call the API's defined in the config object. Uses
	 * jQuery.ajax to handle success and error.
	 * Was easier to create one function than 3+ separate ones as it makes
	 * adding API's easier and making success/modifying cases consistent.
	 * @param  {string}   APIType               type of search
	 * @param  {string}   service               name of API to call
	 * @param  {object}   selectedPlace         model to update
	 * @param  {object}   clonedMarkedLocations clone of list-able locations
	 *                                          for worker object
	 * @param  {Function} callback              callback function that is
	 *                                          called when the initial call
	 *                                          is sent out
	 */
	callAPIInfo(
		APIType,
		service,
		selectedPlace,
		clonedMarkedLocations?,
		callback = (): void => {}
	): void {
		// See config for documentation on interface
		const configObject = config[
			service.toUpperCase() + '_SEARCH_API_PROPERTIES'
		]() as config.ApiConfigObject;
		const settings = configObject.settings;
		const returnType = configObject[APIType + 'ReturnType'];
		const keyData = Object.entries(this['APIKeys_' + service]).reduce(
			(acc, [key, value]: [string, KnockoutObservable<string>]) => {
				acc[key] = value();
				return acc;
			},
			{}
		);
		const interpolatedKeyData = { ...keyData };
		let url = this['APIURLs_' + service];
		const missingAPIKeys = Object.values(keyData).includes('');
		if (missingAPIKeys) {
			const apiKeys = Object.keys(keyData);
			for (let i = 0, len = apiKeys.length; i < len; i++) {
				const apiParam = apiKeys[i];
				interpolatedKeyData[
					apiParam
				] = `<<<${service}|||${apiParam}>>>`;
			}
		}

		for (const name in configObject.apiParameters) {
			const value = configObject.apiParameters[name];
			const returnedValue = value(interpolatedKeyData);
			if (name === 'beforeSend') {
				settings[name] = returnedValue as (
					jqXHR: JQueryXHR
				) => false | void;
			} else {
				settings.data[name] = returnedValue;
			} //TODO implement this in instructions
		}

		let initialPoint;
		if (APIType !== 'basic') {
			// Just call the ID of the model
			url += configObject[APIType + 'URL'];
			url += selectedPlace[service + '_id']();
			if (configObject.extraSlash === true) {
				url += '/';
			}
		} else {
			// Create search request that searches nearby the model
			url += configObject['basicURL'];
			initialPoint = {
				lat: selectedPlace.google_geometry().location.lat(),
				lng: selectedPlace.google_geometry().location.lng(),
			};
			for (const name in configObject.basicOnlyParameters) {
				const value = configObject.basicOnlyParameters[name];
				if (typeof value === 'function') {
					const returnedValue = value(initialPoint);
					settings.data[name] = returnedValue;
				} else {
					settings.data[name] = value;
				}
			}
		}

		if (missingAPIKeys) {
			settings.url =
				config.LOCAL_API_FORWARDER_URL + encodeURIComponent(url);
		} else if (settings.dataType !== 'jsonp') {
			settings.url = config.REMOTE_API_CORS_FORWARDER_URL + url;
		} else {
			settings.url = url;
		}
		/**
		 * Success function passed with the jQuery call, parses through
		 * results and calls success or failure depending on if parse
		 * is successful
		 * @param  {object} results results from call
		 */
		settings.success = (results): void => {
			let theResult = results;
			/**
			 * Parse through the results until the array of result objects
			 *  is found
			 */

			if (typeof returnType === 'object') {
				for (let i = 0, len = returnType.length; i < len; i++) {
					theResult = theResult[returnType[i]];
				}
			} else if (typeof returnType !== 'undefined') {
				theResult = theResult[returnType];
			} else {
				theResult = results;
			}
			//Success/fail in finding array of result objects
			if (typeof theResult !== 'undefined') {
				this.successAPIFunction(
					theResult,
					selectedPlace,
					this.setAPIResultSearchType(APIType, service).setSearchType,
					service,
					clonedMarkedLocations,
					initialPoint,
					configObject.workerHandler
				);
			} else {
				this.currentDetailedAPIInfoBeingFetched.interceptIDRemove(
					selectedPlace
				);
				console.debug(results);
				this.failAPIFunction(
					service.toProperCase() +
						' ' +
						APIType.toProperCase() +
						' Search Error',
					'Could not interpret results'
				);
			}
		};

		/**
		 * Fail function passed with the jQuery call, calls for an error to
		 * be shown to the user
		 * @param  {object} jqXHR       jqXHR object from jQuery
		 * @param  {string} textStatus  textStatus string from jQuery
		 * @param  {string} errorThrown error string from jQuery
		 */
		settings.error = (
			jqXHR: JQueryXHR,
			textStatus: string,
			errorThrown: string
		): void => {
			this.currentDetailedAPIInfoBeingFetched.interceptIDRemove(
				selectedPlace
			);
			this.failAPIFunction(
				service.toProperCase() +
					' ' +
					APIType.toProperCase() +
					' Search Error',
				textStatus,
				errorThrown
			);
		};

		/**
		 * Always executed function passed with jQuery call to manage
		 * removing model from API calls management object
		 */
		settings.complete = (): void => {
			this.currentDetailedAPIInfoBeingFetched
				.removeID(service, APIType, selectedPlace)
				.forEach((modelTuple): void => {
					this.getDetailedAPIData(...modelTuple);
				});
		};

		$.ajax(settings);
		callback();
	}

	/**
	 * Take a Google photo object and get its URL
	 * @param  {object} photoObject Google photo object from API
	 * @param  {object} parameter   parameter to ask for from API ie
	 *                              {maxWidth: 300}
	 * @return {string}             URL of photo or empty string
	 */
	getGooglePhotoURL(photoObject, parameter): string {
		if (typeof photoObject.getUrl === 'function') {
			return photoObject.getUrl(parameter);
		} else {
			return '';
		}
	}

	/**
	 * Declares input undefined, useful for ensuring web workers are
	 * fully killed
	 * @param  {object} toClear likely a web worker which has finished
	 */
	avoidMemeoryLeaksDueToEventListeners(toClear): void {
		toClear = undefined;
		return toClear;
	}

	/**
	 * Handles creating web workers, receiving data from them, and
	 * ending them. Updates model for every matched location.
	 * @param  {object} workerObject     successAPIFunction worker object to
	 *                                   be passed to the worker
	 * @param  {string} service          name of API called
	 * @param  {function} resultFunction function to call to set search type
	 *                                   when match is found
	 */
	workerHandler(workerObject, service, resultFunction): void {
		if (this.workersAvailable === true) {
			const worker = new Worker('/js/workerFillMarkerData.ts');
			worker.onmessage = (e): void => {
				const returnObject = e.data;
				for (let i = 0, len = returnObject.length; i < len; i++) {
					const matchedLocation = this.compareIDs(
						returnObject[i].google_placeId
					);
					resultFunction(matchedLocation);
					matchedLocation.update(service, returnObject[i]);
				}
				// Worker should kill itthis but make sure
				this.avoidMemeoryLeaksDueToEventListeners(worker);
			};
			worker.postMessage(workerObject);
		}
	}

	/**
	 * Retrieve data from localStorage, parse through, create models from it,
	 * and set center of map if defined.
	 */
	getLocalStorage(): void {
		if (this.storageAvailable === true) {
			if (localStorage.getItem('favoritesArray')) {
				const favArray = JSON.parse(
					localStorage.getItem('favoritesArray')
				);
				if (favArray !== null) {
					// Push all the favorites at once
					const markerList = [];
					for (let i = 0, len = favArray.length; i < len; i++) {
						// Nearby will force it to refresh when clicked
						const newLoc = new LocationModel(this, 'Nearby');
						const lat = Number(
							favArray[i].google_geometry.location.lat
						);
						const lng = Number(
							favArray[i].google_geometry.location.lng
						);
						const passedGeometry = new google.maps.LatLng(lat, lng);
						newLoc.rebuild(favArray[i], passedGeometry);
						newLoc.google_geometry(newLoc.google_geometry());
						newLoc.isFavorite(true);
						// Reset open/closed computed
						newLoc.google_openingHoursObject(undefined);
						markerList.push(newLoc);
					}
					this.markedLocations.push(...markerList);
				}
			}
			if (localStorage.getItem('mapCenter')) {
				const mapCenter = JSON.parse(localStorage.getItem('mapCenter'));
				if (
					mapCenter !== null &&
					typeof mapCenter.lat !== 'undefined' &&
					mapCenter.lat !== null
				) {
					this.mapPan(mapCenter.lat, mapCenter.lng);
					if (
						mapCenter.zoom !== null &&
						typeof mapCenter.zoom === 'number'
					) {
						this.mainMap.setZoom(mapCenter.zoom);
					}
				}
			}
			for (const service of config.CONFIGURED_SEARCH_TYPES) {
				const keys = Object.keys(this['APIKeys_' + service]);
				for (let i = 0; i < keys.length; ++i) {
					const key = keys[i];
					const value = localStorage.getItem(
						`APIKeys_${service}|||${key}`
					);
					if (value) {
						this['APIKeys_' + service][key](value);
					}
				}
			}
		}
	}

	/**
	 * Let the user know if storage or workers aren't available.
	 */
	singleErrorMessages(): void {
		if (this.storageAvailable !== true) {
			this.failAPIFunction(
				'Local Storage Problem',
				'Local Storage support is not available. ' +
					'Favorites will not save after page reload.'
			);
		}
		if (this.workersAvailable !== true) {
			this.failAPIFunction(
				'Web Workers Problem',
				'Web Workers support is not available. App will function ' +
					'normally but average data retrieval wait times will ' +
					'increase. \n Web workers do not work when loading this ' +
					'application from older browsers or directly from the ' +
					'local file system.'
			);
		}
	}

	/**
	 * Function to change position of map relative to center/marker by a given
	 * number of pixels.
	 * @param {object} map     Google map object
	 * @param {object} latlng  Optional Google LatLng object of center point,
	 *                         will default to center of map otherwise
	 * @param {number} offsetx X pixels to offset by
	 * @param {number} offsety Y pixels to offset by
	 */
	static setResizeListenerMapRecenter(map, latlng, offsetx, offsety): void {
		const point1 = map
			.getProjection()
			.fromLatLngToPoint(
				latlng instanceof google.maps.LatLng ? latlng : map.getCenter()
			);
		const point2 = new google.maps.Point(
			(typeof offsetx == 'number' ? offsetx : 0) /
				Math.pow(2, map.getZoom()) || 0,
			(typeof offsety == 'number' ? offsety : 0) /
				Math.pow(2, map.getZoom()) || 0
		);
		map.setCenter(
			map
				.getProjection()
				.fromPointToLatLng(
					new google.maps.Point(
						point1.x - point2.x,
						point1.y + point2.y
					)
				)
		);
	}

	/**
	 * Function to determine if the map needs to be moved to fit in the
	 * infoWindow (along with the markerList if it's visible). Calls the
	 * mapRecenter function if it needs to be moved.
	 * @param {object} theElement jQuery selector of the infoWindow
	 * @param {object} model      currently selected location
	 * @param {boolean} x         should x be adjusted?
	 * @param {boolean} y         should y be adjusted?
	 * @param {number} time       setTimeout - defaults to 0 to put the function
	 *                            into the event queue correctly
	 * @param {number} xModifier  number of pixels to add in case the infoWindow
	 *                            selector is the inner infoWindow rather than
	 *                            the outer one
	 */
	static setResizeListenerCenterWindow(
		theElement,
		model,
		x,
		y,
		time,
		xModifier
	): void {
		setTimeout(
			() => {
				let xAmount = 0;
				let yAmount = 0;
				if (x === true) {
					const markerList = $('#marker-list');
					const extraXSpace = 10;
					if (
						window.innerWidth > 1199 ||
						markerList.hasClass('panel-visible') === true
					) {
						if (
							markerList.width() +
								markerList.offset().left +
								theElement.width() +
								xModifier +
								2 * extraXSpace /*+ 50*/ <
							window.innerWidth
						) {
							if (
								theElement.offset().left <
								markerList.width() +
									markerList.offset().left +
									extraXSpace
							) {
								xAmount =
									markerList.width() +
									markerList.offset().left -
									theElement.offset().left +
									extraXSpace;
							}
						}
					}
				}
				if (y === true) {
					if (theElement.offset().top < 0) {
						yAmount = theElement.offset().top - 15;
					}
				}
				if (xAmount !== 0 || yAmount !== 0) {
					ViewModel.setResizeListenerMapRecenter(
						model.marker().map,
						undefined,
						xAmount,
						yAmount
					);
				}
			},
			typeof time !== 'undefined' ? time : 0
		);
	}

	/**
	 * Checks if the infoWindow needs to be moved. Checks every 100 ms
	 * unless the native Google method moves the map in which case waits
	 * longer. If the user drags the map or the infoWindow closes, stops
	 * the checking.
	 * @param  {object} theElement element from binding handler - hopefully
	 *                             outer infoWindow
	 * @param  {object} model      currently selected location
	 * @param  {number} xModifier  size modifier for removing operating
	 */
	reCheckInfoWindowIsCentered(theElement, model, xModifier): void {
		let time: number | false = 100;
		if (this.regularInfoWindowPan() === true) {
			time = 600;
			this.regularInfoWindowPan(false);
		}
		if (
			this.userDrag() === true ||
			typeof this.currentlySelectedLocation() === 'undefined' ||
			this.currentlySelectedLocation() !== model
		) {
			time = false;
		}
		if (time !== false) {
			ViewModel.setResizeListenerCenterWindow(
				theElement,
				model,
				true,
				true,
				0,
				xModifier
			);
			this.currentInfoWindowCheck = setTimeout(() => {
				this.reCheckInfoWindowIsCentered(theElement, model, xModifier);
			}, time);
		}
	}

	/**
	 * Resets the filters when the reset filter button is clicked (on
	 * mobile UI); Sets minRatingButtonFilter at -1 to get around jQuery
	 * UI autocomplete bug (it's set to 0 by the binding handler);
	 * @return {[type]} [description]
	 */
	resetFilters(): void {
		this.searchQuery('');
		this.priceButtonFilter(DEFAULT_PRICE_BUTTON_FILTER.slice());
		this.minRatingButtonFilter(-1);
		this.openButtonFilter(DEFAULT_OPEN_BUTTON_FILTER);
		this.favoriteButtonFilter(DEFAULT_FAVORITE_BUTTON_FILTER);
	}
}
