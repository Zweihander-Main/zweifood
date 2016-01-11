# FEND P5


### Instructions:

1. Run ```npm install``` in the main directory (package.json should be accurate)
   * Special Notes:
   * Ngrok is using version 0.1.99 as that is the last version that still works consistently with the free tier
   * Gulp should probably be installed globally
   * If there are problems with PSI (page speed insights), globally installing that will probably help too
   * node_modules may require up to 300MB of free space
   * Source/Dev: app folder, Production: dist folder
   * You can load the app from the filesystem however you won't be able to use web workers and as such, performance won't be as good
2. Run one of the following ```gulp``` commands:
   * ```gulp``` or ```gulp default```: creates production folder and nothing more
   * ```gulp serve```: used for development, starts BrowserSync https server on development folder and watches for changes (will rerun tasks on certain files as they change)
   * ```gulp serve:dist```: creates production folder, starts BrowserSync http server (for ngrok), does not watch for changes
   * ```gulp psi```: creates production folder, starts BrowserSync http server, starts ngrok on production files, sends files to Page Speed Insights to return scores and exits
   * ```gulp psi:no-kill```: same as above, doesn't exit at the end

### Changes since previous submission:
* InfoWindows now move around marker list when there's space
* InfoWindows continue to check they're in view until user drags map
* Marker list closes on smaller UI when a location is selected
* Search Filter stays open when value is entered
* Clear filters button added on mobile UI
* Various Small UI improvements

###### Previous
* InfoWindow now ensures that it is within view on click, even when the content changes
* InfoWindow avoids getting convered by the marker list on larger monitors
* Dropdown for various API sources of location website information now links the websites
* Mobile infoWindow is now signifncalty more viewable and also ensures it is in frame on click
* Different default zoom option for mobile devices is enabled - note that if you've opened the site before, it saved your previous zoom level
* More user-meaningful errors from Google
* ZERO_RESULTS error now auto-hides when markers are in view again
* 'Use strict' enabeld on app.js
* For loops changed to declaring length once
* Minor unused variable cleanup
* Replaced user-defined ID's from CSS with classes (does not count CSS needed for JS plugins)


### Files of interest:

###### /js/app.js
* Anonymous function which contains the viewModel, location model, bindingHandlers, preloaders, and Google success/fail functions.
* Exposes ```googleLoaded()``` and ```googleFailedToLoad()``` functions to the script which fetches the Google Maps API.
* Exposes ```preloadFontsAndImages()``` to ```index.html``` which is called once the Maps API starts loading.
* File attempts to be API agnostic (outside of Google which is used as the base location populater). Individual API information for Yelp, Locu, and Foursquare attempts to be located in ```config.js``` as best as it can. This makes adding new APIs and getting consistent behaviour easier.
* ```preloadFontsAndImages()``` calls ```waitUntilEverythingLoaded()``` which then calls ```createMap()``` and lifts the loading screen once all images, fonts, and the Maps API are loaded
* ```createMap()``` creates the map and the viewModel and calls on the viewModel to start populating with nearby and radar Google searches
* As the user pans and zooms the map, radar and nearby searches are used to populate it
* The marker list is populated based on the markers within the current bounds of the map and which aren't filtered
* You can open up the settings menu to get the current browser location or type in a new location to fly to
* After the maximum amount of markers (which is user-configurable) is reached, markers are removed from the map in the order they were recieved
* When a marker is clicked directly or through the marker list, it injects a small bit of HTML into the infoWindow which then has applyBindings called on it. This small bit of HTML then uses the custom ```infoWindowTemplate``` binding handler to replace the initial HTML with the infoWindow template (located at the end of ```index.html```)
* InfoWindows call the Places API for info, then call all the configured API's for that location. When a configured non-Google API send back its information, the location is matched using the name of the location (using ```FuzzySet.js```).
* The other locations recieved back from the API which are still within a certain circumference of the initial location are then sent to the web worker ```workerFillMarkerData.js``` to be matched in a seperate thread for performance reasons. If web workers aren't available, the extra data goes to waste and performance won't be quite as smooth (though probably not noticeable).
* When a tab in an infoWindow is clicked, it will likely call the relevant detailed API data (based on an ID rather than a location) from the pertinent API.
* Both knockout.js mapping plugins were attempted but fell short and became too verbose compared to building a custom mapping system using the config object.

