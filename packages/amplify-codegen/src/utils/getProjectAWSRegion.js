function getProjectAWSRegion(context) {
  const projectMeta = context.amplify.getProjectMeta();
  const { awscloudformation } = projectMeta.providers;
  return awscloudformation.Region;
}

module.exports = getProjectAWSRegion;
