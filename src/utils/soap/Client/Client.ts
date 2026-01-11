import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import {
  ParsedRequestError,
  RequestOptions,
  ParsedRequestResult,
  ParsedAnonymousRequestError,
  LoginCredentials,
} from '../../../utils/soap/Client/Client.interfaces';
import RequestException from '../../../StudentVue/RequestException/RequestException';
import CryptoJS from "crypto-js"



export default class Client {
  private __username__: string;
  private __password__: string;
  private __district__: string;
  private __apiKey__ : string;
  private static url:string;
  private readonly isParent: number;
  encrypted: boolean;

  public get district(): string {
    return this.__district__;
  }

  public get username(): string {
    return this.__username__;
  }

  public get password(): string {
    return this.__password__;
  }

  public get apiKey():string{
    return this.__apiKey__
  }

  public get proxyUrl():string{
    return Client.url
  }

  protected get credentials(): LoginCredentials {
    return {
      username: this.username,
      password: this.password,
      districtUrl: this.district,
      encrypted:this.encrypted
    };
  }

  constructor(credentials: LoginCredentials,Purl:string="https://studentvuelib.up.railway.app") {
    this.__username__ = credentials.username;
    this.__password__ = credentials.password;
    this.__district__ = credentials.districtUrl;
    this.__apiKey__ = generateKey()

    this.isParent = credentials.isParent ? 1 : 0;
    this.encrypted=credentials.encrypted;
    Client.url=Purl;
  }

  /**
   * Create a POST request to synergy servers to fetch data
   * @param options Options to provide when making a XML request to the servers
   * @param preparse Runs before parsing the xml string into an object. Useful for mutating xml that could be parsed incorrectly by `fast-xml-parser`
   * @returns Returns an XML object that must be defined in a type declaration file.
   * @see https://github.com/StudentVue/docs
   * @description
   * ```js
   * super.processRequest({ methodName: 'Refer to StudentVue/docs', paramStr: { AnythingThatCanBePassed: true, AsLongAsItMatchesTheDocumentation: true }});
   * // This will make the XML request below:
   * ```
   * 
   * ```xml
   * <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <ProcessWebServiceRequest xmlns="http://edupoint.com/webservices/">
            <userID>STUDENT_USERNAME</userID>
            <password>STUDENT_PASSWORD</password>
            <skipLoginLog>1</skipLoginLog>
            <parent>0</parent>
            <webServiceHandleName>PXPWebServices</webServiceHandleName>
            <methodName>Refer to StudentVue/docs</methodName>
            <paramStr>
              <AnythingThatCanBePassed>true</AnythingThatCanBePassed>
              <AsLongAsItMatchesTheDocumentation>true</AsLongAsItMatchesTheDocumentation>
            </paramStr>
        </ProcessWebServiceRequest>
      </soap:Body>
</soap:Envelope>
   * ```
   */
  
  protected processRequest<T extends object | undefined>(
    options: RequestOptions,
    preparse: (xml: string) => string = (xml) => xml
  ): Promise<T> {
    const defaultOptions: RequestOptions = {
      validateErrors: true,
      skipLoginLog: 0,
      parent: this.isParent,
      webServiceHandleName: 'PXPWebServices',
      paramStr: {},
      ...options,
    };
    return new Promise((res, reject) => {
      const builder = new XMLBuilder({
        ignoreAttributes: false,
        arrayNodeName: 'soap:Envelope',
        suppressEmptyNode: true,
      });
      const xml = builder.build({
        'soap:Envelope': {
          '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
          '@_xmlns:xsd': 'http://www.w3.org/2001/XMLSchema',
          '@_xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
          'soap:Body': {
            ProcessWebServiceRequest: {
              '@_xmlns': 'http://edupoint.com/webservices/',
              userID: this.username,
              password: this.password,
              ...defaultOptions,
              ...{ paramStr: Client.parseParamStr(defaultOptions.paramStr ?? {}) },
            },
          },
        },
      });

      fetch(this.district, {
        method: 'POST',
        credentials:"include",
        headers: {
          'Content-Type': 'text/xml'
        },
        body: xml
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.text();
        })
        .then((data) => {
          const parser = new XMLParser({});
          const result: ParsedRequestResult = parser.parse(data);
          const parserTwo = new XMLParser({
            ignoreAttributes: false,
            isArray: () => true,
            processEntities: false,
            parseAttributeValue: false,
            parseTagValue: false,
          });

          const obj: T | ParsedRequestError = parserTwo.parse(
            preparse(
              result['soap:Envelope']['soap:Body'].ProcessWebServiceRequestResponse.ProcessWebServiceRequestResult
            )
          );

          if (defaultOptions.validateErrors && typeof obj === 'object' && 'RT_ERROR' in obj)
            return reject(new RequestException(obj));

          res(obj as T);
        })
        .catch(reject);
    });
  }


