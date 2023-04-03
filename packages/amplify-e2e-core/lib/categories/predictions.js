"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addInterpret = exports.addIdentifyCollection = exports.addConvert = void 0;
const __1 = require("..");
// add convert resource
function addConvert(cwd) {
    const resourceName = 'convertTest1';
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['predictions', 'add'], { cwd, stripColors: true })
            .wait('Please select from one of the categories below')
            .send(__1.KEY_DOWN_ARROW)
            .sendCarriageReturn()
            .wait('What would you like to convert?')
            .sendCarriageReturn()
            .wait('Provide a friendly name for your resource')
            .sendLine(`${resourceName}\r`)
            .wait('What is the source language?')
            .sendCarriageReturn()
            .wait('What is the target language?')
            .sendCarriageReturn()
            .wait('Who should have access?')
            .send(__1.KEY_DOWN_ARROW)
            .sendCarriageReturn()
            .sendEof()
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.addConvert = addConvert;
// add identify test
const addIdentifyCollection = (cwd) => __awaiter(void 0, void 0, void 0, function* () {
    const resourceName = 'identifyCollectionTest1';
    return (0, __1.nspawn)((0, __1.getCLIPath)(), ['predictions', 'add'], { cwd, stripColors: true })
        .wait('Please select from one of the categories below')
        .sendCarriageReturn()
        .wait('What would you like to identify?')
        .sendKeyDown()
        .sendCarriageReturn()
        .wait('Provide a friendly name for your resource')
        .sendLine(`${resourceName}\r`)
        .wait('Would you like to use the default configuration?')
        .sendKeyDown()
        .sendCarriageReturn()
        .wait('Would you like to enable celebrity detection?')
        .sendYes()
        .wait('Would you like to identify entities from a collection of images?')
        .sendYes()
        .wait('How many entities would you like to identify?')
        .sendCarriageReturn()
        .wait('Would you like to allow users to add images to this collection?')
        .sendCarriageReturn()
        .wait('Who should have access?')
        .sendKeyDown()
        .sendCarriageReturn()
        .wait('The CLI would be provisioning an S3 bucket')
        .sendCarriageReturn()
        .sendEof()
        .runAsync();
});
exports.addIdentifyCollection = addIdentifyCollection;
// add interpret resource
function addInterpret(cwd) {
    const resourceName = 'interpretTest1';
    return (0, __1.nspawn)((0, __1.getCLIPath)(), ['add', 'predictions'], { cwd, stripColors: true })
        .wait('Please select from one of the categories below')
        .sendKeyDown(2)
        .sendCarriageReturn()
        .wait('Provide a friendly name for your resource')
        .sendLine(`${resourceName}\r`)
        .wait('What kind of interpretation would you like?')
        .sendLine('All')
        .wait('Who should have access?')
        .sendKeyDown()
        .sendCarriageReturn()
        .runAsync();
}
exports.addInterpret = addInterpret;
//# sourceMappingURL=predictions.js.map