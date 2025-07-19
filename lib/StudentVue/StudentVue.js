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

  async function getGradebooks(client, lock, setLock) {
    const periods = localStorage.getItem("mps");
    if (!periods) {
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
      localStorage.setItem("mps", JSON.stringify(periods));
      var _a2 = periods;
      var _f2 = mp => {
        return client.gradebook(mp.index);
      };
      var _r2 = [];
      for (var _i2 = 0; _i2 < _a2.length; _i2++) {
        _r2.push(_f2(_a2[_i2], _i2, _a2));
      }
      const remainder = await Promise.all(_r2);
      return [result, ...remainder];
    } else {
      const mps = JSON.parse(periods);
      var _a3 = mps;
      var _f3 = mp => {
        return client.gradebook(mp.index);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJnZXRHcmFkZWJvb2tzIiwiY2xpZW50IiwibG9jayIsInNldExvY2siLCJwZXJpb2RzIiwibG9jYWxTdG9yYWdlIiwiZ2V0SXRlbSIsInJlc3VsdCIsImdyYWRlYm9vayIsInJlcG9ydGluZ1BlcmlvZCIsImF2YWlsYWJsZSIsIm5hbWUiLCJpbmRleCIsImRhdGUiLCJzZXRJdGVtIiwiSlNPTiIsInN0cmluZ2lmeSIsIm1wIiwicmVtYWluZGVyIiwiUHJvbWlzZSIsImFsbCIsIm1wcyIsInBhcnNlIiwibG9naW4iLCJkaXN0cmljdFVybCIsImNyZWRlbnRpYWxzIiwicHJveHlVcmwiLCJyZXMiLCJyZWoiLCJsZW5ndGgiLCJSZXF1ZXN0RXhjZXB0aW9uIiwibWVzc2FnZSIsInVybCIsImNoYXJBdCIsImVuZHBvaW50IiwiQ2xpZW50IiwidXNlcm5hbWUiLCJwYXNzd29yZCIsImlzUGFyZW50IiwiZW5jcnlwdGVkIiwidGhlbiIsInJlc3BvbnNlIiwiY29uc29sZSIsImxvZyIsInJlc3BvbnNlcyIsImNhdGNoIiwiZmluZERpc3RyaWN0cyIsInppcENvZGUiLCJyZWplY3QiLCJzb2FwIiwicHJvY2Vzc0Fub255bW91c1JlcXVlc3QiLCJwYXJhbVN0ciIsIktleSIsIk1hdGNoVG9EaXN0cmljdFppcENvZGUiLCJ4bWxPYmplY3QiLCJEaXN0cmljdExpc3RzIiwiRGlzdHJpY3RJbmZvcyIsIkRpc3RyaWN0SW5mbyIsImRpc3RyaWN0IiwicGFyZW50VnVlVXJsIiwiYWRkcmVzcyIsImlkIl0sInNvdXJjZXMiOlsiLi4vLi4vc3JjL1N0dWRlbnRWdWUvU3R1ZGVudFZ1ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTY2hvb2xEaXN0cmljdCwgVXNlckNyZWRlbnRpYWxzIH0gZnJvbSAnLi9TdHVkZW50VnVlLmludGVyZmFjZXMnO1xyXG5pbXBvcnQgQ2xpZW50IGZyb20gJy4vQ2xpZW50L0NsaWVudCc7XHJcbmltcG9ydCBzb2FwIGZyb20gJy4uL3V0aWxzL3NvYXAvc29hcCc7XHJcbmltcG9ydCB7IERpc3RyaWN0TGlzdFhNTE9iamVjdCB9IGZyb20gJy4vU3R1ZGVudFZ1ZS54bWwnO1xyXG5pbXBvcnQgUmVxdWVzdEV4Y2VwdGlvbiBmcm9tICcuL1JlcXVlc3RFeGNlcHRpb24vUmVxdWVzdEV4Y2VwdGlvbic7XHJcbmltcG9ydCB7IEdyYWRlYm9vayB9IGZyb20gJy4vQ2xpZW50L0NsaWVudC5pbnRlcmZhY2VzJztcclxuXHJcblxyXG4vL2hlbHBlciBmdW5jdGlvbiBmdWNrIHknYWxsIGdvb2Z5IGFoaFxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZ2V0R3JhZGVib29rcyhjbGllbnQ6Q2xpZW50LGxvY2s6YW55LHNldExvY2s6YW55KTpQcm9taXNlPFtHcmFkZWJvb2ssYW55XVtdPntcclxuXHJcbiAgICBjb25zdCBwZXJpb2RzPWxvY2FsU3RvcmFnZS5nZXRJdGVtKFwibXBzXCIpO1xyXG4gICAgaWYoIXBlcmlvZHMpe1xyXG4gICAgICAgIC8vY2FjaGVMb2FkaW5nXHJcbiAgICAgICAgY29uc3QgcmVzdWx0PWF3YWl0IGNsaWVudC5ncmFkZWJvb2soKVxyXG4gICAgLy8gICAgc2V0TG9jayh0cnVlKTtcclxuICAgICAgICBjb25zdCBwZXJpb2RzPXJlc3VsdFswXS5yZXBvcnRpbmdQZXJpb2QuYXZhaWxhYmxlLm1hcCgoeyBuYW1lLCBpbmRleCwgZGF0ZSB9KSA9PiAoe1xyXG5cdFx0XHRuYW1lOm5hbWUsXHJcblx0XHRcdGRhdGU6ZGF0ZSxcclxuXHRcdFx0aW5kZXg6IGluZGV4LFxyXG5cdFx0fSkpXHJcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwibXBzXCIsSlNPTi5zdHJpbmdpZnkocGVyaW9kcykpXHJcbiAgICAgIGNvbnN0IHJlbWFpbmRlcj1hd2FpdCBQcm9taXNlLmFsbChwZXJpb2RzLm1hcChtcD0+Y2xpZW50LmdyYWRlYm9vayhtcC5pbmRleCkpKVxyXG4gICAgICByZXR1cm4gW3Jlc3VsdCwuLi5yZW1haW5kZXJdXHJcblxyXG5cclxuICAgIH1cclxuICAgIGVsc2V7XHJcbiAgICAgICAgY29uc3QgbXBzOntpbmRleDpudW1iZXIsZGF0ZTphbnl9W109SlNPTi5wYXJzZShwZXJpb2RzKTtcclxuICAgICAgICBjb25zdCByZXN1bHQ9YXdhaXQgUHJvbWlzZS5hbGwobXBzLm1hcChtcD0+Y2xpZW50LmdyYWRlYm9vayhtcC5pbmRleCkpKVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbmV4cG9ydCB7Q2xpZW50fVxyXG5cclxuLyoqIEBtb2R1bGUgU3R1ZGVudFZ1ZSAqL1xyXG5cclxuLyoqXHJcbiAqIExvZ2luIHRvIHRoZSBTdHVkZW50VlVFIEFQSVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZGlzdHJpY3RVcmwgVGhlIFVSTCBvZiB0aGUgZGlzdHJpY3Qgd2hpY2ggY2FuIGJlIGZvdW5kIHVzaW5nIGBmaW5kRGlzdHJpY3RzKClgIG1ldGhvZFxyXG4gKiBAcGFyYW0ge1VzZXJDcmVkZW50aWFsc30gY3JlZGVudGlhbHMgVXNlciBjcmVkZW50aWFscyBvZiB0aGUgc3R1ZGVudFxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxDbGllbnQ+fSBSZXR1cm5zIHRoZSBjbGllbnQgYW5kIHRoZSBpbmZvcm1hdGlvbiBvZiB0aGUgc3R1ZGVudCB1cG9uIHN1Y2Nlc3NmdWwgbG9naW5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBsb2dpbihkaXN0cmljdFVybDogc3RyaW5nLCBjcmVkZW50aWFsczogVXNlckNyZWRlbnRpYWxzLHByb3h5VXJsOnN0cmluZz1cImh0dHBzOi8vc3R1ZGVudHZ1ZWxpYi51cC5yYWlsd2F5LmFwcFwiKTogUHJvbWlzZTx7Y2xpZW50OkNsaWVudCxyZXNwb25zZXM6W0dyYWRlYm9vayxhbnldW119PiB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xyXG4gICAgaWYgKGRpc3RyaWN0VXJsLmxlbmd0aCA9PT0gMClcclxuICAgICAgcmV0dXJuIHJlaihuZXcgUmVxdWVzdEV4Y2VwdGlvbih7IG1lc3NhZ2U6ICdEaXN0cmljdCBVUkwgY2Fubm90IGJlIGFuIGVtcHR5IHN0cmluZycgfSkpO1xyXG4gICAgY29uc3QgdXJsID0gZGlzdHJpY3RVcmwuY2hhckF0KGRpc3RyaWN0VXJsLmxlbmd0aCAtIDEpID09PSAnLycgPyBkaXN0cmljdFVybCA6IGAke2Rpc3RyaWN0VXJsfS9gO1xyXG4gICAgLy9zdGFkYXJkaXplcyBzbyB1IGtub3cgaXQnbGwgZW5kIGluIGEgc2xhc2ggZm8gc2hvXHJcbiAgICBjb25zdCBlbmRwb2ludCA9IHVybCtcIlNlcnZpY2UvUFhQQ29tbXVuaWNhdGlvbi5hc214XCI7XHJcbiAgICBjb25zdCBjbGllbnQgPSBuZXcgQ2xpZW50KFxyXG4gICAgICB7XHJcbiAgICAgICAgdXNlcm5hbWU6IGNyZWRlbnRpYWxzLnVzZXJuYW1lLFxyXG4gICAgICAgIHBhc3N3b3JkOiBjcmVkZW50aWFscy5wYXNzd29yZCxcclxuICAgICAgICBkaXN0cmljdFVybDogZW5kcG9pbnQsXHJcbiAgICAgICAgaXNQYXJlbnQ6IGNyZWRlbnRpYWxzLmlzUGFyZW50LFxyXG4gICAgICAgIGVuY3J5cHRlZDpjcmVkZW50aWFscy5lbmNyeXB0ZWRcclxuICAgICAgfSxcclxuICAgICAgcHJveHlVcmwsdXJsXHJcbiAgICApO1xyXG4gICAgICBnZXRHcmFkZWJvb2tzKGNsaWVudCxudWxsLG51bGwpXHJcbiAgICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiaW1tZWRpYXRlIGxvZ2luIHJlc3BvbnNlXCIscmVzcG9uc2UscHJveHlVcmwpO1xyXG4gICAgICAgIHJlcyh7Y2xpZW50OmNsaWVudCxyZXNwb25zZXM6cmVzcG9uc2V9KTtcclxuICAgICAgfSlcclxuICAgICAgLmNhdGNoKHJlaik7XHJcbi8qXHJcbiAgICBjb25zdCBwMT1jbGllbnQuZ3JhZGVib29rKCk7XHJcbiAgICBjb25zdCBwMj1jbGllbnQuQ2hpbGRMaXN0KCk7XHJcbiAgICBQcm9taXNlLmFsbChbcDEscDJdKS50aGVuKGFsbD0+e1xyXG4gICAgICBjb25zdCBbZ3JhZGVzLGluZm9dPWFsbFxyXG4gICAgICBpZihpbmZvLilcclxuXHJcbiAgICB9KVxyXG4gICAgICAqL1xyXG4gICAgXHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGaW5kIHNjaG9vbCBkaXN0cmljdHMgdXNpbmcgYSB6aXBjb2RlXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB6aXBDb2RlIFRoZSB6aXBjb2RlIHRvIGdldCBhIGxpc3Qgb2Ygc2Nob29scyBmcm9tXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlPFNjaG9vbERpc3RyaWN0W10+fSBSZXR1cm5zIGEgbGlzdCBvZiBzY2hvb2wgZGlzdHJpY3RzIHdoaWNoIGNhbiBiZSB1c2VkIHRvIGxvZ2luIHRvIHRoZSBBUElcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBmaW5kRGlzdHJpY3RzKHppcENvZGU6IHN0cmluZyk6IFByb21pc2U8U2Nob29sRGlzdHJpY3RbXT4ge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWplY3QpID0+IHtcclxuICAgIHNvYXAuQ2xpZW50LnByb2Nlc3NBbm9ueW1vdXNSZXF1ZXN0PERpc3RyaWN0TGlzdFhNTE9iamVjdCB8IHVuZGVmaW5lZD4oXHJcbiAgICAgICdodHRwczovL3N1cHBvcnQuZWR1cG9pbnQuY29tL1NlcnZpY2UvSERJbmZvQ29tbXVuaWNhdGlvbi5hc214JyxcclxuICAgICAge1xyXG4gICAgICAgIHBhcmFtU3RyOiB7XHJcbiAgICAgICAgICBLZXk6ICc1RTRCNzg1OS1CODA1LTQ3NEItQTgzMy1GREIxNUQyMDVENDAnLFxyXG4gICAgICAgICAgTWF0Y2hUb0Rpc3RyaWN0WmlwQ29kZTogemlwQ29kZSxcclxuICAgICAgICB9LFxyXG4gICAgICB9XHJcbiAgICApXHJcbiAgICAgIC50aGVuKCh4bWxPYmplY3QpID0+IHtcclxuICAgICAgICBpZiAoIXhtbE9iamVjdCB8fCAheG1sT2JqZWN0LkRpc3RyaWN0TGlzdHMuRGlzdHJpY3RJbmZvcy5EaXN0cmljdEluZm8pIHJldHVybiByZXMoW10pO1xyXG4gICAgICAgIHJlcyhcclxuICAgICAgICAgIHhtbE9iamVjdC5EaXN0cmljdExpc3RzLkRpc3RyaWN0SW5mb3MuRGlzdHJpY3RJbmZvLm1hcCgoZGlzdHJpY3QpID0+ICh7XHJcbiAgICAgICAgICAgIHBhcmVudFZ1ZVVybDogZGlzdHJpY3RbJ0BfUHZ1ZVVSTCddLFxyXG4gICAgICAgICAgICBhZGRyZXNzOiBkaXN0cmljdFsnQF9BZGRyZXNzJ10sXHJcbiAgICAgICAgICAgIGlkOiBkaXN0cmljdFsnQF9EaXN0cmljdElEJ10sXHJcbiAgICAgICAgICAgIG5hbWU6IGRpc3RyaWN0WydAX05hbWUnXSxcclxuICAgICAgICAgIH0pKVxyXG4gICAgICAgICk7XHJcbiAgICAgIH0pXHJcbiAgICAgIC5jYXRjaChyZWplY3QpO1xyXG4gIH0pO1xyXG59XHJcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBUUE7O0VBRUEsZUFBZUEsYUFBYSxDQUFDQyxNQUFhLEVBQUNDLElBQVEsRUFBQ0MsT0FBVyxFQUE0QjtJQUV2RixNQUFNQyxPQUFPLEdBQUNDLFlBQVksQ0FBQ0MsT0FBTyxDQUFDLEtBQUssQ0FBQztJQUN6QyxJQUFHLENBQUNGLE9BQU8sRUFBQztNQUNSO01BQ0EsTUFBTUcsTUFBTSxHQUFDLE1BQU1OLE1BQU0sQ0FBQ08sU0FBUyxFQUFFO01BQ3pDO01BQUEsU0FDa0JELE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQ0UsZUFBZSxDQUFDQyxTQUFTO01BQUEsU0FBSyxDQUFDO1FBQUVDLElBQUk7UUFBRUMsS0FBSztRQUFFQztNQUFLLENBQUM7UUFBQSxPQUFNO1VBQ3ZGRixJQUFJLEVBQUNBLElBQUk7VUFDVEUsSUFBSSxFQUFDQSxJQUFJO1VBQ1RELEtB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