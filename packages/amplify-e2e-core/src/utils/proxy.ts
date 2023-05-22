import http, { RequestListener, Server } from 'http';
import httpProxy from 'http-proxy';

export class TestProxy {
  proxy;
  server: Server;
  constructor(readonly port = 80) {
    process.env.HTTP_PROXY = `http://localhost:${this.port}`;
    this.proxy = httpProxy.createProxyServer({ target: process.env.HTTP_PROXY });

    this.proxy.on('error', (e) => {
      console.error(e?.message || e);
    });

    console.log(`listening on port ${this.port}`);
    this.server = http.createServer(this.onRequest).listen(this.port);
  }

  onRequest: RequestListener = (req, res) => {
    console.log('serve: ' + req.url);
    // res.writeHead(200, { 'Content-Type': 'text/plain' });
    // res.write('request successfully proxied!' + '\n' + JSON.stringify(req.headers, null, 2));
    // res.end();
    this.proxy.web(req, res, { target: process.env.HTTP_PROXY });
  };

  stop() {
    this.server.close();
    this.proxy.close();
    delete process.env.HTTP_PROXY;
  }
}
