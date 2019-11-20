declare module '*.png';
type jsonNonObjectValues = string | number | boolean | null;
type genericJSONValues = jsonNonObjectValues | Array<jsonNonObjectValues>;
type GenericJSON = {
	[key: string]: genericJSONValues | GenericJSON;
};
/// <reference path="./google.maps.d.ts" />
