/* global google, ko, $, ResizeSensor, WebFont */
'use strict';

// interface String {
// 	toProperCase(): string;
// }

interface App {
	googleLoaded: () => void;
	googleFailedToLoad: () => void;
	preloadFontsAndImages: () => void;
}

import './imports.ts';
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
import imageReticle from '../img/reticle.png';
import imageMarker1 from '../img/marker-1.png';
import imageMarker2 from '../img/marker-2.png';
import imageMarker3 from '../img/marker-3.png';
import imageMarker4 from '../img/marker-4.png';
import imageMarkerEmpty from '../img/marker-empty.png';
import imageMarkerHeart from '../img/marker-heart.png';
import imageMarkerDefault from '../img/marker-default.png';

// import 'bootstrap';
// import 'bootstrap/js/src/modal';
// import 'bootstrap/js/src/tooltip';
import '../vendor/bootstrap/js/bootstrap.js'; // took out jquery version complaint
// import PerfectScrollbar from 'perfect-scrollbar';
import '../vendor/perfect-scrollbar/js/min/perfect-scrollbar.jquery.min.js';
import '../vendor/slidebars.min.js';
import 'jquery.rateit';
import '../vendor/jQuery.doWhen.js';
import '../vendor/jquery.scrollintoview.custom.js';
import '../vendor/ResizeSensor.js';

