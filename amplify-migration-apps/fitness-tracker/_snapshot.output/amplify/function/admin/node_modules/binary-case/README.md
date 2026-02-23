[![NPM version](https://img.shields.io/npm/v/binary-case.svg?style=flat)](https://npmjs.org/package/binary-case)
[![NPM downloads](https://img.shields.io/npm/dm/binary-case.svg?style=flat)](https://npmjs.org/package/binary-case)
[![Build status](https://img.shields.io/travis/Gi60s/binary-case.svg?style=flat)](https://travis-ci.org/Gi60s/binary-case)
[![Test coverage](https://img.shields.io/coveralls/Gi60s/binary-case.svg?style=flat)](https://coveralls.io/r/Gi60s/binary-case?branch=master)

# binary-case

Take a string and a number and perform binary case switching on alpha characters.

## Example

```js
const binaryCase = require('binary-case');

// 3 in binary = 011
const number = 3;

// 011 reversed to 110 so the first 2 characters will toggle case
const value = binaryCase('abc', 3);     // value: "ABc"
```

## Installation

```sh
$ npm install binary-case
```

## API

### binaryCase ( string, number [, options ] ) : string | boolean

Take a string and a number and perform binary case switching on alpha characters.

**Parameters**

- *string* - The string value to toggle alpha character cases on.

- *number* - A number that will be converted to binary to determine case switching.

- *options* - An optional object that defines options for the function.

    - *allowOverflow* - Defaults to `true`. Set to `false` to have the `binaryCase` function return `false` when the number provided creates a binary string that is larger than the number of alpha characters in the string provided to be converted. Overflow will cause case switching sequences to repeat.

        ```js
        binaryCase('abc', 0);                               // 'abc'
        binaryCase('abc', 8);                               // 'abc'
        binaryCase('abc', 8, { allowOverflow: false });     // false
        ```

**Returns** a string if successful or `false` on failure.

### binaryCase.iterator ( string [, options ] ) : object

Get an iterator object that will allow iteration through all variations of the string's casing.

**Parameters**

- *string* - The string to produce case variations for.

- *options* - An optional object that defines options for the iterator.

    - *startIndex* - The number to start with for producing variations. This will reduce the total number of possible variations.

**Returns** an object with a *next* property.

**Example**

```js
const iterator = binaryCase.iterator('abc');
iterator.next().value;  // 'abc'
iterator.next().value;  // 'Abc'
iterator.next().value;  // 'aBc'
iterator.next().value;  // 'ABc'
```

### binaryCase.maxNumber ( string ) : number

Determine the maximum number that can be used before causing repeating case variations.

**Parameters**

- *string* - The string value to count the number of possible case variations on.

**Returns** a number.

This calculation is simple:

1. Determine how many alpha characters exist in the string (a through z and A through Z)
2. The result is 2 to the power of the number of alpha characters, minus 1.

For example: `abc` has 3 alpha characters. `2^3 - 1 = 7`

### binaryCase.variations ( string ) : string[]

Get an array of all possible case variations.

**Parameters**

- *string* - The string value to get case variations for.

**Returns** an array of  strings.