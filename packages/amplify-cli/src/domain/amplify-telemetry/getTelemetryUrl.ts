import url, { UrlWithStringQuery } from 'url';
import { getLatestApiVersion } from './VersionManager';

const version = getLatestApiVersion();
export const prodUrl = `https://aws-amplify-cli-telemetry.us-east-1.amazonaws.com/${version}/metrics`;
export function getUrl(): UrlWithStringQuery {
  if (process.env.AMPLIFY_CLI_BETA_USAGE_TRACKING_URL && typeof process.env.AMPLIFY_CLI_BETA_USAGE_TRACKING_URL === 'string')
    return url.parse(process.env.AMPLIFY_CLI_BETA_USAGE_TRACKING_URL || '');
  return url.parse(prodUrl);
}
