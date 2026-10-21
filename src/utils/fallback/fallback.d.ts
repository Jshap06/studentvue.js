/**
 * Which transport a client tries first. The other one is only used as a fallback - see
 * `withFallback`.
 */
export type ApiType = 'rest' | 'soap';
/**
 * True when a REST call failed because the endpoint doesn't exist (HTTP 404) - e.g. a district
 * whose Synergy install predates the mobile REST API. `rest.Client` attaches the HTTP status to
 * the errors it throws as `status`.
 */
export declare function isNotFound(err: any): boolean;
/**
 * True when a SOAP call failed with an error message saying the method/endpoint is deprecated.
 */
export declare function isDeprecated(err: any): boolean;
/**
 * Runs the `api` transport first and falls back to the other one:
 * - REST first: retries over SOAP only if REST 404s.
 * - SOAP first: retries over REST only if SOAP errors with a message containing "deprecated".
 * Any other error is rethrown as-is.
 */
export declare function withFallback<T>(api: ApiType, rest: () => Promise<T>, soap: () => Promise<T>): Promise<T>;
