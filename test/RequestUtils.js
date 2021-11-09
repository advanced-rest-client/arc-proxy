import http from 'http';

/** @typedef {import('http').ClientRequest} ClientRequest */
/** @typedef {import('http').IncomingHttpHeaders} IncomingHttpHeaders */

/** 
 * @typedef RequestResult
 * @property {number} statusCode
 * @property {IncomingHttpHeaders} headers
 * @property {Buffer=} message
 */

/**
 * Do not call `end()` on the request. This function calls it when all is ready.
 * @param {ClientRequest} request
 * @returns {Promise<RequestResult>}
 */
export async function untilResponse(request) {
  return new Promise((resolve, reject) => {
    request.on('response', (res) => {
      const { statusCode, headers } = res;
      /** @type Buffer */
      let message;
      res.on('data', (chunk) => {
        if (message) {
          message = Buffer.concat([message, chunk]);
        } else {
          message = chunk;
        }
      });

      res.on('end', () => {
        resolve(/** @type RequestResult */ ({
          statusCode,
          headers,
          message,
        }));
      });
    });
    request.on('error', (e) => {
      reject(e);
    });
    request.end();
  });
}

/**
 * @param {number=} timeout
 * @returns {Promise<void>} 
 */
export async function aTimeout(timeout=0) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), timeout);
  });
}
