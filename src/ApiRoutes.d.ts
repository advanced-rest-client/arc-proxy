import { ParameterizedContext } from 'koa';
import Router from '@koa/router';
import { ProxyService } from './ProxyService.js';
import { ServerConfiguration } from '../types';

/**
 * The routes controller for the AMF parsing API.
 */
export class ApiRoutes {
  prefix: string;
  service: ProxyService;
  /**
   * @param opts Optional server configuration options.
   */
  constructor(opts?: ServerConfiguration);

  /**
   * Signals all processes to end.
   */
  cleanup(): Promise<void>;

  /**
   * @param prefix The prefix to use with the API routes. E.g. /api/v1
   */
  setup(prefix?: string): Router;

  wrapError(cause: Error, code?: number): any;

  /**
   * Handles the `/proxy` route
   */
  proxyHandler(ctx: ParameterizedContext): Promise<void>;
}
