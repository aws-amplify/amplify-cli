# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.17.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-appsync-simulator@1.14.0...amplify-appsync-simulator@1.17.0) (2020-03-07)


### Bug Fixes

* Bubbling error up to Graphiql from Lambda ([#3231](https://github.com/aws-amplify/amplify-cli/issues/3231)) ([12345da](https://github.com/aws-amplify/amplify-cli/commit/12345da3e99990d6f9994917667c30da0b0b2f2e))


### Features

* **amplify-appsync-simulator:** add support for IAM authorization ([#3476](https://github.com/aws-amplify/amplify-cli/issues/3476)) ([511dfc2](https://github.com/aws-amplify/amplify-cli/commit/511dfc29dd6787ecd035ac3fe79801cd7538b1d3))





## [1.15.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-appsync-simulator@1.14.2-beta.0...amplify-appsync-simulator@1.15.1) (2020-03-05)

**Note:** Version bump only for package amplify-appsync-simulator





# [1.14.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-appsync-simulator@1.13.3...amplify-appsync-simulator@1.14.0) (2020-02-18)


### Bug Fixes

* **amplify-appsync-simulator:** forward stash to responseMappingTemplate ([#3387](https://github.com/aws-amplify/amplify-cli/issues/3387)) ([5528760](https://github.com/aws-amplify/amplify-cli/commit/55287607a2d97936420b9725cd2108d92ed35b61))
* regression in graphiql-explorer build ([#3453](https://github.com/aws-amplify/amplify-cli/issues/3453)) ([98c905e](https://github.com/aws-amplify/amplify-cli/commit/98c905edfdf52495224d2af3a934faeaab8b310a))


### Features

* **amplify-appsync-simulator:** implement missing string methods([#3389](https://github.com/aws-amplify/amplify-cli/issues/3389)) ([#3398](https://github.com/aws-amplify/amplify-cli/issues/3398)) ([a7ad64c](https://github.com/aws-amplify/amplify-cli/commit/a7ad64c519dff1e1977f3fca48f0adea4586aeb8))





## [1.13.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-appsync-simulator@1.13.2...amplify-appsync-simulator@1.13.3) (2020-02-13)

**Note:** Version bump only for package amplify-appsync-simulator





## [1.13.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-appsync-simulator@1.13.1...amplify-appsync-simulator@1.13.2) (2020-02-07)


### Bug Fixes

* falsy values can be returned in mock now ([#3254](https://github.com/aws-amplify/amplify-cli/issues/3254)) ([6795e78](https://github.com/aws-amplify/amplify-cli/commit/6795e783c104004a2b2576f6903b35c1c6d2ed03)), closes [#2566](https://github.com/aws-amplify/amplify-cli/issues/2566)
* **amplify-appsync-simulator:** fixes [#3202](https://github.com/aws-amplify/amplify-cli/issues/3202) filter error.data ([1d01fb3](https://github.com/aws-amplify/amplify-cli/commit/1d01fb3ca26924c96a7964fa871edce9649016d7))





## [1.13.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-appsync-simulator@1.13.0...amplify-appsync-simulator@1.13.1) (2020-01-24)

**Note:** Version bump only for package amplify-appsync-simulator





# [1.13.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-appsync-simulator@0.23.0...amplify-appsync-simulator@1.13.0) (2020-01-23)

### Bug Fixes

- **amplify-appsync-simulator:** add js-string-escape to package.json ([#2864](https://github.com/aws-amplify/amplify-cli/issues/2864)) ([2da430b](https://github.com/aws-amplify/amplify-cli/commit/2da430b5c827b0f9f4af4fe5611528f8839703bb))
- upgrade to node10 as min version for CLI ([#3128](https://github.com/aws-amplify/amplify-cli/issues/3128)) ([a0b18e0](https://github.com/aws-amplify/amplify-cli/commit/a0b18e0187a26b4ab0e6e986b0277f347e829444))
- **amplify-appsync-simulator:** make resolver result parsing strict ([#3224](https://github.com/aws-amplify/amplify-cli/issues/3224)) ([77bec1d](https://github.com/aws-amplify/amplify-cli/commit/77bec1df49a32f030e9e5a06651003409da00eb9)), closes [#3180](https://github.com/aws-amplify/amplify-cli/issues/3180)
- **amplify-appsync-simulator:** normalize resolver path in windows ([#3117](https://github.com/aws-amplify/amplify-cli/issues/3117)) ([87c4ad5](https://github.com/aws-amplify/amplify-cli/commit/87c4ad59a701995220946ad35f1491f0d4b57325)), closes [#1997](https://github.com/aws-amplify/amplify-cli/issues/1997)
- **amplify-appsync-simulator:** set max payload size for request ([#3132](https://github.com/aws-amplify/amplify-cli/issues/3132)) ([33fc925](https://github.com/aws-amplify/amplify-cli/commit/33fc92578a9124a4d1b669039dc09dc737bd36c8)), closes [#3086](https://github.com/aws-amplify/amplify-cli/issues/3086)
- **amplify-appsync-simulator:** support early return from resolvers ([#2497](https://github.com/aws-amplify/amplify-cli/issues/2497)) ([0cff7ed](https://github.com/aws-amplify/amplify-cli/commit/0cff7ed09bfaf797baad2acd1c0a6d013cb717e8)), closes [#2427](https://github.com/aws-amplify/amplify-cli/issues/2427)

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- add the length support for strings in mock ([#2823](https://github.com/aws-amplify/amplify-cli/issues/2823)) ([c366246](https://github.com/aws-amplify/amplify-cli/commit/c3662463b97d387968cd2ad60c94e3e27b97ea7c))

# [1.12.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-appsync-simulator@0.23.0...amplify-appsync-simulator@1.12.0) (2020-01-09)

### Bug Fixes

- **amplify-appsync-simulator:** add js-string-escape to package.json ([#2864](https://github.com/aws-amplify/amplify-cli/issues/2864)) ([2da430b](https://github.com/aws-amplify/amplify-cli/commit/2da430b5c827b0f9f4af4fe5611528f8839703bb))
- **amplify-appsync-simulator:** normalize resolver path in windows ([#3117](https://github.com/aws-amplify/amplify-cli/issues/3117)) ([87c4ad5](https://github.com/aws-amplify/amplify-cli/commit/87c4ad59a701995220946ad35f1491f0d4b57325)), closes [#1997](https://github.com/aws-amplify/amplify-cli/issues/1997)
- upgrade to node10 as min version for CLI ([#3128](https://github.com/aws-amplify/amplify-cli/issues/3128)) ([a0b18e0](https://github.com/aws-amplify/amplify-cli/commit/a0b18e0187a26b4ab0e6e986b0277f347e829444))
- **amplify-appsync-simulator:** set max payload size for request ([#3132](https://github.com/aws-amplify/amplify-cli/issues/3132)) ([33fc925](https://github.com/aws-amplify/amplify-cli/commit/33fc92578a9124a4d1b669039dc09dc737bd36c8)), closes [#3086](https://github.com/aws-amplify/amplify-cli/issues/3086)

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- add the length support for strings in mock ([#2823](https://github.com/aws-amplify/amplify-cli/issues/2823)) ([c366246](https://github.com/aws-amplify/amplify-cli/commit/c3662463b97d387968cd2ad60c94e3e27b97ea7c))

# [1.11.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-appsync-simulator@0.23.0...amplify-appsync-simulator@1.11.0) (2019-12-31)

### Bug Fixes

- **amplify-appsync-simulator:** add js-string-escape to package.json ([#2864](https://github.com/aws-amplify/amplify-cli/issues/2864)) ([2da430b](https://github.com/aws-amplify/amplify-cli/commit/2da430b5c827b0f9f4af4fe5611528f8839703bb))

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- add the length support for strings in mock ([#2823](https://github.com/aws-amplify/amplify-cli/issues/2823)) ([c366246](https://github.com/aws-amplify/amplify-cli/commit/c3662463b97d387968cd2ad60c94e3e27b97ea7c))

# [1.10.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-appsync-simulator@0.23.0...amplify-appsync-simulator@1.10.0) (2019-12-28)

### Bug Fixes

- **amplify-appsync-simulator:** add js-string-escape to package.json ([#2864](https://github.com/aws-amplify/amplify-cli/issues/2864)) ([2da430b](https://github.com/aws-amplify/amplify-cli/commit/2da430b5c827b0f9f4af4fe5611528f8839703bb))

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- add the length support for strings in mock ([#2823](https://github.com/aws-amplify/amplify-cli/issues/2823)) ([c366246](https://github.com/aws-amplify/amplify-cli/commit/c3662463b97d387968cd2ad60c94e3e27b97ea7c))

# [1.9.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-appsync-simulator@0.23.0...amplify-appsync-simulator@1.9.0) (2019-12-26)

### Bug Fixes

- **amplify-appsync-simulator:** add js-string-escape to package.json ([#2864](https://github.com/aws-amplify/amplify-cli/issues/2864)) ([2da430b](https://github.com/aws-amplify/amplify-cli/commit/2da430b5c827b0f9f4af4fe5611528f8839703bb))

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- add the length support for strings in mock ([#2823](https://github.com/aws-amplify/amplify-cli/issues/2823)) ([c366246](https://github.com/aws-amplify/amplify-cli/commit/c3662463b97d387968cd2ad60c94e3e27b97ea7c))

# [1.8.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-appsync-simulator@0.23.0...amplify-appsync-simulator@1.8.0) (2019-12-25)

### Bug Fixes

- **amplify-appsync-simulator:** add js-string-escape to package.json ([#2864](https://github.com/aws-amplify/amplify-cli/issues/2864)) ([2da430b](https://github.com/aws-amplify/amplify-cli/commit/2da430b5c827b0f9f4af4fe5611528f8839703bb))

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- add the length support for strings in mock ([#2823](https://github.com/aws-amplify/amplify-cli/issues/2823)) ([c366246](https://github.com/aws-amplify/amplify-cli/commit/c3662463b97d387968cd2ad60c94e3e27b97ea7c))

# [1.7.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-appsync-simulator@0.23.0...amplify-appsync-simulator@1.7.0) (2019-12-20)

### Bug Fixes

- **amplify-appsync-simulator:** add js-string-escape to package.json ([#2864](https://github.com/aws-amplify/amplify-cli/issues/2864)) ([2da430b](https://github.com/aws-amplify/amplify-cli/commit/2da430b5c827b0f9f4af4fe5611528f8839703bb))

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- add the length support for strings in mock ([#2823](https://github.com/aws-amplify/amplify-cli/issues/2823)) ([c366246](https://github.com/aws-amplify/amplify-cli/commit/c3662463b97d387968cd2ad60c94e3e27b97ea7c))

# [1.6.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-appsync-simulator@0.23.0...amplify-appsync-simulator@1.6.0) (2019-12-10)

### Bug Fixes

- **amplify-appsync-simulator:** add js-string-escape to package.json ([#2864](https://github.com/aws-amplify/amplify-cli/issues/2864)) ([2da430b](https://github.com/aws-amplify/amplify-cli/commit/2da430b5c827b0f9f4af4fe5611528f8839703bb))

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- add the length support for strings in mock ([#2823](https://github.com/aws-amplify/amplify-cli/issues/2823)) ([c366246](https://github.com/aws-amplify/amplify-cli/commit/c3662463b97d387968cd2ad60c94e3e27b97ea7c))

# [1.4.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-appsync-simulator@0.23.0...amplify-appsync-simulator@1.4.0) (2019-12-03)

### Bug Fixes

- **amplify-appsync-simulator:** add js-string-escape to package.json ([#2864](https://github.com/aws-amplify/amplify-cli/issues/2864)) ([2da430b](https://github.com/aws-amplify/amplify-cli/commit/2da430b5c827b0f9f4af4fe5611528f8839703bb))

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- add the length support for strings in mock ([#2823](https://github.com/aws-amplify/amplify-cli/issues/2823)) ([c366246](https://github.com/aws-amplify/amplify-cli/commit/c3662463b97d387968cd2ad60c94e3e27b97ea7c))

# [1.3.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-appsync-simulator@0.23.0...amplify-appsync-simulator@1.3.0) (2019-12-01)

### Bug Fixes

- **amplify-appsync-simulator:** add js-string-escape to package.json ([#2864](https://github.com/aws-amplify/amplify-cli/issues/2864)) ([2da430b](https://github.com/aws-amplify/amplify-cli/commit/2da430b5c827b0f9f4af4fe5611528f8839703bb))

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- add the length support for strings in mock ([#2823](https://github.com/aws-amplify/amplify-cli/issues/2823)) ([c366246](https://github.com/aws-amplify/amplify-cli/commit/c3662463b97d387968cd2ad60c94e3e27b97ea7c))

# [1.2.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-appsync-simulator@0.23.0...amplify-appsync-simulator@1.2.0) (2019-11-27)

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- add the length support for strings in mock ([#2823](https://github.com/aws-amplify/amplify-cli/issues/2823)) ([c366246](https://github.com/aws-amplify/amplify-cli/commit/c3662463b97d387968cd2ad60c94e3e27b97ea7c))

# [1.1.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-appsync-simulator@0.23.0...amplify-appsync-simulator@1.1.0) (2019-11-27)

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- add the length support for strings in mock ([#2823](https://github.com/aws-amplify/amplify-cli/issues/2823)) ([c366246](https://github.com/aws-amplify/amplify-cli/commit/c3662463b97d387968cd2ad60c94e3e27b97ea7c))

# 0.5.0 (2019-08-30)

### Bug Fixes

- [#2032](https://github.com/aws-amplify/amplify-cli/issues/2032) - add AWSTimestamp and AWSIPAddress types to mock ([#2116](https://github.com/aws-amplify/amplify-cli/issues/2116)) ([77e2e69](https://github.com/aws-amplify/amplify-cli/commit/77e2e69))
- local mock fix ([#1982](https://github.com/aws-amplify/amplify-cli/issues/1982)) ([8ee9029](https://github.com/aws-amplify/amplify-cli/commit/8ee9029))

### Features

- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))

# 0.4.0 (2019-08-28)

### Bug Fixes

- [#2032](https://github.com/aws-amplify/amplify-cli/issues/2032) - add AWSTimestamp and AWSIPAddress types to mock ([#2116](https://github.com/aws-amplify/amplify-cli/issues/2116)) ([77e2e69](https://github.com/aws-amplify/amplify-cli/commit/77e2e69))
- local mock fix ([#1982](https://github.com/aws-amplify/amplify-cli/issues/1982)) ([8ee9029](https://github.com/aws-amplify/amplify-cli/commit/8ee9029))

### Features

- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))

# 0.3.0 (2019-08-13)

### Bug Fixes

- local mock fix ([#1982](https://github.com/aws-amplify/amplify-cli/issues/1982)) ([8ee9029](https://github.com/aws-amplify/amplify-cli/commit/8ee9029))

### Features

- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))

# 0.2.0 (2019-08-07)

### Bug Fixes

- local mock fix ([#1982](https://github.com/aws-amplify/amplify-cli/issues/1982)) ([8ee9029](https://github.com/aws-amplify/amplify-cli/commit/8ee9029))

### Features

- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
