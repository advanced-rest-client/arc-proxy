import http from 'http';
import https from 'https';
import { Options as CorsOptions } from '@koa/cors';
import { ArcRequest, ArcResponse, RequestBody } from '@advanced-rest-client/events';
import { Options as RequestOptions } from '@advanced-rest-client/electron/request/RequestOptions';
import { ElectronRequest } from '@advanced-rest-client/electron/request/ElectronRequest';
import { SocketRequest } from '@advanced-rest-client/electron/request/SocketRequest';

export type SupportedServer = 'https' | 'http';

export interface RunningServer {
  server: https.Server | http.Server;
  type: SupportedServer;
  port: number;
}

export interface ServerConfiguration {
  /**
   * CORS configuration.
   */
  cors?: CorsConfiguration;
}

export interface CorsConfiguration {
  /**
   * When set it enables CORS headers for the API.
   * By default it is disabled.
   */
  enabled?: boolean;
  /**
   * Optional configuration passed to `@koa/cors`.
   * See more here: https://github.com/koajs/cors
   * When not set it uses default values.
   * 
   * Note, default values apply the request's origin to the `Access-Control-Allow-Origin` header.
   */
  cors?: CorsOptions;
}

export declare interface HttpProxy {
  connection?: ElectronRequest|SocketRequest;
  request?: ProxyHttpRequest;
  aborted: boolean;
  rejecter: (reason?: Error) => void;
  resolver: (result: ProxyResult) => void;
}

export declare interface ProxyResult {
  transport: ProxyTransportInfo;
  response: ArcResponse.Response | ArcResponse.ErrorResponse;
}

export interface ProxyMessage {
  request: ProxyHttpRequest;
  config?: ProxyOptions;
}

export interface ProxyOptions extends RequestOptions {
  /**
   * When set it uses NodeJS' native HTTP client.
   */
  native?: boolean;
}

export interface InternalHttpRequest extends ArcRequest.HTTPRequest {
  /**
   * The message body. When an object it should be transformed to a Buffer or a Blob.
   */
  payload?: Buffer;
}

export interface ProxyHttpRequest extends ArcRequest.HTTPRequest {
  /**
   * The message body. When an object it should be transformed to a Buffer or a Blob.
   */
  payload?: string | ArcResponse.TransformedPayload;
  /**
   * ARCs internal transformation of a native FormData into a structure that
   * can be stored in the data store. This is used internally by their model
   * and when requesting ARC request object this is restored to the original
   * format.
   */
  multipart?: RequestBody.MultipartBody[];
  /**
   * When a file is the request payload then in the data store it is transformed into a 
   * string and the payload is emptied. This is used internally by the data store
   * to restore the original format
   */
  blob?: string;
}

/**
 * Metadata related to the transport.
 */
export declare interface ProxyTransportInfo {
  /**
   * The HTTP message sent to the server (full message).
   */
  httpMessage: ArcResponse.TransformedPayload;
  /**
   * The timestamp when the request was started (before the connection is made)
   */
  startTime: number;
  /**
   * The timestamp of when the response ended.
   */
  endTime: number;
}
