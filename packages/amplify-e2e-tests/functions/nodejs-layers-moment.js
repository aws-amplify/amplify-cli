const fs = require('fs');
const moment = require('moment');

exports.handler = async event => {
  const optContent = fs.readFileSync('/opt/data.txt', 'utf-8').toString();

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      currentISODate: moment().format(),
      optContent,
    }),
  };

  return response;
};
