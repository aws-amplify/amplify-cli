import * as fs from 'fs-extra';
import fetch, { RequestInit } from 'node-fetch';
import * as path from 'path';

/**
 * Some constants and utils shared by github-prerelease and github-release
 */
const owner = process.env.GITHUB_REPO_OWNER ?? 'aws-amplify';
const repo = 'amplify-cli';
const apiTemplate = (subdomain: string) => `${subdomain}.github.com/repos/${owner}/${repo}/releases`;
const API_URL = apiTemplate('api');
const API_UPLOADS_URL = apiTemplate('uploads');
const authHeaders = { Authorization: `token ${process.env.GITHUB_TOKEN}` };

if (!process.env.GITHUB_TOKEN) {
  throw new Error('Missing GITHUB_TOKEN environment variable');
}

export const releasesRequest = (urlPath: string, opts?: RequestInit) => {
  const url = urlPath ? `${API_URL}/${urlPath}` : API_URL;
  return requestJsonWithAuth(url, opts);
};

export const uploadReleaseFile = async (releaseId: string, filepath: string) => {
  const filename = path.basename(filepath);
  const url = `${API_UPLOADS_URL}/${releaseId}/assets?name=${filename}`;
  return requestJsonWithAuth(url, {
    method: 'POST',
    body: fs.createReadStream(filepath),
    headers: {
      'content-length': (await fs.stat(filepath)).size.toString(),
      'content-type': 'application/octet-stream',
    },
  });
};

export const getArgs = () => {
  if (process.argv.length > 4) {
    throw new Error(`Expected semver version and commit SHA to be the only arguments`);
  }
  return {
    version: process.argv[2].trim(),
    commit: process.argv[3].trim(),
  };
};

export const githubTagToSemver = (tag: string) => tag.slice(1);
export const semverToGithubTag = (semver: string) => `v${semver}`;

/**
 * Injects auth headers into the request and parses the response as json
 */
const requestJsonWithAuth = async (url: string, opts: RequestInit = {}) => {
  url = encodeURI(`https://${url}`);
  opts.headers = { ...authHeaders, ...opts.headers };
  const response = await fetch(url, opts);
  if (response.status === 204) return null;
  const result = await response.json();
  if (response.status >= 400) {
    throw new Error(`${response.status}: Request to ${url} was rejected:\n${JSON.stringify(result, null, 2)}`);
  }
  return result;
};
