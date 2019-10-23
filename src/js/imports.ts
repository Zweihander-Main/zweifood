import jquery from 'jquery';
import 'jquery-migrate';
import ko from 'knockout';
import WebFont from 'webfontloader';
import oauthSignature from 'oauth-signature';
export default ((): void => {
	window.$ = window.jQuery = jquery;
	window.ko = ko;
	window.WebFont = WebFont;
	window.oauthSignature = oauthSignature;
})();
