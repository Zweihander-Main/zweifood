/* global google, ko, $, ResizeSensor, WebFont */
import {
	storageAvailable,
	workersAvailable,
	checkNested,
	debounce,
	throttle,
	allValuesSameInTwoArray,
	matchBasedOnName,
} from './util.ts';
import appConfigObject from './config.ts';
import LocationModel from './LocationModel.ts';

////////////////////////////
// Section IV: View Model //
////////////////////////////

/**
 * View Model for initialized google map
 * @param {object} map Google map viewModel is to use
 */
export default function(map): void {
	const self = this;
	// Initialize
	self.mainMap = map;
	// Keep track of map center for saving - is set by createMap
	self.mainMapCenter = ko.observable();
	self.service = new google.maps.places.PlacesService(self.mainMap);
	// Check if localStorage and web workers are available
	self.storageAvailable = storageAvailable('localStorage');
	self.workersAvailable = workersAvailable();
	// Get config variables that can be changed
	self.maxMarkerLimit = ko.observable(appConfigObject.maxMarkerLimit);
	self.lowMarkerOpacity = ko.observable(appConfigObject.lowMarkerOpacity);
	self.APIMappingsForModel = appConfigObject.APIMappingsForModel;
	self.APIConfiguredSearchTypes = appConfigObject.configuredSearchTypes;
	// Set default marker image object based on config object
	self.defaultMarkerImage = {
		size: new google.maps.Size(
			appConfigObject.markerImageSize[0],
			appConfigObject.markerImageSize[1]
		),
		origin: new google.maps.Point(
			appConfigObject.markerImageOrigin[0],
			appConfigObject.markerImageOrigin[1]
		),
		anchor: new google.maps.Point(
			appConfigObject.markerImageAnchor[0],
			appConfigObject.markerImageAnchor[1]
		),
	};

	// Array of models
	self.markedLocations = ko.observableArray([]);
	// Model number which iterates when a new model is created
	self.locationModelNumber = 0;
	// Set when a model is selected
	self.currentlySelectedLocation = ko.observable();
	// Set to currentlySelectedLocation when an item needs to be scrolled to
	self.scrolledItem = ko.observable();
	// Controls if an item needs to be scrolled to - handled by bindinghandler
	self.shouldScroll = ko.observable(false);
	// Array of attributions found while radar and nearby searching
	self.attributionsArray = ko.observableArray([]);
	// Array of all favorite models
	self.favoriteArray = ko.observableArray([]);
	// Array of current API calls - used to throttle calls when scrolling
	self.getRestaurantsFromGoogleMapsAPICallArray = [];
	// Object to control API calls from non-google services
	self.currentDetailedAPIInfoBeingFetched = {};
	// Observable that is set when an error comes up
	self.errors = ko.observable(false);
	// User set variable to show more verbose errors
	self.verboseErrors = ko.observable(false);
	// Bring the checkNested function into the viewModel
	self.checkNested = checkNested;
	// Track the states of the menus in mobile UI mode
	self.markerToggled = ko.observable(false);
	self.optionsToggled = ko.observable(false);
	// Stop the infoWindow move checker for the native Google method
	self.regularInfoWindowPan = ko.observable(false);
	// Stop the infoWindow move checker if the user drags
	self.userDrag = ko.observable(false);
	// Track the status of the infoWindow move checker
	self.currentInfoWindowCheck = undefined;

	// Variables for sort types and filter types
	self.sortType = ko.observable('count');
	self.searchQuery = ko.observable();
	self.priceButtonFilter = ko.observableArray(
		appConfigObject.defaultPriceButtonFilter
	);
	self.minRatingButtonFilter = ko.observable(
		appConfigObject.defaultMinRatingButtonFilter
	);
	self.openButtonFilter = ko.observable(
		appConfigObject.defaultOpenButtonFilter
	);
	self.favoriteButtonFilter = ko.observable(
		appConfigObject.defaultFavoriteButtonFilter
	);

	/**
	 * Initial HTML that gets parsed through knockout applyBindings and sets
	 * up template for infoWindow
	 * @type {String}
	 */
	self.infoWindowHTMLTemplate =
		'<div class = "info-window-template" ' +
		'data-bind = "infoWindowTemplate: true"></div>';

	/**
	 * Subscribe to lowMarkerOpacity user set variable to set all markers to
	 * new opacity
	 */
	self.lowMarkerOpacity.subscribe(function(newValue) {
		newValue = Number(newValue).toFixed(2) / 1;
		ko.utils.arrayForEach(self.markedLocations(), function(item) {
			if (item.isListed() === false) {
				item.marker().setOpacity(newValue);
			}
		});
	});

	self.lowMarkerOpacity.extend({
		numeric: 2,
	});

	// When map center changes, save it to localstorage
	self.mainMapCenter.subscribe(function(newValue) {
		self.setLocalStorage(
			'mapCenter',
			JSON.stringify({
				lat: newValue.lat(),
				lng: newValue.lng(),
				zoom: self.mainMap.getZoom(),
			})
		);
	});

	/**
	 * Subscribe to markedLocations to start removing locations if the
	 * maxMarkerLimit is exceeded
	 */
	self.markedLocations.subscribe(function(newValue) {
		if (newValue.length > self.maxMarkerLimit()) {
			self.removeMultipleLocations(newValue);
		}
	});

	// Subscribe to favoriteArray to save it to localStorage at intervals
	self.favoriteArray.subscribe(function(newValue) {
		const favoritesArray = [];
		ko.utils.arrayForEach(newValue, function(item) {
			favoritesArray.push(self.modelDeconstructor(item));
		});
		const favoritesString = JSON.stringify(favoritesArray);
		if (favoritesArray.length !== 0) {
			self.setLocalStorage('favoritesArray', favoritesString);
		} else {
			self.setLocalStorage('favoritesArray', '[]');
		}
	});

	// Prevent frequent calls to localStorage
	self.favoriteArray.extend({
		rateLimit: 2000,
	});

	/**
	 * Subscribe to currentlySelectedLocation and call scrollToItem on
	 * change. Stop the infoWindow move listener.
	 */
	self.currentlySelectedLocation.subscribe(
		debounce(function(newValue) {
			if (typeof newValue !== 'undefined') {
				self.scrollToItem();
				self.userDrag(false);
			}
		}, 5)
	);

	// Computed array of all IDs and nearby/places search only ids
	self.idArray = ko.pureComputed(function() {
		const returnArray = {
			all: [],
			nearby: [],
		};
		ko.utils.arrayMap(self.markedLocations(), function(item) {
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
	self.priceButtonFilterHasChanged = ko.pureComputed(function() {
		return !allValuesSameInTwoArray(self.priceButtonFilter(), [
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
	self.listableEntries = ko.computed(function() {
		const returnArray = {
			entries: [],
			allNames: [],
		};
		returnArray.entries = ko.utils.arrayFilter(
			self.markedLocations(),
			function(item) {
				if (
					(item.googleSearchType() === 'Nearby' ||
						item.googleSearchType() === 'Places') &&
					item.isInViewOnMap() === true &&
					self.isSearchFiltered(item) === false &&
					self.isButtonFiltered(item) === false
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
	self.sortedEntries = ko.pureComputed(function() {
		const returnArray = self.listableEntries().entries;
		if (self.sortType() === 'count') {
			returnArray.sort(function(left, right) {
				return left.modelNumber < right.modelNumber ? -1 : 1;
			});
		} else if (self.sortType() === 'alpha') {
			returnArray.sort(function(left, right) {
				return left.google_name() === right.google_name()
					? 0
					: left.google_name() < right.google_name()
					? -1
					: 1;
			});
		} else if (self.sortType() === 'rating') {
			// Sort undefined to the end of the list
			returnArray.sort(function(left, right) {
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
		} else if (self.sortType() === 'distance') {
			returnArray.sort(function(left, right) {
				const x1 = left.google_geometry().location.lat();
				const x2 = right.google_geometry().location.lat();
				const x3 = self.mainMapCenter().lat();
				const y1 = left.google_geometry().location.lng();
				const y2 = right.google_geometry().location.lng();
				const y3 = self.mainMapCenter().lng();
				const dist1 = appConfigObject.distanceBetweenTwoPointsInMeters(
					x1,
					y1,
					x3,
					y3
				);
				const dist2 = appConfigObject.distanceBetweenTwoPointsInMeters(
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
	self.listableEntries.extend({
		rateLimit: 50,
	});

	/**
	 * Function to setup informational API calls tracker object
	 * Object is structured as:
	 * {service: {
	 * 			type of call (basic/detailed/ect.): [models]
	 * 			}
	 * 	}
	 */
	self.initializeCurrentDetailedAPIInfoBeingFetched = function(): void {
		/**
		 * Find if model is currently being fetched using service and method
		 * @param  {string} service name of api service
		 * @param  {string} type    type of call (basic/detailed/ect.)
		 * @param  {object} ID      model to lookup
		 * @return {number}         index of model or -1 if not found
		 */
		self.currentDetailedAPIInfoBeingFetched.findID = function(
			service,
			type,
			ID
		): number {
			return this[service][type].indexOf(ID);
		};
		/**
		 * Push model to array when it's being called using service and
		 * method
		 * @param  {string} service name of api service
		 * @param  {string} type    type of call
		 * @param  {object} ID      model to push in
		 */
		self.currentDetailedAPIInfoBeingFetched.pushID = function(
			service,
			type,
			ID
		): void {
			this[service][type].push(ID);
			this[service][type][this[service][type].length - 1][
				service + 'IsLoading'
			](true);
		};
		/**
		 * Remove model from array after particular service/method call is
		 * finished. Also check if in intercept array in which case, call
		 * intercept array function (for example, a detailed intercept
		 * would be waiting for a basic call first)
		 * @param  {string} service name of api service
		 * @param  {string} type    type of call
		 * @param  {object} ID      model to remove
		 */
		self.currentDetailedAPIInfoBeingFetched.removeID = function(
			service,
			type,
			ID
		): void {
			const index = this.findID(service, type, ID);
			if (index > -1) {
				this[service][type][index][service + 'IsLoading'](false);
				this[service][type].splice(index, 1);
			}
			for (let i = 0, len = this.intercept.length; i < len; i++) {
				if (this.intercept[i].ID === ID) {
					self.getDetailedAPIData(
						this.intercept[i].service,
						this.intercept[i].ID
					);
					this.intercept.splice(i, 1);
				}
			}
		};
		// Intercept array for when a call is waiting on another call
		self.currentDetailedAPIInfoBeingFetched.intercept = [];
		/**
		 * Push a call that is waiting for another call
		 * @param  {string} service name of api service
		 * @param  {string} type    type of call to be called when previous
		 *                          call is finished
		 * @param  {object} ID      model to call
		 * @return {}               returns if call is already in place
		 */
		self.currentDetailedAPIInfoBeingFetched.interceptIDPush = function(
			service,
			type,
			ID
		): void {
			for (let i = 0, len = this.intercept.length; i < len; i++) {
				if (this.intercept.ID === ID) {
					return;
				}
			}
			this.intercept.push({
				ID: ID,
				type: type,
				service: service,
			});
		};
		/**
		 * Remove call from intercept array (for a failed previous call)
		 * @param  {object} ID      model to remove
		 */
		self.currentDetailedAPIInfoBeingFetched.interceptIDRemove = function(
			ID
		): void {
			for (let i = 0, len = this.intercept.length; i < len; i++) {
				if (this.intercept.ID === ID) {
					this.intercept.splice(i, 1);
				}
			}
		};
		// Setup arrays for basic and detailed calls for all services
		for (
			let i = 0, len = self.APIConfiguredSearchTypes.length;
			i < len;
			i++
		) {
			self.currentDetailedAPIInfoBeingFetched[
				self.APIConfiguredSearchTypes[i]
			] = {
				basic: [],
				detailed: [],
			};
		}
		self.currentDetailedAPIInfoBeingFetched.google = {
			detailed: [],
		};
	};

	/**
	 * Called from model when it's listed to change the
	 * currentlySelectedLocation
	 * @param  {boolean} newValue isListed subscribed value
	 * @param  {object} model     model which changed
	 */
	self.changeCurrentlySelectedItem = function(newValue, model): void {
		if (newValue === true) {
			self.currentlySelectedLocation(model);
		} else {
			self.currentlySelectedLocation(undefined);
		}
	};

	/**
	 * Called from model when it's favorited to updated favoriteArray
	 * @param  {boolean} newValue isFavorite subscribed value
	 * @param  {object} model     model which changed
	 */
	self.changeFavoriteArray = function(newValue, model): void {
		if (newValue === true) {
			self.favoriteArray.push(model);
		} else {
			self.favoriteArray.remove(model);
		}
	};

	/**
	 * Function called when an infoWindow handles a closeclick
	 * event - sets the currentlySelectedLocation to not selected
	 */
	self.markerCloseClick = function(): void {
		if (typeof self.currentlySelectedLocation() !== 'undefined') {
			self.currentlySelectedLocation().hasBeenOpened = false;
			self.currentlySelectedLocation().isSelected(false);
		}
	};

	/**
	 * Function called when an infoWindow handles a domReady event - sets
	 * up infoWindow with content if it doesn't have it already.
	 * Called every time the marker is clicked as of API 3.23 as window
	 * needs to be re-rendered
	 */
	self.markerDomReady = function(): void {
		if (!self.currentlySelectedLocation().hasBeenOpened) {
			ko.applyBindings(
				self,
				self.currentlySelectedLocation().infoWindow.getContent()
			);
			self.currentlySelectedLocation().hasBeenOpened = true;
		}
	};

	/**
	 * Function called when an infoWindow handles a click event -
	 * sets the markerList to scroll to this model,
	 * starts the data fetching process with Google Places API, closes
	 * previous info and opens this one, sets markerAnimation going
	 * @param  {object} model model that contains infowindow
	 */
	self.markerClick = function(model): void {
		/* Change in API as of 3.23: infoWindow needs to be forced to
												re-render if marker is re-clicked */
		if (model.hasBeenOpened === true) {
			model.hasBeenOpened = false;
		}
		self.shouldScroll(true);
		self.getDetailedGooglePlacesAPIInfo(model, self.callSearchAPIs);
		if (typeof self.currentlySelectedLocation() !== 'undefined') {
			self.currentlySelectedLocation().infoWindow.close();
			self.currentlySelectedLocation().isSelected(false);
		}
		model.isSelected(true);
		self.markerAnimation(model);
		model.infoWindow.open(model.marker().map, model.marker());
	};

	/**
	 * Function called from markerClick that animates one frame of bouncing
	 * animation
	 * @param  {model} loc  model with marker to animate
	 */
	self.markerAnimation = function(loc): void {
		loc.marker().setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function() {
			loc.marker().setAnimation(null);
		}, 750);
	};

	/**
	 * Called to pick an icon when isFavorite or priceLevel is changed
	 * on a model
	 * @param  {Boolean} isFavorite model's isFavorite property
	 * @param  {number}  priceLevel model's google_priceLevel property
	 * @return {object}             markerObject that can be fed into icon
	 *                              property of marker
	 */
	self.markerImageCreator = function(isFavorite, priceLevel): void {
		const markerObject = self.defaultMarkerImage;
		if (isFavorite === true) {
			markerObject.url = appConfigObject.markerImageURLFav;
			return markerObject;
		}
		switch (priceLevel) {
			case 1:
				markerObject.url = appConfigObject.markerImageURL1;
				return markerObject;
			case 2:
				markerObject.url = appConfigObject.markerImageURL2;
				return markerObject;
			case 3:
				markerObject.url = appConfigObject.markerImageURL3;
				return markerObject;
			case 4:
				markerObject.url = appConfigObject.markerImageURL4;
				return markerObject;
			default:
				markerObject.url = appConfigObject.markerImageURLEmpty;
				return markerObject;
		}
	};

	/**
	 * Get browser location and send it to panning function
	 */
	self.getNavWithCallback = function(): void {
		if (navigator.geolocation) {
			return navigator.geolocation.getCurrentPosition(
				self.mapPanFromNavigation
			);
		} else {
			return false;
		}
	};

	/**
	 * Pan to given position from browser navigation. Close infoWindow
	 * and options window.
	 * @param  {object} position browser position coordinates
	 */
	self.mapPanFromNavigation = function(position): void {
		self.mapPan(position.coords.latitude, position.coords.longitude);
		self.markerCloseClick();
		self.optionsToggled(false);
	};

	/**
	 * Pans to map to the given coordinates
	 * @param  {number} lat latitude
	 * @param  {number} lng longitude
	 */
	self.mapPan = function(lat, lng): void {
		const userLatLng = new google.maps.LatLng(lat, lng);
		self.mainMap.panTo(userLatLng);
	};

	/**
	 * Takes a model and adds observables as defined in config object
	 * @param  {object} model model to add observables to
	 */
	self.modelConstructor = function(model): void {
		for (const prop in self.APIMappingsForModel) {
			const currentType = self.APIMappingsForModel[prop];
			for (let i = 0, len = currentType.length; i < len; i++) {
				if (currentType[i].oType === 1) {
					model[currentType[i].model] = ko.observable();
				} else if (currentType[i].oType === 2) {
					model[currentType[i].model] = ko.observableArray([]);
				}
			}
		}
	};

	/**
	 * Takes a model and returns just the data in javascript object format
	 * Knockout's built in function for this was having trouble
	 * @param  {object} model model to convert into javascript object
	 *                        without function
	 * @return {object}       javascript object representation of model
	 *                        (without functions/ect.)
	 */
	self.modelDeconstructor = function(model): void {
		const returnModel = {};
		for (const prop in self.APIMappingsForModel) {
			const currentType = self.APIMappingsForModel[prop];
			for (let i = 0, len = currentType.length; i < len; i++) {
				if (currentType[i].oType === 0) {
					returnModel[currentType[i].model] =
						model[currentType[i].model];
				} else {
					returnModel[currentType[i].model] = model[
						currentType[i].model
					]();
				}
			}
		}
		return returnModel;
	};

	/**
	 * Takes the model, data from the api server, and updates the
	 * observables of that model with the data from the server
	 * @param  {object} model  model to update
	 * @param  {string} type   which api type/source was used
	 * @param  {object} result result from server, mapped using config object
	 */
	self.modelUpdater = function(model, type, result): void {
		const currentType = self.APIMappingsForModel[type];
		for (let i = 0, len = currentType.length; i < len; i++) {
			if (typeof result[currentType[i].server] !== 'undefined') {
				if (currentType[i].oType !== 0) {
					model[currentType[i].model](result[currentType[i].server]);
				} else {
					model[currentType[i].model] = result[currentType[i].server];
				}
			}
		}
	};

	/**
	 * Takes a model from localStorage and rebuilds it using the saved data
	 * @param  {object} model     model to update
	 * @param  {object} blueprint data from localStorage
	 * @param  {object} location  google_geometry.location object from
	 *                            localStorage
	 */
	self.modelRebuilder = function(model, blueprint, location): void {
		for (const prop in self.APIMappingsForModel) {
			const currentType = self.APIMappingsForModel[prop];
			for (let i = 0, len = currentType.length; i < len; i++) {
				if (
					currentType[i].oType !== 0 &&
					currentType[i].model !== 'google_geometry'
				) {
					model[currentType[i].model](
						blueprint[currentType[i].model]
					);
				} else if (currentType[i].model === 'google_geometry') {
					const geometryBlueprint = blueprint[currentType[i].model];
					geometryBlueprint.location = location;
					model[currentType[i].model](geometryBlueprint);
				} else {
					model[currentType[i].model] =
						blueprint[currentType[i].model];
				}
			}
		}
	};

	/**
	 * Takes a model and adds in API searchType and isLoading observables
	 * for all api types
	 * @param  {object} model model to add observables to
	 */
	self.modelSearchTypeConstructor = function(model): void {
		for (
			let i = 0, len = self.APIConfiguredSearchTypes.length;
			i < len;
			i++
		) {
			model[
				self.APIConfiguredSearchTypes[i].toLowerCase() + 'SearchType'
			] = ko.observable('None');
			model[
				self.APIConfiguredSearchTypes[i].toLowerCase() + 'IsLoading'
			] = ko.observable(false);
		}
	};

	/**
	 * Function to remove references and dispose of multiple locations when
	 * max location limit has been reached - called from markedLocations
	 * subscriber
	 * @param  {Array}  newValue       newValue of markedLocations array
	 */
	self.removeMultipleLocations = throttle(
		function(newValue) {
			//Push favorite to front
			self.markedLocations.sort(function(left, right) {
				return left.isFavorite() === true
					? 1
					: left.modelNumber < right.modelNumber
					? -1
					: 1;
			});
			for (
				let i = 0;
				i < appConfigObject.markerLimitRemoveBulkAmount;
				i++
			) {
				newValue[i].dispose();
			}
			self.markedLocations.splice(
				0,
				appConfigObject.markerLimitRemoveBulkAmount
			);
		},
		1000,
		{
			trailing: false,
		}
	);

	/**
	 * Called when a model is created, iterates locationModelNumber when
	 * called. Allows for sorting models by when they were recieved
	 * @return {number} number to assign model
	 */
	self.getLocationModelNumber = function(): void {
		self.locationModelNumber++;
		return self.locationModelNumber - 1;
	};

	/**
	 * Function called to set localStorage with desired properties -
	 * throttled to avoid too many calls at once
	 * @param  {string} name                name of property to set
	 * @param  {string} item)               value of property to set
	 */
	self.setLocalStorage = throttle(
		function(name, item) {
			if (self.storageAvailable === true) {
				localStorage.setItem(name, item);
			}
		},
		1000,
		{
			trailing: false,
		}
	);

	/**
	 * Function to create a limited copy of some listableEntries properties
	 * to pass to web workers
	 * @return {array} array of limited-info models
	 */
	self.locationArrayForWorkers = function(): Array<object> {
		return ko.utils.arrayMap(self.listableEntries().entries, function(
			item
		) {
			return {
				lat: item.google_geometry().location.lat(),
				lng: item.google_geometry().location.lng(),
				name: item.google_name(),
				google_placeId: item.google_placeId,
			};
		});
	};

	/**
	 * Function to check if a model is filtered by the current searchQuery
	 * observable the user has entered
	 * @param  {object}  item model to check
	 * @return {Boolean}      if the model is filtered by the query
	 */
	self.isSearchFiltered = function(item): boolean {
		if (typeof self.searchQuery() !== 'undefined') {
			if (
				item
					.google_name()
					.toLowerCase()
					.indexOf(self.searchQuery().toLowerCase()) >= 0
			) {
				return false;
			} else {
				return true;
			}
		} else {
			return false;
		}
	};

	/**
	 * Function to check if a model is filtered by the current button
	 * filters the user has selected
	 * @param  {object}  item model to check
	 * @return {Boolean}      if the model is filtered by the filters
	 *                        selected
	 */
	self.isButtonFiltered = function(item): boolean {
		if (self.priceButtonFilterHasChanged() === true) {
			if (typeof item.google_priceLevel() !== 'undefined') {
				for (let i = 0; i < 5; i++) {
					if (self.priceButtonFilter()[i] !== true) {
						if (item.google_priceLevel() === i) {
							return true;
						}
					}
				}
				// 0 button should be the only one which filters undefined
			} else {
				if (self.priceButtonFilter()[0] !== true) {
					return true;
				}
			}
		}
		if (self.minRatingButtonFilter() !== 0) {
			if (typeof item.google_rating() !== 'undefined') {
				if (item.google_rating() < self.minRatingButtonFilter()) {
					return true;
				}
			} else {
				return true;
			}
		}
		if (self.openButtonFilter() !== false) {
			if (item.isItOpenRightNow() !== 'Open') {
				return true;
			}
		}
		if (self.favoriteButtonFilter() !== false) {
			if (item.isFavorite() !== true) {
				return true;
			}
		}

		return false;
	};

	/**
	 * If a location is selected and shouldScroll is enabled, scroll to that
	 * location and keep scroll locked to it even if new models are added to
	 * the marker list
	 */
	self.scrollToItem = function(): void {
		if (
			typeof self.currentlySelectedLocation() !== 'undefined' &&
			self.shouldScroll() === true
		) {
			self.scrolledItem(self.currentlySelectedLocation());
		}
	};

	/**
	 * Parse the initial HTML which will be inserted into an infoWindow
	 * and which will then call the infoWindow template when applyBindings
	 * is called on it
	 * @return {object} HTML nodes of the initial insertion content
	 */
	self.makeInfoWindowContent = function(): void {
		let html = self.infoWindowHTMLTemplate;
		html = $.parseHTML(html)[0];
		return html;
	};

	/**
	 * Called everytime the bounds change to check all the markedLocations
	 * markers to see if they're on the map. Sets the isInViewOnMap of those
	 * marker.
	 * @param  {object} currentBounds map.getBounds() from google API
	 */
	self.checkIfOnMap = function(currentBounds): void {
		ko.utils.arrayForEach(self.markedLocations(), function(item) {
			if (
				currentBounds.contains(item.google_geometry().location) ===
				false
			) {
				item.isInViewOnMap(false);
			} else {
				item.isInViewOnMap(true);
			}
		});
	};

	/**
	 * Compare a google_placeId to all markedLocations models and return
	 * the first model that matches or null
	 * @param  {string} iDToCompare google_placeId to use as comparison
	 * @return {object/null}        return model if found, null if not
	 */
	self.compareIDs = function(iDToCompare): object | null {
		return ko.utils.arrayFirst(self.markedLocations(), function(item) {
			return item.google_placeId === iDToCompare;
		});
	};

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
	self.successAPIFunction = function(
		results,
		selectedPlace,
		setResultSearchType,
		service,
		clonedMarkedLocations,
		initialPoint,
		workerHandler
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
				self.modelUpdater(selectedPlace, service, results[match]);
				results.splice(match, 1);
			} else {
				setResultSearchType(selectedPlace, 'Not Found');
				self.failAPIFunction(
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
				maxDistance: appConfigObject.latLngAccuracy,
				service: service,
				minFuzzyMatch: appConfigObject.minFuzzyMatch,
				workerHandler: workerHandler,
			};

			self.workerHandler(workerArray, service, setResultSearchType);
		} else {
			setResultSearchType(selectedPlace);
			self.modelUpdater(selectedPlace, service, results);
		}
	};

	/**
	 * Creates an error that is shown to the user (or not if verbose and
	 * verbose is turned off). Converts some Google errors into more
	 * readable and useful information.
	 * @param  {string} customMessage Custom message to accompany error
	 * @param  {string} textStatus    Text of the error
	 * @param  {object} errorThrown   Error object thrown - optional
	 * @param  {boolean} verbose      If the error is verbose or not
	 */
	self.failAPIFunction = function(
		customMessage,
		textStatus,
		errorThrown,
		verbose
	): void {
		if (typeof verbose === 'undefined') {
			verbose = false;
		}
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
		const errorObject = {};
		errorObject.customMessage = customMessage;
		errorObject.textStatus = customTextStatus;
		errorObject.verbose = verbose;
		errorObject.killOnMarkers = killOnMarkers;
		self.errors(errorObject);
		if (errorThrown) {
			console.warn(errorThrown);
		}
	};

	/**
	 * Function to call a type of API's detailed data (used when switching
	 * tabs in infoWindow). Will check if a basic call is already in
	 * progress and will schedule the call after the basic data comes back.
	 * This is neccessary as all detailed calls will tend to require an ID
	 * which is acquired from the basic call.
	 * @param  {string} service       name of API to call
	 * @param  {object} selectedPlace model to update with data
	 */
	self.getDetailedAPIData = function(service, selectedPlace): void {
		if (selectedPlace.searchType(service)() === 'None') {
			if (
				self.currentDetailedAPIInfoBeingFetched.findID(
					service,
					'basic',
					selectedPlace
				) === -1
			) {
				self.callBasicAPIData(service, selectedPlace);
			}
			self.currentDetailedAPIInfoBeingFetched.interceptIDPush(
				service,
				'detailed',
				selectedPlace
			);
		} else if (selectedPlace.searchType(service)() === 'Basic') {
			if (
				self.currentDetailedAPIInfoBeingFetched.findID(
					service,
					'detailed',
					selectedPlace
				) === -1
			) {
				self.currentDetailedAPIInfoBeingFetched.pushID(
					service,
					'detailed',
					selectedPlace
				);
				self.callAPIInfo('detailed', service, selectedPlace);
			}
		}
	};

	/**
	 * Calls basic API's for all services when an infoWindow is opened.
	 * Creates a markedLocations clone to pass to webWorkers to parse
	 * through. Does not call if a basic API call is already in progress
	 * or completed previously for a particular service.
	 * @param  {object} currentLoc model to update with info
	 */
	self.callSearchAPIs = function(currentLoc): void {
		const clonedMarkedLocations = ko.toJS(self.locationArrayForWorkers());
		for (
			let i = 0, len = self.APIConfiguredSearchTypes.length;
			i < len;
			i++
		) {
			const currentServiceType = self.APIConfiguredSearchTypes[i];
			if (currentLoc.searchType(currentServiceType)() === 'None') {
				if (
					self.currentDetailedAPIInfoBeingFetched.findID(
						currentServiceType,
						'basic',
						currentLoc
					) === -1
				) {
					self.callBasicAPIData(
						currentServiceType,
						currentLoc,
						clonedMarkedLocations
					);
				}
			}
		}
	};

	/**
	 * Call basic API of a given service for a given model
	 * @param  {string} service               service to call API for
	 * @param  {object} selectedPlace         model to update
	 * @param  {object} clonedMarkedLocations clone of markedLocations for
	 *                                        web workers
	 */
	self.callBasicAPIData = function(
		service,
		selectedPlace,
		clonedMarkedLocations
	): void {
		if (typeof clonedMarkedLocations === 'undefined') {
			clonedMarkedLocations = ko.toJS(self.locationArrayForWorkers());
		}
		self.currentDetailedAPIInfoBeingFetched.pushID(
			service,
			'basic',
			selectedPlace
		);
		self.callAPIInfo(
			'basic',
			service,
			selectedPlace,
			clonedMarkedLocations
		);
	};

	/**
	 * Adds any found attributions for generalized results to an attributions
	 * array that displays in the credits modal
	 * @param  {array} attributionsArray array of attributions found
	 */
	self.checkAndAddFullAttributions = function(attributionsArray): void {
		const attributionsToPush = [];
		for (let z = 0, len = attributionsArray.length; z < len; z++) {
			if (self.attributionsArray.indexOf(attributionsArray[z]) === -1) {
				attributionsToPush.push(attributionsArray[z]);
			}
		}
		self.attributionsArray.push(...attributionsToPush);
	};

	/**
	 * Process the results from a nearby Google search. Paginates if there
	 * are more pages and the map hasn't panned.
	 * @param  {object} results        results object from server
	 * @param  {object} status         status object from server
	 * @param  {object} pagination     pagination object from server
	 * @param  {number} callArrayIndex index of google call array of
	 *                                 current set of calls
	 */
	self.processNearbyResults = function(
		results,
		status,
		pagination,
		callArrayIndex
	): void {
		if (status !== google.maps.places.PlacesServiceStatus.OK) {
			self.failAPIFunction('Google Maps Nearby Search Error', status);
			return;
		} else {
			// Add all markers and push at once into markedLocations for performance
			const markerList = [];
			for (let i = 0, len = results.length; i < len; i++) {
				// If marker as nearby or places searchType doesn't exist
				if (self.idArray().nearby.indexOf(results[i].place_id) === -1) {
					// If marker doesn't exist, create new
					if (
						self.idArray().all.indexOf(results[i].place_id) === -1
					) {
						const newLoc = new LocationModel(self, 'Nearby');
						self.successAPIFunction(
							results[i],
							newLoc,
							function() {
								return;
							},
							'google'
						);
						markerList.push(newLoc);
					} else {
						// Marker exists as radar, simply update
						const matchedLocation = self.compareIDs(
							results[i].place_id
						);
						if (matchedLocation) {
							self.successAPIFunction(
								results[i],
								matchedLocation,
								self.setAPIResultSearchType('Nearby', 'google')
									.setSearchType,
								'google'
							);
						}
					}
					if (results[i].html_attributions.length !== 0) {
						self.checkAndAddFullAttributions(
							results[i].html_attributions
						);
					}
				}
			}
			self.markedLocations.push(...markerList);
			if (pagination && pagination.hasNextPage) {
				setTimeout(function() {
					if (
						self.getRestaurantsFromGoogleMapsAPICallArray[
							callArrayIndex
						] === true
					) {
						pagination.nextPage();
					}
				}, 2000);
			}
		}
	};

	/**
	 * Process the results from a radar Google search.
	 * @param  {object} results results from server
	 * @param  {object} status  status object from server
	 */
	self.processRadarResults = function(results, status): void {
		if (status !== google.maps.places.PlacesServiceStatus.OK) {
			self.failAPIFunction('Google Maps Radar Search Error', status);
			return;
		} else {
			/**
			 * Add all markers and push at once into markedLocations
			 *  for performance
			 */
			const markerList = [];
			for (let i = 0, len = results.length; i < len; i++) {
				// If marker doesn't exist yet, create
				if (self.idArray().all.indexOf(results[i].place_id) === -1) {
					const newLoc = new LocationModel(self, 'Radar');
					self.successAPIFunction(
						results[i],
						newLoc,
						function() {
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
					self.checkAndAddFullAttributions(
						results[i].html_attributions
					);
				}
			}
			self.markedLocations.push(...markerList);
		}
	};

	/**
	 * Function called to populate map markers with data from google -
	 * called initially and on map pan
	 * @param  {number} callArrayIndex index of the current call in the
	 *                                 google call array - if true,
	 *                                 pagination of radar results should
	 *                                 continue. if not, map has panned and
	 *                                 pagination should cancel.
	 */
	self.getRestaurantsFromGoogleMapsAPI = function(callArrayIndex): void {
		const currentMapBounds = self.mainMap.getBounds();

		// Only search in current bounds and for restaurants
		const request = {
			rankby: 'distance',
			bounds: currentMapBounds,
			type: 'restaurant',
		};

		// Call radar and nearby search
		// self.service.radarSearch(request, self.processRadarResults);
		self.service.nearbySearch(request, function(
			results,
			status,
			pagination
		) {
			self.processNearbyResults(
				results,
				status,
				pagination,
				callArrayIndex
			);
		});
	};

	/**
	 * Get detailed info on a place from google API when infoWindow is
	 * opened
	 * @param  {object}   selectedPlace model to update
	 * @param  {Function} callback      callback function - usually to call
	 *                                  other search APIs when this is
	 *                                  finished. Needs to be synced like
	 *                                  that as this could be fetching
	 *                                  data for a radar place which has
	 *                                  no discernable information to match
	 *                                  against for the other APIs.
	 */
	self.getDetailedGooglePlacesAPIInfo = function(
		selectedPlace,
		callback
	): void {
		if (
			self.currentDetailedAPIInfoBeingFetched.findID(
				'google',
				'detailed',
				selectedPlace
			) === -1
		) {
			self.currentDetailedAPIInfoBeingFetched.pushID(
				'google',
				'detailed',
				selectedPlace
			);

			self.service.getDetails(
				{
					placeId: selectedPlace.google_placeId,
				},
				function(result, status) {
					self.currentDetailedAPIInfoBeingFetched.removeID(
						'google',
						'detailed',
						selectedPlace
					);
					if (status !== google.maps.places.PlacesServiceStatus.OK) {
						self.failAPIFunction(
							'Google Places Search Error',
							status
						);
						return;
					}
					self.successAPIFunction(
						result,
						selectedPlace,
						self.setAPIResultSearchType('Places', 'google')
							.setSearchType,
						'google'
					);
					callback(selectedPlace);
				}
			);
		}
	};

	/**
	 * Function constructor object that takes in type and service to
	 * create a setSearchType function to be passed into success
	 * function and more importantly, passed into workers. Makes inputs
	 * private. Is not very memory efficient but doesn't need to be for
	 * this use case.
	 * @param {string}    type          type of search
	 * @param {string}    service       api being searched
	 * @return {function} setSearchType constructed function to pass
	 */
	self.setAPIResultSearchType = function(
		type,
		service
	): (result: object, override: string) => object {
		const inputs = {
			type: type,
			service: service,
		};
		/**
		 * Set the search type of a model
		 * @param {object} result   model to be set
		 * @param {string} override override if not found for matching
		 */
		function setSearchType(result, override): object {
			const toSet = inputs.type.toProperCase();
			if (override) {
				toSet = override;
			}
			result.searchType(inputs.service)(toSet);
		}
		return {
			setSearchType: setSearchType,
		};
	};

	/**
	 * Function that can call the API's defined in the config object. Uses
	 * jQuery.ajax to handle success and error.
	 * Was easier to create one function than 3+ seperate ones as it makes
	 * adding API's easier and making success/modifying cases consistent.
	 * @param  {string}   APIType               type of search
	 * @param  {string}   service               name of api to call
	 * @param  {object}   selectedPlace         model to update
	 * @param  {object}   clonedMarkedLocations clone of listable locations
	 *                                          for worker object
	 * @param  {Function} callback              callback function that is
	 *                                          called when the initial call
	 *                                          is sent out
	 */
	self.callAPIInfo = function(
		APIType,
		service,
		selectedPlace,
		clonedMarkedLocations,
		callback
	): void {
		/**
		 * Object with the following properties:
		 * settings 			settings for jQuery ajax call
		 * basicExtraParameters parameters to parse through for call,
		 * 						can include functions which will be fed
		 * 						lat, lng parameters
		 * allExtraParameters   object of parameters to add at the end,
		 * 					    if function, will be fed url and all
		 * 					    previous parameters
		 * basic_url            url for basic searches
		 * detailed_url         url for detailed searches
		 * extraSlash           optional, adds extra slash after detailed id
		 * basic_returnType     string or array of strings that define where
		 * 						the results array for parsing is located
		 * 						in the results
		 * workerHandler        object to be parsed by the worker for api
		 *  					specific instructions
		 * @type {object}
		 */
		const configObject = appConfigObject[service + '_searchAPIProperties'];
		const settings = configObject.settings;
		let lat, lng, initialPoint;
		settings.url = configObject[APIType + '_URL'];
		// Just call the ID of the model
		if (APIType !== 'basic') {
			settings.url += selectedPlace[service + '_id']();
			if (configObject.extraSlash === true) {
				settings.url += '/';
			}
		}
		// Create search request that searches nearby the model
		if (APIType === 'basic') {
			lat = selectedPlace.google_geometry().location.lat();
			lng = selectedPlace.google_geometry().location.lng();
			initialPoint = {
				lat: lat,
				lng: lng,
			};
			for (const name2 in configObject.basicExtraParameters) {
				if (
					typeof configObject.basicExtraParameters[name2] ===
					'function'
				) {
					settings.data[name2] = configObject.basicExtraParameters[
						name2
					](lat, lng);
				} else {
					settings.data[name2] =
						configObject.basicExtraParameters[name2];
				}
			}
		}
		// For oauth
		for (const name1 in configObject.allExtraParameters) {
			settings.data[name1] = configObject.allExtraParameters[name1](
				settings.url,
				settings.data
			);
		}

		/**
		 * Success function passed with the jQuery call, parses through
		 * results and calls success or failure depending on if parse
		 * if successful
		 * @param  {object} results results from call
		 */
		settings.success = function(results): void {
			let theResult = results;
			/**
			 * Parse through the results until the array of result objects
			 *  is found
			 */
			if (typeof configObject[APIType + '_returnType'] === 'object') {
				for (
					let i = 0,
						len = configObject[APIType + '_returnType'].length;
					i < len;
					i++
				) {
					theResult =
						theResult[configObject[APIType + '_returnType'][i]];
				}
			} else if (
				typeof configObject[APIType + '_returnType'] !== 'undefined'
			) {
				theResult = theResult[configObject[APIType + '_returnType']];
			} else {
				theResult = results;
			}
			//Success/fail in finding array of result objects
			if (typeof theResult !== 'undefined') {
				self.successAPIFunction(
					theResult,
					selectedPlace,
					self.setAPIResultSearchType(APIType, service).setSearchType,
					service,
					clonedMarkedLocations,
					initialPoint,
					configObject.workerHandler
				);
			} else {
				self.currentDetailedAPIInfoBeingFetched.interceptIDRemove(
					selectedPlace
				);
				console.debug(results);
				self.failAPIFunction(
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
		 * @param  {object} errorThrown error object from jQuery
		 */
		settings.error = function(jqXHR, textStatus, errorThrown): void {
			self.currentDetailedAPIInfoBeingFetched.interceptIDRemove(
				selectedPlace
			);
			self.failAPIFunction(
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
		 * removing model from api calls management object
		 * @param  {object} jqXHR      jqXHR object from jQuery
		 * @param  {string} textStatus textStatus string from jQuery
		 */
		settings.complete = function(): void {
			self.currentDetailedAPIInfoBeingFetched.removeID(
				service,
				APIType,
				selectedPlace
			);
		};

		$.ajax(settings);

		if (typeof callback === 'function') {
			callback();
		}
	};

	/**
	 * Take a google photo object and get its URL
	 * @param  {object} photoObject google photo object from API
	 * @param  {object} parameter   parameter to ask for from API ie
	 *                              {maxWidth: 300}
	 * @return {string}             url of photo or empty string
	 */
	self.getGooglePhotoURL = function(photoObject, parameter): string {
		if (typeof photoObject.getUrl === 'function') {
			return photoObject.getUrl(parameter);
		} else {
			return '';
		}
	};

	/**
	 * Declares input undefined, useful for ensuring web workers are
	 * fully killed
	 * @param  {object} toClear likely a web worker which has finished
	 */
	self.avoidMemeoryLeaksDueToEventListeners = function(toClear): void {
		toClear = undefined;
		return toClear;
	};

	/**
	 * Handles creating web workers, recieving data from them, and
	 * ending them. Updates model for every matched location.
	 * @param  {object} workerObject     successAPIFunction worker object to
	 *                                   be passed to the worker
	 * @param  {string} service          name of API called
	 * @param  {function} resultFunction function to call to set search type
	 *                                   when match is found
	 */
	self.workerHandler = function(workerObject, service, resultFunction): void {
		if (self.workersAvailable === true) {
			const worker = new Worker('/js/workerFillMarkerData.ts'); // TODO
			worker.onmessage = function(e): void {
				const returnObject = e.data;
				for (let i = 0, len = returnObject.length; i < len; i++) {
					const matchedLocation = self.compareIDs(
						returnObject[i].google_placeId
					);
					resultFunction(matchedLocation);
					self.modelUpdater(
						matchedLocation,
						service,
						returnObject[i]
					);
				}
				// Worker should kill itself but make sure
				self.avoidMemeoryLeaksDueToEventListeners(worker);
			};
			worker.postMessage(workerObject);
		}
	};

	/**
	 * Retrieve data from localStorage, parse through, create models from it,
	 * and set center of map if defined.
	 */
	self.getLocalStorage = function(): void {
		if (self.storageAvailable === true) {
			if (localStorage.getItem('favoritesArray')) {
				const favArray = JSON.parse(
					localStorage.getItem('favoritesArray')
				);
				if (favArray !== null) {
					// Push all the favorites at once
					const markerList = [];
					for (let i = 0, len = favArray.length; i < len; i++) {
						// Nearby will force it to refresh when clicked
						const newLoc = new LocationModel(self, 'Nearby');
						const lat = Number(
							favArray[i].google_geometry.location.lat
						);
						const lng = Number(
							favArray[i].google_geometry.location.lng
						);
						const passedGeometry = new google.maps.LatLng(lat, lng);
						self.modelRebuilder(
							newLoc,
							favArray[i],
							passedGeometry
						);
						newLoc.google_geometry(newLoc.google_geometry());
						newLoc.isFavorite(true);
						// Reset open/closed computed
						newLoc.google_openingHoursObject(undefined);
						markerList.push(newLoc);
					}
					self.markedLocations.push(...markerList);
				}
			}
			if (localStorage.getItem('mapCenter')) {
				const mapCenter = JSON.parse(localStorage.getItem('mapCenter'));
				if (
					mapCenter !== null &&
					typeof mapCenter.lat !== 'undefined' &&
					mapCenter.lat !== null
				) {
					self.mapPan(mapCenter.lat, mapCenter.lng);
					if (
						mapCenter.zoom !== null &&
						typeof mapCenter.zoom === 'number'
					) {
						self.mainMap.setZoom(mapCenter.zoom);
					}
				}
			}
		}
	};

	/**
	 * Let the user know if storage or workers aren't available.
	 */
	self.singleErrorMessages = function(): void {
		if (self.storageAvailable !== true) {
			self.failAPIFunction(
				'Local Storage Problem',
				'Local Storage support is not available. ' +
					'Favorites will not save after page reload.'
			);
		}
		if (self.workersAvailable !== true) {
			self.failAPIFunction(
				'Web Workers Problem',
				'Web Workers support is not available. App will function ' +
					'normally but average data retrieval wait times will ' +
					'increase. \n Web workers do not work when loading this ' +
					'application from older browsers or directly from the ' +
					'local file system.'
			);
		}
	};

	/**
	 * Function to change position of map relative to center/marker by a given
	 * number of pixels.
	 * @param {object} map     Google map object
	 * @param {object} latlng  Optional google LatLng object of center point,
	 *                         will default to center of map otherwise
	 * @param {number} offsetx X pixels to offset by
	 * @param {number} offsety Y pixels to offset by
	 */
	const setResizeListenerMapRecenter = (
		map,
		latlng,
		offsetx,
		offsety
	): void => {
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
	};

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
	const setResizeListenerCenterWindow = (
		theElement,
		model,
		x,
		y,
		time,
		xModifier
	): void => {
		setTimeout(
			function() {
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
					setResizeListenerMapRecenter(
						model.marker().map,
						undefined,
						xAmount,
						yAmount
					);
				}
			},
			typeof time !== 'undefined' ? time : 0
		);
	};

	/**
	 * Checks if the infoWindow needs to be moved. Checks every 100ms
	 * unless the native google method moves the map in which case waits
	 * longer. If the user drags the map or the infoWindow closes, stops
	 * the checking.
	 * @param  {object} theElement element from binding handler - hopefully
	 *                             outer infoWindow
	 * @param  {object} model      currently selected location
	 * @param  {number} xModifier  size modifier for removing operating
	 */
	self.reCheckInfoWindowIsCentered = function(
		theElement,
		model,
		xModifier
	): void {
		let time = 100;
		if (self.regularInfoWindowPan() === true) {
			time = 600;
			self.regularInfoWindowPan(false);
		}
		if (
			self.userDrag() === true ||
			typeof self.currentlySelectedLocation() === 'undefined' ||
			self.currentlySelectedLocation() !== model
		) {
			time = false;
		}
		if (time !== false) {
			setResizeListenerCenterWindow(
				theElement,
				model,
				true,
				true,
				0,
				xModifier
			);
			self.currentInfoWindowCheck = setTimeout(function() {
				self.reCheckInfoWindowIsCentered(theElement, model, xModifier);
			}, time);
		}
	};

	/**
	 * Resets the filters when the reset filter button is clicked (on
	 * mobile UI); Sets minRatingButtonFilter at -1 to get around jQuery
	 * UI autocomplete bug (it's set to 0 by the binding handler);
	 * @return {[type]} [description]
	 */
	self.resetFilters = function(): void {
		self.searchQuery('');
		self.priceButtonFilter(appConfigObject.defaultPriceButtonFilter);
		self.minRatingButtonFilter(-1);
		self.openButtonFilter(appConfigObject.defaultOpenButtonFilter);
		self.favoriteButtonFilter(appConfigObject.defaultFavoriteButtonFilter);
	};

	self.initializeCurrentDetailedAPIInfoBeingFetched();
	self.singleErrorMessages();
	self.getLocalStorage();
}
