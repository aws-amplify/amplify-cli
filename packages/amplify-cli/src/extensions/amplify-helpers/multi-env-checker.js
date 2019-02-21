
function multiEnvironmentSupportAvailable(context) {
  context.amplify.constructExeInfo(context);
  const { amplifyMeta } = context.exeInfo;
  return !amplifyMeta.env;
}
module.exports = {
  multiEnvironmentSupportAvailable,
};
