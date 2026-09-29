import { DiagnoseReportUploadError } from '@aws-amplify/amplify-cli-core';
import fetch from 'node-fetch';

/**
 * Return the public key from github API
 * @returns the public key
 */
export const getPublicKey = async (): Promise<string> => {
  let url = 'https://aws-amplify.github.io/amplify-cli/report-public-key.pub';
  if (process.env.AMPLIFY_CLI_BETA_PUBLIC_KEY_URL && typeof process.env.AMPLIFY_CLI_BETA_PUBLIC_KEY_URL === 'string') {
    url = process.env.AMPLIFY_CLI_BETA_PUBLIC_KEY_URL || url;
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new DiagnoseReportUploadError('Failed to retrieve public key');
  }
  return res.text();
};

/**
 * The function checks for the environment variable AMPLIFY_CLI_BETA_REPORT_URL if it's not present or is not a string
 * return the prod url
 * @returns url for the reporter end point
 */
export const reporterEndpoint = (): string => {
  const prodUrl = 'https://api.cli.amplify.aws/diagnose/report';
  if (process.env.AMPLIFY_CLI_BETA_REPORT_URL && typeof process.env.AMPLIFY_CLI_BETA_REPORT_URL === 'string') {
    return process.env.AMPLIFY_CLI_BETA_REPORT_URL || prodUrl;
  }
  return prodUrl;
};
