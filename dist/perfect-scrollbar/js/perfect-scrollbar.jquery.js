!function i(l,s,a){function c(n,t){if(!s[n]){if(!l[n]){var e="function"==typeof require&&require;if(!t&&e)return e(n,!0);if(u)return u(n,!0);var r=new Error("Cannot find module '"+n+"'");throw r.code="MODULE_NOT_FOUND",r}var o=s[n]={exports:{}};l[n][0].call(o.exports,function(t){var e=l[n][1][t];return c(e||t)},o,o.exports,i,l,s,a)}return s[n].exports}for(var u="function"==typeof require&&require,t=0;t<a.length;t++)c(a[t]);return c}({1:[function(t,e,n){"use strict";var o=t("../main"),i=t("../plugin/instances");function r(r){r.fn.perfectScrollbar=function(n){return this.each(function(){if("object"==typeof n||void 0===n){var t=n;i.get(this)||o.initialize(this,t)}else{var e=n;"update"===e?o.update(this):"destroy"===e&&o.destroy(this)}return r(this)})}}if("function"==typeof define&&define.amd)define(["jquery"],r);else{var l=window.jQuery?window.jQuery:window.$;void 0!==l&&r(l)}e.exports=r},{"../main":7,"../plugin/instances":18}],2:[function(t,e,n){"use strict";n.add=function(t,e){var n,r,o;t.classList?t.classList.add(e):(r=e,(o=(n=t).className.split(" ")).indexOf(r)<0&&o.push(r),n.className=o.join(" "))},n.remove=function(t,e){var n,r,o,i;t.classList?t.classList.remove(e):(r=e,o=(n=t).className.split(" "),0<=(i=o.indexOf(r))&&o.splice(i,1),n.className=o.join(" "))},n.list=function(t){return t.classList?Array.prototype.slice.apply(t.classList):t.className.split(" ")}},{}],3:[function(t,e,n){"use strict";var r={};r.e=function(t,e){var n=document.createElement(t);return n.className=e,n},r.appendTo=function(t,e){return e.appendChild(t),t},r.css=function(t,e,n){return"object"==typeof e?function(t,e){for(var n in e){var r=e[n];"number"==typeof r&&(r=r.toString()+"px"),t.style[n]=r}return t}(t,e):void 0===n?(l=t,s=e,window.getComputedStyle(l)[s]):(r=t,o=e,"number"==typeof(i=n)&&(i=i.toString()+"px"),r.style[o]=i,r);var r,o,i,l,s},r.matches=function(t,e){return void 0!==t.matches?t.matches(e):void 0!==t.matchesSelector?t.matchesSelector(e):void 0!==t.webkitMatchesSelector?t.webkitMatchesSelector(e):void 0!==t.mozMatchesSelector?t.mozMatchesSelector(e):void 0!==t.msMatchesSelector?t.msMatchesSelector(e):void 0},r.remove=function(t){void 0!==t.remove?t.remove():t.parentNode&&t.parentNode.removeChild(t)},r.queryChildren=function(t,e){return Array.prototype.filter.call(t.childNodes,function(t){return r.matches(t,e)})},e.exports=r},{}],4:[function(t,e,n){"use strict";var r=function(t){this.element=t,this.events={}};r.prototype.bind=function(t,e){void 0===this.events[t]&&(this.events[t]=[]),this.events[t].push(e),this.element.addEventListener(t,e,!1)},r.prototype.unbind=function(e,n){var r=void 0!==n;this.events[e]=this.events[e].filter(function(t){return!(!r||t===n)||(this.element.removeEventListener(e,t,!1),!1)},this)},r.prototype.unbindAll=function(){for(var t in this.events)this.unbind(t)};var o=function(){this.eventElements=[]};o.prototype.eventElement=function(e){var t=this.eventElements.filter(function(t){return t.element===e})[0];return void 0===t&&(t=new r(e),this.eventElements.push(t)),t},o.prototype.bind=function(t,e,n){this.eventElement(t).bind(e,n)},o.prototype.unbind=function(t,e,n){this.eventElement(t).unbind(e,n)},o.prototype.unbindAll=function(){for(var t=0;t<this.eventElements.length;t++)this.eventElements[t].unbindAll()},o.prototype.once=function(t,e,n){var r=this.eventElement(t),o=function(t){r.unbind(e,o),n(t)};r.bind(e,o)},e.exports=o},{}],5:[function(t,e,n){"use strict";e.exports=function(){function t(){return Math.floor(65536*(1+Math.random())).toString(16).substring(1)}return function(){return t()+t()+"-"+t()+"-"+t()+"-"+t()+"-"+t()+t()+t()}}()},{}],6:[function(t,e,n){"use strict";var o=t("./class"),r=t("./dom");n.toInt=function(t){return parseInt(t,10)||0},n.clone=function(t){if(null===t)return null;if("object"==typeof t){var e={};for(var n in t)e[n]=this.clone(t[n]);return e}return t},n.extend=function(t,e){var n=this.clone(t);for(var r in e)n[r]=this.clone(e[r]);return n},n.isEditable=function(t){return r.matches(t,"input,[contenteditable]")||r.matches(t,"select,[contenteditable]")||r.matches(t,"textarea,[contenteditable]")||r.matches(t,"button,[contenteditable]")},n.removePsClasses=function(t){for(var e=o.list(t),n=0;n<e.length;n++){var r=e[n];0===r.indexOf("ps-")&&o.remove(t,r)}},n.outerWidth=function(t){return this.toInt(r.css(t,"width"))+this.toInt(r.css(t,"paddingLeft"))+this.toInt(r.css(t,"paddingRight"))+this.toInt(r.css(t,"borderLeftWidth"))+this.toInt(r.css(t,"borderRightWidth"))},n.startScrolling=function(t,e){o.add(t,"ps-in-scrolling"),void 0!==e?o.add(t,"ps-"+e):(o.add(t,"ps-x"),o.add(t,"ps-y"))},n.stopScrolling=function(t,e){o.remove(t,"ps-in-scrolling"),void 0!==e?o.remove(t,"ps-"+e):(o.remove(t,"ps-x"),o.remove(t,"ps-y"))},n.env={isWebKit:"WebkitAppearance"in document.documentElement.style,supportsTouch:"ontouchstart"in window||window.DocumentTouch&&document instanceof window.DocumentTouch,supportsIePointer:null!==window.navigator.msMaxTouchPoints}},{"./class":2,"./dom":3}],7:[function(t,e,n){"use strict";var r=t("./plugin/destroy"),o=t("./plugin/initialize"),i=t("./plugin/update");e.exports={initialize:o,update:i,destroy:r}},{"./plugin/destroy":9,"./plugin/initialize":17,"./plugin/update":21}],8:[function(t,e,n){"use strict";e.exports={maxScrollbarLength:null,minScrollbarLength:null,scrollXMarginOffset:0,scrollYMarginOffset:0,stopPropagationOnClick:!0,suppressScrollX:!1,suppressScrollY:!1,swipePropagation:!0,useBothWheelAxes:!1,useKeyboard:!0,useSelectionScroll:!1,wheelPropagation:!1,wheelSpeed:1}},{}],9:[function(t,e,n){"use strict";var r=t("../lib/dom"),o=t("../lib/helper"),i=t("./instances");e.exports=function(t){var e=i.get(t);e&&(e.event.unbindAll(),r.remove(e.scrollbarX),r.remove(e.scrollbarY),r.remove(e.scrollbarXRail),r.remove(e.scrollbarYRail),o.removePsClasses(t),i.remove(t))}},{"../lib/dom":3,"../lib/helper":6,"./instances":18}],10:[function(t,e,n){"use strict";var l=t("../../lib/helper"),r=t("../instances"),s=t("../update-geometry"),a=t("../update-scroll");e.exports=function(t){!function(r,o){function i(t){return t.getBoundingClientRect()}var t=window.Event.prototype.stopPropagation.bind;o.settings.stopPropagationOnClick&&o.event.bind(o.scrollbarY,"click",t),o.event.bind(o.scrollbarYRail,"click",function(t){var e=l.toInt(o.scrollbarYHeight/2),n=o.railYRatio*(t.pageY-window.pageYOffset-i(o.scrollbarYRail).top-e)/(o.railYRatio*(o.railYHeight-o.scrollbarYHeight));n<0?n=0:1<n&&(n=1),a(r,"top",(o.contentHeight-o.containerHeight)*n),s(r),t.stopPropagation()}),o.settings.stopPropagationOnClick&&o.event.bind(o.scrollbarX,"click",t),o.event.bind(o.scrollbarXRail,"click",function(t){var e=l.toInt(o.scrollbarXWidth/2),n=o.railXRatio*(t.pageX-window.pageXOffset-i(o.scrollbarXRail).left-e)/(o.railXRatio*(o.railXWidth-o.scrollbarXWidth));n<0?n=0:1<n&&(n=1),a(r,"left",(o.contentWidth-o.containerWidth)*n-o.negativeScrollAdjustment),s(r),t.stopPropagation()})}(t,r.get(t))}},{"../../lib/helper":6,"../instances":18,"../update-geometry":19,"../update-scroll":20}],11:[function(t,e,n){"use strict";var s=t("../../lib/dom"),a=t("../../lib/helper"),r=t("../instances"),c=t("../update-geometry"),u=t("../update-scroll");function o(o,i){var l=null,e=null;var n=function(t){!function(t){var e=l+t*i.railXRatio,n=Math.max(0,i.scrollbarXRail.getBoundingClientRect().left)+i.railXRatio*(i.railXWidth-i.scrollbarXWidth);i.scrollbarXLeft=e<0?0:n<e?n:e;var r=a.toInt(i.scrollbarXLeft*(i.contentWidth-i.containerWidth)/(i.containerWidth-i.railXRatio*i.scrollbarXWidth))-i.negativeScrollAdjustment;u(o,"left",r)}(t.pageX-e),c(o),t.stopPropagation(),t.preventDefault()},r=function(){a.stopScrolling(o,"x"),i.event.unbind(i.ownerDocument,"mousemove",n)};i.event.bind(i.scrollbarX,"mousedown",function(t){e=t.pageX,l=a.toInt(s.css(i.scrollbarX,"left"))*i.railXRatio,a.startScrolling(o,"x"),i.event.bind(i.ownerDocument,"mousemove",n),i.event.once(i.ownerDocument,"mouseup",r),t.stopPropagation(),t.preventDefault()})}function i(o,i){var l=null,e=null;var n=function(t){!function(t){var e=l+t*i.railYRatio,n=Math.max(0,i.scrollbarYRail.getBoundingClientRect().top)+i.railYRatio*(i.railYHeight-i.scrollbarYHeight);i.scrollbarYTop=e<0?0:n<e?n:e;var r=a.toInt(i.scrollbarYTop*(i.contentHeight-i.containerHeight)/(i.containerHeight-i.railYRatio*i.scrollbarYHeight));u(o,"top",r)}(t.pageY-e),c(o),t.stopPropagation(),t.preventDefault()},r=function(){a.stopScrolling(o,"y"),i.event.unbind(i.ownerDocument,"mousemove",n)};i.event.bind(i.scrollbarY,"mousedown",function(t){e=t.pageY,l=a.toInt(s.css(i.scrollbarY,"top"))*i.railYRatio,a.startScrolling(o,"y"),i.event.bind(i.ownerDocument,"mousemove",n),i.event.once(i.ownerDocument,"mouseup",r),t.stopPropagation(),t.preventDefault()})}e.exports=function(t){var e=r.get(t);o(t,e),i(t,e)}},{"../../lib/dom":3,"../../lib/helper":6,"../instances":18,"../update-geometry":19,"../update-scroll":20}],12:[function(t,e,n){"use strict";var s=t("../../lib/helper"),r=t("../instances"),a=t("../update-geometry"),c=t("../update-scroll");function o(o,i){var l=!1;i.event.bind(o,"mouseenter",function(){l=!0}),i.event.bind(o,"mouseleave",function(){l=!1});i.event.bind(i.ownerDocument,"keydown",function(t){if((!t.isDefaultPrevented||!t.isDefaultPrevented())&&l){var e=document.activeElement?document.activeElement:i.ownerDocument.activeElement;if(e){for(;e.shadowRoot;)e=e.shadowRoot.activeElement;if(s.isEditable(e))return}var n=0,r=0;switch(t.which){case 37:n=-30;break;case 38:r=30;break;case 39:n=30;break;case 40:r=-30;break;case 33:r=90;break;case 32:r=t.shiftKey?90:-90;break;case 34:r=-90;break;case 35:r=t.ctrlKey?-i.contentHeight:-i.containerHeight;break;case 36:r=t.ctrlKey?o.scrollTop:i.containerHeight;break;default:return}c(o,"top",o.scrollTop-r),c(o,"left",o.scrollLeft+n),a(o),function(t,e){var n=o.scrollTop;if(0===t){if(!i.scrollbarYActive)return!1;if(0===n&&0<e||n>=i.contentHeight-i.containerHeight&&e<0)return!i.settings.wheelPropagation}var r=o.scrollLeft;if(0===e){if(!i.scrollbarXActive)return!1;if(0===r&&t<0||r>=i.contentWidth-i.containerWidth&&0<t)return!i.settings.wheelPropagation}return!0}(n,r)&&t.preventDefault()}})}e.exports=function(t){o(t,r.get(t))}},{"../../lib/helper":6,"../instances":18,"../update-geometry":19,"../update-scroll":20}],13:[function(t,e,n){"use strict";var r=t("../instances"),u=t("../update-geometry"),d=t("../update-scroll");function o(s,a){var c=!1;function t(t){var e,n,r,o=(n=(e=t).deltaX,r=-1*e.deltaY,void 0!==n&&void 0!==r||(n=-1*e.wheelDeltaX/6,r=e.wheelDeltaY/6),e.deltaMode&&1===e.deltaMode&&(n*=10,r*=10),n!=n&&r!=r&&(n=0,r=e.wheelDelta),[n,r]),i=o[0],l=o[1];(function(t,e){var n=s.querySelector("textarea:hover");if(n){var r=n.scrollHeight-n.clientHeight;if(0<r&&!(0===n.scrollTop&&0<e||n.scrollTop===r&&e<0))return!0;var o=n.scrollLeft-n.clientWidth;if(0<o&&!(0===n.scrollLeft&&t<0||n.scrollLeft===o&&0<t))return!0}return!1})(i,l)||(c=!1,a.settings.useBothWheelAxes?a.scrollbarYActive&&!a.scrollbarXActive?(d(s,"top",l?s.scrollTop-l*a.settings.wheelSpeed:s.scrollTop+i*a.settings.wheelSpeed),c=!0):a.scrollbarXActive&&!a.scrollbarYActive&&(d(s,"left",i?s.scrollLeft+i*a.settings.wheelSpeed:s.scrollLeft-l*a.settings.wheelSpeed),c=!0):(d(s,"top",s.scrollTop-l*a.settings.wheelSpeed),d(s,"left",s.scrollLeft+i*a.settings.wheelSpeed)),u(s),(c=c||function(t,e){var n=s.scrollTop;if(0===t){if(!a.scrollbarYActive)return!1;if(0===n&&0<e||n>=a.contentHeight-a.containerHeight&&e<0)return!a.settings.wheelPropagation}var r=s.scrollLeft;if(0===e){if(!a.scrollbarXActive)return!1;if(0===r&&t<0||r>=a.contentWidth-a.containerWidth&&0<t)return!a.settings.wheelPropagation}return!0}(i,l))&&(t.stopPropagation(),t.preventDefault()))}void 0!==window.onwheel?a.event.bind(s,"wheel",t):void 0!==window.onmousewheel&&a.event.bind(s,"mousewheel",t)}e.exports=function(t){o(t,r.get(t))}},{"../instances":18,"../update-geometry":19,"../update-scroll":20}],14:[function(t,e,n){"use strict";var r=t("../instances"),o=t("../update-geometry");e.exports=function(t){var e,n=r.get(t);e=t,n.event.bind(e,"scroll",function(){o(e)})}},{"../instances":18,"../update-geometry":19}],15:[function(t,e,n){"use strict";var p=t("../../lib/helper"),h=t("../instances"),v=t("../update-geometry"),f=t("../update-scroll");function r(s,t){var a=null,c={top:0,left:0};function u(){a&&(clearInterval(a),a=null),p.stopScrolling(s)}var d=!1;t.event.bind(t.ownerDocument,"selectionchange",function(){var t;s.contains(0===(t=window.getSelection?window.getSelection():document.getSelection?document.getSelection():"").toString().length?null:t.getRangeAt(0).commonAncestorContainer)?d=!0:(d=!1,u())}),t.event.bind(window,"mouseup",function(){d&&(d=!1,u())}),t.event.bind(window,"mousemove",function(t){if(d){var e=t.pageX,n=t.pageY,r=s.offsetLeft,o=s.offsetLeft+s.offsetWidth,i=s.offsetTop,l=s.offsetTop+s.offsetHeight;e<r+3?(c.left=-5,p.startScrolling(s,"x")):o-3<e?(c.left=5,p.startScrolling(s,"x")):c.left=0,n<i+3?(c.top=i+3-n<5?-5:-20,p.startScrolling(s,"y")):l-3<n?(c.top=n-l+3<5?5:20,p.startScrolling(s,"y")):c.top=0,0===c.top&&0===c.left?u():a||(a=setInterval(function(){h.get(s)?(f(s,"top",s.scrollTop+c.top),f(s,"left",s.scrollLeft+c.left),v(s)):clearInterval(a)},50))}})}e.exports=function(t){r(t,h.get(t))}},{"../../lib/helper":6,"../instances":18,"../update-geometry":19,"../update-scroll":20}],16:[function(t,e,n){"use strict";var m=t("../instances"),Y=t("../update-geometry"),w=t("../update-scroll");function r(s,a,t,e){function c(t,e){w(s,"top",s.scrollTop-e),w(s,"left",s.scrollLeft-t),Y(s)}var u={},d=0,p={},n=null,h=!1,v=!1;function r(){h=!0}function o(){h=!1}function f(t){return t.targetTouches?t.targetTouches[0]:t}function b(t){return!(!t.targetTouches||1!==t.targetTouches.length)||!(!t.pointerType||"mouse"===t.pointerType||t.pointerType===t.MSPOINTER_TYPE_MOUSE)}function i(t){if(b(t)){v=!0;var e=f(t);u.pageX=e.pageX,u.pageY=e.pageY,d=(new Date).getTime(),null!==n&&clearInterval(n),t.stopPropagation()}}function l(t){if(!h&&v&&b(t)){var e=f(t),n={pageX:e.pageX,pageY:e.pageY},r=n.pageX-u.pageX,o=n.pageY-u.pageY;c(r,o),u=n;var i=(new Date).getTime(),l=i-d;0<l&&(p.x=r/l,p.y=o/l,d=i),function(t,e){var n=s.scrollTop,r=s.scrollLeft,o=Math.abs(t),i=Math.abs(e);if(o<i){if(e<0&&n===a.contentHeight-a.containerHeight||0<e&&0===n)return!a.settings.swipePropagation}else if(i<o&&(t<0&&r===a.contentWidth-a.containerWidth||0<t&&0===r))return!a.settings.swipePropagation;return!0}(r,o)&&(t.stopPropagation(),t.preventDefault())}}function g(){!h&&v&&(v=!1,clearInterval(n),n=setInterval(function(){m.get(s)?Math.abs(p.x)<.01&&Math.abs(p.y)<.01?clearInterval(n):(c(30*p.x,30*p.y),p.x*=.8,p.y*=.8):clearInterval(n)},10))}t&&(a.event.bind(window,"touchstart",r),a.event.bind(window,"touchend",o),a.event.bind(s,"touchstart",i),a.event.bind(s,"touchmove",l),a.event.bind(s,"touchend",g)),e&&(window.PointerEvent?(a.event.bind(window,"pointerdown",r),a.event.bind(window,"pointerup",o),a.event.bind(s,"pointerdown",i),a.event.bind(s,"pointermove",l),a.event.bind(s,"pointerup",g)):window.MSPointerEvent&&(a.event.bind(window,"MSPointerDown",r),a.event.bind(window,"MSPointerUp",o),a.event.bind(s,"MSPointerDown",i),a.event.bind(s,"MSPointerMove",l),a.event.bind(s,"MSPointerUp",g)))}e.exports=function(t,e,n){r(t,m.get(t),e,n)}},{"../instances":18,"../update-geometry":19,"../update-scroll":20}],17:[function(t,e,n){"use strict";var r=t("../lib/class"),o=t("../lib/helper"),i=t("./instances"),l=t("./update-geometry"),s=t("./handler/click-rail"),a=t("./handler/drag-scrollbar"),c=t("./handler/keyboard"),u=t("./handler/mouse-wheel"),d=t("./handler/native-scroll"),p=t("./handler/selection"),h=t("./handler/touch");e.exports=function(t,e){e="object"==typeof e?e:{},r.add(t,"ps-container");var n=i.add(t);n.settings=o.extend(n.settings,e),s(t),a(t),u(t),d(t),n.settings.useSelectionScroll&&p(t),(o.env.supportsTouch||o.env.supportsIePointer)&&h(t,o.env.supportsTouch,o.env.supportsIePointer),n.settings.useKeyboard&&c(t),l(t)}},{"../lib/class":2,"../lib/helper":6,"./handler/click-rail":10,"./handler/drag-scrollbar":11,"./handler/keyboard":12,"./handler/mouse-wheel":13,"./handler/native-scroll":14,"./handler/selection":15,"./handler/touch":16,"./instances":18,"./update-geometry":19}],18:[function(t,e,n){"use strict";var o=t("../lib/dom"),i=t("./default-setting"),l=t("../lib/event-manager"),s=t("../lib/guid"),a=t("../lib/helper"),c={};function u(t){var e,n,r=this;r.settings=a.clone(i),r.containerWidth=null,r.containerHeight=null,r.contentWidth=null,r.contentHeight=null,r.isRtl="rtl"===o.css(t,"direction"),r.isNegativeScroll=(n=t.scrollLeft,t.scrollLeft=-1,e=t.scrollLeft<0,t.scrollLeft=n,e),r.negativeScrollAdjustment=r.isNegativeScroll?t.scrollWidth-t.clientWidth:0,r.event=new l,r.ownerDocument=t.ownerDocument||document,r.scrollbarXRail=o.appendTo(o.e("div","ps-scrollbar-x-rail"),t),r.scrollbarX=o.appendTo(o.e("div","ps-scrollbar-x"),r.scrollbarXRail),r.scrollbarX.setAttribute("tabindex",0),r.scrollbarXActive=null,r.scrollbarXWidth=null,r.scrollbarXLeft=null,r.scrollbarXBottom=a.toInt(o.css(r.scrollbarXRail,"bottom")),r.isScrollbarXUsingBottom=r.scrollbarXBottom==r.scrollbarXBottom,r.scrollbarXTop=r.isScrollbarXUsingBottom?null:a.toInt(o.css(r.scrollbarXRail,"top")),r.railBorderXWidth=a.toInt(o.css(r.scrollbarXRail,"borderLeftWidth"))+a.toInt(o.css(r.scrollbarXRail,"borderRightWidth")),o.css(r.scrollbarXRail,"display","block"),r.railXMarginWidth=a.toInt(o.css(r.scrollbarXRail,"marginLeft"))+a.toInt(o.css(r.scrollbarXRail,"marginRight")),o.css(r.scrollbarXRail,"display",""),r.railXWidth=null,r.railXRatio=null,r.scrollbarYRail=o.appendTo(o.e("div","ps-scrollbar-y-rail"),t),r.scrollbarY=o.appendTo(o.e("div","ps-scrollbar-y"),r.scrollbarYRail),r.scrollbarY.setAttribute("tabindex",0),r.scrollbarYActive=null,r.scrollbarYHeight=null,r.scrollbarYTop=null,r.scrollbarYRight=a.toInt(o.css(r.scrollbarYRail,"right")),r.isScrollbarYUsingRight=r.scrollbarYRight==r.scrollbarYRight,r.scrollbarYLeft=r.isScrollbarYUsingRight?null:a.toInt(o.css(r.scrollbarYRail,"left")),r.scrollbarYOuterWidth=r.isRtl?a.outerWidth(r.scrollbarY):null,r.railBorderYWidth=a.toInt(o.css(r.scrollbarYRail,"borderTopWidth"))+a.toInt(o.css(r.scrollbarYRail,"borderBottomWidth")),o.css(r.scrollbarYRail,"display","block"),r.railYMarginHeight=a.toInt(o.css(r.scrollbarYRail,"marginTop"))+a.toInt(o.css(r.scrollbarYRail,"marginBottom")),o.css(r.scrollbarYRail,"display",""),r.railYHeight=null,r.railYRatio=null}function r(t){return void 0===t.dataset?t.getAttribute("data-ps-id"):t.dataset.psId}n.add=function(t){var e,n,r=s();return n=r,void 0===(e=t).dataset?e.setAttribute("data-ps-id",n):e.dataset.psId=n,c[r]=new u(t),c[r]},n.remove=function(t){var e;delete c[r(t)],void 0===(e=t).dataset?e.removeAttribute("data-ps-id"):delete e.dataset.psId},n.get=function(t){return c[r(t)]}},{"../lib/dom":3,"../lib/event-manager":4,"../lib/guid":5,"../lib/helper":6,"./default-setting":8}],19:[function(t,e,n){"use strict";var r=t("../lib/class"),o=t("../lib/dom"),i=t("../lib/helper"),l=t("./instances"),s=t("./update-scroll");function a(t,e){return t.settings.minScrollbarLength&&(e=Math.max(e,t.settings.minScrollbarLength)),t.settings.maxScrollbarLength&&(e=Math.min(e,t.settings.maxScrollbarLength)),e}e.exports=function(t){var e,n=l.get(t);n.containerWidth=t.clientWidth,n.containerHeight=t.clientHeight,n.contentWidth=t.scrollWidth,n.contentHeight=t.scrollHeight,t.contains(n.scrollbarXRail)||(0<(e=o.queryChildren(t,".ps-scrollbar-x-rail")).length&&e.forEach(function(t){o.remove(t)}),o.appendTo(n.scrollbarXRail,t)),t.contains(n.scrollbarYRail)||(0<(e=o.queryChildren(t,".ps-scrollbar-y-rail")).length&&e.forEach(function(t){o.remove(t)}),o.appendTo(n.scrollbarYRail,t)),!n.settings.suppressScrollX&&n.containerWidth+n.settings.scrollXMarginOffset<n.contentWidth?(n.scrollbarXActive=!0,n.railXWidth=n.containerWidth-n.railXMarginWidth,n.railXRatio=n.containerWidth/n.railXWidth,n.scrollbarXWidth=a(n,i.toInt(n.railXWidth*n.containerWidth/n.contentWidth)),n.scrollbarXLeft=i.toInt((n.negativeScrollAdjustment+t.scrollLeft)*(n.railXWidth-n.scrollbarXWidth)/(n.contentWidth-n.containerWidth))):n.scrollbarXActive=!1,!n.settings.suppressScrollY&&n.containerHeight+n.settings.scrollYMarginOffset<n.contentHeight?(n.scrollbarYActive=!0,n.railYHeight=n.containerHeight-n.railYMarginHeight,n.railYRatio=n.containerHeight/n.railYHeight,n.scrollbarYHeight=a(n,i.toInt(n.railYHeight*n.containerHeight/n.contentHeight)),n.scrollbarYTop=i.toInt(t.scrollTop*(n.railYHeight-n.scrollbarYHeight)/(n.contentHeight-n.containerHeight))):n.scrollbarYActive=!1,n.scrollbarXLeft>=n.railXWidth-n.scrollbarXWidth&&(n.scrollbarXLeft=n.railXWidth-n.scrollbarXWidth),n.scrollbarYTop>=n.railYHeight-n.scrollbarYHeight&&(n.scrollbarYTop=n.railYHeight-n.scrollbarYHeight),function(t,e){var n={width:e.railXWidth};e.isRtl?n.left=e.negativeScrollAdjustment+t.scrollLeft+e.containerWidth-e.contentWidth:n.left=t.scrollLeft,e.isScrollbarXUsingBottom?n.bottom=e.scrollbarXBottom-t.scrollTop:n.top=e.scrollbarXTop+t.scrollTop,o.css(e.scrollbarXRail,n);var r={top:t.scrollTop,height:e.railYHeight};e.isScrollbarYUsingRight?e.isRtl?r.right=e.contentWidth-(e.negativeScrollAdjustment+t.scrollLeft)-e.scrollbarYRight-e.scrollbarYOuterWidth:r.right=e.scrollbarYRight-t.scrollLeft:e.isRtl?r.left=e.negativeScrollAdjustment+t.scrollLeft+2*e.containerWidth-e.contentWidth-e.scrollbarYLeft-e.scrollbarYOuterWidth:r.left=e.scrollbarYLeft+t.scrollLeft,o.css(e.scrollbarYRail,r),o.css(e.scrollbarX,{left:e.scrollbarXLeft,width:e.scrollbarXWidth-e.railBorderXWidth}),o.css(e.scrollbarY,{top:e.scrollbarYTop,height:e.scrollbarYHeight-e.railBorderYWidth})}(t,n),n.scrollbarXActive?r.add(t,"ps-active-x"):(r.remove(t,"ps-active-x"),n.scrollbarXWidth=0,n.scrollbarXLeft=0,s(t,"left",0)),n.scrollbarYActive?r.add(t,"ps-active-y"):(r.remove(t,"ps-active-y"),n.scrollbarYHeight=0,n.scrollbarYTop=0,s(t,"top",0))}},{"../lib/class":2,"../lib/dom":3,"../lib/helper":6,"./instances":18,"./update-scroll":20}],20:[function(t,e,n){"use strict";var o,i,l=t("./instances"),s=document.createEvent("Event"),a=document.createEvent("Event"),c=document.createEvent("Event"),u=document.createEvent("Event"),d=document.createEvent("Event"),p=document.createEvent("Event"),h=document.createEvent("Event"),v=document.createEvent("Event"),f=document.createEvent("Event"),b=document.createEvent("Event");s.initEvent("ps-scroll-up",!0,!0),a.initEvent("ps-scroll-down",!0,!0),c.initEvent("ps-scroll-left",!0,!0),u.initEvent("ps-scroll-right",!0,!0),d.initEvent("ps-scroll-y",!0,!0),p.initEvent("ps-scroll-x",!0,!0),h.initEvent("ps-x-reach-start",!0,!0),v.initEvent("ps-x-reach-end",!0,!0),f.initEvent("ps-y-reach-start",!0,!0),b.initEvent("ps-y-reach-end",!0,!0),e.exports=function(t,e,n){if(void 0===t)throw"You must provide an element to the update-scroll function";if(void 0===e)throw"You must provide an axis to the update-scroll function";if(void 0===n)throw"You must provide a value to the update-scroll function";if("top"===e&&n<=0)return t.scrollTop=0,void t.dispatchEvent(f);if("left"===e&&n<=0)return t.scrollLeft=0,void t.dispatchEvent(h);var r=l.get(t);return"top"===e&&n>=r.contentHeight-r.containerHeight?(t.scrollTop=r.contentHeight-r.containerHeight,void t.dispatchEvent(b)):"left"===e&&n>=r.contentWidth-r.containerWidth?(t.scrollLeft=r.contentWidth-r.containerWidth,void t.dispatchEvent(v)):(o||(o=t.scrollTop),i||(i=t.scrollLeft),"top"===e&&n<o&&t.dispatchEvent(s),"top"===e&&o<n&&t.dispatchEvent(a),"left"===e&&n<i&&t.dispatchEvent(c),"left"===e&&i<n&&t.dispatchEvent(u),"top"===e&&(t.scrollTop=o=n,t.dispatchEvent(d)),void("left"===e&&(t.scrollLeft=i=n,t.dispatchEvent(p))))}},{"./instances":18}],21:[function(t,e,n){"use strict";var r=t("../lib/dom"),o=t("../lib/helper"),i=t("./instances"),l=t("./update-geometry"),s=t("./update-scroll");e.exports=function(t){var e=i.get(t);e&&(e.negativeScrollAdjustment=e.isNegativeScroll?t.scrollWidth-t.clientWidth:0,r.css(e.scrollbarXRail,"display","block"),r.css(e.scrollbarYRail,"display","block"),e.railXMarginWidth=o.toInt(r.css(e.scrollbarXRail,"marginLeft"))+o.toInt(r.css(e.scrollbarXRail,"marginRight")),e.railYMarginHeight=o.toInt(r.css(e.scrollbarYRail,"marginTop"))+o.toInt(r.css(e.scrollbarYRail,"marginBottom")),r.css(e.scrollbarXRail,"display","none"),r.css(e.scrollbarYRail,"display","none"),l(t),s(t,"top",t.scrollTop),s(t,"left",t.scrollLeft),r.css(e.scrollbarXRail,"display",""),r.css(e.scrollbarYRail,"display",""))}},{"../lib/dom":3,"../lib/helper":6,"./instances":18,"./update-geometry":19,"./update-scroll":20}]},{},[1]);