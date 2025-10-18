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
  Object.defineProperty(_exports, "Client", {
    enumerable: true,
    get: function () {
      return _Client.default;
    }
  });
  _exports.findDistricts = findDistricts;
  _exports.login = login;
  _Client = _interopRequireDefault(_Client);
  _soap = _interopRequireDefault(_soap);
  _RequestException = _interopRequireDefault(_RequestException);
  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
  //helper function fuck y'all goofy ahh

  function stupid(client, mp) {
    try {
      //@ts-ignore
      return new Promise((res, rej) => {
        return client.gradebook(mp.index, null, false).then(grades => {
          return res(grades);
        }).catch(error => {
          return rej(error);
        });
      });
    } catch (error) {
      console.log(error, "dexter morgan");
      //@ts-ignore
      return new Promise((res, rej) => {
        return client.gradebook(mp.index, null, false).then(grades => {
          return res(grades);
        }).catch(error => {
          return rej(error);
        });
      });
    }
  }
  async function getGradebooks(client, lock, setLock) {
    const info = JSON.parse(localStorage.getItem("mps") ?? "{}");
    const periods = info.periods;
    if (!(periods?.length > 0) || info.district != client.district || true) {
      //cacheLoading
      const result = await client.gradebook();
      //    setLock(true);
      var _a = result[0].reportingPeriod.available;
      var _f = ({
        name,
        index,
        date
      }) => {
        return {
          name: name,
          date: date,
          index: index
        };
      };
      var _r = [];
      for (var _i = 0; _i < _a.length; _i++) {
        _r.push(_f(_a[_i], _i, _a));
      }
      const periods = _r;
      localStorage.setItem("mps", JSON.stringify({
        periods: periods,
        district: client.district
      }));
      var _a2 = periods;
      var _f2 = mp => {
        if (result[0].reportingPeriod.current.index == mp.index) {
          return new Promise((res, rej) => {
            res(result);
          });
        } else {
          return stupid(client, mp);
        }
      };
      var _r2 = [];
      for (var _i2 = 0; _i2 < _a2.length; _i2++) {
        _r2.push(_f2(_a2[_i2], _i2, _a2));
      }
      const remainder = await Promise.all(_r2);
      return [...remainder];
    } else {
      const mps = periods;
      var _a3 = mps;
      var _f3 = mp => {
        return stupid(client, mp);
      };
      var _r3 = [];
      for (var _i3 = 0; _i3 < _a3.length; _i3++) {
        _r3.push(_f3(_a3[_i3], _i3, _a3));
      }
      const result = await Promise.all(_r3);
      return result;
    }
  }
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
      getGradebooks(client, null, null).then(response => {
        console.log("immediate login response", response, proxyUrl);
        res({
          client: client,
          responses: response
        });
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
        var _a4 = xmlObject.DistrictLists.DistrictInfos.DistrictInfo;
        var _f4 = district => {
          return {
            parentVueUrl: district['@_PvueURL'],
            address: district['@_Address'],
            id: district['@_DistrictID'],
            name: district['@_Name']
          };
        };
        var _r4 = [];
        for (var _i4 = 0; _i4 < _a4.length; _i4++) {
          _r4.push(_f4(_a4[_i4], _i4, _a4));
        }
        res(_r4);
      }).catch(reject);
    });
  }
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJzdHVwaWQiLCJjbGllbnQiLCJtcCIsIlByb21pc2UiLCJyZXMiLCJyZWoiLCJncmFkZWJvb2siLCJpbmRleCIsInRoZW4iLCJncmFkZXMiLCJjYXRjaCIsImVycm9yIiwiY29uc29sZSIsImxvZyIsImdldEdyYWRlYm9va3MiLCJsb2NrIiwic2V0TG9jayIsImluZm8iLCJKU09OIiwicGFyc2UiLCJsb2NhbFN0b3JhZ2UiLCJnZXRJdGVtIiwicGVyaW9kcyIsImxlbmd0aCIsImRpc3RyaWN0IiwicmVzdWx0IiwicmVwb3J0aW5nUGVyaW9kIiwiYXZhaWxhYmxlIiwibmFtZSIsImRhdGUiLCJzZXRJdGVtIiwic3RyaW5naWZ5IiwiY3VycmVudCIsInJlbWFpbmRlciIsImFsbCIsIm1wcyIsImxvZ2luIiwiZGlzdHJpY3RVcmwiLCJjcmVkZW50aWFscyIsInByb3h5VXJsIiwiUmVxdWVzdEV4Y2VwdGlvbiIsIm1lc3NhZ2UiLCJ1cmwiLCJjaGFyQXQiLCJlbmRwb2ludCIsIkNsaWVudCIsInVzZXJuYW1lIiwicGFzc3dvcmQiLCJpc1BhcmVudCIsImVuY3J5cHRlZCIsInJlc3BvbnNlIiwicmVzcG9uc2VzIiwiZmluZERpc3RyaWN0cyIsInppcENvZGUiLCJyZWplY3QiLCJzb2FwIiwicHJvY2Vzc0Fub255bW91c1JlcXVlc3QiLCJwYXJhbVN0ciIsIktleSIsIk1hdGNoVG9EaXN0cmljdFppcENvZGUiLCJ4bWxPYmplY3QiLCJEaXN0cmljdExpc3RzIiwiRGlzdHJpY3RJbmZvcyIsIkRpc3RyaWN0SW5mbyIsInBhcmVudFZ1ZVVybCIsImFkZHJlc3MiLCJpZCJdLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9TdHVkZW50VnVlL1N0dWRlbnRWdWUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU2Nob29sRGlzdHJpY3QsIFVzZXJDcmVkZW50aWFscyB9IGZyb20gJy4vU3R1ZGVudFZ1ZS5pbnRlcmZhY2VzJztcclxuaW1wb3J0IENsaWVudCBmcm9tICcuL0NsaWVudC9DbGllbnQnO1xyXG5pbXBvcnQgc29hcCBmcm9tICcuLi91dGlscy9zb2FwL3NvYXAnO1xyXG5pbXBvcnQgeyBEaXN0cmljdExpc3RYTUxPYmplY3QgfSBmcm9tICcuL1N0dWRlbnRWdWUueG1sJztcclxuaW1wb3J0IFJlcXVlc3RFeGNlcHRpb24gZnJvbSAnLi9SZXF1ZXN0RXhjZXB0aW9uL1JlcXVlc3RFeGNlcHRpb24nO1xyXG5pbXBvcnQgeyBHcmFkZWJvb2sgfSBmcm9tICcuL0NsaWVudC9DbGllbnQuaW50ZXJmYWNlcyc7XHJcblxyXG5cclxuLy9oZWxwZXIgZnVuY3Rpb24gZnVjayB5J2FsbCBnb29meSBhaGhcclxuXHJcbmZ1bmN0aW9uIHN0dXBpZChjbGllbnQ6Q2xpZW50LG1wOmFueSk6UHJvbWlzZTxbR3JhZGVib29rLGFueV0+e1xyXG4gIHRyeXtcclxuICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMscmVqKT0+Y2xpZW50LmdyYWRlYm9vayhtcC5pbmRleCxudWxsLGZhbHNlKS50aGVuKGdyYWRlcz0+cmVzKGdyYWRlcykpLmNhdGNoKGVycm9yPT5yZWooZXJyb3IpKSlcclxuICB9Y2F0Y2goZXJyb3Ipe2NvbnNvbGUubG9nKGVycm9yLFwiZGV4dGVyIG1vcmdhblwiKTtcclxuICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMscmVqKT0+Y2xpZW50LmdyYWRlYm9vayhtcC5pbmRleCxudWxsLGZhbHNlKS50aGVuKGdyYWRlcz0+cmVzKGdyYWRlcykpLmNhdGNoKGVycm9yPT5yZWooZXJyb3IpKSlcclxuICB9XHJcbn1cclxuXHJcblxyXG5hc3luYyBmdW5jdGlvbiBnZXRHcmFkZWJvb2tzKGNsaWVudDpDbGllbnQsbG9jazphbnksc2V0TG9jazphbnkpOlByb21pc2U8W0dyYWRlYm9vayxhbnldW10+e1xyXG5cclxuICAgIGNvbnN0IGluZm89SlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcIm1wc1wiKSA/PyBcInt9XCIpO1xyXG4gICAgY29uc3QgcGVyaW9kcz1pbmZvLnBlcmlvZHNcclxuICAgIGlmKCEocGVyaW9kcz8ubGVuZ3RoPjApfHxpbmZvLmRpc3RyaWN0IT1jbGllbnQuZGlzdHJpY3R8fHRydWUpe1xyXG4gICAgICAgIC8vY2FjaGVMb2FkaW5nXHJcbiAgICAgICAgY29uc3QgcmVzdWx0PWF3YWl0IGNsaWVudC5ncmFkZWJvb2soKVxyXG4gICAgLy8gICAgc2V0TG9jayh0cnVlKTtcclxuICAgICAgICBjb25zdCBwZXJpb2RzPXJlc3VsdFswXS5yZXBvcnRpbmdQZXJpb2QuYXZhaWxhYmxlLm1hcCgoeyBuYW1lLCBpbmRleCwgZGF0ZSB9KSA9PiAoe1xyXG5cdFx0XHRuYW1lOm5hbWUsXHJcblx0XHRcdGRhdGU6ZGF0ZSxcclxuXHRcdFx0aW5kZXg6IGluZGV4LFxyXG5cdFx0fSkpXHJcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwibXBzXCIsSlNPTi5zdHJpbmdpZnkoe3BlcmlvZHM6cGVyaW9kcyxkaXN0cmljdDpjbGllbnQuZGlzdHJpY3R9KSlcclxuICAgICAgY29uc3QgcmVtYWluZGVyOnR5cGVvZiByZXN1bHRbXT1hd2FpdCBQcm9taXNlLmFsbChwZXJpb2RzLm1hcChtcD0+e2lmKHJlc3VsdFswXS5yZXBvcnRpbmdQZXJpb2QuY3VycmVudC5pbmRleD09bXAuaW5kZXgpe3JldHVybiBuZXcgUHJvbWlzZTx0eXBlb2YgcmVzdWx0PigocmVzLHJlaik9PntyZXMocmVzdWx0KX0pfWVsc2V7cmV0dXJuIHN0dXBpZChjbGllbnQsbXApfX0pKVxyXG4gICAgICByZXR1cm4gWy4uLnJlbWFpbmRlcl1cclxuXHJcblxyXG4gICAgfVxyXG4gICAgZWxzZXtcclxuICAgICAgICBjb25zdCBtcHM6e2luZGV4Om51bWJlcixkYXRlOmFueX1bXT1wZXJpb2RzO1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdD1hd2FpdCBQcm9taXNlLmFsbChtcHMubWFwKG1wPT5zdHVwaWQoY2xpZW50LG1wKSkpXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuZXhwb3J0IHtDbGllbnR9XHJcblxyXG4vKiogQG1vZHVsZSBTdHVkZW50VnVlICovXHJcblxyXG4vKipcclxuICogTG9naW4gdG8gdGhlIFN0dWRlbnRWVUUgQVBJXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBkaXN0cmljdFVybCBUaGUgVVJMIG9mIHRoZSBkaXN0cmljdCB3aGljaCBjYW4gYmUgZm91bmQgdXNpbmcgYGZpbmREaXN0cmljdHMoKWAgbWV0aG9kXHJcbiAqIEBwYXJhbSB7VXNlckNyZWRlbnRpYWxzfSBjcmVkZW50aWFscyBVc2VyIGNyZWRlbnRpYWxzIG9mIHRoZSBzdHVkZW50XHJcbiAqIEByZXR1cm5zIHtQcm9taXNlPENsaWVudD59IFJldHVybnMgdGhlIGNsaWVudCBhbmQgdGhlIGluZm9ybWF0aW9uIG9mIHRoZSBzdHVkZW50IHVwb24gc3VjY2Vzc2Z1bCBsb2dpblxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGxvZ2luKGRpc3RyaWN0VXJsOiBzdHJpbmcsIGNyZWRlbnRpYWxzOiBVc2VyQ3JlZGVudGlhbHMscHJveHlVcmw6c3RyaW5nPVwiaHR0cHM6Ly9zdHVkZW50dnVlbGliLnVwLnJhaWx3YXkuYXBwXCIpOiBQcm9taXNlPHtjbGllbnQ6Q2xpZW50LHJlc3BvbnNlczpbR3JhZGVib29rLGFueV1bXX0+IHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XHJcbiAgICBpZiAoZGlzdHJpY3RVcmwubGVuZ3RoID09PSAwKVxyXG4gICAgICByZXR1cm4gcmVqKG5ldyBSZXF1ZXN0RXhjZXB0aW9uKHsgbWVzc2FnZTogJ0Rpc3RyaWN0IFVSTCBjYW5ub3QgYmUgYW4gZW1wdHkgc3RyaW5nJyB9KSk7XHJcbiAgICBjb25zdCB1cmwgPSBkaXN0cmljdFVybC5jaGFyQXQoZGlzdHJpY3RVcmwubGVuZ3RoIC0gMSkgPT09ICcvJyA/IGRpc3RyaWN0VXJsIDogYCR7ZGlzdHJpY3RVcmx9L2A7XHJcbiAgICAvL3N0YWRhcmRpemVzIHNvIHUga25vdyBpdCdsbCBlbmQgaW4gYSBzbGFzaCBmbyBzaG9cclxuICAgIGNvbnN0IGVuZHBvaW50ID0gdXJsK1wiU2VydmljZS9QWFBDb21tdW5pY2F0aW9uLmFzbXhcIjtcclxuICAgIGNvbnN0IGNsaWVudCA9IG5ldyBDbGllbnQoXHJcbiAgICAgIHtcclxuICAgICAgICB1c2VybmFtZTogY3JlZGVudGlhbHMudXNlcm5hbWUsXHJcbiAgICAgICAgcGFzc3dvcmQ6IGNyZWRlbnRpYWxzLnBhc3N3b3JkLFxyXG4gICAgICAgIGRpc3RyaWN0VXJsOiBlbmRwb2ludCxcclxuICAgICAgICBpc1BhcmVudDogY3JlZGVudGlhbHMuaXNQYXJlbnQsXHJcbiAgICAgICAgZW5jcnlwdGVkOmNyZWRlbnRpYWxzLmVuY3J5cHRlZFxyXG4gICAgICB9LFxyXG4gICAgICBwcm94eVVybCx1cmxcclxuICAgICk7XHJcbiAgICAgIGdldEdyYWRlYm9va3MoY2xpZW50LG51bGwsbnVsbClcclxuICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJpbW1lZGlhdGUgbG9naW4gcmVzcG9uc2VcIixyZXNwb25zZSxwcm94eVVybCk7XHJcbiAgICAgICAgcmVzKHtjbGllbnQ6Y2xpZW50LHJlc3BvbnNlczpyZXNwb25zZX0pO1xyXG4gICAgICB9KVxyXG4gICAgICAuY2F0Y2gocmVqKTtcclxuLypcclxuICAgIGNvbnN0IHAxPWNsaWVudC5ncmFkZWJvb2soKTtcclxuICAgIGNvbnN0IHAyPWNsaWVudC5DaGlsZExpc3QoKTtcclxuICAgIFByb21pc2UuYWxsKFtwMSxwMl0pLnRoZW4oYWxsPT57XHJcbiAgICAgIGNvbnN0IFtncmFkZXMsaW5mb109YWxsXHJcbiAgICAgIGlmKGluZm8uKVxyXG5cclxuICAgIH0pXHJcbiAgICAgICovXHJcbiAgICBcclxuICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZpbmQgc2Nob29sIGRpc3RyaWN0cyB1c2luZyBhIHppcGNvZGVcclxuICogQHBhcmFtIHtzdHJpbmd9IHppcENvZGUgVGhlIHppcGNvZGUgdG8gZ2V0IGEgbGlzdCBvZiBzY2hvb2xzIGZyb21cclxuICogQHJldHVybnMge1Byb21pc2U8U2Nob29sRGlzdHJpY3RbXT59IFJldHVybnMgYSBsaXN0IG9mIHNjaG9vbCBkaXN0cmljdHMgd2hpY2ggY2FuIGJlIHVzZWQgdG8gbG9naW4gdG8gdGhlIEFQSVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGZpbmREaXN0cmljdHMoemlwQ29kZTogc3RyaW5nKTogUHJvbWlzZTxTY2hvb2xEaXN0cmljdFtdPiB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlamVjdCkgPT4ge1xyXG4gICAgc29hcC5DbGllbnQucHJvY2Vzc0Fub255bW91c1JlcXVlc3Q8RGlzdHJpY3RMaXN0WE1MT2JqZWN0IHwgdW5kZWZpbmVkPihcclxuICAgICAgJ2h0dHBzOi8vc3VwcG9ydC5lZHVwb2ludC5jb20vU2VydmljZS9IREluZm9Db21tdW5pY2F0aW9uLmFzbXgnLFxyXG4gICAgICB7XHJcbiAgICAgICAgcGFyYW1TdHI6IHtcclxuICAgICAgICAgIEtleTogJzVFNEI3ODU5LUI4MDUtNDc0Qi1BODMzLUZEQjE1RDIwNUQ0MCcsXHJcbiAgICAgICAgICBNYXRjaFRvRGlzdHJpY3RaaXBDb2RlOiB6aXBDb2RlLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH1cclxuICAgIClcclxuICAgICAgLnRoZW4oKHhtbE9iamVjdCkgPT4ge1xyXG4gICAgICAgIGlmICgheG1sT2JqZWN0IHx8ICF4bWxPYmplY3QuRGlzdHJpY3RMaXN0cy5EaXN0cmljdEluZm9zLkRpc3RyaWN0SW5mbykgcmV0dXJuIHJlcyhbXSk7XHJcbiAgICAgICAgcmVzKFxyXG4gICAgICAgICAgeG1sT2JqZWN0LkRpc3RyaWN0TGlzdHMuRGlzdHJpY3RJbmZvcy5EaXN0cmljdEluZm8ubWFwKChkaXN0cmljdCkgPT4gKHtcclxuICAgICAgICAgICAgcGFyZW50VnVlVXJsOiBkaXN0cmljdFsnQF9QdnVlVVJMJ10sXHJcbiAgICAgICAgICAgIGFkZHJlc3M6IGRpc3RyaWN0WydAX0FkZHJlc3MnXSxcclxuICAgICAgICAgICAgaWQ6IGRpc3RyaWN0WydAX0Rpc3RyaWN0SUQnXSxcclxuICAgICAgICAgICAgbmFtZTogZGlzdHJpY3RbJ0BfTmFtZSddLFxyXG4gICAgICAgICAgfSkpXHJcbiAgICAgICAgKTtcclxuICAgICAgfSlcclxuICAgICAgLmNhdGNoKHJlamVjdCk7XHJcbiAgfSk7XHJcbn1cclxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7RUFRQTs7RUFFQSxTQUFTQSxNQUFNLENBQUNDLE1BQWEsRUFBQ0MsRUFBTSxFQUEwQjtJQUM1RCxJQUFHO01BQ0Q7TUFDQSxPQUFPLElBQUlDLE9BQU8sQ0FBQyxDQUFDQyxHQUFHLEVBQUNDLEdBQUc7UUFBQSxPQUFHSixNQUFNLENBQUNLLFNBQVMsQ0FBQ0osRUFBRSxDQUFDSyxLQUFLLEVBQUMsSUFBSSxFQUFDLEtBQUssQ0FBQyxDQUFDQyxJQUFJLENBQUNDLE1BQU07VUFBQSxPQUFFTCxHQUFHLENBQUNLLE1BQU0sQ0FBQztRQUFBLEVBQUMsQ0FBQ0MsS0FBSyxDQUFDQyxLQUFLO1VBQUEsT0FBRU4sR0FBRyxDQUFDTSxLQUFLLENBQUM7UUFBQSxFQUFDO01BQUEsRUFBQztJQUN6SCxDQUFDLFFBQU1BLEtBQUssRUFBQztNQUFDQyxPQUFPLENBQUNDLEdBQUcsQ0FBQ0YsS0FBSyxFQUFDLGVBQWUsQ0FBQztNQUM5QztNQUNBLE9BQU8sSUFBSVIsT0FBTyxDQUFDLENBQUNDLEdBQUcsRUFBQ0MsR0FBRztRQUFBLE9BQUdKLE1BQU0sQ0FBQ0ssU0FBUyxDQUFDSixFQUFFLENBQUNLLEtBQUssRUFBQyxJQUFJLEVBQUMsS0FBSyxDQUFDLENBQUND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