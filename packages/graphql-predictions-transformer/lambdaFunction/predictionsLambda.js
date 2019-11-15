const AWS = require('aws-sdk');
exports.handler = function(event, context, callback) {
  if (event.action === 'convertTextToSpeech') {
    convertTextToSpeech(event, callback);
  }
};
/**
 * This function does the following for the textToSpeech action
 * - Synthesize Speech
 * - Store mp3 result in S3
 * - Return getObject for that mp3 in a signed url
 * @param {*} event
 * @param {*} callback
 */
function convertTextToSpeech(event, callback) {
  const polly = new AWS.Polly();
  const s3 = new AWS.S3({
    params: {
      Bucket: event.bucket,
    },
  });
  let filename;
  const text = event.text;
  const pollyParams = {
    OutputFormat: 'mp3',
    SampleRate: '8000',
    Text: text,
    TextType: 'text',
    VoiceId: event.voiceID,
  };
  polly.synthesizeSpeech(pollyParams, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      callback(Error(err));
    } // an error occurred
    else {
      filename = `speech${event.uuid}.mp3`;
      const params2 = {
        Key: filename,
        ContentType: 'audio/mpeg',
        Body: data.AudioStream,
      };
      s3.putObject(params2, function(err, data) {
        if (err) {
          callback('Error putting item: ', err);
        } else {
          const getParams = { Bucket: event.bucket, Key: filename };
          const url = s3.getSignedUrl('getObject', getParams);
          callback(null, { url: url });
        }
      });
    }
  });
}
