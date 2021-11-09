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
    api = new TestApi();
    api.setupEcho();
    await api.startHttp(echoPort);
  });

  after(async () => {
    await instance.cleanup();
    await instance.stopHttp();
    await api.stopHttp();
  });

  describe('CORS enabled with defaults', () => {
    before(async () => {
      instance = new Server({
        cors: {
          enabled: true,
        }
      });
      instance.setupRoutes();
      await instance.startHttp(proxyPort);
    });
  
    after(async () => {
      await instance.cleanup();
      await instance.stopHttp();
    });

    it('has the CORS headers for OPTIONS request', async () => {
      const request = http.request({
        hostname: 'localhost',
        port: proxyPort,
        path: '/proxy',
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/raml',
          'Authorization': 'Basic test',
          'x-api-vendor': 'RAML 1.0',
          'origin': 'https://www.api.com',
          'Accept-Encoding': 'gzip,deflate',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:71.0) Gecko/20100101 Firefox/71.0',
          'Accept': 'application/json,application/ld+json',
          'Connection': 'close',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'x-api-vendor, Content-Type',
        },
      });
      const result = await untilResponse(request);
      const { statusCode, headers } = result;
      assert.equal(statusCode, 204, 'has the 204 status code');
      
      assert.equal(headers['access-control-allow-origin'], 'https://www.api.com', 'has access-control-allow-origin');
      assert.equal(headers['access-control-allow-methods'], 'POST', 'has access-control-allow-methods');
      assert.equal(headers['access-control-allow-headers'], 'x-api-vendor, Content-Type', 'has access-control-allow-headers');
    });

    it('has the CORS headers for POST request', async () => {
      const request = http.request({
        hostname: 'localhost',
        port: proxyPort,
        path: '/proxy',
        method: 'POST',
        headers: {
          'Content-Type': 'application/raml',
          'Authorization': 'Basic test',
          'x-api-vendor': 'RAML 1.0',
          'origin': 'https://www.api.com',
          'Accept-Encoding': 'gzip,deflate',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:71.0) Gecko/20100101 Firefox/71.0',
          'Accept': 'application/json,application/ld+json',
          'Connection': 'close',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'x-api-vendor, Content-Type',
        },
      });
      const data = /** @type ProxyMessage */ ({
        request: {
          method: 'GET',
          url: `http://localhost:${echoPort}/echo/get`
        },
      });
      request.write(JSON.stringify(data));
      const result = await untilResponse(request);
      const { headers } = result;
      
      assert.equal(headers['access-control-allow-origin'], 'https://www.api.com', 'has access-control-allow-origin');
    });
  });

  describe('CORS enabled with passed configuration', () => {
    before(async () => {
      instance = new Server({
        cors: {
          enabled: true,
          cors: {
            origin: 'https://my.domain.org'
          },
        }
      });
      instance.setupRoutes();
      await instance.startHttp(proxyPort);
    });
  
    after(async () => {
      await instance.cleanup();
      await instance.stopHttp();
    });

    it('has the CORS headers for OPTIONS request', async () => {
      const request = http.request({
        hostname: 'localhost',
        port: proxyPort,
        path: '/proxy',
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/raml',
          'Authorization': 'Basic test',
          'x-api-vendor': 'RAML 1.0',
          'origin': 'https://www.api.com',
          'Accept-Encoding': 'gzip,deflate',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:71.0) Gecko/20100101 Firefox/71.0',
          'Accept': 'application/json,application/ld+json',
          'Connection': 'close',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'x-api-vendor, Content-Type',
        },
      });
      const result = await untilResponse(request);
      const { statusCode, headers } = result;
      assert.equal(statusCode, 204, 'has the 204 status code');
      
      assert.equal(headers['access-control-allow-origin'], 'https://my.domain.org', 'has access-control-allow-origin');
      assert.equal(headers['access-control-allow-methods'], 'GET,HEAD,PUT,POST,DELETE,PATCH', 'has access-control-allow-methods');
      assert.equal(headers['access-control-allow-headers'], 'x-api-vendor, Content-Type', 'has access-control-allow-headers');
    });
  });
});
