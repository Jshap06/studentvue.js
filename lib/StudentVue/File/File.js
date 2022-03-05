(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "../../utils/soap/soap"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("../../utils/soap/soap"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.soap);
    global.File = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports, _soap) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  _soap = _interopRequireDefault(_soap);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  /**
   * File class
   * @abstract
   * @extends {soap.Client}
   * @constructor
   */
  class File extends _soap.default.Client {
    constructor(credentials, documentGu, methodName) {
      super(credentials);
      /**
       * The DocumentGU of the file so that it can be fetched from synergy servers
       * This value is important for `File.get()` method. You cannot fetch the file without it
       * @public
       * @readonly
       */

      this.documentGu = documentGu;
      /**
       * Synergy servers have different methods for retrieving files. For example,
       *
       * To retrieve a document, there is a specific method for it: `GetContentOfAttachedDoc`
       *
       * To retrieve a report card, there is a specific method for it: `GetReportCardDocumentData`
       *
       * Therefore, methodName must be defined to get retrieve the file data. See how methodName is implemented
       * in `Document.ts` and `ReportCard.ts`
       * @private
       * @readonly
       */

      this.methodName = methodName;
    }
    /**
     * Parse the XML object to translate it into an ordinary object. This method must be written for every class that extends Document (which gets the file from synergy servers using a POST fetch request)
     * @param {unknown} xmlObject The XML Object passed after parsing
     * @protected
     * @returns {T} Returns a reformatted XML object to make it easier for code
     * @description
     * ```js
     * const xmlObject = await super.processRequest({...}); // { "@_Attribute": [{ "@_Nested": [{...}, {...}]}]}
     * parseXMLObject(xmlObject); // { attribute: { nested: [{...}, {...}] } }
     *
     * ```
     */


    /**
     * Retrieve the file from synergy servers. After retrieving the xmlObject, this method calls parseXMLObject which must be defined to parse the xmlObject into a readable, typesafe object.
     * @public
     * @returns {Promise<T>} Returns a base64 object
     * @description
     * ```js
     * const base64 = await document.get(); // { attribute: { nested: {...} }, base64: "base64 code" }
     * ```
     */
    get() {
      return new Promise(async (res, rej) => {
        try {
          const base64Data = await super.processRequest({
            methodName: this.methodName,
            paramStr: {
              childIntId: 0,
              DocumentGU: this.documentGu
            }
          });
          res(this.parseXMLObject(base64Data));
        } catch (e) {
          rej(e);
        }
      });
    }

  }

  _exports.default = File;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9TdHVkZW50VnVlL0ZpbGUvRmlsZS50cyJdLCJuYW1lcyI6WyJGaWxlIiwic29hcCIsIkNsaWVudCIsImNvbnN0cnVjdG9yIiwiY3JlZGVudGlhbHMiLCJkb2N1bWVudEd1IiwibWV0aG9kTmFtZSIsImdldCIsIlByb21pc2UiLCJyZXMiLCJyZWoiLCJiYXNlNjREYXRhIiwicHJvY2Vzc1JlcXVlc3QiLCJwYXJhbVN0ciIsImNoaWxkSW50SWQiLCJEb2N1bWVudEdVIiwicGFyc2VYTUxPYmplY3QiLCJlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNlLFFBQWVBLElBQWYsU0FBK0JDLGNBQUtDLE1BQXBDLENBQTJDO0FBS2pEQyxJQUFBQSxXQUFXLENBQUNDLFdBQUQsRUFBZ0NDLFVBQWhDLEVBQW9EQyxVQUFwRCxFQUF3RTtBQUN4RixZQUFNRixXQUFOO0FBRUE7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUNJLFdBQUtDLFVBQUwsR0FBa0JBLFVBQWxCO0FBRUE7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUNJLFdBQUtDLFVBQUwsR0FBa0JBLFVBQWxCO0FBQ0Q7QUFFRDtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNTQyxJQUFBQSxHQUFHLEdBQWU7QUFDdkIsYUFBTyxJQUFJQyxPQUFKLENBQVksT0FBT0MsR0FBUCxFQUFZQyxHQUFaLEtBQW9CO0FBQ3JDLFlBQUk7QUFDRixnQkFBTUMsVUFBbUMsR0FBRyxNQUFNLE1BQU1DLGNBQU4sQ0FBcUI7QUFDckVOLFlBQUFBLFVBQVUsRUFBRSxLQUFLQSxVQURvRDtBQUVyRU8sWUFBQUEsUUFBUSxFQUFFO0FBQUVDLGNBQUFBLFVBQVUsRUFBRSxDQUFkO0FBQWlCQyxjQUFBQSxVQUFVLEVBQUUsS0FBS1Y7QUFBbEM7QUFGMkQsV0FBckIsQ0FBbEQ7QUFJQUksVUFBQUEsR0FBRyxDQUFDLEtBQUtPLGNBQUwsQ0FBb0JMLFVBQXBCLENBQUQsQ0FBSDtBQUNELFNBTkQsQ0FNRSxPQUFPTSxDQUFQLEVBQVU7QUFDVlAsVUFBQUEsR0FBRyxDQUFDTyxDQUFELENBQUg7QUFDRDtBQUNGLE9BVk0sQ0FBUDtBQVdEOztBQWxFdUQiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBMb2dpbkNyZWRlbnRpYWxzIH0gZnJvbSAnLi4vLi4vdXRpbHMvc29hcC9DbGllbnQvQ2xpZW50LmludGVyZmFjZXMnO1xyXG5pbXBvcnQgc29hcCBmcm9tICcuLi8uLi91dGlscy9zb2FwL3NvYXAnO1xyXG5pbXBvcnQgeyBCYXNlNjRTdHJpbmcgfSBmcm9tICcuLi8uLi91dGlscy90eXBlcyc7XHJcblxyXG4vKipcclxuICogRmlsZSBjbGFzc1xyXG4gKiBAYWJzdHJhY3RcclxuICogQGV4dGVuZHMge3NvYXAuQ2xpZW50fVxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbmV4cG9ydCBkZWZhdWx0IGFic3RyYWN0IGNsYXNzIEZpbGU8VD4gZXh0ZW5kcyBzb2FwLkNsaWVudCB7XHJcbiAgcHVibGljIHJlYWRvbmx5IGRvY3VtZW50R3U6IHN0cmluZztcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBtZXRob2ROYW1lOiBzdHJpbmc7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihjcmVkZW50aWFsczogTG9naW5DcmVkZW50aWFscywgZG9jdW1lbnRHdTogc3RyaW5nLCBtZXRob2ROYW1lOiBzdHJpbmcpIHtcclxuICAgIHN1cGVyKGNyZWRlbnRpYWxzKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBEb2N1bWVudEdVIG9mIHRoZSBmaWxlIHNvIHRoYXQgaXQgY2FuIGJlIGZldGNoZWQgZnJvbSBzeW5lcmd5IHNlcnZlcnNcclxuICAgICAqIFRoaXMgdmFsdWUgaXMgaW1wb3J0YW50IGZvciBgRmlsZS5nZXQoKWAgbWV0aG9kLiBZb3UgY2Fubm90IGZldGNoIHRoZSBmaWxlIHdpdGhvdXQgaXRcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqIEByZWFkb25seVxyXG4gICAgICovXHJcbiAgICB0aGlzLmRvY3VtZW50R3UgPSBkb2N1bWVudEd1O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU3luZXJneSBzZXJ2ZXJzIGhhdmUgZGlmZmVyZW50IG1ldGhvZHMgZm9yIHJldHJpZXZpbmcgZmlsZXMuIEZvciBleGFtcGxlLFxyXG4gICAgICpcclxuICAgICAqIFRvIHJldHJpZXZlIGEgZG9jdW1lbnQsIHRoZXJlIGlzIGEgc3BlY2lmaWMgbWV0aG9kIGZvciBpdDogYEdldENvbnRlbnRPZkF0dGFjaGVkRG9jYFxyXG4gICAgICpcclxuICAgICAqIFRvIHJldHJpZXZlIGEgcmVwb3J0IGNhcmQsIHRoZXJlIGlzIGEgc3BlY2lmaWMgbWV0aG9kIGZvciBpdDogYEdldFJlcG9ydENhcmREb2N1bWVudERhdGFgXHJcbiAgICAgKlxyXG4gICAgICogVGhlcmVmb3JlLCBtZXRob2ROYW1lIG11c3QgYmUgZGVmaW5lZCB0byBnZXQgcmV0cmlldmUgdGhlIGZpbGUgZGF0YS4gU2VlIGhvdyBtZXRob2ROYW1lIGlzIGltcGxlbWVudGVkXHJcbiAgICAgKiBpbiBgRG9jdW1lbnQudHNgIGFuZCBgUmVwb3J0Q2FyZC50c2BcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKiBAcmVhZG9ubHlcclxuICAgICAqL1xyXG4gICAgdGhpcy5tZXRob2ROYW1lID0gbWV0aG9kTmFtZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFBhcnNlIHRoZSBYTUwgb2JqZWN0IHRvIHRyYW5zbGF0ZSBpdCBpbnRvIGFuIG9yZGluYXJ5IG9iamVjdC4gVGhpcyBtZXRob2QgbXVzdCBiZSB3cml0dGVuIGZvciBldmVyeSBjbGFzcyB0aGF0IGV4dGVuZHMgRG9jdW1lbnQgKHdoaWNoIGdldHMgdGhlIGZpbGUgZnJvbSBzeW5lcmd5IHNlcnZlcnMgdXNpbmcgYSBQT1NUIGZldGNoIHJlcXVlc3QpXHJcbiAgICogQHBhcmFtIHt1bmtub3dufSB4bWxPYmplY3QgVGhlIFhNTCBPYmplY3QgcGFzc2VkIGFmdGVyIHBhcnNpbmdcclxuICAgKiBAcHJvdGVjdGVkXHJcbiAgICogQHJldHVybnMge1R9IFJldHVybnMgYSByZWZvcm1hdHRlZCBYTUwgb2JqZWN0IHRvIG1ha2UgaXQgZWFzaWVyIGZvciBjb2RlXHJcbiAgICogQGRlc2NyaXB0aW9uXHJcbiAgICogYGBganNcclxuICAgKiBjb25zdCB4bWxPYmplY3QgPSBhd2FpdCBzdXBlci5wcm9jZXNzUmVxdWVzdCh7Li4ufSk7IC8vIHsgXCJAX0F0dHJpYnV0ZVwiOiBbeyBcIkBfTmVzdGVkXCI6IFt7Li4ufSwgey4uLn1dfV19XHJcbiAgICogcGFyc2VYTUxPYmplY3QoeG1sT2JqZWN0KTsgLy8geyBhdHRyaWJ1dGU6IHsgbmVzdGVkOiBbey4uLn0sIHsuLi59XSB9IH1cclxuICAgKlxyXG4gICAqIGBgYFxyXG4gICAqL1xyXG4gIHByb3RlY3RlZCBhYnN0cmFjdCBwYXJzZVhNTE9iamVjdCh4bWxPYmplY3Q6IHVua25vd24pOiBUO1xyXG5cclxuICAvKipcclxuICAgKiBSZXRyaWV2ZSB0aGUgZmlsZSBmcm9tIHN5bmVyZ3kgc2VydmVycy4gQWZ0ZXIgcmV0cmlldmluZyB0aGUgeG1sT2JqZWN0LCB0aGlzIG1ldGhvZCBjYWxscyBwYXJzZVhNTE9iamVjdCB3aGljaCBtdXN0IGJlIGRlZmluZWQgdG8gcGFyc2UgdGhlIHhtbE9iamVjdCBpbnRvIGEgcmVhZGFibGUsIHR5cGVzYWZlIG9iamVjdC5cclxuICAgKiBAcHVibGljXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8VD59IFJldHVybnMgYSBiYXNlNjQgb2JqZWN0XHJcbiAgICogQGRlc2NyaXB0aW9uXHJcbiAgICogYGBganNcclxuICAgKiBjb25zdCBiYXNlNjQgPSBhd2FpdCBkb2N1bWVudC5nZXQoKTsgLy8geyBhdHRyaWJ1dGU6IHsgbmVzdGVkOiB7Li4ufSB9LCBiYXNlNjQ6IFwiYmFzZTY0IGNvZGVcIiB9XHJcbiAgICogYGBgXHJcbiAgICovXHJcbiAgcHVibGljIGdldCgpOiBQcm9taXNlPFQ+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzLCByZWopID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBiYXNlNjREYXRhOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IGF3YWl0IHN1cGVyLnByb2Nlc3NSZXF1ZXN0KHtcclxuICAgICAgICAgIG1ldGhvZE5hbWU6IHRoaXMubWV0aG9kTmFtZSxcclxuICAgICAgICAgIHBhcmFtU3RyOiB7IGNoaWxkSW50SWQ6IDAsIERvY3VtZW50R1U6IHRoaXMuZG9jdW1lbnRHdSB9LFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJlcyh0aGlzLnBhcnNlWE1MT2JqZWN0KGJhc2U2NERhdGEpKTtcclxuICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIHJlaihlKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbiJdfQ==