/* eslint-disable */
const axios = require('axios');
/* eslint-enable */

exports.handler = async (event) => {
  const response = await axios.post(
    `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHASECRET}&response=${event.request.challengeAnswer}`,
    {},
  );
  /**
   * If the CAPTCHA challenge succeeded, set the `answerCorrect` field to
   * `true`; otherwise, set it to `false` and throw an error.
   */
  const challengeSucceeded = response && response.data && response.data.success;
  if (challengeSucceeded) {
    event.response.answerCorrect = true;
  } else {
    event.response.answerCorrect = false;
    throw new Error('CAPTCHA verification error');
  }
  return event;
};
