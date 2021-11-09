import { v4 } from 'uuid';
import ElectronNode from '@advanced-rest-client/electron/http.js';
// import { ElectronRequest } from '@advanced-rest-client/electron';
// import { ElectronRequest } from '@advanced-rest-client/electron/request/ElectronRequest.js';
// import { SocketRequest } from '@advanced-rest-client/electron/request/SocketRequest.js';
// import socketPkg from '@advanced-rest-client/electron/request/SocketRequest.js';
// import electronPkg from '@advanced-rest-client/electron/request/ElectronRequest.js';
import { ApiError } from './ApiError.js';

const { ElectronRequest, SocketRequest } = ElectronNode;

// eslint-disable-next-line require-jsdoc
const noop = () => {};
const logger = {
  info: noop,
  log: noop,
  debug: noop,
  warn: noop,
  error: noop,
};

/** @typedef {import('koa').Request} Request */
/** @typedef {import('../types').HttpProxy} HttpProxy */
/** @typedef {import('../types').ProxyResult} ProxyResult */
/** @typedef {import('../types').ProxyMessage} ProxyMessage */
/** @typedef {import('../types').ProxyHttpRequest} ProxyHttpRequest */
/** @typedef {import('../types').InternalHttpRequest} InternalHttpRequest */
/** @typedef {import('../types').ProxyTransportInfo} ProxyTransportInfo */
/** @typedef {import('@advanced-rest-client/electron/request/RequestOptions').Options} RequestOptions */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.HTTPRequest} HTTPRequest */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.ArcBaseRequest} ArcBaseRequest */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.TransportRequest} TransportRequest */
/** @typedef {import('@advanced-rest-client/events').ArcResponse.Response} Response */
/** @typedef {import('@advanced-rest-client/events').ArcResponse.ErrorResponse} ErrorResponse */
/** @typedef {import('@advanced-rest-client/events').ArcResponse.TransformedPayload} TransformedPayload */

/**
 * ARC's http proxy service.
 */
export class ProxyService {
  /**
   * ...
   */
  constructor() {
    /** 
     * @type {Map<string, HttpProxy>}
     */
    this.clients = new Map();

    this.loadHandler = this.loadHandler.bind(this);
    this.errorHandler = this.errorHandler.bind(this);
  }

  /**
   * Signals all processes to end.
   */
  async cleanup() {
    for (const [key, proxy] of this.clients) {
      proxy.connection.abort();
    }
    this.clients.clear();
  }

