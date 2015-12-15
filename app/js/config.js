var appConfigObject = {
	lowMarkerOpacity: 0.25,
	highMarkerOpacity: 1.0,
	maxMarkerLimit: 4000,
	defaultLat: 41.699,
	defaultLng: -73.925,
	defaultZoom: 15,
	markerLimitRemoveBulkAmount: 1000,
	yelpConsumerKey: '***REMOVED***',
	yelpConsumerSecret: '***REMOVED***',
	yelpToken: '***REMOVED***',
	yelpTokenSecret: '***REMOVED***',
	yelpBaseURL: 'https://api.yelp.com/v2/',
	latLngAccuracy: 0.001,
	minFuzzyMatch: 0.5,
	locuBaseURL: 'https://api.locu.com/v1_0/venue/',
	locuAPIKey: '***REMOVED***',
	foursquareClientID: '***REMOVED***',
	foursquareClientSecret: '***REMOVED***',
	foursquareBaseURL: 'https://api.foursquare.com/v2/venues/',
	APIMappingsForModel: {
		"google": [{
			"server": "place_id",
			"model": "google_placeId",
			"oType": 0
		}, {
			"server": "name",
			"model": "google_name",
			"oType": 1
		}, {
			"server": "geometry",
			"model": "google_geometry",
			"oType": 1
		}, {
			"server": "rating",
			"model": "google_rating",
			"oType": 1
		}, {
			"server": "types",
			"model": "google_types",
			"oType": 2
		}, {
			"server": "vicinity",
			"model": "google_vicinity",
			"oType": 1
		}, {
			"server": "price_level",
			"model": "google_priceLevel",
			"oType": 1
		}, {
			"server": "icon",
			"model": "google_iconURL",
			"oType": 1
		}, {
			"server": "adr_address",
			"model": "google_adrAddress",
			"oType": 1
		}, {
			"server": "formatted_phone_number",
			"model": "google_formattedPhone",
			"oType": 1
		}, {
			"server": "html_attributions",
			"model": "google_singleLocAttributionsArray",
			"oType": 2
		}, {
			"server": "opening_hours",
			"model": "google_openingHoursObject",
			"oType": 1
		}, {
			"server": "photos",
			"model": "google_photos",
			"oType": 2
		}, {
			"server": "reviews",
			"model": "google_reviews",
			"oType": 2
		}, {
			"server": "user_ratings_total",
			"model": "google_totalRatings",
			"oType": 1
		}, {
			"server": "utc_offset",
			"model": "google_UTCOffset",
			"oType": 1
		}, {
			"server": "url",
			"model": "google_URL",
			"oType": 1
		}],
		"yelp": [{
			"server": "id",
			"model": "yelp_ID",
			"oType": 1
		}, {
			"server": "is_closed",
			"model": "yelp_isPermaClosed",
			"oType": 1
		}, {
			"server": "name",
			"model": "yelp_name",
			"oType": 1
		}, {
			"server": "image_url",
			"model": "yelp_imageURL",
			"oType": 1
		}, {
			"server": "url",
			"model": "yelp_URL",
			"oType": 1
		}, {
			"server": "review_count",
			"model": "yelp_reviewCount",
			"oType": 1
		}, {
			"server": "rating",
			"model": "yelp_rating",
			"oType": 1
		}, {
			"server": "snippet_text",
			"model": "yelp_snippetText",
			"oType": 1
		}, {
			"server": "menu_provider",
			"model": "yelp_menuProvider",
			"oType": 1
		}, {
			"server": "menu_date_updated",
			"model": "yelp_menuDateUpdated",
			"oType": 1
		}, {
			"server": "reservation_url",
			"model": "yelp_reservationURL",
			"oType": 1
		}, {
			"server": "eat24_url",
			"model": "yelp_eat24URL",
			"oType": 1
		}, {
			"server": "gift_certificates",
			"model": "yelp_giftCertificates",
			"oType": 2
		}, {
			"server": "deals",
			"model": "yelp_deals",
			"oType": 2
		}, {
			"server": "categories",
			"model": "yelp_categories",
			"oType": 2
		}, {
			"server": "reviews",
			"model": "yelp_reviews",
			"oType": 2
		}],
		"locu": [{
			"server": "id",
			"model": "locu_id",
			"oType": 1
		}, {
			"server": "name",
			"model": "locu_name",
			"oType": 1
		}, {
			"server": "website_url",
			"model": "locu_websiteURL",
			"oType": 1
		}, {
			"server": "has_menu",
			"model": "locu_hasMenu",
			"oType": 1
		}, {
			"server": "phone",
			"model": "locu_phone",
			"oType": 1
		}, {
			"server": "resource_uri",
			"model": "locu_resourceURI",
			"oType": 1
		}, {
			"server": "street_address",
			"model": "locu_streetAddress",
			"oType": 1
		}, {
			"server": "locality",
			"model": "locu_locality",
			"oType": 1
		}, {
			"server": "region",
			"model": "locu_region",
			"oType": 1
		}, {
			"server": "postal_code",
			"model": "locu_postalCode",
			"oType": 1
		}, {
			"server": "country",
			"model": "locu_country",
			"oType": 1
		}, {
			"server": "lat",
			"model": "locu_lat",
			"oType": 1
		}, {
			"server": "long",
			"model": "locu_long",
			"oType": 1
		}, {
			"server": "categories",
			"model": "locu_categories",
			"oType": 1
		}, {
			"server": "cuisines",
			"model": "locu_cuisines",
			"oType": 1
		}, {
			"server": "open_hours",
			"model": "locu_openHours",
			"oType": 1
		}, {
			"server": "facebook_url",
			"model": "locu_facebookURL",
			"oType": 1
		}, {
			"server": "twitter_id",
			"model": "locu_twitterID",
			"oType": 1
		}, {
			"server": "similar_venues",
			"model": "locu_similarVenues",
			"oType": 1
		}, {
			"server": "menus",
			"model": "locu_menus",
			"oType": 2
		}],
		"foursquare": [{
			"server": "id",
			"model": "foursquare_id",
			"oType": 1
		}, {
			"server": "name",
			"model": "foursquare_name",
			"oType": 1
		}, {
			"server": "contact",
			"model": "foursquare_contact",
			"oType": 1
		}, {
			"server": "location",
			"model": "foursquare_location",
			"oType": 1
		}, {
			"server": "categories",
			"model": "foursquare_categories",
			"oType": 2
		}, {
			"server": "verified",
			"model": "foursquare_verified",
			"oType": 1
		}, {
			"server": "stats",
			"model": "foursquare_stats",
			"oType": 1
		}, {
			"server": "url",
			"model": "foursquare_url",
			"oType": 1
		}, {
			"server": "hours",
			"model": "foursquare_hours",
			"oType": 1
		}, {
			"server": "popular",
			"model": "foursquare_popular",
			"oType": 1
		}, {
			"server": "menu",
			"model": "foursquare_menu",
			"oType": 1
		}, {
			"server": "price",
			"model": "foursquare_price",
			"oType": 1
		}, {
			"server": "rating",
			"model": "foursquare_rating",
			"oType": 1
		}, {
			"server": "specials",
			"model": "foursquare_specials",
			"oType": 1
		}, {
			"server": "hereNow",
			"model": "foursquare_hereNow",
			"oType": 1
		}, {
			"server": "storeId",
			"model": "foursquare_storeId",
			"oType": 1
		}, {
			"server": "description",
			"model": "foursquare_description",
			"oType": 1
		}, {
			"server": "createdAt",
			"model": "foursquare_createdAt",
			"oType": 1
		}, {
			"server": "mayor",
			"model": "foursquare_mayor",
			"oType": 1
		}, {
			"server": "tips",
			"model": "foursquare_tips",
			"oType": 1
		}, {
			"server": "listed",
			"model": "foursquare_listed",
			"oType": 1
		}, {
			"server": "tags",
			"model": "foursquare_tags",
			"oType": 2
		}, {
			"server": "beenHere",
			"model": "foursquare_beenHere",
			"oType": 1
		}, {
			"server": "shortUrl",
			"model": "foursquare_shortUrl",
			"oType": 1
		}, {
			"server": "canonicalUrl",
			"model": "foursquare_canonicalUrl",
			"oType": 1
		}, {
			"server": "specialsNearby",
			"model": "foursquare_specialsNearby",
			"oType": 2
		}, {
			"server": "photos",
			"model": "foursquare_photos",
			"oType": 1
		}, {
			"server": "likes",
			"model": "foursquare_likes",
			"oType": 1
		}, {
			"server": "phrases",
			"model": "foursquare_phrases",
			"oType": 1
		}, {
			"server": "attributes",
			"model": "foursquare_attributes",
			"oType": 1
		}]
	},
	mapStyle:// [{
	// 	"featureType": "all",
	// 	"elementType": "labels.text.fill",
	// 	"stylers": [{
	// 		"saturation": 36
	// 	}, {
	// 		"color": "#000000"
	// 	}, {
	// 		"lightness": 40
	// 	}]
	// }, {
	// 	"featureType": "all",
	// 	"elementType": "labels.text.stroke",
	// 	"stylers": [{
	// 		"visibility": "on"
	// 	}, {
	// 		"color": "#000000"
	// 	}, {
	// 		"lightness": 16
	// 	}]
	// }, {
	// 	"featureType": "all",
	// 	"elementType": "labels.icon",
	// 	"stylers": [{
	// 		"visibility": "off"
	// 	}]
	// }, {
	// 	"featureType": "administrative",
	// 	"elementType": "geometry.fill",
	// 	"stylers": [{
	// 		"color": "#000000"
	// 	}, {
	// 		"lightness": 20
	// 	}]
	// }, {
	// 	"featureType": "administrative",
	// 	"elementType": "geometry.stroke",
	// 	"stylers": [{
	// 		"color": "#000000"
	// 	}, {
	// 		"lightness": 17
	// 	}, {
	// 		"weight": 1.2
	// 	}]
	// }, {
	// 	"featureType": "landscape",
	// 	"elementType": "all",
	// 	"stylers": [{
	// 		"visibility": "on"
	// 	}]
	// }, {
	// 	"featureType": "landscape",
	// 	"elementType": "geometry",
	// 	"stylers": [{
	// 		"color": "#000000"
	// 	}, {
	// 		"lightness": 20
	// 	}]
	// }, {
	// 	"featureType": "landscape",
	// 	"elementType": "labels.icon",
	// 	"stylers": [{
	// 		"saturation": "-100"
	// 	}, {
	// 		"lightness": "-54"
	// 	}]
	// }, {
	// 	"featureType": "poi",
	// 	"elementType": "all",
	// 	"stylers": [{
	// 		"visibility": "on"
	// 	}, {
	// 		"lightness": "0"
	// 	}]
	// }, {
	// 	"featureType": "poi",
	// 	"elementType": "geometry",
	// 	"stylers": [{
	// 		"color": "#000000"
	// 	}, {
	// 		"lightness": 21
	// 	}]
	// }, {
	// 	"featureType": "poi",
	// 	"elementType": "labels.icon",
	// 	"stylers": [{
	// 		"saturation": "-89"
	// 	}, {
	// 		"lightness": "-55"
	// 	}]
	// }, {
	// 	"featureType": "road",
	// 	"elementType": "labels.icon",
	// 	"stylers": [{
	// 		"visibility": "off"
	// 	}]
	// }, {
	// 	"featureType": "road.highway",
	// 	"elementType": "geometry.fill",
	// 	"stylers": [{
	// 		"color": "#000000"
	// 	}, {
	// 		"lightness": 17
	// 	}]
	// }, {
	// 	"featureType": "road.highway",
	// 	"elementType": "geometry.stroke",
	// 	"stylers": [{
	// 		"color": "#000000"
	// 	}, {
	// 		"lightness": 29
	// 	}, {
	// 		"weight": 0.2
	// 	}]
	// }, {
	// 	"featureType": "road.arterial",
	// 	"elementType": "geometry",
	// 	"stylers": [{
	// 		"color": "#000000"
	// 	}, {
	// 		"lightness": 18
	// 	}]
	// }, {
	// 	"featureType": "road.local",
	// 	"elementType": "geometry",
	// 	"stylers": [{
	// 		"color": "#000000"
	// 	}, {
	// 		"lightness": 16
	// 	}]
	// }, {
	// 	"featureType": "transit",
	// 	"elementType": "geometry",
	// 	"stylers": [{
	// 		"color": "#000000"
	// 	}, {
	// 		"lightness": 19
	// 	}]
	// }, {
	// 	"featureType": "transit.station",
	// 	"elementType": "labels.icon",
	// 	"stylers": [{
	// 		"visibility": "on"
	// 	}, {
	// 		"saturation": "-100"
	// 	}, {
	// 		"lightness": "-51"
	// 	}]
	// }, {
	// 	"featureType": "water",
	// 	"elementType": "geometry",
	// 	"stylers": [{
	// 		"color": "#000000"
	// 	}, {
	// 		"lightness": 17
	// 	}]
	// }]
	[{
		"featureType": "all",
		"elementType": "labels.text.fill",
		"stylers": [{
			"saturation": 36
		}, {
			"color": "#000000"
		}, {
			"lightness": 40
		}]
	}, {
		"featureType": "all",
		"elementType": "labels.text.stroke",
		"stylers": [{
			"visibility": "on"
		}, {
			"color": "#000000"
		}, {
			"lightness": 16
		}]
	}, {
		"featureType": "all",
		"elementType": "labels.icon",
		"stylers": [{
			"visibility": "off"
		}]
	}, {
		"featureType": "administrative",
		"elementType": "geometry.fill",
		"stylers": [{
			"color": "#000000"
		}, {
			"lightness": 3
		}]
	}, {
		"featureType": "administrative",
		"elementType": "geometry.stroke",
		"stylers": [{
			"color": "#000000"
		}, {
			"lightness": 0
		}, {
			"weight": 1.2
		}]
	}, {
		"featureType": "landscape",
		"elementType": "all",
		"stylers": [{
			"visibility": "on"
		}]
	}, {
		"featureType": "landscape",
		"elementType": "geometry",
		"stylers": [{
			"color": "#000000"
		}, {
			"lightness": 3
		}]
	}, {
		"featureType": "landscape",
		"elementType": "labels.icon",
		"stylers": [{
			"saturation": "-100"
		}, {
			"lightness": "-54"
		}]
	}, {
		"featureType": "poi",
		"elementType": "all",
		"stylers": [{
			"visibility": "on"
		}, {
			"lightness": "0"
		}]
	}, {
		"featureType": "poi",
		"elementType": "geometry",
		"stylers": [{
			"color": "#000000"
		}, {
			"lightness": 4
		}]
	}, {
		"featureType": "poi",
		"elementType": "labels.icon",
		"stylers": [{
			"saturation": "-89"
		}, {
			"lightness": "-55"
		}]
	}, {
		"featureType": "road",
		"elementType": "labels.icon",
		"stylers": [{
			"visibility": "off"
		}]
	}, {
		"featureType": "road.highway",
		"elementType": "geometry.fill",
		"stylers": [{
			"color": "#000000"
		}, {
			"lightness": 17
		}]
	}, {
		"featureType": "road.highway",
		"elementType": "geometry.stroke",
		"stylers": [{
			"color": "#000000"
		}, {
			"lightness": 29
		}, {
			"weight": 0.2
		}]
	}, {
		"featureType": "road.arterial",
		"elementType": "geometry",
		"stylers": [{
			"color": "#000000"
		}, {
			"lightness": 18
		}]
	}, {
		"featureType": "road.local",
		"elementType": "geometry",
		"stylers": [{
			"color": "#000000"
		}, {
			"lightness": 16
		}]
	}, {
		"featureType": "transit",
		"elementType": "geometry",
		"stylers": [{
			"color": "#000000"
		}, {
			"lightness": 19
		}]
	}, {
		"featureType": "transit.station",
		"elementType": "labels.icon",
		"stylers": [{
			"visibility": "on"
		}, {
			"saturation": "-100"
		}, {
			"lightness": "-51"
		}]
	}, {
		"featureType": "water",
		"elementType": "geometry",
		"stylers": [{
			"color": "#000000"
		}, {
			"lightness": 17
		}]
	}]
};