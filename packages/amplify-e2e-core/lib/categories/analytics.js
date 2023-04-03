"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeAnalytics = exports.addKinesis = exports.addPinpoint = void 0;
const __1 = require("..");
function addPinpoint(cwd, settings) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['add', 'analytics'], { cwd, stripColors: true })
            .wait('Select an Analytics provider')
            .sendCarriageReturn()
            .wait('Provide your pinpoint resource name:')
            .sendLine(settings.wrongName)
            .wait('Resource name must be alphanumeric')
            .send('\b')
            .delay(1000) // Some delay required for autocomplete and terminal to catch up
            .sendLine(settings.rightName)
            .wait('Apps need authorization to send analytics events. Do you want to allow guests')
            .sendConfirmNo()
            .wait(`Successfully added resource ${settings.rightName} locally`)
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
exports.addPinpoint = addPinpoint;
function addKinesis(cwd, settings) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['add', 'analytics'], { cwd, stripColors: true })
            .wait('Select an Analytics provider')
            .send(__1.KEY_DOWN_ARROW)
            .sendCarriageReturn()
            .wait('Enter a Stream name')
            .sendLine(settings.wrongName)
            .wait('Name is invalid. Has to be non-empty and alphanumeric')
            .send('\b')
            .delay(1000) // Some delay required for autocomplete and terminal to catch up
            .sendLine(settings.rightName)
            .wait('Enter number of shards')
            .sendCarriageReturn()
            .wait('Apps need authorization to send analytics events. Do you want to allow guests')
            .sendConfirmNo()
            .wait(`Successfully added resource ${settings.rightName} locally`)
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
exports.addKinesis = addKinesis;
function removeAnalytics(cwd) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['remove', 'analytics'], { cwd, stripColors: true })
            .wait('Choose the resource you would want to remove')
            .send('j')
            .sendCarriageReturn()
            .wait('Are you sure you want to delete the resource?')
            .send('y')
            .sendCarriageReturn()
            .wait('Successfully removed resource')
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
exports.removeAnalytics = removeAnalytics;
//# sourceMappingURL=analytics.js.map