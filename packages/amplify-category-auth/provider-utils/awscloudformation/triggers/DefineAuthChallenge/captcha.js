exports.handler = (event, context, callback) => {
  if (event.request.session.length === 2 && event.request.challengeName === 'CUSTOM_CHALLENGE') {
    event.response.publicChallengeParameters = {};
    event.response.publicChallengeParameters.captchaUrl = 'url/123.jpg';
    event.response.privateChallengeParameters = {};
    event.response.privateChallengeParameters.answer = '5';
    event.response.challengeMetadata = 'CAPTCHA_CHALLENGE';
  }
  context.done(null, event);
};
