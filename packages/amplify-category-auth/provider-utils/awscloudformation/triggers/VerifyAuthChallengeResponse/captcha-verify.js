/* eslint-disable */
const axios = require('axios');
/* eslint-enable */

exports.handler = (event, context, callback) => {
  axios
    .post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHASECRET}&response=${event.request.challengeAnswer}`,
      {}
    )
    .then(response => {
      if (response && response.data && response.data.success) {
        event.response.answerCorrect = true;
        callback(null, event);
      } else {
        event.response.answerCorrect = false;
        callback(new Error('captcha verification error'), event);
      }
    })
    .catch(() => {
      event.response.answerCorrect = false;
      callback(new Error('captcha verification error'), event);
    });
};
