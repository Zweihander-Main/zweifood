# FEND P4


### Instructions:

1. Run ```npm install``` in the main directory (package.json should be accurate)
   * Special Notes:
   * Ngrok is using version 0.1.99 as that is the last version that still works consistently with the free tier
   * Gulp should probably be installed globally
   * If there are problems with PSI (page speed insights), globally installing that will probably help too
   * node_modules may require up to 300MB of free space
   * Source/Dev: app folder, Production: dist folder
2. Run one of the following ```gulp``` commands:
   * ```gulp``` or ```gulp default```: creates production folder and nothing more
   * ```gulp serve```: used for development, starts BrowserSync https server on development folder and watches for changes (will rerun tasks on certain files as they change)
   * ```gulp serve:dist```: creates production folder, starts BrowserSync http server (for ngrok), does not watch for changes
   * ```gulp psi```: creates production folder, starts BrowserSync http server, starts ngrok on production files, sends files to Page Speed Insights to return scores and exits
   * ```gulp psi:no-kill```: same as above, doesn't exit at the end

### PageSpeed Optimizations

###### Indexhtml/Style.css

* Saved the 3 external images locally at the required resolution and changed the html to reference the local copies
* Saved the pizzeria.jpg file locally with a much smaller copy to avoid loading unnecessary resolution
* Moved the external google font definitions and inlined them into style.css
* Added media queries to style.css and print.css
* Took out external GAnalytics file and replaced it with Google recommended way (which is async)
* Note: File can be loaded locally for final point on both desktop and mobile pagespeed score but needs to be refreshed every few months
* style.css is inlined with the build system

###### Gulp Build System

* Implemented build system with Gulp
* Based on http://una.im/gulp-local-psi/ and https://github.com/google/web-starter-kit/blob/master/gulpfile.babel.js
* Can setup ngrok tunnel to production files and test PSI all through Gulp
* Ngrok is using an older version in package.json due to problems with the most recent version and their free tier
* Runs JSHint on and minifies all javascript files
* Optimizes all images using imagemin
* Creates production directory from developer directory
* Autoprefixes and minifies stylesheets
* Minifies and optimizes HTML files
* Inlines style.css on index.html
* Loads browsersync from either development or production folder

### Mainjs/Pizza.html

#### ResizePizzas

* Changed ```querySelector``` to ```getElementById``` in ```changeSliderLabel``` function
* Removed ```determineDx``` and ```sizeSwitcher``` functions and retained functionalitty in ```changePizzaSizes``` function
* Changed ```querySelectorAll``` to ```getElementsByClassName```
* Combined all calls for ```randomPizzaContainer``` classes to one line and saved as variable to iterate on
* Removed a lot of the ```determineDx``` functionality and replaced it with calculating widths based on pre-determined percentages (rather than pixel widths)
* When appending the pizzas to the document, took the ```getElementById('randomPizzas')``` call and put it outside the for loop

#### Background Pizzas

###### LoadPizzas()/DOMContentLoaded Function

* Function now calculates viewporth width and height to determine how many pizzas should be on the screen rather than adding in more than are needed
* Image has been switched out to one that is the correct size (100x77) rather than having the browser resize each image
* ```elem.style.height/width``` have changed to ```elem.height/width``` for small performance boost
* All mover elements are stored in an array ```moverItemsArray``` for easy reference/not having to call up the DOM every time scrolling happens.
* The phase of the sin curve each mover is in is one of 5 positions that is now stored along with the mover in the  ```moverItemsArray``` - this makes for faster ```updatePositions``` calculations
* The starting position of the mover is now calculated since it will be transformed in the ```updatePositions``` calculations
* ```#movingPizzas1``` is now stored as a variable so as to not be looked up for every mover


###### UpdatePositions()

* The scroll position (divided by 1250) is now only calculated once instead of with each loop iteration
* No DOM calls necessary as ```moverItemsArray``` already has all the movers stored
* Each mover is now transformed with a ```translateX``` from its starting position
* Calculation is faster as phase of the sin curve is stored alongside the mover item

###### Event Listeners

* Scroll and resize event listeners now call ```requestAnimationFrame``` and are throttled to only call one frame at a time
* Resize reloads the movers if the window is resized larger than the original load to add more pizzas as necessary
* Resize is not called if the window is smaller than the original load to minimize the expensive mover loading operation

###### CSS

* ```.mover``` now has ```will-change:transform``` and  ```transform: translateZ(0)``` hack to put each mover on to their own layer

###### Other

* WebGL and Canvas were attempted to get more performance improvements (both through threejs)
* Implementation was from http://www.html5rocks.com/en/tutorials/speed/parallax/
* Average frame performance did not improve so transform approach was chosen as the final implementation
* Results of 1000 frames average testing:


| Method    |       Fast Scrolling |       Slow Scrolling |
|-----------|---------------------:|---------------------:|
| transform | 0.3081700000000176ms | 0.2626799999999576ms |
| canvas    | 1.0615249999999596ms | 1.0295050000000052ms |
| webgl     | 0.6767049999999817ms | 0.5886050000000846ms |


### Credits

http://www.html5rocks.com/en/tutorials/speed/parallax/ for ideas on optimization techniques

https://stackoverflow.com/questions/22287400/how-can-i-get-rid-of-invalid-value-warning-when-loading-a-three-js-texture for threejs help

http://www.howtocreate.co.uk/tutorials/javascript/browserwindow for backwards compatibility help

https://stackoverflow.com/questions/7435843/window-top-document-body-scrolltop-not-working-in-chrome-or-firefox for scrollTop help

https://developers.google.com/web/updates/2013/02/Profiling-Long-Paint-Times-with-DevTools-Continuous-Painting-Mode?hl=en for profiling help

https://github.com/operasoftware/devopera/pull/330 for will-change explanations

http://www.html5rocks.com/en/tutorials/speed/scrolling/ for scrolling performance help

http://gent.ilcore.com/2011/03/how-not-to-trigger-layout-in-webkit.html for general performance tips

https://developer.mozilla.org/en-US/docs/Web/Events/scroll for throttle code

https://stackoverflow.com/questions/26827560/gulp-doesnt-work for gulp debugging

https://github.com/gulpjs/gulp/issues/679 for gulp file naming help

https://www.codefellows.org/blog/quick-intro-to-gulp-js for general gulp intro/help








