import { alphanumeric, matchRegex, between } from 'amplify-prompts';
import { v4 as uuid } from 'uuid';

const [shortId] = uuid().split('-');

export const servicesMetadata = {
  Lex: {
    inputs: {
      resourceQuestion: {
        // index: 0
        message: 'Provide a friendly resource name that will be used to label this category in the project:',
        type: 'input',
        validate: alphanumeric(),
        initial: `lex${shortId}`,
      },
      startQuestion: {
        // index: 1
        message: 'Would you like to start with a sample chatbot or start from scratch?',
        type: 'list',
        choices: ['Start with a sample', 'Start from scratch'],
        returnSize: 1,
        pickAtLeast: 1,
      },
      sampleChatbotQuestion: {
        // index: 2
        message: 'Choose a sample chatbot:',
        type: 'list',
        choices: ['BookTrip', 'OrderFlowers', 'ScheduleAppointment'],
        returnSize: 1,
        pickAtLeast: 1,
      },
      botNameQuestion: {
        // index: 3
        message: 'Enter a name for your bot:',
        type: 'input',
        validate: matchRegex(
          /^([A-Za-z]_?){2,50}$/,
          'The bot name must contain only letters and non-consecutive underscores, start with a letter, and be between 2-50 characters',
        ),
      },
      coppaQuestion: {
        // index: 4
        message:
          "Please indicate if your use of this bot is subject to the Children's Online Privacy Protection Act (COPPA).\nLearn more: https://www.ftc.gov/tips-advice/business-center/guidance/complying-coppa-frequently-asked-questions",
        type: 'confirm',
        initial: false,
      },
      chatBotNameUpdate: {
        // index: 5
        key: 'botName',
        message: 'Which chatbot would you like to update?',
        type: 'list',
        required: true,
      },
      addUpdateIntentQuestion: {
        // index: 6
        message: 'Would you like to add an intent or choose and existing intent?',
        type: 'list',
        choices: ['Update an existing intent', 'Add an intent', 'Delete an intent'],
        pickAtLeast: 1,
        returnSize: 1,
      },
      chooseIntentQuestion: {
        // index: 7
        type: 'list',
        message: 'Choose an intent: ',
        pickAtLeast: 1,
        returnSize: 1,
        // choices to be dynamically populated
      },
      addUtteranceQuestion: {
        // index: 8
        type: 'confirm',
        message: 'Would you like to add an utterance?',
        initial: true,
      },
      addSlotQuestion: {
        // index: 9
        type: 'confirm',
        message: 'Would you like to add a slot?',
        initial: true,
      },
      outputVoiceQuestion: {
        // index: 10
        message: 'Choose an output voice:',
        choices: [
          {
            name: 'None. This is only a text based application.',
            value: false,
          },
          {
            name: 'Male',
            value: 'Matthew',
          },
          {
            name: 'Female',
            value: 'Joanna',
          },
        ],
        type: 'list',
        pickAtLeast: 1,
        returnSize: 1,
      },
      sessionTimeoutQuestion: {
        // index: 11
        message: 'After how long should the session timeout (in minutes)?',
        transform: (input: string) => parseInt(input, 10),
        validate: between(1, 1440, 'Session timeout must be a number and must be greater than 0 and less than 1440.'),
        type: 'input',
      },
      intentNameQuestion: {
        // index: 12
        message: 'Give a unique name for the new intent:',
        type: 'input',
        validate: matchRegex(
          /^([A-Za-z]_?){1,100}$'/,
          'Intent name can only contain letters, cannot be empty, and must be no longer than 100 characters',
        ),
      },
      utteranceQuestion: {
        // index: 13
        message: 'Enter a sample utterance (spoken or typed phrase that invokes your intent. e.g. Book a hotel)',
        type: 'input',
        validate: matchRegex(/^.{1,200}$/, 'Utterances can be a maximum of 200 characters and cannot be empty'),
      },
      slotNameQuestion: {
        // index: 14
        message: 'Enter a name for your slot (e.g. Location)',
        type: 'input',
        validate: matchRegex(
          /^([A-Za-z]_?){1,100}$/,
          'Slot name can only contain letters, must be no longer than 100 characters, and cannot be empty',
        ),
      },
      slotTypeQuestion: {
        // index: 15
        message: 'Choose a slot type:',
        type: 'list',
        // choices to be dynamically populated
      },
      slotPromptQuestion: {
        // index: 16
        message: 'Enter a prompt for your slot (e.g. What city?)',
        type: 'input',
        validate: matchRegex(/^.{1,1000}$/, 'Prompts can have a maximum of 1000 characters and cannot be empty'),
      },
      slotRequiredQuestion: {
        // index: 17
        message: 'Should this slot be required?',
        type: 'confirm',
        initial: true,
      },
      addConfirmationQuestion: {
        // index: 18
        message: 'Would you like to add a confirmation prompt to your intent?',
        type: 'confirm',
        initial: false,
      },
      confirmationQuestionQuestion: {
        // index: 19
        message: 'Enter a confirmation message (e.g. Are you sure you want to order a {Drink_name}?):',
        type: 'input',
        validate: matchRegex(/^.{1,1000}$/, 'Confirmation questions can have a maximum of 1000 characters and cannot be empty'),
      },
      cancelMessageQuestion: {
        // index: 20
        message:
          'Enter a cancel message for when the user says no to the confirmation message (e.g. Okay. Your order will not be placed.):',
        type: 'input',
        validate: matchRegex(/^.{1,1000}$/, 'Cancel messages can have a maximum of 1000 characters and cannot be empty'),
      },
      intentFulfillmentQuestion: {
        // index: 21
        message: 'How would you like the intent to be fulfilled?',
        type: 'list',
        choices: [
          {
            name: 'AWS Lambda Function',
            value: 'lambdaFunction',
          },
          {
            name: 'Return parameters to client',
            value: 'returnParameters',
          },
        ],
        pickAtLeast: 1,
        returnSize: 1,
      },
      lambdaFunctionName: {
        // index: 22
        key: 'lambdaFunctionName',
        message: 'Choose a Lambda function to use:',
        type: 'list',
        required: true,
      },
      addAnotherIntentQuestion: {
        // index: 23
        message: 'Would you like to create another intent?',
        type: 'confirm',
        initial: false,
      },
      addAnotherUtteranceQuestion: {
        // index: 24
        message: 'Would you like to add another utterance?',
        type: 'confirm',
        initial: true,
      },
      addAnotherSlotQuestion: {
        // index: 25
        message: 'Would you like to add another slot?',
        type: 'confirm',
        initial: true,
      },
      slotTypeChoiceQuestion: {
        // index: 26
        message: "Would you like to choose an Amazon built-in slot type, a slot type you've already made, or create a new slot type?",
        type: 'list',
        choices: ['Amazon built-in slot type', "Slot type I've already made", 'Create a new slot type'],
      },
      slotTypeNameQuestion: {
        // index: 27
        message: 'What would you like to name your slot type?',
        type: 'input',
        validate: matchRegex(
          /^([A-Za-z]_?){1,100}$/,
          'The slot name must contain only letters and non-consecutive underscores, start with a letter, and be no more than 100 characters',
        ),
      },
      slotTypeDescriptionQuestion: {
        // index: 28
        message: 'Give a description of your slot type:',
        type: 'input',
        validate: matchRegex(/^.{1,1000}$/, 'Slot type descriptions can have a maximum of 1000 characters and cannot be empty'),
      },
      slotTypeValueQuestion: {
        // index: 29
        message: 'Add a possible value for your slot:',
        type: 'input',
        validate: matchRegex(/^.{1,1000}$/, 'Slot values can have a maximum of 1000 characters and cannot be empty'),
      },
      continueAddingSlotValuesQuestion: {
        // index: 30
        message: 'Add another slot value?',
        type: 'confirm',
        initial: true,
      },
      deleteIntentConfirmation: {
        // index: 31
        message: 'Are you sure you want to delete this intent?',
        type: 'confirm',
        initial: false,
      },
    },
    samples: {
      BookTrip: [
        {
          cancelMessage: 'Okay, I have cancelled your reservation in progress.',
          confirmationQuestion:
            'Okay, I have you down for a {CarType} rental in {PickUpCity} from {PickUpDate} to {ReturnDate}. Should I book the reservation?',
          slots: [
            {
              name: 'PickUpCity',
              type: 'AMAZON.US_CITY',
              prompt: 'In what city do you need to rent a car?',
              required: true,
              customType: false,
            },
            {
              name: 'PickUpDate',
              type: 'AMAZON.DATE',
              prompt: 'What day do you want to start your rental?',
              required: true,
              customType: false,
            },
            {
              name: 'ReturnDate',
              type: 'AMAZON.DATE',
              prompt: 'What day do you want to return the car?',
              required: true,
              customType: false,
            },
            {
              name: 'DriverAge',
              type: 'AMAZON.NUMBER',
              prompt: 'How old is the driver for this rental?',
              required: true,
              customType: false,
            },
            {
              name: 'CarType',
              type: 'CarTypeValues',
              prompt: 'What type of car would you like to rent? Our most popular options are economy, midsize, and luxury',
              required: true,
              customType: true,
            },
          ],
          utterances: ['Make a car reservation', 'Reserve a car', 'Book a car'],
          intentName: 'BookCar',
          newSlotTypes: [
            {
              slotType: 'CarTypeValues',
              slotTypeDescription: 'Enumeration representing possible types of cars available for rental',
              slotValues: ['standard', 'full size', 'midsize', 'luxury', 'economy', 'minivan'],
            },
          ],
        },
        {
          cancelMessage: 'Okay, I have cancelled your reservation in progress.',
          confirmationQuestion:
            'Okay, I have you down for a {Nights} night stay in {Location} starting {CheckInDate}. Shall I book the reservation?',
          slots: [
            {
              name: 'Location',
              type: 'AMAZON.US_CITY',
              prompt: 'What city will you be staying in?',
              required: true,
              customType: false,
            },
            {
              name: 'CheckInDate',
              type: 'AMAZON.DATE',
              prompt: 'What day do you want to check in?',
              required: true,
              customType: false,
            },
            {
              name: 'Nights',
              type: 'AMAZON.NUMBER',
              prompt: 'How many nights will you be staying?',
              required: true,
              customType: false,
            },
            {
              name: 'RoomType',
              type: 'RoomTypeValues',
              prompt: 'What type of room would you like: queen, king or deluxe?',
              required: true,
              customType: true,
            },
          ],
          utterances: ['Book a {Nights} night stay in {Location}', 'I want a make hotel reservations', 'Book a hotel'],
          intentName: 'BookHotel',
          newSlotTypes: [
            {
              slotType: 'RoomTypeValues',
              slotTypeDescription: 'Enumeration representing possible types of a hotel room',
              slotValues: ['deluxe', 'queen', 'king'],
            },
          ],
        },
      ],
      OrderFlowers: [
        {
          cancelMessage: 'Okay, I will not place your order.',
          confirmationQuestion: 'Okay, your {FlowerType} will be ready for pickup by {PickupTime} on {PickupDate}. Does this sound okay?',
          slots: [
            {
              name: 'FlowerType',
              type: 'FlowerTypes',
              prompt: 'What type of flowers would you like to order?',
              required: true,
              customType: true,
            },
            {
              name: 'PickupDate',
              type: 'AMAZON.DATE',
              prompt: 'What day do you want the {FlowerType} to be picked up?',
              required: true,
              customType: false,
            },
            {
              name: 'PickupTime',
              type: 'AMAZON.TIME',
              prompt: 'At what time do you want the {FlowerType} to be picked up?',
              required: true,
              customType: false,
            },
          ],
          utterances: ['I would like to order some flowers', 'I would like to pick up flowers'],
          intentName: 'OrderFlowers',
          newSlotTypes: [
            {
              slotType: 'FlowerTypes',
              slotTypeDescription: 'Types of flowers to pick up',
              slotValues: ['tulips', 'lillies', 'roses'],
            },
          ],
        },
      ],
      ScheduleAppointment: [
        {
          cancelMessage: 'Okay, I will not schedule an appointment.',
          confirmationQuestion: '{Time} is available, should I go ahead and book your appointment?',
          slots: [
            {
              name: 'AppointmentType',
              type: 'AppointmentTypeValue',
              prompt: 'What type of appointment would you like to schedule?',
              required: true,
              customType: true,
            },
            {
              name: 'Date',
              type: 'AMAZON.DATE',
              prompt: 'When should I schedule your appointment?',
              required: true,
              customType: false,
            },
            {
              name: 'Time',
              type: 'AMAZON.TIME',
              prompt: 'At what time should I schedule your appointment?',
              required: true,
              customType: false,
            },
          ],
          utterances: ['Book a ​{AppointmentType}​', 'Book an appointment', 'I would like to book an appointment'],
          intentName: 'MakeAppointment',
          newSlotTypes: [
            {
              slotType: 'AppointmentTypeValue',
              slotTypeDescription: 'Type of dentist appointment to schedule',
              slotValues: ['cleaning', 'whitening', 'root canal'],
            },
          ],
        },
      ],
    },
    defaultValuesFilename: 'lex-defaults.js',
    serviceWalkthroughFilename: 'lex-walkthrough.js',
    cfnFilename: 'lex-cloudformation-template.json.ejs',
    provider: 'awscloudformation',
  },
};
