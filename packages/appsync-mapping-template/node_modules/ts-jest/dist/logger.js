"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var logs = [];
var logsFlushed = false;
var outputToConsole = false;
function shouldLog() {
    return (process.env.TS_JEST_DEBUG || outputToConsole) && !logsFlushed;
}
function logOnce() {
    var thingsToLog = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        thingsToLog[_i] = arguments[_i];
    }
    if (!shouldLog()) {
        return;
    }
    logs.push(thingsToLog);
}
exports.logOnce = logOnce;
function flushLogs() {
    if (!shouldLog()) {
        return;
    }
    logsFlushed = true;
    var rootPath = path.resolve(__dirname, '../');
    var JSONifiedLogs = logs.map(convertToJSONIfPossible);
    var logString = JSONifiedLogs.join('\n');
    var filePath = path.resolve(rootPath, 'debug.txt');
    if (outputToConsole) {
        console.log(logString);
    }
    else {
        fs.writeFileSync(filePath, logString);
    }
}
exports.flushLogs = flushLogs;
function convertToJSONIfPossible(object) {
    try {
        return JSON.stringify(object, null, 2);
    }
    catch (_a) {
        return object.toString();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xvZ2dlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHVCQUF5QjtBQUN6QiwyQkFBNkI7QUFRN0IsSUFBTSxJQUFJLEdBQVUsRUFBRSxDQUFDO0FBQ3ZCLElBQUksV0FBVyxHQUFZLEtBQUssQ0FBQztBQUVqQyxJQUFNLGVBQWUsR0FBWSxLQUFLLENBQUM7QUFFdkM7SUFFRSxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7QUFDeEUsQ0FBQztBQUdEO0lBQXdCLHFCQUFxQjtTQUFyQixVQUFxQixFQUFyQixxQkFBcUIsRUFBckIsSUFBcUI7UUFBckIsZ0NBQXFCOztJQUMzQyxJQUFJLENBQUMsU0FBUyxFQUFFLEVBQUU7UUFDaEIsT0FBTztLQUNSO0lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUN6QixDQUFDO0FBTEQsMEJBS0M7QUFHRDtJQUNFLElBQUksQ0FBQyxTQUFTLEVBQUUsRUFBRTtRQUNoQixPQUFPO0tBQ1I7SUFDRCxXQUFXLEdBQUcsSUFBSSxDQUFDO0lBQ25CLElBQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2hELElBQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUMsQ0FBQztJQUN4RCxJQUFNLFNBQVMsR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzNDLElBQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQ3JELElBQUksZUFBZSxFQUFFO1FBRW5CLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDeEI7U0FBTTtRQUNMLEVBQUUsQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0tBQ3ZDO0FBQ0gsQ0FBQztBQWZELDhCQWVDO0FBRUQsaUNBQWlDLE1BQVc7SUFDMUMsSUFBSTtRQUNGLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ3hDO0lBQUMsV0FBTTtRQUNOLE9BQU8sTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO0tBQzFCO0FBQ0gsQ0FBQyJ9