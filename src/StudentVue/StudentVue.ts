import { SchoolDistrict, UserCredentials } from './StudentVue.interfaces';
import Client from './Client/Client';
import soap from '../utils/soap/soap';
import { DistrictListXMLObject } from './StudentVue.xml';
import RequestException from './RequestException/RequestException';
import { Gradebook } from './Client/Client.interfaces';


//helper function fuck y'all goofy ahh

function stupid(client:Client,mp:any):Promise<[Gradebook,any]>{
  try{
    return new Promise((res,rej)=>client.gradebook(mp.index).then(grades=>res(grades)).catch(error=>rej(error)))
  }catch(error){console.log(error,"dexter morgan");
    return new Promise((res,rej)=>client.gradebook(mp.index).then(grades=>res(grades)).catch(error=>rej(error)))
  }
}


async function getGradebooks(client:Client,lock:any,setLock:any):Promise<[Gradebook,any][]>{

    const info=JSON.parse(localStorage.getItem("mps") ?? "");
    const periods=info.periods
    if(!(periods?.length>0)||info.district!=client.district){
        //cacheLoading
        const result=await client.gradebook()
    //    setLock(true);
        const periods=result[0].reportingPeriod.available.map(({ name, index, date }) => ({
			name:name,
			date:date,
			index: index,
		}))
      localStorage.setItem("mps",JSON.stringify({periods:periods,district:client.district}))
      const remainder:typeof result[]=await Promise.all(periods.map(mp=>{if(result[0].reportingPeriod.current.index==mp.index){return new Promise<typeof result>((res,rej)=>{res(result)})}else{return stupid(client,mp)}}))
      return [...remainder]


    }
    else{
        const mps:{index:number,date:any}[]=periods;
        const result=await Promise.all(mps.map(mp=>stupid(client,mp)))
        return result;
    }

}









export {Client}

/** @module StudentVue */

/**
 * Login to the StudentVUE API
 * @param {string} districtUrl The URL of the district which can be found using `findDistricts()` method
 * @param {UserCredentials} credentials User credentials of the student
 * @returns {Promise<Client>} Returns the client and the information of the student upon successful login
 */
export function login(districtUrl: string, credentials: UserCredentials,proxyUrl:string="https://studentvuelib.up.railway.app"): Promise<{client:Client,responses:[Gradebook,any][]}> {
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
      getGradebooks(client,null,null)
      .then((response) => {
        console.log("immediate login response",response,proxyUrl);
        res({client:client,responses:response});
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
