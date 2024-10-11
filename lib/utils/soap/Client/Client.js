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
        districtUrl: this.district
      };
    }
    constructor(credentials) {
      this.__username__ = credentials.username;
      this.__password__ = credentials.password;
      this.__district__ = credentials.districtUrl;
      this.isParent = credentials.isParent ? 1 : 0;
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
      const expressUrl = "https://studentvuelib.up.railway.app";
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
            'encrypted': this.encrypted,
            'password': this.password
          })
        }).then(async response => {
          const realResponse = await response.json();
          if (!realResponse.status) {
            return reject(new Error(realResponse.message));
          } else {
            var data = realResponse.response;
          }
          console.log("KILL ME");
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
          console.log("TO DEATH I RIDE");
          console.log(obj);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJDbGllbnQiLCJkaXN0cmljdCIsIl9fZGlzdHJpY3RfXyIsInVzZXJuYW1lIiwiX191c2VybmFtZV9fIiwicGFzc3dvcmQiLCJfX3Bhc3N3b3JkX18iLCJjcmVkZW50aWFscyIsImRpc3RyaWN0VXJsIiwiY29uc3RydWN0b3IiLCJpc1BhcmVudCIsInByb2Nlc3NSZXF1ZXN0Iiwib3B0aW9ucyIsInByZXBhcnNlIiwieG1sIiwiZGVmYXVsdE9wdGlvbnMiLCJ2YWxpZGF0ZUVycm9ycyIsInNraXBMb2dpbkxvZyIsInBhcmVudCIsIndlYlNlcnZpY2VIYW5kbGVOYW1lIiwicGFyYW1TdHIiLCJleHByZXNzVXJsIiwiUHJvbWlzZSIsInJlcyIsInJlamVjdCIsImJ1aWxkZXIiLCJYTUxCdWlsZGVyIiwiaWdub3JlQXR0cmlidXRlcyIsImFycmF5Tm9kZU5hbWUiLCJzdXBwcmVzc0VtcHR5Tm9kZSIsImJ1aWxkIiwiUHJvY2Vzc1dlYlNlcnZpY2VSZXF1ZXN0TXVsdGlXZWIiLCJ1c2VySUQiLCJwYXJzZVBhcmFtU3RyIiwiZmV0Y2giLCJKU09OIiwic3RyaW5naWZ5IiwiZW5jcnlwdGVkIiwidGhlbiIsInJlc3BvbnNlIiwicmVhbFJlc3BvbnNlIiwianNvbiIsInN0YXR1cyIsIkVycm9yIiwibWVzc2FnZSIsImRhdGEiLCJjb25zb2xlIiwibG9nIiwicGFyc2VyIiwiWE1MUGFyc2VyIiwicmVzdWx0IiwicGFyc2UiLCJwYXJzZXJUd28iLCJpc0FycmF5IiwicHJvY2Vzc0VudGl0aWVzIiwicGFyc2VBdHRyaWJ1dGVWYWx1ZSIsInBhcnNlVGFnVmFsdWUiLCJvYmoiLCJQcm9jZXNzV2ViU2VydmljZVJlcXVlc3RNdWx0aVdlYlJlc3BvbnNlIiwiUHJvY2Vzc1dlYlNlcnZpY2VSZXF1ZXN0TXVsdGlXZWJSZXN1bHQiLCJSZXF1ZXN0RXhjZXB0aW9uIiwiY2F0Y2giLCJpbnB1dCIsInN1cHByZXNzQm9vbGVhbkF0dHJpYnV0ZXMiLCJwcm9jZXNzQW5vbnltb3VzUmVxdWVzdCIsInVybCIsImQiLCJyZXBsYWNlIiwibWV0aG9kTmFtZSIsIlByb2Nlc3NXZWJTZXJ2aWNlUmVxdWVzdCIsImF4aW9zIiwicG9zdCIsImhlYWRlcnMiLCJQcm9jZXNzV2ViU2VydmljZVJlcXVlc3RSZXNwb25zZSIsIlByb2Nlc3NXZWJTZXJ2aWNlUmVxdWVzdFJlc3VsdCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy91dGlscy9zb2FwL0NsaWVudC9DbGllbnQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGF4aW9zIGZyb20gJ2F4aW9zJztcclxuaW1wb3J0IHsgWE1MQnVpbGRlciwgWE1MUGFyc2VyIH0gZnJvbSAnZmFzdC14bWwtcGFyc2VyJztcclxuaW1wb3J0IHtcclxuICBQYXJzZWRSZXF1ZXN0RXJyb3IsXHJcbiAgUmVxdWVzdE9wdGlvbnMsXHJcbiAgUGFyc2VkUmVxdWVzdFJlc3VsdCxcclxuICBQYXJzZWRBbm9ueW1vdXNSZXF1ZXN0RXJyb3IsXHJcbiAgTG9naW5DcmVkZW50aWFscyxcclxufSBmcm9tICcuLi8uLi8uLi91dGlscy9zb2FwL0NsaWVudC9DbGllbnQuaW50ZXJmYWNlcyc7XHJcbmltcG9ydCBSZXF1ZXN0RXhjZXB0aW9uIGZyb20gJy4uLy4uLy4uL1N0dWRlbnRWdWUvUmVxdWVzdEV4Y2VwdGlvbi9SZXF1ZXN0RXhjZXB0aW9uJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENsaWVudCB7XHJcbiAgcHJpdmF0ZSBfX3VzZXJuYW1lX186IHN0cmluZztcclxuICBwcml2YXRlIF9fcGFzc3dvcmRfXzogc3RyaW5nO1xyXG4gIHByaXZhdGUgX19kaXN0cmljdF9fOiBzdHJpbmc7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBpc1BhcmVudDogbnVtYmVyO1xyXG4gIGVuY3J5cHRlZDogYW55O1xyXG5cclxuICBwcml2YXRlIGdldCBkaXN0cmljdCgpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHRoaXMuX19kaXN0cmljdF9fO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBnZXQgdXNlcm5hbWUoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiB0aGlzLl9fdXNlcm5hbWVfXztcclxuICB9XHJcblxyXG4gIHByaXZhdGUgZ2V0IHBhc3N3b3JkKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gdGhpcy5fX3Bhc3N3b3JkX187XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgZ2V0IGNyZWRlbnRpYWxzKCk6IExvZ2luQ3JlZGVudGlhbHMge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdXNlcm5hbWU6IHRoaXMudXNlcm5hbWUsXHJcbiAgICAgIHBhc3N3b3JkOiB0aGlzLnBhc3N3b3JkLFxyXG4gICAgICBkaXN0cmljdFVybDogdGhpcy5kaXN0cmljdCxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBjb25zdHJ1Y3RvcihjcmVkZW50aWFsczogTG9naW5DcmVkZW50aWFscykge1xyXG4gICAgdGhpcy5fX3VzZXJuYW1lX18gPSBjcmVkZW50aWFscy51c2VybmFtZTtcclxuICAgIHRoaXMuX19wYXNzd29yZF9fID0gY3JlZGVudGlhbHMucGFzc3dvcmQ7XHJcbiAgICB0aGlzLl9fZGlzdHJpY3RfXyA9IGNyZWRlbnRpYWxzLmRpc3RyaWN0VXJsO1xyXG4gICAgdGhpcy5pc1BhcmVudCA9IGNyZWRlbnRpYWxzLmlzUGFyZW50ID8gMSA6IDA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGUgYSBQT1NUIHJlcXVlc3QgdG8gc3luZXJneSBzZXJ2ZXJzIHRvIGZldGNoIGRhdGFcclxuICAgKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIHRvIHByb3ZpZGUgd2hlbiBtYWtpbmcgYSBYTUwgcmVxdWVzdCB0byB0aGUgc2VydmVyc1xyXG4gICAqIEBwYXJhbSBwcmVwYXJzZSBSdW5zIGJlZm9yZSBwYXJzaW5nIHRoZSB4bWwgc3RyaW5nIGludG8gYW4gb2JqZWN0LiBVc2VmdWwgZm9yIG11dGF0aW5nIHhtbCB0aGF0IGNvdWxkIGJlIHBhcnNlZCBpbmNvcnJlY3RseSBieSBgZmFzdC14bWwtcGFyc2VyYFxyXG4gICAqIEByZXR1cm5zIFJldHVybnMgYW4gWE1MIG9iamVjdCB0aGF0IG11c3QgYmUgZGVmaW5lZCBpbiBhIHR5cGUgZGVjbGFyYXRpb24gZmlsZS5cclxuICAgKiBAc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9TdHVkZW50VnVlL2RvY3NcclxuICAgKiBAZGVzY3JpcHRpb25cclxuICAgKiBgYGBqc1xyXG4gICAqIHN1cGVyLnByb2Nlc3NSZXF1ZXN0KHsgbWV0aG9kTmFtZTogJ1JlZmVyIHRvIFN0dWRlbnRWdWUvZG9jcycsIHBhcmFtU3RyOiB7IEFueXRoaW5nVGhhdENhbkJlUGFzc2VkOiB0cnVlLCBBc0xvbmdBc0l0TWF0Y2hlc1RoZURvY3VtZW50YXRpb246IHRydWUgfX0pO1xyXG4gICAqIC8vIFRoaXMgd2lsbCBtYWtlIHRoZSBYTUwgcmVxdWVzdCBiZWxvdzpcclxuICAgKiBgYGBcclxuICAgKiBcclxuICAgKiBgYGB4bWxcclxuICAgKiA8c29hcDpFbnZlbG9wZSB4bWxuczp4c2k9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAxL1hNTFNjaGVtYS1pbnN0YW5jZVwiIHhtbG5zOnhzZD1cImh0dHA6Ly93d3cudzMub3JnLzIwMDEvWE1MU2NoZW1hXCIgeG1sbnM6c29hcD1cImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3NvYXAvZW52ZWxvcGUvXCI+XHJcbiAgICAgIDxzb2FwOkJvZHk+XHJcbiAgICAgICAgPFByb2Nlc3NXZWJTZXJ2aWNlUmVxdWVzdCB4bWxucz1cImh0dHA6Ly9lZHVwb2ludC5jb20vd2Vic2VydmljZXMvXCI+XHJcbiAgICAgICAgICAgIDx1c2VySUQ+U1RVREVOVF9VU0VSTkFNRTwvdXNlcklEPlxyXG4gICAgICAgICAgICA8cGFzc3dvcmQ+U1RVREVOVF9QQVNTV09SRDwvcGFzc3dvcmQ+XHJcbiAgICAgICAgICAgIDxza2lwTG9naW5Mb2c+MTwvc2tpcExvZ2luTG9nPlxyXG4gICAgICAgICAgICA8cGFyZW50PjA8L3BhcmVudD5cclxuICAgICAgICAgICAgPHdlYlNlcnZpY2VIYW5kbGVOYW1lPlBYUFdlYlNlcnZpY2VzPC93ZWJTZXJ2aWNlSGFuZGxlTmFtZT5cclxuICAgICAgICAgICAgPG1ldGhvZE5hbWU+UmVmZXIgdG8gU3R1ZGVudFZ1ZS9kb2NzPC9tZXRob2ROYW1lPlxyXG4gICAgICAgICAgICA8cGFyYW1TdHI+XHJcbiAgICAgICAgICAgICAgPEFueXRoaW5nVGhhdENhbkJlUGFzc2VkPnRydWU8L0FueXRoaW5nVGhhdENhbkJlUGFzc2VkPlxyXG4gICAgICAgICAgICAgIDxBc0xvbmdBc0l0TWF0Y2hlc1RoZURvY3VtZW50YXRpb24+dHJ1ZTwvQXNMb25nQXNJdE1hdGNoZXNUaGVEb2N1bWVudGF0aW9uPlxyXG4gICAgICAgICAgICA8L3BhcmFtU3RyPlxyXG4gICAgICAgIDwvUHJvY2Vzc1dlYlNlcnZpY2VSZXF1ZXN0PlxyXG4gICAgICA8L3NvYXA6Qm9keT5cclxuPC9zb2FwOkVudmVsb3BlPlxyXG4gICAqIGBgYFxyXG4gICAqL1xyXG4gIFxyXG4gIHByb3RlY3RlZCBwcm9jZXNzUmVxdWVzdDxUIGV4dGVuZHMgb2JqZWN0IHwgdW5kZWZpbmVkPihcclxuICAgIG9wdGlvbnM6IFJlcXVlc3RPcHRpb25zLFxyXG4gICAgcHJlcGFyc2U6ICh4bWw6IHN0cmluZykgPT4gc3RyaW5nID0gKHhtbCkgPT4geG1sXHJcbiAgKTogUHJvbWlzZTxUPiB7XHJcbiAgICBjb25zdCBkZWZhdWx0T3B0aW9uczogUmVxdWVzdE9wdGlvbnMgPSB7XHJcbiAgICAgIHZhbGlkYXRlRXJyb3JzOiB0cnVlLFxyXG4gICAgICBza2lwTG9naW5Mb2c6IDAsXHJcbiAgICAgIHBhcmVudDogdGhpcy5pc1BhcmVudCxcclxuICAgICAgd2ViU2VydmljZUhhbmRsZU5hbWU6ICdQWFBXZWJTZXJ2aWNlcycsXHJcbiAgICAgIHBhcmFtU3RyOiB7fSxcclxuICAgICAgLi4ub3B0aW9ucyxcclxuICAgIH07XHJcbiAgICBjb25zdCBleHByZXNzVXJsPVwiaHR0cHM6Ly9ub2RlanMtcHJvZHVjdGlvbi01ZWU1LnVwLnJhaWx3YXkuYXBwXCJcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWplY3QpID0+IHtcclxuICAgICAgY29uc3QgYnVpbGRlciA9IG5ldyBYTUxCdWlsZGVyKHtcclxuICAgICAgICBpZ25vcmVBdHRyaWJ1dGVzOiBmYWxzZSxcclxuICAgICAgICBhcnJheU5vZGVOYW1lOiAnc29hcDpFbnZlbG9wZScsXHJcbiAgICAgICAgc3VwcHJlc3NFbXB0eU5vZGU6IHRydWUsXHJcbiAgICAgIH0pO1xyXG4gICAgICBjb25zdCB4bWwgPSBidWlsZGVyLmJ1aWxkKHtcclxuICAgICAgICAnc29hcDpFbnZlbG9wZSc6IHtcclxuICAgICAgICAgICdAX3htbG5zOnhzaSc6ICdodHRwOi8vd3d3LnczLm9yZy8yMDAxL1hNTFNjaGVtYS1pbnN0YW5jZScsXHJcbiAgICAgICAgICAnQF94bWxuczp4c2QnOiAnaHR0cDovL3d3dy53My5vcmcvMjAwMS9YTUxTY2hlbWEnLFxyXG4gICAgICAgICAgJ0BfeG1sbnM6c29hcCc6ICdodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy9zb2FwL2VudmVsb3BlLycsXHJcbiAgICAgICAgICAnc29hcDpCb2R5Jzoge1xyXG4gICAgICAgICAgICBQcm9jZXNzV2ViU2VydmljZVJlcXVlc3RNdWx0aVdlYjoge1xyXG4gICAgICAgICAgICAgICdAX3htbG5zJzogJ2h0dHA6Ly9lZHVwb2ludC5jb20vd2Vic2VydmljZXMvJyxcclxuICAgICAgICAgICAgICB1c2VySUQ6IHRoaXMudXNlcm5hbWUsXHJcbiAgICAgICAgICAgICAgcGFzc3dvcmQ6IHRoaXMucGFzc3dvcmQsXHJcbiAgICAgICAgICAgICAgLi4uZGVmYXVsdE9wdGlvbnMsXHJcbiAgICAgICAgICAgICAgLi4ueyBwYXJhbVN0cjogQ2xpZW50LnBhcnNlUGFyYW1TdHIoZGVmYXVsdE9wdGlvbnMucGFyYW1TdHIgPz8ge30pIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgICBmZXRjaChleHByZXNzVXJsK1wiL2Z1bGZpbGxBeGlvc1wiLHtcclxuICAgICAgICAnbWV0aG9kJzonUE9TVCcsXHJcbiAgICAgICAgJ2hlYWRlcnMnOnsnQ29udGVudC1UeXBlJzonYXBwbGljYXRpb24vanNvbid9LFxyXG4gICAgICAgICdib2R5JzpKU09OLnN0cmluZ2lmeSh7J3VybCc6dGhpcy5kaXN0cmljdCwneG1sJzp4bWwsJ2VuY3J5cHRlZCc6dGhpcy5lbmNyeXB0ZWQsJ3Bhc3N3b3JkJzp0aGlzLnBhc3N3b3JkfSlcclxuICAgIH0pXHJcbiAgICAgICAgLnRoZW4oYXN5bmMocmVzcG9uc2U6YW55KSA9PiB7XHJcbiAgICAgICAgICBjb25zdCByZWFsUmVzcG9uc2U9YXdhaXQgcmVzcG9uc2UuanNvbigpXHJcbiAgICAgICAgICBpZighcmVhbFJlc3BvbnNlLnN0YXR1cyl7cmV0dXJuIHJlamVjdChuZXcgRXJyb3IocmVhbFJlc3BvbnNlLm1lc3NhZ2UpKX1cclxuICAgICAgICAgIGVsc2V7dmFyIGRhdGE9cmVhbFJlc3BvbnNlLnJlc3BvbnNlfVxyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJLSUxMIE1FXCIpO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XHJcbiAgICAgICAgICBjb25zdCBwYXJzZXIgPSBuZXcgWE1MUGFyc2VyKHt9KTtcclxuICAgICAgICAgIGNvbnN0IHJlc3VsdDogUGFyc2VkUmVxdWVzdFJlc3VsdCA9IHBhcnNlci5wYXJzZShkYXRhKTtcclxuICAgICAgICAgIGNvbnN0IHBhcnNlclR3byA9IG5ldyBYTUxQYXJzZXIoe1xyXG4gICAgICAgICAgICBpZ25vcmVBdHRyaWJ1dGVzOiBmYWxzZSxcclxuICAgICAgICAgICAgaXNBcnJheTogKCkgPT4gdHJ1ZSxcclxuICAgICAgICAgICAgcHJvY2Vzc0VudGl0aWVzOiBmYWxzZSxcclxuICAgICAgICAgICAgcGFyc2VBdHRyaWJ1dGVWYWx1ZTogZmFsc2UsXHJcbiAgICAgICAgICAgIHBhcnNlVGFnVmFsdWU6IGZhbHNlLFxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgY29uc3Qgb2JqOiBUIHwgUGFyc2VkUmVxdWVzdEVycm9yID0gcGFyc2VyVHdvLnBhcnNlKFxyXG4gICAgICAgICAgICBwcmVwYXJzZShcclxuICAgICAgICAgICAgICByZXN1bHRbJ3NvYXA6RW52ZWxvcGUnXVsnc29hcDpCb2R5J10uUHJvY2Vzc1dlYlNlcnZpY2VSZXF1ZXN0TXVsdGlXZWJSZXNwb25zZS5Qcm9jZXNzV2ViU2VydmljZVJlcXVlc3RNdWx0aVdlYlJlc3VsdFxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgIGlmIChkZWZhdWx0T3B0aW9ucy52YWxpZGF0ZUVycm9ycyAmJiB0eXBlb2Ygb2JqID09PSAnb2JqZWN0JyAmJiAnUlRfRVJST1InIGluIG9iailcclxuICAgICAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgUmVxdWVzdEV4Y2VwdGlvbihvYmopKTtcclxuXHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIlRPIERFQVRIIEkgUklERVwiKVxyXG4gICAgICAgICAgY29uc29sZS5sb2cob2JqKVxyXG4gICAgICAgICAgcmVzKG9iaiBhcyBUKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChyZWplY3QpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHN0YXRpYyBwYXJzZVBhcmFtU3RyKGlucHV0OiBvYmplY3QpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgYnVpbGRlciA9IG5ldyBYTUxCdWlsZGVyKHtcclxuICAgICAgaWdub3JlQXR0cmlidXRlczogZmFsc2UsXHJcbiAgICAgIGFycmF5Tm9kZU5hbWU6ICdQYXJhbXMnLFxyXG4gICAgICBzdXBwcmVzc0VtcHR5Tm9kZTogdHJ1ZSxcclxuICAgICAgc3VwcHJlc3NCb29sZWFuQXR0cmlidXRlczogZmFsc2UsXHJcbiAgICB9KTtcclxuICAgIGNvbnN0IHhtbCA9IGA8UGFybXM+JHtidWlsZGVyLmJ1aWxkKGlucHV0KX08L1Bhcm1zPmA7XHJcbiAgICByZXR1cm4geG1sO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHN0YXRpYyBwcm9jZXNzQW5vbnltb3VzUmVxdWVzdDxUIGV4dGVuZHMgb2JqZWN0IHwgdW5kZWZpbmVkPihcclxuICAgIHVybDogc3RyaW5nLFxyXG4gICAgb3B0aW9uczogUGFydGlhbDxSZXF1ZXN0T3B0aW9ucz4gPSB7fSxcclxuICAgIHByZXBhcnNlOiAoeG1sOiBzdHJpbmcpID0+IHN0cmluZyA9IChkKSA9PiBkLnJlcGxhY2UoLyZndDsvZywgJz4nKS5yZXBsYWNlKC8mbHQ7L2csICc8JylcclxuICApOiBQcm9taXNlPFQ+IHtcclxuICAgIGNvbnN0IGRlZmF1bHRPcHRpb25zOiBSZXF1ZXN0T3B0aW9ucyA9IHtcclxuICAgICAgc2tpcExvZ2luTG9nOiAwLFxyXG4gICAgICB2YWxpZGF0ZUVycm9yczogdHJ1ZSxcclxuICAgICAgcGFyZW50OiAwLFxyXG4gICAgICB3ZWJTZXJ2aWNlSGFuZGxlTmFtZTogJ0hESW5mb1NlcnZpY2VzJyxcclxuICAgICAgbWV0aG9kTmFtZTogJ0dldE1hdGNoaW5nRGlzdHJpY3RMaXN0JyxcclxuICAgICAgcGFyYW1TdHI6IHt9LFxyXG4gICAgICAuLi5vcHRpb25zLFxyXG4gICAgfTtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxUPigocmVzLCByZWplY3QpID0+IHtcclxuICAgICAgY29uc3QgYnVpbGRlciA9IG5ldyBYTUxCdWlsZGVyKHtcclxuICAgICAgICBpZ25vcmVBdHRyaWJ1dGVzOiBmYWxzZSxcclxuICAgICAgICBhcnJheU5vZGVOYW1lOiAnc29hcDpFbnZlbG9wZScsXHJcbiAgICAgICAgc3VwcHJlc3NFbXB0eU5vZGU6IHRydWUsXHJcbiAgICAgIH0pO1xyXG4gICAgICBjb25zdCB4bWwgPSBidWlsZGVyLmJ1aWxkKHtcclxuICAgICAgICAnc29hcDpFbnZlbG9wZSc6IHtcclxuICAgICAgICAgICdAX3htbG5zOnhzaSc6ICdodHRwOi8vd3d3LnczLm9yZy8yMDAxL1hNTFNjaGVtYS1pbnN0YW5jZScsXHJcbiAgICAgICAgICAnQF94bWxuczp4c2QnOiAnaHR0cDovL3d3dy53My5vcmcvMjAwMS9YTUxTY2hlbWEnLFxyXG4gICAgICAgICAgJ0BfeG1sbnM6c29hcCc6ICdodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy9zb2FwL2VudmVsb3BlLycsXHJcbiAgICAgICAgICAnc29hcDpCb2R5Jzoge1xyXG4gICAgICAgICAgICBQcm9jZXNzV2ViU2VydmljZVJlcXVlc3Q6IHtcclxuICAgICAgICAgICAgICAnQF94bWxucyc6ICdodHRwOi8vZWR1cG9pbnQuY29tL3dlYnNlcnZpY2VzLycsXHJcbiAgICAgICAgICAgICAgdXNlcklEOiAnRWR1cG9pbnREaXN0cmljdEluZm8nLFxyXG4gICAgICAgICAgICAgIHBhc3N3b3JkOiAnRWR1cDAxbnQnLFxyXG4gICAgICAgICAgICAgIC4uLmRlZmF1bHRPcHRpb25zLFxyXG4gICAgICAgICAgICAgIC4uLnsgcGFyYW1TdHI6IENsaWVudC5wYXJzZVBhcmFtU3RyKGRlZmF1bHRPcHRpb25zLnBhcmFtU3RyID8/IHt9KSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGF4aW9zXHJcbiAgICAgICAgLnBvc3Q8c3RyaW5nPih1cmwsIHhtbCwgeyBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAndGV4dC94bWwnIH0gfSlcclxuICAgICAgICAudGhlbigoeyBkYXRhIH06e2RhdGE6YW55fSkgPT4ge1xyXG4gICAgICAgICAgY29uc3QgcGFyc2VyID0gbmV3IFhNTFBhcnNlcih7fSk7XHJcbiAgICAgICAgICBjb25zdCByZXN1bHQ6IFBhcnNlZFJlcXVlc3RSZXN1bHQgPSBwYXJzZXIucGFyc2UoZGF0YSk7XHJcbiAgICAgICAgICBjb25zdCBwYXJzZXJUd28gPSBuZXcgWE1MUGFyc2VyKHsgaWdub3JlQXR0cmlidXRlczogZmFsc2UgfSk7XHJcblxyXG4gICAgICAgICAgY29uc3Qgb2JqOiBUIHwgUGFyc2VkQW5vbnltb3VzUmVxdWVzdEVycm9yID0gcGFyc2VyVHdvLnBhcnNlKFxyXG4gICAgICAgICAgICBwcmVwYXJzZShcclxuICAgICAgICAgICAgICByZXN1bHRbJ3NvYXA6RW52ZWxvcGUnXVsnc29hcDpCb2R5J10uUHJvY2Vzc1dlYlNlcnZpY2VSZXF1ZXN0UmVzcG9uc2UuUHJvY2Vzc1dlYlNlcnZpY2VSZXF1ZXN0UmVzdWx0XHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgaWYgKGRlZmF1bHRPcHRpb25zLnZhbGlkYXRlRXJyb3JzICYmIHR5cGVvZiBvYmogPT09ICdvYmplY3QnICYmICdSVF9FUlJPUicgaW4gb2JqKVxyXG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBSZXF1ZXN0RXhjZXB0aW9uKG9iaikpO1xyXG5cclxuICAgICAgICAgIHJlcyhvYmogYXMgVCk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2gocmVqZWN0KTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7RUFXZSxNQUFNQSxNQUFNLENBQUM7SUFPMUIsSUFBWUMsUUFBUSxHQUFXO01BQzdCLE9BQU8sSUFBSSxDQUFDQyxZQUFZO0lBQzFCO0lBRUEsSUFBWUMsUUFBUSxHQUFXO01BQzdCLE9BQU8sSUFBSSxDQUFDQyxZQUFZO0lBQzFCO0lBRUEsSUFBWUMsUUFBUSxHQUFXO01BQzdCLE9BQU8sSUFBSSxDQUFDQyxZQUFZO0lBQzFCO0lBRUEsSUFBY0MsV0FBVyxHQUFxQjtNQUM1QyxPQUFPO1FBQ0xKLFFBQVEsRUFBRSxJ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