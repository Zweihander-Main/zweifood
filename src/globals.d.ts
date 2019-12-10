// For parcel imports
declare module '*.png';

// For 3rd party APIs
type jsonNonObjectValues = string | number | boolean | null;
type genericJSONValues = jsonNonObjectValues | Array<jsonNonObjectValues>;
type GenericJSON = {
	[key: string]: genericJSONValues | GenericJSON;
};

// Declared in util.ts
declare interface String {
	toProperCase(): string;
}

// For app.ts
declare interface App {
	googleLoaded: () => void;
	googleFailedToLoad: () => void;
	preloadFontsAndImages: () => void;
}
declare interface Window {
	app: App;
}

// Same as ko.BindingHandlers but with added internal prop to update
declare interface KoInternalBindingHandlers<
	E extends Node = HTMLElement,
	V = any, // eslint-disable-line @typescript-eslint/no-explicit-any
	VM = any // eslint-disable-line @typescript-eslint/no-explicit-any
> {
	after?: Array<string>;
	init?: (
		element: E,
		valueAccessor: () => V,
		allBindingsAccessor: ko.AllBindings,
		viewModel: VM,
		bindingContext: ko.BindingContext
	) => void | { controlsDescendantBindings: boolean };
	update?: (
		element: E,
		valueAccessor: (() => V) | V,
		allBindingsAccessor: ko.AllBindings,
		viewModel: VM,
		bindingContext: ko.BindingContext,
		internal?: boolean
	) => void | string;
	preprocess?: (
		value: string,
		name: string,
		addBindingCallback?: (name: string, value: string) => void
	) => string;
}

// Cross app error object
declare interface ErrorInterface {
	customMessage: string;
	textStatus: string;
	verbose: boolean;
	killOnMarkers: boolean;
}

/// <reference path="./google.maps.d.ts" />