import appConfigObject from './config.ts';
import { preload, throttle, checkNested } from './util.ts';
import ViewModel from './ViewModel.ts';
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
const app: App = ((): App => {
	//////////////////////////////////
	// Section I: Utility Functions //
	//////////////////////////////////

	/**
	 * Function to throttle perfectScrollbar updating - called when list of elements
	 * populating scrollbar is changed
	 * @param {object} jQueryObject   jQuery object that perfectscrollbar is
	 *                                attached to
	 */
	const perfectScrollbarUpdatePerfectScrollbar = throttle(
		(jqueryObject): void => {
			jqueryObject.perfectScrollbar('update');
		},
		16,
		{
			leading: false,
		}
	);

	/**
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
	const dropdownInterpretValue = (
		input,
		binding,
		element,
		allBindings,
		viewModel,
		bindingContext
	): string | false => {
		if (typeof input !== 'undefined' && input !== null) {
			// Array will likely be a checkNested object
			if (input.constructor === Array) {
				if (typeof input[0] !== 'undefined') {
					if (checkNested(...input) === true) {
						let returnValue = input[0];
						for (let i = 1, len = input.length; i < len; i++) {
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
		if (typeof binding !== 'undefined') {
			input = ko.bindingHandlers[binding].update(
				element,
				input,
				allBindings,
				viewModel,
				bindingContext,
				true
			);
		}
		return input;
	};

	/**
	 * Called from click or after setTimeout for verbose errors from
	 * errorsHandler bindingHandler
	 * @param  {object} element element from bindingHandler
	 * @param  {number} time    animation length
	 */
	const errorsHandlerKillPanel = (element, time): void => {
		element.hide(time, function() {
			element.unbind('click', errorsHandlerOnClickPanel);
			element.remove();
		});
	};

	/**
	 * Removes error panel on click or after a timeout
	 * @param  {object} event event listener object
	 */
	const errorsHandlerOnClickPanel = (event): void => {
		errorsHandlerKillPanel($(event.currentTarget), 50);
	};

	/**
	 * Called from perfectScrollbar bindingHandler, calls perfect scrollbar
	 * update and then kills itself to deal with a bug with marker list getting
	 * populated too quickly
	 * @param  {[type]} event [description]
	 */
	const perfectScrollbarHoverHandler = (event, element): void => {
		perfectScrollbarUpdatePerfectScrollbar($(element));
		perfectScrollbarKillHandler(element);
	};

	/**
	 * Kills event listener that deals with bug for perfectScrollbar
	 */
	const perfectScrollbarKillHandler = (element): void => {
		$(element).unbind('mouseenter', perfectScrollbarHoverHandler);
	};

	/**
	 * Function to toggle a menu while mobile UI is enabled and to change the
	 * associated observable with that menu state.
	 * @param  {object} element           element from bindinghandler
	 * @param  {string} menu              string id of the menu to toggle
	 * @param  {object} toggledObservable observable associated with the menu
	 *                                    state
	 */
	const menuToggleToggleMenu = (element, menu, toggledObservable): void => {
		$(element).toggleClass('mobile-button-pressed');
		const theMenu = $('#' + menu);
		$(element).trigger('mouseleave');
		if (theMenu.hasClass('panel-visible')) {
			theMenu.removeClass('panel-visible');
			if (toggledObservable() !== false) {
				toggledObservable(false);
			}
		} else {
			theMenu.addClass('panel-visible');
			if (toggledObservable() !== true) {
				toggledObservable(true);
			}
		}
	};

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
	ko.bindingHandlers.koAutocomplete = {
		/**
		 * Bind jQuery UI autocomplete to element
		 */
		init: function(element, valueAccessor): void {
			$(element).autocomplete(valueAccessor());
		},
		/**
		 * Sync updated source or input data to autocomplete widget
		 */
		update: function(element, valueAccessor, allBindingsAccessor): void {
			$(element).autocomplete({
				source: function(request, response) {
					const results = $.ui.autocomplete.filter(
						valueAccessor().source,
						request.term
					);
					response(results.slice(0, 6));
				},
				select: function(event, ui) {
					allBindingsAccessor().textInput(ui.item.value);
				},
			});
		},
	};

	/**
	 * Binding handler to ensure that clearing the input field (through the
	 * clear filters button) will actually clear the field so that the active
	 * class will remove itself. Input should be the value associated with the
	 * input.
	 * @type {Object}
	 */
	ko.bindingHandlers.textInputForAutocomplete = {
		update: function(element, valueAccessor): void {
			const value = ko.unwrap(valueAccessor());
			if (value === '') {
				$(element).trigger('change');
			}
		},
	};

	/**
	 * Add class to filter search box to keep it fully open when it has a value
	 * inputted while it's in mobile/midsize UI. Value should be input value
	 * associated with the input.
	 * @type {Object}
	 */
	ko.bindingHandlers.focusBox = {
		init: function(element): void {
			$(element).on('input change autocompletechange', function() {
				const value = $(this).val();
				const theElement = $(this);
				if (theElement.hasClass('search-box-focused')) {
					if (typeof value === 'undefined' || value === '') {
						theElement.removeClass('search-box-focused');
					}
				} else {
					if (typeof value !== 'undefined' && value !== '') {
						theElement.addClass('search-box-focused');
					}
				}
			});
		},
	};

	/**
	 * Binding handler for Google Maps API address autocomplete - used
	 * in settings menu.
	 * @type {Object}
	 */
	ko.bindingHandlers.addressAutocomplete = {
		/**
		 * Initialize google places autocomplete on element. Gets map from
		 * bindingContext. Calls close click on infoWindow and closes options
		 * and settings menu. Value should be observable of options menu state.
		 */
		init: function(
			element,
			valueAccessor,
			allBindingsAccessor,
			viewModel,
			bindingContext
		): void {
			const allBindings = allBindingsAccessor(),
				map = bindingContext.$data.mainMap,
				value = valueAccessor(),
				markerCloseClick = bindingContext.$data.markerCloseClick;

			const options = {
				types: ['geocode'],
			};
			ko.utils.extend(options, allBindings.autocompleteOptions);

			const autocomplete = new google.maps.places.Autocomplete(
				element,
				options
			);
			autocomplete.bindTo('bounds', map);

			autocomplete.addListener('place_changed', function() {
				markerCloseClick();
				value(false);
				$.slidebars.close();
				const place = autocomplete.getPlace();
				if (!place.geometry) {
					return;
				}
				// If the place has a geometry, then present it on the map.
				if (place.geometry.viewport) {
					map.fitBounds(place.geometry.viewport);
				} else {
					map.setCenter(place.geometry.location);
					const defaultZoom =
						window.innerWidth < 992
							? appConfigObject.defaultMobileZoom
							: appConfigObject.defaultZoom;
					map.setZoom(defaultZoom);
				}
			});
		},
		/**
		 * Make sure input elements value is bound
		 */
		update: function(element, valueAccessor): void {
			ko.bindingHandlers.value.update(element, valueAccessor());
		},
	};

	/** @type {Object} Bind jQuery Sliderbars plugin to element */
	ko.bindingHandlers.koSlideOutMenu = {
		init: function(): void {
			$.slidebars();
		},
	};

	/**
	 * Use scrollintoview plugin to scroll element into view if it's not visible
	 * Throttle a bit to minimize too much jarring animation when visible marker
	 * list is being populated/filtered
	 * @type {Object}
	 */
	ko.bindingHandlers.scrollTo = {
		update: function(element, valueAccessor): void {
			const _value = valueAccessor();
			const _valueUnwrapped = ko.unwrap(_value);
			if (_valueUnwrapped) {
				const scrollItemIntoView = throttle(function() {
					$(element).scrollintoview({
						duration: 100,
					});
				}, 50);
				scrollItemIntoView();
			}
		},
	};

	/**
	 * Stop scrolling an element into view if the mouse is over the input element
	 * (the list of marked locations in this case).
	 * @type {Object}
	 */
	ko.bindingHandlers.hoverToggle = {
		init: function(
			element,
			valueAccessor,
			allBindings,
			viewModel,
			bindingContext
		): void {
			ko.utils.registerEventHandler(element, 'mouseover', function() {
				bindingContext.$data.shouldScroll(false);
				$(element).stop(false, true);
			});
		},
	};

	/**
	 * Binding for jQuery UI slider widget - used in settings menu
	 * @type {Object}
	 */
	ko.bindingHandlers.koSlider = {
		init: function(
			element,
			valueAccessor,
			allBindings,
			viewModel,
			bindingContext
		): void {
			ko.bindingHandlers.value.init(
				element,
				valueAccessor,
				allBindings,
				viewModel,
				bindingContext
			);
			const passValue = valueAccessor();
			passValue.value = valueAccessor().value();
			$(element)
				.slider(passValue)
				.on('slidechange', function(event, ui) {
					valueAccessor().value(ui.value);
				});
		},
	};

	/**
	 * Listens for rateIt plugin reset to reset binded value
	 * @type {Object}
	 */
	ko.bindingHandlers.koRateit = {
		/**
		 * Value should be object with observable property corresponding to
		 * value binded to rateit plugin. Resets that value when the rateit
		 * reset event is called (after the reset button is clicked or when
		 * all filters are cleared).
		 */
		init: function(element, valueAccessor): void {
			const observable = ko.unwrap(valueAccessor()).observable;
			$(element).bind('reset', function() {
				observable(0);
			});
		},
		/**
		 * Value should be object with value property corresponding to the value
		 * binded to the rateit plugin. Calls to reset the state of the stars
		 * if the value is -1 (as it would be when all filters are cleared).
		 */
		update: function(element, valueAccessor): void {
			const value = ko.unwrap(valueAccessor()).value;
			if (value === -1) {
				$(element).rateit('reset');
			}
		},
	};

	/**
	 * Binding to set classes on infowindow that has appeared - called when the
	 * info window template is parsed by knockout (so is called everytime a new
	 * infoWindow is opened). Classes are styles using CSS.
	 * @type {Object}
	 */
	ko.bindingHandlers.koStyleInfoWindow = {
		/**
		 * Element will be the infoWindow template that is used as the contents
		 * of every window. Sets classes on root parent of infoWindow, parent of
		 * infoWindow elements that style it, and those elements. Resets some
		 * element inline styling that can't be overriden by CSS.
		 */
		init: function(element): void {
			const subContainer = $(element)
				.parent()
				.addClass('custom-info-window-subcontainer');
			subContainer.css({
				overflow: '',
			});
			const backgroundContainer = subContainer
				.parent()
				.addClass('custom-info-window-background')
				.attr('id', 'custom-info-window-background');
			backgroundContainer.css({
				'padding-right': '',
				'padding-left': '',
			});
			if (backgroundContainer) {
				backgroundContainer.parent().addClass('custom-info-window');
				backgroundContainer.css({
					'background-color': '',
					'border-radius': '',
				});
				backgroundContainer.css({
					'background-color': '',
					'border-radius': '',
				});
			}
		},
	};

	/**
	 * Centers the infoWindow into view if out of view and attempts to keep it
	 * centered when new content is created via AJAX. Uses update as the
	 * ResizeSensor binder doesn't stay on the infoWindow when it changes.
	 * @type {Object}
	 */
	ko.bindingHandlers.setResizeListener = {
		/**
		 * Value should be currentlySelectedElement so that this is called only
		 * when a new infoWindow is opened. Element should be the most root
		 * level info-window element that is user-defined.
		 */
		update: function(
			element,
			valueAccessor,
			allBindings,
			viewModel,
			bindingContext
		): void {
			const model = ko.unwrap(valueAccessor());
			// Remove previous infoWindow calls if present
			if (element.resizeSensor) {
				delete element.resizeSensor;
				delete element.resizedAttached;
			}
			//CurrentlySelectedElement could be undefined
			if (typeof model !== 'undefined') {
				const theElement = $(element);
				// Select the outer infowindow ideally
				let infoWindow = $('#custom-info-window-background');
				let xModifier = 0;
				if (typeof infoWindow.get(0) === 'undefined') {
					infoWindow = theElement;
					// Difference between inner and outer
					xModifier = 50;
				}
				// Clear previous listener if it isn't already
				clearTimeout(bindingContext.$data.currentInfoWindowCheck);
				/**
				 * Call .open when infoWindow is resized to have
				 * Google check if it's still in view
				 */
				new ResizeSensor(element, function() {
					bindingContext.$data.regularInfoWindowPan(true);
					// Could previously use this but stopped working with API 3.23
					// model.infoWindow.open(window.map, model.marker());
					$(model.infoWindow.content).height(
						$(model.infoWindow.content).height()
					);
					// Alternate method, not neccessary probably
					// model.infoWindow.setContent($(model.infoWindow.content).get(0));
				});
				/**
				 * Wait 75ms before starting listener on infoWindow that checks
				 * if it needs to be centered. This allows the native google
				 * method of adjusting the map to stop the check from being
				 * called for a bit.
				 */
				setTimeout(function() {
					bindingContext.$data.reCheckInfoWindowIsCentered(
						infoWindow,
						model,
						xModifier
					);
				}, 75);
			}
		},
	};

	/**
	 * Binding handler for bootstrap tooltips. Called wherever as it searches for
	 * applicable elements using jQuery - useful for allowing tooltip and
	 * modal on the same element.
	 * @type {Object}
	 */
	ko.bindingHandlers.koBootstrapTooltip = {
		init: function(): void {
			$('[data-toggle="tooltip"]').tooltip({
				container: 'body',
			});
		},
	};

	/**
	 * Binding handler for perfectScrollbar plugin - used on marker list.
	 * @type {Object}
	 */
	ko.bindingHandlers.koPerfectScrollbar = {
		/**
		 * Initialize perfectScrollbar on element. Binds a mouseenter listener
		 * that kills itself after first use to get around a bug where you have
		 * to update the scrollbar when the marker list is first created and
		 * populated by knockout.
		 */
		init: function(element): void {
			$(element).perfectScrollbar();
			$(element).bind('mouseenter', function(event) {
				perfectScrollbarHoverHandler(event, element);
			});
		},
		/**
		 * Calls updatePerfectScrollbar whenever element is updated - ensures
		 * smooth usage with rapidly updating marker list as the plugin
		 * struggles to autoupdate 100% of the time otherwise.
		 */
		update: function(element, valueAccessor): void {
			ko.utils.unwrapObservable(valueAccessor());
			perfectScrollbarUpdatePerfectScrollbar($(element));
		},
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
		update: function(
			element,
			valueAccessor,
			allBindings,
			viewModel,
			bindingContext,
			internal
		): void {
			let stars;
			if (typeof valueAccessor === 'function') {
				stars = ko.unwrap(valueAccessor());
			} else {
				stars = valueAccessor;
			}
			const wholeStars = Math.floor(stars);
			const partialStar = stars - wholeStars;
			let toAppend = '';
			for (let i = 1; i <= stars; i++) {
				toAppend +=
					'<span class="glyphicon glyphicon-star" ' +
					'aria-hidden="true"></span>';
			}
			if (partialStar > 0) {
				toAppend +=
					'<span class="glyphicon glyphicon-star partial-width-' +
					Math.round(partialStar * 10) +
					'" aria-hidden="true"></span>';
			}
			if (toAppend !== '') {
				if (internal !== true) {
					$(element).html(toAppend);
				} else {
					return toAppend;
				}
			}
		},
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
		update: function(
			element,
			valueAccessor,
			allBindings,
			viewModel,
			bindingContext,
			internal
		): void {
			let value;
			if (typeof valueAccessor === 'function') {
				value = ko.unwrap(valueAccessor());
			} else {
				value = valueAccessor;
			}
			let toAppend = '';
			if (typeof value !== 'undefined') {
				toAppend += '<img src="' + value + '" alt="observable">';
			}
			if (toAppend !== '') {
				if (internal !== true) {
					$(element).html(toAppend);
				} else {
					return toAppend;
				}
			}
		},
	};

	/**
	 * For use primarily by dropdown. Converts a passed in URL to a link with
	 * the URL as the value for both the href and the text.
	 * @type {Object}
	 */
	ko.bindingHandlers.obToLink = {
		/**
		 * Value should be a string URL. Creates link element for innerHTML of
		 * element.
		 * @param  {boolean} internal       Returns the innerHtml of generated
		 *                                  image as a string instead of setting
		 *                                  it to the element. Useful for use
		 *                                  in other bindingHandlers.
		 */
		update: function(
			element,
			valueAccessor,
			allBindings,
			viewModel,
			bindingContext,
			internal
		): void {
			let value;
			if (typeof valueAccessor === 'function') {
				value = ko.unwrap(valueAccessor());
			} else {
				value = valueAccessor;
			}
			let toAppend = '';
			if (typeof value !== 'undefined') {
				toAppend +=
					'<a target="_blank" href="' + value + '">' + value + '</a>';
			}
			if (toAppend !== '') {
				if (internal !== true) {
					$(element).html(toAppend);
				} else {
					return toAppend;
				}
			}
		},
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
		update: function(
			element,
			valueAccessor,
			allBindings,
			viewModel,
			bindingContext,
			internal
		): void {
			let price;
			if (typeof valueAccessor === 'function') {
				price = ko.unwrap(valueAccessor());
			} else {
				price = valueAccessor;
			}
			let toAppend = '';
			for (let i = 1; i <= price; i++) {
				toAppend += '<i class="fa fa-usd"></i>';
			}
			if (toAppend !== '') {
				if (internal !== true) {
					$(element).html(toAppend);
				} else {
					return toAppend;
				}
			}
		},
	};

	/**
	 * Binding handler for bootstrap modal - useful for allowing tooltip and
	 * modal on the same element. Value passed in should be the element the
	 * modal is going to call in jQuery format ie #myModal
	 * @type {Object}
	 */
	ko.bindingHandlers.koModal = {
		init: function(element, valueAccessor): void {
			const value = ko.unwrap(valueAccessor());
			ko.utils.registerEventHandler(element, 'click', function() {
				$(value).modal();
			});
		},
	};

	/**
	 * Binding handler for toggling visibility classes on marker list and
	 * options list when buttons are clicked. Value should be a string
	 * corresponding to the id of the menu being toggled.
	 * @type {Object}
	 */
	ko.bindingHandlers.menuToggle = {
		/**
		 * Creates click listener.
		 */
		init: function(element, valueAccessor): void {
			const value = ko.unwrap(valueAccessor());
			const menu = value.menu;
			const toggledObservable = value.toggledObservable;
			ko.utils.registerEventHandler(element, 'click', function() {
				menuToggleToggleMenu(element, menu, toggledObservable);
			});
		},
		/**
		 * Kills the menu if a location has been selected and the menu is open.
		 */
		update: function(element, valueAccessor): void {
			const value = ko.unwrap(valueAccessor());
			const menu = value.menu;
			const toggled = value.toggled;
			if ($('#' + menu).hasClass('panel-visible') && toggled === false) {
				$(element).click();
			}
		},
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
		update: function(
			element,
			valueAccessor,
			allBindings,
			viewModel,
			bindingContext
		): void {
			ko.utils.unwrapObservable(valueAccessor());
			bindingContext.$data.scrollToItem();
		},
	};

	/**
	 * Binding handler to render infoWindowTemplate template when initial
	 * bit of html fed to infoWindow contents is parsed via knockout's
	 * applyBindings. Replaces initial HTML.
	 * @type {Object}
	 */
	ko.bindingHandlers.infoWindowTemplate = {
		init: function(
			element,
			valueAccessor,
			allBindings,
			viewModel,
			bindingContext
		): void {
			if (
				!$(element)
					.prev()
					.hasClass('info-window-loaded')
			) {
				ko.renderTemplate(
					'info-window-template-container',
					bindingContext.$data,
					{},
					element,
					'replaceNode'
				);
			}
		},
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
		update: function(
			element,
			valueAccessor,
			allBindings,
			viewModel,
			bindingContext
		): void {
			const error = valueAccessor().data();
			if (error !== false) {
				valueAccessor().data(false);
				const verbose = valueAccessor().verbose();
				const isVerbose = error.verbose;
				if (verbose === true || isVerbose === false) {
					const killOnMarkers = error.killOnMarkers;
					const customMessage = error.customMessage;
					const textStatus = error.textStatus;
					let toAdd = '<div class="panel ';
					toAdd +=
						isVerbose === true ? 'panel-warning' : 'panel-danger';
					toAdd +=
						'"><div class="panel-heading"><h3 class="panel-title">';
					toAdd += customMessage;
					toAdd += '</h3></div><div class="panel-body">';
					toAdd += textStatus;
					toAdd += '</div></div>';
					$('#error-container').append(toAdd);
					const added = $('#error-container')
						.children()
						.last();
					added.show(200);
					added.bind('click', errorsHandlerOnClickPanel);
					if (isVerbose === true) {
						setTimeout(function() {
							errorsHandlerKillPanel(added, 200);
						}, 3000);
					}
					/**
					 * If killOnMarkers is set, check if listableEntries has any
					 * entries. When they do, kill the affected panels.
					 */
					if (killOnMarkers === true) {
						$.doWhen({
							when: function() {
								return (
									bindingContext.$data.listableEntries()
										.entries.length > 0
								);
							},
						}).done(function() {
							errorsHandlerKillPanel(added, 200);
						});
					}
				}
			}
		},
	};

	/**
	 * Takes a google opening hours object and sets element's innerHtml to
	 * a parsed version of it
	 * @type {Object}
	 */
	ko.bindingHandlers.listOutOpeningHours = {
		update: function(element, valueAccessor): void {
			const value = ko.unwrap(valueAccessor());
			if (
				typeof value !== 'undefined' &&
				checkNested(value, 'weekday_text', '0') !== false
			) {
				let toAdd = '';
				for (let i = 0, len = value.weekday_text.length; i < len; i++) {
					toAdd += '<div>' + value.weekday_text[i] + '</div>';
				}
				element.innerHTML = toAdd;
			}
		},
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
		init: function(element): void {
			$(element).on('shown.bs.dropdown', function() {
				const menu = $(this).find('.dropdown-menu');
				if (menu !== null && menu.length === 1) {
					const btn = menu.parent();
					const withinContainer = $('#info-window-template');
					menu.position({
						of: btn,
						my: 'left top',
						at: 'left bottom',
						collision: 'flip',
						within: withinContainer,
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
		update: function(
			element,
			valueAccessor,
			allBindings,
			viewModel,
			bindingContext
		): void {
			const value = valueAccessor().data;
			const starter =
				'<button type="button" class="btn btn-default ' +
				'dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" ' +
				'aria-expanded="false"><span class="caret caret-dropdown">' +
				'</span></button><ul class="dropdown-menu dropdown-menu-right">';
			let toAdd = starter;

			for (const service in value) {
				let theValue;
				//Interpret the value and send them to binding handler if needed
				if (typeof value[service].value_binding !== 'undefined') {
					theValue = dropdownInterpretValue(
						value[service].value,
						value[service].value_binding,
						element,
						allBindings,
						viewModel,
						bindingContext
					);
				} else {
					theValue = dropdownInterpretValue(value[service].value);
				}
				if (theValue !== false) {
					toAdd +=
						'<li><strong>' +
						service +
						':</strong> <span>' +
						theValue +
						'</span>';
					//Add in value_binding_show_text if it's declared
					if (
						typeof value[service].value_binding_show_text !==
						'undefined'
					) {
						toAdd +=
							' (' +
							dropdownInterpretValue(value[service].value) +
							')';
					}
					//Add in value_n if defined
					if (typeof value[service].value_2 !== 'undefined') {
						//Check if more than value_2, iterate through if so
						if (typeof value[service].value_3 !== 'undefined') {
							let i = 2;
							while (
								typeof value[service]['value_' + i] !==
								'undefined'
							) {
								const extraValue = dropdownInterpretValue(
									value[service]['value_' + i]
								);
								if (extraValue !== false) {
									if (i === 2) {
										toAdd += '(' + extraValue + ')';
									} else {
										toAdd += ', ' + extraValue;
									}
									//Append to last
									if (
										typeof value[service][
											'value_' + (i + 1).toString()
										] === 'undefined'
									) {
										if (
											typeof value[service].append !==
											'undefined'
										) {
											toAdd += value[service].append;
										}
									}
								}
								i++;
							}
							//just value_2
						} else {
							const extraValue2 = dropdownInterpretValue(
								value[service].value_2
							);
							if (extraValue2 !== false) {
								toAdd += ', ' + extraValue2;
								if (
									typeof value[service].append !== 'undefined'
								) {
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
		},
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
	ko.extenders.numeric = function(target, precision): number {
		const result = ko.computed({
			read: function() {
				const num = Number(target()).toFixed(precision) / 1;
				return num;
			},
			write: target,
		});
		return result;
	};

	///////////////////////////////////////
	//Section V: Map Init/Fail Functions //
	///////////////////////////////////////

	// Preloading 3 things, declare variables to wait for them
	let imagesPreloaded = false;
	let fontsPreloaded = false;
	let googlePreloaded = false;

	/**
	 * Called if the Google Maps API has failed to load, lets the user know
	 * to try again later
	 */
	function googleFailedToLoad(): void {
		alert('Google Maps failed to load. Please try again later.');
	}

	/**
	 * Called if the Google Maps API has successfully loaded.
	 */
	function googleLoaded(): void {
		googlePreloaded = true;
	}

	/**
	 * Function to create the google map as well as create and setup the
	 * viewModel
	 */
	function createMap(): void {
		// Double check api is really loaded
		if (typeof google === 'undefined') {
			googleFailedToLoad();
		} else {
			// Setup default options from config object
			const defaultLatLng = new google.maps.LatLng(
					appConfigObject.defaultLat,
					appConfigObject.defaultLng
				),
				defaultZoom =
					window.innerWidth < 992
						? appConfigObject.defaultMobileZoom
						: appConfigObject.defaultZoom,
				mapElement = document.getElementById('mapDiv'),
				defaultStyle = appConfigObject.mapStyle;

			const mapOptions = {
				center: defaultLatLng,
				zoom: defaultZoom,
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				mapTypeControlOptions: {
					mapTypeIds: [],
				}, //remove some controls
				styles: defaultStyle,
			};

			// Define reticle to be pegged at center of map
			const reticleImage = {
				url: imageReticle, // marker image
				size: new google.maps.Size(16, 16), // marker size
				origin: new google.maps.Point(0, 0), // marker origin
				anchor: new google.maps.Point(8, 8),
			}; // marker anchor point

			const reticleShape = {
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
				function(center) {
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
				function() {
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
				function(center) {
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
				function() {
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
				function() {
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
	}

	/**
	 * Called when preloading starts. Waits for images, fonts, and maps API to
	 * load and then calls createMap() to init map and viewModel. Finally,
	 * removes loading screen.
	 */
	function waitUntilEverythingLoaded(): void {
		$.doWhen({
			when: function() {
				return (
					imagesPreloaded === true &&
					fontsPreloaded === true &&
					googlePreloaded === true
				);
			},
		}).done(function(): void {
			createMap();
			$('#loading').fadeOut(500);
		});
	}

	/**
	 * Called from HTML right after maps API script starts to load. Loads
	 * web fonts and sets functions to declare fontsPreloaded as true when
	 * either a success, failure, or 10 seconds are up. Also preloads marker
	 * images for map as that takes the longest for Google Maps to fetch.
	 * Finally calls function to wait for images, fonts, and API to load.
	 */
	function preloadFontsAndImages(): void {
		const WebFontConfig = {
			google: {
				families: [
					'Lato:400,400italic,700:latin',
					'Scheherazade:400,700:latin',
				],
			},
			timeout: 10000,
			active: function() {
				fontsPreloaded = true;
			},
			// Fails to load, proceed anyway
			inactive: function() {
				fontsPreloaded = true;
				console.warn('Fonts were not loaded.');
			},
		};
		WebFont.load(WebFontConfig);

		preload(
			[
				imageMarker1,
				imageMarker2,
				imageMarker3,
				imageMarker4,
				imageMarkerEmpty,
				imageMarkerHeart,
				imageMarkerDefault,
				imageReticle,
			],
			function() {
				imagesPreloaded = true;
			}
		);
		waitUntilEverythingLoaded();
	}

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
