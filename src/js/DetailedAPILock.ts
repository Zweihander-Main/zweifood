import * as config from './config';
import LocationModel from './LocationModel';
interface SearchType {
	basic?: Array<LocationModel>;
	detailed: Array<LocationModel>;
}

export default class DetailedAPILock {
	intercept: Array<{
		ID: LocationModel;
		type: string;
		service: string;
	}>;
	google: SearchType;
	locu: SearchType;
	yelp: SearchType;
	foursquare: SearchType;
	parentViewModel: any; //TODO

	constructor(currentViewModel) {
		this.parentViewModel = currentViewModel; // TODO
		// Intercept array for when a call is waiting on another call
		this.intercept = [];
		// Setup arrays for basic and detailed calls for all services
		for (
			let i = 0, len = config.CONFIGURED_SEARCH_TYPES.length;
			i < len;
			i++
		) {
			this[config.CONFIGURED_SEARCH_TYPES[i]] = {
				basic: [LocationModel],
				detailed: [LocationModel],
			};
		}
		this.google = {
			detailed: [],
		};
	}

	/**
	 * Find if model is currently being fetched using service and method
	 * @param  {string} service name of API service
	 * @param  {string} type    type of call (basic/detailed/ect.)
	 * @param  {object} ID      model to lookup
	 * @return {number}         index of model or -1 if not found
	 */
	findID(service, type, ID): number {
		return this[service][type].indexOf(ID);
	}
	/**
	 * Push model to array when it's being called using service and
	 * method
	 * @param  {string} service name of API service
	 * @param  {string} type    type of call
	 * @param  {object} ID      model to push in
	 */
	pushID(service, type, ID): void {
		this[service][type].push(ID);
		this[service][type][this[service][type].length - 1][
			service + 'IsLoading'
		](true);
	}
	/**
	 * Remove model from array after particular service/method call is
	 * finished. Also check if in intercept array in which case, call
	 * intercept array function (for example, a detailed intercept
	 * would be waiting for a basic call first)
	 * @param  {string} service name of API service
	 * @param  {string} type    type of call
	 * @param  {object} ID      model to remove
	 */
	removeID(service, type, ID): void {
		const index = this.findID(service, type, ID);
		if (index > -1) {
			this[service][type][index][service + 'IsLoading'](false);
			this[service][type].splice(index, 1);
		}
		for (let i = 0, len = this.intercept.length; i < len; i++) {
			if (this.intercept[i].ID === ID) {
				this.parentViewModel.getDetailedAPIData(
					this.intercept[i].service,
					this.intercept[i].ID
				);
				this.intercept.splice(i, 1);
			}
		}
	}

	/**
	 * Push a call that is waiting for another call
	 * @param  {string} service name of API service
	 * @param  {string} type    type of call to be called when previous
	 *                          call is finished
	 * @param  {object} ID      model to call
	 * @return undefined        returns if call is already in place
	 */
	interceptIDPush(service, type, ID): void | undefined {
		for (let i = 0, len = this.intercept.length; i < len; i++) {
			if (this.intercept[i].ID === ID) {
				return;
			}
		}
		this.intercept.push({
			ID: ID,
			type: type,
			service: service,
		});
	}
	/**
	 * Remove call from intercept array (for a failed previous call)
	 * @param  {object} ID      model to remove
	 */
	interceptIDRemove(ID): void {
		for (let i = 0, len = this.intercept.length; i < len; i++) {
			if (this.intercept[i].ID === ID) {
				this.intercept.splice(i, 1);
			}
		}
	}
}