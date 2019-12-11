/* global google */

import ko from 'knockout';
import * as config from './config';
import ViewModel from './ViewModel';

/**
 * Model for every location on the map, created from Google data from
 * radar and nearby searches. Stored in markedLocations array in ViewModel
 * @param {object} currentViewModel viewModel to which this model belongs to
 * @param {string} searchType       Google search type which created model,
 *                                  usually 'Radar' or 'Nearby'
 * @class          LocationModel (name)
 */
export default class LocationModel {
	isInViewOnMap: KnockoutObservable<boolean>;
	isListed: KnockoutObservable<boolean>;
	isSelected: KnockoutObservable<boolean>;
	hasBeenOpened: boolean;
	modelNumber: number;
	isFavorite: KnockoutObservable<boolean>;
	disposableArray: Array<KnockoutSubscription>;
	listenerStorage: Array<google.maps.MapsEventListener>;
	marker: KnockoutObservable<google.maps.Marker>;
	isItOpenRightNow: ko.PureComputed<'Open' | 'Closed'>;
	google_roundedRating: ko.PureComputed<number>;
	yelp_ratingImgURL: ko.PureComputed<string>;
	infoWindow: google.maps.InfoWindow;

	google_placeId: string;
	google_name: KnockoutObservable<string>;
	google_geometry: KnockoutObservable<google.maps.places.PlaceGeometry>;
	google_rating: KnockoutObservable<number>;
	google_vicinity: KnockoutObservable<string>;
	google_priceLevel: KnockoutObservable<number>;
	google_adrAddress: KnockoutObservable<string>;
	google_formattedPhone: KnockoutObservable<string>;
	google_singleLocAttributionsArray: KnockoutObservableArray<string>;
	google_openingHoursObject: KnockoutObservable<
		google.maps.places.OpeningHours & { isOpen: () => boolean }
	>;
	google_photos: KnockoutObservable<google.maps.places.PlacePhoto>;
	google_reviews: KnockoutObservableArray<google.maps.places.PlaceReview>;
	google_totalRatings: KnockoutObservable<number>;
	google_URL: KnockoutObservable<string>;
	google_website: KnockoutObservable<string>;
	yelp_id: KnockoutObservable<string>;
	yelp_isPermaClosed: KnockoutObservable<boolean>;
	yelp_name: KnockoutObservable<string>;
	yelp_imageURL: KnockoutObservable<string>;
	yelp_URL: KnockoutObservable<string>;
	yelp_displayPhone: KnockoutObservable<string>;
	yelp_reviewCount: KnockoutObservable<number>;
	yelp_rating: KnockoutObservable<number>;
	yelp_categories: KnockoutObservableArray<{ alias: string; title: string }>;
	yelp_reviews: KnockoutObservableArray<string>; //TODO deprecated
	yelp_location: KnockoutObservable<{
		address1: string;
		address2: string;
		address3: string;
		city: string;
		country: string;
		display_address: Array<string>;
		state: string;
		zip_code: string;
	}>;
	locu_id: KnockoutObservable<string>;
	locu_name: KnockoutObservable<string>;
	locu_websiteURL: KnockoutObservable<string>;
	locu_hasMenu: KnockoutObservable<boolean>;
	locu_phone: KnockoutObservable<string>;
	locu_resourceURI: KnockoutObservable<string>;
	locu_streetAddress: KnockoutObservable<string>;
	locu_locality: KnockoutObservable<string>;
	locu_region: KnockoutObservable<string>;
	locu_postalCode: KnockoutObservable<string>;
	locu_country: KnockoutObservable<string>;
	locu_lat: KnockoutObservable<number>;
	locu_long: KnockoutObservable<number>;
	locu_cuisines: KnockoutObservable<string>;
	locu_facebookURL: KnockoutObservable<string>;
	locu_twitterID: KnockoutObservable<string>;
	locu_menus: KnockoutObservableArray<GenericJSON>;
	foursquare_id: KnockoutObservable<string>;
	foursquare_name: KnockoutObservable<string>;
	foursquare_contact: KnockoutObservable<{
		twitter?: string;
		phone?: string;
		formattedPhone?: string;
	}>;
	foursquare_location: KnockoutObservable<{
		address?: string;
		crossStreet?: string;
		city?: string;
		state?: string;
		postalCode?: string;
		country?: string;
		lat?: number;
		lng?: number;
		distance?: number;
	}>;
	foursquare_verified: KnockoutObservable<boolean>;
	foursquare_stats: KnockoutObservable<{
		checkinsCount: number;
		usersCount: number;
		tipCount: number;
	}>;
	foursquare_url: KnockoutObservable<string>;
	foursquare_price: KnockoutObservable<{
		tier: number;
		message: string;
	}>;
	foursquare_rating: KnockoutObservable<number>;
	foursquare_hereNow: KnockoutObservable<{
		count: number;
	}>;
	foursquare_storeId: KnockoutObservable<string>;
	foursquare_description: KnockoutObservable<string>;
	foursquare_createdAt: KnockoutObservable<number>;
	foursquare_tips: KnockoutObservable<{
		count: number;
	}>;
	foursquare_shortUrl: KnockoutObservable<string>;
	foursquare_canonicalUrl: KnockoutObservable<string>;
	foursquare_photos: KnockoutObservable<{
		count: number;
		groups: Array<GenericJSON>;
	}>;
	foursquare_likes: KnockoutObservable<{
		count: number;
	}>;
	foursquare_phrases: KnockoutObservable<string>;

