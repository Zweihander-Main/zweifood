/**
 * App contains utility functions, the view model, model definitions, and
 * success/fail functions for google maps (that create the map and viewmodel).
 * Kept as anonymous function to minimize any global namespace problems.
 * Success/fail functions plus returned for google maps API to call. Preload
 * functions called right after maps API starts loading.
 */
/**
 * Section I  : Utility Functions
 * Section II : Binding Handlers & Extenders
 * Section III: Model
 * Section IV : View Model
 * Section V  : Map Init/Fail Functions
 */
var app = (function() {
	//////////////////////////////////
	// Section I: Utility Functions //
	//////////////////////////////////

	/**
	 * Function that converts a string to Proper Case.
	 * @return {string} string with proper case
	 */
	String.prototype.toProperCase = function() {
		return this.replace(/\w\S*/g, function(txt) {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		});
	};

	/**
	 * Function to preload images - used to preload images before loading screen
	 * disappears. Useful as google maps takes awhile to load image markers.
	 * @param  {array}    sources  array of strings of image locations
	 * @param  {function} callback callback function
	 */
	function preload(sources, callback) {
		var images = [];
		for (i = 0, length = sources.length; i < length; ++i) {
			images[i] = new Image();
			images[i].src = sources[i];
		}
		if (typeof(callback) === 'function') {
			callback();
		}
	}

	/**
	 * Checks if a given object has the given property
	 * From http://stackoverflow.com/a/2631198/1481697
	 * @param  {object}  obj Object to search
	 * @param  {string}  ... Strings after object are nested levels to search for
	 * @return {boolean}     Return true or false if object has given nesting level
	 */
	function checkNested(obj) {
		var args = Array.prototype.slice.call(arguments, 1);
		for (var i = 0; i < args.length; i++) {
			if (!obj || !obj.hasOwnProperty(args[i])) {
				return false;
			}
			obj = obj[args[i]];
		}
		return true;
	}

	/**
	 * Gets current time - direct from underscore.js library for debounce function
	 * @return {number} Current Date().getTime()
	 */
	_now = Date.now || function() {
		return new Date().getTime();
	};

	/**
	 * Based on underscore.js library
	 * Debounces function calls - useful for double clicking scenarios
	 * @param  {function} func      Function to debounce
	 * @param  {number}   wait      Time to wait to debounce calls
	 * @param  {boolean}  immediate If passed, function will trigger on leading
	 *                              edge rather than on trailing edge
	 * @return {function}           debounced function
	 */
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

	/**
	 * Based on underscore.js library
	 * Throttles function calls - useful for event listeners like scrolling/panning
	 * @param  {function} func    Function to throttle
	 * @param  {number}   wait    Time to wait between calls
	 * @param  {object}   options Object that specifies if trailing or leading edge
	 *                            should be used, ex: {trailing: false}
	 * @return {function}         Throttled function
	 */
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

	/**
	 * Function to determine closest fuzzy match to an array of strings using
	 * the FuzzySet.js library. Uses minimum fuzzy match threshold as defined in
	 * config object.
	 * @param  {array} arrayOfResults  array of objects with the same string
	 *                                 attribute to match against (ie name)
	 * @param  {string} nameToMatch    string to fuzzy match to array
	 * @param  {string} nameOfName     Optional, name of object property in array
	 *                                 to match against
	 * @return {boolean/number}        Return false if no match found, return
	 *                                 the index of the matched string if a fuzzy
	 *                                 match has been made
	 */
	function matchBasedOnName(arrayOfResults, nameToMatch, nameOfName) {
		if (typeof(nameOfName) === 'undefined') {
			nameOfName = 'name';
		}
		var setToMatch = FuzzySet([]);
		for (var i = 0; i < arrayOfResults.length; i++) {
			setToMatch.add(arrayOfResults[i][nameOfName]);
		}
		var match = setToMatch.get(nameToMatch);
		// If there was a match, it'll be at match[0][1], confidence at match[0][0]
		if ((match !== null) && (match[0][0] > appConfigObject.minFuzzyMatch)) {
			return setToMatch.values().indexOf(match[0][1]);
		} else {
			return false;
		}
	}

	/**
	 * Compare two arrays, determine if all values are equal
	 * @param  {array} a1    first array to compare
	 * @param  {array} a2    second array to compare
	 * @return {boolean}     return boolean if array's match or not
	 */
	function allValuesSameInTwoArray(a1, a2) {
		for (var i = 0; i < a1.length; i++) {
			if (a1[i] !== a2[i]) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Check if browser storage is available
	 * @param  {string} type Type of browser storage to check (ex localStorage)
	 * @return {boolean}     Return if the type of storage is available
	 */
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

	/**
	 * Check if web workers are available
	 * @return {boolean} Boolean on if web workers are available
	 */
	function workersAvailable() {
		if ((typeof(Worker) !== 'undefined') && (window.location.protocol !== 'file:')) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Function to throttle perfectScrollbar updating - called when list of elements
	 * populating scrollbar is changed
	 * @param {object} jQueryObject   jQuery object that perfectscrollbar is
	 *                                attached to
	 */
	var perfectScrollbar_updatePerfectScrollbar = throttle(function(jqueryObject) {
		jqueryObject.perfectScrollbar('update');
	}, 16, {
		'leading': false
	});

	/**
	 * /**
	 * Used in dropdown bindingHandler to check all input values - neccessary
	 * to check for deeply nested objects
	 * @param  {string/object/array} input     Input to check from dropdown
	 *                                         handler
	 * @param  {string} binding                Name of binding handler to send
	 *                                         input to
	 * @param  {object} element        	       Optional element from
	 *                                         bindinghandler
	 * @param  {object} allBindings            Optional allBindings from
	 *                                         bindinghandler
	 * @param  {object} viewModel              Optional viewModel from
	 *                                         bindinghandler
	 * @param  {object} bindingContext         Optional bindingContext from
	 *                                         bindinghandler
	 * @return {string/boolean}         	   String of parsed input or false
	 */
	function dropdown_interpretValue(input, binding, element, allBindings, viewModel, bindingContext) {
		if ((typeof(input) !== 'undefined') && (input !== null)) {
			// Array will likely be a checkNested object
			if (input.constructor === Array) {
				if (typeof(input[0]) !== 'undefined') {
					if (checkNested.apply(this, input) === true) {
						var returnValue = input[0];
						for (var i = 1; i < input.length; i++) {
							returnValue = returnValue[input[i]];
						}
						input = returnValue;
					} else {
						return false;
					}
				} else {
					return false;
				}
			}
		} else {
			return false;
		}
		if (typeof(binding) !== 'undefined') {
			input = ko.bindingHandlers[binding].update(element, input, allBindings, viewModel, bindingContext, true);
		}
		return input;
	}

	/**
	 * Called from click or after setTimeout for verbose errors from
	 * errorsHandler bindingHandler
	 * @param  {object} element element from bindingHandler
	 * @param  {number} time    animation length
	 */
	function errorsHandler_killPanel(element, time) {
		element.hide(time, function() {
			element.unbind('click', errorsHandler_onClickPanel);
			element.remove();
		});
	}

	/**
	 * Removes error panel on click or after a timeout
	 * @param  {object} event event listener object
	 */
	function errorsHandler_onClickPanel(event) {
		errorsHandler_killPanel($(event.currentTarget), 50);
	}

	/**
	 * Called from perfectScrollbar bindingHandler, calls perfect scrollbar
	 * update and then kills itself to deal with a bug with marker list getting
	 * populated too quickly
	 * @param  {[type]} event [description]
	 */
	function perfectScrollbar_hoverHandler(event, element) {
		perfectScrollbar_updatePerfectScrollbar($(element));
		perfectScrollbar_killHandler(element);
	}

	/**
	 * Kills event listener that deals with bug for perfectScrollbar
	 */
	function perfectScrollbar_killHandler(element) {
		$(element).unbind('mouseenter', perfectScrollbar_hoverHandler);
	}

	/////////////////////////////////////////////
	//Section II: Binding Handlers & Extenders //
	/////////////////////////////////////////////

	/** See knockout documentation for first five function parameters of all
	init and update functions within binding handlers */

	/**
	 * Binding handler for jQuery UI autocomplete - used on filter search box
	 * Input object with jQuery UI parameters used normally for autocomplete
	 * @type {Object}
	 */
	ko.bindingHandlers.ko_autocomplete = {
		/**
		 * Bind jQuery UI autocomplete to element
		 */
		init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			$(element).autocomplete(valueAccessor());
		},
		/**
		 * Sync updated source or input data to autocomplete widget
		 */
		update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			$(element).autocomplete({
				source: function(request, response) {
					var results = $.ui.autocomplete.filter(valueAccessor().source, request.term);
					response(results.slice(0, 6));
				},
				select: function(event, ui) {
					allBindingsAccessor().textInput(ui.item.value);
				}
			});
		}
	};

	/**
	 * Binding handler for Google Maps API address autocomplete - used
	 * in settings menu.
	 * @type {Object}
	 */
	ko.bindingHandlers.addressAutocomplete = {
		/**
		 * Initialize google places autocomplete on element. Gets map from
		 * bindingContext.
		 */
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
				var place = autocomplete.getPlace();
				if (!place.geometry) {
					return;
				}
				// If the place has a geometry, then present it on the map.
				if (place.geometry.viewport) {
					map.fitBounds(place.geometry.viewport);
				} else {
					map.setCenter(place.geometry.location);
					map.setZoom(appConfigObject.defaultZoom);
				}
			});
		},
		/**
		 * Make sure input elements value is bound
		 */
		update: function(element, valueAccessor, allBindingsAccessor) {
			ko.bindingHandlers.value.update(element, valueAccessor());
		}
	};


	/** @type {Object} Bind jQuery Sliderbars plugin to element */
	ko.bindingHandlers.ko_slideOutMenu = {
		init: function(element, valueAccessor) {
			$.slidebars();
		}
	};

	/**
	 * Use scrollintoview plugin to scroll element into view if it's not visible
	 * Throttle a bit to minimize too much jarring animation when visible marker
	 * list is being populated/filtered
	 * @type {Object}
	 */
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

	/**
	 * Stop scrolling an element into view if the mouse is over the input element
	 * (the list of marked locations in this case).
	 * @type {Object}
	 */
	ko.bindingHandlers.hoverToggle = {
		init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			ko.utils.registerEventHandler(element, 'mouseover', function() {
				bindingContext.$data.shouldScroll(false);
				$(element).stop(false, true);
			});
		}
	};

	/**
	 * Binding for jQuery UI slider widget - used in settings menu
	 * @type {Object}
	 */
	ko.bindingHandlers.ko_slider = {
		init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			ko.bindingHandlers.value.init(element, valueAccessor, allBindings, viewModel, bindingContext);
			var passValue = valueAccessor();
			passValue.value = valueAccessor().value();
			$(element).slider(passValue).on('slidechange', function(event, ui) {
				valueAccessor().value(ui.value);
			});
		}
	};

	/**
	 * Listens for rateIt plugin reset to reset binded value
	 * @type {Object}
	 */
	ko.bindingHandlers.ko_rateit = {
		init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			$(element).bind('reset', function() {
				valueAccessor().value(0);
			});
		}
	};

	/**
	 * Binding to set classes on infowindow that has appeared - called when the
	 * info window template is parsed by knockout (so is called everytime a new
	 * infoWindow is opened). Classes are styles using CSS.
	 * @type {Object}
	 */
	ko.bindingHandlers.ko_styleInfoWindow = {
		/**
		 * Element will be the infoWindow template that is used as the contents
		 * of every window. Sets classes on root parent of infoWindow, parent of
		 * infoWindow elements that style it, and those elements. Resets some
		 * element inline styling that can't be overriden by CSS.
		 */
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
					backgroundContainer.css({
						'background-color': '',
						'border-radius': ''
					});
				}
			}
		}
	};

	/**
	 * Binding handler for bootstrap tooltips. Called wherever as it searches for
	 * applicable elements using jQuery - useful for allowing tooltip and
	 * modal on the same element.
	 * @type {Object}
	 */
	ko.bindingHandlers.ko_bootstrapTooltip = {
		init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			$('[data-toggle="tooltip"]').tooltip({
				container: 'body'
			});
		}
	};

	/**
	 * Binding handler for perfectScrollbar plugin - used on marker list.
	 * @type {Object}
	 */
	ko.bindingHandlers.ko_perfectScrollbar = {
		/**
		 * Initialize perfectScrollbar on element. Binds a mouseenter listener
		 * that kills itself after first use to get around a bug where you have
		 * to update the scrollbar when the marker list is first created and
		 * populated by knockout.
		 */
		init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			$(element).perfectScrollbar();
			$(element).bind('mouseenter', function(event) {
				perfectScrollbar_hoverHandler(event, element);
			});
		},
		/**
		 * Calls updatePerfectScrollbar whenever element is updated - ensures
		 * smooth usage with rapidly updating marker list as the plugin
		 * struggles to autoupdate 100% of the time otherwise.
		 */
		update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			var data = ko.utils.unwrapObservable(valueAccessor());
			perfectScrollbar_updatePerfectScrollbar($(element));
		}
	};

	/**
	 * Binding handler to generate star icons based on rating score.
	 * @type {Object}
	 */
	ko.bindingHandlers.generateStars = {
		/**
		 * Creates stars for the innerHtml of the element. Value passed in
		 * should  be a whole number or a single decimal floating point number
		 * (4 or 4.1).
		 * @param  {boolean} internal       Returns the innerHtml of generated
		 *                                  stars as a string instead of setting
		 *                                  them to the element. Useful for use
		 *                                  in other bindingHandlers.
		 */
		update: function(element, valueAccessor, allBindings, viewModel, bindingContext, internal) {
			var stars;
			if (typeof(valueAccessor) === 'function') {
				stars = ko.unwrap(valueAccessor());
			} else {
				stars = valueAccessor;
			}
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
				if (internal !== true) {
					$(element).html(toAppend);
				} else {
					return toAppend;
				}
			}
		}
	};

	/**
	 * Converts a passed in url (as value) to an image and sets it to innerHTML
	 * of element.
	 * @type {Object}
	 */
	ko.bindingHandlers.obToImg = {
		/**
		 * Creates image for the innerHtml of the element. Value passed in
		 * should  be a URL string.
		 * @param  {boolean} internal       Returns the innerHtml of generated
		 *                                  image as a string instead of setting
		 *                                  it to the element. Useful for use
		 *                                  in other bindingHandlers.
		 */
		update: function(element, valueAccessor, allBindings, viewModel, bindingContext, internal) {
			var value;
			if (typeof(valueAccessor) === 'function') {
				value = ko.unwrap(valueAccessor());
			} else {
				value = valueAccessor;
			}
			var toAppend = '';
			if (typeof(value) !== 'undefined') {
				toAppend += '<img src="' + value + '" alt="observable">';
			}
			if (toAppend !== '') {
				if (internal !== true) {
					$(element).html(toAppend);
				} else {
					return toAppend;
				}
			}
		}
	};

	/**
	 * Binding handler to generate dollar icons based on price level.
	 * @type {Object}
	 */
	ko.bindingHandlers.generateUSD = {
		/**
		 * Creates dollar icons for the innerHtml of the element. Value passed
		 * in should  be a whole number.
		 * @param  {boolean} internal       Returns the innerHtml of generated
		 *                                  icons as a string instead of setting
		 *                                  them to the element. Useful for use
		 *                                  in other bindingHandlers.
		 */
		update: function(element, valueAccessor, allBindings, viewModel, bindingContext, internal) {
			var price;
			if (typeof(valueAccessor) === 'function') {
				price = ko.unwrap(valueAccessor());
			} else {
				price = valueAccessor;
			}
			var toAppend = '';
			for (var i = 1; i <= price; i++) {
				toAppend += '<i class="fa fa-usd"></i>';
			}
			if (toAppend !== '') {
				if (internal !== true) {
					$(element).html(toAppend);
				} else {
					return toAppend;
				}
			}
		}
	};

	/**
	 * Binding handler for bootstrap modal - useful for allowing tooltip and
	 * modal on the same element. Value passed in should be the element the
	 * modal is going to call in jQuery format ie #myModal
	 * @type {Object}
	 */
	ko.bindingHandlers.ko_modal = {
		init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			var value = ko.unwrap(valueAccessor());
			ko.utils.registerEventHandler(element, 'click', function() {
				$(value).modal();
			});
		}
	};

	/**
	 * Binding handler for toggling visibility classes on marker list and
	 * options list when buttons are clicked
	 * @type {Object}
	 */
	ko.bindingHandlers.menuToggle = {
		init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			var value = ko.unwrap(valueAccessor());
			ko.utils.registerEventHandler(element, 'click', function() {
				$(element).toggleClass('mobile-button-pressed');
				$('#' + value).toggleClass('panel-visible');
				$(element).trigger('mouseleave');
			});
		}
	};

	/**
	 * Binding handler to call the scrollToItem function from viewModel. Pass
	 * the entire markerList array into it to call it when there's a change in
	 * the markerList. Ensures that even when the list is changed, the selected
	 * item will be scrolled back to as long as the user hasn't hovered over the
	 * marker list.
	 * @type {Object}
	 */
	ko.bindingHandlers.scrollToItem = {
		update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			var data = ko.utils.unwrapObservable(valueAccessor());
			bindingContext.$data.scrollToItem();
		}
	};

	/**
	 * Binding handler to render infoWindowTemplate template when initial
	 * bit of html fed to infoWindow contents is parsed via knockout's
	 * applyBindings. Replaces initial HTML.
	 * @type {Object}
	 */
	ko.bindingHandlers.infoWindowTemplate = {
		init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			if (!$(element).prev().hasClass('info-window-loaded')) {
				ko.renderTemplate('info-window-template-container', bindingContext.$data, {}, element, 'replaceNode');
			}
		}
	};

	/**
	 * Binding handler for error container - parses errors fed into it and
	 * uses element as container for their dom nodes
	 * @type {Object}
	 */
	ko.bindingHandlers.errorsHandler = {
		/**
		 * Value has two object inputs: data which is the errors object from the
		 * viewModel and verbose which is the verbose boolean from the viewModel
		 * Verbose errors die after 3 seconds, normal errors have to be clicked
		 * to be removed.
		 */
		update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			var error = valueAccessor().data();
			if (error !== false) {
				valueAccessor().data(false);
				var verbose = valueAccessor().verbose();
				var isVerbose = error.verbose;
				if ((verbose === true) || (isVerbose === false)) {
					var customMessage = error.customMessage;
					var textStatus = error.textStatus;
					var toAdd = '<div class="panel ';
					toAdd += (isVerbose === true ? 'panel-warning' : 'panel-danger');
					toAdd += '"><div class="panel-heading"><h3 class="panel-title">';
					toAdd += customMessage;
					toAdd += '</h3></div><div class="panel-body">';
					toAdd += textStatus;
					toAdd += '</div></div>';
					$('#error-container').append(toAdd);
					var added = $('#error-container').children().last();
					added.show(200);
					added.bind('click', errorsHandler_onClickPanel);
					if (isVerbose === true) {
						setTimeout(function() {
							errorsHandler_killPanel(added, 200);
						}, 3000);
					}
				}
			}
		}
	};

	/**
	 * Takes a google opening hours object and sets element's innerHtml to
	 * a parsed version of it
	 * @type {Object}
	 */
	ko.bindingHandlers.listOutOpeningHours = {
		update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			var value = ko.unwrap(valueAccessor());
			if (typeof(value) !== 'undefined' && checkNested(value, 'weekday_text', '0') !== false) {
				var toAdd = '';
				for (var i = 0; i < value.weekday_text.length; i++) {
					toAdd += '<div>' + value.weekday_text[i] + '</div>';
				}
				element.innerHTML = toAdd;
			}
		}
	};

	/**
	 * Binding handler to handle creating bootstrap dropdowns in infoWindows
	 * (which contain the same piece of information from different sources)
	 * @type {Object}
	 */
	ko.bindingHandlers.dropdown = {
		/**
		 * Binds bootstrap's dropdown to jQuery UI's positioning function for
		 * the purpose of using jQuery UI's collision detection to flip the
		 * dropdown when neccessary.
		 */
		init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			$(element).on('shown.bs.dropdown', function() {
				var menu = $(this).find('.dropdown-menu');
				if ((menu !== null) && (menu.length === 1)) {
					var btn = menu.parent();
					var withinContainer = $('#info-window-template');
					menu.position({
						of: btn,
						my: 'left top',
						at: 'left bottom',
						collision: 'flip',
						within: withinContainer
					});
				}
			});
		},
		/**
		 *  Value object takes the following form:
		 *  data {
		 *      'name of property' {
		 *      		'value': value of property - if object with properties,
		 *      				 should be put in as checkNested array ie
		 *      				 [object, 'string_of_first_property', 'second']
		 *      		'value_binding': name of binding to apply to value
		 *      		'value_binding_show_text': show text next to value
		 *      							       binding output
		 *              'value_n': additional values to add to same property
		 *              'append': string to append next to last value if value_n
		 *                        is declared
		 *      }
		 *  }
		 */
		update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			var value = valueAccessor().data;
			var starter = '<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><span class="caret caret-dropdown"></span></button><ul class="dropdown-menu dropdown-menu-right">';
			var toAdd = starter;

			for (var service in value) {
				var binding, theValue;
				//Interpret the value and send them to binding handler if needed
				if (typeof(value[service].value_binding) !== 'undefined') {
					theValue = dropdown_interpretValue(value[service].value, value[service].value_binding, element, allBindings, viewModel, bindingContext);
				} else {
					theValue = dropdown_interpretValue(value[service].value);
				}
				if (theValue !== false) {
					toAdd += '<li><strong>' + service + ':</strong> <span>' + theValue + '</span>';
					//Add in value_binding_show_text if it's declared
					if (typeof(value[service].value_binding_show_text) !== 'undefined') {
						toAdd += ' (' + dropdown_interpretValue(value[service].value) + ')';
					}
					//Add in value_n if defined
					if (typeof(value[service].value_2) !== 'undefined') {
						//Check if more than value_2, iterate through if so
						if (typeof(value[service].value_3) !== 'undefined') {
							var i = 2;
							while (typeof(value[service]['value_' + i]) !== 'undefined') {
								var extraValue = dropdown_interpretValue(value[service]['value_' + i]);
								if (extraValue !== false) {
									if (i === 2) {
										toAdd += '(' + extraValue + ')';
									} else {
										toAdd += ', ' + extraValue;
									}
									//Append to last
									if (typeof(value[service]['value_' + (i + 1).toString()]) === 'undefined') {
										if (typeof(value[service].append) !== 'undefined') {
											toAdd += value[service].append;
										}
									}
								}
								i++;
							}
							//just value_2
						} else {
							var extraValue2 = dropdown_interpretValue(value[service].value_2);
							if (extraValue2 !== false) {
								toAdd += ', ' + extraValue2;
								if (typeof(value[service].append) !== 'undefined') {
									toAdd += value[service].append;
								}
							}
						}
					}
					toAdd += '</li>';
				}
			}
			//If toAdd has had anything added
			if (toAdd !== starter) {
				toAdd += '</ul>';
				element.innerHTML = toAdd;
			}
			if ($(element).hasClass('open')) {
				$(element).trigger('shown.bs.dropdown');
			}
		}

	};

	/**
	 * Extender to observable that allows for fixed precision floating
	 * point numbers - useful for settings sliders
	 * @param  {number/string} target    	Input to observable, will be
	 *                                      converted to number if in string
	 *                                      format
	 * @param  {number} precision 			Precision to set floating point
	 *                               	    number to
	 * @return {number}           	        Converted number
	 */
	ko.extenders.numeric = function(target, precision) {
		var result = ko.computed({
			read: function() {
				var num = (Number(target()).toFixed(precision)) / 1;
				return num;
			},
			write: target
		});
		return result;
	};

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
	function LocationModel(currentViewModel, searchType) {
		var self = this;
		// Initialize google properties from the getgo
		self.googleSearchType = ko.observable(searchType);
		self.googleIsLoading = ko.observable(false);
		// Reflects if marker is within mapbounds
		self.isInViewOnMap = ko.observable(true);
		// Reflects if model has been filtered out (or is only radar searched)
		self.isListed = ko.observable(false);
		// Reflects if marker has been selected in marker list or on map
		self.isSelected = ko.observable(false);
		// Reflects if marker has ever been selected for infoWindow construction
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
		self.marker = ko.observable(new google.maps.Marker({
			map: currentViewModel.mainMap,
			opacity: (self.isListed() === false ? currentViewModel.lowMarkerOpacity() : appConfigObject.highMarkerOpacity),
			icon: currentViewModel.markerImageCreator(),
			shape: appConfigObject.defaultMarkerShape
		}));

		/**
		 * Subscribe to isFavorite to update marker image when it's changed
		 * and to push itself to the favoriteArray for localStorage saving
		 */
		self.disposableArray.push(self.isFavorite.subscribe(function(newValue) {
			self.marker().setIcon(currentViewModel.markerImageCreator(newValue, self.google_priceLevel()));
			self.marker(self.marker());
			currentViewModel.changeFavoriteArray(newValue, self);
		}));

		/**
		 * Subscribe to isSelected to update the viewModel's
		 * currentlySelectedLocation consistently and automatically
		 */
		self.disposableArray.push(self.isSelected.subscribe(function(newValue) {
			currentViewModel.changeCurrentlySelectedItem(newValue, self);
		}));

		/**
		 * Subscribe to isListed to set marker opacity dependent upon listing
		 * status.
		 */
		self.disposableArray.push(self.isListed.subscribe(function(newValue) {
			if (newValue) {
				self.marker().setOpacity(appConfigObject.highMarkerOpacity);
				self.marker(self.marker());
			} else {
				self.marker().setOpacity(currentViewModel.lowMarkerOpacity());
				self.marker(self.marker());
			}
		}));

		/**
		 * Subscribe to google_priceLevel to update marker image if it changes
		 */
		self.disposableArray.push(self.google_priceLevel.subscribe(function(newValue) {
			self.marker().setIcon(currentViewModel.markerImageCreator(self.isFavorite(), newValue));
			self.marker(self.marker());
		}));

		/**
		 * Subscribe to google_name to update marker title if it changes
		 */
		self.disposableArray.push(self.google_name.subscribe(function(newValue) {
			self.marker().setTitle(newValue);
			self.marker(self.marker());
		}));

		/**
		 * Subscribe to google_geometry to update marker position if it changes
		 */
		self.disposableArray.push(self.google_geometry.subscribe(function(newValue) {
			self.marker().setPosition(newValue.location);
			self.marker(self.marker());
		}));

		/**
		 * Create computed for determining short hand version of
		 * google_openingHoursObject().open_now
		 */
		self.isItOpenRightNow = ko.pureComputed(function() {
			if (typeof(self.google_openingHoursObject()) !== 'undefined') {
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
		self.listenerStorage.push(self.infoWindow.addListener('closeclick', currentViewModel.markerCloseClick));
		self.listenerStorage.push(self.infoWindow.addListener('domready', currentViewModel.markerDomReady));

		/**
		 * Infowindow click listener, sets the markerList to scroll to this model,
		 * starts the data fetching process with Google Places API, closes
		 * previous info and opens this one, sets markerAnimation going
		 */
		self.listenerStorage.push(self.marker().addListener('click', function() {
			currentViewModel.markerClick(self);
		}));

		/**
		 * Triggers click event and pans to marker when location is selected from
		 * marker list
		 */
		self.listWasClicked = function() {
			new google.maps.event.trigger(self.marker(), 'click');
			self.marker().map.panTo(self.google_geometry().location);
		};

		/**
		 * Usability function to call the models search type based on what type
		 * is needed
		 * @param  {string} type Search type to be called ie yelp, google, ect.
		 * @return {string}      Contents of search type observable
		 */
		self.searchType = function(type) {
			return self[type.toLowerCase() + 'SearchType'];
		};

		/**
		 * Sets the model to dispose of itself when it's being removed - kills
		 * subscriptions, kills listeners, and takes itself off of the map
		 */
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

	////////////////////////////
	// Section IV: View Model //
	////////////////////////////

	/**
	 * View Model for initialized google map
	 * @param {object} map Google map viewModel is to use
	 */
	function ViewModel(map) {
		var self = this;
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
			size: new google.maps.Size(appConfigObject.markerImageSize[0], appConfigObject.markerImageSize[1]),
			origin: new google.maps.Point(appConfigObject.markerImageOrigin[0], appConfigObject.markerImageOrigin[1]),
			anchor: new google.maps.Point(appConfigObject.markerImageAnchor[0], appConfigObject.markerImageAnchor[1])
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
		//Bring the checkNested function into the viewModel
		self.checkNested = checkNested;

		// Variables for sort types and filter types
		self.sortType = ko.observable('count');
		self.searchQuery = ko.observable();
		self.priceButtonFilter = ko.observableArray([true, true, true, true, true]);
		self.minRatingButtonFilter = ko.observable(0);
		self.openButtonFilter = ko.observable(false);
		self.favoriteButtonFilter = ko.observable(false);

		/**
		 * Initial HTML that gets parsed through knockout applyBindings and sets
		 * up template for infoWindow
		 * @type {String}
		 */
		self.infoWindowHTMLTemplate = '<div class = "info-window-template" data-bind = "infoWindowTemplate: true"></div>';

		/**
		 * Subscribe to lowMarkerOpacity user set variable to set all markers to
		 * new opacity
		 */
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

		// When map center changes, save it to localstorage
		self.mainMapCenter.subscribe(function(newValue) {
			self.setLocalStorage('mapCenter', JSON.stringify({
				'lat': newValue.lat(),
				'lng': newValue.lng(),
				'zoom': self.mainMap.getZoom()
			}));
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
			var favoritesArray = [];
			ko.utils.arrayForEach(newValue, function(item) {
				favoritesArray.push(self.modelDeconstructor(item));
			});
			var favoritesString = JSON.stringify(favoritesArray);
			if (favoritesArray.length !== 0) {
				self.setLocalStorage('favoritesArray', favoritesString);
			} else {
				self.setLocalStorage('favoritesArray', '[]');
			}
		});

		// Prevent frequent calls to localStorage
		self.favoriteArray.extend({
			rateLimit: 2000
		});

		// Subscribe to currentlySelectedLocation and call scrollToItem on change
		self.currentlySelectedLocation.subscribe(debounce(function(newValue) {
			if (typeof(newValue) !== 'undefined') {
				self.scrollToItem();
			}
		}, 5));

		// Computed array of all IDs and nearby/places search only ids
		self.idArray = ko.pureComputed(function() {
			var returnArray = {
				'all': [],
				'nearby': []
			};
			ko.utils.arrayMap(self.markedLocations(), function(item) {
				if ((item.googleSearchType() === 'Nearby') || (item.googleSearchType() === 'Places')) {
					returnArray.nearby.push(item.google_placeId);
				}
				returnArray.all.push(item.google_placeId);
			});
			return returnArray;
		});

		// Computed check if priceButtonFilter has changed
		self.priceButtonFilterHasChanged = ko.pureComputed(function() {
			return !allValuesSameInTwoArray(self.priceButtonFilter(), [true, true, true, true, true]);
		});

		/**
		 * Computed object, returns markedLocations that are Nearby/Places
		 * searched and not filtered. Returns both an array of filtered models
		 * and an array of the names of those models.
		 */
		self.listableEntries = ko.computed(function() {
			var returnArray = {
				'entries': [],
				'allNames': []
			};
			returnArray.entries = ko.utils.arrayFilter(self.markedLocations(), function(item) {
				if (((item.googleSearchType() === 'Nearby') ||
						(item.googleSearchType() === 'Places')) &&
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

		/**
		 * Computed array, takes listableEntries computed entries array and
		 * sorts it according to sortType observable
		 */
		self.sortedEntries = ko.pureComputed(function() {
			var returnArray = self.listableEntries().entries;
			if (self.sortType() === 'count') {
				returnArray.sort(
					function(left, right) {
						return (left.modelNumber < right.modelNumber ? -1 : 1);
					});
			} else if (self.sortType() === 'alpha') {
				returnArray.sort(
					function(left, right) {
						return left.google_name() === right.google_name() ? 0 :
							(left.google_name() < right.google_name() ? -1 : 1);
					});
			} else if (self.sortType() === 'rating') {
				// Sort undefined to the end of the list
				returnArray.sort(
					function(left, right) {
						if (typeof(left.google_rating()) === 'undefined') {
							if (typeof(right.google_rating()) === 'undefined') {
								return 0;
							} else {
								return 1;
							}
						} else if (typeof(right.google_rating()) === 'undefined') {
							return -1;
						} else {
							return (left.google_rating() < right.google_rating() ? 1 : -1);
						}
					});
			} else if (self.sortType() === 'distance') {
				returnArray.sort(
					function(left, right) {
						var x1 = left.google_geometry().location.lat();
						var x2 = right.google_geometry().location.lat();
						var x3 = self.mainMapCenter().lat();
						var y1 = left.google_geometry().location.lng();
						var y2 = right.google_geometry().location.lng();
						var y3 = self.mainMapCenter().lng();
						var dist1 = appConfigObject.distanceBetweenTwoPointsInMeters(x1, y1, x3, y3);
						var dist2 = appConfigObject.distanceBetweenTwoPointsInMeters(x2, y2, x3, y3);
						return (dist1 === dist2 ? 0 : (dist1 < dist2 ? -1 : 1));
					});
			}
			return returnArray;
		});

		// Limit resorting, slows down too much otherwise
		self.listableEntries.extend({
			rateLimit: 50
		});

		/**
		 * Function to setup informational API calls tracker object
		 * Object is structured as:
		 * {service: {
		 * 			type of call (basic/detailed/ect.): [models]
		 * 			}
		 * 	}
		 */
		self.initializeCurrentDetailedAPIInfoBeingFetched = function() {
			/**
			 * Find if model is currently being fetched using service and method
			 * @param  {string} service name of api service
			 * @param  {string} type    type of call (basic/detailed/ect.)
			 * @param  {object} ID      model to lookup
			 * @return {number}         index of model or -1 if not found
			 */
			self.currentDetailedAPIInfoBeingFetched.findID = function(service, type, ID) {
				return this[service][type].indexOf(ID);
			};
			/**
			 * Push model to array when it's being called using service and
			 * method
			 * @param  {string} service name of api service
			 * @param  {string} type    type of call
			 * @param  {object} ID      model to push in
			 */
			self.currentDetailedAPIInfoBeingFetched.pushID = function(service, type, ID) {
				this[service][type].push(ID);
				this[service][type][this[service][type].length - 1][service + 'IsLoading'](true);
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
			self.currentDetailedAPIInfoBeingFetched.removeID = function(service, type, ID) {
				var index = this.findID(service, type, ID);
				if (index > -1) {
					this[service][type][index][service + 'IsLoading'](false);
					this[service][type].splice(index, 1);
				}
				for (var i = 0; i < this.intercept.length; i++) {
					if (this.intercept[i].ID === ID) {
						self.getDetailedAPIData(this.intercept[i].service, this.intercept[i].ID);
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
			self.currentDetailedAPIInfoBeingFetched.interceptIDPush = function(service, type, ID) {
				for (var i = 0; i < this.intercept.length; i++) {
					if (this.intercept.ID === ID) {
						return;
					}
				}
				this.intercept.push({
					'ID': ID,
					'type': type,
					'service': service
				});
			};
			/**
			 * Remove call from intercept array (for a failed previous call)
			 * @param  {object} ID      model to remove
			 */
			self.currentDetailedAPIInfoBeingFetched.interceptIDRemove = function(ID) {
				for (var i = 0; i < this.intercept.length; i++) {
					if (this.intercept.ID === ID) {
						this.intercept.splice(i, 1);
					}
				}
			};
			// Setup arrays for basic and detailed calls for all services
			for (var i = 0; i < self.APIConfiguredSearchTypes.length; i++) {
				self.currentDetailedAPIInfoBeingFetched[self.APIConfiguredSearchTypes[i]] = {
					'basic': [],
					'detailed': []
				};
			}
			self.currentDetailedAPIInfoBeingFetched.google = {
				'detailed': []
			};
		};

		/**
		 * Called from model when it's listed to change the
		 * currentlySelectedLocation
		 * @param  {boolean} newValue isListed subscribed value
		 * @param  {object} model     model which changed
		 */
		self.changeCurrentlySelectedItem = function(newValue, model) {
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
		self.changeFavoriteArray = function(newValue, model) {
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
		self.markerCloseClick = function() {
			self.currentlySelectedLocation().isSelected(false);
		};

		/**
		 * Function called when an infoWindow handles a domReady event - sets
		 * up infoWindow with content if it doesn't have @interface
		 */
		self.markerDomReady = function() {
			if (!self.currentlySelectedLocation().hasBeenOpened) {
				ko.applyBindings(self, self.currentlySelectedLocation().infoWindow.getContent());
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
		self.markerClick = function(model) {
			self.shouldScroll(true);
			self.getDetailedGooglePlacesAPIInfo(model, self.callSearchAPIs);
			if (typeof(self.currentlySelectedLocation()) !== 'undefined') {
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
		self.markerAnimation = function(loc) {
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
			markerObject.url = appConfigObject.markerImageURLEmpty;
			return markerObject;
		};

		/**
		 * Get browser location and send it to panning function
		 */
		self.getNavWithCallback = function() {
			if (navigator.geolocation) {
				return navigator.geolocation.getCurrentPosition(self.mapPanFromNavigation);
			} else {
				return false;
			}
		};

		/**
		 * Pan to given position from browser navigation
		 * @param  {object} position browser position coordinates
		 */
		self.mapPanFromNavigation = function(position) {
			self.mapPan(position.coords.latitude, position.coords.longitude);
		};

		/**
		 * Pans to map to the given coordinates
		 * @param  {number} lat latitude
		 * @param  {number} lng longitude
		 */
		self.mapPan = function(lat, lng) {
			var userLatLng = new google.maps.LatLng(lat, lng);
			self.mainMap.panTo(userLatLng);
		};

		/**
		 * Takes a model and adds observables as defined in config object
		 * @param  {object} model model to add observables to
		 */
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

		/**
		 * Takes a model and returns just the data in javascript object format
		 * Knockout's built in function for this was having trouble
		 * @param  {object} model model to convert into javascript object
		 *                        without function
		 * @return {object}       javascript object representation of model
		 *                        (without functions/ect.)
		 */
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

		/**
		 * Takes the model, data from the api server, and updates the
		 * observables of that model with the data from the server
		 * @param  {object} model  model to update
		 * @param  {string} type   which api type/source was used
		 * @param  {object} result result from server, mapped using config object
		 */
		self.modelUpdater = function(model, type, result) {
			currentType = self.APIMappingsForModel[type];
			for (var i = 0; i < currentType.length; i++) {
				if (typeof(result[currentType[i].server]) !== 'undefined') {
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
		self.modelRebuilder = function(model, blueprint, location) {
			for (var prop in self.APIMappingsForModel) {
				var currentType = self.APIMappingsForModel[prop];
				for (var i = 0; i < currentType.length; i++) {
					if ((currentType[i].oType !== 0) && (currentType[i].model !== 'google_geometry')) {
						model[currentType[i].model](blueprint[currentType[i].model]);
					} else if (currentType[i].model === 'google_geometry') {
						var geometryBlueprint = blueprint[currentType[i].model];
						geometryBlueprint.location = location;
						model[currentType[i].model](geometryBlueprint);
					} else {
						model[currentType[i].model] = blueprint[currentType[i].model];
					}
				}
			}
		};

		/**
		 * Takes a model and adds in API searchType and isLoading observables
		 * for all api types
		 * @param  {object} model model to add observables to
		 */
		self.modelSearchTypeConstructor = function(model) {
			for (var i = 0; i < self.APIConfiguredSearchTypes.length; i++) {
				model[self.APIConfiguredSearchTypes[i].toLowerCase() + 'SearchType'] = ko.observable('None');
				model[self.APIConfiguredSearchTypes[i].toLowerCase() + 'IsLoading'] = ko.observable(false);
			}
		};

		/**
		 * Function to remove references and dispose of multiple locations when
		 * max location limit has been reached - called from markedLocations
		 * subscriber
		 * @param  {Array}  newValue       newValue of markedLocations array
		 */
		self.removeMultipleLocations = throttle(function(newValue) {
			var toRemove = [];
			var j = 0;
			//Push favorite to front
			self.markedLocations.sort(function(left, right) {
				return (left.isFavorite() === true ? 1 : (left.modelNumber < right.modelNumber ? -1 : 1));
			});
			for (var i = 0; i < appConfigObject.markerLimitRemoveBulkAmount; i++) {
				newValue[i].dispose();
			}
			self.markedLocations.splice(0, appConfigObject.markerLimitRemoveBulkAmount);
		}, 1000, {
			'trailing': false
		});

		/**
		 * Called when a model is created, iterates locationModelNumber when
		 * called. Allows for sorting models by when they were recieved
		 * @return {number} number to assign model
		 */
		self.getLocationModelNumber = function() {
			self.locationModelNumber++;
			return (self.locationModelNumber - 1);
		};

		/**
		 * Function called to set localStorage with desired properties -
		 * throttled to avoid too many calls at once
		 * @param  {string} name                name of property to set
		 * @param  {string} item)               value of property to set
		 */
		self.setLocalStorage = throttle(function(name, item) {
			if (self.storageAvailable === true) {
				localStorage.setItem(name, item);
			}
		}, 1000, {
			'trailing': false
		});

		/**
		 * Function to create a limited copy of some listableEntries properties
		 * to pass to web workers
		 * @return {array} array of limited-info models
		 */
		self.locationArrayForWorkers = function() {
			return ko.utils.arrayMap(self.listableEntries(), function(item) {
				return {
					'lat': item.google_geometry().location.lat(),
					'lng': item.google_geometry().location.lng(),
					'name': item.google_name(),
					'google_placeId': item.google_placeId
				};
			});
		};

		/**
		 * Function to check if a model is filtered by the current searchQuery
		 * observable the user has entered
		 * @param  {object}  item model to check
		 * @return {Boolean}      if the model is filtered by the query
		 */
		self.isSearchFiltered = function(item) {
			if (typeof(self.searchQuery()) !== 'undefined') {
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

		/**
		 * Function to check if a model is filtered by the current button
		 * filters the user has selected
		 * @param  {object}  item model to check
		 * @return {Boolean}      if the model is filtered by the filters
		 *                        selected
		 */
		self.isButtonFiltered = function(item) {
			if (self.priceButtonFilterHasChanged() === true) {
				if (typeof(item.google_priceLevel()) !== 'undefined') {
					for (var i = 0; i < 5; i++) {
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
				if (typeof(item.google_rating()) !== 'undefined') {
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
		self.scrollToItem = function() {
			if ((typeof(self.currentlySelectedLocation()) !== 'undefined') && (self.shouldScroll() === true)) {
				self.scrolledItem(self.currentlySelectedLocation());
			}
		};

		/**
		 * Parse the initial HTML which will be inserted into an infoWindow
		 * and which will then call the infoWindow template when applyBindings
		 * is called on it
		 * @return {object} HTML nodes of the initial insertion content
		 */
		self.makeInfoWindowContent = function() {
			var html = self.infoWindowHTMLTemplate;
			html = $.parseHTML(html)[0];
			return html;
		};

		/**
		 * Called everytime the bounds change to check all the markedLocations
		 * markers to see if they're on the map. Sets the isInViewOnMap of those
		 * marker.
		 * @param  {object} currentBounds map.getBounds() from google API
		 */
		self.checkIfOnMap = function(currentBounds) {
			ko.utils.arrayForEach(self.markedLocations(), function(item) {
				if (currentBounds.contains(item.google_geometry().location) === false) {
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
		self.compareIDs = function(iDToCompare) {
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
		self.successAPIFunction = function(results, selectedPlace, setResultSearchType, service, clonedMarkedLocations, initialPoint, workerHandler) {
			var type;
			if (typeof(clonedMarkedLocations) !== 'undefined') {
				type = 'basic';
			} else {
				type = 'detailed';
			}

			if (type === 'basic') {
				var match = matchBasedOnName(results, selectedPlace.google_name());
				// Match will be a number if there's been a match
				if (typeof(match) === 'number') {
					setResultSearchType(selectedPlace);
					self.modelUpdater(selectedPlace, service, results[match]);
					results.splice(match, 1);
				} else {
					setResultSearchType(selectedPlace, 'Not Found');
					self.failAPIFunction((service.toProperCase() + ' Search Problem'), 'No Match Found', undefined, true);
				}
				// Call worker irregardless of match
				var workerArray = {
					'resultsArray': results,
					'locationsArray': clonedMarkedLocations,
					'initialPoint': initialPoint,
					'maxDistance': appConfigObject.latLngAccuracy,
					'service': service,
					'minFuzzyMatch': appConfigObject.minFuzzyMatch,
					'workerHandler': workerHandler
				};

				self.workerHandler(workerArray, service, setResultSearchType);
			} else {
				setResultSearchType(selectedPlace);
				self.modelUpdater(selectedPlace, service, results);
			}
		};

		/**
		 * Creates an error that is shown to the user (or not if verbose and
		 * verbose is turned off)
		 * @param  {string} customMessage Custom message to accompany error
		 * @param  {string} textStatus    Text of the error
		 * @param  {object} errorThrown   Error object thrown - optional
		 * @param  {boolean} verbose      If the error is verbose or not
		 */
		self.failAPIFunction = function(customMessage, textStatus, errorThrown, verbose) {
			if (typeof(verbose) === 'undefined') {
				verbose = false;
			}
			var errorObject = {};
			errorObject.customMessage = customMessage;
			errorObject.textStatus = textStatus;
			errorObject.verbose = verbose;
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
		self.getDetailedAPIData = function(service, selectedPlace) {
			if (selectedPlace.searchType(service)() === 'None') {
				if (self.currentDetailedAPIInfoBeingFetched.findID(service, 'basic', selectedPlace) === -1) {
					self.callBasicAPIData(service, selectedPlace);
				}
				self.currentDetailedAPIInfoBeingFetched.interceptIDPush(service, 'detailed', selectedPlace);
			} else if (selectedPlace.searchType(service)() === 'Basic') {
				if (self.currentDetailedAPIInfoBeingFetched.findID(service, 'detailed', selectedPlace) === -1) {
					self.currentDetailedAPIInfoBeingFetched.pushID(service, 'detailed', selectedPlace);
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
		self.callSearchAPIs = function(currentLoc) {
			var clonedMarkedLocations = ko.toJS(self.locationArrayForWorkers());
			for (var i = 0; i < self.APIConfiguredSearchTypes.length; i++) {
				var currentServiceType = self.APIConfiguredSearchTypes[i];
				if (currentLoc.searchType(currentServiceType)() === 'None') {
					if (self.currentDetailedAPIInfoBeingFetched.findID(currentServiceType, 'basic', currentLoc) === -1) {
						self.callBasicAPIData(currentServiceType, currentLoc, clonedMarkedLocations);
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
		self.callBasicAPIData = function(service, selectedPlace, clonedMarkedLocations) {
			if (typeof(clonedMarkedLocations) === 'undefined') {
				clonedMarkedLocations = ko.toJS(self.locationArrayForWorkers());
			}
			self.currentDetailedAPIInfoBeingFetched.pushID(service, 'basic', selectedPlace);
			self.callAPIInfo('basic', service, selectedPlace, clonedMarkedLocations);
		};

		/**
		 * Adds any found attributions for generalized results to an attributions
		 * array that displays in the credits modal
		 * @param  {array} attributionsArray array of attributions found
		 */
		self.checkAndAddFullAttributions = function(attributionsArray) {
			var attributionsToPush = [];
			for (var z = 0; z < attributionsArray.length; z++) {
				if (self.attributionsArray.indexOf(attributionsArray[z]) === -1) {
					attributionsToPush.push(attributionsArray[z]);
				}
			}
			self.attributionsArray.push.apply(self.attributionsArray, attributionsToPush);
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
		self.processNearbyResults = function(results, status, pagination, callArrayIndex) {
			if (status !== google.maps.places.PlacesServiceStatus.OK) {
				self.failAPIFunction('Google Maps Nearby Search Error', status);
				return;
			} else {
				// Add all markers and push at once into markedLocations for performance
				var markerList = [];
				for (var i = 0; i < results.length; i++) {
					// If marker as nearby or places searchType doesn't exist
					if (self.idArray().nearby.indexOf(results[i].place_id) === -1) {
						// If marker doesn't exist, create new
						if (self.idArray().all.indexOf(results[i].place_id) === -1) {
							var newLoc = new LocationModel(self, 'Nearby');
							self.successAPIFunction(results[i], newLoc, function() {}, 'google');
							markerList.push(newLoc);
						} else {
							// Marker exists as radar, simply update
							var matchedLocation = self.compareIDs(results[i].place_id);
							if (matchedLocation) {
								self.successAPIFunction(results[i],
									matchedLocation, self.setAPIResultSearchType('Nearby', 'google').setSearchType, 'google');
							}
						}
						if (results[i].html_attributions.length !== 0) {
							self.checkAndAddFullAttributions(results[i].html_attributions);
						}
					}
				}
				self.markedLocations.push.apply(self.markedLocations, markerList);
				if (pagination && pagination.hasNextPage) {
					setTimeout(function() {
						if (self.getRestaurantsFromGoogleMapsAPICallArray[callArrayIndex] === true) {
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
		self.processRadarResults = function(results, status) {
			if (status !== google.maps.places.PlacesServiceStatus.OK) {
				self.failAPIFunction('Google Maps Radar Search Error', status);
				return;
			} else {
				// Add all markers and push at once into markedLocations for performance
				var markerList = [];
				for (var i = 0; i < results.length; i++) {
					// If marker doesn't exist yet, create
					if (self.idArray().all.indexOf(results[i].place_id) === -1) {
						var newLoc = new LocationModel(self, 'Radar');
						self.successAPIFunction(results[i], newLoc, function() {}, 'google');
						markerList.push(newLoc);
					} //not going to update for performance and because no info to update
					if (results[i].html_attributions.length !== 0) {
						self.checkAndAddFullAttributions(results[i].html_attributions);
					}
				}
				self.markedLocations.push.apply(self.markedLocations, markerList);
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
		self.getRestaurantsFromGoogleMapsAPI = function(callArrayIndex) {
			var currentMapBounds = self.mainMap.getBounds();

			// Only search in current bounds and for restaurants
			var request = {
				bounds: currentMapBounds,
				types: ['restaurant']
			};

			// Call radar and nearby search
			self.service.radarSearch(request, self.processRadarResults);
			self.service.nearbySearch(request, function(results, status, pagination) {
				self.processNearbyResults(results, status, pagination, callArrayIndex);
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
		self.getDetailedGooglePlacesAPIInfo = function(selectedPlace, callback) {
			if (self.currentDetailedAPIInfoBeingFetched.findID('google', 'detailed', selectedPlace) === -1) {
				self.currentDetailedAPIInfoBeingFetched.pushID('google', 'detailed', selectedPlace);

				self.service.getDetails({
					'placeId': selectedPlace.google_placeId
				}, function(result, status) {
					self.currentDetailedAPIInfoBeingFetched.removeID('google', 'detailed', selectedPlace);
					if (status !== google.maps.places.PlacesServiceStatus.OK) {
						self.failAPIFunction('Google Places Search Error', status);
						return;
					}
					self.successAPIFunction(result, selectedPlace, self.setAPIResultSearchType('Places', 'google').setSearchType, 'google');
					callback(selectedPlace);
				});
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
		self.setAPIResultSearchType = function(type, service) {
			var inputs = {
				type: type,
				service: service
			};
			/**
			 * Set the search type of a model
			 * @param {object} result   model to be set
			 * @param {string} override override if not found for matching
			 */
			function setSearchType(result, override) {
				var toSet = inputs.type.toProperCase();
				if (override) {
					toSet = override;
				}
				result.searchType(inputs.service)(toSet);
			}
			return {
				setSearchType: setSearchType
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
		self.callAPIInfo = function(APIType, service, selectedPlace, clonedMarkedLocations, callback) {
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
			var configObject = appConfigObject[service + '_searchAPIProperties'];
			var settings = configObject.settings;
			var lat, lng, initialPoint;
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
					'lat': lat,
					'lng': lng
				};
				for (var name2 in configObject.basicExtraParameters) {
					if (typeof(configObject.basicExtraParameters[name2]) === 'function') {
						settings.data[name2] = configObject.basicExtraParameters[name2](lat, lng);
					} else {
						settings.data[name2] = configObject.basicExtraParameters[name2];
					}
				}
			}
			// For oauth
			for (var name1 in configObject.allExtraParameters) {
				settings.data[name1] = configObject.allExtraParameters[name1](settings.url, settings.data);
			}

			/**
			 * Success function passed with the jQuery call, parses through
			 * results and calls success or failure depending on if parse
			 * if successful
			 * @param  {object} results results from call
			 */
			settings.success = function(results) {
				var theResult = results;
				// Parse through the results until the array of result objects is found
				if (typeof(configObject[APIType + '_returnType']) === 'object') {
					for (var i = 0; i < configObject[APIType + '_returnType'].length; i++) {
						theResult = theResult[configObject[APIType + '_returnType'][i]];
					}
				} else if (typeof(configObject[APIType + '_returnType']) !== 'undefined') {
					theResult = theResult[configObject[APIType + '_returnType']];
				} else {
					theResult = results;
				}
				//Success/fail in finding array of result objects
				if (typeof(theResult) !== 'undefined') {
					self.successAPIFunction(theResult, selectedPlace, self.setAPIResultSearchType(APIType, service).setSearchType, service, clonedMarkedLocations, initialPoint, configObject.workerHandler);
				} else {
					self.currentDetailedAPIInfoBeingFetched.interceptIDRemove(selectedPlace);
					console.debug(results);
					self.failAPIFunction(service.toProperCase() + ' ' + APIType.toProperCase() + ' Search Error', 'Could not interpret results');
				}
			};

			/**
			 * Fail function passed with the jQuery call, calls for an error to
			 * be shown to the user
			 * @param  {object} jqXHR       jqXHR object from jQuery
			 * @param  {string} textStatus  textStatus string from jQuery
			 * @param  {object} errorThrown error object from jQuery
			 */
			settings.error = function(jqXHR, textStatus, errorThrown) {
				self.currentDetailedAPIInfoBeingFetched.interceptIDRemove(selectedPlace);
				self.failAPIFunction(service.toProperCase() + ' ' + APIType.toProperCase() + ' Search Error', textStatus, errorThrown);
			};

			/**
			 * Always executed function passed with jQuery call to manage
			 * removing model from api calls management object
			 * @param  {object} jqXHR      jqXHR object from jQuery
			 * @param  {string} textStatus textStatus string from jQuery
			 */
			settings.complete = function(jqXHR, textStatus) {
				self.currentDetailedAPIInfoBeingFetched.removeID(service, APIType, selectedPlace);
			};

			$.ajax(settings);

			if (typeof(callback) === 'function') {
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
		self.getGooglePhotoURL = function(photoObject, parameter) {
			if (typeof(photoObject.getUrl) === 'function') {
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
		self.avoidMemeoryLeaksDueToEventListeners = function(toClear) {
			toClear = undefined;
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
		self.workerHandler = function(workerObject, service, resultFunction) {
			if (self.workersAvailable === true) {
				var worker = new Worker('/js/workerFillMarkerData.js');
				worker.onmessage = function(e) {
					returnObject = e.data;
					for (var i = 0; i < returnObject.length; i++) {
						var matchedLocation = self.compareIDs(returnObject[i].google_placeId);
						resultFunction(matchedLocation);
						self.modelUpdater(matchedLocation, service, returnObject[i]);
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
		self.getLocalStorage = function() {
			if (self.storageAvailable === true) {
				if (localStorage.getItem('favoritesArray')) {
					var favArray = JSON.parse(localStorage.getItem('favoritesArray'));
					if (favArray !== null) {
						// Push all the favorites at once
						var markerList = [];
						for (var i = 0; i < favArray.length; i++) {
							// Nearby will force it to refresh when clicked
							var newLoc = new LocationModel(self, 'Nearby');
							var lat = Number(favArray[i].google_geometry.location.lat);
							var lng = Number(favArray[i].google_geometry.location.lng);
							var passedGeometry = new google.maps.LatLng(lat, lng);
							self.modelRebuilder(newLoc, favArray[i], passedGeometry);
							newLoc.google_geometry(newLoc.google_geometry());
							newLoc.isFavorite(true);
							// Reset open/closed computed
							newLoc.google_openingHoursObject(undefined);
							markerList.push(newLoc);
						}
						self.markedLocations.push.apply(self.markedLocations, markerList);
					}
				}
				if (localStorage.getItem('mapCenter')) {
					var mapCenter = JSON.parse(localStorage.getItem('mapCenter'));
					if ((mapCenter !== null) && (typeof(mapCenter.lat) !== 'undefined') && (mapCenter.lat !== null)) {
						self.mapPan(mapCenter.lat, mapCenter.lng);
						if ((mapCenter.zoom !== null) && (typeof(mapCenter.zoom) === 'number')) {
							self.mainMap.setZoom(mapCenter.zoom);
						}
					}

				}
			}
		};

		/**
		 * Let the user know if storage or workers aren't available.
		 */
		self.singleErrorMessages = function() {
			if (self.storageAvailable !== true) {
				self.failAPIFunction('Local Storage Problem', 'Local Storage support is not available. Favorites will not save after page reload.');
			}
			if (self.workersAvailable !== true) {
				self.failAPIFunction('Web Workers Problem', 'Web Workers support is not available. App will function normally but average data retrieval wait times will increase. \n Web workers do not work when loading this application from older browsers or directly from the local file system.');
			}
		};

		self.initializeCurrentDetailedAPIInfoBeingFetched();
		self.singleErrorMessages();
		self.getLocalStorage();
	}

	///////////////////////////////////////
	//Section V: Map Init/Fail Functions //
	///////////////////////////////////////

	// Preloading 3 things, declare variables to wait for them
	var imagesPreloaded = false;
	var fontsPreloaded = false;
	var googlePreloaded = false;

	/**
	 * Called from HTML right after maps API script starts to load. Loads
	 * web fonts and sets functions to declare fontsPreloaded as true when
	 * either a success, failure, or 10 seconds are up. Also preloads marker
	 * images for map as that takes the longest for Google Maps to fetch.
	 * Finally calls function to wait for images, fonts, and API to load.
	 */
	function preloadFontsAndImages() {
		var WebFontConfig = {
			google: {
				families: [
					'Lato:400,400italic,700:latin',
					'Scheherazade:400,700:latin'
				]
			},
			timeout: 10000,
			active: function() {
				fontsPreloaded = true;
			},
			// Fails to load, proceed anyway
			inactive: function() {
				fontPreloaded = true;
			}
		};
		WebFont.load(WebFontConfig);

		preload(['img/marker-1.png', 'img/marker-2.png', 'img/marker-3.png', 'img/marker-4.png', 'img/marker-empty.png', 'img/marker-heart.png'], function() {
			imagesPreloaded = true;
		});
		waitUntilEverythingLoaded();
	}

	/**
	 * Called if the Google Maps API has failed to load, lets the user know
	 * to try again later
	 */
	function googleFailedToLoad() {
		alert('Google Maps failed to load. Please try again later.');
	}

	/**
	 * Called if the Google Maps API has successfully loaded.
	 */
	function googleLoaded() {
		googlePreloaded = true;
	}

	/**
	 * Called when preloading starts. Waits for images, fonts, and maps API to
	 * load and then calls createMap() to init map and viewModel. Finally,
	 * removes loading screen.
	 */
	function waitUntilEverythingLoaded() {
		$.doWhen({
				when: function() {
					return (imagesPreloaded === true) &&
						(fontsPreloaded === true) &&
						(googlePreloaded === true);
				}
			})
			.done(function() {
				createMap();
				$('#loading').fadeOut(500);
			});
	}

	/**
	 * Function to create the google map as well as create and setup the
	 * viewModel
	 */
	function createMap() {
		// Double check api is really loaded
		if (typeof google === 'undefined') {
			googleFailedToLoad();
		} else {
			// Setup default options from config object
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
				}, //remove some controls
				styles: defaultStyle
			};

			// Define reticle to be pegged at center of map
			var reticleImage = new google.maps.MarkerImage(
				'img/reticle.png', // marker image
				new google.maps.Size(16, 16), // marker size
				new google.maps.Point(0, 0), // marker origin
				new google.maps.Point(8, 8)); // marker anchor point

			var reticleShape = {
				coords: [8, 8, 8, 8], // 1px
				type: 'rect' // rectangle
			};

			// Create map and viewModel using map
			var mainGoogleMap = new google.maps.Map(mapElement, mapOptions);
			var viewModel1 = new ViewModel(mainGoogleMap);
			ko.applyBindings(viewModel1, document.body);

			// Setup and add center reticle
			reticleMarker = new google.maps.Marker({
				position: mainGoogleMap.getCenter(),
				map: mainGoogleMap,
				icon: reticleImage,
				shape: reticleShape,
				optimized: false,
				zIndex: 5
			});

			/**
			 * Keep center reticle centered, throttle as panning would call
			 * too frequently and performance is the same
			 */
			var centerReticle = throttle(function(center) {
				reticleMarker.setPosition(center);
			}, 16, {
				'leading': false
			});

			/**
			 * Function called when map pans that calls radar and nearby search
			 * functions from viewModel. Manages the call array dedicated to
			 * these that stops pagination from happening if a map pan occurs -
			 * this attempts to minimize total amount of calls made to google
			 * servers - also tries to prioritize information more pertinent
			 * to current map center rather than map center from original call.
			 * Throttled to avoid over-query errors.
			 */
			var callAPIs = throttle(function() {
				if (typeof(viewModel1.getRestaurantsFromGoogleMapsAPICallArray[viewModel1.getRestaurantsFromGoogleMapsAPICallArray.length - 1]) !== 'undefined') {
					viewModel1.getRestaurantsFromGoogleMapsAPICallArray[viewModel1.getRestaurantsFromGoogleMapsAPICallArray.length - 1] = false;
				}
				viewModel1.getRestaurantsFromGoogleMapsAPICallArray.push(true);
				viewModel1.getRestaurantsFromGoogleMapsAPI(viewModel1
					.getRestaurantsFromGoogleMapsAPICallArray.length - 1);
			}, 1200, {
				'trailing': false
			});

			/**
			 * Function called when map pans that updates center of map and then
			 * calls callAPIs function
			 * @param  {object} map.getCenter() coordinates object
			 */
			var boundsChange = throttle(function(center) {
				viewModel1.checkIfOnMap(viewModel1.mainMap.getBounds());
				viewModel1.mainMapCenter(center);
				callAPIs();
			}, 50, {
				'leading': false
			});


			/**
			 * Event listener for map panning/bounds changing. Calls the bounds
			 * changed function and also updates center reticle coordinates.
			 */
			google.maps.event.addListener(mainGoogleMap, 'bounds_changed', function() {
				var center = mainGoogleMap.getCenter();
				boundsChange(center);
				centerReticle(center);
			});

			/**
			 * Check localStorage, if mapCenter is preset, sets map to that
			 * center. If localStorage isn't available, asks the browser for its
			 * location.
			 */
			if (viewModel1.storageAvailable === true) {
				mapCenter = JSON.parse(localStorage.getItem('mapCenter'));
				if (!localStorage.getItem('mapCenter') ||
					(typeof(mapCenter.lat) === 'undefined') ||
					(mapCenter.lat === null)) {
					viewModel1.getNavWithCallback();
				}
			} else {
				viewModel1.getNavWithCallback();
			}
		}
	}

	/**
	 * Expose only success and fail functions to the rest of the page
	 */
	return {
		googleLoaded: googleLoaded,
		googleFailedToLoad: googleFailedToLoad,
		preloadFontsAndImages: preloadFontsAndImages
	};

}());