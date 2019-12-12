# ZweiFood

> Front end web application which coalesces data from multiple sources in the pursuit of finding somewhere decent to eat. [Live demo.](https://food.zweihander.me/)

![Screenshot of ZweiFood](./docs/ZweiFood.png)

### Introduction

What happens when you need to find the Best™ possible restaurant for tonight's dinner? You make a web application of course!

ZweiFood is power search tool for finding nearby restaurants and pulling data about them from several sources (Google, Yelp, Locu, Foursquare) to allow an end user to make the best possible decision about where to grab a bite.

It's a front-end application that can be run entirely client-side with user-supplied keys or alternately can proxy requests through a serverless backend (in this case, a Netlify function) which will add operator supplied keys to all requests.

### Live demo:

Demo instance available [here](https://food.zweihander.me/).

Note that heavy usage will likely run up against the free tier API limits. In that case, you can input your own API keys in the settings menu which will move all the calls entirely client side (note that no keys are ever saved outside of your browser).

### Technology used:

##### 12.2019 changes/additions:

-   TypeScript + ES2019
-   Parcel-bundler
-   DotEnv
-   Netlify Functions
-   Prettier
-   Jest
-   Puppeteer

##### Originally (2015)

-   ~~ES5~~
-   Knockout.JS
-   ~~Gulp~~
-   CSS3
-   HTML5
-   ESLint
-   stylelint

### Instructions:

1. Run `npm install` in the main directory (package.json should be accurate)
    - Special Notes:
    - Source/Dev: src folder, Production: build folder
    - You can load the app from the filesystem however you won't be able to use web workers and as such, performance will be impacted
2. Run one of the commands from the [Scripts](#scripts) section. You'll most likely want `npm run devAll` for development and `npm run build` for production.

### Environment Variables

-   `YELP_API_KEY` API key for Yelp (sent as a header)
-   `LOCU_API_KEY` API key for Locu (sent as a parameter)
-   `FOURSQUARE_CLIENT_ID` Client ID for Foursquare (sent as a parameter)
-   `FOURSQUARE_CLIENT_SECRET` Client Secret for Foursquare (sent as a parameter)
-   `CORS` CORS settings for Netlify functions
-   `YELP_URL` URL for Yelp calls
-   `LOCU_URL` URL for Locu calls
-   `FOURSQUARE_URL` URL for Foursquare calls
-   `LOCAL_API_FORWARDER` Alternative location to call Netlify functions

### Scripts

-   `npm run devAll`: Run both `parcel serve` and `netlify dev` -- creates front and back end
-   `npm run dev`: Run `parcel serve` without a backend/Netlify functions server (can use a separate server using `LOCAL_API_FORWARDER` environment variable)
-   `npm run build`: Build application for production
-   `npm run buildServe`: Serve production files
-   `npm run preBuild`: Called automatically for production builds in Netlify pipeline (pulls in node_modules for Netlify functions)
-   `npm run test`: Calls jest for testing

### Current Todos:

-   Build out Jest testing
    -   Google Maps API may break application since it's running on the latest branch
    -   Should add in Snapshot testing where appropriate in addition to building out Puppeteer
-   Break out more generic object and inline object typings into interfaces
-   Reduce dependence on libraries
    -   Slidebars upgrade or removal
    -   Scrollintoview switch out
-   Fix Yelp branding issues with links back
-   Add in third Yelp search type -- pull review and photo info
-   Change location matching method for Yelp
-   Tidy up settings slider
-   Make data population more agnostic between Google and non-Google services
-   Pull more data from Foursquare
-   Preload web worker?
-   Replace perfect-scrollbar with native methods (browsers now more capable)
-   Move more image shape reticle info into config
-   Debug edge cases in matching -- improve general matching method
-   Better errors
    -   Break out into its own Class?
    -   More information where applicable
    -   Serverless call proxying has particularly nondescript errors and poor handling
-   Ability to select server or client if API key specified
-   Locu API v1 deprecated -- upgrade
-   Reduce stored data from Locu/Foursquare/ect.
-   Make adding search types more consistent and easier
-   Rethink static vs non-static methods in ViewModel class
-   Better systems for selecting particular data from API objects
-   Change InfoWindow rendering to more Google recommended approach
-   Improve CI workflow

### Development notes:

###### /js/app.ts

-   Anonymous function which contains the viewModel, location model, bindingHandlers, preloaders, and Google success/fail functions.
-   Exposes `googleLoaded()` and `googleFailedToLoad()` functions to the script which fetches the Google Maps API.
-   Exposes `preloadFontsAndImages()` to `index.html` which is called once the Maps API starts loading.
-   File attempts to be API agnostic (outside of Google which is used as the base location populater). Individual API information for Yelp, Locu, and Foursquare attempts to be located in `config.ts` as best as it can. This makes adding new APIs and getting consistent behavior easier.
-   `preloadFontsAndImages()` calls `waitUntilEverythingLoaded()` which then calls `createMap()` and lifts the loading screen once all images, fonts, and the Maps API are loaded
-   `createMap()` creates the map and the viewModel and calls on the viewModel to start populating with nearby and radar Google searches
-   As the user pans and zooms the map, radar and nearby searches are used to populate it
-   The marker list is populated based on the markers within the current bounds of the map and which aren't filtered
-   You can open up the settings menu to get the current browser location or type in a new location to fly to
-   After the maximum amount of markers (which is user-configurable) is reached, markers are removed from the map in the order they were received
-   When a marker is clicked directly or through the marker list, it injects a small bit of HTML into the infoWindow which then has applyBindings called on it. This small bit of HTML then uses the custom `infoWindowTemplate` binding handler to replace the initial HTML with the infoWindow template (located at the end of `index.html`)
-   InfoWindows call the Places API for info, then call all the configured API's for that location. When a configured non-Google API send back its information, the location is matched using the name of the location (using `FuzzySet.ts`).
-   The other locations received back from the API which are still within a certain circumference of the initial location are then sent to the web worker `workerFillMarkerData.ts` to be matched in a separate thread for performance reasons. If web workers aren't available, the extra data goes to waste and performance won't be quite as smooth (though probably not noticeable).
-   When a tab in an infoWindow is clicked, it will likely call the relevant detailed API data (based on an ID rather than a location) from the pertinent API.
-   Both knockout.js mapping plugins were attempted but fell short and became too verbose compared to building a custom mapping system using the config object.

###### /js/config.ts

-   Defines a few developer presets for easy access as well as the non-Google APIs (and even the mapping of the Google API).
-   Mappings take a server name and map it to the local observable name.
-   API-specific data for calling both location based and ID based API endpoints for non-Google APIs are defined here. See `callAPIInfo()` in `app.ts` for more info about how this works.

###### /js/workerFillMarkerData.ts

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
-   API calls are defined in config object to make it easy to add new ones as well as get consistent behavior.
-   OAuth is used for Yelp API entirely client side
-   If Google Maps API doesn't load, user is informed as it's essential for populating base marker data. If non-Google APIs have issues, user is usually informed but app should continue working without a problem.

## Available for Hire

I'm available for freelance, contracts, and consulting both remotely and in the Hudson Valley, NY (USA) area. [Some more about me](https://www.zweisolutions.com/about.html) and [what I can do for you](https://www.zweisolutions.com/services.html).

Feel free to drop me a message at:

```
hi [a+] zweisolutions {●} com
```

## License

[MIT](./LICENSE)