###### /js/config.js
* Defines a few developer presets for easy access as well as the non-Google APIs (and even the mapping of the Google API).
* Mappings take a server name and map it to the local observable name.
* API-specific data for calling both location based and ID based API endpoints for non-Google APIs are defined here. See ```callAPIInfo()``` in ```app.js``` for more info about how this works.

###### /js/workerFillMarkerData.js
* Worker object takes data from the main thread including locations and name, then matches results from API to see if there are any matches. If so, the worker sends back the matching data for the main thread to update the models.
* A new worker is created for every call to every API and then kills itself when its job is done.

###### /index.html
* InfoWindow and InfoWindow Menu templates are at the bottom.
* CSS files are inlined and JS files are combined for production using Gulp.
* There are actually two navs: one for mobile and one for large screens which collapses into a button for mobile.

###### /css/style.css
* CSS for slidebars JS plugin is included at the bottom. User-defined CSS is everything above it.
* Breakpoints are ```1440px```, ```1199px```, ```991px```, ```768px```, ```500px```.

### Other Notes:
* Locu API has a tendency to timeout at midnight EST/9PM PST.
* Since non-Google APIs use JSONP, they're all set to timeout if something goes wrong (in addition to calling an error if the results are not able to be interpreted).
* As mentioned before, KO mapping plugins were attempted but they become way too verbose and didn't quite do everything optimally. For APIs from other sources, building a makeshift mapping system made more sense.
* Memory usage may get quite high as garbage collector tends not to remove disposed of locations when interacting with the app immediately. On average though, it shouldn't exceed  ~350-450MB with heavy usage.
* API calls are defined in config object to make it easy to add new ones as well as get consistent behaviour.
* OAuth is used for Yelp API entirely client side as recommended by https://discussions.udacity.com/t/yelp-api-oauth-issue/40606/4
* If Google Maps API doesn't load, user is informed as it's essential for populating base marker data. If non-Google APIs have issues, user is usually informed but app should continue working without a problem.

### Credits

###### StackOverflow:

https://stackoverflow.com/questions/23091732/embed-custom-fullscreen-google-map-into-webpage getting fullscren map working

https://stackoverflow.com/questions/12722925/google-maps-and-knockoutjs some samples for knockout intergration

https://stackoverflow.com/questions/3384504/location-of-parenthesis-for-auto-executing-anonymous-javascript-functions Help with anonymous functions

https://stackoverflow.com/questions/9624401/when-to-use-ko-utils-unwrapobservable unwrapObservable help

https://stackoverflow.com/questions/26380538/how-can-i-expose-local-variables-defined-in-anonymous-function-to-the-global-spa more anonymous function stuff

https://stackoverflow.com/questions/19019577/knockout-observable-viewmodel-that-can-be-accessed-by-other-viewmodels viewModels interacting with each other

https://stackoverflow.com/questions/14667010/limit-how-many-times-an-event-listener-can-trigger-every-second throttle help

https://stackoverflow.com/questions/6100514/google-maps-v3-check-if-marker-is-present-on-map how to check if marker is on map in Google API

https://stackoverflow.com/questions/8869264/knockout-js-foreach-but-only-when-comparison-is-true foreach data-bind help

https://stackoverflow.com/questions/20353397/knockoutjs-observe-nested-object-and-subscribe-for-changes nested objects inspiration and help

https://stackoverflow.com/questions/6190482/google-maps-api-v3-update-marker updating markers in Maps API

https://stackoverflow.com/questions/11298816/how-to-create-a-computed-observable-array-in-knockout how to create computed observable array

https://stackoverflow.com/questions/2832636/google-maps-api-v3-getbounds-is-undefined dealing with Maps getBounds

https://stackoverflow.com/questions/6794405/trigger-google-maps-marker-click manually triggering marker click

https://stackoverflow.com/questions/15946303/google-map-v3-center-a-infowindow-when-opened help with centering infoWindow

https://stackoverflow.com/questions/2488999/google-maps-how-to-prevent-infowindow-from-shifting-the-map inspiration for dealing with opening infoWindows

