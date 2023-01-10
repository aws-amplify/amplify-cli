import { parse, URLSearchParams } from 'url';
export function decodeHeaderFromQueryParam(rawUrl: string, paramName = 'header'): Record<string, any> {
  const url = parse(rawUrl);
  const params = new URLSearchParams(url.query);
  const base64Header = params.get(paramName);
  if (!base64Header) {
    return {};
  }
  return JSON.parse(Buffer.from(base64Header, 'base64').toString('utf8'));
}
