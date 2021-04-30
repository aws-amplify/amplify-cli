/* eslint-disable */
const axios = require('axios');
/* eslint-enable */

exports.handler = async (event, context, callback) => {
  const response = await axios.post(
    `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHASECRET}&response=${event.request.challengeAnswer}`,
    {},
  );

  if (!(response && response.data && response.data.success)) {
    event.response.answerCorrect = false;
    throw new Error('captcha verification error');
  }

  return event;
};
