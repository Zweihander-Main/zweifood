import ko from 'knockout';
import $ from 'jquery';

import * as config from './config';
import ViewModel from './ViewModel';
import perfectScrollbar from 'perfect-scrollbar';
import ResizeSensor from 'css-element-queries/src/ResizeSensor.js';
import LocationModel from './LocationModel';
import { throttle, checkNested } from './util';

/**
 * 1. Utility Functions
 * 2. Binding Handlers
 * 3. Extenders
 */

//////////////////////////////////
// Section I: Utility Functions //
//////////////////////////////////

/**
 * Function to throttle perfectScrollbar updating - called when list of elements
 * populating scrollbar is changed
 * @param {object} jQueryObject   jQuery object that perfectScrollbar is
 *                                attached to
 */
const perfectScrollbarUpdatePerfectScrollbar = throttle(
	(jqueryObject: JQuery): void => {
		jqueryObject.data('perfectScrollbar').update();
	},
	16,
	{
		leading: false,
	}
);

/**
 * Simple way to model array which will be used from bindings to check if
 * nested properties exist
 */
type checkNestedArray =
	| [object, string]
	| [object, string, string]
	| [object, string, string, string];

/**
 * Used in dropdown bindingHandler to check all input values - necessary
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
	input: string | checkNestedArray | object,
	binding?: string,
	element?: HTMLElement,
	allBindings?: ko.AllBindings,
	viewModel?: ViewModel,
	bindingContext?: ko.BindingContext
): string | false => {
	if (typeof input !== 'undefined' && input !== null) {
		// Array will likely be a checkNested object
		if (Array.isArray(input)) {
			if (
				typeof input[0] !== 'undefined' &&
				typeof input[0] === 'object'
			) {
				if (
					checkNested(
						...(input as [object, string, string, string])
					) === true
				) {
					let returnValue = input[0];
					for (let i = 1, len = input.length; i < len; i++) {
						returnValue = returnValue[input[i] as string];
					}
					input = returnValue;
				} else {
					return false;
				}
			} else {
				return false;
			}
		}
		if (typeof binding !== 'undefined') {
			const bindingHandler = ko.bindingHandlers[
				binding
			] as KoInternalBindingHandlers;
			input = bindingHandler.update(
				element,
				input,
				allBindings,
				viewModel,
				bindingContext,
				true
			) as string;
		}
		return input as string;
	} else {
		return false;
	}
};

/**
 * Called from click or after setTimeout for verbose errors from
 * errorsHandler bindingHandler
 * @param  {object} element jQuery element from bindingHandler
 * @param  {number} time    animation length
 */
const errorsHandlerKillPanel = (element: JQuery, time: number): void => {
	element.hide(time, (): void => {
		element.remove();
	});
};

/**
 * Removes error panel on click or after a timeout
 * @param  {object} event event listener object
 */
const errorsHandlerOnClickPanel = (event: JQuery.TriggeredEvent): void => {
	const element = $(event.currentTarget);
	errorsHandlerKillPanel(element, 50);
	element.off('click', errorsHandlerOnClickPanel);
};

/**
 * Called from perfectScrollbar bindingHandler, calls perfect scrollbar
 * update and then kills itself to deal with a bug with marker list getting
 * populated too quickly
 * @param  {Event} event Event from handler
 */
const perfectScrollbarMouseEnterHandler = (
	event: JQuery.TriggeredEvent
): void => {
	const element = $(event.currentTarget);
	perfectScrollbarUpdatePerfectScrollbar(element);
	element.off('mouseenter', perfectScrollbarMouseEnterHandler);
};

/**
 * Function to toggle a menu while mobile UI is enabled and to change the
 * associated observable with that menu state.
 * @param  {object} element           element from bindinghandler
 * @param  {string} menu              string id of the menu to toggle
 * @param  {object} toggledObservable observable associated with the menu
 *                                    state
 */
