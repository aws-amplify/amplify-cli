import { ProxyAgent } from 'proxy-agent';

export const proxyAgent = () => {
  let httpAgent = undefined;
  const httpProxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
  if (httpProxy) {
    httpAgent = new ProxyAgent();
  }
  return httpAgent;
};

// credentials and customUserAgent will also go in here
