importScripts('/js/vendor/fuzzyset.js');
var self = this;

function checkIfMarkerIsWithinBounds(iLat, iLng, cLat, cLng, maxDistance) {
   return (((iLat - maxDistance) <= cLat) && (cLat <= (iLat + maxDistance)) &&
       ((iLng - maxDistance) <= cLng) && (cLng <= (iLng + maxDistance)));
}

function matchBasedOnNameForWorker (setToMatch, nameToMatch, minFuzzyMatch, nameOfName) {
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

self.test = function() {
	console.log("wut");
};


self.addEventListener('message', function(e) {
	var resultsArray;
	var fuzzySetOfResultsNames = FuzzySet([]);
	var returnObject = [];

	if (e.data.type === "yelp") {
		resultsArray = e.data.resultsArray.map(function(item) {
			var newItem = item;
			newItem.lat = item.location.coordinate.latitude;
			newItem.lng = item.location.coordinate.longitude;
			fuzzySetOfResultsNames.add(item.name);
			return newItem;
		});
	} else if (e.data.type === "locu") {
		resultsArray = e.data.resultsArray.map(function(item) {
			var newItem = item;
			newItem.lng = item.long;
			fuzzySetOfResultsNames.add(item.name);
			return newItem;
		});
	} else if (e.data.type === "foursquare") {
		resultsArray = e.data.resultsArray.map(function(item) {
			var newItem = item;
			newItem.lat = item.location.lat;
			newItem.lng = item.location.lng;
			fuzzySetOfResultsNames.add(item.name);
			return newItem;
		});
	} else {
		resultsArray = e.data.resultsArray;
	}


	var narrowedDownLocations = e.data.locationsArray.filter(function(item) {
		return checkIfMarkerIsWithinBounds(e.data.initialPoint.lat, e.data.initialPoint.lng, item.lat, item.lng, e.data.maxDistance);
	});

	for (var i = 0; i<narrowedDownLocations.length; i++) {
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
