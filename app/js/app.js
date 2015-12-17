var app = (function() {

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

	_now = Date.now || function() {
		return new Date().getTime();
	};

	function debounce(func, wait, immediate) {
		var timeout, args, context, timestamp, result;

		var later = function() {
			var last = _now() - timestamp;

			if (last < wait && last >= 0) {
				timeout = setTimeout(later, wait - last);
			} else {
				timeout = null;
				if (!immediate) {
					result = func.apply(context, args);
					if (!timeout) context = args = null;
				}
			}
		};

		return function() {
			context = this;
			args = arguments;
			timestamp = _now();
			var callNow = immediate && !timeout;
			if (!timeout) timeout = setTimeout(later, wait);
			if (callNow) {
				result = func.apply(context, args);
				context = args = null;
			}

			return result;
		};
	}

	function throttle(func, wait, options) {
		var context, args, result;
		var timeout = null;
		var previous = 0;
		if (!options) options = {};
		var later = function() {
			previous = options.leading === false ? 0 : _now();
			timeout = null;
			result = func.apply(context, args);
			if (!timeout) context = args = null;
		};
		return function() {
			var now = _now();
			if (!previous && options.leading === false) previous = now;
			var remaining = wait - (now - previous);
			context = this;
			args = arguments;
			if (remaining <= 0 || remaining > wait) {
				if (timeout) {
					clearTimeout(timeout);
					timeout = null;
				}
				previous = now;
				result = func.apply(context, args);
				if (!timeout) context = args = null;
			} else if (!timeout && options.trailing !== false) {
				timeout = setTimeout(later, remaining);
			}
			return result;
		};
	}

	function matchBasedOnName(arrayOfResults, nameToMatch, nameOfName) {
		if (typeof(nameOfName) === "undefined") {
			nameOfName = 'name';
		}
		var setToMatch = FuzzySet([]);
		for (var i = 0; i < arrayOfResults.length; i++) {
			setToMatch.add(arrayOfResults[i][nameOfName]);
		}

		var match = setToMatch.get(nameToMatch);
		if ((match !== null) && (match[0][0] > appConfigObject.minFuzzyMatch)) {
			return setToMatch.values().indexOf(match[0][1]);
		} else {
			return false;
		}
	}

	function distanceBetweenTwoPointsInMeters(lat1, lon1, lat2, lon2) {
		var p = 0.017453292519943295; // Math.PI / 180
		var c = Math.cos;
		var a = 0.5 - c((lat2 - lat1) * p) / 2 +
			c(lat1 * p) * c(lat2 * p) *
			(1 - c((lon2 - lon1) * p)) / 2;
		// 2 * R; R = 6371 km * 1000 for meters
		return 12742000 * Math.asin(Math.sqrt(a));
	}

	function allValuesSameInTwoArray(a1, a2) {
		for (var i = 0; i < a1.length; i++) {
			if (a1[i] !== a2[i]) {
				return false;
			}
		}
		return true;
	}

	function storageAvailable(type) {
		try {
			var storage = window[type],
				x = '__storage_test__';
			storage.setItem(x, x);
			storage.removeItem(x);
			return true;
		} catch (e) {
			return false;
		}
	}

	var updatePerfectScrollbar = throttle(function(jqueryObject) {
		jqueryObject.perfectScrollbar('update');
	}, 16, {
		"leading": false
	});

	ko.bindingHandlers.ko_autocomplete = {
		init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			$(element).autocomplete(valueAccessor());
		},
		update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			var source = function(request, response) {
				var results = $.ui.autocomplete.filter(valueAccessor().source, request.term);
				response(results.slice(0, 6));
			};
			var select = function(event, ui) {
				allBindingsAccessor().textInput(ui.item.value);
			};
			$(element).autocomplete({
				source: source,
				select: select
			});
		}
	};

	ko.bindingHandlers.addressAutocomplete = {
		init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			var value = valueAccessor(),
				allBindings = allBindingsAccessor(),
				map = bindingContext.$data.mainMap;

			var options = {
				types: ['geocode']
			};
			ko.utils.extend(options, allBindings.autocompleteOptions);

			var autocomplete = new google.maps.places.Autocomplete(element, options);
			autocomplete.bindTo('bounds', map);

			autocomplete.addListener('place_changed', function() {
				//infowindow.close();
				//marker.setVisible(false);
				var place = autocomplete.getPlace();
				if (!place.geometry) {
					//window.alert("Autocomplete's returned place contains no geometry");
					return;
				}

				// If the place has a geometry, then present it on a map.
				if (place.geometry.viewport) {
					map.fitBounds(place.geometry.viewport);
				} else {
					map.setCenter(place.geometry.location);
					map.setZoom(appConfigObject.defaultZoom);
				}
			});
		},
		update: function(element, valueAccessor, allBindingsAccessor) {
			ko.bindingHandlers.value.update(element, valueAccessor());
		}
	};

	ko.bindingHandlers.ko_slideOutMenu = {
		init: function(element, valueAccessor) {
			$.slidebars();
		}
	};

	ko.bindingHandlers.scrollTo = {
		update: function(element, valueAccessor, allBindings) {
			var _value = valueAccessor();
			var _valueUnwrapped = ko.unwrap(_value);
			if (_valueUnwrapped) {
				var scrollItemIntoView = throttle(function() {
					$(element).scrollintoview({
						duration: 100
					});
				}, 50);
				scrollItemIntoView();
			}
		}
	};

	ko.bindingHandlers.hoverToggle = {
		init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			ko.utils.registerEventHandler(element, "mouseover", function() {
				bindingContext.$data.shouldScroll(false);
				$(element).stop(false, true);
			});
		}
	};

	ko.bindingHandlers.ko_slider = {
		init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			ko.bindingHandlers.value.init(element, valueAccessor, allBindings, viewModel, bindingContext);
			var passValue = valueAccessor();
			passValue.value = valueAccessor().value();
			$(element).slider(passValue).on("slidechange", function(event, ui) {
				valueAccessor().value(ui.value);
			});
		}
	};

	ko.bindingHandlers.ko_rateit = {
		init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			$(element).bind('reset', function() {
				valueAccessor().value(0);
			});
		}
	};

	ko.bindingHandlers.ko_styleInfoWindow = {
		init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			var subContainer = $(element).parent().parent().addClass('custom-info-window-subcontainer');
			var containerSiblings = subContainer.siblings();
			var containerSubSiblings, backgroundContainer;
			for (var i = 0; i < containerSiblings.length; i++) {
				if ($(containerSiblings[i]).css('top') === '0px') {
					containerSubSiblings = $(containerSiblings[i]).addClass('custom-info-window-background-container').children();
					break;
				}
			}
			if (containerSubSiblings) {
				for (var j = 0; j < containerSubSiblings.length; j++) {
					if ($(containerSubSiblings[j]).css('background-color') === 'rgb(255, 255, 255)') {
						backgroundContainer = $(containerSubSiblings[j]).addClass('custom-info-window-background');
						break;
					}
				}
				if (backgroundContainer) {
					var container = subContainer.parent().parent().parent().addClass('custom-info-window');
					backgroundContainer.css({'background-color':'', 'border-radius': ''});
				}
			}
		}
	};

	ko.bindingHandlers.ko_bootstrapTooltip = {
		init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			$('[data-toggle="tooltip"]').tooltip({
				container: 'body'
			});
		}
	};

	ko.bindingHandlers.ko_perfectScrollbar = {
		init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			$(element).perfectScrollbar();

			function hoverHandler(event) {
				updatePerfectScrollbar($(this));
				killHandler();
			}

			function killHandler() {
				$(element).unbind('mouseenter', hoverHandler);
			}
			$(element).bind("mouseenter", hoverHandler);
		},
		update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			var data = ko.utils.unwrapObservable(valueAccessor());
			updatePerfectScrollbar($(element));
		}
	};

	ko.bindingHandlers.generateStars = {
		update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			var stars = ko.unwrap(valueAccessor());
			var wholeStars = Math.floor(stars);
			var partialStar = stars - wholeStars;
			var toAppend = '';
			for (var i = 1; i <= stars; i++) {
				toAppend += '<span class="glyphicon glyphicon-star" aria-hidden="true"></span>';
			}
			if (partialStar > 0) {
				toAppend += '<span class="glyphicon glyphicon-star partial-width-' +
					Math.round(partialStar * 10) + '" aria-hidden="true"></span>';
			}
			if (toAppend !== '') {
				$(element).html(toAppend);
			}
		}
	};

	ko.bindingHandlers.generateUSD = {
		update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			var price = ko.unwrap(valueAccessor());
			var toAppend = '';
			for (var i = 1; i <= price; i++) {
				toAppend += '<i class="fa fa-usd"></i>';
			}
			if (toAppend !== '') {
				$(element).html(toAppend);
			}
		}
	};

	ko.bindingHandlers.menuToggle = {
		init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			var value = ko.unwrap(valueAccessor());
			ko.utils.registerEventHandler(element, "click", function() {
				$(element).toggleClass('mobile-button-pressed');
				$('#' + value).toggleClass('panel-visible');
				$(element).trigger('mouseleave');
			});
		}
	};

	ko.bindingHandlers.scrollToItem = {
		update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			var data = ko.utils.unwrapObservable(valueAccessor());
			bindingContext.$data.scrollToItem();
		}
	};

	ko.extenders.numeric = function(target, precision) {
		var result = ko.computed({
			read: function() {
				var num = (Number(target()).toFixed(2)) / 1;
				return num;
			},
			write: target
		});

		return result;
	};


	function LocationModel(currentViewModel, searchType) {
		var self = this;
		//Initialize
		self.googleSearchType = ko.observable(searchType);
		self.yelpSearchType = ko.observable("None");
		self.locuSearchType = ko.observable("None");
		self.foursquareSearchType = ko.observable("None");

		self.isInViewOnMap = ko.observable(true);
		self.isListed = ko.observable(false);
		self.isSelected = ko.observable(false);
		self.hasBeenOpened = false;
		self.modelNumber = currentViewModel.locationModelNumber;
		currentViewModel.locationModelNumber++;
		self.isFavorite = ko.observable(false);

		self.isFavorite.subscribe(function(newValue) {
			if (newValue === true) {
				currentViewModel.favoriteArray.push(self);
			} else {
				currentViewModel.favoriteArray.remove(self);
			}
		});

		self.disposableArray = [];
		self.listenerStorage = [];

		currentViewModel.modelConstructor(self);
		self.marker = ko.observable(new google.maps.Marker({
			map: currentViewModel.mainMap,
			opacity: (self.isListed() === false ? currentViewModel.lowMarkerOpacity() : appConfigObject.highMarkerOpacity),
			icon: currentViewModel.markerImageCreator(),
			shape: appConfigObject.defaultMarkerShape,
		}));

		self.disposableArray.push(self.google_priceLevel.subscribe(function(newValue) {
			self.marker().setIcon(currentViewModel.markerImageCreator(self.isFavorite(), newValue));
			self.marker(self.marker());
		}));

		self.disposableArray.push(self.isFavorite.subscribe(function(newValue) {
			self.marker().setIcon(currentViewModel.markerImageCreator(newValue, self.google_priceLevel()));
			self.marker(self.marker());
		}));

		self.disposableArray.push(self.google_name.subscribe(function(newValue) {
			self.marker().setTitle(newValue);
			self.marker(self.marker());
		}));

		self.disposableArray.push(self.google_geometry.subscribe(function(newValue) {
			self.marker().setPosition(newValue.location);
			self.marker(self.marker());
		}));

		self.disposableArray.push(self.isSelected.subscribe(function(newValue) {
			if (newValue === true) {
				currentViewModel.currentlySelectedLocation(self);
			} else {
				currentViewModel.currentlySelectedLocation(undefined);
			}
		}));

		self.disposableArray.push(self.isListed.subscribe(function(newValue) {
			if (newValue) {
				self.marker().setOpacity(appConfigObject.highMarkerOpacity);
				self.marker(self.marker());
			} else {
				self.marker().setOpacity(currentViewModel.lowMarkerOpacity());
				self.marker(self.marker());
			}
		}));

		self.isItOpenRightNow = ko.pureComputed(function() {
			if (typeof(self.google_openingHoursObject()) !== "undefined") {
				if (self.google_openingHoursObject().open_now === true) {
					return "Open";
				} else if (self.google_openingHoursObject().open_now === false) {
					return "Closed";
				}
			}
		});

		self.infoWindow = new google.maps.InfoWindow({
			content: currentViewModel.makeInfoWindowContent(),
		});

		self.listenerStorage.push(self.infoWindow.addListener("closeclick", function() {
			currentViewModel.currentlySelectedLocation().isSelected(false);
		}));

		self.listenerStorage.push(self.infoWindow.addListener("domready", function() {
			if (!self.hasBeenOpened) {
				ko.applyBindings(currentViewModel, self.infoWindow.getContent());
				self.hasBeenOpened = true;
			}
		}));

		self.listenerStorage.push(self.marker().addListener('click', function() {
			currentViewModel.shouldScroll(true);
			currentViewModel.getDetailedGooglePlacesAPIInfo(self, currentViewModel.callSearchAPIs, self);
			if (typeof(currentViewModel.currentlySelectedLocation()) !== 'undefined') {
				currentViewModel.currentlySelectedLocation().infoWindow.close();
				currentViewModel.currentlySelectedLocation().isSelected(false);
			}
			self.isSelected(true);
			self.marker().setAnimation(google.maps.Animation.BOUNCE);
			setTimeout(function() {
				self.marker().setAnimation(null);
			}, 750);
			self.infoWindow.open(self.marker().map, self.marker());
		}));

		self.listWasClicked = function() {
			new google.maps.event.trigger(self.marker(), 'click');
			self.marker().map.panTo(self.google_geometry().location);
		};

		self.dispose = function() {
			self.marker().setMap(null);
			ko.utils.arrayForEach(self.disposableArray, function(disposable) {
				disposable.dispose();
			});
			ko.utils.arrayForEach(self.listenerStorage, function(item) {
				google.maps.event.removeListener(item);
			});
		};
	}

	function ViewModel(map) {
		var self = this;
		self.mainMap = map;
		self.mainMapCenter = ko.observable();
		self.storageAvailable = storageAvailable('localStorage');
		self.maxMarkerLimit = ko.observable(appConfigObject.maxMarkerLimit);
		self.lowMarkerOpacity = ko.observable(appConfigObject.lowMarkerOpacity);
		self.defaultMarkerImage = {
			size: new google.maps.Size(appConfigObject.markerImageSize[0], appConfigObject.markerImageSize[1]),
			origin: new google.maps.Point(appConfigObject.markerImageOrigin[0], appConfigObject.markerImageOrigin[1]),
			anchor: new google.maps.Point(appConfigObject.markerImageAnchor[0], appConfigObject.markerImageAnchor[1])
		};

		self.markerImageCreator = function(isFavorite, priceLevel) {
			var markerObject = self.defaultMarkerImage;
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

		self.lowMarkerOpacity.subscribe(function(newValue) {
			newValue = (Number(newValue).toFixed(2)) / 1;
			ko.utils.arrayForEach(self.markedLocations(), function(item) {
				if (item.isListed() === false) {
					item.marker().setOpacity(newValue);
				}
			});
		});

		self.lowMarkerOpacity.extend({
			numeric: 2
		});


		self.mainMapCenter.subscribe(function(newValue) {
			self.setLocalStorage("mapCenter", JSON.stringify({
				'lat': newValue.lat(),
				'lng': newValue.lng(),
				'zoom': self.mainMap.getZoom()
			}));
		});

		self.getNavWithCallback = function() {
			if (navigator.geolocation) {
				return navigator.geolocation.getCurrentPosition(self.mapPanFromNavigation);
			} else {
				return false;
			}
		};

		self.mapPanFromNavigation = function(position) {
			self.mapPan(position.coords.latitude, position.coords.longitude);
		};

		self.mapPan = function(lat, lng) {
			var userLatLng = new google.maps.LatLng(lat, lng);
			self.mainMap.panTo(userLatLng);
		};

		self.APIMappingsForModel = appConfigObject.APIMappingsForModel;

		self.modelConstructor = function(model) {
			for (var prop in self.APIMappingsForModel) {
				var currentType = self.APIMappingsForModel[prop];
				for (var i = 0; i < currentType.length; i++) {
					if (currentType[i].oType === 1) {
						model[currentType[i].model] = ko.observable();
					} else if (currentType[i].oType === 2) {
						model[currentType[i].model] = ko.observableArray([]);
					}
				}
			}
		};

		self.modelDeconstructor = function(model) {
			var returnModel = {};
			for (var prop in self.APIMappingsForModel) {
				var currentType = self.APIMappingsForModel[prop];
				for (var i = 0; i < currentType.length; i++) {
					if (currentType[i].oType === 0) {
						returnModel[currentType[i].model] = model[currentType[i].model];
					} else {
						returnModel[currentType[i].model] = model[currentType[i].model]();
					}
				}
			}
			return returnModel;
		};


		self.modelUpdater = function(model, type, result) {
			currentType = self.APIMappingsForModel[type];
			for (var i = 0; i < currentType.length; i++) {
				if (typeof(result[currentType[i].server]) !== "undefined") {
					if (currentType[i].oType !== 0) {
						model[currentType[i].model](result[currentType[i].server]);
					} else {
						model[currentType[i].model] = result[currentType[i].server];
					}
				}
			}
		};

		self.modelRebuilder = function(model, blueprint, location) {
			for (var prop in self.APIMappingsForModel) {
				var currentType = self.APIMappingsForModel[prop];
				for (var i = 0; i < currentType.length; i++) {
					if ((currentType[i].oType !== 0) && (currentType[i].model !== "google_geometry")) {
						model[currentType[i].model](blueprint[currentType[i].model]);
					} else if (currentType[i].model === "google_geometry") {
						var geometryBlueprint = blueprint[currentType[i].model];
						geometryBlueprint.location = location;
						model[currentType[i].model](geometryBlueprint);
					} else {
						model[currentType[i].model] = blueprint[currentType[i].model];
					}
				}
			}
		};

		// Specify location, radius and place types for your Places API search.
		self.markedLocations = ko.observableArray([]);

		self.removeMultipleLocations = throttle(function(newValue) {
			var toRemove = [];
			var j = 0;
			self.markedLocations.sort(function(left, right) {
				return (left.isFavorite() === true ? 1 : (left.modelNumber < right.modelNumber ? -1 : 1));
			});
			for (var i = 0; i < appConfigObject.markerLimitRemoveBulkAmount; i++) {
				newValue[i].dispose();
			}
			self.markedLocations.splice(0, appConfigObject.markerLimitRemoveBulkAmount);
		}, 1000, {
			"trailing": false
		});

		self.markedLocations.subscribe(function(newValue) {
			if (newValue.length > self.maxMarkerLimit()) {
				self.removeMultipleLocations(newValue);
			}
		});

		self.locationModelNumber = 0;

		self.favoriteArray = ko.observableArray([]);

		self.favoriteArray.subscribe(function(newValue) {
			var favoritesArray = [];
			ko.utils.arrayForEach(newValue, function(item) {
				favoritesArray.push(self.modelDeconstructor(item));
			});
			var favoritesString = JSON.stringify(favoritesArray);
			if (favoritesArray.length !== 0) {
				self.setLocalStorage("favoritesArray", favoritesString);
			}
		});

		self.favoriteArray.extend({
			rateLimit: 2000
		});

		self.setLocalStorage = throttle(function(name, item) {
			if (self.storageAvailable === true) {
				localStorage.setItem(name, item);
			}
		}, 1000, {
			"trailing": false
		});

		self.idArray = ko.pureComputed(function() {
			var returnArray = {
				"all": [],
				"nearby": []
			};
			ko.utils.arrayMap(self.markedLocations(), function(item) {
				if ((item.googleSearchType() === "Nearby") || (item.googleSearchType() === "Places")) {
					returnArray.nearby.push(item.google_placeId);
				}
				returnArray.all.push(item.google_placeId);
			});
			return returnArray;
		});

		self.locationArrayForWorkers = function() {
			return ko.utils.arrayMap(self.listableEntries(), function(item) {
				return {
					"lat": item.google_geometry().location.lat(),
					"lng": item.google_geometry().location.lng(),
					"name": item.google_name(),
					"google_placeId": item.google_placeId
				};
			});
		};

		self.getRestaurantsFromGoogleMapsAPICallArray = [];

		self.attributionsArray = ko.observableArray([]);

		self.sortType = ko.observable("count");

		self.searchQuery = ko.observable();

		self.priceButtonFilter = ko.observableArray([true, true, true, true, true]);
		self.priceButtonFilterHasChanged = ko.pureComputed(function() {
			return !allValuesSameInTwoArray(self.priceButtonFilter(), [true, true, true, true, true]);
		});
		self.minRatingButtonFilter = ko.observable(0);
		self.openButtonFilter = ko.observable(false);
		self.favoriteButtonFilter = ko.observable(false);

		self.isSearchFiltered = function(item) {
			if (typeof(self.searchQuery()) !== "undefined") {
				if (item.google_name().toLowerCase()
					.indexOf(self.searchQuery().toLowerCase()) >= 0) {
					return false;
				} else {
					return true;
				}
			} else {
				return false;
			}
		};

		self.isButtonFiltered = function(item) {
			if (self.priceButtonFilterHasChanged() === true) {
				if (typeof(item.google_priceLevel()) !== "undefined") {
					for (var i = 0; i < 5; i++) {
						if (self.priceButtonFilter()[i] !== true) {
							if (item.google_priceLevel() === i) {
								return true;
							}
						}
					}
				} else {
					if (self.priceButtonFilter()[0] !== true) {
						return true;
					}
				}
			}
			if (self.minRatingButtonFilter() !== 0) {
				if (typeof(item.google_rating()) !== "undefined") {
					if (item.google_rating() < self.minRatingButtonFilter()) {
						return true;
					}
				} else {
					return true;
				}
			}
			if (self.openButtonFilter() !== false) {
				if (item.isItOpenRightNow() !== "Open") {
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

		self.listableEntries = ko.computed(function() {
			var returnArray = {
				"entries": [],
				"allNames": []
			};
			returnArray.entries = ko.utils.arrayFilter(self.markedLocations(), function(item) {
				if (((item.googleSearchType() === "Nearby") ||
						(item.googleSearchType() === "Places")) &&
					(item.isInViewOnMap() === true) &&
					(self.isSearchFiltered(item) === false) &&
					self.isButtonFiltered(item) === false) {
					item.isListed(true);
					returnArray.allNames.push(item.google_name());
					return true;
				} else {
					item.isListed(false);
					return false;
				}
			});
			return returnArray;
		});

		self.sortedEntries = ko.pureComputed(function() {
			var returnArray = self.listableEntries().entries;
			if (self.sortType() === "count") {
				returnArray.sort(
					function(left, right) {
						return (left.modelNumber < right.modelNumber ? -1 : 1);
					});
			} else if (self.sortType() === "alpha") {
				returnArray.sort(
					function(left, right) {
						return left.google_name() === right.google_name() ? 0 :
							(left.google_name() < right.google_name() ? -1 : 1);
					});
			} else if (self.sortType() === "rating") {
				returnArray.sort(
					function(left, right) {
						if (typeof(left.google_rating()) === "undefined") {
							if (typeof(right.google_rating()) === "undefined") {
								return 0;
							} else {
								return 1;
							}
						} else if (typeof(right.google_rating()) === "undefined") {
							return -1;
						} else {
							return (left.google_rating() < right.google_rating() ? 1 : -1);
						}
					});
			} else if (self.sortType() === "distance") {
				returnArray.sort(
					function(left, right) {
						var x1 = left.google_geometry().location.lat();
						var x2 = right.google_geometry().location.lat();
						var x3 = self.mainMapCenter().lat();
						var y1 = left.google_geometry().location.lng();
						var y2 = right.google_geometry().location.lng();
						var y3 = self.mainMapCenter().lng();
						var dist1 = distanceBetweenTwoPointsInMeters(x1, y1, x3, y3);
						var dist2 = distanceBetweenTwoPointsInMeters(x2, y2, x3, y3);
						return (dist1 === dist2 ? 0 : (dist1 < dist2 ? -1 : 1));
					});
			}
			return returnArray;
		});

		self.listableEntries.extend({
			rateLimit: 50
		});

		self.currentlySelectedLocation = ko.observable();

		self.scrolledItem = ko.observable();

		self.shouldScroll = ko.observable(false);

		self.currentlySelectedLocation.subscribe(debounce(function(newValue) {
			if (typeof(newValue) !== "undefined") {
				self.scrollToItem();
			}
		}, 5));

		self.scrollToItem = function() {
			if ((typeof(self.currentlySelectedLocation()) !== "undefined") && (self.shouldScroll() === true)) {
				self.scrolledItem(self.currentlySelectedLocation());
			}
		};

		self.service = new google.maps.places.PlacesService(self.mainMap);

		self.infoWindowHTMLTemplate = $('#info-window-template-container')[0].innerHTML;

		self.makeInfoWindowContent = function() {
			var html = self.infoWindowHTMLTemplate;
			html = $.parseHTML(html)[1];
			return html;
		};

		self.checkIfOnMap = function(currentBounds) {
			ko.utils.arrayForEach(self.markedLocations(), function(item) {
				if (currentBounds.contains(item.google_geometry().location) === false) {
					item.isInViewOnMap(false);
				} else {
					item.isInViewOnMap(true);
				}
			});
		};

		self.compareIDs = function(iDToCompare) {
			return ko.utils.arrayFirst(self.markedLocations(), function(item) {
				return item.google_placeId === iDToCompare;
			});
		};

		self.successAPIFunction = function(results, selectedPlace, setResultSearchType, type, clonedMarkedLocations, initialPoint) {

			function updateModel(result) {
				setResultSearchType(selectedPlace);
				self.modelUpdater(selectedPlace, type, result);
			}

			if (typeof(clonedMarkedLocations) !== "undefined") {
				var match = matchBasedOnName(results, selectedPlace.google_name());
				if (typeof(match) === 'number') {
					updateModel(results[match]);
					results.splice(match, 1);
				} else {
					setResultSearchType(selectedPlace);
					console.info(type + ": No Match");
				}

				var workerArray = {
					"resultsArray": results,
					"locationsArray": clonedMarkedLocations,
					"initialPoint": initialPoint,
					"maxDistance": appConfigObject.latLngAccuracy,
					"type": type,
					"minFuzzyMatch": appConfigObject.minFuzzyMatch
				};

				self.workerHandler(workerArray, "yelp", setResultSearchType);
			} else {
				updateModel(results);
			}
		};

		self.failAPIFunction = function(customMessage, textStatus, errorThrown) {
			console.warn(customMessage + ": " + textStatus);
		};

		self.currentDetailedReviewDataBeingFetched = [];
		self.currentDetailedMenuDataBeingFetched = [];
		self.currentDetailedFoursquareDataBeingFetched = [];

		self.getDetailedReviewData = function() {
			if ((self.currentlySelectedLocation().yelpSearchType() === "Search") &&
				(self.currentDetailedReviewDataBeingFetched
					.indexOf(self.currentlySelectedLocation().google_placeId) === -1)) {
				self.currentDetailedReviewDataBeingFetched
					.push(self.currentlySelectedLocation().google_placeId);
				self.getYelpDetailedReviews();
			}
		};

		self.getDetailedMenuData = function() {
			if ((self.currentlySelectedLocation().locuSearchType() === "Search") &&
				(self.currentDetailedMenuDataBeingFetched
					.indexOf(self.currentlySelectedLocation().google_placeId) === -1)) {
				self.currentDetailedMenuDataBeingFetched
					.push(self.currentlySelectedLocation().google_placeId);
				self.getLocuDetailedInfo();
			}
		};

		self.getDetailedFoursquareData = function() {
			if ((self.currentlySelectedLocation().foursquareSearchType() === "Search") &&
				(self.currentDetailedFoursquareDataBeingFetched
					.indexOf(self.currentlySelectedLocation().google_placeId) === -1)) {
				self.currentDetailedFoursquareDataBeingFetched
					.push(self.currentlySelectedLocation().google_placeId);
				self.getFoursquareDetailedAPIInfo();
			}
		};

		self.getRestaurantsFromGoogleMapsAPI = function(callArrayIndex) {
			var currentMapBounds = self.mainMap.getBounds();

			var request = {
				bounds: currentMapBounds,
				types: ['restaurant']
			};

			function checkAndAddFullAttributions(attributionsArray) {
				console.info("HTML Attribution Actually Found");
				var attributionsToPush = [];
				for (var z = 0; z < attributionsArray.length; z++) {
					if (self.attributionsArray.indexOf(attributionsArray[z]) === -1) {
						attributionsToPush.push(attributionsArray[z]);
					}
				}
				self.attributionsArray.push.apply(self.attributionsArray, attributionsToPush);
			}

			var setResultSearchType = function(result) {
				result.googleSearchType("Nearby");
			};

			function processNearbyResults(results, status, pagination) {
				if (status !== google.maps.places.PlacesServiceStatus.OK) {
					self.failAPIFunction("Google Maps Nearby Search Error", status);
					return;
				} else {
					var markerList = [];
					for (var i = 0; i < results.length; i++) {
						if (self.idArray().nearby.indexOf(results[i].place_id) === -1) {
							if (self.idArray().all.indexOf(results[i].place_id) === -1) {
								var newLoc = new LocationModel(self, "Nearby");
								self.successAPIFunction(results[i], newLoc, function() {}, "google");
								markerList.push(newLoc);
							} else {
								var matchedLocation = self.compareIDs(results[i].place_id);
								if (matchedLocation) {
									self.successAPIFunction(results[i],
										matchedLocation, setResultSearchType, "google");
								}
							}
							if (results[i].html_attributions.length !== 0) {
								checkAndAddFullAttributions(results[i].html_attributions);
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
					self.failAPIFunction("Google Maps Radar Search Error", status);
					return;
				} else {
					var markerList = [];
					for (var i = 0; i < results.length; i++) {
						if (self.idArray().all.indexOf(results[i].place_id) === -1) {
							var newLoc = new LocationModel(self, "Radar");
							self.successAPIFunction(results[i], newLoc, function() {}, "google");
							markerList.push(newLoc);
						} //not going to update for performance and because no info to update
						if (results[i].html_attributions.length !== 0) {
							checkAndAddFullAttributions(results[i].html_attributions);
						}
					}
					self.markedLocations.push.apply(self.markedLocations, markerList);
				}
			}

			self.service.radarSearch(request, processRadarResults);
			self.service.nearbySearch(request, processNearbyResults);
		};

		self.getDetailedGooglePlacesAPIInfo = function(selectedPlace, callback, toPassToCallback) {
			if (!selectedPlace) {
				selectedPlace = self.currentlySelectedLocation();
			}

			var setResultSearchType = function(result) {
				result.googleSearchType("Places");
			};

			self.service.getDetails({
				"placeId": selectedPlace.google_placeId
			}, function(result, status) {
				if (status !== google.maps.places.PlacesServiceStatus.OK) {
					self.failAPIFunction("Google Places Search Error", status);
					return;
				}
				self.successAPIFunction(result, selectedPlace, setResultSearchType, "google");
				if (typeof callback === "function") {
					if (typeof(toPassToCallback) !== "undefined") {
						callback(toPassToCallback);
					} else {
						callback();
					}
				}
			});
		};

		self.getYelpAPIInfo = function(selectedPlace, clonedMarkedLocations, callback) {
			if (!selectedPlace) {
				selectedPlace = self.currentlySelectedLocation();
			}
			var yelp_url = appConfigObject.yelpBaseURL + 'search/';
			var lat = selectedPlace.google_geometry().location.lat();
			var lng = selectedPlace.google_geometry().location.lng();
			var initialPoint = {
				"lat": lat,
				"lng": lng
			};
			var parameters = {
				oauth_consumer_key: appConfigObject.yelpConsumerKey,
				oauth_token: appConfigObject.yelpToken,
				oauth_nonce: nonce_generate(),
				oauth_timestamp: Math.floor(Date.now() / 1000),
				oauth_signature_method: 'HMAC-SHA1',
				oauth_version: '1.0',
				callback: 'cb', // This is crucial to include for jsonp implementation in AJAX or else the oauth-signature will be wrong.
				bounds: (lat - appConfigObject.latLngAccuracy) + "," +
					(lng - appConfigObject.latLngAccuracy) + "|" +
					(lat + appConfigObject.latLngAccuracy) + "," +
					(lng + appConfigObject.latLngAccuracy),
				term: "food",
				sort: 1, //sort by distance
			};

			var encodedSignature = oauthSignature.generate('GET', yelp_url,
				parameters, appConfigObject.yelpConsumerSecret,
				appConfigObject.yelpTokenSecret);
			parameters.oauth_signature = encodedSignature;

			var setResultSearchType = function(result) {
				result.yelpSearchType("Search");
			};

			var settings = {
				url: yelp_url,
				data: parameters,
				cache: true, // This is crucial to include as well to prevent jQuery from adding on a cache-buster parameter "_=23489489749837", invalidating our oauth-signature
				dataType: 'jsonp',
				success: function(results) {
					self.successAPIFunction(results.businesses, selectedPlace,
						setResultSearchType, "yelp", clonedMarkedLocations, initialPoint);
				},
				fail: function(jqXHR, textStatus, errorThrown) {
					self.failAPIFunction("Yelp Search Error", textStatus, errorThrown);
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
			var yelp_url = appConfigObject.yelpBaseURL + 'business/' + selectedPlace.yelp_ID();
			var parameters = {
				oauth_consumer_key: appConfigObject.yelpConsumerKey,
				oauth_token: appConfigObject.yelpToken,
				oauth_nonce: nonce_generate(),
				oauth_timestamp: Math.floor(Date.now() / 1000),
				oauth_signature_method: 'HMAC-SHA1',
				oauth_version: '1.0',
				callback: 'cb' // This is crucial to include for jsonp implementation in AJAX or else the oauth-signature will be wrong.
			};

			var encodedSignature = oauthSignature.generate('GET', yelp_url,
				parameters, appConfigObject.yelpConsumerSecret,
				appConfigObject.yelpTokenSecret);
			parameters.oauth_signature = encodedSignature;

			var setResultSearchType = function(result) {
				result.yelpSearchType("Business");
			};

			var settings = {
				url: yelp_url,
				data: parameters,
				cache: true, // This is crucial to include as well to prevent jQuery from adding on a cache-buster parameter "_=23489489749837", invalidating our oauth-signature
				dataType: 'jsonp',
				success: function(results) {
					self.successAPIFunction(results, selectedPlace, setResultSearchType, "yelp");
				},
				fail: function(jqXHR, textStatus, errorThrown) {
					self.failAPIFunction("Yelp Business Details Error", textStatus, errorThrown);
				},
				complete: function() {
					var index = self.currentDetailedReviewDataBeingFetched
						.indexOf(selectedPlace.google_placeId);
					if (index > -1) {
						self.currentDetailedReviewDataBeingFetched.splice(index, 1);
					}
				}
			};

			// Send AJAX query via jQuery library.
			$.ajax(settings);
			if (typeof callback === "function") {
				callback();
			}
		};

		self.getLocuAPIInfo = function(selectedPlace, clonedMarkedLocations, callback) {
			if (!selectedPlace) {
				selectedPlace = self.currentlySelectedLocation();
			}
			var locu_url = appConfigObject.locuBaseURL + "search/";
			var lat = selectedPlace.google_geometry().location.lat();
			var lng = selectedPlace.google_geometry().location.lng();
			var initialPoint = {
				"lat": lat,
				"lng": lng
			};
			var parameters = {
				bounds: (lat + appConfigObject.latLngAccuracy) + "," +
					(lng - appConfigObject.latLngAccuracy) + "|" +
					(lat - appConfigObject.latLngAccuracy) + "," +
					(lng + appConfigObject.latLngAccuracy),
				api_key: appConfigObject.locuAPIKey
			};

			var setResultSearchType = function(result) {
				result.locuSearchType("Search");
			};

			var settings = {
				url: locu_url,
				method: "GET",
				data: parameters,
				cache: true,
				dataType: 'jsonp',
				success: function(results) {
					self.successAPIFunction(results.objects, selectedPlace,
						setResultSearchType, "locu", clonedMarkedLocations, initialPoint);

				},
				fail: function(jqXHR, textStatus, errorThrown) {
					self.failAPIFunction("Locu Search Error", textStatus, errorThrown);
				}
			};

			// Send AJAX query via jQuery library.
			$.ajax(settings);

			if (typeof callback === "function") {
				callback();
			}
		};

		self.getLocuDetailedInfo = function(selectedPlace, callback) {
			if (!selectedPlace) {
				selectedPlace = self.currentlySelectedLocation();
			}
			var locu_url = appConfigObject.locuBaseURL + selectedPlace.locu_id() + "/";
			var parameters = {
				api_key: appConfigObject.locuAPIKey
			};

			var setResultSearchType = function(result) {
				result.locuSearchType("Details");
			};

			var settings = {
				url: locu_url,
				method: "GET",
				data: parameters,
				cache: true,
				dataType: 'jsonp',
				success: function(result) {
					self.successAPIFunction(result.objects[0], selectedPlace,
						setResultSearchType, "locu");
				},
				fail: function(jqXHR, textStatus, errorThrown) {
					self.failAPIFunction("Locu Business Details Error", textStatus, errorThrown);
				},
				complete: function() {
					var index = self.currentDetailedMenuDataBeingFetched
						.indexOf(selectedPlace.google_placeId);
					if (index > -1) {
						self.currentDetailedMenuDataBeingFetched.splice(index, 1);
					}
				}
			};

			// Send AJAX query via jQuery library.
			$.ajax(settings);

			if (typeof callback === "function") {
				callback();
			}
		};

		self.getFoursquareAPIInfo = function(selectedPlace, clonedMarkedLocations, callback) {
			if (!selectedPlace) {
				selectedPlace = self.currentlySelectedLocation();
			}
			var foursquare_url = appConfigObject.foursquareBaseURL + "search";
			var lat = selectedPlace.google_geometry().location.lat();
			var lng = selectedPlace.google_geometry().location.lng();
			var initialPoint = {
				"lat": lat,
				"lng": lng
			};

			var radiusInMeters = distanceBetweenTwoPointsInMeters(lat,
				lng, lat + appConfigObject.latLngAccuracy,
				lng + appConfigObject.latLngAccuracy);
			var parameters = {
				ll: lat + ',' + lng,
				client_id: appConfigObject.foursquareClientID,
				client_secret: appConfigObject.foursquareClientSecret,
				limit: 50,
				v: '20150711',
				categoryId: '4d4b7105d754a06374d81259', //food
				intent: 'checkin',
				radius: radiusInMeters
			};

			var setResultSearchType = function(result) {
				result.foursquareSearchType("Search");
			};

			var settings = {
				url: foursquare_url,
				method: "GET",
				data: parameters,
				cache: true,
				dataType: 'jsonp',
				success: function(results) {
					self.successAPIFunction(results.response.venues,
						selectedPlace, setResultSearchType, "foursquare",
						clonedMarkedLocations, initialPoint);
				},
				fail: function(jqXHR, textStatus, errorThrown) {
					self.failAPIFunction("Foursquare Search Error", textStatus, errorThrown);
				}
			};

			// Send AJAX query via jQuery library.
			$.ajax(settings);

			if (typeof callback === "function") {
				callback();
			}
		};

		self.getFoursquareDetailedAPIInfo = function(selectedPlace, callback) {
			if (!selectedPlace) {
				selectedPlace = self.currentlySelectedLocation();
			}
			var foursquare_url = appConfigObject.foursquareBaseURL + selectedPlace.foursquare_id();

			var parameters = {
				client_id: appConfigObject.foursquareClientID,
				client_secret: appConfigObject.foursquareClientSecret,
				v: '20150711'
			};

			var setResultSearchType = function(result) {
				result.foursquareSearchType("Detail");
			};

			var settings = {
				url: foursquare_url,
				method: "GET",
				data: parameters,
				cache: true,
				dataType: 'jsonp',
				success: function(result) {
					self.successAPIFunction(result.response.venue,
						selectedPlace, setResultSearchType, "foursquare");
				},
				fail: function(jqXHR, textStatus, errorThrown) {
					self.failAPIFunction("Foursquare Business Details Error", textStatus, errorThrown);
				},
				complete: function() {
					var index = self.currentDetailedFoursquareDataBeingFetched
						.indexOf(selectedPlace.google_placeId);
					if (index > -1) {
						self.currentDetailedFoursquareDataBeingFetched.splice(index, 1);
					}
				}
			};

			// Send AJAX query via jQuery library.
			$.ajax(settings);

			if (typeof callback === "function") {
				callback();
			}
		};

		self.callSearchAPIs = function(currentLoc) {
			var clonedMarkedLocations = ko.toJS(self.locationArrayForWorkers());
			if (currentLoc.yelpSearchType() === "None") {
				self.getYelpAPIInfo(currentLoc, clonedMarkedLocations);
			}
			if (currentLoc.locuSearchType() === "None") {
				self.getLocuAPIInfo(currentLoc, clonedMarkedLocations);
			}
			if (currentLoc.foursquareSearchType() === "None") {
				self.getFoursquareAPIInfo(currentLoc, clonedMarkedLocations);
			}
		};

		self.workerHandler = function(workerObject, type, resultFunction) {
			var worker = new Worker('/js/workerFillMarkerData.js');
			worker.onmessage = function(e) {
				returnObject = e.data;
				for (var i = 0; i < returnObject.length; i++) {
					var matchedLocation = self.compareIDs(returnObject[i].google_placeId);
					resultFunction(matchedLocation);
					self.modelUpdater(matchedLocation, type, returnObject[i]);
				}
				avoidMemeoryLeaksDueToEventListeners(worker);
			};
			worker.postMessage(workerObject);


			function avoidMemeoryLeaksDueToEventListeners(toClear) {
				toClear = undefined;
			}
		};

		self.getLocalStorage = function() {
			if (self.storageAvailable === true) {
				if (localStorage.getItem('favoritesArray')) {
					var favArray = JSON.parse(localStorage.getItem('favoritesArray'));
					if (favArray !== null) {
						var markerList = [];
						for (var i = 0; i < favArray.length; i++) {
							var newLoc = new LocationModel(self, "Nearby");
							var passedGeometry = new google.maps.LatLng(favArray[i].google_geometry.location.lat,
									favArray[i].google_geometry.location.lng);
							self.modelRebuilder(newLoc, favArray[i], passedGeometry);
							newLoc.isFavorite(true);
							newLoc.google_openingHoursObject(undefined);
							markerList.push(newLoc);
						}
						self.markedLocations.push.apply(self.markedLocations, markerList);
					}
				}
				if (localStorage.getItem('mapCenter')) {
					var mapCenter = JSON.parse(localStorage.getItem('mapCenter'));
					if ((mapCenter !== null) && (typeof(mapCenter.lat) !== "undefined") && (mapCenter.lat !== null)) {
						self.mapPan(mapCenter.lat, mapCenter.lng);
						if ((mapCenter.zoom !== null) && (typeof(mapCenter.zoom) === 'number')) {
							self.mainMap.setZoom(mapCenter.zoom)
						}
					}

				}
			}
		};

		self.getLocalStorage();
	}

	function createMap() {
		var defaultLatLng = new google.maps.LatLng(appConfigObject.defaultLat, appConfigObject.defaultLng),
			defaultZoom = appConfigObject.defaultZoom,
			mapElement = document.getElementById('mapDiv'),
			defaultStyle = appConfigObject.mapStyle;

		var mapOptions = {
			center: defaultLatLng,
			zoom: defaultZoom,
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			mapTypeControlOptions: {
				mapTypeIds: []
			},
			styles: defaultStyle
		};

		var reticleImage = new google.maps.MarkerImage(
			'img/reticle.png', // marker image
			new google.maps.Size(16, 16), // marker size
			new google.maps.Point(0, 0), // marker origin
			new google.maps.Point(8, 8)); // marker anchor point

		var reticleShape = {
			coords: [8, 8, 8, 8], // 1px
			type: 'rect' // rectangle
		};

		var mainGoogleMap = new google.maps.Map(mapElement, mapOptions);
		var viewModel1 = new ViewModel(mainGoogleMap);
		ko.applyBindings(viewModel1);

		reticleMarker = new google.maps.Marker({
			position: mainGoogleMap.getCenter(),
			map: mainGoogleMap,
			icon: reticleImage,
			shape: reticleShape,
			optimized: false,
			zIndex: 5
		});

		var centerReticle = throttle(function(center) {
			reticleMarker.setPosition(center);
		}, 16, {
			"leading": false
		});

		var callAPIs = throttle(function() {
			if (typeof(viewModel1.getRestaurantsFromGoogleMapsAPICallArray[viewModel1.getRestaurantsFromGoogleMapsAPICallArray.length - 1]) !== 'undefined') {
				viewModel1.getRestaurantsFromGoogleMapsAPICallArray[viewModel1.getRestaurantsFromGoogleMapsAPICallArray.length - 1] = false;
			}
			viewModel1.getRestaurantsFromGoogleMapsAPICallArray.push(true);
			viewModel1.getRestaurantsFromGoogleMapsAPI(viewModel1
				.getRestaurantsFromGoogleMapsAPICallArray.length - 1);
		}, 1150, {
			"trailing": false
		});

		var boundsChange = throttle(function(center) {
			viewModel1.checkIfOnMap(viewModel1.mainMap.getBounds());
			viewModel1.mainMapCenter(mainGoogleMap.getCenter());
			callAPIs();
		}, 50, {
			"leading": false
		});



		google.maps.event.addListener(mainGoogleMap, 'bounds_changed', function() {
			var center = mainGoogleMap.getCenter();
			boundsChange(center);
			centerReticle(center);
		});

		if (viewModel1.storageAvailable === true) {
			mapCenter = JSON.parse(localStorage.getItem('mapCenter'));
			if (!localStorage.getItem('mapCenter') ||
				(typeof(mapCenter.lat) === "undefined") ||
				(mapCenter.lat === null)) {
				viewModel1.getNavWithCallback();
			}
		} else {
			viewModel1.getNavWithCallback();
		}

		toDebug = viewModel1;
	}



	var toDebug;

	function debug() {
		console.log(toDebug);
		debugger;
	}


	return {
		createMap: createMap,
		debug: debug
	};

}());