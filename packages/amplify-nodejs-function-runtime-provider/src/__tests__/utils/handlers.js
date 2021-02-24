const fs = require('fs-extra');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '../data/mock.json'), 'utf-8');
const data = JSON.parse(content);

module.exports.expectedLargeData = data;

// async handlers
module.exports.asyncReturnEvent = async event => {
  return event;
};

module.exports.asyncReturnUndefined = async () => {
  return undefined;
};

module.exports.asyncRejectWithError = async () => {
  throw new Error('asyncRejectWithError failure');
};

module.exports.asyncRejectWithString = async () => {
  throw 'asyncRejectWithString failure';
};

module.exports.asyncReturnLargeData = async () => {
  return data;
};

// callback handlers
module.exports.callbackReturnEvent = (event, _, callback) => {
  callback(null, event);
};

module.exports.callbackRejectWithError = (_, __, callback) => {
  callback(new Error('callbackRejectWithError failure'));
};

module.exports.callbackRejectWithString = (_, __, callback) => {
  callback('callbackRejectWithString failure');
};

module.exports.syncRejectWithError = () => {
  throw new Error('syncRejectWithError failure');
};

module.exports.syncRejectWithString = () => {
  throw 'syncRejectWithString failure';
};

// invalid handlers
module.exports.referenceError = () => {
  console.dne('referenceError');
};
