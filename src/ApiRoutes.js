import Router from '@koa/router';
import { ProxyService } from './ProxyService.js';
import { ApiError } from './ApiError.js';

/** @typedef {import('koa').ParameterizedContext} ParameterizedContext */
/** @typedef {import('koa').Next} Next */
/** @typedef {import('koa').DefaultState} DefaultState */
/** @typedef {import('koa').DefaultContext} DefaultContext */
/** @typedef {import('@koa/router').RouterOptions} RouterOptions */
/** @typedef {import('../types').ProxyResult} ProxyResult */
/** @typedef {import('../types').ServerConfiguration} ServerConfiguration */

/**
 * The routes controller for the AMF parsing API.
 */
export class ApiRoutes {
  /**
   * ...
   */
  constructor() {
    this.service = new ProxyService();
    /** @type string */
    this.prefix = '';
  }

  /**
   * Signals all processes to end.
   */
  async cleanup() {
    this.service.cleanup();
  }

  /**
   * @param {string=} prefix The prefix to use with the API routes. E.g. /api/v1
   * @returns {import('@koa/router')<DefaultState, DefaultContext>}
   */
  setup(prefix) {
    const opts = /** @type RouterOptions */ ({});
    if (prefix) {
      opts.prefix = prefix;
      this.prefix = prefix;
    }
    const router = new Router(opts);
    router.post('/proxy', this.proxyHandler.bind(this));
    return router;
  }

  /**
   * @param {Error} cause
   * @param {number=} code
   * @returns {any} 
   */
  wrapError(cause, code=500) {
    return {
      error: true,
      code,
      message: cause.message,
      detail: 'The server misbehave. That is all we know.'
    };
  }

  /**
   * Handles the `/proxy` route
   * 
   * @param {ParameterizedContext} ctx
   * @returns {Promise<void>} 
   */
  async proxyHandler(ctx) {
    /** @type ProxyResult */
    let result;
    try {
      result = await this.service.proxy(ctx.request);
    } catch (cause) {
      const error = new ApiError(cause.message || 'Unknown error', 400);
      ctx.body = this.wrapError(error, error.code);
      ctx.status = cause.code;
      return;
    }
    ctx.status = 200;
    ctx.body = result;
  }
}
