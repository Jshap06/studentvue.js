import { SchoolDistrict, UserCredentials } from './StudentVue.interfaces';
import Client from './Client/Client';
import soap from '../utils/soap/soap';
import { DistrictListXMLObject } from './StudentVue.xml';
import RequestException from './RequestException/RequestException';
import { Gradebook } from './Client/Client.interfaces';

/** @module StudentVue */

/**
 * Login to the StudentVUE API
 * @param {string} districtUrl The URL of the district which can be found using `findDistricts()` method
 * @param {UserCredentials} credentials User credentials of the student
 * @returns {Promise<Client>} Returns the client and the information of the student upon successful login
 */
export function login(districtUrl: string, credentials: UserCredentials,proxyUrl:string="https://studentvuelib.up.railway.app"): Promise<[Client,Gradebook,any]> {
  return new Promise((res, rej) => {
    if (districtUrl.length === 0)
      return rej(new RequestException({ message: 'District URL cannot be an empty string' }));
    const url = districtUrl.charAt(districtUrl.length - 1) === '/' ? districtUrl : `${districtUrl}/`;
    //stadardizes so u know it'll end in a slash fo sho
    const endpoint = url+"Service/PXPCommunication.asmx";
    const client = new Client(
      {
        username: credentials.username,
        password: credentials.password,
        districtUrl: endpoint,
        isParent: credentials.isParent,
        encrypted:credentials.encrypted
      },
      proxyUrl,url
    );
    client
      .gradebook()
      .then((response) => {
        console.log("immediate login response",response,proxyUrl);
        res([client,...response]);
      })
      .catch(rej);
/*
    const p1=client.gradebook();
    const p2=client.ChildList();
    Promise.all([p1,p2]).then(all=>{
      const [grades,info]=all
      if(info.)

    })
      */
    
  });
}

/**
 * Find school districts using a zipcode
 * @param {string} zipCode The zipcode to get a list of schools from
 * @returns {Promise<SchoolDistrict[]>} Returns a list of school districts which can be used to login to the API
 */
export function findDistricts(zipCode: string): Promise<SchoolDistrict[]> {
  return new Promise((res, reject) => {
    soap.Client.processAnonymousRequest<DistrictListXMLObject | undefined>(
      'https://support.edupoint.com/Service/HDInfoCommunication.asmx',
      {
        paramStr: {
          Key: '5E4B7859-B805-474B-A833-FDB15D205D40',
          MatchToDistrictZipCode: zipCode,
        },
      }
    )
      .then((xmlObject) => {
        if (!xmlObject || !xmlObject.DistrictLists.DistrictInfos.DistrictInfo) return res([]);
        res(
          xmlObject.DistrictLists.DistrictInfos.DistrictInfo.map((district) => ({
            parentVueUrl: district['@_PvueURL'],
            address: district['@_Address'],
            id: district['@_DistrictID'],
            name: district['@_Name'],
          }))
        );
      })
      .catch(reject);
  });
}
