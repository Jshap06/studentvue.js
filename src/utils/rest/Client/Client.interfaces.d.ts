export declare interface LoginOptions {
  /**
   * Whether the user signing in is a parent. Defaults to `false`
   */
  isParent?: boolean;
}

/**
 * Options to provide when processing a fetch POST request to the REST mobile API
 */
export declare interface RequestOptions {
  /**
   * The service handle sent as part of the URL path when processing the request. For handling
   * requests for the student, it will be `PXPWebServices`.
   * @see https://github.com/StudentVue/docs
   */
  webServiceHandleName?: string;

  /**
   * The method name to provide to synergy when processing the request. This becomes the last
   * path segment of the request URL, e.g. `/api/v1/mobile/PXPWebServices/Gradebook`.
   * @see https://github.com/StudentVue/docs
   */
  methodName: string;

  /**
   * The parameters to provide in the method. Sent as `{ arguments: { request: paramStr } }` in
   * the JSON request body.
   * @see https://github.com/StudentVue/docs
   */
  paramStr?: Record<string, unknown>;

  /**
   * Determine whether or not the function should throw an error when the response contains an
   * `error` field. Unlike the legacy SOAP API, the REST API responds with real, non-200 HTTP
   * status codes for a number of failure cases, but still reports some errors inline via
   * `{ error: { message } }` in an otherwise-200 response.
   *
   * If this value is set to `true`, inline errors like this will be detected and thrown.
   * If set to `false`, this error is ignored and not thrown.
   */
  validateErrors?: boolean;
}

/**
 * The login information of the student that includes the district url
 */
export declare interface LoginCredentials extends LoginOptions {
  /**
   * The student's username
   */
  username: string;

  /**
   * The student's password
   */
  password: string;

  /**
   * The student's district URL. Accepts the same district URL shape used by the SOAP client
   * (e.g. ending in `/Service/PXPCommunication.asmx`) - only the origin (protocol + host) is
   * actually used to build REST requests.
   */
  districtUrl: string;

  encrypted: boolean;
}

/**
 * The two tokens handed back by `AttemptLogin`/token refresh. `accessToken` is sent as a
 * `Bearer` Authorization header on every subsequent call; `refreshToken` is used to silently
 * re-authenticate once an `accessToken` is rejected with an HTTP 401.
 */
export declare interface RestTokens {
  accessToken?: string;
  refreshToken?: string;
}

/**
 * The shape of a successful REST mobile API response envelope, prior to unwrapping `data`.
 */
export declare interface ParsedRestResult<T = any> {
  data?: T;
  access_token?: string;
  refresh_token?: string;
  error?: {
    message?: string;
    code?: string | number;
  };
}

export declare interface ParsedRequestError {
  message: string;
  stack?: string;
}
