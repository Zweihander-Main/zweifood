importScripts("/vendor/fuzzyset.js");var self=this;function checkIfMarkerIsWithinBounds(a,e,r,t,n){return a-n<=r&&r<=a+n&&e-n<=t&&t<=e+n}function matchBasedOnNameForWorker(a,e,r){var t=a.get(e);return null!==t&&t[0][0]>r&&a.values().indexOf(t[0][1])}self.addEventListener("message",function(o){var a,i=new FuzzySet([]),e=[];a=o.data.resultsArray.map(function(a){var e=a;for(var r in o.data.workerHandler)if(o.data.workerHandler.hasOwnProperty(r))for(var t=0,n=o.data.workerHandler[r].length;t<n;t++)e[r]=e[o.data.workerHandler[r][t]];return i.add(a.name),e});for(var r=o.data.locationsArray.filter(function(a){return checkIfMarkerIsWithinBounds(o.data.initialPoint.lat,o.data.initialPoint.lng,a.lat,a.lng,o.data.maxDistance)}),t=0;t<r.length;t++){var n=matchBasedOnNameForWorker(i,r[t].name,o.data.minFuzzyMatch);if("number"==typeof n){var s=a[n];s.google_placeId=r[t].google_placeId,e.push(s)}}self.postMessage(e),self.close()},!1);