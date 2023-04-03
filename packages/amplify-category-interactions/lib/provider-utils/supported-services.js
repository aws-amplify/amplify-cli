"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.servicesMetadata = void 0;
exports.servicesMetadata = {
    Lex: {
        samples: {
            BookTrip: [
                {
                    cancelMessage: 'Okay, I have cancelled your reservation in progress.',
                    confirmationQuestion: 'Okay, I have you down for a {CarType} rental in {PickUpCity} from {PickUpDate} to {ReturnDate}. Should I book the reservation?',
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
                    confirmationQuestion: 'Okay, I have you down for a {Nights} night stay in {Location} starting {CheckInDate}. Shall I book the reservation?',
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
                            slotValues: ['tulips', 'lilies', 'roses'],
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
//# sourceMappingURL=supported-services.js.map