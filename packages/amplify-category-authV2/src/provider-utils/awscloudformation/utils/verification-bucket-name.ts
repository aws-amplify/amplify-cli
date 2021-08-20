/**
 * Refactored from awscloudformation/index.js
 * @param current The current ServiceQuestionsResult
 * @param previous Previous results (if any)
 */
export const verificationBucketName = async (current: any, previous?: any) => {
  if (current.triggers && current.triggers.CustomMessage && current.triggers.CustomMessage.includes('verification-link')) {
    const name = previous ? previous.resourceName : current.resourceName;
    current.verificationBucketName = `${name.toLowerCase()}verificationbucket`;
  } else if (
    previous &&
    previous.triggers &&
    previous.triggers.CustomMessage &&
    previous.triggers.CustomMessage.includes('verification-link') &&
    previous.verificationBucketName &&
    (!current.triggers || !current.triggers.CustomMessage || !current.triggers.CustomMessage.includes('verification-link'))
  ) {
    delete previous.verificationBucketName;
  }
};
