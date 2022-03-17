import url, { UrlWithStringQuery } from 'url';
import { getLatestApiVersion } from './VersionManager';

const version = getLatestApiVersion();
export const prodUrl = `https://api.cli.amplify.aws/${version}/metrics`;
export function getUrl(): UrlWithStringQuery {
  if (process.env.AMPLIFY_CLI_BETA_USAGE_TRACKING_URL && typeof process.env.AMPLIFY_CLI_BETA_USAGE_TRACKING_URL === 'string')
    return url.parse(process.env.AMPLIFY_CLI_BETA_USAGE_TRACKING_URL || '');
  return url.parse(prodUrl);
}
