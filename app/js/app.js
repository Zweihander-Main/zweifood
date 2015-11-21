var app = (function() {

	var config = {
		lowMarkerOpacity: 0.25,
		highMarkerOpacity: 1.0,
		yelpConsumerKey: '***REMOVED***',
		yelpConsumerSecret: '***REMOVED***',
		yelpToken: '***REMOVED***',
		yelpTokenSecret: '***REMOVED***',
		yelpBaseURL: 'https://api.yelp.com/v2/',
		yelpAccuracy: 0.001,
		minFuzzyMatch: 0.5
	};

	function isElementVisible(el) {
		var elRect = el.getBoundingClientRect();
		var elTop = elRect.top;
		var elBottom = elTop + $(el).height();
		var listTop = $('.marker-list').get(0).offsetTop;
		var listBottom = listTop + $('.marker-list').height();

		console.debug("elTop      : " + elTop + "\n" +
			"elBottom   : " + elBottom + "\n" +
			"listTop    : " + listTop + "\n" +
			"listBottom : " + listBottom + "\n"
		);

		if ((elBottom > listBottom) || (elTop < listTop)) {
			return false;
		} else {
			return true;
		}
	}

	/**
	 * Generates a random number and returns it as a string for OAuthentication
	 * @return {string}
	 */
	function nonce_generate() {
		return (Math.floor(Math.random() * 1e12).toString());
	}

	// Returns a function, that, as long as it continues to be invoked, will not
	// be triggered. The function will be called after it stops being called for
	// N milliseconds. If `immediate` is passed, trigger the function on the
	// leading edge, instead of the trailing.
	function debounce(func, wait, immediate) {
		var timeout;
		return function() {
			var context = this,
				args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) func.apply(context, args);
		};
	}

	function Location(currentViewModel, marker, searchType, id, open_now, rating, types, vicinity, price_level, icon) {
		var self = this;
		self.marker = ko.observable(marker);
		self.googleSearchType = ko.observable(searchType);
		//Radar
		self.id = {};
		self.id.placeId = id;
		//Nearby
		self.isInViewOnMap = ko.observable(true);
		self.googleOpenNow = ko.observable(open_now);
		self.googleRating = ko.observable(rating);
		self.googleTypes = ko.observableArray(types);
		self.googleVicinity = ko.observable(vicinity);
		self.googlePriceLevel = ko.observable(price_level);
		self.googleIconURL = ko.observable(icon);
		//Places
		self.googleAdrAddress = ko.observable();
		self.googleFormattedPhone = ko.observable();
		self.googleSingleLocAttributionsArray = ko.observableArray([]);
		self.googleOpeningHoursObject = ko.observable();
		self.googlePhotos = ko.observableArray([]);
		self.googleReviews = ko.observableArray([]);
		self.googleTotalRatings = ko.observable();
		self.googleUTCOffset = ko.observable();
		self.googleURL = ko.observable();
		//Yelp
		self.yelpID = ko.observable();
		self.yelpIsPermaClosed = ko.observable();
		self.yelpName = ko.observable();
		self.yelpImageURL = ko.observable();
		self.yelpURL = ko.observable();
		self.yelpReviewCount = ko.observable();
		self.yelpRating = ko.observable();
		self.yelpSnippetText = ko.observable();
		self.yelpMenuProvider = ko.observable();
		self.yelpMenuDateUpdated = ko.observable();
		self.yelpReservationURL = ko.observable();
		self.yelpEat24URL = ko.observable();
		self.yelpGiftCertificates = ko.observableArray([]);
		self.yelpDeals = ko.observableArray([]);
		self.yelpCategories = ko.observableArray([]);
		self.yelpReviews = ko.observableArray([]);
		self.yelpSearchType = ko.observable("None");

		self.isSelected = ko.observable(false);

		self.isSelected.subscribe(function(newValue) {
			if (newValue === true) {
				currentViewModel.currentlySelectedLocation(self);
			} else {
				currentViewModel.currentlySelectedLocation(undefined);
			}
		});

		self.listable = ko.computed(function() {
			if (((self.googleSearchType() === "Nearby") || (self.googleSearchType() === "Places")) && (self.isInViewOnMap() === true)) {
				if (typeof(currentViewModel.searchQuery()) !== "undefined") {
					if (self.marker().title.toLowerCase().indexOf(currentViewModel.searchQuery().toLowerCase()) >= 0) {
						return true;
					} else {
						return false;
					}
				} else {
					return true;
				}
			} else {
				return false;
			}
		});

		self.listable.subscribe(function(newValue) {
			if (newValue) {
				self.marker().setOpacity(config.highMarkerOpacity);
				self.marker(self.marker());
			} else {
				self.marker().setOpacity(config.lowMarkerOpacity);
				self.marker(self.marker());
			}
		});

		self.listable.extend({
			rateLimit: 50
		});

		self.isItOpenRightNow = ko.computed(function() {
			if (self.googleOpenNow() === true) {
				return "Open";
			} else if (self.googleOpenNow() === false) {
				return "Closed";
			}
		});

		self.infoWindowContent = ko.computed(function() {
			var contentString = self.marker().title + "<br>";
			contentString += self.isItOpenRightNow() + "<br>";
			contentString += "Rating: " + self.googleRating() + "<br>";
			contentString += "Types: " + self.googleTypes() + "<br>";
			contentString += "Price Level: " + self.googlePriceLevel() + "<br>";
			contentString += '<img src = "' + self.googleIconURL() + '"><br>';
			contentString += "Address: " + self.googleAdrAddress() + "<br>";
			contentString += "Phone: " + self.googleFormattedPhone() + "<br>";
			//contentString += "Opening Hours: " + JSON.stringify(self.googleOpeningHoursObject()) + "<br>";
			//contentString += "Photos: " + JSON.stringify(self.googlePhotos()) + "<br>";
			//contentString += "Reviews: " + JSON.stringify(self.googleReviews()) + "<br>";
			contentString += "Total Ratings: " + self.googleTotalRatings() + "<br>";
			contentString += "Google URL: " + self.googleURL() + "<br>";

			contentString += "Yelp is Perma Closed: " + self.yelpIsPermaClosed() + "<br>";
			contentString += "Yelp Name: " + self.yelpName() + "<br>";
			contentString += '<img src = "' + self.yelpImageURL() + '"><br>';
			contentString += "Yelp URL: " + self.yelpURL() + "<br>";
			contentString += "Yelp Review Count: " + self.yelpReviewCount() + "<br>";
			contentString += "Yelp Rating: " + self.yelpRating() + "<br>";
			contentString += "Yelp Snippet Text: " + self.yelpSnippetText() + "<br>";
			contentString += "Yelp Menu Provider: " + self.yelpMenuProvider() + "<br>";
			contentString += "Yelp Menu Updated: " + self.yelpMenuDateUpdated() + "<br>";
			contentString += "Yelp Reservation URL: " + self.yelpReservationURL() + "<br>";
			contentString += "Yelp Eat24URL: " + self.yelpEat24URL() + "<br>";
			// contentString += "" + self.yelpGiftCertificates() + "<br>";
			// self.yelpDeals = ko.observableArray([]);
			// self.yelpCategories = ko.observableArray([]);
			contentString += '<button data-bind="click: getDetailedReviewData">Reviews</button>'
			return contentString;
		});

		self.infoWindow = new google.maps.InfoWindow({
			content: self.infoWindowContent()
		});

		self.infoWindow.addListener("closeclick", function() {
			currentViewModel.currentlySelectedLocation().isSelected(false);
		});

		self.infoWindowContent.subscribe(function(newValue) {
			self.infoWindow.setContent(newValue);
		});

		self.infoWindowContent.extend({
			rateLimit: 50
		});

		self.marker().addListener('click', function() {
			currentViewModel.getDetailedGooglePlacesAPIInfo(self, self.callYelpSearch);
			if (typeof(currentViewModel.currentlySelectedLocation()) !== 'undefined') {
				currentViewModel.currentlySelectedLocation().infoWindow.close();
				currentViewModel.currentlySelectedLocation().isSelected(false);
			}
			self.isSelected(true);
			self.infoWindow.open(self.marker().map, self.marker());
		});

		self.callYelpSearch = function() {
			if (self.yelpSearchType() === "None") {
				currentViewModel.getYelpAPIInfo(self);
			}
		};

		self.listWasClicked = function() {
			new google.maps.event.trigger(self.marker(), 'click');
			currentViewModel.mainMap.panTo(self.marker().getPosition());
		};


	}

	function ViewModel(map) {
		var self = this;
		self.mainMap = map;
		// Specify location, radius and place types for your Places API search.
		self.markedLocations = ko.observableArray([]);
		//myViewModel.personName.extend({ rateLimit: 50 });
		self.nearbySearchIDArray = [];
		self.allSearchIDArray = [];

		self.getRestaurantsFromGoogleMapsAPICallArray = [];

		self.attributionsArray = ko.observableArray([]);

		self.listableEntries = ko.computed(function() {
			return ko.utils.arrayFilter(self.markedLocations(), function(item) {
				return item.listable() === true;
			});
		}, ViewModel);

		self.currentlySelectedLocation = ko.observable();

		self.oneIsSelected = ko.computed(function() {
			return typeof(self.currentlySelectedLocation()) !== "undefined";
		});

		self.currentlySelectedLocation.subscribe(function(newValue) {
			if (typeof(newValue) !== "undefined") {
				self.checkIfSelectedIsVisible();
			}
		});

		self.checkIfSelectedIsVisible = debounce(function() {
			var element = $('.listingSelected').get(0);
			if (typeof(element) === "undefined") {
				return;
			}
			if (isElementVisible(element) === false) {
				console.debug("True and Not Visible");
				$('.marker-list').animate({
					scrollTop: $(element).offset().top - $('.marker-list').offset().top + $('.marker-list').scrollTop() - 10 // - ($('.marker-list').height()/2)
				}, 100);
			}
		}, 5);

		self.service = new google.maps.places.PlacesService(self.mainMap);

		self.searchQuery = ko.observable();



		self.checkIfOnMap = function(currentBounds) {
			for (var i = 0; i < self.markedLocations().length; i++) {
				if (currentBounds.contains(self.markedLocations()[i].marker().getPosition()) === false) {
					self.markedLocations()[i].isInViewOnMap(false);
				} else {
					self.markedLocations()[i].isInViewOnMap(true);
				}
			}
		};

		self.getRestaurantsFromGoogleMapsAPI = function(callArrayIndex) {
			var currentMapBounds = self.mainMap.getBounds();

			var request = {
				bounds: currentMapBounds,
				types: ['restaurant']
			};

			self.service.radarSearch(request, processRadarResults);
			self.service.nearbySearch(request, processNearbyResults);

			function processNearbyResults(results, status, pagination) {
				if (status !== google.maps.places.PlacesServiceStatus.OK) {
					console.warn("Google Maps Nearby Search Error: " + status);
					return;
				} else {
					var markerList = [];
					for (var i = 0; i < results.length; i++) {
						if (self.nearbySearchIDArray.indexOf(results[i].place_id) === -1) {
							var newLocOpenNow = results[i].opening_hours;
							if (newLocOpenNow !== undefined) {
								newLocOpenNow = newLocOpenNow.open_now;
							}
							if (self.allSearchIDArray.indexOf(results[i].place_id) === -1) {
								var marker = new google.maps.Marker({
									map: self.mainMap,
									title: results[i].name,
									position: results[i].geometry.location,
									opacity: config.highMarkerOpacity
								});
								var newLoc = new Location(self, marker, "Nearby", results[i].place_id, newLocOpenNow, results[i].rating, results[i].types, results[i].vicinity, results[i].price_level, results[i].icon);
								markerList.push(newLoc);
								self.nearbySearchIDArray.push(results[i].place_id);
								self.allSearchIDArray.push(results[i].place_id);
							} else {
								for (var j = 0; j < self.markedLocations().length; j++) {
									if (self.markedLocations()[j].id.placeId === results[i].place_id) {
										self.markedLocations()[j].marker().setTitle(results[i].name);
										self.markedLocations()[j].googleSearchType("Nearby");
										self.markedLocations()[j].googleOpenNow(newLocOpenNow);
										self.markedLocations()[j].googleRating(results[i].rating);
										self.markedLocations()[j].googleTypes(results[i].types);
										self.markedLocations()[j].googleVicinity(results[i].vicinity);
										self.markedLocations()[j].googlePriceLevel(results[i].price_level);
									}
								}
							}
							if (results[i].html_attributions.length !== 0) {
								console.info("HTML Attribution Actually Found");
								var attributionsToPush = [];
								for (var z = 0; z < results[i].html_attributions.length; z++) {
									if (self.attributionsArray.indexOf(results[i].html_attributions[z]) === -1) {
										attributionsToPush.push(results[i].html_attributions[z]);
									}
								}
								self.attributionsArray.push.apply(self.attributionsArray, attributionsToPush);
							}
						}
					}
					self.markedLocations.push.apply(self.markedLocations, markerList);
					if (pagination.hasNextPage) {
						setTimeout(function() {
							if (self.getRestaurantsFromGoogleMapsAPICallArray[callArrayIndex] === true) {
								pagination.nextPage();
							}
						}, 2000);

					}
				}


			}

			function processRadarResults(results, status) {
				if (status !== google.maps.places.PlacesServiceStatus.OK) {
					console.warn("Google Maps Radar Search Error: " + status);
					return;
				} else {
					var markerList = [];
					for (var i = 0; i < results.length; i++) {

						if (self.allSearchIDArray.indexOf(results[i].place_id) === -1) {
							var marker = new google.maps.Marker({
								map: self.mainMap,
								position: results[i].geometry.location,
								opacity: config.lowMarkerOpacity
							});
							var newLoc = new Location(self, marker, "Radar", results[i].place_id);
							markerList.push(newLoc);
							self.allSearchIDArray.push(results[i].place_id);
							if (results[i].html_attributions.length !== 0) {
								console.info("HTML Attribution Actually Found");
								var attributionsToPush = [];
								for (var z = 0; z < results[i].html_attributions.length; z++) {
									if (self.attributionsArray.indexOf(results[i].html_attributions[z]) === -1) {
										attributionsToPush.push(results[i].html_attributions[z]);
									}
								}
								self.attributionsArray.push.apply(self.attributionsArray, attributionsToPush);
							}
						}
					}
					self.markedLocations.push.apply(self.markedLocations, markerList);
				}
			}

		};

		self.getDetailedGooglePlacesAPIInfo = function(selectedPlace, callback) {
			if (!selectedPlace) {
				selectedPlace = self.currentlySelectedLocation();
			}
			self.service.getDetails(selectedPlace.id, function(result, status) {
				if (status !== google.maps.places.PlacesServiceStatus.OK) {
					console.warn("Google Places Search Error: " + status);
					return;
				}
				selectedPlace.marker().setTitle(result.name);
				selectedPlace.googleSearchType("Places");
				selectedPlace.googleVicinity(result.vicinity);
				selectedPlace.googleAdrAddress(result.adr_address);
				selectedPlace.googleFormattedPhone(result.formatted_phone_number);
				selectedPlace.googleSingleLocAttributionsArray.push(result.html_attributions);
				selectedPlace.googleOpeningHoursObject(result.opening_hours);
				if (typeof(result.opening_hours) !== "undefined") {
					selectedPlace.googleOpenNow(result.opening_hours.open_now);
				}
				selectedPlace.googleRating(result.rating);
				selectedPlace.googlePriceLevel(result.price_level);
				selectedPlace.googleTypes(result.types);
				selectedPlace.googleIconURL(result.icon);
				selectedPlace.googlePhotos(result.photos);
				selectedPlace.googleReviews(result.reviews);
				selectedPlace.googleTotalRatings(result.user_ratings_total);
				selectedPlace.googleUTCOffset(result.utc_offset);
				selectedPlace.googleURL(result.url);

			});
			if (typeof callback === "function") {
				callback();
			}
		};

		self.getYelpAPIInfo = function(selectedPlace, callback) {
			if (!selectedPlace) {
				selectedPlace = self.currentlySelectedLocation();
			}
			var yelp_url = config.yelpBaseURL + 'search/';
			var selectedLoc = selectedPlace.marker().getPosition();
			var lat = selectedLoc.lat();
			var lng = selectedLoc.lng();
			var parameters = {
				oauth_consumer_key: config.yelpConsumerKey,
				oauth_token: config.yelpToken,
				oauth_nonce: nonce_generate(),
				oauth_timestamp: Math.floor(Date.now() / 1000),
				oauth_signature_method: 'HMAC-SHA1',
				oauth_version: '1.0',
				callback: 'cb', // This is crucial to include for jsonp implementation in AJAX or else the oauth-signature will be wrong.
				//ll: selectedPlace.marker().getPosition().toUrlValue(99) + ",9.5",
				bounds: (lat - config.yelpAccuracy) + "," + (lng - config.yelpAccuracy) + "|" + (lat + config.yelpAccuracy) + "," + (lng + config.yelpAccuracy),
				term: "food",
				sort: 1, //sort by distance
			};

			var encodedSignature = oauthSignature.generate('GET', yelp_url, parameters, config.yelpConsumerSecret, config.yelpTokenSecret);
			parameters.oauth_signature = encodedSignature;

			var settings = {
				url: yelp_url,
				data: parameters,
				cache: true, // This is crucial to include as well to prevent jQuery from adding on a cache-buster parameter "_=23489489749837", invalidating our oauth-signature
				dataType: 'jsonp',
				success: function(results) {
					var setToMatch = FuzzySet([]);
					for (var i = 0; i < results.businesses.length; i++) {
						setToMatch.add(results.businesses[i].name);
					}

					var match = setToMatch.get(selectedPlace.marker().title);
					if (match[0][0] > config.minFuzzyMatch) {
						var correctResult = results.businesses[setToMatch.values().indexOf(match[0][1])];
						selectedPlace.yelpSearchType("Search");
						selectedPlace.yelpID(correctResult.id);
						selectedPlace.yelpIsPermaClosed(correctResult.is_closed);
						selectedPlace.yelpName(correctResult.name);
						selectedPlace.yelpImageURL(correctResult.image_url);
						selectedPlace.yelpURL(correctResult.url);
						selectedPlace.yelpReviewCount(correctResult.review_count);
						selectedPlace.yelpRating(correctResult.rating);
						selectedPlace.yelpSnippetText(correctResult.snippet_text);
						selectedPlace.yelpMenuProvider(correctResult.menu_provider);
						selectedPlace.yelpMenuDateUpdated(correctResult.menu_date_updated);
						selectedPlace.yelpReservationURL(correctResult.reservation_url);
						selectedPlace.yelpEat24URL(correctResult.eat24_url);
						selectedPlace.yelpGiftCertificates(correctResult.gift_certificates);
						selectedPlace.yelpDeals(correctResult.deals);
						selectedPlace.yelpCategories(correctResult.categories);
					} else {
						console.log("no match");
					}
				},
				fail: function() {
					// Do stuff on fail
				}
			};

			// Send AJAX query via jQuery library.
			$.ajax(settings);
			if (typeof callback === "function") {
				callback();
			}
		};

		self.getYelpDetailedReviews = function(selectedPlace, callback) {
			if (!selectedPlace) {
				selectedPlace = self.currentlySelectedLocation();
			}
			var yelp_url = config.yelpBaseURL + 'business/' + selected_place.yelpID;
			var selectedLoc = selectedPlace.marker().getPosition();
			var lat = selectedLoc.lat();
			var lng = selectedLoc.lng();
			var parameters = {
				oauth_consumer_key: config.yelpConsumerKey,
				oauth_token: config.yelpToken,
				oauth_nonce: nonce_generate(),
				oauth_timestamp: Math.floor(Date.now() / 1000),
				oauth_signature_method: 'HMAC-SHA1',
				oauth_version: '1.0',
				callback: 'cb', // This is crucial to include for jsonp implementation in AJAX or else the oauth-signature will be wrong.
				//ll: selectedPlace.marker().getPosition().toUrlValue(99) + ",9.5",
				bounds: (lat - config.yelpAccuracy) + "," + (lng - config.yelpAccuracy) + "|" + (lat + config.yelpAccuracy) + "," + (lng + config.yelpAccuracy),
				term: "food",
				sort: 1, //sort by distance
			};

			var encodedSignature = oauthSignature.generate('GET', yelp_url, parameters, config.yelpConsumerSecret, config.yelpTokenSecret);
			parameters.oauth_signature = encodedSignature;

			var settings = {
				url: yelp_url,
				data: parameters,
				cache: true, // This is crucial to include as well to prevent jQuery from adding on a cache-buster parameter "_=23489489749837", invalidating our oauth-signature
				dataType: 'jsonp',
				success: function(results) {
					var setToMatch = FuzzySet([]);
					for (var i = 0; i < results.businesses.length; i++) {
						setToMatch.add(results.businesses[i].name);
					}

					var match = setToMatch.get(selectedPlace.marker().title);
					if (match[0][0] > config.minFuzzyMatch) {
						var correctResult = results.businesses[setToMatch.values().indexOf(match[0][1])];
						selectedPlace.yelpSearchType("Search");
						selectedPlace.yelpID(correctResult.id);
						selectedPlace.yelpIsPermaClosed(correctResult.is_closed);
						selectedPlace.yelpName(correctResult.name);
						selectedPlace.yelpImageURL(correctResult.image_url);
						selectedPlace.yelpURL(correctResult.url);
						selectedPlace.yelpReviewCount(correctResult.review_count);
						selectedPlace.yelpRating(correctResult.rating);
						selectedPlace.yelpSnippetText(correctResult.snippet_text);
						selectedPlace.yelpMenuProvider(correctResult.menu_provider);
						selectedPlace.yelpMenuDateUpdated(correctResult.menu_date_updated);
						selectedPlace.yelpReservationURL(correctResult.reservation_url);
						selectedPlace.yelpEat24URL(correctResult.eat24_url);
						selectedPlace.yelpGiftCertificates(correctResult.gift_certificates);
						selectedPlace.yelpDeals(correctResult.deals);
						selectedPlace.yelpCategories(correctResult.categories);
					} else {
						console.log("no match");
					}
				},
				fail: function() {
					// Do stuff on fail
				}
			};

			// Send AJAX query via jQuery library.
			$.ajax(settings);
			if (typeof callback === "function") {
				callback();
			}
		};

		self.getDetailedReviewData = function() {
			console.log();
		};
	}

	function createMap() {
		var defaultLatLng = new google.maps.LatLng(41.699, -73.925),
			defaultZoom = 15,
			mapElement = document.getElementById('mapDiv'),
			defaultStyle = [{
				"featureType": "water",
				"elementType": "geometry",
				"stylers": [{
					"color": "#193341"
				}]
			}, {
				"featureType": "landscape",
				"elementType": "geometry",
				"stylers": [{
					"color": "#2c5a71"
				}]
			}, {
				"featureType": "road",
				"elementType": "geometry",
				"stylers": [{
					"color": "#29768a"
				}, {
					"lightness": -37
				}]
			}, {
				"featureType": "poi",
				"elementType": "geometry",
				"stylers": [{
					"color": "#406d80"
				}]
			}, {
				"featureType": "transit",
				"elementType": "geometry",
				"stylers": [{
					"color": "#406d80"
				}]
			}, {
				"elementType": "labels.text.stroke",
				"stylers": [{
					"visibility": "on"
				}, {
					"color": "#3e606f"
				}, {
					"weight": 2
				}, {
					"gamma": 0.84
				}]
			}, {
				"elementType": "labels.text.fill",
				"stylers": [{
					"color": "#ffffff"
				}]
			}, {
				"featureType": "administrative",
				"elementType": "geometry",
				"stylers": [{
					"weight": 0.6
				}, {
					"color": "#1a3541"
				}]
			}, {
				"elementType": "labels.icon",
				"stylers": [{
					"visibility": "off"
				}]
			}, {
				"featureType": "poi.park",
				"elementType": "geometry",
				"stylers": [{
					"color": "#2c5a71"
				}]
			}];

		var mapOptions = {
			center: defaultLatLng,
			zoom: defaultZoom,
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			styles: defaultStyle
		};

		var mainGoogleMap = new google.maps.Map(mapElement, mapOptions);
		var viewModel1 = new ViewModel(mainGoogleMap);
		ko.applyBindings(viewModel1);

		var lastBoundChange = 0;
		google.maps.event.addListener(mainGoogleMap, 'bounds_changed', function() {
			if (Date.now() - lastBoundChange > 50) {
				viewModel1.checkIfOnMap(viewModel1.mainMap.getBounds());
				if (Date.now() - lastBoundChange > 1000) {
					if (typeof(viewModel1.getRestaurantsFromGoogleMapsAPICallArray[viewModel1.getRestaurantsFromGoogleMapsAPICallArray.length - 1]) !== 'undefined') {
						viewModel1.getRestaurantsFromGoogleMapsAPICallArray[viewModel1.getRestaurantsFromGoogleMapsAPICallArray.length - 1] = false;
					}
					viewModel1.getRestaurantsFromGoogleMapsAPICallArray.push(true);
					viewModel1.getRestaurantsFromGoogleMapsAPI(viewModel1.getRestaurantsFromGoogleMapsAPICallArray.length - 1);
					lastBoundChange = Date.now();
				}
			}
		});
	}


	return {
		createMap: createMap
	};

}());