importScripts("/vendor/fuzzyset.js");var self=this;function checkIfMarkerIsWithinBounds(a,e,r,t,n){return a-n<=r&&r<=a+n&&e-n<=t&&t<=e+n}function matchBasedOnNameForWorker(a,e,r){var t=a.get(e);return null!==t&&t[0][0]>r&&a.values().indexOf(t[0][1])}self.addEventListener("message",function(a){var e,r=new FuzzySet([]),t=[];e=a.data.resultsArray.map(function(e){var t=e;for(var n in a.data.workerHandler)if(a.data.workerHandler.hasOwnProperty(n))for(var o=0,i=a.data.workerHandler[n].length;o<i;o++)t[n]=t[a.data.workerHandler[n][o]];return r.add(e.name),t});for(var n=a.data.locationsArray.filter(function(e){return checkIfMarkerIsWithinBounds(a.data.initialPoint.lat,a.data.initialPoint.lng,e.lat,e.lng,a.data.maxDistance)}),o=0;o<n.length;o++){var i=matchBasedOnNameForWorker(r,n[o].name,a.data.minFuzzyMatch);if("number"==typeof i){var s=e[i];s.google_placeId=n[o].google_placeId,t.push(s)}}self.postMessage(t),self.close()},!1);