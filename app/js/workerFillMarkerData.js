var self = this;

function rad(x) {return x*Math.PI/180;}

function findMakerDistance(initialMarker, maxDistance) {
    var iLat = initialMarker.position.lat();
    var iLng = initialMarker.position.lng();
    var R = 6371; // radius of earth in km
    var closest = -1;
    for( i=0;i<map.markers.length; i++ ) {
        var mlat = map.markers[i].position.lat();
        var mlng = map.markers[i].position.lng();
        var dLat  = rad(mlat - iLat);
        var dLong = rad(mlng - iLng);
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(rad(lat)) * Math.cos(rad(lat)) * Math.sin(dLong/2) * Math.sin(dLong/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c;
        if ( d < maxDistance) {
            //
        }
    }
}

self.test = function() {
	console.log("wut");
};


self.addEventListener('message', function(e) {
 console.log(e);
  self.test();
  self.close();
}, false);
