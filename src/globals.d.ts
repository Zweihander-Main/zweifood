//in a .d.ts file:
declare global {
	interface String {
		toProperCase(): string;
	}
}
declare module '*.png';
