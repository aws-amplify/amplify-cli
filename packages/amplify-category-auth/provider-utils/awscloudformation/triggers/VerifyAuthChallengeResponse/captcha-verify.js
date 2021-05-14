/* eslint-disable */
const axios = require('axios');
/* eslint-enable */

exports.handler = async (event) => {
  const response = await axios.post(
    `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHASECRET}&response=${event.request.challengeAnswer}`,
    {},
  );
  /**
   * Verify that the CAPTCHA challenge succeeded, and if it did, indicate so in
   * the event response.
   *
   * If the challenge fails, throw an error.
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