  private static parseParamStr(input: object): string {
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      arrayNodeName: 'Params',
      suppressEmptyNode: true,
      suppressBooleanAttributes: false,
    });
    const xml = `<Parms>${builder.build(input)}</Parms>`;
    return xml;
  }

  public static processAnonymousRequest<T extends object | undefined>(
    url: string,
    options: Partial<RequestOptions> = {},
    preparse: (xml: string) => string = (d) => d.replace(/&gt;/g, '>').replace(/&lt;/g, '<')
  ): Promise<T> {
    const defaultOptions: RequestOptions = {
      skipLoginLog: 0,
      validateErrors: true,
      parent: 0,
      webServiceHandleName: 'HDInfoServices',
      methodName: 'GetMatchingDistrictList',
      paramStr: {},
      ...options,
    };
    return new Promise<T>((res, reject) => {
      const builder = new XMLBuilder({
        ignoreAttributes: false,
        arrayNodeName: 'soap:Envelope',
        suppressEmptyNode: true,
      });
      const xml = builder.build({
        'soap:Envelope': {
          '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
          '@_xmlns:xsd': 'http://www.w3.org/2001/XMLSchema',
          '@_xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
          'soap:Body': {
            ProcessWebServiceRequest: {
              '@_xmlns': 'http://edupoint.com/webservices/',
              userID: 'EdupointDistrictInfo',
              password: 'Edup01nt',
              ...defaultOptions,
              ...{ paramStr: Client.parseParamStr(defaultOptions.paramStr ?? {}) },
            },
          },
        },
      });

      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml'
        },
        body: xml
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.text();
        })
        .then((data) => {
          const parser = new XMLParser({});
          const result: ParsedRequestResult = parser.parse(data);
          const parserTwo = new XMLParser({ ignoreAttributes: false });

          const obj: T | ParsedAnonymousRequestError = parserTwo.parse(
            preparse(
              result['soap:Envelope']['soap:Body'].ProcessWebServiceRequestResponse.ProcessWebServiceRequestResult
            )
          );

          if (defaultOptions.validateErrors && typeof obj === 'object' && 'RT_ERROR' in obj)
            return reject(new RequestException(obj));

          res(obj as T);
        })
        .catch(reject);
    });
  }
}



function getDateMMDDYY() {
  let date = new Date();
  const epoch=date.getTime();
  date=new Date(epoch)
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based, so +1
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();

  return `${month}${day}${year}`;
}

function generateKey() : string {
  try {
    // Prepare key and IV
    let keyBytes = CryptoJS.enc.Utf8.parse('b2524efb438b4532b322e633d5aff252');  // Convert key to a word array
    let ivBytes = CryptoJS.enc.Utf8.parse('AES');  // Convert IV to a word array


    // Define the input string (date, version, etc.)
    const today = getDateMMDDYY();
    let input = `${today}|9.0.0|${today}|android`;

    // Encrypt the input string using AES with CBC mode and PKCS7 padding
    let encrypted = CryptoJS.AES.encrypt(input, keyBytes, {
      iv: ivBytes,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    // Convert the encrypted data to a Base64 string
    let encryptedString = encrypted.toString();

    return encryptedString;
  } catch (error:any) {
    console.error(error);
    return error.message
  }
}