//in a .d.ts file:
declare global {
	interface String {
		toProperCase(): string;
	}
}
declare module '*.png';
declare const google;
declare const ko;
type jsonNonObjectValues = string | number | boolean | null;
type genericJSONValues = jsonNonObjectValues | Array<jsonNonObjectValues>;
type GenericJSON = {
	[key: string]: genericJSONValues | GenericJSON;
};
