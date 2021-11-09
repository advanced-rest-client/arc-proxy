/** @typedef {import('koa').Request} Request */
/** @typedef {import('koa').DefaultState} DefaultState */
/** @typedef {import('koa').DefaultContext} DefaultContext */

export class BaseRoute {
  /**
   * @returns {import('@koa/router')<DefaultState, DefaultContext>}
   */
  setup() {
    throw new Error('Not implemented.');
  }

  /**
   * Awaits a timeout.
   * @param {number=} [timeout=0]
   * @return {Promise}
   */
  async aTimeout(timeout = 0) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), timeout);
    });
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
}
