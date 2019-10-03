/* eslint-disable object-shorthand */
/* eslint-disable no-multi-str */

const transcriptionOptions = [
  { name: 'British English', value: 'en-GB' },

  { name: 'US English', value: 'en-US' },

  { name: 'French', value: 'fr-FR' },

  { name: 'Canadian French', value: 'fr-CA' },

  { name: 'US Spanish', value: 'es-US' },
];

const translateOptions = [
  { name: 'Arabic', value: 'ar' },

  { name: 'Chinese (Simplified)', value: 'zh' },

  { name: 'Chinese (Traditional)', value: 'zh-TW' },

  { name: 'Czech', value: 'cs' },

  { name: 'Danish', value: 'da' },

  { name: 'Dutch', value: 'nl' },

  { name: 'English', value: 'en' },

  { name: 'Finnish', value: 'fi' },

  { name: 'French', value: 'fr' },

  { name: 'German', value: 'de' },

  { name: 'Hebrew', value: 'he' },

  { name: 'Hindi', value: 'hi' },

  { name: 'Indonesian', value: 'id' },

  { name: 'Italian', value: 'it' },

  { name: 'Japanese', value: 'ja' },

  { name: 'Korean', value: 'ko' },

  { name: 'Malay', value: 'ms' },

  { name: 'Norwegian', value: 'no' },

  { name: 'Persian', value: 'fa' },

  { name: 'Polish', value: 'pl' },

  { name: 'Portuguese', value: 'pt' },

  { name: 'Russian', value: 'ru' },

  { name: 'Spanish', value: 'es' },

  { name: 'Swedish', value: 'sv' },

  { name: 'Turkish', value: 'tr' },
];

const deniedCombos = {
  zh: ['zh-TW'],
  'zh-Tw': ['zh'],
  ko: ['he'],
  no: ['ar', 'he'],
};

const convertAccess = {
  prompt(options) {
    return [
      {
        type: 'list',
        name: 'access',
        message: 'Who should have access?',
        choices: [
          {
            name: 'Auth users only',
            value: 'auth',
          },
          {
            name: 'Auth and Guest users',
            value: 'authAndGuest',
          },
        ],
        default: (options.access) ? options.access : 'auth',
      },
    ];
  },
};

const setup = {
  type() {
    return [
      {
        type: 'list',
        name: 'convertType',
        message: 'What would you like to convert?',
        choices: [
          {
            name: 'Translate text into a different language',
            value: 'translateText',
          },
          {
            name: 'Generate speech audio from text',
            value: 'speechGenerator',
          },
          {
            name: 'Transcribe text from audio',
            value: 'transcription',
          },
        ],
      },
    ];
  },
  name(defaultName) {
    return [
      {
        name: 'resourceName',
        message: 'Provide a friendly name for your resource',
        validate: (value) => {
          const regex = new RegExp('^[a-zA-Z0-9]+$');
          return regex.test(value) ?
            true : 'Resource name should be alphanumeric!';
        },
        default: defaultName,
      },
    ];
  },
};

const translateText = {
  questions(options) {
    return [
      {
        type: 'list',
        name: 'sourceLang',
        message: 'What is the source language?',
        choices: translateOptions,
        default: options.sourceLang,
      },
    ];
  },
  targetQuestion(targetOptions, options) {
    return [
      {
        type: 'list',
        name: 'targetLang',
        message: 'What is the target language?',
        choices: targetOptions,
        default: options.targetLang,
      },
    ];
  },
  service: 'Translate',
  authAccess: convertAccess,
};

const speechGenerator = {
  questions(options) {
    return [
      {
        type: 'list',
        name: 'language',
        message: 'What is the source language?',
        choices: options.languages,
        default: options.language,
      },
    ];
  },
  voiceQuestion(langID, options) {
    return [
      {
        type: 'list',
        name: 'voice',
        message: 'Select a speaker',
        choices: options.voices[langID],
        default: options.voice,
      },
    ];
  },
  service: 'Polly',
  authAccess: convertAccess,
};

const transcription = {
  questions(options) {
    return [
      {
        type: 'list',
        name: 'language',
        message: 'What is the source language?',
        choices: transcriptionOptions,
        default: options.language,
      },
    ];
  },
  service: 'Transcribe',
  authAccess: convertAccess,
};

const convertTypes = {
  translateText,
  speechGenerator,
  transcription,
};

export default {
  setup,
  convertTypes,
  convertAccess,
  translateOptions,
  deniedCombos,
};
