import { Request } from 'koa';
import { ElectronRequest } from '@advanced-rest-client/electron/request/ElectronRequest.js';
import { SocketRequest } from '@advanced-rest-client/electron/request/SocketRequest.js';
import { Options as RequestOptions } from '@advanced-rest-client/electron/request/RequestOptions';
import { ArcRequest, ArcResponse } from '@advanced-rest-client/events';
import { ProxyResult, HttpProxy, ProxyMessage, ProxyHttpRequest, InternalHttpRequest, ProxyTransportInfo } from '../types';

/**
 * ARC's http proxy service.
 */
export class ProxyService {
  clients: Map<string, HttpProxy>;
  constructor();
  /**
   * Signals all processes to end.
   */
  cleanup(): Promise<void>;
  /**
   * Handles the proxy request
   * @returns The proxy result.
   */
  proxy(request: Request): Promise<ProxyResult>;
  /**
   * Reads the request body.
   */
  readBody(request: Request): Promise<Buffer>
  bufferToTransformed(buffer: Buffer): any;
  _proxy(message: ProxyMessage): Promise<ProxyResult>;
  _makeProxyConnection(message: ProxyMessage, id: string): Promise<void>
  prepareNativeRequest(id: string, request: ArcRequest.ArcBaseRequest, opts: RequestOptions): ElectronRequest;
  prepareSocketRequest(id: string, request: ArcRequest.ArcBaseRequest, opts: RequestOptions): SocketRequest;
  loadHandler(id: string, response: ArcResponse.Response | ArcResponse.ErrorResponse, transport: ArcRequest.TransportRequest): void;
  errorHandler(error: Error, id: string, transport?: ArcRequest.TransportRequest, response?: ArcResponse.ErrorResponse): void;
  prepareRequest(request: ProxyHttpRequest): InternalHttpRequest
  /**
   * Prepares the request body message.
   */
  prepareRequestBody(request: ProxyHttpRequest): Buffer|undefined;
  prepareProxyTransportInfo(arcTransport: ArcRequest.TransportRequest): ProxyTransportInfo
}
