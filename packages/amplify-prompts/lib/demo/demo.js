"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const printer_1 = require("../printer");
const prompter_1 = require("../prompter");
const validators_1 = require("../validators");
const printResult = (result) => console.log(`Prompt result was [${result}]`);
const printTypeofResult = (result) => console.log(`Response type was [${typeof result}]`);
const demo = async () => {
    printer_1.printer.info('confirmContinue is intended to be used anywhere the CLI is doing a potentially dangerous or destructive action and we want the customer to confirm their understanding.');
    printResult(await prompter_1.prompter.confirmContinue());
    printer_1.printer.info('A custom prompt can also be used');
    printResult(await prompter_1.prompter.confirmContinue('This will melt your laptop. Proceed?'));
    printer_1.printer.blankLine();
    printer_1.printer.info('yesOrNo is similar to confirmContinue but it should be used when we simply want to know whether or not to perform an optional task.');
    printer_1.printer.info('A message must be specified for this prompt');
    printResult(await prompter_1.prompter.yesOrNo('Do you want to wait for GME to go to the moon?', false));
    printer_1.printer.warn('The main difference between yesOrNo and confirmContinue is confirmContinue will always return true when the --yes flag is set but yesOrNo will return the default value');
    printer_1.printer.blankLine();
    printer_1.printer.info('To collect free-form input from the customer, use prompter.input');
    printer_1.printer.info('The simplest case is asking for a string input');
    printResult(await prompter_1.prompter.input("What's your favorite color of Skittle?"));
    printer_1.printer.info('To get an input type besides a string, specify a transform function');
    const result1 = await prompter_1.prompter.input('How many Skittles do you want?', { transform: (input) => Number.parseInt(input, 10) });
    printResult(result1);
    printTypeofResult(result1);
    printer_1.printer.info('In the above case, you may want to validate the input before the value is returned');
    printer_1.printer.info('A validate function can accomplish this');
    printer_1.printer.info('Try entering a value that is not a number this time');
    printResult(await prompter_1.prompter.input('How many Skittles do you want', {
        transform: (input) => Number.parseInt(input, 10),
        validate: (0, validators_1.integer)(),
    }));
    printer_1.printer.info('Validators can also be combined using boolean utility functions');
    printResult(await prompter_1.prompter.input('This input must be alphanumeric and at least 3 characters', {
        validate: (0, validators_1.and)([(0, validators_1.alphanumeric)(), (0, validators_1.minLength)(3)]),
    }));
    printer_1.printer.info('An initial value can be specified to a prompt');
    printResult(await prompter_1.prompter.input("What's your favorite Skittle color?", { initial: 'yellow' }));
    printer_1.printer.info('To enter passwords and other sensitive information, text can be hidden');
    printResult(await prompter_1.prompter.input('Enter your super secret value', { hidden: true }));
    printer_1.printer.info("Note that the result is printed for demo purposes only. Don't ever actually print sensitive info to the console");
    printer_1.printer.info('To enter a list of values and have it returned as an array of values, specify a returnSize of "many"');
    const resultInputMany = await prompter_1.prompter.input('Enter a list of names for each bag of Skittles', { returnSize: 'many' });
    printResult(resultInputMany);
    printTypeofResult(resultInputMany);
    printer_1.printer.info('Note that when using a "many" input, the transform and validate functions will be applied to each part of the input, rather than the whole input');
    printer_1.printer.blankLine();
    printer_1.printer.info('prompter.pick is used to select one or more items from a selection set');
    printer_1.printer.info('It supports autocomplete of choices automatically');
    const choices1 = ['red', 'yellow', 'green', 'orange', 'purple'];
    printResult(await prompter_1.prompter.pick('Pick your favorite Skittle color', choices1));
    printer_1.printer.info('To pick a value that is different than the display value, a list of name value pairs can be specified');
    const choices2 = [
        {
            name: 'red',
            value: 1,
        },
        {
            name: 'yellow',
            value: 2,
        },
        {
            name: 'green',
            value: 3,
        },
        {
            name: 'orange',
            value: 4,
        },
        {
            name: 'purple',
            value: 5,
        },
    ];
    const result2 = await prompter_1.prompter.pick('Pick your favorite Skittle color again', choices2);
    printResult(result2);
    printTypeofResult(result2);
    printer_1.printer.info('A default selection can be specified by providing the index of the option');
    printResult(await prompter_1.prompter.pick('Pick it again, this time with a default value', choices2, { initial: 2 }));
    printer_1.printer.info('Multiple choices can be selected by specifying multiSelect true');
    printer_1.printer.info('When multiSelect is on, an array of initial indexes can be specified');
    printResult(await prompter_1.prompter.pick('Pick your favorite colors', choices2, { returnSize: 'many', initial: [1, 2] }));
    printer_1.printer.info('Choices can also be selected by value using the provided helper function "byValue" (or "byValues" for multi-select)');
    printResult(await prompter_1.prompter.pick('Pick your favorite color', choices2, { initial: (0, prompter_1.byValue)(4) }));
    printer_1.printer.info('Individual choices can be disabled or have hint text next to them');
    choices2[1].hint = 'definitely the best';
    choices2[2].disabled = true;
    printResult(await prompter_1.prompter.pick('Pick your favorite Skittle color', choices2, { returnSize: 'many' }));
    printer_1.printer.info('A minimum and / or maximum number of choices can be specified');
    choices2[2].disabled = false;
    printResult(await prompter_1.prompter.pick('Pick 2 to 4 colors', choices2, { returnSize: 'many', pickAtLeast: 2, pickAtMost: 4 }));
};
demo().catch(console.error);
//# sourceMappingURL=demo.js.map