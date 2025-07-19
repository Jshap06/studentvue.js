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
  function login(districtUrl, credentials, proxyUrl = "https://studentvuelib.up.railway.app") {
    return new Promise((res, rej) => {
      if (districtUrl.length === 0) {
        return rej(new _RequestException.default({
          message: 'District URL cannot be an empty string'
        }));
      }
      const url = districtUrl.charAt(districtUrl.length - 1) === '/' ? districtUrl : `${districtUrl}/`;
      //stadardizes so u know it'll end in a slash fo sho
      const endpoint = url + "Service/PXPCommunication.asmx";
      const client = new _Client.default({
        username: credentials.username,
        password: credentials.password,
        districtUrl: endpoint,
        isParent: credentials.isParent,
        encrypted: credentials.encrypted
      }, proxyUrl, url);
      client.gradebook().then(response => {
        console.log("immediate login response", response, proxyUrl);
        res([client, ...response]);
      }).catch(rej);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJsb2dpbiIsImRpc3RyaWN0VXJsIiwiY3JlZGVudGlhbHMiLCJwcm94eVVybCIsIlByb21pc2UiLCJyZXMiLCJyZWoiLCJsZW5ndGgiLCJSZXF1ZXN0RXhjZXB0aW9uIiwibWVzc2FnZSIsInVybCIsImNoYXJBdCIsImVuZHBvaW50IiwiY2xpZW50IiwiQ2xpZW50IiwidXNlcm5hbWUiLCJwYXNzd29yZCIsImlzUGFyZW50IiwiZW5jcnlwdGVkIiwiZ3JhZGVib29rIiwidGhlbiIsInJlc3BvbnNlIiwiY29uc29sZSIsImxvZyIsImNhdGNoIiwiZmluZERpc3RyaWN0cyIsInppcENvZGUiLCJyZWplY3QiLCJzb2FwIiwicHJvY2Vzc0Fub255bW91c1JlcXVlc3QiLCJwYXJhbVN0ciIsIktleSIsIk1hdGNoVG9EaXN0cmljdFppcENvZGUiLCJ4bWxPYmplY3QiLCJEaXN0cmljdExpc3RzIiwiRGlzdHJpY3RJbmZvcyIsIkRpc3RyaWN0SW5mbyIsImRpc3RyaWN0IiwicGFyZW50VnVlVXJsIiwiYWRkcmVzcyIsImlkIiwibmFtZSJdLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9TdHVkZW50VnVlL1N0dWRlbnRWdWUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU2Nob29sRGlzdHJpY3QsIFVzZXJDcmVkZW50aWFscyB9IGZyb20gJy4vU3R1ZGVudFZ1ZS5pbnRlcmZhY2VzJztcclxuaW1wb3J0IENsaWVudCBmcm9tICcuL0NsaWVudC9DbGllbnQnO1xyXG5pbXBvcnQgc29hcCBmcm9tICcuLi91dGlscy9zb2FwL3NvYXAnO1xyXG5pbXBvcnQgeyBEaXN0cmljdExpc3RYTUxPYmplY3QgfSBmcm9tICcuL1N0dWRlbnRWdWUueG1sJztcclxuaW1wb3J0IFJlcXVlc3RFeGNlcHRpb24gZnJvbSAnLi9SZXF1ZXN0RXhjZXB0aW9uL1JlcXVlc3RFeGNlcHRpb24nO1xyXG5pbXBvcnQgeyBHcmFkZWJvb2sgfSBmcm9tICcuL0NsaWVudC9DbGllbnQuaW50ZXJmYWNlcyc7XHJcblxyXG4vKiogQG1vZHVsZSBTdHVkZW50VnVlICovXHJcblxyXG4vKipcclxuICogTG9naW4gdG8gdGhlIFN0dWRlbnRWVUUgQVBJXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBkaXN0cmljdFVybCBUaGUgVVJMIG9mIHRoZSBkaXN0cmljdCB3aGljaCBjYW4gYmUgZm91bmQgdXNpbmcgYGZpbmREaXN0cmljdHMoKWAgbWV0aG9kXHJcbiAqIEBwYXJhbSB7VXNlckNyZWRlbnRpYWxzfSBjcmVkZW50aWFscyBVc2VyIGNyZWRlbnRpYWxzIG9mIHRoZSBzdHVkZW50XHJcbiAqIEByZXR1cm5zIHtQcm9taXNlPENsaWVudD59IFJldHVybnMgdGhlIGNsaWVudCBhbmQgdGhlIGluZm9ybWF0aW9uIG9mIHRoZSBzdHVkZW50IHVwb24gc3VjY2Vzc2Z1bCBsb2dpblxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGxvZ2luKGRpc3RyaWN0VXJsOiBzdHJpbmcsIGNyZWRlbnRpYWxzOiBVc2VyQ3JlZGVudGlhbHMscHJveHlVcmw6c3RyaW5nPVwiaHR0cHM6Ly9zdHVkZW50dnVlbGliLnVwLnJhaWx3YXkuYXBwXCIpOiBQcm9taXNlPFtDbGllbnQsR3JhZGVib29rLGFueV0+IHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XHJcbiAgICBpZiAoZGlzdHJpY3RVcmwubGVuZ3RoID09PSAwKVxyXG4gICAgICByZXR1cm4gcmVqKG5ldyBSZXF1ZXN0RXhjZXB0aW9uKHsgbWVzc2FnZTogJ0Rpc3RyaWN0IFVSTCBjYW5ub3QgYmUgYW4gZW1wdHkgc3RyaW5nJyB9KSk7XHJcbiAgICBjb25zdCB1cmwgPSBkaXN0cmljdFVybC5jaGFyQXQoZGlzdHJpY3RVcmwubGVuZ3RoIC0gMSkgPT09ICcvJyA/IGRpc3RyaWN0VXJsIDogYCR7ZGlzdHJpY3RVcmx9L2A7XHJcbiAgICAvL3N0YWRhcmRpemVzIHNvIHUga25vdyBpdCdsbCBlbmQgaW4gYSBzbGFzaCBmbyBzaG9cclxuICAgIGNvbnN0IGVuZHBvaW50ID0gdXJsK1wiU2VydmljZS9QWFBDb21tdW5pY2F0aW9uLmFzbXhcIjtcclxuICAgIGNvbnN0IGNsaWVudCA9IG5ldyBDbGllbnQoXHJcbiAgICAgIHtcclxuICAgICAgICB1c2VybmFtZTogY3JlZGVudGlhbHMudXNlcm5hbWUsXHJcbiAgICAgICAgcGFzc3dvcmQ6IGNyZWRlbnRpYWxzLnBhc3N3b3JkLFxyXG4gICAgICAgIGRpc3RyaWN0VXJsOiBlbmRwb2ludCxcclxuICAgICAgICBpc1BhcmVudDogY3JlZGVudGlhbHMuaXNQYXJlbnQsXHJcbiAgICAgICAgZW5jcnlwdGVkOmNyZWRlbnRpYWxzLmVuY3J5cHRlZFxyXG4gICAgICB9LFxyXG4gICAgICBwcm94eVVybCx1cmxcclxuICAgICk7XHJcbiAgICBjbGllbnRcclxuICAgICAgLmdyYWRlYm9vaygpXHJcbiAgICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiaW1tZWRpYXRlIGxvZ2luIHJlc3BvbnNlXCIscmVzcG9uc2UscHJveHlVcmwpO1xyXG4gICAgICAgIHJlcyhbY2xpZW50LC4uLnJlc3BvbnNlXSk7XHJcbiAgICAgIH0pXHJcbiAgICAgIC5jYXRjaChyZWopO1xyXG4vKlxyXG4gICAgY29uc3QgcDE9Y2xpZW50LmdyYWRlYm9vaygpO1xyXG4gICAgY29uc3QgcDI9Y2xpZW50LkNoaWxkTGlzdCgpO1xyXG4gICAgUHJvbWlzZS5hbGwoW3AxLHAyXSkudGhlbihhbGw9PntcclxuICAgICAgY29uc3QgW2dyYWRlcyxpbmZvXT1hbGxcclxuICAgICAgaWYoaW5mby4pXHJcblxyXG4gICAgfSlcclxuICAgICAgKi9cclxuICAgIFxyXG4gIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogRmluZCBzY2hvb2wgZGlzdHJpY3RzIHVzaW5nIGEgemlwY29kZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gemlwQ29kZSBUaGUgemlwY29kZSB0byBnZXQgYSBsaXN0IG9mIHNjaG9vbHMgZnJvbVxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxTY2hvb2xEaXN0cmljdFtdPn0gUmV0dXJucyBhIGxpc3Qgb2Ygc2Nob29sIGRpc3RyaWN0cyB3aGljaCBjYW4gYmUgdXNlZCB0byBsb2dpbiB0byB0aGUgQVBJXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZmluZERpc3RyaWN0cyh6aXBDb2RlOiBzdHJpbmcpOiBQcm9taXNlPFNjaG9vbERpc3RyaWN0W10+IHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqZWN0KSA9PiB7XHJcbiAgICBzb2FwLkNsaWVudC5wcm9jZXNzQW5vbnltb3VzUmVxdWVzdDxEaXN0cmljdExpc3RYTUxPYmplY3QgfCB1bmRlZmluZWQ+KFxyXG4gICAgICAnaHR0cHM6Ly9zdXBwb3J0LmVkdXBvaW50LmNvbS9TZXJ2aWNlL0hESW5mb0NvbW11bmljYXRpb24uYXNteCcsXHJcbiAgICAgIHtcclxuICAgICAgICBwYXJhbVN0cjoge1xyXG4gICAgICAgICAgS2V5OiAnNUU0Qjc4NTktQjgwNS00NzRCLUE4MzMtRkRCMTVEMjA1RDQwJyxcclxuICAgICAgICAgIE1hdGNoVG9EaXN0cmljdFppcENvZGU6IHppcENvZGUsXHJcbiAgICAgICAgfSxcclxuICAgICAgfVxyXG4gICAgKVxyXG4gICAgICAudGhlbigoeG1sT2JqZWN0KSA9PiB7XHJcbiAgICAgICAgaWYgKCF4bWxPYmplY3QgfHwgIXhtbE9iamVjdC5EaXN0cmljdExpc3RzLkRpc3RyaWN0SW5mb3MuRGlzdHJpY3RJbmZvKSByZXR1cm4gcmVzKFtdKTtcclxuICAgICAgICByZXMoXHJcbiAgICAgICAgICB4bWxPYmplY3QuRGlzdHJpY3RMaXN0cy5EaXN0cmljdEluZm9zLkRpc3RyaWN0SW5mby5tYXAoKGRpc3RyaWN0KSA9PiAoe1xyXG4gICAgICAgICAgICBwYXJlbnRWdWVVcmw6IGRpc3RyaWN0WydAX1B2dWVVUkwnXSxcclxuICAgICAgICAgICAgYWRkcmVzczogZGlzdHJpY3RbJ0BfQWRkcmVzcyddLFxyXG4gICAgICAgICAgICBpZDogZGlzdHJpY3RbJ0BfRGlzdHJpY3RJRCddLFxyXG4gICAgICAgICAgICBuYW1lOiBkaXN0cmljdFsnQF9OYW1lJ10sXHJcbiAgICAgICAgICB9KSlcclxuICAgICAgICApO1xyXG4gICAgICB9KVxyXG4gICAgICAuY2F0Y2gocmVqZWN0KTtcclxuICB9KTtcclxufVxyXG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQU9BOztFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNPLFNBQVNBLEtBQUssQ0FBQ0MsV0FBbUIsRUFBRUMsV0FBNEIsRUFBQ0MsUUFBZSxHQUFDLHNDQUFzQyxFQUFtQztJQUMvSixPQUFPLElBQUlDLE9BQU8sQ0FBQyxDQUFDQyxHQUFHLEVBQUVDLEdBQUcsS0FBSztNQUMvQixJQUFJTCxXQUFXLENBQUNNLE1BQU0sS0FBSyxDQUFDO1FBQzFCLE9BQU9ELEdBQUcsQ0FBQyxJQUFJRSx5QkFBZ0IsQ0FBQztVQUFFQyxPQUFPLEVBQUU7UUFBeUMsQ0FBQyxDQUFDLENBQUM7TUFBQztNQUMxRixNQUFNQyxHQUFHLEdBQUdULFdBQVcsQ0FBQ1UsTUFBTSxDQUFDVixXQUFXLENBQUNNLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLEdBQUdOLFdBQVcsR0FBSSxHQUFFQSxXQUFZLEdBQUU7TUFDaEc7TUFDQSxNQUFNVyxRQUFRLEdBQUdGLEdBQUcsR0FBQywrQkFBK0I7TUFDcEQsTUFBTUcsTUFBTSxHQUFHLElBQUlDLGVBQU0sQ0FDdkI7UUFDRUMsUUFBUSxFQUFFYixXQUFXLENBQUNhLFFBQVE7UUFDOUJDLFFBQVEsRUFBRWQsV0FBVyxDQUFDYyxRQUFRO1FBQzlCZixXQUFXLEVBQUVXLFFBQVE7UUFDckJLLFFBQVEsRUFBRWYsV0FBVyxDQUFDZSxRQUFRO1FBQzlCQyxTQUFTLEVBQUNoQixXQUFXLENBQUNnQjtNQUN4QixDQUFDLEVBQ0RmLFFBQVEsRUFBQ08sR0FBRyxDQUNiO01BQ0RHLE1BQU0sQ0FDSE0sU0FBUyxFQUFFLENBQ1hDLElBQUksQ0FBRUMsUUFBUSxJQUFLO1FBQ2xCQyxPQUFPLENBQUNDLEdBQUcsQ0FBQywwQkFBMEIsRUFBQ0YsUUFBUSxFQUFDbEIsUUFBUSxDQUFDO1FBQ3pERSxHQUFHLENBQUMsQ0FBQ1EsTUFBTSxFQUFDLEdBQUdRLFFBQVEsQ0FBQyxDQUFDO01BQzNCLENBQUMsQ0FBQyxDQUNERyxLQUFLLENBQUNsQixHQUFHLENBQUM7TUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0lBRUUsQ0FBQyxDQUFDO0VBQ0o7O0VBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNPLFNBQVNtQixhQUFhLENBQUNDLE9BQWUsRUFBNkI7SUFDeEUsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLEdBQUcsRUFBRXNCLE1BQU0sS0FBSztNQUNsQ0MsYUFBSSxDQUFDZCxNQUFNLENBQUNlLHVCQUF1QixDQUNqQywrREFBK0QsRUFDL0Q7UUFDRUMsUUFBUSxFQUFFO1VBQ1JDLEdBQUcsRUFBRSxzQ0FBc0M7VUFDM0NDLHNCQUFzQixFQUFFTjtRQUMxQjtNQUNGLENBQUMsQ0FDRixDQUNFTixJQUFJLENBQUVhLFNBQVMsSUFBSztRQUNuQixJQUFJLENBQUNBLFNBQVMsSUFBSSxDQUFDQSxTQUFTLENBQUNDLGFBQWEsQ0FBQ0MsYUFBYSxDQUFDQyxZQUFZO1VBQUUsT0FBTy9CLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFBQztRQUFBLFNBRXBGNEIsU0FBUyxDQUFDQyxhQUFhLENBQUNDLGFBQWEsQ0FBQ0MsWUFBWTtRQUFBLFNBQU1DLFFBQVE7VUFBQSxPQUFNO1lBQ3BFQyxZQUFZLEVBQUVELFFBQVEsQ0FBQyxXQUFXLENBQUM7WUFDbkNFLE9BQU8sRUFBRUYsUUFBUSxDQUFDLFdBQVcsQ0FBQztZQUM5QkcsRUFBRSxFQUFFSCxRQUFRLENBQUMsY0FBYyxDQUFDO1lBQzVCSSxJQUFJLEVBQUVKLFFBQVEsQ0FBQyxRQUFRO1VBQ3pCLENBQUM7UUFBQSxDQUFDO1FBQUE7UUFBQTtVQUFBO1FBQUE7UUFOSmhDLEdBQUcsSUFPRjtNQUNILENBQUMsQ0FBQyxDQUNEbUIsS0FBSyxDQUFDRyxNQUFNLENBQUM7SUFDbEIsQ0FBQyxDQUFDO0VBQ0o7QUFBQyJ9