	googleSearchType: KnockoutObservable<string>;
	googleIsLoading: KnockoutObservable<boolean>;
	yelpSearchType: KnockoutObservable<string>;
	yelpIsLoading: KnockoutObservable<boolean>;
	locuSearchType: KnockoutObservable<string>;
	locuIsLoading: KnockoutObservable<boolean>;
	foursquareSearchType: KnockoutObservable<string>;
	foursquareIsLoading: KnockoutObservable<boolean>;

	constructor(currentViewModel: ViewModel, searchType: string) {
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
		this.modelNumber = currentViewModel.getLocationModelNumber();
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
		this.addObservables();

		/**
		 * Create yelpIsLoading, yelpSearchType, locuIsLoading, ect.
		 */
		this.addSearchTypes();

		/**
		 * Create marker within model, set it as an observable (which will
		 * need to be manually called).
		 */
		this.marker = ko.observable(
			new google.maps.Marker({
				map: currentViewModel.mainMap,
				opacity:
					this.isListed() === false
						? currentViewModel.lowMarkerOpacity()
						: config.HIGH_MARKER_OPACITY,
				icon: currentViewModel.markerImageCreator(),
				shape: config.DEFAULT_MARKER_SHAPE,
			})
		);

		/**
		 * Subscribe to isFavorite to update marker image when it's changed
		 * and to push itself to the favoriteArray for localStorage saving
		 */
		this.disposableArray.push(
			this.isFavorite.subscribe((newValue: boolean): void => {
				this.marker().setIcon(
					currentViewModel.markerImageCreator(
						newValue,
						this.google_priceLevel()
					)
				);
				this.marker(this.marker());
				currentViewModel.changeFavoriteArray(newValue, this);
			})
		);

		/**
		 * Subscribe to isSelected to update the viewModel's
		 * currentlySelectedLocation consistently and automatically
		 */
		this.disposableArray.push(
			this.isSelected.subscribe((newValue: boolean): void => {
				currentViewModel.changeCurrentlySelectedItem(newValue, this);
			})
		);

		/**
		 * Subscribe to isListed to set marker opacity dependent upon listing
		 * status.
		 */
		this.disposableArray.push(
			this.isListed.subscribe((newValue: boolean): void => {
				if (newValue) {
					this.marker().setOpacity(config.HIGH_MARKER_OPACITY);
					this.marker(this.marker());
				} else {
					this.marker().setOpacity(
						currentViewModel.lowMarkerOpacity()
					);
					this.marker(this.marker());
				}
			})
		);

		/**
		 * Subscribe to google_priceLevel to update marker image if it changes
		 */
		this.disposableArray.push(
			this.google_priceLevel.subscribe((newValue: number): void => {
				this.marker().setIcon(
					currentViewModel.markerImageCreator(
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
			this.google_name.subscribe((newValue: string): void => {
				this.marker().setTitle(newValue);
				this.marker(this.marker());
			})
		);

		/**
		 * Subscribe to google_geometry to update marker position if it changes
		 */
		this.disposableArray.push(
			this.google_geometry.subscribe(
				(newValue: google.maps.places.PlaceGeometry): void => {
					this.marker().setPosition(newValue.location);
					this.marker(this.marker());
				}
			)
		);

		/**
		 * Create computed for determining short hand version of
		 * google_openingHoursObject().isOpen
		 */
		this.isItOpenRightNow = ko.pureComputed((): 'Open' | 'Closed' => {
			if (typeof this.google_openingHoursObject() !== 'undefined') {
				if (this.google_openingHoursObject().isOpen() === true) {
					return 'Open';
				} else if (
					this.google_openingHoursObject().isOpen() === false
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
			content: currentViewModel.makeInfoWindowContent(),
		});

		/**
		 * Infowindow listeners, functions on viewModel to minimize model size
		 */
		this.listenerStorage.push(
			this.infoWindow.addListener(
				'closeclick',
				currentViewModel.markerCloseClick.bind(currentViewModel)
			)
		);

		this.listenerStorage.push(
			this.infoWindow.addListener(
				'domready',
				currentViewModel.markerDomReady.bind(currentViewModel)
			)
		);

		/**
		 * Infowindow click listener, sets the markerList to scroll to this model,
		 * starts the data fetching process with Google Places API, closes
		 * previous info and opens this one, sets markerAnimation going
		 */
		this.listenerStorage.push(
			this.marker().addListener('click', (): void => {
				currentViewModel.markerClick(this);
			})
		);
	}

	/**
	 * Triggers click event and pans to marker when location is selected from
	 * marker list
	 */
	listWasClicked(): void {
		new google.maps.event.trigger(this.marker(), 'click');
		const map = this.marker().getMap() as google.maps.Map;
		map.panTo(this.google_geometry().location);
	}

	/**
	 * Usability function to call the models search type based on what type
	 * is needed
	 * @param  {string} type Search type to be called ie yelp, google, ect.
	 * @return {ko.observable:string}      Search type observable
	 */
	searchType(type: string): KnockoutObservable<string> {
		return this[type.toLowerCase() + 'SearchType'];
	}

	/**
	 * Sets the model to dispose of itself when it's being removed - kills
	 * subscriptions, kills listeners, and takes itself off of the map
	 */
	dispose(): void {
		this.marker().setMap(null);
		ko.utils.arrayForEach(
			this.disposableArray,
			(disposable: KnockoutSubscription): void => {
				disposable.dispose();
			}
		);
		ko.utils.arrayForEach(
			this.listenerStorage,
			(item: google.maps.MapsEventListener): void => {
				google.maps.event.removeListener(item);
			}
		);
	}

	/**
	 * Adds observables as defined in config object
	 */
	private addObservables(): void {
		for (const prop in config.API_MAPPINGS_FOR_MODEL) {
			const currentType = config.API_MAPPINGS_FOR_MODEL[prop];
			for (let i = 0, len = currentType.length; i < len; i++) {
				if (currentType[i].oType === 1) {
					this[currentType[i].model] = ko.observable();
				} else if (currentType[i].oType === 2) {
					this[currentType[i].model] = ko.observableArray([]);
				}
			}
		}
	}

	/**
	 * Takes a model and adds in API searchType and isLoading observables
	 * for all API types
	 */
	private addSearchTypes(): void {
		for (
			let i = 0, len = config.CONFIGURED_SEARCH_TYPES.length;
			i < len;
			i++
		) {
			this[
				config.CONFIGURED_SEARCH_TYPES[i].toLowerCase() + 'SearchType'
			] = ko.observable('None');
			this[
				config.CONFIGURED_SEARCH_TYPES[i].toLowerCase() + 'IsLoading'
			] = ko.observable(false);
		}
	}

	/**
	 * Takes model and returns just the data in JavaScript object format
	 * Knockout's built in function for this was having trouble
	 * @return {object}       JavaScript object representation of model
	 *                        (without functions/ect.)
	 */
	toJSON(): GenericJSON {
		const returnModel = {};
		for (const prop in config.API_MAPPINGS_FOR_MODEL) {
			const currentType = config.API_MAPPINGS_FOR_MODEL[prop];
			for (let i = 0, len = currentType.length; i < len; i++) {
				if (currentType[i].oType === 0) {
					returnModel[currentType[i].model] = this[
						currentType[i].model
					];
				} else {
					returnModel[currentType[i].model] = this[
						currentType[i].model
					]();
				}
			}
		}
		return returnModel;
	}

	/**
	 * Takes the model, data from the API server, and updates the
	 * observables of that model with the data from the server
	 * @param  {string} type   which API type/source was used
	 * @param  {object} result result from server, mapped using config object
	 */
	update(
		type: string,
		result: GenericJSON | google.maps.places.PlaceResult
	): void {
		const currentType = config.API_MAPPINGS_FOR_MODEL[type];
		for (let i = 0, len = currentType.length; i < len; i++) {
			if (typeof result[currentType[i].server] !== 'undefined') {
				if (currentType[i].oType !== 0) {
					this[currentType[i].model](result[currentType[i].server]);
				} else {
					this[currentType[i].model] = result[currentType[i].server];
				}
			}
		}
	}

	/**
	 * Takes a model from localStorage and rebuilds it using the saved data
	 * @param  {object} blueprint data from localStorage
	 * @param  {object} location  google_geometry.location object from
	 *                            localStorage
	 */
	rebuild(blueprint: GenericJSON, location: google.maps.LatLng): void {
		for (const prop in config.API_MAPPINGS_FOR_MODEL) {
			const currentType = config.API_MAPPINGS_FOR_MODEL[prop];
			for (let i = 0, len = currentType.length; i < len; i++) {
				if (
					currentType[i].oType !== 0 &&
					currentType[i].model !== 'google_geometry'
				) {
					this[currentType[i].model](blueprint[currentType[i].model]);
				} else if (currentType[i].model === 'google_geometry') {
					const geometryBlueprint = {
						...(blueprint['google_geometry'] as object),
						location,
					} as google.maps.places.PlaceGeometry;
					this['google_geometry'](geometryBlueprint);
				} else {
					this[currentType[i].model] =
						blueprint[currentType[i].model];
				}
			}
		}
	}
}
