import jquery from 'jquery';
import 'jquery-migrate';
if (process.env.NODE_ENV === 'production') {
	jquery.migrateMute = true;
}
import ko from 'knockout';
const windowBind = ((): void => {
	window.$ = window.jQuery = jquery;
	window.ko = ko;
})();
export { windowBind as default };
