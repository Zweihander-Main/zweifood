importScripts('/js/vendor/fuzzyset.js');
var self = this;

function checkIfMarkerIsWithinBounds(iLat, iLng, cLat, cLng, maxDistance) {
	return (((iLat - maxDistance) <= cLat) && (cLat <= (iLat + maxDistance)) &&
		((iLng - maxDistance) <= cLng) && (cLng <= (iLng + maxDistance)));
}

function matchBasedOnNameForWorker(setToMatch, nameToMatch, minFuzzyMatch, nameOfName) {
	if (typeof(nameOfName) === "undefined") {
		nameOfName = 'name';
	}
	var match = setToMatch.get(nameToMatch);
	if ((match !== null) && (match[0][0] > minFuzzyMatch)) {
		return setToMatch.values().indexOf(match[0][1]);
	} else {
		return false;
	}
}


self.addEventListener('message', function(e) {
	var resultsArray;
	var fuzzySetOfResultsNames = FuzzySet([]);
	var returnObject = [];

	resultsArray = e.data.resultsArray.map(function(item) {
		var newItem = item;
		for (var name in e.data.workerHandler) {
			for (var i = 0; i < e.data.workerHandler[name].length; i++) {
				newItem[name] = newItem[e.data.workerHandler[name][i]];
			}
		}
		fuzzySetOfResultsNames.add(item.name);
		return newItem;
	});


	var narrowedDownLocations = e.data.locationsArray.filter(function(item) {
		return checkIfMarkerIsWithinBounds(e.data.initialPoint.lat, e.data.initialPoint.lng, item.lat, item.lng, e.data.maxDistance);
	});

	for (var i = 0; i < narrowedDownLocations.length; i++) {
		var match = matchBasedOnNameForWorker(fuzzySetOfResultsNames, narrowedDownLocations[i].name, e.data.minFuzzyMatch);
		if (typeof(match) === 'number') {
			var correctResult = resultsArray[match];
			correctResult.google_placeId = narrowedDownLocations[i].google_placeId;
			returnObject.push(correctResult);
		}
	}
	self.postMessage(returnObject);
	self.close();
}, false);