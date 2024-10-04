(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "./Client/Client", "../utils/soap/soap", "./RequestException/RequestException"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("./Client/Client"), require("../utils/soap/soap"), require("./RequestException/RequestException"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.Client, global.soap, global.RequestException);
    global.StudentVue = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports, _Client, _soap, _RequestException) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.findDistricts = findDistricts;
  _exports.login = login;
  _Client = _interopRequireDefault(_Client);
  _soap = _interopRequireDefault(_soap);
  _RequestException = _interopRequireDefault(_RequestException);
  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
  /** @module StudentVue */

  /**
   * Login to the StudentVUE API
   * @param {string} districtUrl The URL of the district which can be found using `findDistricts()` method
   * @param {UserCredentials} credentials User credentials of the student
   * @returns {Promise<Client>} Returns the client and the information of the student upon successful login
   */
  function login(districtUrl, credentials, encrypted = false) {
    return new Promise((res, rej) => {
      if (districtUrl.length === 0) {
        return rej(new _RequestException.default({
          message: 'District URL cannot be an empty string'
        }));
      }
      const host = new URL(districtUrl).host;
      const endpoint = `https://${host}/Service/PXPCommunication.asmx`;
      const client = new _Client.default({
        username: credentials.username,
        password: credentials.password,
        districtUrl: endpoint,
        isParent: credentials.isParent
      }, `https://${host}/`, encrypted);
      client.validateCredentials().then(() => {
        res(client);
      }).catch(rej);
    });
  }

  /**
   * Find school districts using a zipcode
   * @param {string} zipCode The zipcode to get a list of schools from
   * @returns {Promise<SchoolDistrict[]>} Returns a list of school districts which can be used to login to the API
   */
  function findDistricts(zipCode) {
    return new Promise((res, reject) => {
      _soap.default.Client.processAnonymousRequest('https://support.edupoint.com/Service/HDInfoCommunication.asmx', {
        paramStr: {
          Key: '5E4B7859-B805-474B-A833-FDB15D205D40',
          MatchToDistrictZipCode: zipCode
        }
      }).then(xmlObject => {
        if (!xmlObject || !xmlObject.DistrictLists.DistrictInfos.DistrictInfo) {
          return res([]);
        }
        var _a = xmlObject.DistrictLists.DistrictInfos.DistrictInfo;
        var _f = district => {
          return {
            parentVueUrl: district['@_PvueURL'],
            address: district['@_Address'],
            id: district['@_DistrictID'],
            name: district['@_Name']
          };
        };
        var _r = [];
        for (var _i = 0; _i < _a.length; _i++) {
          _r.push(_f(_a[_i], _i, _a));
        }
        res(_r);
      }).catch(reject);
    });
  }
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJsb2dpbiIsImRpc3RyaWN0VXJsIiwiY3JlZGVudGlhbHMiLCJlbmNyeXB0ZWQiLCJQcm9taXNlIiwicmVzIiwicmVqIiwibGVuZ3RoIiwiUmVxdWVzdEV4Y2VwdGlvbiIsIm1lc3NhZ2UiLCJob3N0IiwiVVJMIiwiZW5kcG9pbnQiLCJjbGllbnQiLCJDbGllbnQiLCJ1c2VybmFtZSIsInBhc3N3b3JkIiwiaXNQYXJlbnQiLCJ2YWxpZGF0ZUNyZWRlbnRpYWxzIiwidGhlbiIsImNhdGNoIiwiZmluZERpc3RyaWN0cyIsInppcENvZGUiLCJyZWplY3QiLCJzb2FwIiwicHJvY2Vzc0Fub255bW91c1JlcXVlc3QiLCJwYXJhbVN0ciIsIktleSIsIk1hdGNoVG9EaXN0cmljdFppcENvZGUiLCJ4bWxPYmplY3QiLCJEaXN0cmljdExpc3RzIiwiRGlzdHJpY3RJbmZvcyIsIkRpc3RyaWN0SW5mbyIsImRpc3RyaWN0IiwicGFyZW50VnVlVXJsIiwiYWRkcmVzcyIsImlkIiwibmFtZSJdLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9TdHVkZW50VnVlL1N0dWRlbnRWdWUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU2Nob29sRGlzdHJpY3QsIFVzZXJDcmVkZW50aWFscyB9IGZyb20gJy4vU3R1ZGVudFZ1ZS5pbnRlcmZhY2VzJztcclxuaW1wb3J0IENsaWVudCBmcm9tICcuL0NsaWVudC9DbGllbnQnO1xyXG5pbXBvcnQgc29hcCBmcm9tICcuLi91dGlscy9zb2FwL3NvYXAnO1xyXG5pbXBvcnQgeyBEaXN0cmljdExpc3RYTUxPYmplY3QgfSBmcm9tICcuL1N0dWRlbnRWdWUueG1sJztcclxuaW1wb3J0IFJlcXVlc3RFeGNlcHRpb24gZnJvbSAnLi9SZXF1ZXN0RXhjZXB0aW9uL1JlcXVlc3RFeGNlcHRpb24nO1xyXG5cclxuLyoqIEBtb2R1bGUgU3R1ZGVudFZ1ZSAqL1xyXG5cclxuLyoqXHJcbiAqIExvZ2luIHRvIHRoZSBTdHVkZW50VlVFIEFQSVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZGlzdHJpY3RVcmwgVGhlIFVSTCBvZiB0aGUgZGlzdHJpY3Qgd2hpY2ggY2FuIGJlIGZvdW5kIHVzaW5nIGBmaW5kRGlzdHJpY3RzKClgIG1ldGhvZFxyXG4gKiBAcGFyYW0ge1VzZXJDcmVkZW50aWFsc30gY3JlZGVudGlhbHMgVXNlciBjcmVkZW50aWFscyBvZiB0aGUgc3R1ZGVudFxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxDbGllbnQ+fSBSZXR1cm5zIHRoZSBjbGllbnQgYW5kIHRoZSBpbmZvcm1hdGlvbiBvZiB0aGUgc3R1ZGVudCB1cG9uIHN1Y2Nlc3NmdWwgbG9naW5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBsb2dpbihkaXN0cmljdFVybDogc3RyaW5nLCBjcmVkZW50aWFsczogVXNlckNyZWRlbnRpYWxzLGVuY3J5cHRlZD1mYWxzZSk6IFByb21pc2U8Q2xpZW50PiB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xyXG4gICAgaWYgKGRpc3RyaWN0VXJsLmxlbmd0aCA9PT0gMClcclxuICAgICAgcmV0dXJuIHJlaihuZXcgUmVxdWVzdEV4Y2VwdGlvbih7IG1lc3NhZ2U6ICdEaXN0cmljdCBVUkwgY2Fubm90IGJlIGFuIGVtcHR5IHN0cmluZycgfSkpO1xyXG4gICAgY29uc3QgaG9zdCA9IG5ldyBVUkwoZGlzdHJpY3RVcmwpLmhvc3Q7XHJcbiAgICBjb25zdCBlbmRwb2ludCA9IGBodHRwczovLyR7aG9zdH0vU2VydmljZS9QWFBDb21tdW5pY2F0aW9uLmFzbXhgO1xyXG4gICAgY29uc3QgY2xpZW50ID0gbmV3IENsaWVudChcclxuICAgICAge1xyXG4gICAgICAgIHVzZXJuYW1lOiBjcmVkZW50aWFscy51c2VybmFtZSxcclxuICAgICAgICBwYXNzd29yZDogY3JlZGVudGlhbHMucGFzc3dvcmQsXHJcbiAgICAgICAgZGlzdHJpY3RVcmw6IGVuZHBvaW50LFxyXG4gICAgICAgIGlzUGFyZW50OiBjcmVkZW50aWFscy5pc1BhcmVudCxcclxuICAgICAgfSxcclxuICAgICAgYGh0dHBzOi8vJHtob3N0fS9gLGVuY3J5cHRlZFxyXG4gICAgKTtcclxuICAgIGNsaWVudFxyXG4gICAgICAudmFsaWRhdGVDcmVkZW50aWFscygpXHJcbiAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICByZXMoY2xpZW50KTtcclxuICAgICAgfSlcclxuICAgICAgLmNhdGNoKHJlaik7XHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGaW5kIHNjaG9vbCBkaXN0cmljdHMgdXNpbmcgYSB6aXBjb2RlXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB6aXBDb2RlIFRoZSB6aXBjb2RlIHRvIGdldCBhIGxpc3Qgb2Ygc2Nob29scyBmcm9tXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlPFNjaG9vbERpc3RyaWN0W10+fSBSZXR1cm5zIGEgbGlzdCBvZiBzY2hvb2wgZGlzdHJpY3RzIHdoaWNoIGNhbiBiZSB1c2VkIHRvIGxvZ2luIHRvIHRoZSBBUElcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBmaW5kRGlzdHJpY3RzKHppcENvZGU6IHN0cmluZyk6IFByb21pc2U8U2Nob29sRGlzdHJpY3RbXT4ge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWplY3QpID0+IHtcclxuICAgIHNvYXAuQ2xpZW50LnByb2Nlc3NBbm9ueW1vdXNSZXF1ZXN0PERpc3RyaWN0TGlzdFhNTE9iamVjdCB8IHVuZGVmaW5lZD4oXHJcbiAgICAgICdodHRwczovL3N1cHBvcnQuZWR1cG9pbnQuY29tL1NlcnZpY2UvSERJbmZvQ29tbXVuaWNhdGlvbi5hc214JyxcclxuICAgICAge1xyXG4gICAgICAgIHBhcmFtU3RyOiB7XHJcbiAgICAgICAgICBLZXk6ICc1RTRCNzg1OS1CODA1LTQ3NEItQTgzMy1GREIxNUQyMDVENDAnLFxyXG4gICAgICAgICAgTWF0Y2hUb0Rpc3RyaWN0WmlwQ29kZTogemlwQ29kZSxcclxuICAgICAgICB9LFxyXG4gICAgICB9XHJcbiAgICApXHJcbiAgICAgIC50aGVuKCh4bWxPYmplY3QpID0+IHtcclxuICAgICAgICBpZiAoIXhtbE9iamVjdCB8fCAheG1sT2JqZWN0LkRpc3RyaWN0TGlzdHMuRGlzdHJpY3RJbmZvcy5EaXN0cmljdEluZm8pIHJldHVybiByZXMoW10pO1xyXG4gICAgICAgIHJlcyhcclxuICAgICAgICAgIHhtbE9iamVjdC5EaXN0cmljdExpc3RzLkRpc3RyaWN0SW5mb3MuRGlzdHJpY3RJbmZvLm1hcCgoZGlzdHJpY3QpID0+ICh7XHJcbiAgICAgICAgICAgIHBhcmVudFZ1ZVVybDogZGlzdHJpY3RbJ0BfUHZ1ZVVSTCddLFxyXG4gICAgICAgICAgICBhZGRyZXNzOiBkaXN0cmljdFsnQF9BZGRyZXNzJ10sXHJcbiAgICAgICAgICAgIGlkOiBkaXN0cmljdFsnQF9EaXN0cmljdElEJ10sXHJcbiAgICAgICAgICAgIG5hbWU6IGRpc3RyaWN0WydAX05hbWUnXSxcclxuICAgICAgICAgIH0pKVxyXG4gICAgICAgICk7XHJcbiAgICAgIH0pXHJcbiAgICAgIC5jYXRjaChyZWplY3QpO1xyXG4gIH0pO1xyXG59XHJcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBTUE7O0VBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ08sU0FBU0EsS0FBSyxDQUFDQyxXQUFtQixFQUFFQyxXQUE0QixFQUFDQyxTQUFTLEdBQUMsS0FBSyxFQUFtQjtJQUN4RyxPQUFPLElBQUlDLE9BQU8sQ0FBQyxDQUFDQyxHQUFHLEVBQUVDLEdBQUcsS0FBSztNQUMvQixJQUFJTCxXQUFXLENBQUNNLE1BQU0sS0FBSyxDQUFDO1FBQzFCLE9BQU9ELEdBQUcsQ0FBQyxJQUFJRSx5QkFBZ0IsQ0FBQztVQUFFQyxPQUFPLEVBQUU7UUFBeUMsQ0FBQyxDQUFDLENBQUM7TUFBQztNQUMxRixNQUFNQyxJQUFJLEdBQUcsSUFBSUMsR0FBRyxDQUFDVixXQUFXLENBQUMsQ0FBQ1MsSUFBSTtNQUN0QyxNQUFNRSxRQUFRLEdBQUksV0FBVUYsSUFBSyxnQ0FBK0I7TUFDaEUsTUFBTUcsTUFBTSxHQUFHLElBQUlDLGVBQU0sQ0FDdkI7UUFDRUMsUUFBUSxFQUFFYixXQUFXLENBQUNhLFFBQVE7UUFDOUJDLFFBQVEsRUFBRWQsV0FBVyxDQUFDYyxRQUFRO1FBQzlCZixXQUFXLEVBQUVXLFFBQVE7UUFDckJLLFFBQVEsRUFBRWYsV0FBVyxDQUFDZTtNQUN4QixDQUFDLEVBQ0EsV0FBVVAsSUFBSyxHQUFFLEVBQUNQLFNBQVMsQ0FDN0I7TUFDRFUsTUFBTSxDQUNISyxtQkFBbUIsRUFBRSxDQUNyQkMsSUFBSSxDQUFDLE1BQU07UUFDVmQsR0FBRyxDQUFDUSxNQUFNLENBQUM7TUFDYixDQUFDLENBQUMsQ0FDRE8sS0FBSyxDQUFDZCxHQUFHLENBQUM7SUFDZixDQUFDLENBQUM7RUFDSjs7RUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ08sU0FBU2UsYUFBYSxDQUFDQyxPQUFlLEVBQTZCO0lBQ3hFLE9BQU8sSUFBSWxCLE9BQU8sQ0FBQyxDQUFDQyxHQUFHLEVBQUVrQixNQUFNLEtBQUs7TUFDbENDLGFBQUksQ0FBQ1YsTUFBTSxDQUFDVyx1QkFBdUIsQ0FDakMsK0RBQStELEVBQy9EO1FBQ0VDLFFBQVEsRUFBRTtVQUNSQyxHQUFHLEVBQUUsc0NBQXNDO1VBQzNDQyxzQkFBc0IsRUFBRU47UUFDMUI7TUFDRixDQUFDLENBQ0YsQ0FDRUgsSUFBSSxDQUFFVSxTQUFTLElBQUs7UUFDbkIsSUFBSSxDQUFDQSxTQUFTLElBQUksQ0FBQ0EsU0FBUyxDQUFDQyxhQUFhLENBQUNDLGFBQWEsQ0FBQ0MsWUFBWTtVQUFFLE9BQU8zQixHQUFHLENBQUMsRUFBRSxDQUFDO1FBQUM7UUFBQSxTQUVwRndCLFNBQVMsQ0FBQ0MsYUFBYSxDQUFDQyxhQUFhLENBQUNDLFlBQVk7UUFBQSxTQUFNQyxRQUFRO1VBQUEsT0FBTTtZQUNwRUMsWUFBWSxFQUFFRCxRQUFRLENBQUMsV0FBVyxDQUFDO1lBQ25DRSxPQUFPLEVBQUVGLFFBQVEsQ0FBQyxXQUFXLENBQUM7WUFDOUJHLEVBQUUsRUFBRUgsUUFBUSxDQUFDLGNBQWMsQ0FBQztZQUM1QkksSUFBSSxFQUFFSixRQUFRLENBQUMsUUFBUTtVQUN6QixDQUFDO1FBQUEsQ0FBQztRQUFBO1FBQUE7VUFBQTtRQUFBO1FBTko1QixHQUFHLElBT0Y7TUFDSCxDQUFDLENBQUMsQ0FDRGUsS0FBSyxDQUFDRyxNQUFNLENBQUM7SUFDbEIsQ0FBQyxDQUFDO0VBQ0o7QUFBQyJ9