import CryptoJS from 'crypto-js';
import {
  RequestOptions,
  LoginCredentials,
  ParsedRequestError,
  ParsedRestResult,
  RestTokens,
} from './Client.interfaces';
import RequestException from '../../../StudentVue/RequestException/RequestException';
import soap from '../../soap/soap';
import { RequestOptions as AnonymousRequestOptions } from '../../soap/Client/Client.interfaces';

/**
 * UTF-8 safe base64 encode using only web-standard globals (`TextEncoder` + `btoa`), which exist
 * in both browsers and Node 16+. Encoding to UTF-8 bytes first keeps `btoa` from throwing on
 * characters outside Latin-1.
 */
function toBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  // eslint-disable-next-line no-undef
  return btoa(binary);
}

// Fixed key/IV embedded in the official app for the `edupointkeyversion` header. Used to apply
// to be a session cookie; it's now sent as a standalone header on every request instead, but the
// value itself is unchanged - just the current date and app version, AES-CBC/PKCS7 encrypted.
const EDUPOINT_KEY = CryptoJS.enc.Utf8.parse('b2524efb438b4532b322e633d5aff252');
const EDUPOINT_IV = CryptoJS.enc.Utf8.parse('AES');

function getDateMMDDYY(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  return `${mm}${dd}${yy}`;
}