  /**
   * Handles the proxy request
   * @param {Request} request
   * @returns {Promise<ProxyResult>} The proxy result.
   */
  async proxy(request) {
    const { headers } = request;
    const body = await this.readBody(request);
    if (!body) {
      throw new ApiError('Request body is not set', 400);
    }
    /** @type ProxyMessage */ 
    let message;
    try {
      message = JSON.parse(body.toString('utf8'));
    } catch (e) {
      throw new ApiError('Unprocessable Entity. The message is not a JSON.', 422);
    }
    if (!message.request) {
      throw new ApiError('Unprocessable Entity. Expecting HTTP request configuration.', 422);
    }
    try {
      const result = await this._proxy(message);
      const { response, transport } = result;
      if (response.payload) {
        response.payload = this.bufferToTransformed(/** @type Buffer */ (response.payload));
      }
      return {
        response, transport,
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      throw new ApiError(`Unable to proxy the request: ${e.message}`, 500);
    }
  }

  /**
   * Reads the request body.
   * @param {Request} request
   * @returns {Promise<Buffer>} 
   */
  async readBody(request) {
    return new Promise((resolve, reject) => {
      let message;
      request.req.on('data', (chunk) => {
        try {
          if (message) {
            message = Buffer.concat([message, chunk]);
          } else {
            message = chunk;
          }
        } catch (e) {
          reject(e);
          throw e;
        }
      });
      request.req.on('end', () => {
        resolve(message);
      });
    });
  }

  /**
   * @param {Buffer} buffer
   * @returns {any}
   */
  bufferToTransformed(buffer) {
    if (buffer instanceof Buffer) {
      return {
        type: 'Buffer',
        data: [...buffer],
      }
    }
    return buffer;
  }

  /**
   * @param {ProxyMessage} message
   * @returns {Promise<ProxyResult>}
   */
  async _proxy(message) {
    return new Promise((resolve, reject) => {
      const id = v4();
      this.clients.set(id, {
        aborted: false,
        rejecter: reject,
        resolver: resolve,
      });
      this._makeProxyConnection(message, id);
    });
  }

  /**
   * @param {ProxyMessage} message
   * @param {string} id
   * @returns {Promise<void>}
   */
  async _makeProxyConnection(message, id) {
    const { request, config={} } = message;
    const info = this.clients.get(id);
    info.request = request;
    const options = { ...config, logger };
    delete options.native;
    const copy = this.prepareRequest(request);
    try {
      /** @type SocketRequest|ElectronRequest */
      const client = config.native ? this.prepareNativeRequest(id, copy, options) : this.prepareSocketRequest(id, copy, options);
      await client.send();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      this.errorHandler(e, id);
    }
  }

  /**
   * @param {string} id
   * @param {ArcBaseRequest} request
   * @param {RequestOptions} opts
   * @returns {ElectronRequest}
   */
  prepareNativeRequest(id, request, opts) {
    const conn = new ElectronRequest(request, id, opts);
    const info = this.clients.get(id);
    info.connection = conn;
    conn.on('load', this.loadHandler);
    conn.on('error', this.errorHandler);
    return conn;
  }

  /**
   * @param {string} id
   * @param {ArcBaseRequest} request
   * @param {RequestOptions} opts
   * @returns {SocketRequest}
   */
  prepareSocketRequest(id, request, opts) {
    const conn = new SocketRequest(request, id, opts);
    const info = this.clients.get(id);
    info.connection = conn;
    conn.on('load', this.loadHandler);
    conn.on('error', this.errorHandler);
    return conn;
  }

  /**
   * @param {string} id
   * @param {Response | ErrorResponse} response
   * @param {TransportRequest} transport
   */
  loadHandler(id, response, transport) {
    const info = this.clients.get(id);
    this.clients.delete(id);
    if (!info || info.aborted) {
      return;
    }
    const result = /** @type ProxyResult */ ({
      transport: this.prepareProxyTransportInfo(transport), 
      response,
    });
    if (response.payload) {
      result.response.payload = this.bufferToTransformed(/** @type Buffer */ (response.payload));
    }
    info.resolver(result);
  }

  /**
   * @param {Error} error
   * @param {string} id
   * @param {TransportRequest=} transport
   * @param {ErrorResponse=} response
   */
  errorHandler(error, id, transport, response) {
    const info = this.clients.get(id);
    this.clients.delete(id);
    if (!info || info.aborted) {
      return;
    }
    const result = /** @type ProxyResult */ ({
      transport: this.prepareProxyTransportInfo(transport), 
      response,
    });
    result.response = response || {
      error: /** @type any */ (error.message),
      status: 0,
    };
    info.resolver(result);
  }

  /**
   * @param {ProxyHttpRequest} request 
   * @returns {InternalHttpRequest} 
   */
  prepareRequest(request) {
    const copy = /** @type InternalHttpRequest */ (/** @type HTTPRequest */ ({ ...request }));
    copy.payload = this.prepareRequestBody(request);
    // @ts-ignore
    delete copy.multipart;
    // @ts-ignore
    delete copy.blob;
    return copy;
  }

  /**
   * Prepares the request body message.
   * @param {ProxyHttpRequest} request
   * @returns {Buffer}
   */
  prepareRequestBody(request) {
    if (typeof request.payload === 'string') {
      return Buffer.from(request.payload);
    }
    if (typeof request.payload === 'object' && request.payload.type) {
      const typed = /** @type TransformedPayload */ (request.payload);
      if (typed.type === 'Buffer') {
        return Buffer.from(typed.data);
      }
      if (typed.type === 'ArrayBuffer') {
        const array = new Uint8Array(typed.data);
        return Buffer.from(array);
      }
    }
    if (typeof request.blob === 'string') {
      const regex = /^data:.+\/(.+);base64,(.*)$/;
      const matches = request.blob.match(regex);
      const data = matches[2];
      return Buffer.from(data, 'base64');
    }
    return undefined;
  }

  /**
   * @param {TransportRequest} arcTransport 
   * @returns {ProxyTransportInfo}
   */
  prepareProxyTransportInfo(arcTransport) {
    const result = /** @type ProxyTransportInfo */ ({
      startTime: 0,
      endTime: 0,
      httpMessage: undefined,
    });
    if (!arcTransport) {
      return result;
    }
    result.startTime = arcTransport.startTime;
    result.endTime = arcTransport.endTime;
    if (arcTransport.httpMessage) {
      const b = Buffer.from(arcTransport.httpMessage);
      result.httpMessage = {
        type: 'Buffer',
        data: [...b],
      };
    }
    return result;
  }
}
