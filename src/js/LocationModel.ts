/* global google, ko*/

import appConfigObject from './config.ts';
///////////////////////
//Section III: Model //
///////////////////////

/**
 * Model for every location on the map, created from Google data from
 * radar and nearby searches. Stored in markedLocations array in ViewModel
 * @param {object} currentViewModel viewModel to which this model belongs to
 * @param {string} searchType       Google search type which created model,
 *                                  usually 'Radar' or 'Nearby'
 */
export default function(currentViewModel, searchType): void {
	const self = this;
	// Initialize google properties from the getgo
	self.googleSearchType = ko.observable(searchType);
	self.googleIsLoading = ko.observable(false);
	// Reflects if marker is within mapbounds
	self.isInViewOnMap = ko.observable(true);
	// Reflects if model has been filtered out (or is only radar searched)
	self.isListed = ko.observable(false);
	// Reflects if marker has been selected in marker list or on map
	self.isSelected = ko.observable(false);
	// Reflects if marker likely has infoWindow constructed
	self.hasBeenOpened = false;
	// Current model number for use in order recieved sorting
	self.modelNumber = currentViewModel.getLocationModelNumber();
	//Reflects if favorite button has been selected for model
	self.isFavorite = ko.observable(false);

	/**
	 * Arrays for storage of listeners and subscriptions that need to be
	 * removed when removing object to ensure garbage collection
	 */
	self.disposableArray = [];
	self.listenerStorage = [];

	/**
	 * Sends the model to have all observables and properties added as
	 * defined by the config object
	 */
	currentViewModel.modelConstructor(self);

	/**
	 * Create yelpIsLoading, yelpSearchType, locuIsLoading, ect.
	 */
	currentViewModel.modelSearchTypeConstructor(self);

	/**
	 * Create marker within model, set it as an observable (which will
	 * need to be manually called).
	 */
	self.marker = ko.observable(
		new google.maps.Marker({
			map: currentViewModel.mainMap,
			opacity:
				self.isListed() === false
					? currentViewModel.lowMarkerOpacity()
					: appConfigObject.highMarkerOpacity,
			icon: currentViewModel.markerImageCreator(),
			shape: appConfigObject.defaultMarkerShape,
		})
	);

	/**
	 * Subscribe to isFavorite to update marker image when it's changed
	 * and to push itself to the favoriteArray for localStorage saving
	 */
	self.disposableArray.push(
		self.isFavorite.subscribe(function(newValue) {
			self.marker().setIcon(
				currentViewModel.markerImageCreator(
					newValue,
					self.google_priceLevel()
				)
			);
			self.marker(self.marker());
			currentViewModel.changeFavoriteArray(newValue, self);
		})
	);

	/**
	 * Subscribe to isSelected to update the viewModel's
	 * currentlySelectedLocation consistently and automatically
	 */
	self.disposableArray.push(
		self.isSelected.subscribe(function(newValue) {
			currentViewModel.changeCurrentlySelectedItem(newValue, self);
		})
	);

	/**
	 * Subscribe to isListed to set marker opacity dependent upon listing
	 * status.
	 */
	self.disposableArray.push(
		self.isListed.subscribe(function(newValue) {
			if (newValue) {
				self.marker().setOpacity(appConfigObject.highMarkerOpacity);
				self.marker(self.marker());
			} else {
				self.marker().setOpacity(currentViewModel.lowMarkerOpacity());
				self.marker(self.marker());
			}
		})
	);

	/**
	 * Subscribe to google_priceLevel to update marker image if it changes
	 */
	self.disposableArray.push(
		self.google_priceLevel.subscribe(function(newValue) {
			self.marker().setIcon(
				currentViewModel.markerImageCreator(self.isFavorite(), newValue)
			);
			self.marker(self.marker());
		})
	);

	/**
	 * Subscribe to google_name to update marker title if it changes
	 */
	self.disposableArray.push(
		self.google_name.subscribe(function(newValue) {
			self.marker().setTitle(newValue);
			self.marker(self.marker());
		})
	);

	/**
	 * Subscribe to google_geometry to update marker position if it changes
	 */
	self.disposableArray.push(
		self.google_geometry.subscribe(function(newValue) {
			self.marker().setPosition(newValue.location);
			self.marker(self.marker());
		})
	);

	/**
	 * Create computed for determining short hand version of
	 * google_openingHoursObject().open_now
	 */
	self.isItOpenRightNow = ko.pureComputed(function() {
		if (typeof self.google_openingHoursObject() !== 'undefined') {
			if (self.google_openingHoursObject().open_now === true) {
				return 'Open';
			} else if (self.google_openingHoursObject().open_now === false) {
				return 'Closed';
			}
		}
	});

	/**
	 * Create infoWindow using template and binds it to model
	 */
	self.infoWindow = new google.maps.InfoWindow({
		content: currentViewModel.makeInfoWindowContent(),
	});

	/**
	 * Infowindow listeners, functions on viewModel to minimize model size
	 */
	self.listenerStorage.push(
		self.infoWindow.addListener(
			'closeclick',
			currentViewModel.markerCloseClick
		)
	);
	self.listenerStorage.push(
		self.infoWindow.addListener('domready', currentViewModel.markerDomReady)
	);

	/**
	 * Infowindow click listener, sets the markerList to scroll to this model,
	 * starts the data fetching process with Google Places API, closes
	 * previous info and opens this one, sets markerAnimation going
	 */
	self.listenerStorage.push(
		self.marker().addListener('click', function() {
			currentViewModel.markerClick(self);
		})
	);

	/**
	 * Triggers click event and pans to marker when location is selected from
	 * marker list
	 */
	self.listWasClicked = function(data, event, width): void {
		new google.maps.event.trigger(self.marker(), 'click');
		self.marker().map.panTo(self.google_geometry().location);
		if (width < 1200) {
			currentViewModel.markerToggled(false);
		}
	};

	/**
	 * Usability function to call the models search type based on what type
	 * is needed
	 * @param  {string} type Search type to be called ie yelp, google, ect.
	 * @return {string}      Contents of search type observable
	 */
	self.searchType = function(type): string {
		return self[type.toLowerCase() + 'SearchType'];
	};

	/**
	 * Sets the model to dispose of itself when it's being removed - kills
	 * subscriptions, kills listeners, and takes itself off of the map
	 */
	self.dispose = function(): void {
		self.marker().setMap(null);
		ko.utils.arrayForEach(self.disposableArray, function(disposable) {
			disposable.dispose();
		});
		ko.utils.arrayForEach(self.listenerStorage, function(item) {
			google.maps.event.removeListener(item);
		});
	};
}
