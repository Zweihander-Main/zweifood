/* global google, ko*/

import * as config from './config';

/**
 * Model for every location on the map, created from Google data from
 * radar and nearby searches. Stored in markedLocations array in ViewModel
 * @param {object} currentViewModel viewModel to which this model belongs to
 * @param {string} searchType       Google search type which created model,
 *                                  usually 'Radar' or 'Nearby'
 */
export default class LocationModel {
	private parentViewModel: any; // TODO
	googleSearchType: KnockoutObservable<string>;
	googleIsLoading: KnockoutObservable<boolean>;
	isInViewOnMap: KnockoutObservable<boolean>;
	isListed: KnockoutObservable<boolean>;
	isSelected: KnockoutObservable<boolean>;
	hasBeenOpened: boolean;
	modelNumber: number;
	isFavorite: KnockoutObservable<boolean>;

	disposableArray: Array<KnockoutSubscription>;
	listenerStorage: Array<google.maps.MapsEventListener>;
	marker: KnockoutObservable<google.maps.Marker>;
	isItOpenRightNow: KnockoutComputed<'Open' | 'Closed'>;
	infoWindow: google.maps.InfoWindow;

	constructor(currentViewModel, searchType) {
		this.parentViewModel = currentViewModel;
		// Initialize google properties from the get go
		this.googleSearchType = ko.observable(searchType);
		this.googleIsLoading = ko.observable(false);
		// Reflects if marker is within map bounds
		this.isInViewOnMap = ko.observable(true);
		// Reflects if model has been filtered out (or is only radar searched)
		this.isListed = ko.observable(false);
		// Reflects if marker has been selected in marker list or on map
		this.isSelected = ko.observable(false);
		// Reflects if marker likely has infoWindow constructed
		this.hasBeenOpened = false;
		// Current model number for use in order received sorting
		this.modelNumber = this.parentViewModel.getLocationModelNumber();
		//Reflects if favorite button has been selected for model
		this.isFavorite = ko.observable(false);
		/**
		 * Arrays for storage of listeners and subscriptions that need to be
		 * removed when removing object to ensure garbage collection
		 */
		this.disposableArray = [];
		this.listenerStorage = [];

		/**
		 * Sends the model to have all observables and properties added as
		 * defined by the config object
		 */
		this.parentViewModel.modelConstructor(this);

		/**
		 * Create yelpIsLoading, yelpSearchType, locuIsLoading, ect.
		 */
		this.parentViewModel.modelSearchTypeConstructor(this);

		/**
		 * Create marker within model, set it as an observable (which will
		 * need to be manually called).
		 */
		this.marker = ko.observable(
			new google.maps.Marker({
				map: this.parentViewModel.mainMap,
				opacity:
					this.isListed() === false
						? this.parentViewModel.lowMarkerOpacity()
						: config.HIGH_MARKER_OPACITY,
				icon: this.parentViewModel.markerImageCreator(),
				shape: config.DEFAULT_MARKER_SHAPE,
			})
		);

		/**
		 * Subscribe to isFavorite to update marker image when it's changed
		 * and to push itself to the favoriteArray for localStorage saving
		 */
		this.disposableArray.push(
			this.isFavorite.subscribe((newValue) => {
				this.marker().setIcon(
					this.parentViewModel.markerImageCreator(
						newValue,
						this.google_priceLevel()
					)
				);
				this.marker(this.marker());
				this.parentViewModel.changeFavoriteArray(newValue, this);
			})
		);

		/**
		 * Subscribe to isSelected to update the viewModel's
		 * currentlySelectedLocation consistently and automatically
		 */
		this.disposableArray.push(
			this.isSelected.subscribe((newValue) => {
				this.parentViewModel.changeCurrentlySelectedItem(
					newValue,
					this
				);
			})
		);

		/**
		 * Subscribe to isListed to set marker opacity dependent upon listing
		 * status.
		 */
		this.disposableArray.push(
			this.isListed.subscribe((newValue) => {
				if (newValue) {
					this.marker().setOpacity(config.HIGH_MARKER_OPACITY);
					this.marker(this.marker());
				} else {
					this.marker().setOpacity(
						this.parentViewModel.lowMarkerOpacity()
					);
					this.marker(this.marker());
				}
			})
		);

		/**
		 * Subscribe to google_priceLevel to update marker image if it changes
		 */
		this.disposableArray.push(
			this.google_priceLevel.subscribe((newValue) => {
				this.marker().setIcon(
					this.parentViewModel.markerImageCreator(
						this.isFavorite(),
						newValue
					)
				);
				this.marker(this.marker());
			})
		);

		/**
		 * Subscribe to google_name to update marker title if it changes
		 */
		this.disposableArray.push(
			this.google_name.subscribe((newValue) => {
				this.marker().setTitle(newValue);
				this.marker(this.marker());
			})
		);

		/**
		 * Subscribe to google_geometry to update marker position if it changes
		 */
		this.disposableArray.push(
			this.google_geometry.subscribe((newValue) => {
				this.marker().setPosition(newValue.location);
				this.marker(this.marker());
			})
		);

		/**
		 * Create computed for determining short hand version of
		 * google_openingHoursObject().open_now
		 */
		this.isItOpenRightNow = ko.pureComputed((): 'Open' | 'Closed' => {
			if (typeof this.google_openingHoursObject() !== 'undefined') {
				if (this.google_openingHoursObject().open_now === true) {
					return 'Open';
				} else if (
					this.google_openingHoursObject().open_now === false
				) {
					return 'Closed';
				}
			}
		});

		/**
		 * Create rounded rating for google_rating
		 */
		// eslint-disable-next-line @typescript-eslint/camelcase
		this.google_roundedRating = ko.pureComputed((): number => {
			return Math.round(this.google_rating() * 10) / 10;
		});

		/**
		 * Translate yelp rating into branded star image
		 */
		// eslint-disable-next-line @typescript-eslint/camelcase
		this.yelp_ratingImgURL = ko.pureComputed((): string => {
			switch (this.yelp_rating()) {
				case 0:
					return config.YELP_STAR_IMAGES[0];
					break;
				case 1:
					return config.YELP_STAR_IMAGES[1];
					break;
				case 1.5:
					return config.YELP_STAR_IMAGES[15];
					break;
				case 2:
					return config.YELP_STAR_IMAGES[2];
					break;
				case 2.5:
					return config.YELP_STAR_IMAGES[25];
					break;
				case 3:
					return config.YELP_STAR_IMAGES[3];
					break;
				case 3.5:
					return config.YELP_STAR_IMAGES[35];
					break;
				case 4:
					return config.YELP_STAR_IMAGES[4];
					break;
				case 4.5:
					return config.YELP_STAR_IMAGES[45];
					break;
				case 5:
					return config.YELP_STAR_IMAGES[5];
					break;
			}
		});

		/**
		 * Create infoWindow using template and binds it to model
		 */
		this.infoWindow = new google.maps.InfoWindow({
			content: this.parentViewModel.makeInfoWindowContent(),
		});

		/**
		 * Infowindow listeners, functions on viewModel to minimize model size
		 */
		this.listenerStorage.push(
			this.infoWindow.addListener(
				'closeclick',
				this.parentViewModel.markerCloseClick
			)
		);
		this.listenerStorage.push(
			this.infoWindow.addListener(
				'domready',
				this.parentViewModel.markerDomReady
			)
		);

		/**
		 * Infowindow click listener, sets the markerList to scroll to this model,
		 * starts the data fetching process with Google Places API, closes
		 * previous info and opens this one, sets markerAnimation going
		 */
		this.listenerStorage.push(
			this.marker().addListener('click', () => {
				this.parentViewModel.markerClick(this);
			})
		);
	}

	/**
	 * Triggers click event and pans to marker when location is selected from
	 * marker list
	 */
	listWasClicked(data, event, width): void {
		new google.maps.event.trigger(this.marker(), 'click');
		const map = this.marker().getMap() as google.maps.Map; //TODO test
		map.panTo(this.google_geometry().location);
		if (width < 1200) {
			this.parentViewModel.markerToggled(false);
		}
	}

	/**
	 * Usability function to call the models search type based on what type
	 * is needed
	 * @param  {string} type Search type to be called ie yelp, google, ect.
	 * @return {string}      Contents of search type observable
	 */
	searchType(type): string {
		return this[type.toLowerCase() + 'SearchType'];
	}

	/**
	 * Sets the model to dispose of itself when it's being removed - kills
	 * subscriptions, kills listeners, and takes itself off of the map
	 */
	dispose(): void {
		this.marker().setMap(null);
		ko.utils.arrayForEach(this.disposableArray, function(disposable) {
			disposable.dispose();
		});
		ko.utils.arrayForEach(this.listenerStorage, function(item) {
			google.maps.event.removeListener(item);
		});
	}
}