const menuToggleToggleMenu = (
	element: HTMLElement,
	menu: string,
	toggledObservable: KnockoutObservable<boolean>
): void => {
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

/////////////////////////////////
//Section II: Binding Handlers //
/////////////////////////////////

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
	init: (
		element: HTMLElement,
		valueAccessor: () => JQueryUI.AutocompleteOptions
	): void => {
		$(element).autocomplete(valueAccessor());
	},
	/**
	 * Sync updated source or input data to autocomplete widget
	 */
	update: (
		element: HTMLElement,
		valueAccessor: () => JQueryUI.AutocompleteOptions,
		allBindingsAccessor: ko.AllBindings
	): void => {
		$(element).autocomplete({
			source: (
				request: { term: string },
				response: (res: Array<string>) => void
			): void => {
				const results = $.ui.autocomplete.filter(
					valueAccessor().source,
					request.term
				);
				response(results.slice(0, 6));
			},
			select: (
				event: JQueryEventObject,
				ui: JQueryUI.AutocompleteUIParams
			): void => {
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
	update: (element: HTMLElement, valueAccessor: () => string): void => {
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
	init: (element: HTMLElement): void => {
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
	init: (
		element: HTMLInputElement,
		valueAccessor: () => KnockoutObservable<boolean>,
		allBindingsAccessor: ko.AllBindings,
		viewModel: ViewModel,
		bindingContext: ko.BindingContext
	): void => {
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

		autocomplete.addListener('place_changed', (): void => {
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
						? config.DEFAULT_MOBILE_ZOOM
						: config.DEFAULT_ZOOM;
				map.setZoom(defaultZoom);
			}
		});
	},
	/**
	 * Make sure input elements value is bound
	 */
	update: (element: HTMLElement, valueAccessor: () => string): void => {
		ko.bindingHandlers.value.update(element, valueAccessor());
	},
};

/** @type {Object} Bind jQuery Sliderbars plugin to element */
ko.bindingHandlers.koSlideOutMenu = {
	init: (): void => {
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
	update: (element: HTMLElement, valueAccessor: () => boolean): void => {
		const _value = valueAccessor();
		const _valueUnwrapped = ko.unwrap(_value);
		if (_valueUnwrapped) {
			const scrollItemIntoView = throttle((): void => {
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
	init: (
		element: HTMLElement,
		valueAccessor: () => boolean,
		allBindings: ko.AllBindings,
		viewModel: ViewModel,
		bindingContext: ko.BindingContext
	): void => {
		ko.utils.registerEventHandler(element, 'mouseover', (): void => {
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
	init: (
		element: HTMLElement,
		valueAccessor: () => {
			value: KnockoutObservable<number>;
			step: number;
			min: number;
			max: number;
		},
		allBindings: ko.AllBindings
	): void => {
		ko.bindingHandlers.value.init(element, valueAccessor, allBindings);
		const initialValue = valueAccessor();
		const passValue = {
			value: initialValue.value(),
			step: initialValue.step,
			min: initialValue.min,
			max: initialValue.max,
		};
		passValue.value = valueAccessor().value();
		$(element)
			.slider(passValue)
			.on(
				'slidechange',
				(
					event: JQuery.TriggeredEvent,
					ui: JQueryUI.SliderUIParams
				): void => {
					valueAccessor().value(ui.value);
				}
			);
	},
};

interface KoRateItInput {
	value: number;
	observable: KnockoutObservable<number>;
}
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
	init: (element: HTMLElement, valueAccessor: () => KoRateItInput): void => {
		const observable = ko.unwrap(valueAccessor()).observable;
		$(element).on('reset', (): void => {
			observable(0);
		});
	},
	/**
	 * Value should be object with value property corresponding to the value
	 * binded to the rateIt plugin. Calls to reset the state of the stars
	 * if the value is -1 (as it would be when all filters are cleared).
	 */
	update: (
		element: HTMLElement,
		valueAccessor: () => KoRateItInput
	): void => {
		const value = ko.unwrap(valueAccessor()).value;
		if (value === -1) {
			$(element).rateit('reset');
		}
	},
};

/**
 * Binding to set classes on infoWindow that has appeared - called when the
 * info window template is parsed by knockout (so is called every time a new
 * infoWindow is opened). Classes are styles using CSS.
 * @type {Object}
 */
ko.bindingHandlers.koStyleInfoWindow = {
	/**
	 * Element will be the infoWindow template that is used as the contents
	 * of every window. Sets classes on root parent of infoWindow, parent of
	 * infoWindow elements that style it, and those elements. Resets some
	 * element inline styling that can't be overridden by CSS.
	 */
	init: (element: HTMLElement): void => {
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
	update: (
		element: HTMLElement,
		valueAccessor: () => LocationModel,
		allBindings: ko.AllBindings,
		viewModel: ViewModel,
		bindingContext: ko.BindingContext
	): void => {
		const model = ko.unwrap(valueAccessor());
		// Remove previous infoWindow calls if present
		if (element.resizeSensor) {
			delete element.resizeSensor;
			delete element.resizedAttached;
		}
		//CurrentlySelectedElement could be undefined
		if (typeof model !== 'undefined') {
			const theElement = $(element);
			// Select the outer infoWindow ideally
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
			new ResizeSensor(element, (): void => {
				bindingContext.$data.regularInfoWindowPan(true);
				// Could previously use this but stopped working with API 3.23
				// model.infoWindow.open(window.map, model.marker());
				$(model.infoWindow.getContent() as Element).height(
					$(model.infoWindow.getContent() as Element).height()
				);
				// Alternate method, not necessary probably
				// model.infoWindow.setContent($(model.infoWindow.content).get(0));
			});
			/**
			 * Wait 75ms before starting listener on infoWindow that checks
			 * if it needs to be centered. This allows the native google
			 * method of adjusting the map to stop the check from being
			 * called for a bit.
			 */
			setTimeout((): void => {
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
	init: (): void => {
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
	init: (element: HTMLElement): void => {
		$(element).data('perfectScrollbar', new perfectScrollbar(element));
		$(element).on('mouseenter', perfectScrollbarMouseEnterHandler);
	},
	/**
	 * Calls updatePerfectScrollbar whenever element is updated - ensures
	 * smooth usage with rapidly updating marker list as the plugin
	 * struggles to autoupdate 100% of the time otherwise.
	 */
	update: (
		element: HTMLElement,
		valueAccessor: () => KnockoutObservableArray<LocationModel>
	): void => {
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
	update: (
		element: HTMLElement,
		valueAccessor: (() => number) | number,
		allBindings: ko.AllBindings,
		viewModel: ViewModel,
		bindingContext: ko.BindingContext,
		internal: boolean
	): void | string => {
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
} as KoInternalBindingHandlers;

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
	update: (
		element: HTMLElement,
		valueAccessor: (() => string) | string,
		allBindings: ko.AllBindings,
		viewModel: ViewModel,
		bindingContext: ko.BindingContext,
		internal: boolean
	): string | void => {
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
} as KoInternalBindingHandlers;

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
	update: (
		element: HTMLElement,
		valueAccessor: (() => string) | string,
		allBindings: ko.AllBindings,
		viewModel: ViewModel,
		bindingContext: ko.BindingContext,
		internal: boolean
	): void | string => {
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
} as KoInternalBindingHandlers;

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
	update: (
		element: HTMLElement,
		valueAccessor: (() => number) | number,
		allBindings: ko.AllBindings,
		viewModel: ViewModel,
		bindingContext: ko.BindingContext,
		internal: boolean
	): void | string => {
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
} as KoInternalBindingHandlers;

/**
 * Binding handler for bootstrap modal - useful for allowing tooltip and
 * modal on the same element. Value passed in should be the element the
 * modal is going to call in jQuery format ie #myModal
 * @type {Object}
 */
ko.bindingHandlers.koModal = {
	init: (element: HTMLElement, valueAccessor: () => string): void => {
		const value = ko.unwrap(valueAccessor());
		ko.utils.registerEventHandler(element, 'click', (): void => {
			$(value).modal();
		});
	},
};

interface MenuToggleInput {
	menu: string;
	toggledObservable: KnockoutObservable<boolean>;
	toggled: boolean;
}
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
	init: (
		element: HTMLElement,
		valueAccessor: () => MenuToggleInput
	): void => {
		const value = ko.unwrap(valueAccessor());
		const menu = value.menu;
		const toggledObservable = value.toggledObservable;
		ko.utils.registerEventHandler(element, 'click', (): void => {
			menuToggleToggleMenu(element, menu, toggledObservable);
		});
	},
	/**
	 * Kills the menu if a location has been selected and the menu is open.
	 */
	update: (
		element: HTMLElement,
		valueAccessor: () => MenuToggleInput
	): void => {
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
	update: (
		element: HTMLElement,
		valueAccessor: () => KnockoutObservableArray<LocationModel>,
		allBindings: ko.AllBindings,
		viewModel: ViewModel,
		bindingContext: ko.BindingContext
	): void => {
		ko.utils.unwrapObservable(valueAccessor());
		bindingContext.$data.scrollToItem();
	},
};

/**
 * Binding handler to render infoWindowTemplate template when initial
 * bit of HTML fed to infoWindow contents is parsed via knockout's
 * applyBindings. Replaces initial HTML.
 * @type {Object}
 */
ko.bindingHandlers.infoWindowTemplate = {
	init: (
		element: HTMLElement,
		valueAccessor: () => string,
		allBindings: ko.AllBindings,
		viewModel: ViewModel,
		bindingContext: ko.BindingContext
	): void => {
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

interface ErrorsInput {
	data: KnockoutObservable<boolean | ErrorInterface>;
	verbose: KnockoutObservable<boolean>;
}

/**
 * Binding handler for error container - parses errors fed into it and
 * uses element as container for their DOM nodes
 * @type {Object}
 */
ko.bindingHandlers.errorsHandler = {
	/**
	 * Value has two object inputs: data which is the errors object from the
	 * viewModel and verbose which is the verbose boolean from the viewModel
	 * Verbose errors die after 3 seconds, normal errors have to be clicked
	 * to be removed.
	 */
	update: (
		element: HTMLElement,
		valueAccessor: () => ErrorsInput,
		allBindings: ko.AllBindings,
		viewModel: ViewModel,
		bindingContext: ko.BindingContext
	): void => {
		const error = valueAccessor().data();
		if (error !== false) {
			valueAccessor().data(false);
			const verbose = valueAccessor().verbose();
			const isVerbose =
				typeof error === 'object' ? error.verbose : undefined;
			if (
				(verbose === true || isVerbose === false) &&
				typeof error === 'object'
			) {
				const killOnMarkers = error.killOnMarkers;
				const customMessage = error.customMessage;
				const textStatus = error.textStatus;
				let toAdd = '<div class="card ';
				toAdd +=
					isVerbose === true ? 'bg-warning' : 'bg-danger text-white';
				toAdd += '"><div class="card-header"><h3 class="card-title">';
				toAdd += customMessage;
				toAdd += '</h3></div><div class="card-body">';
				toAdd += textStatus;
				toAdd += '</div></div>';
				$('#error-container').append(toAdd);
				const added = $('#error-container')
					.children()
					.last();
				added.show(200);
				added.on('click', errorsHandlerOnClickPanel);
				if (isVerbose === true) {
					setTimeout((): void => {
						errorsHandlerKillPanel(added, 200);
						added.off('click', errorsHandlerOnClickPanel);
					}, 3000);
				}
				/**
				 * If killOnMarkers is set, check if listableEntries has any
				 * entries. When they do, kill the affected panels.
				 */
				if (killOnMarkers === true) {
					const waitForEntriesLength = (): Promise<() => void> => {
						const poll = (resolve: () => void): void => {
							if (
								bindingContext.$data.listableEntries().entries
									.length > 0
							) {
								resolve();
							} else setTimeout((): void => poll(resolve), 100);
						};
						return new Promise(poll);
					};

					waitForEntriesLength().then((): void => {
						errorsHandlerKillPanel(added, 200);
						added.off('click', errorsHandlerOnClickPanel);
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
	update: (
		element: HTMLElement,
		valueAccessor: () => google.maps.places.OpeningHours
	): void => {
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
interface DropdownInput {
	data: {
		[key: string]: {
			value: string | checkNestedArray;
			value_binding: string;
			value_binding_show_text: boolean;
			value_2?: string;
			value_3?: string;
			append?: string;
		};
	};
}

/**
 * Binding handler to handle creating bootstrap dropdowns in infoWindows
 * (which contain the same piece of information from different sources)
 * @type {Object}
 */
ko.bindingHandlers.dropdown = {
	/**
	 * Binds bootstrap's dropdown to jQuery UI's positioning function for
	 * the purpose of using jQuery UI's collision detection to flip the
	 * dropdown when necessary.
	 */
	init: (element: HTMLElement): void => {
		$(element).on('shown.bs.dropdown', function() {
			const menu = $(this).find('.dropdown-menu');
			if (menu !== null && menu.length === 1) {
				const btn = menu.parent();
				const withinContainer = $('#info-window-tabs-info');
				menu.position({
					of: btn,
					my: 'left top',
					at: 'left bottom',
					collision: 'flipfit',
					within: withinContainer,
				});
			}
		});
	},

	update: (
		element: HTMLElement,
		valueAccessor: () => DropdownInput,
		allBindings: ko.AllBindings,
		viewModel: ViewModel,
		bindingContext: ko.BindingContext
	): void => {
		const value = valueAccessor().data;
		const starter =
			'<button type="button" class="btn btn-default ' +
			'dropdown-toggle" data-display="static" data-toggle="dropdown" aria-haspopup="true" ' +
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
							typeof value[service]['value_' + i] !== 'undefined'
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
							if (typeof value[service].append !== 'undefined') {
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

//////////////////////////
//Section III:Extenders //
//////////////////////////

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
ko.extenders.numeric = (
	target: number | string,
	precision: number
): ko.PureComputed<string | number> => {
	return ko.pureComputed({
		read: (): number => {
			const num = +Number(this.target()).toFixed(precision);
			return num;
		},
		write: (value: string | number): void => {
			this.target(value);
		},
	});
};
