import { assert } from 'chai';
import getPort from 'get-port';
import http from 'http';
import Server from '../index.js';
import { TestApi } from './api/TestsApi.js';
import { untilResponse } from './RequestUtils.js'

/** @typedef {import('@advanced-rest-client/events').ArcResponse.Response} Response */
/** @typedef {import('@advanced-rest-client/events').ArcResponse.TransformedPayload} TransformedPayload */
/** @typedef {import('../types').ProxyMessage} ProxyMessage */
/** @typedef {import('../types').ProxyResult} ProxyResult */

describe('Proxying requests', () => {
  /** @type Server */
  let instance;
  /** @type TestApi */
  let api;
  /** @type number */
  let echoPort;
  /** @type number */
  let proxyPort;
  before(async () => {
    echoPort = await getPort();
    proxyPort = await getPort();
    instance = new Server();
    instance.setupRoutes();
    await instance.startHttp(proxyPort);
    api = new TestApi();
    api.setupEcho();
    await api.startHttp(echoPort);
  });

  after(async () => {
    await instance.cleanup();
    await instance.stopHttp();
    await api.stopHttp();
  });

  /**
   * @returns {http.ClientRequest}
   */
  function createProxyRequest() {
    return http.request({
      hostname: 'localhost',
      port: proxyPort,
      path: '/proxy',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  describe('GET request', () => {
    it('proxies a simple get request', async () => {
      const request = createProxyRequest();
      const data = /** @type ProxyMessage */ ({
        request: {
          method: 'GET',
          url: `http://localhost:${echoPort}/echo/get`
        },
      });
      request.write(JSON.stringify(data));
      const result = await untilResponse(request);
      const { statusCode, headers, message } = result;
      assert.equal(statusCode, 200, 'has 200 status code');
      assert.include(headers['content-type'], 'application/json', 'has the content-type header');

      const body = message.toString();
      const response = /** @type ProxyResult */ (JSON.parse(body));
      
      assert.typeOf(response.response, 'object', 'has the response');
      assert.equal(response.response.status, 200, 'has the response.status');
      assert.typeOf(response.response.headers, 'string', 'has the response.headers');
      assert.typeOf(response.transport, 'object', 'has the transport');
      assert.typeOf(response.transport.httpMessage, 'object', 'has the transport.httpMessage');
      assert.typeOf(response.transport.startTime, 'number', 'has the transport.startTime');
      assert.typeOf(response.transport.endTime, 'number', 'has the transport.endTime');

      const buffer = Buffer.from(/** @type TransformedPayload */ (response.response.payload).data);
      const responseBody = JSON.parse(buffer.toString());
      assert.equal(responseBody.headers['x-test-api'], 'echo-get', 'has target server body');
    });

    it('proxies a get request with headers', async () => {
      const request = createProxyRequest();
      const data = /** @type ProxyMessage */ ({
        request: {
          method: 'GET',
          url: `http://localhost:${echoPort}/echo/get`,
          headers: 'x-test-header: abc123',
        },
      });
      request.write(JSON.stringify(data));
      const result = await untilResponse(request);
      const { statusCode, message } = result;
      assert.equal(statusCode, 200, 'has 200 status code');

      const body = message.toString();
      const response = /** @type ProxyResult */ (JSON.parse(body));

      const buffer = Buffer.from(/** @type TransformedPayload */ (response.response.payload).data);
      const responseBody = JSON.parse(buffer.toString());
      assert.equal(responseBody.headers['x-test-header'], 'abc123', 'sent the header');

      const sourceBuffer = Buffer.from(/** @type TransformedPayload */ (response.transport.httpMessage).data);
      assert.include(sourceBuffer.toString(), 'x-test-header: abc123', 'the source message has the header');
    });
  });

  describe('POST request', () => {
    it('proxies a simple post request', async () => {
      const request = createProxyRequest();
      const data = /** @type ProxyMessage */ ({
        request: {
          method: 'POST',
          url: `http://localhost:${echoPort}/echo/post`,
          headers: `content-type: application/json`,
          payload: JSON.stringify({ test: true }),
        },
      });
      request.write(JSON.stringify(data));
      const result = await untilResponse(request);
      const { statusCode, headers, message } = result;
      const body = message.toString();
      const response = /** @type ProxyResult */ (JSON.parse(body));

      assert.equal(statusCode, 200, 'has 200 status code');
      assert.include(headers['content-type'], 'application/json', 'has the content-type header');

      
      
      assert.typeOf(response.response, 'object', 'has the response');
      assert.equal(response.response.status, 200, 'has the response.status');
      assert.typeOf(response.response.headers, 'string', 'has the response.headers');
      assert.typeOf(response.transport, 'object', 'has the transport');
      assert.typeOf(response.transport.httpMessage, 'object', 'has the transport.httpMessage');
      assert.typeOf(response.transport.startTime, 'number', 'has the transport.startTime');
      assert.typeOf(response.transport.endTime, 'number', 'has the transport.endTime');

      const buffer = Buffer.from(/** @type TransformedPayload */ (response.response.payload).data);
      const responseBody = JSON.parse(buffer.toString());
      assert.equal(responseBody.headers['x-test-api'], 'echo-post', 'has target server body');
    });

    it('proxies a post request with headers', async () => {
      const request = createProxyRequest();
      const data = /** @type ProxyMessage */ ({
        request: {
          method: 'POST',
          url: `http://localhost:${echoPort}/echo/post`,
          headers: 'content-type: application/json\nx-test-header: abc123',
          payload: JSON.stringify({ test: true }),
        },
      });
      request.write(JSON.stringify(data));
      const result = await untilResponse(request);
      const { statusCode, message } = result;
      assert.equal(statusCode, 200, 'has 200 status code');

      const body = message.toString();
      const response = /** @type ProxyResult */ (JSON.parse(body));

      const buffer = Buffer.from(/** @type TransformedPayload */ (response.response.payload).data);
      const responseBody = JSON.parse(buffer.toString());
      assert.equal(responseBody.headers['x-test-header'], 'abc123', 'sent the x-test-header');
      assert.equal(responseBody.headers['content-type'], 'application/json', 'sent the content-type');

      const sourceBuffer = Buffer.from(/** @type TransformedPayload */ (response.transport.httpMessage).data).toString();
      assert.include(sourceBuffer, 'x-test-header: abc123', 'the source message has the x-test-header header');
      assert.include(sourceBuffer, 'content-type: application/json', 'the source message has the content-type header');
    });

    it('proxies a post request with a Buffer body', async () => {
      const request = createProxyRequest();
      const requestBody = Buffer.from('test'); 
      const data = /** @type ProxyMessage */ ({
        request: {
          method: 'POST',
          url: `http://localhost:${echoPort}/echo/post`,
          headers: 'content-type: text/plain',
          payload: { type: 'Buffer', data: [...requestBody] },
        },
      });
      request.write(JSON.stringify(data));
      const result = await untilResponse(request);
      const { statusCode, message } = result;
      assert.equal(statusCode, 200, 'has 200 status code');

      const body = message.toString();
      const response = /** @type ProxyResult */ (JSON.parse(body));

      const bodyBuffer = Buffer.from(/** @type TransformedPayload */ (response.response.payload).data).toString();
      assert.equal(JSON.parse(bodyBuffer).body, 'test', 'transfers the payload');
    });

    it('proxies a post request with a Blob body', async () => {
      const request = createProxyRequest();
      const data = /** @type ProxyMessage */ ({
        request: {
          method: 'POST',
          url: `http://localhost:${echoPort}/echo/post`,
          headers: 'content-type: image/png',
          blob: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAoCAYAAA`,
        },
      });
      request.write(JSON.stringify(data));
      const result = await untilResponse(request);
      const { statusCode, message } = result;
      assert.equal(statusCode, 200, 'has 200 status code');

      const body = message.toString();
      const response = /** @type ProxyResult */ (JSON.parse(body));

      const bodyBuffer = Buffer.from(/** @type TransformedPayload */ (response.response.payload).data).toString();
      assert.include(JSON.parse(bodyBuffer).body, 'PNG', 'transfers the payload');
    });

    it('handles errors', async () => {
      const request = createProxyRequest();
      const data = /** @type ProxyMessage */ ({
        request: {
          method: 'POST',
          url: `http://localhost:${echoPort}/echo/get`,
          headers: 'content-type: image/png',
          blob: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAoCAYAAA`,
        },
      });
      request.write(JSON.stringify(data));
      const result = await untilResponse(request);
      const { statusCode, message } = result;
      assert.equal(statusCode, 200, 'has 200 status code');

      const body = message.toString();
      const response = /** @type ProxyResult */ (JSON.parse(body));
      assert.equal(response.response.status, 405, 'has the target server status code');
      const bodyBuffer = Buffer.from(/** @type TransformedPayload */ (response.response.payload).data).toString();
      assert.equal(bodyBuffer, 'Method Not Allowed', 'has the target server error');
    });
  });
});