https://stackoverflow.com/questions/487073/check-if-element-is-visible-after-scrolling inspiration for scrolling into view

https://stackoverflow.com/questions/17505107/calling-back-jquery-function-after-knockout-dom-manipulation applyBindings help

https://stackoverflow.com/questions/19870134/how-can-i-make-selected-item-in-listbox-scroll-to-the-top more scrolling into view help

https://stackoverflow.com/questions/6777721/google-maps-api-v3-infowindow-close-event-callback marker event listeners help

https://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport/7557433#7557433 more scrolling into view help

https://stackoverflow.com/questions/2223574/google-maps-auto-close-open-infowindows auto closing infoWindows

https://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport more scrolling into view help

https://stackoverflow.com/questions/10854179/how-to-make-window-size-observable-using-knockout more scrolling into view inspiration

https://stackoverflow.com/questions/15317796/knockout-loses-bindings-when-google-maps-api-v3-info-window-is-closed more infoWindow applyBindings help

https://stackoverflow.com/questions/31970927/binding-knockoutjs-to-google-maps-infowindow-content more infoWindow applyBindings help

https://stackoverflow.com/questions/5416160/listening-for-the-domready-event-for-google-maps-infowindow-class more Maps event listener help

https://stackoverflow.com/questions/9333914/get-content-inside-script-as-text infoWindow conversation help

https://stackoverflow.com/questions/4057665/google-maps-api-v3-find-nearest-markers dealing with distance in Maps help

https://stackoverflow.com/questions/11909934/how-to-pass-functions-to-javascript-web-worker web workers inspiration

https://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible using prototype help

https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula more distance help

https://stackoverflow.com/questions/11387501/knockoutjs-binding-when-source-is-null-undefined help cleaning up data-binds

https://stackoverflow.com/questions/3680429/click-through-a-div-to-underlying-elements pointer-events help

https://stackoverflow.com/questions/20740212/knockoutjs-scrollintoviewtrigger more scrolling into view help

https://stackoverflow.com/questions/12410062/check-if-infowindow-is-opened-google-maps-v3 checking if infoWindow is open

https://stackoverflow.com/questions/9226792/knockoutjs-bind-mouseover-or-jquery bindingHandler help

https://stackoverflow.com/questions/9445842/does-scrollintoview-work-in-all-browsers more scrolling into view help

https://stackoverflow.com/questions/22052674/google-places-api-city-or-zipcode getting settings find location autocomplete working

https://stackoverflow.com/questions/12227594/which-is-better-numberx-or-parsefloatx help with parsing numbers

https://stackoverflow.com/questions/7704268/formatting-rules-for-numbers-in-knockoutjs more numbers help

https://stackoverflow.com/questions/2283566/tofixed-returns-a-string-in-javascript more numbers help

https://stackoverflow.com/questions/3337849/difference-between-tofixed-and-toprecision more numbers help

https://stackoverflow.com/questions/5634991/styling-google-maps-infowindow styling infoWindow inspiration

https://stackoverflow.com/questions/4130237/displaying-crosshairs-in-the-center-of-a-javascript-google-map center reticle help

https://stackoverflow.com/questions/14364079/bootstrap-tooltip-causing-buttons-to-jump bootstrap tooltip bug

https://stackoverflow.com/questions/7617373/limit-results-in-jquery-ui-autocomplete help with jQuery UI autocomplete

https://stackoverflow.com/questions/16156594/how-to-change-border-color-of-textarea-on-focus changing border color of input on :focus

https://stackoverflow.com/questions/7916555/custom-google-map-api-v3-zoom-buttons maps UI help

https://stackoverflow.com/questions/4728607/change-jquery-ui-autocomplete-position-pop-up-instead-of-down more help with jQuery UI autocomplete

https://stackoverflow.com/questions/14715724/how-to-use-custom-binding-with-ko-observablearray custom bindings help

https://stackoverflow.com/questions/13252505/knockout-rendertemplate-rendering-modes infoWindow template help

https://stackoverflow.com/questions/19035557/jsonp-request-error-handling JSONP error handling help

https://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript toProperCase function

