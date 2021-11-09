import Router from '@koa/router';
import { BaseRoute } from './BaseRoute.js';

/** @typedef {import('koa').DefaultState} DefaultState */
/** @typedef {import('koa').DefaultContext} DefaultContext */
/** @typedef {import('koa').ParameterizedContext} ParameterizedContext */

export class EchoRoute extends BaseRoute {
  /**
   * @returns {import('@koa/router')<DefaultState, DefaultContext>}
   */
  setup() {
    const router = new Router();
    router.get('/echo/get', this.getHandler.bind(this));
    router.post('/echo/post', this.postHandler.bind(this));
    return router;
  }

  /**
   * @param {ParameterizedContext} ctx
   * @returns {Promise<void>} 
   */
  async getHandler(ctx) {
    const { headers, query, originalUrl, hostname, method, path, ip, protocol, url } = ctx;
    const start = Date.now();
    await this.aTimeout(120);
    ctx.status = 200;
    ctx.body = {
      headers: { ...headers, 'x-test-api': 'echo-get' }, 
      query, 
      originalUrl,
      hostname, 
      method, 
      path, 
      ip, 
      protocol, 
      url,
      delay: Date.now() - start,
    };
  }

  /**
   * @param {ParameterizedContext} ctx
   * @returns {Promise<void>} 
   */
  async postHandler(ctx) {
    const { headers, query, originalUrl, hostname, method, path, ip, protocol, url } = ctx;
    const start = Date.now();
    const data = await this.readBody(ctx.request);
    await this.aTimeout(120);
    ctx.status = 200;
    ctx.body = {
      headers: { ...headers, 'x-test-api': 'echo-post' }, 
      query, 
      originalUrl,
      hostname, 
      method, 
      path, 
      ip, 
      protocol, 
      url,
      delay: Date.now() - start,
      body: data.toString('utf8'),
    };
  }
}
