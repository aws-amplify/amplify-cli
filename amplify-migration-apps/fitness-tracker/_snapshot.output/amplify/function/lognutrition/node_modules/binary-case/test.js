/**
 *  @license
 *    Copyright 2016 Brigham Young University
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
const binaryCase    = require('./index');
const test          = require('tape');

test('binary-case', function(t) {
    const noOverflow = { allowOverflow: false };
    
    t.equal(binaryCase('abc', 0), 'abc', 'no change');
    t.equal(binaryCase('abc', 1), 'Abc', 'first char');
    t.equal(binaryCase('abc', 2), 'aBc', 'second char');
    t.equal(binaryCase('abc', 3), 'ABc', 'first and second char');
    t.equal(binaryCase('abc', 4), 'abC', 'third char');
    t.equal(binaryCase('abc', 5), 'AbC', 'first and third char');
    t.equal(binaryCase('abc', 6), 'aBC', 'second and third char');
    t.equal(binaryCase('abc', 7), 'ABC', 'all chars');
    t.equal(binaryCase('abc', 8), binaryCase('abc', 0), 'duplicate');
    t.equal(binaryCase('abc', 8, noOverflow), false, 'unable to modify');

    t.equal(binaryCase('a-bc', 0), 'a-bc', 'no change');
    t.equal(binaryCase('a-bc', 1), 'A-bc', 'first char');
    t.equal(binaryCase('a-bc', 2), 'a-Bc', 'second char');
    t.equal(binaryCase('a-bc', 3), 'A-Bc', 'first and second char');
    t.equal(binaryCase('a-bc', 4), 'a-bC', 'third char');
    t.equal(binaryCase('a-bc', 5), 'A-bC', 'first and third char');
    t.equal(binaryCase('a-bc', 6), 'a-BC', 'second and third char');
    t.equal(binaryCase('a-bc', 7), 'A-BC', 'all chars');
    t.equal(binaryCase('a-bc', 8), binaryCase('a-bc', 0), 'duplicate');
    t.equal(binaryCase('a-bc', 8, noOverflow), false, 'unable to modify');

    t.equal(binaryCase('a bc', 0), 'a bc', 'no change');
    t.equal(binaryCase('a bc', 1), 'A bc', 'first char');
    t.equal(binaryCase('a bc', 2), 'a Bc', 'second char');
    t.equal(binaryCase('a bc', 3), 'A Bc', 'first and second char');
    t.equal(binaryCase('a bc', 4), 'a bC', 'third char');
    t.equal(binaryCase('a bc', 5), 'A bC', 'first and third char');
    t.equal(binaryCase('a bc', 6), 'a BC', 'second and third char');
    t.equal(binaryCase('a bc', 7), 'A BC', 'all chars');
    t.equal(binaryCase('a bc', 8), binaryCase('a bc', 0), 'duplicate');
    t.equal(binaryCase('a bc', 8, noOverflow), false, 'unable to modify');

    t.equal(binaryCase('a 123bc', 0), 'a 123bc', 'no change');
    t.equal(binaryCase('a 123bc', 1), 'A 123bc', 'first char');
    t.equal(binaryCase('a 123bc', 2), 'a 123Bc', 'second char');
    t.equal(binaryCase('a 123bc', 3), 'A 123Bc', 'first and second char');
    t.equal(binaryCase('a 123bc', 4), 'a 123bC', 'third char');
    t.equal(binaryCase('a 123bc', 5), 'A 123bC', 'first and third char');
    t.equal(binaryCase('a 123bc', 6), 'a 123BC', 'second and third char');
    t.equal(binaryCase('a 123bc', 7), 'A 123BC', 'all chars');
    t.equal(binaryCase('a 123bc', 8), binaryCase('a 123bc', 0), 'duplicate');
    t.equal(binaryCase('a 123bc', 8, noOverflow), false, 'unable to modify');

    t.equal(binaryCase('A 123BC', 0), 'A 123BC', 'no change');
    t.equal(binaryCase('A 123BC', 1), 'a 123BC', 'first char');
    t.equal(binaryCase('A 123BC', 2), 'A 123bC', 'second char');
    t.equal(binaryCase('A 123BC', 3), 'a 123bC', 'first and second char');
    t.equal(binaryCase('A 123BC', 4), 'A 123Bc', 'third char');
    t.equal(binaryCase('A 123BC', 5), 'a 123Bc', 'first and third char');
    t.equal(binaryCase('A 123BC', 6), 'A 123bc', 'second and third char');
    t.equal(binaryCase('A 123BC', 7), 'a 123bc', 'all chars');
    t.equal(binaryCase('A 123BC', 8), binaryCase('A 123BC', 0), 'duplicate');
    t.equal(binaryCase('A 123BC', 8, noOverflow), false, 'unable to modify');

    t.equal(binaryCase('Abc', 1), 'abc', 'toggle case');
    
    t.equal(binaryCase.maxNumber('abc'), 7, 'max number');
    t.equal(binaryCase.maxNumber('a-bc'), 7, 'max number dash');
    t.equal(binaryCase.maxNumber('a bc'), 7, 'max number space');
    t.equal(binaryCase.maxNumber('a 123bc'), 7, 'max number space and numbers');

    const iterator = binaryCase.iterator('abc');
    const first = iterator.next();
    t.equal(first.value, 'abc', 'no change');
    t.equal(first.done, false, 'not done');
    t.equal(iterator.next().value, 'Abc', 'first char');
    t.equal(iterator.next().value, 'aBc', 'second char');
    t.equal(iterator.next().value, 'ABc', 'first and second char');
    t.equal(iterator.next().value, 'abC', 'third char');
    t.equal(iterator.next().value, 'AbC', 'first and third char');
    t.equal(iterator.next().value, 'aBC', 'second and third char');
    const last = iterator.next();
    t.equal(last.value, 'ABC', 'all chars');
    t.equal(last.done, false, 'is not done');
    t.equal(iterator.next().done, true, 'done');
    t.equal(iterator.next().done, true, 'still done');

    const iterator2 = binaryCase.iterator('abc', { startIndex: 3 });
    t.equal(iterator2.next().value, 'ABc', 'start at index');

    t.throws(function() { binaryCase.iterator('abc', { startIndex: -1 })}, Error, 'Negative start index');
    t.throws(function() { binaryCase.iterator('abc', { startIndex: 'Hello' })}, Error, 'Start index not a string');
    t.throws(function() { binaryCase.iterator('abc', { startIndex: 1.2 })}, Error, 'Start index not an integer');

    const variations = binaryCase.variations('abc');
    t.equal(variations.length, 8, 'number of variations');
    t.equal(variations[0], 'abc', 'no change');
    t.equal(variations[1], 'Abc', 'first char');
    t.equal(variations[2], 'aBc', 'second char');
    t.equal(variations[3], 'ABc', 'first and second char');
    t.equal(variations[4], 'abC', 'third char');
    t.equal(variations[5], 'AbC', 'first and third char');
    t.equal(variations[6], 'aBC', 'second and third char');
    t.equal(variations[7], 'ABC', 'all chars');
    
    t.end();
});