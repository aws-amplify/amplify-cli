const fs = require('fs');
const upperCase = require('upper-case');

exports.handler = async event => {
  const data = fs.readFileSync('/opt/data.txt');
  const response = {
    statusCode: 200,
    body: JSON.stringify(upperCase.upperCase('{{testString}}') + ' ' + data),
  };

  return response;
};
