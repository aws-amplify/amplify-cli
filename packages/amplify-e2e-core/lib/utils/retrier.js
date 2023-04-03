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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.retry = void 0;
const lodash_1 = __importDefault(require("lodash"));
const sleep_1 = require("./sleep");
const defaultSettings = {
    times: Infinity,
    delayMS: 1000 * 10,
    timeoutMS: 1000 * 60 * 20,
    stopOnError: true, // terminate the retries if a func calls throws an exception
};
/**
 * Retries the function func until the predicate pred returns true, or until one of the retry limits is met.
 * @param func The function to retry
 * @param successPredicate The predicate that determines successful output of func
 * @param settings Retry limits (defaults to defaultSettings above)
 * @param failurePredicate An optional predicate that determines that the retry operation has failed and should not be retried anymore
 */
const retry = (func, successPredicate, settings, failurePredicate) => __awaiter(void 0, void 0, void 0, function* () {
    const { times, delayMS, timeoutMS, stopOnError } = lodash_1.default.merge({}, defaultSettings, settings);
    let count = 0;
    let result;
    let terminate = false;
    const startTime = Date.now();
    do {
        try {
            result = yield func();
            if (successPredicate(result)) {
                return result;
            }
            if (typeof failurePredicate === 'function' && failurePredicate(result)) {
                throw new Error('Retry-able function execution result matched failure predicate. Stopping retries.');
            }
            console.warn(`Retry-able function execution did not match success predicate. Result was [${JSON.stringify(result)}]. Retrying...`);
        }
        catch (err) {
            console.warn(`Retry-able function execution failed with [${err.message || err}]`);
            if (stopOnError) {
                console.log('Stopping retries on error.');
            }
            else {
                console.log('Retrying...');
            }
            terminate = stopOnError;
        }
        count++;
        yield (0, sleep_1.sleep)(delayMS);
    } while (!terminate && count <= times && Date.now() - startTime < timeoutMS);
    throw new Error('Retry-able function did not match predicate within the given retry constraints');
});
exports.retry = retry;
//# sourceMappingURL=retrier.js.map