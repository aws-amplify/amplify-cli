export function getGitHubOwnerRepoFromPath(path: string) {
  if (!path.startsWith('https://github.com/')) {
    throw Error(`Invalid Repo Path ${path}`);
  }

  const [, , , owner, repo, , branch, ...pathParts] = path.split('/');

  return {
    owner,
    repo,
    branch,
    path: pathParts.join('/'),
  };
}
