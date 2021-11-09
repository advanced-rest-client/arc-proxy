# ARC proxy server

A node web server that runs on [Koa](https://koajs.com/) that provides an API to proxy HTTP request.

The intended use is to proxy ARC/API Console requests from a web browser without CORS restrictions.

## Usage

### Installation

```sh
npm i @advanced-rest-client/arc-proxy
```

### Running the server

```javascript
import Server from '@advanced-rest-client/arc-proxy';

(async () => {
  const httpPort = 8080;
  const sslPort = 8081;

  const sslOptions = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
  };
  
  const srv = new Server();
  srv.setupRoutes('/api/v1'); // optional prefix for the API routes.

  await srv.startHttp(httpPort);
  await srv.startSsl(sslOptions, httpPort);

  // when ready...
  await srv.stopHttp(); 
  await srv.stopSsl(); 
})();
```

## API routes

See the API spec in `spec/` folder for more details.

Notes:

- Examples assume no API prefix and port 8080
- Example responses are formatted for readability

### Proxying a request

The proxy server uses the ARC request object definition for the request.

```http
POST /proxy HTTP/1.1
Host: localhost:8080
Content-Type: application/json
content-length: ...

{
  "request": {
    "url": "https://httpbin.org/get",
    "method": "GET",
    "headers": "x-test: true"
  },
  "config": {
    "followRedirects": false
  }
}
```

#### Proxy response

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: ...
Date: Sat, 06 Nov 2021 00:01:15 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{
  "response": {
    "status": 200,
    "statusText": "OK",
    "headers: "...",
    "payload": {
      "type": "Buffer",
      "data": [102, 168, ...]
    },
    "timings": {
      "connect": 10,
      "receive": 2,
      "send": 15,
      "wait": 2,
      "blocked": 0
      "dns": 4
      "ssl": 12
    },
    "loadingTime": 123,
    "redirects": [],
    "size": {
      "request": 1234,
      "response": 5678
    }
  },
  "transport": {
    "httpMessage": {
      "type": "Buffer",
      "data": [102, 168, ...]
    },
    "startTime": 123456789,
    "endTime": 123456789
  }
}
```

## Development

```sh
git clone https://github.com/advanced-rest-client/arc-proxy
cd arc-proxy
npm install
```

### Running the tests

```sh
npm test
```

## Credits and license

This library has been created by Pawel Uchida-Psztyc on his own free time. It is licensed under Apache 2 license.
