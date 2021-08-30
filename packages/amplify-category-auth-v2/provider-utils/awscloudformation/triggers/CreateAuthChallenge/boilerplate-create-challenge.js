/* tslint:disable */
/* eslint-disable */

exports.handler = (event, context) => {
  if (event.request.session.length === 2 && event.request.challengeName === 'CUSTOM_CHALLENGE') {
    event.response.publicChallengeParameters = { trigger: 'true' };

    event.response.privateChallengeParameters = {};
    event.response.privateChallengeParameters.answer = process.env.CHALLENGEANSWER;
  }
  context.done(null, event);
};
