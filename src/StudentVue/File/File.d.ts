import { LoginCredentials } from '../../utils/soap/Client/Client.interfaces';
import soap from '../../utils/soap/soap';
import { ApiType } from '../../utils/fallback/fallback';
/**
 * File class
 * @abstract
 * @extends {soap.Client}
 * @constructor
 */
export default abstract class File<T> extends soap.Client {
    readonly documentGu: string;
    private readonly methodName;
    /**
     * When given, `get()` uses this REST method instead of the SOAP `methodName` - see
     * `Document.ts` for the only subclass that currently sets this (REST's
     * `GetStudentDocumentContent`, confirmed against a real sample). `ReportCard.ts` leaves this
     * unset and stays on SOAP (`GetReportCardDocumentData`) since no REST equivalent for it has
     * been confirmed yet.
     */
    private readonly restMethodName?;
    /**
     * Which transport `get()` tries first when both are available (`restMethodName` is set). The
     * other one is only used as a fallback - see `utils/fallback`.
     */
    private readonly api;
    constructor(credentials: LoginCredentials, documentGu: string, methodName: string, restMethodName?: string, api?: ApiType);
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
    get(): Promise<T>;
}
