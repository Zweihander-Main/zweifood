import jquery from 'jquery';
import 'jquery-migrate';
import ko from 'knockout';
const windowBind = ((): void => {
	window.$ = window.jQuery = jquery;
	window.ko = ko;
})();
export { windowBind as default };
