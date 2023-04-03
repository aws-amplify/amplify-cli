"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseInputs = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const lodash_1 = require("lodash");
const chalk_1 = __importDefault(require("chalk"));
const parseInputs = async (input, amplify, defaultValuesFilename, stringMapsFilename, currentAnswers, context) => {
    var _a, _b;
    var _c;
    const defaultValuesSrc = `${__dirname}/../assets/${defaultValuesFilename}`;
    const stringMapsSrc = `${__dirname}/../assets/${stringMapsFilename}`;
    const { getAllDefaults } = await (_a = defaultValuesSrc, Promise.resolve().then(() => __importStar(require(_a))));
    const { getAllMaps } = await (_b = stringMapsSrc, Promise.resolve().then(() => __importStar(require(_b))));
    const color = (_c = input.prefixColor) !== null && _c !== void 0 ? _c : 'green';
    const questionChalk = chalk_1.default[color];
    const prefix = input.prefix ? `${'\n'} ${questionChalk(input.prefix)} ${'\n'}` : '';
    let question = {
        name: input.key,
        message: input.question,
        prefix,
        suffix: input.suffix,
        when: amplify.getWhen(input, currentAnswers, context.updatingAuth, amplify),
        validate: amplify.inputValidation(input),
        default: () => {
            if (context.updatingAuth && context.updatingAuth[input.key] !== undefined) {
                if (input.key === 'triggers') {
                    return triggerDefaults(context, input, getAllMaps(context.updatingAuth)[input.map]);
                }
                return context.updatingAuth[input.key];
            }
            return getAllDefaults(amplify.getProjectDetails(amplify))[input.key];
        },
    };
    if (input.type && ['list', 'multiselect'].includes(input.type)) {
        if (context.updatingAuth && input.iterator) {
            question = iteratorQuestion(input, question, context);
            question.validate = () => true;
        }
        else if (input.filter) {
            question = filterInputs(input, question, getAllMaps, context, currentAnswers);
        }
        else if (input.requiredOptions) {
            question = getRequiredOptions(input, question, getAllMaps, context, currentAnswers);
        }
        else if (!input.requiredOptions || (question.when && !question.when())) {
            question = {
                choices: input.map ? getAllMaps(context.updatingAuth)[input.map] : input.options,
                ...question,
            };
        }
    }
    if (input.type && input.type === 'list') {
        question = {
            type: 'list',
            ...question,
        };
    }
    else if (input.type && input.type === 'multiselect') {
        question = {
            type: 'checkbox',
            ...question,
        };
    }
    else if (input.type && input.type === 'confirm') {
        question = {
            type: 'confirm',
            ...question,
        };
    }
    else {
        question = {
            type: 'input',
            ...question,
        };
    }
    return question;
};
exports.parseInputs = parseInputs;
const iteratorQuestion = (input, question, context) => {
    var _a;
    if ((_a = context.updatingAuth) === null || _a === void 0 ? void 0 : _a[input.iterator]) {
        question = {
            choices: context.updatingAuth[input.iterator].map((i) => ({
                name: i,
                value: i,
            })),
            ...question,
        };
    }
    else if (input.iterator) {
        question = {
            choices: [],
            ...question,
        };
    }
    return question;
};
const getRequiredOptions = (input, question, getAllMaps, context, currentAnswers) => {
    const sourceValues = Object.assign(context.updatingAuth ? context.updatingAuth : {}, currentAnswers);
    const sourceArray = (0, lodash_1.uniq)((0, lodash_1.flatten)(input.requiredOptions.map((i) => sourceValues[i] || [])));
    const requiredOptions = getAllMaps()[input.map] ? getAllMaps()[input.map].filter((x) => sourceArray.includes(x.value)) : [];
    const trueOptions = getAllMaps()[input.map] ? getAllMaps()[input.map].filter((x) => !sourceArray.includes(x.value)) : [];
    const msg = requiredOptions && requiredOptions.length > 0
        ? `--- ${input.requiredOptionsMsg} ${requiredOptions.map((t) => t.name).join(', ')}   ---`
        : '';
    question = Object.assign(question, {
        choices: [new inquirer_1.default.Separator(msg), ...trueOptions],
        filter: (userInput) => userInput.concat(...requiredOptions.map((z) => z.value)),
    });
    return question;
};
const filterInputs = (input, question, getAllMaps, context, currentAnswers) => {
    if (input.filter === 'providers') {
        const choices = input.map ? getAllMaps(context.updatingAuth)[input.map] : input.options;
        const { requiredAttributes } = Object.assign(context.updatingAuth ? context.updatingAuth : {}, currentAnswers);
        if (requiredAttributes) {
            const attrMap = getAllMaps().attributeProviderMap;
            requiredAttributes.forEach((attr) => {
                choices.forEach((choice) => {
                    choice.missingAttributes = [];
                    if (!attrMap[attr] || !attrMap[attr][`${choice.value.toLowerCase()}`].attr) {
                        choice.missingAttributes = choice.missingAttributes.length < 1 ? [attr] : choice.missingAttributes.concat(attr);
                        const newList = choice.missingAttributes.join(', ');
                        choice.disabled = `Your UserPool is configured to require ${newList.substring(0, newList.length)}, which cannot be retrieved from ${choice.name}`;
                    }
                });
            });
        }
        question = { choices, ...question };
    }
    if (input.filter === 'attributes') {
        let choices = input.map ? getAllMaps(context.updatingAuth)[input.map] : input.options;
        choices = JSON.parse(JSON.stringify(choices));
        const attrMap = getAllMaps().attributeProviderMap;
        choices.forEach((choice) => {
            choice.missingProviders = [];
            if (attrMap[choice.value]) {
                Object.values(attrMap[choice.value]).forEach((provider, index) => {
                    if (!provider.attr) {
                        const providerKey = Object.keys(attrMap[choice.value])[index];
                        let providerName = providerKey.charAt(0).toUpperCase() + providerKey.slice(1);
                        if (providerName.toLowerCase() === 'LoginWithAmazon'.toLowerCase()) {
                            providerName = 'Login With Amazon';
                        }
                        if (providerName.toLowerCase() === 'SignInWithApple'.toLowerCase()) {
                            providerName = 'Sign in with Apple';
                        }
                        choice.missingProviders = choice.missingProviders.length < 1 ? [providerName] : choice.missingProviders.concat(providerName);
                    }
                });
                if (choice.missingProviders && choice.missingProviders.length > 0) {
                    const newList = choice.missingProviders.join(', ');
                    choice.name = `${choice.name} (This attribute is not supported by ${newList.substring(0, newList.length)}.)`;
                }
            }
        });
        question = { choices, ...question };
    }
    if (input.filter === 'updateOptions' && context.updatingAuth) {
        const choices = input.map ? getAllMaps(context.updatingAuth)[input.map] : input.options;
        const newChoices = JSON.parse(JSON.stringify(choices));
        choices.forEach((c) => {
            var _a, _b, _c;
            if (c.conditionKey === 'useDefault' && ((_a = context.updatingAuth) === null || _a === void 0 ? void 0 : _a[c.conditionKey]) === c.value && !c.conditionMsg) {
                const index = newChoices.findIndex((i) => i.name === c.name);
                newChoices.splice(index, 1);
            }
            else if (c.conditionMsg && !((_b = context.updatingAuth) === null || _b === void 0 ? void 0 : _b[c.conditionKey])) {
                if (((_c = context.updatingAuth) === null || _c === void 0 ? void 0 : _c.useDefault) === 'defaultSocial') {
                    const index = newChoices.findIndex((i) => i.name === c.name);
                    newChoices[index].disabled = `Disabled: ${c.conditionMsg}`;
                }
                else {
                    const index = newChoices.findIndex((i) => i.name === c.name);
                    newChoices.splice(index, 1);
                }
            }
        });
        question = { choices: newChoices, ...question };
    }
    return question;
};
const triggerDefaults = (context, input, availableOptions) => {
    var _a;
    const capabilityDefaults = [];
    if ((_a = context.updatingAuth) === null || _a === void 0 ? void 0 : _a.triggers) {
        const current = typeof context.updatingAuth[input.key] === 'string'
            ? JSON.parse(context.updatingAuth[input.key])
            : context.updatingAuth[input.key];
        try {
            if (current) {
                availableOptions.forEach((a) => {
                    let match = true;
                    Object.keys(a.triggers).forEach((t) => {
                        if (current[t]) {
                            const test = a.triggers[t].every((c) => current[t].includes(c));
                            if (!test) {
                                match = false;
                            }
                        }
                        else {
                            match = false;
                        }
                    });
                    if (match) {
                        capabilityDefaults.push(a.value);
                    }
                });
            }
        }
        catch (e) {
            throw new Error('Error parsing capability defaults');
        }
    }
    return capabilityDefaults;
};
//# sourceMappingURL=core-questions.js.map