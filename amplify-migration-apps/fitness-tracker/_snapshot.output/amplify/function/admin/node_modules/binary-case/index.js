/**
 *  @license
 *    Copyright 2018 Brigham Young University
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 **/
'use strict';

/**
 * Toggle the case of a string based on the number value passed in.
 * @param {string} string
 * @param {number} number
 * @param {object} [options={allowOverflow: true}]
 * @returns {string|boolean}
 */
module.exports = binaryCase;

function binaryCase(string, number, options) {
    if (!options || typeof options !== 'object') options = {};
    if (!options.hasOwnProperty('allowOverflow')) options.allowOverflow = true;

    if (number > binaryCase.maxNumber(string) && !options.allowOverflow) return false;

    return getBinaryCase(string, number);
}

binaryCase.iterator = function(string, options) {
    const max = binaryCase.maxNumber(string);

    if (!options || typeof options !== 'object') options = {};
    if (!options.hasOwnProperty('startIndex')) options.startIndex = 0;
    if (typeof options.startIndex !== 'number' || !Number.isInteger(options.startIndex) || options.startIndex < 0) throw Error('Option startIndex must be a non-negative integer.');

    let index = options.startIndex;
    return {
        next: function() {
            return index > max
                ? { done: true }
                : { done: false, value: getBinaryCase(string, index++) };
        }
    };
};

/**
 * Get the maximum number that can be used before causing overflow.
 * @param {string} string
 * @returns {number}
 */
binaryCase.maxNumber = function(string) {
    const pow = string.match(/[a-z]/ig).length;
    return Math.pow(2, pow) - 1;
};

/**
 * Get an array of all possible variations.
 * @param {string} string
 * @returns {string[]}
 */
binaryCase.variations = function(string) {
    const results = [];
    const max = binaryCase.maxNumber(string);
    for (let i = 0; i <= max; i++) {
        results.push(binaryCase(string, i));
    }
    return results;
};

/**
 * A performance improved method for acquiring the binary case, provided by Blake Embrey with very minor modification by James Speirs.
 * @author Blake Embrey | https://github.com/blakeembrey
 * @author James Speirs | https://github.com/gi60s
 * @param {string} str
 * @param {number} val
 * @returns {string}
 */
function getBinaryCase (str, val) {
    let res = '';

    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);

        if (code >= 65 && code <= 90) {
            res += val & 1 ? String.fromCharCode(code + 32) : String.fromCharCode(code);
            val >>>= 1;
        } else if (code >= 97 && code <= 122) {
            res += val & 1 ? String.fromCharCode(code - 32) : String.fromCharCode(code);
            val >>>= 1;
        } else {
            res += String.fromCharCode(code);
        }

        if (val === 0) {
            return res + str.substr(i + 1);
        }
    }

    return res;
}