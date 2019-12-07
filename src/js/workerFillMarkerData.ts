/**
 * Worker - can only be run when using a server and not from local filesystem.
 * Parses result data using fuzzySet plugin to find matches based on name of
 * location and within map bounds. Matches are sent back to main thread.
 */
import FuzzySet from 'fuzzyset.js'; // Will be equivalent to importScripts when run using Parcel
import { WorkerCommunicationObject } from './config';
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
const checkIfMarkerIsWithinBounds = (
	iLat: number,
	iLng: number,
	cLat: number,
	cLng: number,
	maxDistance: number
): boolean => {
	return (
		iLat - maxDistance <= cLat &&
		cLat <= iLat + maxDistance &&
		iLng - maxDistance <= cLng &&
		cLng <= iLng + maxDistance
	);
};
/**
 * Function to determine closest fuzzy match to an array of strings using
 * the FuzzySet.js library. Uses minimum fuzzy match threshold as defined in
 * config object.
 * @param  {array} setToMatch     fuzzySet object to match against
 * @param  {string} nameToMatch   name to match
 * @param  {number} minFuzzyMatch fuzzy confidence threshold
 * @return {number/false}         index of match or false
 */
const matchBasedOnNameForWorker = (
	setToMatch, //TODO -- also test
	nameToMatch: string,
	minFuzzyMatch: number
): number | false => {
	const match = setToMatch.get(nameToMatch);
	if (match !== null && match[0][0] > minFuzzyMatch) {
		return setToMatch.values().indexOf(match[0][1]);
	} else {
		return false;
	}
};

onmessage = (e: MessageEvent): void => {
	const fuzzySetOfResultsNames = new FuzzySet([]);
	const returnObject = [];
	const data = e.data as WorkerCommunicationObject;
	/**
	 * Parse through workerHandler object which is defined as:
	 * model_prop: ['strings', 'of', 'server', 'object', 'prop']
	 * This allows coords.long to get matched to lng.
	 * Also creates the fuzzySet object to check against.
	 */
	const resultsArray = data.resultsArray.map((item: GenericJSON) => {
		const newItem = item;
		for (const name in data.workerHandler) {
			if (
				Object.prototype.hasOwnProperty.call(data.workerHandler, name)
			) {
				for (
					let i = 0, len = data.workerHandler[name].length;
					i < len;
					i++
				) {
					newItem[name] = newItem[data.workerHandler[name][i]];
				}
			}
		}
		fuzzySetOfResultsNames.add(item.name);
		return newItem;
	});

	/**
	 * Make sure locations are within the search point plus the search distance
	 */
	const narrowedDownLocations = data.locationsArray.filter(
		(item: GenericJSON & { lat: number; lng: number }) => {
			return checkIfMarkerIsWithinBounds(
				data.initialPoint.lat,
				data.initialPoint.lng,
				item.lat,
				item.lng,
				data.maxDistance
			);
		}
	);

	/**
	 * Scroll through narrowedDownLocations and match each one.
	 * If a match exists, push it back to the return object.
	 */
	for (let i = 0; i < narrowedDownLocations.length; i++) {
		const match = matchBasedOnNameForWorker(
			fuzzySetOfResultsNames,
			narrowedDownLocations[i].name as string,
			data.minFuzzyMatch
		);
		if (typeof match === 'number') {
			const correctResult = resultsArray[match];
			// eslint-disable-next-line @typescript-eslint/camelcase
			correctResult.google_placeId =
				// eslint-disable-next-line @typescript-eslint/camelcase
				narrowedDownLocations[i].google_placeId;
			returnObject.push(correctResult);
		}
	}
	// eslint-disable-next-line
	postMessage(returnObject);
	// Kill self
	close();
};
