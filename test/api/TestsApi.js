import Koa from 'koa';
import http from 'http';
import cors from '@koa/cors';
import { EchoRoute } from './EchoRoute.js'

export class TestApi {
  constructor() {
    this.app = new Koa();
  }

  setupEcho() {
    this.app.use(cors());
    const echoHandler = new EchoRoute();
    const apiRouter = echoHandler.setup();
    this.app.use(apiRouter.routes());
    this.app.use(apiRouter.allowedMethods());
    this.echoHandler = echoHandler;
  }

  /**
   * @param {number} port The port number to use.
   * @returns {Promise<void>}
   */
  startHttp(port) {
    return new Promise((resolve) => {
      this.httpServer = http.createServer(this.app.callback());
      this.httpServer.listen(port, () => {
        resolve();
      });
    });
  }

  /**
   * @returns {Promise<void>}
   */
  stopHttp() {
    return new Promise((resolve) => {
      this.httpServer.close(() => {
        resolve();
      });
    });
  }
}
