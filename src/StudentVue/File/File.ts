import { LoginCredentials } from '../../utils/soap/Client/Client.interfaces';
import soap from '../../utils/soap/soap';
import rest from '../../utils/rest/rest';

/**
 * File class
 * @abstract
 * @extends {soap.Client}
 * @constructor
 */
export default abstract class File<T> extends soap.Client {
  public readonly documentGu: string;

  private readonly methodName: string;

  /**
   * When given, `get()` uses this REST method instead of the SOAP `methodName` - see
   * `Document.ts` for the only subclass that currently sets this (REST's
   * `GetStudentDocumentContent`, confirmed against a real sample). `ReportCard.ts` leaves this
   * unset and stays on SOAP (`GetReportCardDocumentData`) since no REST equivalent for it has
   * been confirmed yet.
   */
  private readonly restMethodName?: string;

  public constructor(credentials: LoginCredentials, documentGu: string, methodName: string, restMethodName?: string) {
    super(credentials);

    /**
     * The DocumentGU of the file so that it can be fetched from synergy servers
     * This value is important for `File.get()` method. You cannot fetch the file without it
     * @public
     * @readonly
     * @type {string}
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
     * @type {string}
     */
    this.methodName = methodName;

    this.restMethodName = restMethodName;
  }

  /**
   * Parse the response into an ordinary object. This method must be written for every class
   * that extends File. When `restMethodName` is set (REST path), this receives the REST JSON
   * response instead of an XML object - the name is kept for the SOAP subclasses (`ReportCard`)
   * that still implement it against the XML shape.
   * @param {unknown} xmlObject The XML object (SOAP) or plain JSON object (REST) passed after parsing
   * @protected
   * @returns {T} Returns a reformatted object to make it easier for code
   * @description
   * ```js
   * const xmlObject = await super.processRequest({...}); // { "@_Attribute": [{ "@_Nested": [{...}, {...}]}]}
   * parseXMLObject(xmlObject); // { attribute: { nested: [{...}, {...}] } }
   *
   * ```
   */
  protected abstract parseXMLObject(xmlObject: unknown): T;

  /**
   * Retrieve the file from synergy servers. After retrieving the response, this method calls
   * parseXMLObject which must be defined to parse the response into a readable, typesafe object.
   * @public
   * @returns {Promise<T>} Returns a base64 object
   * @description
   * ```js
   * const base64 = await document.get(); // { attribute: { nested: {...} }, base64: "base64 code" }
   * ```
   */
  public get(): Promise<T> {
    if (this.restMethodName != null) {
      return new Promise((res, rej) => {
        new rest.Client(this.credentials,this.proxyUrl)
          .request<Record<string, unknown>>({
            methodName: this.restMethodName as string,
            paramStr: { childIntID: 0, documentGU: this.documentGu },
          })
          .then((data) => {
            res(this.parseXMLObject(data));
          })
          .catch(rej);
      });
    }

    return new Promise((res, rej) => {
      super
        .processRequest<Record<string, unknown>>({
          methodName: this.methodName,
          paramStr: { childIntId: 0, DocumentGU: this.documentGu },
        })
        .then((base64Data) => {
          res(this.parseXMLObject(base64Data));
        })
        .catch(rej);
    });
  }
}
