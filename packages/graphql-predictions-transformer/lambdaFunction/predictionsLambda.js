const AWS = require('aws-sdk');
exports.handler = function(event, context, callback) {
  if (event && event.action === 'convertTextToSpeech') {
    convertTextToSpeech(event, callback);
  } else {
    callback(Error("Action not configured."))
  }
};
/**
 * This function does the following for the textToSpeech action
 * - Synthesize Speech
 * - Get a presigned url for that synthesized speech
 * @param {*} event
 * @param {*} callback
 */
function convertTextToSpeech(event, callback) {
  const pollyParams = {
    OutputFormat: 'mp3',
    SampleRate: '8000',
    Text: event.text,
    TextType: 'text',
    VoiceId: event.voiceID,
  };
  const polly = new AWS.Polly();
  const signer = new AWS.Polly.Presigner(pollyParams, polly);
  signer.getSynthesizeSpeechUrl(pollyParams, function(err, url) {
    if (err) {
      console.log(err, err.stack);
      callback(Error(err));
    } else {
      callback(null, { url: url })
    }
  });
}