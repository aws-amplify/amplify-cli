// case-layer-v1 and v2 is deployed in the layer as casing.js
const { convertString } = require('/opt/casing');

exports.handler = async () => {
  const response = {
    statusCode: 200,
    body: JSON.stringify(convertString('{{testString}}')),
  };

  return response;
};
