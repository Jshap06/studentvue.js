import { RequestOptions, LoginCredentials } from './Client.interfaces';
import { RequestOptions as AnonymousRequestOptions } from '../../soap/Client/Client.interfaces';
/**
 * Transport for Edupoint's newer REST "mobile" API
 * (`/api/v1/mobile/<webServiceHandleName>/<methodName>`), reverse engineered from the official
 * StudentVUE Android app. This is a sibling of `utils/soap/Client/Client`, which talks to the
 * deprecated `ProcessWebServiceRequest` SOAP endpoint - the two have the same public shape
 * (`processRequest`/`processAnonymousRequest`/credential getters) so a consumer can switch
 * transports by swapping which one it extends.
 *
 * Unlike the SOAP API (which re-sends the student's username/password with every single
 * request), the REST API is session-based: `AttemptLogin` exchanges credentials for a short-lived
 * `access_token` + `refresh_token` pair, every other call sends `Authorization: Bearer
 * <access_token>`, and a `401` is recovered from by silently calling `AttemptLogin` again with
 * `{ token: refresh_token }`. This class does that login/refresh dance internally and
 * transparently so callers never need to call a login method themselves - just like the SOAP
 * client, you construct it with credentials and start calling data methods.
 *
 * Caveats (see conversation/decompile notes - this was not confirmed against a live server):
 * - The official app also sends an `edupointkeyversion` header (an AES-encrypted,
 *   date-based value) and, for a handful of methods (`Gradebook`, `GetChildListData`,
 *   `GenerateAuthToken`, `GetStudentDisciplineData`, `GetCalendarData`, `StudentClassList`,
 *   `GetSynergyMailMessage`, `GetStudentHWNotes`, `GetStudentClasesForGivenDayResponse`), an
 *   additional request signature produced by an Android hardware-attested key
 *   (`addAndroidSignatureHeaders`/`signAndroidRequest`). Neither is implemented here: the key
 *   version header could not be reconstructed with full confidence, and the signature
 *   fundamentally requires real Android Keystore hardware, so it cannot be reproduced from a
 *   plain JS client. Both appear to be optional/best-effort on the server, since this is
 *   unauthenticated-by-attestation traffic either way.
 *
 * @description
 * ```js
 * super.processRequest({ methodName: 'Refer to StudentVue/docs', paramStr: { AnythingThatCanBePassed: true }});
 * // Makes the request below:
 * ```
 *
 * ```http
 * POST /api/v1/mobile/PXPWebServices/Refer to StudentVue/docs HTTP/1.1
 * Content-Type: application/json
 * User-Agent: ksoap
 * AppNameOSAndVersion: VUE-STUDENT|Android|1.0.0
 * Authorization: Bearer <access_token>
 *
 * { "arguments": { "request": { "AnythingThatCanBePassed": true } } }
 * ```
 *
 * which responds with:
 * ```json
 * { "data": { "...": "..." }, "access_token": "...", "refresh_token": "..." }
 * ```
 */
export default class Client {
    private __username__;
    private __password__;
    private __district__;
    private static url;
    private readonly isParent;
    encrypted: boolean;
    private tokens;
    private pendingAuth;
    /**
     * Sent in the `AppNameOSAndVersion` header. The server has not been confirmed to validate
     * these values, so they're left as overridable statics rather than hardcoded.
     */
    static appName: string;
    static appVersion: string;
    get district(): string;
    get username(): string;
    get password(): string;
    get proxyUrl(): string;
    protected get credentials(): LoginCredentials;
    constructor(credentials: LoginCredentials, Purl?: string);
    private buildUrl;
    /**
     * Ensures an `access_token` is available before a non-login call goes out, logging in once
     * (and only once, even if several calls race) if one hasn't been obtained yet.
     */
    private ensureAuthenticated;
    private login;
    private refresh;
    /**
     * Public entry point for callers that hold a `rest.Client` by composition rather than
     * extending it (e.g. a class that already extends `soap.Client` and wants to use this
     * transport for just one method). Thin wrapper around `processRequest`.
     */
    request<T extends object | undefined>(options: RequestOptions): Promise<T>;
    /**
     * Create a POST request to the REST mobile API to fetch data
     * @param options Options to provide when making a request to the servers
     * @returns Returns a plain JSON object, already unwrapped from the `{ data: ... }` envelope.
     * @see https://github.com/StudentVue/docs
     */
    protected processRequest<T extends object | undefined>(options: RequestOptions): Promise<T>;
    private processRequestNative;
    /**
     * Same as `processRequestNative`, but for contexts (browsers) that can't hit the mobile API
     * directly because of CORS - relayed through `<proxyUrl>/fulfillRest` instead, the REST sibling
     * of `fulfillAxios`. The proxy builds the real `Authorization` header and the
     * double-JSON-encoded body itself (so it can decrypt an `encrypted` password first), and injects
     * its own server-side `edupointkeyversion`; this method just hands it the pieces.
     */
    private processRequestWeb;
    /**
     * Edupoint has no REST equivalent for the anonymous district-lookup call
     * (`HDInfoServices.GetMatchingDistrictList`) - the official app still issues that one over
     * the legacy SOAP endpoint (`support.edupoint.com/Service/HDInfoCommunication.asmx`). This
     * simply delegates to the SOAP client so callers of `rest.Client` still have the method
     * available.
     */
    static processAnonymousRequest<T extends object | undefined>(url: string, options?: Partial<AnonymousRequestOptions>, preparse?: (xml: string) => string): Promise<T>;
}
