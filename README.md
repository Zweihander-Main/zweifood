# ZweiFood

### Instructions:

1. Run `npm install` in the main directory (package.json should be accurate)
    - Special Notes:
    - Ngrok is using version 0.1.99 as that is the last version that still works consistently with the free tier
    - Gulp should probably be installed globally
    - If there are problems with PSI (page speed insights), globally installing that will probably help too
    - node_modules may require up to 300MB of free space
    - Source/Dev: app folder, Production: dist folder
    - You can load the app from the filesystem however you won't be able to use web workers and as such, performance won't be as good
2. Run one of the following `gulp` commands:
    - `gulp` or `gulp default`: creates production folder and nothing more
    - `gulp serve`: used for development, starts BrowserSync https server on development folder and watches for changes (will rerun tasks on certain files as they change)
    - `gulp serve:dist`: creates production folder, starts BrowserSync http server (for ngrok), does not watch for changes
          <!-- -  `gulp psi`: creates production folder, starts BrowserSync http server, starts ngrok on production files, sends files to Page Speed Insights to return scores and exits -->
          <!-- -  `gulp psi:no-kill`: same as above, doesn't exit at the end -->

### Current Todos:

-   Switch to browserify, kill vendor folder and switch to proper imports if possible
    -   Research for custom modules

### Development notes:

###### /js/app.js

-   Anonymous function which contains the viewModel, location model, bindingHandlers, preloaders, and Google success/fail functions.
-   Exposes `googleLoaded()` and `googleFailedToLoad()` functions to the script which fetches the Google Maps API.
-   Exposes `preloadFontsAndImages()` to `index.html` which is called once the Maps API starts loading.
-   File attempts to be API agnostic (outside of Google which is used as the base location populater). Individual API information for Yelp, Locu, and Foursquare attempts to be located in `config.js` as best as it can. This makes adding new APIs and getting consistent behaviour easier.
-   `preloadFontsAndImages()` calls `waitUntilEverythingLoaded()` which then calls `createMap()` and lifts the loading screen once all images, fonts, and the Maps API are loaded
-   `createMap()` creates the map and the viewModel and calls on the viewModel to start populating with nearby and radar Google searches
-   As the user pans and zooms the map, radar and nearby searches are used to populate it
-   The marker list is populated based on the markers within the current bounds of the map and which aren't filtered
-   You can open up the settings menu to get the current browser location or type in a new location to fly to
-   After the maximum amount of markers (which is user-configurable) is reached, markers are removed from the map in the order they were recieved
-   When a marker is clicked directly or through the marker list, it injects a small bit of HTML into the infoWindow which then has applyBindings called on it. This small bit of HTML then uses the custom `infoWindowTemplate` binding handler to replace the initial HTML with the infoWindow template (located at the end of `index.html`)
-   InfoWindows call the Places API for info, then call all the configured API's for that location. When a configured non-Google API send back its information, the location is matched using the name of the location (using `FuzzySet.js`).
-   The other locations recieved back from the API which are still within a certain circumference of the initial location are then sent to the web worker `workerFillMarkerData.js` to be matched in a seperate thread for performance reasons. If web workers aren't available, the extra data goes to waste and performance won't be quite as smooth (though probably not noticeable).
-   When a tab in an infoWindow is clicked, it will likely call the relevant detailed API data (based on an ID rather than a location) from the pertinent API.
-   Both knockout.js mapping plugins were attempted but fell short and became too verbose compared to building a custom mapping system using the config object.

###### /js/config.js

-   Defines a few developer presets for easy access as well as the non-Google APIs (and even the mapping of the Google API).
-   Mappings take a server name and map it to the local observable name.
-   API-specific data for calling both location based and ID based API endpoints for non-Google APIs are defined here. See `callAPIInfo()` in `app.js` for more info about how this works.

###### /js/workerFillMarkerData.js

-   Worker object takes data from the main thread including locations and name, then matches results from API to see if there are any matches. If so, the worker sends back the matching data for the main thread to update the models.
-   A new worker is created for every call to every API and then kills itself when its job is done.

###### /index.html

-   InfoWindow and InfoWindow Menu templates are at the bottom.
-   CSS files are inlined and JS files are combined for production using Gulp.
-   There are actually two navs: one for mobile and one for large screens which collapses into a button for mobile.

###### /css/style.css

-   CSS for slidebars JS plugin is included at the bottom. User-defined CSS is everything above it.
-   Breakpoints are `1440px`, `1199px`, `991px`, `768px`, `500px`.

### Other Notes:

-   Locu API has a tendency to timeout at midnight EST/9PM PST.
-   Since non-Google APIs use JSONP, they're all set to timeout if something goes wrong (in addition to calling an error if the results are not able to be interpreted).
-   As mentioned before, KO mapping plugins were attempted but they become way too verbose and didn't quite do everything optimally. For APIs from other sources, building a makeshift mapping system made more sense.
-   Memory usage may get quite high as garbage collector tends not to remove disposed of locations when interacting with the app immediately. On average though, it shouldn't exceed ~350-450MB with heavy usage.
-   API calls are defined in config object to make it easy to add new ones as well as get consistent behaviour.
-   OAuth is used for Yelp API entirely client side
-   If Google Maps API doesn't load, user is informed as it's essential for populating base marker data. If non-Google APIs have issues, user is usually informed but app should continue working without a problem.
