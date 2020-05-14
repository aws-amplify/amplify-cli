module.exports.asyncHandler = (event, context, callback) => {
  return new Promise((resolve, reject) => {
    if (event.succeed) {
      resolve('foo');
    } else {
      reject(new Error('Fail'));
    }
  });
};

module.exports.callbackHandler = async (event, context, callback) => {
  if (event.succeed) {
    callback(null, 'foo');
  } else {
    callback(new Error('Fail'), null);
  }
};

module.exports.nonAsyncHandler = () => {
  return 'foo';
};
