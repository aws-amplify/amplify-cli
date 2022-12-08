import url, { UrlWithStringQuery } from 'url';
import { getLatestApiVersion } from './VersionManager';

let parsedUrl: UrlWithStringQuery;

const version = getLatestApiVersion();
export const prodUrl = `https://api.cli.amplify.aws/${version}/metrics`;

/**
 *  Usage data tracking service URL
 */
export const getUrl = (): UrlWithStringQuery => {
  if (!parsedUrl) {
    parsedUrl = getParsedUrl();
  }

  return parsedUrl;
};

const getParsedUrl = (): UrlWithStringQuery => {
  if (isProduction() && !useBetaUrl()) {
    return url.parse(prodUrl);
  }

  return url.parse(process.env.AMPLIFY_CLI_BETA_USAGE_TRACKING_URL || '');
};

const isProduction = (): boolean => process.env.NODE_ENV === 'production';
const useBetaUrl = (): boolean => !!(process.env.AMPLIFY_CLI_BETA_USAGE_TRACKING_URL && typeof process.env.AMPLIFY_CLI_BETA_USAGE_TRACKING_URL === 'string');