function generateKey() : string {
  try {
    // Prepare key and IV
    let keyBytes = CryptoJS.enc.Utf8.parse('b2524efb438b4532b322e633d5aff252');  // Convert key to a word array
    let ivBytes = CryptoJS.enc.Utf8.parse('AES');  // Convert IV to a word array


    // Define the input string (date, version, etc.)
    const today = getDateMMDDYY();
    let input = `${today}|9.0.0|${today}|android`;

    // Encrypt the input string using AES with CBC mode and PKCS7 padding
    let encrypted = CryptoJS.AES.encrypt(input, keyBytes, {
      iv: ivBytes,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    // Convert the encrypted data to a Base64 string
    let encryptedString = encrypted.toString();

    console.log('API Key:', encryptedString);
    return encryptedString;
  } catch (error:any) {
    console.error(error);
    return error.message
  }
}
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
  private __username__: string;
  private __password__: string;
  private __district__: string;

  private static url: string;
  private readonly isParent: number;
  encrypted: boolean;

  private tokens: RestTokens = {};
  private pendingAuth: Promise<void> | null = null;

  /**
   * Sent in the `AppNameOSAndVersion` header. The server has not been confirmed to validate
   * these values, so they're left as overridable statics rather than hardcoded.
   */
  static appName = 'VUE-STUDENT';
  static appVersion = '1.0.0';

  public get district(): string {
    return this.__district__;
  }

  public get username(): string {
    return this.__username__;
  }

  public get password(): string {
    return this.__password__;
  }

  public get proxyUrl(): string {
    return Client.url;
  }

  protected get credentials(): LoginCredentials {
    return {
      username: this.username,
      password: this.password,
      districtUrl: this.district,
      encrypted: this.encrypted,
    };
  }

  constructor(credentials: LoginCredentials, Purl: string = 'native') {
    this.__username__ = credentials.username;
    this.__password__ = credentials.password;
    this.__district__ = credentials.districtUrl;

    this.isParent = credentials.isParent ? 1 : 0;
    this.encrypted = credentials.encrypted;
    Client.url = Purl;
  }

  private buildUrl(webServiceHandleName: string, methodName: string): string {
    const origin = new URL(this.__district__).origin;
    return `${origin}/api/v1/mobile/${webServiceHandleName}/${encodeURIComponent(methodName)}`;
  }

  /**
   * Ensures an `access_token` is available before a non-login call goes out, logging in once
   * (and only once, even if several calls race) if one hasn't been obtained yet.
   */
  private ensureAuthenticated(): Promise<void> {
    if (this.tokens.accessToken) return Promise.resolve();
    if (!this.pendingAuth) {
      this.pendingAuth = this.login().finally(() => {
        this.pendingAuth = null;
      });
    }
    return this.pendingAuth;
  }

  private async login(): Promise<void> {
    await this.processRequest({
      methodName: 'AttemptLogin',
      paramStr: {
        userID: this.username,
        password: this.password,
        userType: this.isParent ? 'Parent' : 'Student',
      },
    });
  }

  private async refresh(): Promise<void> {
    if (!this.tokens.refreshToken) throw new Error('No refresh token available');
    await this.processRequest({
      methodName: 'AttemptLogin',
      paramStr: {
        token: this.tokens.refreshToken,
        userType: this.isParent ? 'Parent' : 'Student',
      },
    });
  }

  /**
   * Public entry point for callers that hold a `rest.Client` by composition rather than
   * extending it (e.g. a class that already extends `soap.Client` and wants to use this
   * transport for just one method). Thin wrapper around `processRequest`.
   */
  public request<T extends object | undefined>(options: RequestOptions): Promise<T> {
    return this.processRequest<T>(options);
  }

  /**
   * Create a POST request to the REST mobile API to fetch data
   * @param options Options to provide when making a request to the servers
   * @returns Returns a plain JSON object, already unwrapped from the `{ data: ... }` envelope.
   * @see https://github.com/StudentVue/docs
   */
  protected processRequest<T extends object | undefined>(options: RequestOptions): Promise<T> {
    return this.proxyUrl === 'native' ? this.processRequestNative<T>(options) : this.processRequestWeb<T>(options);
  }

  private async processRequestNative<T extends object | undefined>(options: RequestOptions): Promise<T> {
    const defaultOptions: RequestOptions = {
      validateErrors: true,
      webServiceHandleName: 'PXPWebServices',
      paramStr: {},
      ...options,
    };

    const isLogin = defaultOptions.methodName === 'AttemptLogin';
    if (!isLogin) {
      await this.ensureAuthenticated();
    }

    const headers: Record<string, string> = {
      Accept: '*/*',
      'Content-Type': 'application/json',
      'User-Agent': 'ksoap',
      'edupointkeyversion':generateKey()
   //   AppNameOSAndVersion: `${Client.appName}|Android|${Client.appVersion}`,
    };

    const bodyParams: Record<string, unknown> = { ...(defaultOptions.paramStr ?? {}) };

    if (isLogin) {
      // Unlike every other method, the credentials stay in the body here *and* go in the
      // Authorization header - the server wants both, not one or the other.
      const { userID, password, token } = bodyParams as {
        userID?: string;
        password?: string;
        token?: string;
      };
      headers.Authorization = token
        ? `Bearer ${token}`
        : `Basic ${toBase64(`${userID ?? this.username}:${password ?? this.password}`)}`;
    } else {
      headers.Authorization = `Bearer ${this.tokens.accessToken}`;
    }

    const url = this.buildUrl(defaultOptions.webServiceHandleName as string, defaultOptions.methodName);
    const doFetch = (): Promise<Response> =>
      fetch(url, {
        method: 'POST',
        headers,
        // `request` is itself JSON-encoded as a string, not a nested object - the server parses
        // it as a second, inner JSON document. Sending it as a plain object 500s.
        body: JSON.stringify({ arguments: { request: JSON.stringify(bodyParams) } }),
      });

    let response = await doFetch();

    if (response.status === 401 && !isLogin) {
      try {
        if (this.tokens.refreshToken) {
          await this.refresh();
        } else {
          this.tokens = {};
          await this.login();
        }
      } catch {
        this.tokens = {};
        await this.login();
      }
      headers.Authorization = `Bearer ${this.tokens.accessToken}`;
      response = await doFetch();
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ParsedRestResult<T> = await response.json();

    if (result.access_token) this.tokens.accessToken = result.access_token;
    if (result.refresh_token) this.tokens.refreshToken = result.refresh_token;

    if (defaultOptions.validateErrors && result.error) {
      const error: ParsedRequestError = { message: result.error.message ?? 'Unknown error from StudentVUE REST API' };
      throw new RequestException(error);
    }

    return result.data as T;
  }

  /**
   * Same as `processRequestNative`, but for contexts (browsers) that can't hit the mobile API
   * directly because of CORS - relayed through `<proxyUrl>/fulfillRest` instead, the REST sibling
   * of `fulfillAxios`. The proxy builds the real `Authorization` header and the
   * double-JSON-encoded body itself (so it can decrypt an `encrypted` password first), and injects
   * its own server-side `edupointkeyversion`; this method just hands it the pieces.
   */
  private async processRequestWeb<T extends object | undefined>(options: RequestOptions): Promise<T> {
    const defaultOptions: RequestOptions = {
      validateErrors: true,
      webServiceHandleName: 'PXPWebServices',
      paramStr: {},
      ...options,
    };

    const isLogin = defaultOptions.methodName === 'AttemptLogin';
    if (!isLogin) {
      await this.ensureAuthenticated();
    }

    let bodyParams: Record<string, unknown> = { ...(defaultOptions.paramStr ?? {}) };
    let auth: { type: 'basic'; userID: string; password: string } | { type: 'bearer'; token: string };

    if (isLogin) {
      const { userID, password, token, ...rest } = bodyParams as {
        userID?: string;
        password?: string;
        token?: string;
      };
      auth = token
        ? { type: 'bearer', token }
        : { type: 'basic', userID: userID ?? this.username, password: password ?? this.password };
      // The proxy re-adds userID/password/token to the body itself once it's decrypted them -
      // forward only what's left (e.g. userType).
      bodyParams = rest;
    } else {
      auth = { type: 'bearer', token: this.tokens.accessToken as string };
    }

    const url = this.buildUrl(defaultOptions.webServiceHandleName as string, defaultOptions.methodName);
    const expressUrl = this.proxyUrl;
    const doFetch = (): Promise<Response> =>
      fetch(`${expressUrl}/fulfillRest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          methodName: defaultOptions.methodName,
          userID: this.username,
          request: bodyParams,
          auth,
          encrypted: this.encrypted,
        }),
      });

    let response = await doFetch();
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    let relay: {
      status: boolean;
      response?: ParsedRestResult<T>;
      gradingScale?: unknown;
      message?: string;
      httpStatus?: number;
    } = await response.json();

    if (!relay.status && relay.httpStatus === 401 && !isLogin) {
      try {
        if (this.tokens.refreshToken) {
          await this.refresh();
        } else {
          this.tokens = {};
          await this.login();
        }
      } catch {
        this.tokens = {};
        await this.login();
      }
      auth = { type: 'bearer', token: this.tokens.accessToken as string };
      response = await doFetch();
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      relay = await response.json();
    }

    if (!relay.status) {
      throw new Error(relay.message ?? 'Unknown error from the proxy');
    }

    const result = relay.response as ParsedRestResult<T>;

    if (result.access_token) this.tokens.accessToken = result.access_token;
    if (result.refresh_token) this.tokens.refreshToken = result.refresh_token;

    if (defaultOptions.validateErrors && result.error) {
      const error: ParsedRequestError = { message: result.error.message ?? 'Unknown error from StudentVUE REST API' };
      throw new RequestException(error);
    }

    const data = result.data as T;
    // Same convention soap.Client's processRequestWeb uses: the proxy's "optimistic gradeScale
    // fetch" (Gradebook only) rides alongside `response` and gets surfaced as `extraData`.
    if (relay.gradingScale !== undefined && data != null && typeof data === 'object') {
      (data as Record<string, unknown>).extraData = { gradingScale: relay.gradingScale };
    }

    return data;
  }

  /**
   * Edupoint has no REST equivalent for the anonymous district-lookup call
   * (`HDInfoServices.GetMatchingDistrictList`) - the official app still issues that one over
   * the legacy SOAP endpoint (`support.edupoint.com/Service/HDInfoCommunication.asmx`). This
   * simply delegates to the SOAP client so callers of `rest.Client` still have the method
   * available.
   */
  public static processAnonymousRequest<T extends object | undefined>(
    url: string,
    options: Partial<AnonymousRequestOptions> = {},
    preparse?: (xml: string) => string
  ): Promise<T> {
    return soap.Client.processAnonymousRequest<T>(url, options, preparse);
  }
}
