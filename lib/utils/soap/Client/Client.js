(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "axios", "fast-xml-parser", "../../../StudentVue/RequestException/RequestException"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("axios"), require("fast-xml-parser"), require("../../../StudentVue/RequestException/RequestException"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.axios, global.fastXmlParser, global.RequestException);
    global.Client = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports, _axios, _fastXmlParser, _RequestException) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  _axios = _interopRequireDefault(_axios);
  _RequestException = _interopRequireDefault(_RequestException);
  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
  class Client {
    get district() {
      return this.__district__;
    }
    get username() {
      return this.__username__;
    }
    get password() {
      return this.__password__;
    }
    get credentials() {
      return {
        username: this.username,
        password: this.password,
        districtUrl: this.district,
        encrypted: this.encrypted
      };
    }
    constructor(credentials, Purl = "https://studentvuelib.up.railway.app") {
      this.__username__ = credentials.username;
      this.__password__ = credentials.password;
      this.__district__ = credentials.districtUrl;
      this.isParent = credentials.isParent ? 1 : 0;
      this.encrypted = credentials.encrypted;
      console.log("i am the constructor", Purl, Client.url);
      Client.url = Purl;
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

    processRequest(options, preparse = xml => {
      return xml;
    }) {
      const defaultOptions = {
        validateErrors: true,
        skipLoginLog: 0,
        parent: this.isParent,
        webServiceHandleName: 'PXPWebServices',
        paramStr: {},
        ...options
      };
      const expressUrl = Client.url;
      return new Promise((res, reject) => {
        const builder = new _fastXmlParser.XMLBuilder({
          ignoreAttributes: false,
          arrayNodeName: 'soap:Envelope',
          suppressEmptyNode: true
        });
        const xml = builder.build({
          'soap:Envelope': {
            '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            '@_xmlns:xsd': 'http://www.w3.org/2001/XMLSchema',
            '@_xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
            'soap:Body': {
              ProcessWebServiceRequestMultiWeb: {
                '@_xmlns': 'http://edupoint.com/webservices/',
                userID: this.username,
                password: this.password,
                ...defaultOptions,
                ...{
                  paramStr: Client.parseParamStr(defaultOptions.paramStr ?? {})
                }
              }
            }
          }
        });
        fetch(expressUrl + "/fulfillAxios", {
          'method': 'POST',
          'headers': {
            'Content-Type': 'application/json'
          },
          'body': JSON.stringify({
            'url': this.district,
            'xml': xml,
            'encrypted': this.encrypted
          })
        }).then(async response => {
          const realResponse = await response.json();
          if (!realResponse.status) {
            return reject(new Error(realResponse.message));
          } else {
            var data = realResponse.response;
          }
          console.log(data);
          const parser = new _fastXmlParser.XMLParser({});
          const result = parser.parse(data);
          const parserTwo = new _fastXmlParser.XMLParser({
            ignoreAttributes: false,
            isArray: () => {
              return true;
            },
            processEntities: false,
            parseAttributeValue: false,
            parseTagValue: false
          });
          const obj = parserTwo.parse(preparse(result['soap:Envelope']['soap:Body'].ProcessWebServiceRequestMultiWebResponse.ProcessWebServiceRequestMultiWebResult));
          if (defaultOptions.validateErrors && typeof obj === 'object' && 'RT_ERROR' in obj) {
            return reject(new _RequestException.default(obj));
          }
          console.log(JSON.stringify(obj), "captain, my captain");
          delete realResponse.response;
          delete realResponse.status;
          if (Object.keys(realResponse).length > 0) {
            obj.extraData = realResponse;
          }
          res(obj);
        }).catch(reject);
      });
    }
    static parseParamStr(input) {
      const builder = new _fastXmlParser.XMLBuilder({
        ignoreAttributes: false,
        arrayNodeName: 'Params',
        suppressEmptyNode: true,
        suppressBooleanAttributes: false
      });
      const xml = `<Parms>${builder.build(input)}</Parms>`;
      return xml;
    }
    static processAnonymousRequest(url, options = {}, preparse = d => {
      return d.replace(/&gt;/g, '>').replace(/&lt;/g, '<');
    }) {
      const defaultOptions = {
        skipLoginLog: 0,
        validateErrors: true,
        parent: 0,
        webServiceHandleName: 'HDInfoServices',
        methodName: 'GetMatchingDistrictList',
        paramStr: {},
        ...options
      };
      return new Promise((res, reject) => {
        const builder = new _fastXmlParser.XMLBuilder({
          ignoreAttributes: false,
          arrayNodeName: 'soap:Envelope',
          suppressEmptyNode: true
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
                ...{
                  paramStr: Client.parseParamStr(defaultOptions.paramStr ?? {})
                }
              }
            }
          }
        });
        _axios.default.post(url, xml, {
          headers: {
            'Content-Type': 'text/xml'
          }
        }).then(({
          data
        }) => {
          const parser = new _fastXmlParser.XMLParser({});
          const result = parser.parse(data);
          const parserTwo = new _fastXmlParser.XMLParser({
            ignoreAttributes: false
          });
          const obj = parserTwo.parse(preparse(result['soap:Envelope']['soap:Body'].ProcessWebServiceRequestResponse.ProcessWebServiceRequestResult));
          if (defaultOptions.validateErrors && typeof obj === 'object' && 'RT_ERROR' in obj) {
            return reject(new _RequestException.default(obj));
          }
          res(obj);
        }).catch(reject);
      });
    }
  }
  _exports.default = Client;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJDbGllbnQiLCJkaXN0cmljdCIsIl9fZGlzdHJpY3RfXyIsInVzZXJuYW1lIiwiX191c2VybmFtZV9fIiwicGFzc3dvcmQiLCJfX3Bhc3N3b3JkX18iLCJjcmVkZW50aWFscyIsImRpc3RyaWN0VXJsIiwiZW5jcnlwdGVkIiwiY29uc3RydWN0b3IiLCJQdXJsIiwiaXNQYXJlbnQiLCJjb25zb2xlIiwibG9nIiwidXJsIiwicHJvY2Vzc1JlcXVlc3QiLCJvcHRpb25zIiwicHJlcGFyc2UiLCJ4bWwiLCJkZWZhdWx0T3B0aW9ucyIsInZhbGlkYXRlRXJyb3JzIiwic2tpcExvZ2luTG9nIiwicGFyZW50Iiwid2ViU2VydmljZUhhbmRsZU5hbWUiLCJwYXJhbVN0ciIsImV4cHJlc3NVcmwiLCJQcm9taXNlIiwicmVzIiwicmVqZWN0IiwiYnVpbGRlciIsIlhNTEJ1aWxkZXIiLCJpZ25vcmVBdHRyaWJ1dGVzIiwiYXJyYXlOb2RlTmFtZSIsInN1cHByZXNzRW1wdHlOb2RlIiwiYnVpbGQiLCJQcm9jZXNzV2ViU2VydmljZVJlcXVlc3RNdWx0aVdlYiIsInVzZXJJRCIsInBhcnNlUGFyYW1TdHIiLCJmZXRjaCIsIkpTT04iLCJzdHJpbmdpZnkiLCJ0aGVuIiwicmVzcG9uc2UiLCJyZWFsUmVzcG9uc2UiLCJqc29uIiwic3RhdHVzIiwiRXJyb3IiLCJtZXNzYWdlIiwiZGF0YSIsInBhcnNlciIsIlhNTFBhcnNlciIsInJlc3VsdCIsInBhcnNlIiwicGFyc2VyVHdvIiwiaXNBcnJheSIsInByb2Nlc3NFbnRpdGllcyIsInBhcnNlQXR0cmlidXRlVmFsdWUiLCJwYXJzZVRhZ1ZhbHVlIiwib2JqIiwiUHJvY2Vzc1dlYlNlcnZpY2VSZXF1ZXN0TXVsdGlXZWJSZXNwb25zZSIsIlByb2Nlc3NXZWJTZXJ2aWNlUmVxdWVzdE11bHRpV2ViUmVzdWx0IiwiUmVxdWVzdEV4Y2VwdGlvbiIsIk9iamVjdCIsImtleXMiLCJsZW5ndGgiLCJleHRyYURhdGEiLCJjYXRjaCIsImlucHV0Iiwic3VwcHJlc3NCb29sZWFuQXR0cmlidXRlcyIsInByb2Nlc3NBbm9ueW1vdXNSZXF1ZXN0IiwiZCIsInJlcGxhY2UiLCJtZXRob2ROYW1lIiwiUHJvY2Vzc1dlYlNlcnZpY2VSZXF1ZXN0IiwiYXhpb3MiLCJwb3N0IiwiaGVhZGVycyIsIlByb2Nlc3NXZWJTZXJ2aWNlUmVxdWVzdFJlc3BvbnNlIiwiUHJvY2Vzc1dlYlNlcnZpY2VSZXF1ZXN0UmVzdWx0Il0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3V0aWxzL3NvYXAvQ2xpZW50L0NsaWVudC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXhpb3MgZnJvbSAnYXhpb3MnO1xyXG5pbXBvcnQgeyBYTUxCdWlsZGVyLCBYTUxQYXJzZXIgfSBmcm9tICdmYXN0LXhtbC1wYXJzZXInO1xyXG5pbXBvcnQge1xyXG4gIFBhcnNlZFJlcXVlc3RFcnJvcixcclxuICBSZXF1ZXN0T3B0aW9ucyxcclxuICBQYXJzZWRSZXF1ZXN0UmVzdWx0LFxyXG4gIFBhcnNlZEFub255bW91c1JlcXVlc3RFcnJvcixcclxuICBMb2dpbkNyZWRlbnRpYWxzLFxyXG59IGZyb20gJy4uLy4uLy4uL3V0aWxzL3NvYXAvQ2xpZW50L0NsaWVudC5pbnRlcmZhY2VzJztcclxuaW1wb3J0IFJlcXVlc3RFeGNlcHRpb24gZnJvbSAnLi4vLi4vLi4vU3R1ZGVudFZ1ZS9SZXF1ZXN0RXhjZXB0aW9uL1JlcXVlc3RFeGNlcHRpb24nO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ2xpZW50IHtcclxuICBwcml2YXRlIF9fdXNlcm5hbWVfXzogc3RyaW5nO1xyXG4gIHByaXZhdGUgX19wYXNzd29yZF9fOiBzdHJpbmc7XHJcbiAgcHJpdmF0ZSBfX2Rpc3RyaWN0X186IHN0cmluZztcclxuICBwcml2YXRlIHN0YXRpYyB1cmw6c3RyaW5nO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgaXNQYXJlbnQ6IG51bWJlcjtcclxuICBlbmNyeXB0ZWQ6IGJvb2xlYW47XHJcblxyXG4gIHB1YmxpYyBnZXQgZGlzdHJpY3QoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiB0aGlzLl9fZGlzdHJpY3RfXztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgdXNlcm5hbWUoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiB0aGlzLl9fdXNlcm5hbWVfXztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgcGFzc3dvcmQoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiB0aGlzLl9fcGFzc3dvcmRfXztcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBnZXQgY3JlZGVudGlhbHMoKTogTG9naW5DcmVkZW50aWFscyB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB1c2VybmFtZTogdGhpcy51c2VybmFtZSxcclxuICAgICAgcGFzc3dvcmQ6IHRoaXMucGFzc3dvcmQsXHJcbiAgICAgIGRpc3RyaWN0VXJsOiB0aGlzLmRpc3RyaWN0LFxyXG4gICAgICBlbmNyeXB0ZWQ6dGhpcy5lbmNyeXB0ZWRcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBjb25zdHJ1Y3RvcihjcmVkZW50aWFsczogTG9naW5DcmVkZW50aWFscyxQdXJsOnN0cmluZz1cImh0dHBzOi8vc3R1ZGVudHZ1ZWxpYi51cC5yYWlsd2F5LmFwcFwiKSB7XHJcbiAgICB0aGlzLl9fdXNlcm5hbWVfXyA9IGNyZWRlbnRpYWxzLnVzZXJuYW1lO1xyXG4gICAgdGhpcy5fX3Bhc3N3b3JkX18gPSBjcmVkZW50aWFscy5wYXNzd29yZDtcclxuICAgIHRoaXMuX19kaXN0cmljdF9fID0gY3JlZGVudGlhbHMuZGlzdHJpY3RVcmw7XHJcbiAgICB0aGlzLmlzUGFyZW50ID0gY3JlZGVudGlhbHMuaXNQYXJlbnQgPyAxIDogMDtcclxuICAgIHRoaXMuZW5jcnlwdGVkPWNyZWRlbnRpYWxzLmVuY3J5cHRlZDtcclxuICAgIGNvbnNvbGUubG9nKFwiaSBhbSB0aGUgY29uc3RydWN0b3JcIixQdXJsLENsaWVudC51cmwpXHJcbiAgICBDbGllbnQudXJsPVB1cmw7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGUgYSBQT1NUIHJlcXVlc3QgdG8gc3luZXJneSBzZXJ2ZXJzIHRvIGZldGNoIGRhdGFcclxuICAgKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIHRvIHByb3ZpZGUgd2hlbiBtYWtpbmcgYSBYTUwgcmVxdWVzdCB0byB0aGUgc2VydmVyc1xyXG4gICAqIEBwYXJhbSBwcmVwYXJzZSBSdW5zIGJlZm9yZSBwYXJzaW5nIHRoZSB4bWwgc3RyaW5nIGludG8gYW4gb2JqZWN0LiBVc2VmdWwgZm9yIG11dGF0aW5nIHhtbCB0aGF0IGNvdWxkIGJlIHBhcnNlZCBpbmNvcnJlY3RseSBieSBgZmFzdC14bWwtcGFyc2VyYFxyXG4gICAqIEByZXR1cm5zIFJldHVybnMgYW4gWE1MIG9iamVjdCB0aGF0IG11c3QgYmUgZGVmaW5lZCBpbiBhIHR5cGUgZGVjbGFyYXRpb24gZmlsZS5cclxuICAgKiBAc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9TdHVkZW50VnVlL2RvY3NcclxuICAgKiBAZGVzY3JpcHRpb25cclxuICAgKiBgYGBqc1xyXG4gICAqIHN1cGVyLnByb2Nlc3NSZXF1ZXN0KHsgbWV0aG9kTmFtZTogJ1JlZmVyIHRvIFN0dWRlbnRWdWUvZG9jcycsIHBhcmFtU3RyOiB7IEFueXRoaW5nVGhhdENhbkJlUGFzc2VkOiB0cnVlLCBBc0xvbmdBc0l0TWF0Y2hlc1RoZURvY3VtZW50YXRpb246IHRydWUgfX0pO1xyXG4gICAqIC8vIFRoaXMgd2lsbCBtYWtlIHRoZSBYTUwgcmVxdWVzdCBiZWxvdzpcclxuICAgKiBgYGBcclxuICAgKiBcclxuICAgKiBgYGB4bWxcclxuICAgKiA8c29hcDpFbnZlbG9wZSB4bWxuczp4c2k9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAxL1hNTFNjaGVtYS1pbnN0YW5jZVwiIHhtbG5zOnhzZD1cImh0dHA6Ly93d3cudzMub3JnLzIwMDEvWE1MU2NoZW1hXCIgeG1sbnM6c29hcD1cImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3NvYXAvZW52ZWxvcGUvXCI+XHJcbiAgICAgIDxzb2FwOkJvZHk+XHJcbiAgICAgICAgPFByb2Nlc3NXZWJTZXJ2aWNlUmVxdWVzdCB4bWxucz1cImh0dHA6Ly9lZHVwb2ludC5jb20vd2Vic2VydmljZXMvXCI+XHJcbiAgICAgICAgICAgIDx1c2VySUQ+U1RVREVOVF9VU0VSTkFNRTwvdXNlcklEPlxyXG4gICAgICAgICAgICA8cGFzc3dvcmQ+U1RVREVOVF9QQVNTV09SRDwvcGFzc3dvcmQ+XHJcbiAgICAgICAgICAgIDxza2lwTG9naW5Mb2c+MTwvc2tpcExvZ2luTG9nPlxyXG4gICAgICAgICAgICA8cGFyZW50PjA8L3BhcmVudD5cclxuICAgICAgICAgICAgPHdlYlNlcnZpY2VIYW5kbGVOYW1lPlBYUFdlYlNlcnZpY2VzPC93ZWJTZXJ2aWNlSGFuZGxlTmFtZT5cclxuICAgICAgICAgICAgPG1ldGhvZE5hbWU+UmVmZXIgdG8gU3R1ZGVudFZ1ZS9kb2NzPC9tZXRob2ROYW1lPlxyXG4gICAgICAgICAgICA8cGFyYW1TdHI+XHJcbiAgICAgICAgICAgICAgPEFueXRoaW5nVGhhdENhbkJlUGFzc2VkPnRydWU8L0FueXRoaW5nVGhhdENhbkJlUGFzc2VkPlxyXG4gICAgICAgICAgICAgIDxBc0xvbmdBc0l0TWF0Y2hlc1RoZURvY3VtZW50YXRpb24+dHJ1ZTwvQXNMb25nQXNJdE1hdGNoZXNUaGVEb2N1bWVudGF0aW9uPlxyXG4gICAgICAgICAgICA8L3BhcmFtU3RyPlxyXG4gICAgICAgIDwvUHJvY2Vzc1dlYlNlcnZpY2VSZXF1ZXN0PlxyXG4gICAgICA8L3NvYXA6Qm9keT5cclxuPC9zb2FwOkVudmVsb3BlPlxyXG4gICAqIGBgYFxyXG4gICAqL1xyXG4gIFxyXG4gIHB1YmxpYyBwcm9jZXNzUmVxdWVzdDxUIGV4dGVuZHMgb2JqZWN0IHwgdW5kZWZpbmVkPihcclxuICAgIG9wdGlvbnM6IFJlcXVlc3RPcHRpb25zLFxyXG4gICAgcHJlcGFyc2U6ICh4bWw6IHN0cmluZykgPT4gc3RyaW5nID0gKHhtbCkgPT4geG1sXHJcbiAgKTogUHJvbWlzZTxUPiB7XHJcbiAgICBjb25zdCBkZWZhdWx0T3B0aW9uczogUmVxdWVzdE9wdGlvbnMgPSB7XHJcbiAgICAgIHZhbGlkYXRlRXJyb3JzOiB0cnVlLFxyXG4gICAgICBza2lwTG9naW5Mb2c6IDAsXHJcbiAgICAgIHBhcmVudDogdGhpcy5pc1BhcmVudCxcclxuICAgICAgd2ViU2VydmljZUhhbmRsZU5hbWU6ICdQWFBXZWJTZXJ2aWNlcycsXHJcbiAgICAgIHBhcmFtU3RyOiB7fSxcclxuICAgICAgLi4ub3B0aW9ucyxcclxuICAgIH07XHJcbiAgICBjb25zdCBleHByZXNzVXJsPUNsaWVudC51cmw7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqZWN0KSA9PiB7XHJcbiAgICAgIGNvbnN0IGJ1aWxkZXIgPSBuZXcgWE1MQnVpbGRlcih7XHJcbiAgICAgICAgaWdub3JlQXR0cmlidXRlczogZmFsc2UsXHJcbiAgICAgICAgYXJyYXlOb2RlTmFtZTogJ3NvYXA6RW52ZWxvcGUnLFxyXG4gICAgICAgIHN1cHByZXNzRW1wdHlOb2RlOiB0cnVlLFxyXG4gICAgICB9KTtcclxuICAgICAgY29uc3QgeG1sID0gYnVpbGRlci5idWlsZCh7XHJcbiAgICAgICAgJ3NvYXA6RW52ZWxvcGUnOiB7XHJcbiAgICAgICAgICAnQF94bWxuczp4c2knOiAnaHR0cDovL3d3dy53My5vcmcvMjAwMS9YTUxTY2hlbWEtaW5zdGFuY2UnLFxyXG4gICAgICAgICAgJ0BfeG1sbnM6eHNkJzogJ2h0dHA6Ly93d3cudzMub3JnLzIwMDEvWE1MU2NoZW1hJyxcclxuICAgICAgICAgICdAX3htbG5zOnNvYXAnOiAnaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvc29hcC9lbnZlbG9wZS8nLFxyXG4gICAgICAgICAgJ3NvYXA6Qm9keSc6IHtcclxuICAgICAgICAgICAgUHJvY2Vzc1dlYlNlcnZpY2VSZXF1ZXN0TXVsdGlXZWI6IHtcclxuICAgICAgICAgICAgICAnQF94bWxucyc6ICdodHRwOi8vZWR1cG9pbnQuY29tL3dlYnNlcnZpY2VzLycsXHJcbiAgICAgICAgICAgICAgdXNlcklEOiB0aGlzLnVzZXJuYW1lLFxyXG4gICAgICAgICAgICAgIHBhc3N3b3JkOiB0aGlzLnBhc3N3b3JkLFxyXG4gICAgICAgICAgICAgIC4uLmRlZmF1bHRPcHRpb25zLFxyXG4gICAgICAgICAgICAgIC4uLnsgcGFyYW1TdHI6IENsaWVudC5wYXJzZVBhcmFtU3RyKGRlZmF1bHRPcHRpb25zLnBhcmFtU3RyID8/IHt9KSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgICAgZmV0Y2goZXhwcmVzc1VybCtcIi9mdWxmaWxsQXhpb3NcIix7XHJcbiAgICAgICAgJ21ldGhvZCc6J1BPU1QnLFxyXG4gICAgICAgICdoZWFkZXJzJzp7J0NvbnRlbnQtVHlwZSc6J2FwcGxpY2F0aW9uL2pzb24nfSxcclxuICAgICAgICAnYm9keSc6SlNPTi5zdHJpbmdpZnkoeyd1cmwnOnRoaXMuZGlzdHJpY3QsJ3htbCc6eG1sLCdlbmNyeXB0ZWQnOnRoaXMuZW5jcnlwdGVkfSlcclxuICAgIH0pXHJcbiAgICAgICAgLnRoZW4oYXN5bmMocmVzcG9uc2U6YW55KSA9PiB7XHJcbiAgICAgICAgICBjb25zdCByZWFsUmVzcG9uc2U9YXdhaXQgcmVzcG9uc2UuanNvbigpO1xyXG4gICAgICAgICAgaWYoIXJlYWxSZXNwb25zZS5zdGF0dXMpe3JldHVybiByZWplY3QobmV3IEVycm9yKHJlYWxSZXNwb25zZS5tZXNzYWdlKSl9XHJcbiAgICAgICAgICBlbHNle3ZhciBkYXRhPXJlYWxSZXNwb25zZS5yZXNwb25zZX1cclxuICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xyXG4gICAgICAgICAgY29uc3QgcGFyc2VyID0gbmV3IFhNTFBhcnNlcih7fSk7XHJcbiAgICAgICAgICBjb25zdCByZXN1bHQ6IFBhcnNlZFJlcXVlc3RSZXN1bHQgPSBwYXJzZXIucGFyc2UoZGF0YSk7XHJcbiAgICAgICAgICBjb25zdCBwYXJzZXJUd28gPSBuZXcgWE1MUGFyc2VyKHtcclxuICAgICAgICAgICAgaWdub3JlQXR0cmlidXRlczogZmFsc2UsXHJcbiAgICAgICAgICAgIGlzQXJyYXk6ICgpID0+IHRydWUsXHJcbiAgICAgICAgICAgIHByb2Nlc3NFbnRpdGllczogZmFsc2UsXHJcbiAgICAgICAgICAgIHBhcnNlQXR0cmlidXRlVmFsdWU6IGZhbHNlLFxyXG4gICAgICAgICAgICBwYXJzZVRhZ1ZhbHVlOiBmYWxzZSxcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIGNvbnN0IG9iajogYW55IHwgUGFyc2VkUmVxdWVzdEVycm9yID0gcGFyc2VyVHdvLnBhcnNlKFxyXG4gICAgICAgICAgICBwcmVwYXJzZShcclxuICAgICAgICAgICAgICByZXN1bHRbJ3NvYXA6RW52ZWxvcGUnXVsnc29hcDpCb2R5J10uUHJvY2Vzc1dlYlNlcnZpY2VSZXF1ZXN0TXVsdGlXZWJSZXNwb25zZS5Qcm9jZXNzV2ViU2VydmljZVJlcXVlc3RNdWx0aVdlYlJlc3VsdFxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgIGlmIChkZWZhdWx0T3B0aW9ucy52YWxpZGF0ZUVycm9ycyAmJiB0eXBlb2Ygb2JqID09PSAnb2JqZWN0JyAmJiAnUlRfRVJST1InIGluIG9iail7XHJcbiAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3IFJlcXVlc3RFeGNlcHRpb24ob2JqKSk7fVxyXG5cclxuICAgICAgICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KG9iaiksXCJjYXB0YWluLCBteSBjYXB0YWluXCIpXHJcbiAgICAgICAgIGRlbGV0ZSByZWFsUmVzcG9uc2UucmVzcG9uc2U7ZGVsZXRlIHJlYWxSZXNwb25zZS5zdGF0dXM7XHJcbiAgICAgICAgIGlmKE9iamVjdC5rZXlzKHJlYWxSZXNwb25zZSkubGVuZ3RoPjApe1xyXG4gICAgICAgICAgb2JqLmV4dHJhRGF0YT1yZWFsUmVzcG9uc2VcclxuICAgICAgICAgfVxyXG4gICAgICAgICAgcmVzKG9iaiBhcyBUKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChyZWplY3QpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHN0YXRpYyBwYXJzZVBhcmFtU3RyKGlucHV0OiBvYmplY3QpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgYnVpbGRlciA9IG5ldyBYTUxCdWlsZGVyKHtcclxuICAgICAgaWdub3JlQXR0cmlidXRlczogZmFsc2UsXHJcbiAgICAgIGFycmF5Tm9kZU5hbWU6ICdQYXJhbXMnLFxyXG4gICAgICBzdXBwcmVzc0VtcHR5Tm9kZTogdHJ1ZSxcclxuICAgICAgc3VwcHJlc3NCb29sZWFuQXR0cmlidXRlczogZmFsc2UsXHJcbiAgICB9KTtcclxuICAgIGNvbnN0IHhtbCA9IGA8UGFybXM+JHtidWlsZGVyLmJ1aWxkKGlucHV0KX08L1Bhcm1zPmA7XHJcbiAgICByZXR1cm4geG1sO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHN0YXRpYyBwcm9jZXNzQW5vbnltb3VzUmVxdWVzdDxUIGV4dGVuZHMgb2JqZWN0IHwgdW5kZWZpbmVkPihcclxuICAgIHVybDogc3RyaW5nLFxyXG4gICAgb3B0aW9uczogUGFydGlhbDxSZXF1ZXN0T3B0aW9ucz4gPSB7fSxcclxuICAgIHByZXBhcnNlOiAoeG1sOiBzdHJpbmcpID0+IHN0cmluZyA9IChkKSA9PiBkLnJlcGxhY2UoLyZndDsvZywgJz4nKS5yZXBsYWNlKC8mbHQ7L2csICc8JylcclxuICApOiBQcm9taXNlPFQ+IHtcclxuICAgIGNvbnN0IGRlZmF1bHRPcHRpb25zOiBSZXF1ZXN0T3B0aW9ucyA9IHtcclxuICAgICAgc2tpcExvZ2luTG9nOiAwLFxyXG4gICAgICB2YWxpZGF0ZUVycm9yczogdHJ1ZSxcclxuICAgICAgcGFyZW50OiAwLFxyXG4gICAgICB3ZWJTZXJ2aWNlSGFuZGxlTmFtZTogJ0hESW5mb1NlcnZpY2VzJyxcclxuICAgICAgbWV0aG9kTmFtZTogJ0dldE1hdGNoaW5nRGlzdHJpY3RMaXN0JyxcclxuICAgICAgcGFyYW1TdHI6IHt9LFxyXG4gICAgICAuLi5vcHRpb25zLFxyXG4gICAgfTtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxUPigocmVzLCByZWplY3QpID0+IHtcclxuICAgICAgY29uc3QgYnVpbGRlciA9IG5ldyBYTUxCdWlsZGVyKHtcclxuICAgICAgICBpZ25vcmVBdHRyaWJ1dGVzOiBmYWxzZSxcclxuICAgICAgICBhcnJheU5vZGVOYW1lOiAnc29hcDpFbnZlbG9wZScsXHJcbiAgICAgICAgc3VwcHJlc3NFbXB0eU5vZGU6IHRydWUsXHJcbiAgICAgIH0pO1xyXG4gICAgICBjb25zdCB4bWwgPSBidWlsZGVyLmJ1aWxkKHtcclxuICAgICAgICAnc29hcDpFbnZlbG9wZSc6IHtcclxuICAgICAgICAgICdAX3htbG5zOnhzaSc6ICdodHRwOi8vd3d3LnczLm9yZy8yMDAxL1hNTFNjaGVtYS1pbnN0YW5jZScsXHJcbiAgICAgICAgICAnQF94bWxuczp4c2QnOiAnaHR0cDovL3d3dy53My5vcmcvMjAwMS9YTUxTY2hlbWEnLFxyXG4gICAgICAgICAgJ0BfeG1sbnM6c29hcCc6ICdodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy9zb2FwL2VudmVsb3BlLycsXHJcbiAgICAgICAgICAnc29hcDpCb2R5Jzoge1xyXG4gICAgICAgICAgICBQcm9jZXNzV2ViU2VydmljZVJlcXVlc3Q6IHtcclxuICAgICAgICAgICAgICAnQF94bWxucyc6ICdodHRwOi8vZWR1cG9pbnQuY29tL3dlYnNlcnZpY2VzLycsXHJcbiAgICAgICAgICAgICAgdXNlcklEOiAnRWR1cG9pbnREaXN0cmljdEluZm8nLFxyXG4gICAgICAgICAgICAgIHBhc3N3b3JkOiAnRWR1cDAxbnQnLFxyXG4gICAgICAgICAgICAgIC4uLmRlZmF1bHRPcHRpb25zLFxyXG4gICAgICAgICAgICAgIC4uLnsgcGFyYW1TdHI6IENsaWVudC5wYXJzZVBhcmFtU3RyKGRlZmF1bHRPcHRpb25zLnBhcmFtU3RyID8/IHt9KSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGF4aW9zXHJcbiAgICAgICAgLnBvc3Q8c3RyaW5nPih1cmwsIHhtbCwgeyBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAndGV4dC94bWwnIH0gfSlcclxuICAgICAgICAudGhlbigoeyBkYXRhIH06e2RhdGE6YW55fSkgPT4ge1xyXG4gICAgICAgICAgY29uc3QgcGFyc2VyID0gbmV3IFhNTFBhcnNlcih7fSk7XHJcbiAgICAgICAgICBjb25zdCByZXN1bHQ6IFBhcnNlZFJlcXVlc3RSZXN1bHQgPSBwYXJzZXIucGFyc2UoZGF0YSk7XHJcbiAgICAgICAgICBjb25zdCBwYXJzZXJUd28gPSBuZXcgWE1MUGFyc2VyKHsgaWdub3JlQXR0cmlidXRlczogZmFsc2UgfSk7XHJcblxyXG4gICAgICAgICAgY29uc3Qgb2JqOiBUIHwgUGFyc2VkQW5vbnltb3VzUmVxdWVzdEVycm9yID0gcGFyc2VyVHdvLnBhcnNlKFxyXG4gICAgICAgICAgICBwcmVwYXJzZShcclxuICAgICAgICAgICAgICByZXN1bHRbJ3NvYXA6RW52ZWxvcGUnXVsnc29hcDpCb2R5J10uUHJvY2Vzc1dlYlNlcnZpY2VSZXF1ZXN0UmVzcG9uc2UuUHJvY2Vzc1dlYlNlcnZpY2VSZXF1ZXN0UmVzdWx0XHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgaWYgKGRlZmF1bHRPcHRpb25zLnZhbGlkYXRlRXJyb3JzICYmIHR5cGVvZiBvYmogPT09ICdvYmplY3QnICYmICdSVF9FUlJPUicgaW4gb2JqKVxyXG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBSZXF1ZXN0RXhjZXB0aW9uKG9iaikpO1xyXG5cclxuICAgICAgICAgIHJlcyhvYmogYXMgVCk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2gocmVqZWN0KTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7RUFXZSxNQUFNQSxNQUFNLENBQUM7SUFRMUIsSUFBV0MsUUFBUSxHQUFXO01BQzVCLE9BQU8sSUFBSSxDQUFDQyxZQUFZO0lBQzFCO0lBRUEsSUFBV0MsUUFBUSxHQUFXO01BQzVCLE9BQU8sSUFBSSxDQUFDQyxZQUFZO0lBQzFCO0lBRUEsSUFBV0MsUUFBUSxHQUFXO01BQzVCLE9BQU8sSUFBSSxDQUFDQyxZQUFZO0lBQzFCO0lBRUEsSUFBY0MsV0FBVyxHQUFxQjtNQUM1QyxPQUFPO1FBQ0xKLFFBQVEsRUFBRSxJQUFJLENBQUNBLFFBQVE7UUFDdkJFLFFBQVEsRUFBRSxJQUFJLENBQUNBLFFBQVE7UUFDdkJHLFdBQVcsRUFBRSxJQUFJLENBQUNQLFFBQVE7UUFDMUJRLFNBQVMsRUFBQyxJQUFJLENBQUNBO01BQ2pCLENBQUM7SUFDSDtJQUVBQyxXQUFXLENBQUNILFdBQTZCLEVBQUNJLElBQVcsR0FBQyxzQ0FBc0MsRUFBRTtNQUM1RixJQUFJLENBQUNQLFlBQVksR0FBR0csV0FBVyxDQUFDSixRQUFRO01BQ3hDLElBQUksQ0FBQ0csWUFBWSxHQUFHQyxXQUFXLENBQUNGLFFBQVE7TUFDeEMsSUFBSSxDQUFDSCxZQUFZLEdBQUdLLFdBQVcsQ0FBQ0MsV0FBVztNQUMzQyxJQUFJLENBQUNJLFFBQVEsR0FBR0wsV0FBVyxDQUFDSyxRQUFRLEdBQUcsQ0FBQyxHQUFHLENBQUM7TUFDNUMsSUFBSSxDQUFDSCxTQUFTLEdBQUNGLFdBQVcsQ0FBQ0UsU0FBUztNQUNwQ0ksT0FBTyxDQUFDQyxHQUFHLENBQUMsc0JBQXNCLEVBQUNILElBQUksRUFBQ1gsTUFBTSxDQUFDZSxHQUFHLENBQUM7TUFDbkRmLE1BQU0sQ0FBQ2UsR0FBRyxHQUFDSixJQUFJO0lBQ2pCOztJQUVBO0FB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