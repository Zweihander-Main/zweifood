/* global importScripts, FuzzySet */
/**
 * Worker - can only be run when using a server and not from local filesystem.
 * Parses result data using fuzzySet plugin to find matches based on name of
 * location and within map bounds. Matches are sent back to main thread.
 */
importScripts('/vendor/fuzzyset.js'); // TODO
const self = this;

/**
 * Checks if a given set of coordinates are within a square distance of a
 * center point.
 * @param  {number} iLat        center lat
 * @param  {number} iLng        center long
 * @param  {number} cLat        point lat
 * @param  {number} cLng        point long
 * @param  {number} maxDistance distance from center to search
 * @return {boolean}            if the marker is within the maxDistance of the
 *                              center
 */
function checkIfMarkerIsWithinBounds(
	iLat,
	iLng,
	cLat,
	cLng,
	maxDistance
): boolean {
	return (
		iLat - maxDistance <= cLat &&
		cLat <= iLat + maxDistance &&
		iLng - maxDistance <= cLng &&
		cLng <= iLng + maxDistance
	);
}
/**
 * Function to determine closest fuzzy match to an array of strings using
 * the FuzzySet.js library. Uses minimum fuzzy match threshold as defined in
 * config object.
 * @param  {array} setToMatch     fuzzySet object to match against
 * @param  {string} nameToMatch   name to match
 * @param  {number} minFuzzyMatch fuzzy confidence threshold
 * @return {number/false}         index of match or false
 */
function matchBasedOnNameForWorker(
	setToMatch,
	nameToMatch,
	minFuzzyMatch
): number | false {
	const match = setToMatch.get(nameToMatch);
	if (match !== null && match[0][0] > minFuzzyMatch) {
		return setToMatch.values().indexOf(match[0][1]);
	} else {
		return false;
	}
}

self.addEventListener(
	'message',
	function(e) {
		const fuzzySetOfResultsNames = new FuzzySet([]);
		const returnObject = [];

		/**
		 * Parse through workerHandler object which is defined as:
		 * model_prop: ['strings', 'of', 'server', 'object', 'prop']
		 * This allows coords.long to get matched to lng.
		 * Also creates the fuzzySet object to check against.
		 */
		const resultsArray = e.data.resultsArray.map(function(item) {
			const newItem = item;
			for (const name in e.data.workerHandler) {
				if (e.data.workerHandler.hasOwnProperty(name)) {
					for (
						let i = 0, len = e.data.workerHandler[name].length;
						i < len;
						i++
					) {
						newItem[name] = newItem[e.data.workerHandler[name][i]];
					}
				}
			}
			fuzzySetOfResultsNames.add(item.name);
			return newItem;
		});

		/**
		 * Make sure locations are within the search point plus the search distance
		 */
		const narrowedDownLocations = e.data.locationsArray.filter(function(
			item
		) {
			return checkIfMarkerIsWithinBounds(
				e.data.initialPoint.lat,
				e.data.initialPoint.lng,
				item.lat,
				item.lng,
				e.data.maxDistance
			);
		});

		/**
		 * Scroll through narrowedDownLocations and match each one.
		 * If a match exists, push it back to the return object.
		 */
		for (let i = 0; i < narrowedDownLocations.length; i++) {
			const match = matchBasedOnNameForWorker(
				fuzzySetOfResultsNames,
				narrowedDownLocations[i].name,
				e.data.minFuzzyMatch
			);
			if (typeof match === 'number') {
				const correctResult = resultsArray[match];
				correctResult.google_placeId =
					narrowedDownLocations[i].google_placeId;
				returnObject.push(correctResult);
			}
		}
		self.postMessage(returnObject);
		// Kill self
		self.close();
	},
	false
);
