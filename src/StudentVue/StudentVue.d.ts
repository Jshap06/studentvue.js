import { SchoolDistrict, UserCredentials } from './StudentVue.interfaces';
import Client from './Client/Client';
import { Gradebook } from './Client/Client.interfaces';
import { ApiType } from '../utils/fallback/fallback';
export { Client };
/** @module StudentVue */
/**
 * Login to the StudentVUE API
 * @param {string} districtUrl The URL of the district which can be found using `findDistricts()` method
 * @param {UserCredentials} credentials User credentials of the student
 * @param {string} proxyUrl The proxy to relay requests through, or `'native'` to hit the district directly
 * @param {ApiType} api Which API to try first (`'rest'` or `'soap'`). Defaults to `'rest'`
 * @returns {Promise<Client>} Returns the client and the information of the student upon successful login
 */
export declare function login(districtUrl: string, credentials: UserCredentials, proxyUrl?: string, api?: ApiType): Promise<{
    client: Client;
    responses: [Gradebook, any][];
}>;
/**
 * Find school districts using a zipcode
 * @param {string} zipCode The zipcode to get a list of schools from
 * @returns {Promise<SchoolDistrict[]>} Returns a list of school districts which can be used to login to the API
 */
export declare function findDistricts(zipCode: string): Promise<SchoolDistrict[]>;
