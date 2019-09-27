# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.0.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.8.4...@aws-amplify/cli@3.0.0) (2019-08-30)


* Adding Auth on Subscriptions (#2068) ([81c630d](https://github.com/aws-amplify/amplify-cli/commit/81c630d)), closes [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068)


### Bug Fixes

* **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad8))
* [#1056](https://github.com/aws-amplify/amplify-cli/issues/1056), dedup environment file reading ([#2088](https://github.com/aws-amplify/amplify-cli/issues/2088)) ([940deaa](https://github.com/aws-amplify/amplify-cli/commit/940deaa))
* [#429](https://github.com/aws-amplify/amplify-cli/issues/429) - Editor hanging bug ([#2086](https://github.com/aws-amplify/amplify-cli/issues/2086)) ([6767445](https://github.com/aws-amplify/amplify-cli/commit/6767445))
* fixing force push on init of new env ([#1949](https://github.com/aws-amplify/amplify-cli/issues/1949)) ([d4d0c97](https://github.com/aws-amplify/amplify-cli/commit/d4d0c97)), closes [#1945](https://github.com/aws-amplify/amplify-cli/issues/1945)
* local mock fix ([#1982](https://github.com/aws-amplify/amplify-cli/issues/1982)) ([8ee9029](https://github.com/aws-amplify/amplify-cli/commit/8ee9029))
* move test package dependencies to devDependencies ([#2034](https://github.com/aws-amplify/amplify-cli/issues/2034)) ([f5623d0](https://github.com/aws-amplify/amplify-cli/commit/f5623d0))
* **cli:** fix cli crash when opening editor ([#2172](https://github.com/aws-amplify/amplify-cli/issues/2172)) ([d29f14f](https://github.com/aws-amplify/amplify-cli/commit/d29f14f))
* **cli:** prevent cli crash when default editor is missing ([#2163](https://github.com/aws-amplify/amplify-cli/issues/2163)) ([67769fb](https://github.com/aws-amplify/amplify-cli/commit/67769fb))
* **cli:** update inquirer validation function to return msg ([#2166](https://github.com/aws-amplify/amplify-cli/issues/2166)) ([b3b8c21](https://github.com/aws-amplify/amplify-cli/commit/b3b8c21)), closes [#2164](https://github.com/aws-amplify/amplify-cli/issues/2164)


### Features

* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
* mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))


### BREAKING CHANGES

* If an owner is used in the auth directive it will either be a requirement if it's
the only rule or an optional input if used with other rules
* If an owner is included in the auth directive it will either be a requirement if
it's the only rule or an optional input if used with other rules
* the subscription operations will require an argument if owner is the only auth rule
* Subscriptions will require an argument if an owner is only rule set - If owner &
group rules are owner will be an optional arg





# [2.0.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.8.4...@aws-amplify/cli@2.0.0) (2019-08-28)


### Bug Fixes

* **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad8))
* [#1056](https://github.com/aws-amplify/amplify-cli/issues/1056), dedup environment file reading ([#2088](https://github.com/aws-amplify/amplify-cli/issues/2088)) ([940deaa](https://github.com/aws-amplify/amplify-cli/commit/940deaa))
* [#429](https://github.com/aws-amplify/amplify-cli/issues/429) - Editor hanging bug ([#2086](https://github.com/aws-amplify/amplify-cli/issues/2086)) ([6767445](https://github.com/aws-amplify/amplify-cli/commit/6767445))
* fixing force push on init of new env ([#1949](https://github.com/aws-amplify/amplify-cli/issues/1949)) ([d4d0c97](https://github.com/aws-amplify/amplify-cli/commit/d4d0c97)), closes [#1945](https://github.com/aws-amplify/amplify-cli/issues/1945)
* local mock fix ([#1982](https://github.com/aws-amplify/amplify-cli/issues/1982)) ([8ee9029](https://github.com/aws-amplify/amplify-cli/commit/8ee9029))
* move test package dependencies to devDependencies ([#2034](https://github.com/aws-amplify/amplify-cli/issues/2034)) ([f5623d0](https://github.com/aws-amplify/amplify-cli/commit/f5623d0))


### Features

* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
* mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))


* Adding Auth on Subscriptions (#2068) ([81c630d](https://github.com/aws-amplify/amplify-cli/commit/81c630d)), closes [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068)


### BREAKING CHANGES

* If an owner is used in the auth directive it will either be a requirement if it's
the only rule or an optional input if used with other rules
* If an owner is included in the auth directive it will either be a requirement if
it's the only rule or an optional input if used with other rules
* the subscription operations will require an argument if owner is the only auth rule
* Subscriptions will require an argument if an owner is only rule set - If owner &
group rules are owner will be an optional arg





# [1.12.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.8.4...@aws-amplify/cli@1.12.0) (2019-08-13)


### Bug Fixes

* fixing force push on init of new env ([#1949](https://github.com/aws-amplify/amplify-cli/issues/1949)) ([d4d0c97](https://github.com/aws-amplify/amplify-cli/commit/d4d0c97)), closes [#1945](https://github.com/aws-amplify/amplify-cli/issues/1945)
* **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad8))
* local mock fix ([#1982](https://github.com/aws-amplify/amplify-cli/issues/1982)) ([8ee9029](https://github.com/aws-amplify/amplify-cli/commit/8ee9029))


### Features

* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
* mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))





# [1.11.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.8.4...@aws-amplify/cli@1.11.0) (2019-08-07)


### Bug Fixes

* fixing force push on init of new env ([#1949](https://github.com/aws-amplify/amplify-cli/issues/1949)) ([d4d0c97](https://github.com/aws-amplify/amplify-cli/commit/d4d0c97)), closes [#1945](https://github.com/aws-amplify/amplify-cli/issues/1945)
* **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad8))
* local mock fix ([#1982](https://github.com/aws-amplify/amplify-cli/issues/1982)) ([8ee9029](https://github.com/aws-amplify/amplify-cli/commit/8ee9029))


### Features

* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
* mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))





# [1.10.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.8.4...@aws-amplify/cli@1.10.0) (2019-08-02)


### Bug Fixes

* fixing force push on init of new env ([#1949](https://github.com/aws-amplify/amplify-cli/issues/1949)) ([d4d0c97](https://github.com/aws-amplify/amplify-cli/commit/d4d0c97)), closes [#1945](https://github.com/aws-amplify/amplify-cli/issues/1945)


### Features

* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))





# [1.9.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.8.4...@aws-amplify/cli@1.9.0) (2019-07-31)


### Features

* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))





## [1.8.5](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.8.4...@aws-amplify/cli@1.8.5) (2019-07-24)

**Note:** Version bump only for package @aws-amplify/cli





## [1.8.4](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.8.3...@aws-amplify/cli@1.8.4) (2019-07-24)

**Note:** Version bump only for package @aws-amplify/cli





## [1.8.3](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.8.1...@aws-amplify/cli@1.8.3) (2019-07-23)

**Note:** Version bump only for package @aws-amplify/cli





## [1.8.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.8.0...@aws-amplify/cli@1.8.1) (2019-07-10)

**Note:** Version bump only for package @aws-amplify/cli





# [1.8.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.7.8...@aws-amplify/cli@1.8.0) (2019-07-09)


### Bug Fixes

* replacing rel paths with plugin func ([71f553f](https://github.com/aws-amplify/amplify-cli/commit/71f553f))


### Features

* cognito + s3 + dyanmodb lambda trigger support ([#1783](https://github.com/aws-amplify/amplify-cli/issues/1783)) ([c6fc838](https://github.com/aws-amplify/amplify-cli/commit/c6fc838))





## [1.7.8](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.7.6...@aws-amplify/cli@1.7.8) (2019-06-30)

**Note:** Version bump only for package @aws-amplify/cli





## [1.7.6](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.7.5...@aws-amplify/cli@1.7.6) (2019-06-26)

**Note:** Version bump only for package @aws-amplify/cli





## [1.7.5](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.7.4...@aws-amplify/cli@1.7.5) (2019-06-20)


### Bug Fixes

* **cli:** fix inquirer version ([#1690](https://github.com/aws-amplify/amplify-cli/issues/1690)) ([9246032](https://github.com/aws-amplify/amplify-cli/commit/9246032)), closes [#1688](https://github.com/aws-amplify/amplify-cli/issues/1688)





## [1.7.4](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.7.3...@aws-amplify/cli@1.7.4) (2019-06-18)

**Note:** Version bump only for package @aws-amplify/cli





## [1.7.3](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.7.2...@aws-amplify/cli@1.7.3) (2019-06-12)


### Bug Fixes

* **amplify-category-interactions:** call updateMetaAfterAdd only once ([#1653](https://github.com/aws-amplify/amplify-cli/issues/1653)) ([dc28758](https://github.com/aws-amplify/amplify-cli/commit/dc28758)), closes [#1621](https://github.com/aws-amplify/amplify-cli/issues/1621)
* **cli:** add default value for options in updateAmplifyMeta ([#1648](https://github.com/aws-amplify/amplify-cli/issues/1648)) ([f9c87bb](https://github.com/aws-amplify/amplify-cli/commit/f9c87bb)), closes [#1621](https://github.com/aws-amplify/amplify-cli/issues/1621)





## [1.7.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.7.1...@aws-amplify/cli@1.7.2) (2019-06-11)


### Bug Fixes

* **amplify-cli:** return valid JSON when using amplify env get --json ([#1622](https://github.com/aws-amplify/amplify-cli/issues/1622)) ([49f4339](https://github.com/aws-amplify/amplify-cli/commit/49f4339)), closes [#1616](https://github.com/aws-amplify/amplify-cli/issues/1616)
* **cli:** support es6 import/export ([#1635](https://github.com/aws-amplify/amplify-cli/issues/1635)) ([18d5409](https://github.com/aws-amplify/amplify-cli/commit/18d5409)), closes [#1623](https://github.com/aws-amplify/amplify-cli/issues/1623)





## [1.7.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.7.0...@aws-amplify/cli@1.7.1) (2019-06-06)

**Note:** Version bump only for package @aws-amplify/cli





# [1.7.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.6.11...@aws-amplify/cli@1.7.0) (2019-05-29)


### Features

* flow to add policies to access amplify resources from Lambda ([#1462](https://github.com/aws-amplify/amplify-cli/issues/1462)) ([fee247c](https://github.com/aws-amplify/amplify-cli/commit/fee247c))





## [1.6.11](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.6.10...@aws-amplify/cli@1.6.11) (2019-05-24)

**Note:** Version bump only for package @aws-amplify/cli





## [1.6.10](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.6.9...@aws-amplify/cli@1.6.10) (2019-05-21)

**Note:** Version bump only for package @aws-amplify/cli





## [1.6.9](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.6.8...@aws-amplify/cli@1.6.9) (2019-05-17)

**Note:** Version bump only for package @aws-amplify/cli





## [1.6.8](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.6.6...@aws-amplify/cli@1.6.8) (2019-05-07)

**Note:** Version bump only for package @aws-amplify/cli





## [1.6.7](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.6.6...@aws-amplify/cli@1.6.7) (2019-05-06)

**Note:** Version bump only for package @aws-amplify/cli





## [1.6.6](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.6.5...@aws-amplify/cli@1.6.6) (2019-04-30)


### Bug Fixes

* update CLI to handle UTF8 BOM ([#1357](https://github.com/aws-amplify/amplify-cli/issues/1357)) ([b0afa07](https://github.com/aws-amplify/amplify-cli/commit/b0afa07)), closes [#1355](https://github.com/aws-amplify/amplify-cli/issues/1355) [#1122](https://github.com/aws-amplify/amplify-cli/issues/1122)





## [1.6.5](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.6.4...@aws-amplify/cli@1.6.5) (2019-04-25)

**Note:** Version bump only for package @aws-amplify/cli





## [1.6.4](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.6.3...@aws-amplify/cli@1.6.4) (2019-04-24)


### Bug Fixes

* **cli:** check BOM in json read ([#1293](https://github.com/aws-amplify/amplify-cli/issues/1293)) ([adf7ab7](https://github.com/aws-amplify/amplify-cli/commit/adf7ab7)), closes [#1280](https://github.com/aws-amplify/amplify-cli/issues/1280)





## [1.6.3](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.6.2...@aws-amplify/cli@1.6.3) (2019-04-16)

**Note:** Version bump only for package @aws-amplify/cli





## [1.6.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.6.1...@aws-amplify/cli@1.6.2) (2019-04-16)


### Bug Fixes

* **cli:** publish check user response ([f88e9b2](https://github.com/aws-amplify/amplify-cli/commit/f88e9b2)), closes [#965](https://github.com/aws-amplify/amplify-cli/issues/965)





## [1.6.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.5.1...@aws-amplify/cli@1.6.1) (2019-04-09)

**Note:** Version bump only for package @aws-amplify/cli





## [1.5.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.5.0...@aws-amplify/cli@1.5.1) (2019-04-03)


### Bug Fixes

* fix [#1201](https://github.com/aws-amplify/amplify-cli/issues/1201) ([0dfdda5](https://github.com/aws-amplify/amplify-cli/commit/0dfdda5))





# [1.5.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.1.8...@aws-amplify/cli@1.5.0) (2019-04-03)


### Bug Fixes

* **amplify-cli:** promise not resolving in lts/dubnium ([#1028](https://github.com/aws-amplify/amplify-cli/issues/1028)) ([8a966be](https://github.com/aws-amplify/amplify-cli/commit/8a966be))
* fixes update of aws exports when switching envs ([55a14bf](https://github.com/aws-amplify/amplify-cli/commit/55a14bf))
* lint errors ([4cb6e57](https://github.com/aws-amplify/amplify-cli/commit/4cb6e57))
* use helper functions for adding metadata ([50f8d76](https://github.com/aws-amplify/amplify-cli/commit/50f8d76))


### Features

* support for provisioning Cognito Hosted UI and support CRUD operations in Storage and API categories ([729b0de](https://github.com/aws-amplify/amplify-cli/commit/729b0de))
* use cloudformation to update meta ([d4ae437](https://github.com/aws-amplify/amplify-cli/commit/d4ae437))





## [1.1.8](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.1.7...@aws-amplify/cli@1.1.8) (2019-03-22)


### Bug Fixes

* **cli:** allow update value to be other types ([c3832b6](https://github.com/aws-amplify/amplify-cli/commit/c3832b6))





## [1.1.7](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.1.6...@aws-amplify/cli@1.1.7) (2019-03-05)


### Bug Fixes

* mispelling with amplify delete instructions ([1bca2cd](https://github.com/aws-amplify/amplify-cli/commit/1bca2cd))
* remove env command instructions ([6207dc2](https://github.com/aws-amplify/amplify-cli/commit/6207dc2))
* **cli:** added global windows npm path to plugin import ([6c1a2e7](https://github.com/aws-amplify/amplify-cli/commit/6c1a2e7))


### Performance Improvements

* speed up push ([#963](https://github.com/aws-amplify/amplify-cli/issues/963)) ([eb8b852](https://github.com/aws-amplify/amplify-cli/commit/eb8b852)), closes [#914](https://github.com/aws-amplify/amplify-cli/issues/914)





## [1.1.6](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.1.5...@aws-amplify/cli@1.1.6) (2019-02-26)


### Bug Fixes

* **@aws-amplify/cli:** change get-when fn to use updated proj config ([b1ef085](https://github.com/aws-amplify/amplify-cli/commit/b1ef085))





## [1.1.5](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.1.4...@aws-amplify/cli@1.1.5) (2019-02-25)


### Bug Fixes

* typo on `amplify env` help text ([4837ec9](https://github.com/aws-amplify/amplify-cli/commit/4837ec9))





## [1.1.4](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.1.3...@aws-amplify/cli@1.1.4) (2019-02-22)

**Note:** Version bump only for package @aws-amplify/cli





## [1.1.3](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.1.2...@aws-amplify/cli@1.1.3) (2019-02-20)

**Note:** Version bump only for package @aws-amplify/cli





## [1.1.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.1.0...@aws-amplify/cli@1.1.2) (2019-02-15)


### Bug Fixes

* remove warning about beta version of the CLI ([5029f4a](https://github.com/aws-amplify/amplify-cli/commit/5029f4a))





## [1.1.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.1.0...@aws-amplify/cli@1.1.1) (2019-02-14)


### Bug Fixes

* remove warning about beta version of the CLI ([5029f4a](https://github.com/aws-amplify/amplify-cli/commit/5029f4a))





# [1.1.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.0.5...@aws-amplify/cli@1.1.0) (2019-02-12)


### Features

* add warning message when migrating for manually modified CFN files ([c175102](https://github.com/aws-amplify/amplify-cli/commit/c175102))





## [1.0.5](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.0.3-beta.0...@aws-amplify/cli@1.0.5) (2019-02-11)

**Note:** Version bump only for package @aws-amplify/cli





## [1.0.3](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.0.3-beta.0...@aws-amplify/cli@1.0.3) (2019-02-11)

**Note:** Version bump only for package @aws-amplify/cli





## [1.0.3-beta.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.0.2...@aws-amplify/cli@1.0.3-beta.0) (2019-02-11)

**Note:** Version bump only for package @aws-amplify/cli





<a name="0.2.1-multienv.42"></a>
## [0.2.1-multienv.42](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.41...@aws-amplify/cli@0.2.1-multienv.42) (2019-02-01)


### Bug Fixes

* restrict env names to lowercase ([c4d0523](https://github.com/aws-amplify/amplify-cli/commit/c4d0523)), closes [#373](https://github.com/aws-amplify/amplify-cli/issues/373)


### Features

* Modify amplify env add/import behvior ([ca4a459](https://github.com/aws-amplify/amplify-cli/commit/ca4a459))




<a name="0.2.1-multienv.41"></a>
## [0.2.1-multienv.41](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.40...@aws-amplify/cli@0.2.1-multienv.41) (2019-02-01)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.40"></a>
## [0.2.1-multienv.40](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.39...@aws-amplify/cli@0.2.1-multienv.40) (2019-01-30)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.39"></a>
## [0.2.1-multienv.39](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.38...@aws-amplify/cli@0.2.1-multienv.39) (2019-01-29)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.38"></a>
## [0.2.1-multienv.38](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.37...@aws-amplify/cli@0.2.1-multienv.38) (2019-01-25)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.37"></a>
## [0.2.1-multienv.37](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.36...@aws-amplify/cli@0.2.1-multienv.37) (2019-01-25)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.36"></a>
## [0.2.1-multienv.36](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.35...@aws-amplify/cli@0.2.1-multienv.36) (2019-01-24)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.35"></a>
## [0.2.1-multienv.35](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.34...@aws-amplify/cli@0.2.1-multienv.35) (2019-01-22)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.34"></a>
## [0.2.1-multienv.34](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.33...@aws-amplify/cli@0.2.1-multienv.34) (2019-01-22)


### Bug Fixes

* Fix help message `sync` to `pull`. ([#747](https://github.com/aws-amplify/amplify-cli/issues/747)) ([97bbc12](https://github.com/aws-amplify/amplify-cli/commit/97bbc12))




<a name="0.2.1-multienv.33"></a>
## [0.2.1-multienv.33](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.32...@aws-amplify/cli@0.2.1-multienv.33) (2019-01-22)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.32"></a>
## [0.2.1-multienv.32](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.31...@aws-amplify/cli@0.2.1-multienv.32) (2019-01-22)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.31"></a>
## [0.2.1-multienv.31](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.30...@aws-amplify/cli@0.2.1-multienv.31) (2019-01-19)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.30"></a>
## [0.2.1-multienv.30](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.29...@aws-amplify/cli@0.2.1-multienv.30) (2019-01-19)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.29"></a>
## [0.2.1-multienv.29](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.27...@aws-amplify/cli@0.2.1-multienv.29) (2019-01-16)


### Bug Fixes

* update dependsOn block when updating api ([ef8cb27](https://github.com/aws-amplify/amplify-cli/commit/ef8cb27))




<a name="0.2.1-multienv.28"></a>
## [0.2.1-multienv.28](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.27...@aws-amplify/cli@0.2.1-multienv.28) (2019-01-16)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.27"></a>
## [0.2.1-multienv.27](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.26...@aws-amplify/cli@0.2.1-multienv.27) (2019-01-16)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.26"></a>
## [0.2.1-multienv.26](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.25...@aws-amplify/cli@0.2.1-multienv.26) (2019-01-15)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.25"></a>
## [0.2.1-multienv.25](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.24...@aws-amplify/cli@0.2.1-multienv.25) (2019-01-14)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.24"></a>
## [0.2.1-multienv.24](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.23...@aws-amplify/cli@0.2.1-multienv.24) (2019-01-14)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.23"></a>
## [0.2.1-multienv.23](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.22...@aws-amplify/cli@0.2.1-multienv.23) (2019-01-10)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.22"></a>
## [0.2.1-multienv.22](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.21...@aws-amplify/cli@0.2.1-multienv.22) (2019-01-08)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.21"></a>
## [0.2.1-multienv.21](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.20...@aws-amplify/cli@0.2.1-multienv.21) (2019-01-08)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.20"></a>
## [0.2.1-multienv.20](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.19...@aws-amplify/cli@0.2.1-multienv.20) (2019-01-03)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.19"></a>
## [0.2.1-multienv.19](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.18...@aws-amplify/cli@0.2.1-multienv.19) (2018-12-31)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.18"></a>
## [0.2.1-multienv.18](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.17...@aws-amplify/cli@0.2.1-multienv.18) (2018-12-28)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.17"></a>
## [0.2.1-multienv.17](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.16...@aws-amplify/cli@0.2.1-multienv.17) (2018-12-27)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.16"></a>
## [0.2.1-multienv.16](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.15...@aws-amplify/cli@0.2.1-multienv.16) (2018-12-27)


### Features

* adding warning message when using beta-multienv cli ([e0c73fd](https://github.com/aws-amplify/amplify-cli/commit/e0c73fd))




<a name="0.2.1-multienv.15"></a>
## [0.2.1-multienv.15](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.14...@aws-amplify/cli@0.2.1-multienv.15) (2018-12-21)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.14"></a>
## [0.2.1-multienv.14](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.13...@aws-amplify/cli@0.2.1-multienv.14) (2018-12-19)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.13"></a>
## [0.2.1-multienv.13](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.12...@aws-amplify/cli@0.2.1-multienv.13) (2018-12-19)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.12"></a>
## [0.2.1-multienv.12](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.11...@aws-amplify/cli@0.2.1-multienv.12) (2018-12-10)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.11"></a>
## [0.2.1-multienv.11](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.10...@aws-amplify/cli@0.2.1-multienv.11) (2018-12-10)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.10"></a>
## [0.2.1-multienv.10](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.9...@aws-amplify/cli@0.2.1-multienv.10) (2018-12-07)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.9"></a>
## [0.2.1-multienv.9](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.7...@aws-amplify/cli@0.2.1-multienv.9) (2018-12-05)


### Bug Fixes

* **cli:** remove calls to gluegun's prompt.confirm ([#546](https://github.com/aws-amplify/amplify-cli/issues/546)) ([0080ddb](https://github.com/aws-amplify/amplify-cli/commit/0080ddb))




<a name="0.2.1-multienv.8"></a>
## [0.2.1-multienv.8](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.7...@aws-amplify/cli@0.2.1-multienv.8) (2018-12-05)


### Bug Fixes

* **cli:** remove calls to gluegun's prompt.confirm ([#546](https://github.com/aws-amplify/amplify-cli/issues/546)) ([0080ddb](https://github.com/aws-amplify/amplify-cli/commit/0080ddb))




<a name="0.2.1-multienv.7"></a>
## [0.2.1-multienv.7](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.6...@aws-amplify/cli@0.2.1-multienv.7) (2018-12-04)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.6"></a>
## [0.2.1-multienv.6](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.5...@aws-amplify/cli@0.2.1-multienv.6) (2018-12-04)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.5"></a>
## [0.2.1-multienv.5](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.4...@aws-amplify/cli@0.2.1-multienv.5) (2018-12-04)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.4"></a>
## [0.2.1-multienv.4](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.3...@aws-amplify/cli@0.2.1-multienv.4) (2018-11-30)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.3"></a>
## [0.2.1-multienv.3](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.2...@aws-amplify/cli@0.2.1-multienv.3) (2018-11-30)


### Bug Fixes

* make projects compatible with new version of CLI initialized between 11/25/2018 to 11/28/2018 ([9a30988](https://github.com/aws-amplify/amplify-cli/commit/9a30988))




<a name="0.2.1-multienv.2"></a>
## [0.2.1-multienv.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.1...@aws-amplify/cli@0.2.1-multienv.2) (2018-11-28)


### Bug Fixes

* allow only alphabets for env names ([0ef64e8](https://github.com/aws-amplify/amplify-cli/commit/0ef64e8))


### Features

* Add second level of messaging when migrating projects from old version to newer version ([aea7c4c](https://github.com/aws-amplify/amplify-cli/commit/aea7c4c))
* Add second level of messaging when migrating projects from old version to newer version ([#514](https://github.com/aws-amplify/amplify-cli/issues/514)) ([b373ebe](https://github.com/aws-amplify/amplify-cli/commit/b373ebe))
* core metadata migration of projects using the old version of the CLI ([#482](https://github.com/aws-amplify/amplify-cli/issues/482)) ([340b7e4](https://github.com/aws-amplify/amplify-cli/commit/340b7e4))
* migration of API GW and Interactions ([a91ba9a](https://github.com/aws-amplify/amplify-cli/commit/a91ba9a))
* migration of hosting and notifications ([#497](https://github.com/aws-amplify/amplify-cli/issues/497)) ([f6a60b6](https://github.com/aws-amplify/amplify-cli/commit/f6a60b6))
* migration of projects using the old version of the CLI ([f16c5a9](https://github.com/aws-amplify/amplify-cli/commit/f16c5a9))
* Multienv auth migrate ([#498](https://github.com/aws-amplify/amplify-cli/issues/498)) ([ef3e3b3](https://github.com/aws-amplify/amplify-cli/commit/ef3e3b3))




<a name="0.2.1-multienv.1"></a>
## [0.2.1-multienv.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.0...@aws-amplify/cli@0.2.1-multienv.1) (2018-11-22)


### Bug Fixes

* add additional checks for the presence of team-provider-info ([#492](https://github.com/aws-amplify/amplify-cli/issues/492)) ([0b98101](https://github.com/aws-amplify/amplify-cli/commit/0b98101))




<a name="0.2.1-multienv.0"></a>
## [0.2.1-multienv.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.35-multienv.6...@aws-amplify/cli@0.2.1-multienv.0) (2018-11-21)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.35-multienv.6"></a>
## [0.1.35-multienv.6](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.35-multienv.5...@aws-amplify/cli@0.1.35-multienv.6) (2018-11-20)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.35-multienv.5"></a>
## [0.1.35-multienv.5](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.35-multienv.4...@aws-amplify/cli@0.1.35-multienv.5) (2018-11-20)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.35-multienv.4"></a>
## [0.1.35-multienv.4](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.35-multienv.3...@aws-amplify/cli@0.1.35-multienv.4) (2018-11-19)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.35-multienv.3"></a>
## [0.1.35-multienv.3](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.35-multienv.2...@aws-amplify/cli@0.1.35-multienv.3) (2018-11-19)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.35-multienv.2"></a>
## [0.1.35-multienv.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.35-multienv.1...@aws-amplify/cli@0.1.35-multienv.2) (2018-11-19)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.35-multienv.1"></a>
## [0.1.35-multienv.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.35-multienv.0...@aws-amplify/cli@0.1.35-multienv.1) (2018-11-16)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.35-multienv.0"></a>
## [0.1.35-multienv.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.34...@aws-amplify/cli@0.1.35-multienv.0) (2018-11-16)


### Bug Fixes

* fix projectPath references in ios and codegen packages & fix for  correct AWS profile pickup in the cloudformation provider ([a73656e](https://github.com/aws-amplify/amplify-cli/commit/a73656e))
* fix projectPath references in ios and codegen packages & fix for  correct AWS profile pickup in the cloudformation provider ([f44e367](https://github.com/aws-amplify/amplify-cli/commit/f44e367))
* fixes for correct AWS profile pickup in the clouformation provider ([3c538b3](https://github.com/aws-amplify/amplify-cli/commit/3c538b3))
* fixes for correct AWS profile pickup in the clouformation provider ([779b431](https://github.com/aws-amplify/amplify-cli/commit/779b431))
* rename amplify env sync to amplify env pull ([cc5f5d0](https://github.com/aws-amplify/amplify-cli/commit/cc5f5d0))
* rename amplify env sync to amplify env pull ([825e16a](https://github.com/aws-amplify/amplify-cli/commit/825e16a))
* revert back profilename to default in headless script ([ff9b2f1](https://github.com/aws-amplify/amplify-cli/commit/ff9b2f1))
* revert back profilename to default in headless script ([f484707](https://github.com/aws-amplify/amplify-cli/commit/f484707))
* stringify env json outputs ([#427](https://github.com/aws-amplify/amplify-cli/issues/427)) ([798e949](https://github.com/aws-amplify/amplify-cli/commit/798e949))
* stringify env json outputs ([#427](https://github.com/aws-amplify/amplify-cli/issues/427)) ([ba25694](https://github.com/aws-amplify/amplify-cli/commit/ba25694))
* **cli:** downgrade fs-extra version ([6b0d632](https://github.com/aws-amplify/amplify-cli/commit/6b0d632))


### Features

* add json option to env display commands and add sample headless scripts ([#410](https://github.com/aws-amplify/amplify-cli/issues/410)) ([741590a](https://github.com/aws-amplify/amplify-cli/commit/741590a))
* add json option to env display commands and add sample headless scripts ([#410](https://github.com/aws-amplify/amplify-cli/issues/410)) ([e7f1f5f](https://github.com/aws-amplify/amplify-cli/commit/e7f1f5f))
* added amplify env sync and amplify env checkout command & added help commands for env  ([#430](https://github.com/aws-amplify/amplify-cli/issues/430)) ([5219e08](https://github.com/aws-amplify/amplify-cli/commit/5219e08))
* added amplify env sync and amplify env checkout command & added help commands for env  ([#430](https://github.com/aws-amplify/amplify-cli/issues/430)) ([de72729](https://github.com/aws-amplify/amplify-cli/commit/de72729))
* amplify env remove and ampify delete command for multi envs ([#458](https://github.com/aws-amplify/amplify-cli/issues/458)) ([f2495be](https://github.com/aws-amplify/amplify-cli/commit/f2495be))
* amplify env remove and ampify delete command for multi envs ([#458](https://github.com/aws-amplify/amplify-cli/issues/458)) ([ddca3bc](https://github.com/aws-amplify/amplify-cli/commit/ddca3bc))
* headless Init and configure ([#371](https://github.com/aws-amplify/amplify-cli/issues/371)) ([acd14a8](https://github.com/aws-amplify/amplify-cli/commit/acd14a8))
* headless Init and configure ([#371](https://github.com/aws-amplify/amplify-cli/issues/371)) ([8780400](https://github.com/aws-amplify/amplify-cli/commit/8780400))
* **amplify-category-auth:** add headless init support for auth ([#465](https://github.com/aws-amplify/amplify-cli/issues/465)) ([18410f2](https://github.com/aws-amplify/amplify-cli/commit/18410f2))
* help commands for multi-env and also add env&codegen to overall help command list ([1ed4591](https://github.com/aws-amplify/amplify-cli/commit/1ed4591))
* help commands for multi-env and also add env&codegen to overall help command list ([bba07c3](https://github.com/aws-amplify/amplify-cli/commit/bba07c3))
* multi-environment support for interactions category ([577a546](https://github.com/aws-amplify/amplify-cli/commit/577a546))
* multi-environment support for interactions category ([4ca2617](https://github.com/aws-amplify/amplify-cli/commit/4ca2617))
* multienv support for Notifications ([#440](https://github.com/aws-amplify/amplify-cli/issues/440)) ([a2964d4](https://github.com/aws-amplify/amplify-cli/commit/a2964d4))
* multienv support for Notifications ([#440](https://github.com/aws-amplify/amplify-cli/issues/440)) ([4dac0de](https://github.com/aws-amplify/amplify-cli/commit/4dac0de))
* multiple evironment support for analytics and s3 storage ([0400f26](https://github.com/aws-amplify/amplify-cli/commit/0400f26))
* multiple evironment support for analytics and s3 storage ([d1ca7bc](https://github.com/aws-amplify/amplify-cli/commit/d1ca7bc))




<a name="0.1.34"></a>
## [0.1.34](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.34-beta.0...@aws-amplify/cli@0.1.34) (2018-11-13)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.34-beta.0"></a>
## [0.1.34-beta.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.33...@aws-amplify/cli@0.1.34-beta.0) (2018-11-13)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.33"></a>
## [0.1.33](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.33-beta.0...@aws-amplify/cli@0.1.33) (2018-11-09)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.33-beta.0"></a>
## [0.1.33-beta.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.13...@aws-amplify/cli@0.1.33-beta.0) (2018-11-09)


### Bug Fixes

* **@aws-amplify/cli:** lint errors ([73d1ff6](https://github.com/aws-amplify/amplify-cli/commit/73d1ff6))
* **@aws-amplify/cli:** support yarn ([59cc5c2](https://github.com/aws-amplify/amplify-cli/commit/59cc5c2))
* **yarn:** support symlink dotfiles ([b604ed2](https://github.com/aws-amplify/amplify-cli/commit/b604ed2))




<a name="0.1.32"></a>
## [0.1.32](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.32-beta.0...@aws-amplify/cli@0.1.32) (2018-11-05)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.32-beta.0"></a>
## [0.1.32-beta.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.13...@aws-amplify/cli@0.1.32-beta.0) (2018-11-05)


### Bug Fixes

* **@aws-amplify/cli:** lint errors ([73d1ff6](https://github.com/aws-amplify/amplify-cli/commit/73d1ff6))
* **@aws-amplify/cli:** support yarn ([59cc5c2](https://github.com/aws-amplify/amplify-cli/commit/59cc5c2))
* **yarn:** support symlink dotfiles ([b604ed2](https://github.com/aws-amplify/amplify-cli/commit/b604ed2))




<a name="0.1.31"></a>
## [0.1.31](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.13...@aws-amplify/cli@0.1.31) (2018-11-02)


### Bug Fixes

* **@aws-amplify/cli:** lint errors ([73d1ff6](https://github.com/aws-amplify/amplify-cli/commit/73d1ff6))
* **@aws-amplify/cli:** support yarn ([59cc5c2](https://github.com/aws-amplify/amplify-cli/commit/59cc5c2))
* **yarn:** support symlink dotfiles ([b604ed2](https://github.com/aws-amplify/amplify-cli/commit/b604ed2))




<a name="0.1.30"></a>
## [0.1.30](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.30-beta.0...@aws-amplify/cli@0.1.30) (2018-11-02)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.30-beta.0"></a>
## [0.1.30-beta.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.13...@aws-amplify/cli@0.1.30-beta.0) (2018-11-02)


### Bug Fixes

* **@aws-amplify/cli:** lint errors ([73d1ff6](https://github.com/aws-amplify/amplify-cli/commit/73d1ff6))
* **@aws-amplify/cli:** support yarn ([59cc5c2](https://github.com/aws-amplify/amplify-cli/commit/59cc5c2))
* **yarn:** support symlink dotfiles ([b604ed2](https://github.com/aws-amplify/amplify-cli/commit/b604ed2))




<a name="0.1.29"></a>
## [0.1.29](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.29-beta.1...@aws-amplify/cli@0.1.29) (2018-10-23)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.29-beta.1"></a>
## [0.1.29-beta.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.29-beta.0...@aws-amplify/cli@0.1.29-beta.1) (2018-10-23)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.29-beta.0"></a>
## [0.1.29-beta.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.13...@aws-amplify/cli@0.1.29-beta.0) (2018-10-23)


### Bug Fixes

* **@aws-amplify/cli:** lint errors ([73d1ff6](https://github.com/aws-amplify/amplify-cli/commit/73d1ff6))
* **@aws-amplify/cli:** support yarn ([59cc5c2](https://github.com/aws-amplify/amplify-cli/commit/59cc5c2))
* **yarn:** support symlink dotfiles ([b604ed2](https://github.com/aws-amplify/amplify-cli/commit/b604ed2))




<a name="0.1.28"></a>
## [0.1.28](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.28-beta.0...@aws-amplify/cli@0.1.28) (2018-10-18)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.28-beta.0"></a>
## [0.1.28-beta.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.13...@aws-amplify/cli@0.1.28-beta.0) (2018-10-12)


### Bug Fixes

* **@aws-amplify/cli:** lint errors ([73d1ff6](https://github.com/aws-amplify/amplify-cli/commit/73d1ff6))
* **@aws-amplify/cli:** support yarn ([59cc5c2](https://github.com/aws-amplify/amplify-cli/commit/59cc5c2))
* **yarn:** support symlink dotfiles ([b604ed2](https://github.com/aws-amplify/amplify-cli/commit/b604ed2))




<a name="0.1.13"></a>
## [0.1.13](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.12...@aws-amplify/cli@0.1.13) (2018-08-23)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.12"></a>
## [0.1.12](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.11...@aws-amplify/cli@0.1.12) (2018-08-23)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.11"></a>
## [0.1.11](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.9...@aws-amplify/cli@0.1.11) (2018-08-23)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.10"></a>
## [0.1.10](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.9...@aws-amplify/cli@0.1.10) (2018-08-23)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.9"></a>
## [0.1.9](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.8...@aws-amplify/cli@0.1.9) (2018-08-23)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.8"></a>
## [0.1.8](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.7...@aws-amplify/cli@0.1.8) (2018-08-23)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.7"></a>
## [0.1.7](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.6...@aws-amplify/cli@0.1.7) (2018-08-23)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.6"></a>
## [0.1.6](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.5...@aws-amplify/cli@0.1.6) (2018-08-23)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.5"></a>
## [0.1.5](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.4...@aws-amplify/cli@0.1.5) (2018-08-23)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.4"></a>
## 0.1.4 (2018-08-23)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.3"></a>
## 0.1.3 (2018-08-23)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.2"></a>
## 0.1.2 (2018-08-23)




**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.1"></a>
## 0.1.1 (2018-08-23)




**Note:** Version bump only for package @aws-amplify/cli
