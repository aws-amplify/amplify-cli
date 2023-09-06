import { Octokit } from '@octokit/rest';

const owner = 'aws-amplify';
const repo = 'amplify-cli';
const prNumber = Number.parseInt(process.argv[2]);
const githubToken = process.argv[3];
const octokit = new Octokit({
  auth: githubToken,
});

const main = async () => {
  const prIdentifier = {
    owner,
    repo,
    pull_number: prNumber,
  };
  const pullRequest = await octokit.rest.pulls.get(prIdentifier);
  console.log('####### octokit.rest.pulls.get ############');
  console.log(JSON.stringify(pullRequest.data, null, 2));
  console.log('###########################################');

  const requestedReviewers = await octokit.rest.pulls.listRequestedReviewers(prIdentifier);
  console.log('####### octokit.rest.pulls.listRequestedReviewers ############');
  console.log(JSON.stringify(requestedReviewers.data, null, 2));
  console.log('###########################################');

  const reviews = await octokit.pulls.listReviews(prIdentifier);
  console.log('####### octokit.pulls.listReviews ############');
  console.log(JSON.stringify(reviews.data, null, 2));
  console.log('###########################################');

  const reviewComments = await octokit.pulls.listReviewComments(prIdentifier);
  console.log('####### octokit.pulls.listReviewComments ############');
  console.log(JSON.stringify(reviewComments.data, null, 2));
  console.log('###########################################');
};

main().catch((err) => {
  console.log(err);
  process.exit(1);
});
