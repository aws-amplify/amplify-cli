const { prompt } = require('gluegun');

async function amplifyMetricsQuestion() {
  return await prompt.confirm('Usage statistics and metrics enable AWS to continuously improve AWS Amplify. Do you consent to the automated periodic collection of anonymized usage statistics and metrics from AWS Amplify by AWS?');
}

module.exports = {
  amplifyMetricsQuestion,
};
