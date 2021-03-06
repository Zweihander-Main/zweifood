import * as config from './config';
import FuzzySet from 'fuzzyset.js';

/**
 * Function that converts a string to Proper Case.
 * @return {string} string with proper case
 */
// eslint-disable-next-line @typescript-eslint/unbound-method
String.prototype.toProperCase = function(): string {
	return this.replace(/\w\S*/g, (txt) => {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
};

/**
 * Function to preload images - used to preload images before loading screen
 * disappears. Useful as google maps takes awhile to load image markers.
 * @param  {array}    sources  array of strings of image locations
 * @param  {function} callback callback function
 */
export const preload = (sources: Array<string>, callback: () => void): void => {
	sources.forEach((imageURL: string) => {
		const preloadedImage = new Image();
		preloadedImage.src = imageURL;
	});
	if (typeof callback === 'function') {
		callback();
	}
};

/**
 * Checks if a given object has the given property
 * From http://stackoverflow.com/a/2631198/1481697
 * @param  {object}  obj Object to search
 * @param  {string}  ... Strings after object are nested levels to search for
 * @return {boolean}     Return true or false if object has given nesting level
 */
export const checkNested = (
	obj?: object,
	level?: string,
	...rest: Array<string>
): boolean => {
	if (obj === undefined) return false;
	if (rest.length == 0 && Object.prototype.hasOwnProperty.call(obj, level))
		return true;
	return checkNested(obj[level], ...rest);
};

/**
 * Gets current time - direct from underscore.js library for debounce function
 * @return {number} Current Date().getTime()
 */
export const _now: () => number =
	Date.now.bind(this) ||
	((): number => {
		return new Date().getTime();
	});

/**
 * Based on underscore.js library
 * Debounces function calls - useful for double clicking scenarios
 * @param  {function} func      Function to debounce
 * @param  {number}   wait      Time to wait to debounce calls
 * @param  {boolean}  immediate If passed, function will trigger on leading
 *                              edge rather than on trailing edge
 * @return {function}           debounced function
 */
export const debounce = (
	func: Function,
	wait: number,
	immediate?: boolean
): Function => {
	let timeout, args, context, timestamp, result;
	const later = (): void => {
		const last = _now() - timestamp;
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
	return (...incomingArgs): Function => {
		args = incomingArgs;
		context = this;
		timestamp = _now();
		const callNow = immediate && !timeout;
		if (!timeout) timeout = setTimeout(later, wait);
		if (callNow) {
			result = func.apply(context, args);
			context = args = null;
		}
		return result;
	};
};

/**
 * Based on underscore.js library
 * Throttles function calls - useful for event listeners like scrolling/panning
 * @param  {function} func    Function to throttle
 * @param  {number}   wait    Time to wait between calls
 * @param  {object}   options Object that specifies if trailing or leading edge
 *                            should be used, ex: {trailing: false}
 * @return {function}         Throttled function
 */
export const throttle = (
	func: Function,
	wait: number,
	options: { leading?: boolean; trailing?: boolean } = {}
): Function => {
	let context, args, result;
	let timeout = null;
	let previous = 0;
	const later = (): void => {
		previous = options.leading === false ? 0 : _now();
		timeout = null;
		result = func.apply(context, args);
		if (!timeout) context = args = null;
	};
	return (...incomingArgs): Function => {
		args = incomingArgs;
		const now = _now();
		if (!previous && options.leading === false) previous = now;
		const remaining = wait - (now - previous);
		context = this;
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
};

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
export const matchBasedOnName = (
	arrayOfResults: Array<GenericJSON | google.maps.places.PlaceResult>,
	nameToMatch: string,
	nameOfName?: string
): number | false => {
	if (typeof nameOfName === 'undefined') {
		nameOfName = 'name';
	}
	const setToMatch = new FuzzySet([]);
	for (let i = 0, len = arrayOfResults.length; i < len; i++) {
		setToMatch.add(arrayOfResults[i][nameOfName]);
	}
	const match = setToMatch.get(nameToMatch);
	// If there was a match, it'll be at match[0][1], confidence at match[0][0]
	if (match !== null && match[0][0] > config.MIN_FUZZY_MATCH) {
		return setToMatch.values().indexOf(match[0][1]);
	} else {
		return false;
	}
};

/**
 * Compare two arrays, determine if all values are equal
 * @param  {array} a1    first array to compare
 * @param  {array} a2    second array to compare
 * @return {boolean}     return boolean if array's match or not
 */
export const allValuesSameInTwoArray = <T>(
	a1: Array<T>,
	a2: Array<T>
): boolean => {
	for (let i = 0, len = a1.length; i < len; i++) {
		if (a1[i] !== a2[i]) {
			return false;
		}
	}
	return true;
};

/**
 * Check if browser storage is available
 * @param  {string} type Type of browser storage to check (ex localStorage)
 * @return {boolean}     Return if the type of storage is available
 */
export const storageAvailable = (type: string): boolean => {
	try {
		const storage = window[type],
			x = '__storage_test__';
		storage.setItem(x, x);
		storage.removeItem(x);
		return true;
	} catch (e) {
		return false;
	}
};

/**
 * Check if web workers are available
 * @return {boolean} Boolean on if web workers are available
 */
export const workersAvailable = (): boolean => {
	if (typeof Worker !== 'undefined' && window.location.protocol !== 'file:') {
		return true;
	}
	return false;
};