https://stackoverflow.com/questions/3920892/how-to-detect-if-a-web-page-is-running-from-a-website-or-local-file-system detecting local filesystem help

https://stackoverflow.com/questions/2631001/javascript-test-for-existence-of-nested-object-key checkNested function

https://stackoverflow.com/questions/1316371/converting-a-javascript-array-to-a-function-arguments-list help with implementing checkNested

https://stackoverflow.com/questions/901677/the-definitive-best-way-to-preload-images-using-javascript-jquery image preloading help

https://stackoverflow.com/questions/15875128/how-to-tell-when-a-dynamically-created-element-has-rendered Help with event queue bug

https://stackoverflow.com/questions/3473367/how-to-offset-the-center-of-a-google-maps-api-v3-in-pixels Function used to offset google maps for recentering

https://stackoverflow.com/questions/16429004/auto-pan-map-to-fit-infowindow-after-loading-with-content-from-ajax Help with auto-panning

https://stackoverflow.com/questions/172821/detecting-when-a-divs-height-changes-using-jquery Listening for height change help

https://stackoverflow.com/questions/6458840/on-input-change-event Input/change event help


###### Udacity:

https://discussions.udacity.com/t/yelp-api-oauth-issue/40606/3 oAuth help

https://discussions.udacity.com/t/handling-google-maps-in-async-and-fallback/34282 google Maps async help

https://discussions.udacity.com/t/how-i-completed-my-p5/13652 general project help

###### Knockmeout

http://www.knockmeout.net/2011/03/reacting-to-changes-in-knockoutjs.html observables help

http://www.knockmeout.net/2011/04/utility-functions-in-knockoutjs.html utility functions listing

http://www.knockmeout.net/2011/08/simplifying-and-cleaning-up-views-in.html data-binds help

http://www.knockmeout.net/2014/10/knockout-cleaning-up.html memory management help

http://www.knockmeout.net/2013/06/knockout-debugging-strategies-plugin.html troubleshooting data-binds help


###### Etc.

http://www.codeproject.com/Articles/387626/BikeInCity-2-KnockoutJS-JQuery-Google-Maps Maps integration inspiration

https://snazzymaps.com/style/6654/dark maps style adapted from this style

https://www.airpair.com/knockout/posts/top-10-mistakes-knockoutjs general knockout help

http://www.barbarianmeetscoding.com/blog/2013/06/01/barbarian-meets-knockout-knockout-dot-js-observables/ observable help

http://opensoul.org/2011/06/23/live-search-with-knockoutjs/ search inspiration

http://www.codeproject.com/Articles/351298/KnockoutJS-and-Google-Maps-binding More maps integration inspiration

http://techcrawler.riedme.de/2012/09/14/google-maps-infowindow-with-knockout/ More maps integration inspiration

https://www.packtpub.com/books/content/using-google-maps-apis-knockoutjs More maps integration inspiration

http://javascriptissexy.com/understand-javascript-callback-functions-and-use-them/ Callbacks help

http://code.tutsplus.com/tutorials/getting-started-with-web-workers--net-27667 Web workers help

http://www.html5rocks.com/en/tutorials/workers/basics/ Web workers help

http://blog.scottlogic.com/2014/02/28/developing-large-scale-knockoutjs-applications.html General knockout help

https://jsperf.com/new-array-vs-splice-vs-slice/113 Comparing arrays

http://underscorejs.org/docs/underscore.html Underscore.js - throttling functions help

http://plugins.adchsm.me/slidebars/usage.php Slidebars plugin

https://gist.github.com/chadedrupt/5974524 Google address autocomplete binding handler help

http://iconmonstr.com/ Useful icons

https://css-tricks.com/equidistant-objects-with-css/ Flexbox help

http://matthewlein.com/ceaser/ Animation generator

http://www.strathweb.com/2012/08/knockout-js-pro-tips-working-with-templates/ Knockout templates help

http://simbyone.com/30-css-page-preload-animations/ Loading screen code/inspiration/help

https://www.reddit.com/r/javascript/comments/2fenau/crockfords_new_way_to_create_object_constructors/?utm_medium=email&utm_source=javascriptweekly - Function patterns help