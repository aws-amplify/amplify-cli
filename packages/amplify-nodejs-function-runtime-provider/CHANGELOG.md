# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.5.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-nodejs-function-runtime-provider@1.4.3...amplify-nodejs-function-runtime-provider@1.5.0) (2021-02-17)


### Bug Fixes

* mock handles and prints child proc errors ([#6601](https://github.com/aws-amplify/amplify-cli/issues/6601)) ([ce075d9](https://github.com/aws-amplify/amplify-cli/commit/ce075d91c0b93885229ab3c6000a450c6b8cc56a))


### Features

* fully populate mock function environment variables ([#6551](https://github.com/aws-amplify/amplify-cli/issues/6551)) ([dceb13a](https://github.com/aws-amplify/amplify-cli/commit/dceb13a76a85a05940078868a3e2e1ca85656938))
* Separate prod and dev lambda function builds ([#6494](https://github.com/aws-amplify/amplify-cli/issues/6494)) ([2977c6a](https://github.com/aws-amplify/amplify-cli/commit/2977c6a886b33a38ef46f898a2adc1ffdb6d228b))





## [1.4.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-nodejs-function-runtime-provider@1.4.2...amplify-nodejs-function-runtime-provider@1.4.3) (2021-02-10)


### Bug Fixes

* **amplify-nodejs-function-runtime-provider:** fix lambda error format ([#6350](https://github.com/aws-amplify/amplify-cli/issues/6350)) ([0cf5282](https://github.com/aws-amplify/amplify-cli/commit/0cf5282deed96638cc6e9cd286b4d9c3de0b8542)), closes [#5553](https://github.com/aws-amplify/amplify-cli/issues/5553)





## [1.4.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-nodejs-function-runtime-provider@1.4.1...amplify-nodejs-function-runtime-provider@1.4.2) (2020-12-31)


### Bug Fixes

* **amplify-nodejs-function-runtime-provider:** handle lambda pkg errors ([#6126](https://github.com/aws-amplify/amplify-cli/issues/6126)) ([53c3bb3](https://github.com/aws-amplify/amplify-cli/commit/53c3bb31c62e1be8f9b6c10129fc950b88cbb426))





## [1.4.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-nodejs-function-runtime-provider@1.4.0...amplify-nodejs-function-runtime-provider@1.4.1) (2020-12-16)


### Bug Fixes

* [#6067](https://github.com/aws-amplify/amplify-cli/issues/6067) - nodejs mock return error from lambda ([#6096](https://github.com/aws-amplify/amplify-cli/issues/6096)) ([d6793c8](https://github.com/aws-amplify/amplify-cli/commit/d6793c8670e4874db23ca08b3d1d7cba4dd0e56e))





# [1.4.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-nodejs-function-runtime-provider@1.3.0...amplify-nodejs-function-runtime-provider@1.4.0) (2020-12-11)


### Features

* container-based deployments([#5727](https://github.com/aws-amplify/amplify-cli/issues/5727)) ([fad6377](https://github.com/aws-amplify/amplify-cli/commit/fad6377bd384862ca4429cb1a83eee90efd62b58))





# [1.3.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-nodejs-function-runtime-provider@1.2.1...amplify-nodejs-function-runtime-provider@1.3.0) (2020-11-30)


### Features

* pre-deploy pull, new login mechanism and pkg cli updates ([#5941](https://github.com/aws-amplify/amplify-cli/issues/5941)) ([7274251](https://github.com/aws-amplify/amplify-cli/commit/7274251faadc1035acce5f44699b172e10e2e67d))





## [1.2.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-nodejs-function-runtime-provider@1.1.6...amplify-nodejs-function-runtime-provider@1.2.1) (2020-11-22)

**Note:** Version bump only for package amplify-nodejs-function-runtime-provider





# 1.2.0 (2020-11-22)


### Bug Fixes

* **amplify-nodejs-function-runtime-provider:** invoke waits close event before rejects ([#5498](https://github.com/aws-amplify/amplify-cli/issues/5498)) ([cafefd6](https://github.com/aws-amplify/amplify-cli/commit/cafefd65a54fcd8b06ccdc1fb2362eeeff3122d5))
* parse appSync go function resolvers to JOSN ([#5297](https://github.com/aws-amplify/amplify-cli/issues/5297)) ([43c6e82](https://github.com/aws-amplify/amplify-cli/commit/43c6e8247210446b133fef799ff21cd70ad9e022))
* **amplify-nodejs-function-runtime-provider:** change the exit status appropriately ([#5608](https://github.com/aws-amplify/amplify-cli/issues/5608)) ([2db83ab](https://github.com/aws-amplify/amplify-cli/commit/2db83aba05f62d9a7927da580d85bfe31a3a1d7a))
* **amplify-nodejs-function-runtime-provider:** restore console.log ([#4941](https://github.com/aws-amplify/amplify-cli/issues/4941)) ([bc1aa0b](https://github.com/aws-amplify/amplify-cli/commit/bc1aa0b21df3c969f1ddc0f3c7842ae1337fbdba))
* **amplify-nodejs-function-runtime-provider:** truncated results ([#5107](https://github.com/aws-amplify/amplify-cli/issues/5107)) ([8f2607c](https://github.com/aws-amplify/amplify-cli/commit/8f2607cadfe3bf71c9b17847c3d6947998dfa76c))
* dotnet fucntion provider fixes, package.json cleanup, add pkg refs ([#3826](https://github.com/aws-amplify/amplify-cli/issues/3826)) ([75361fb](https://github.com/aws-amplify/amplify-cli/commit/75361fb266f15ba954a8b8e935874c74f66eb11a))
* new json and snapshot ([#4947](https://github.com/aws-amplify/amplify-cli/issues/4947)) ([336858b](https://github.com/aws-amplify/amplify-cli/commit/336858bca104a2f63353e2db4e2d56b19c19a492))
* nodejs staleBuild glob ([#4499](https://github.com/aws-amplify/amplify-cli/issues/4499)) ([6fc7281](https://github.com/aws-amplify/amplify-cli/commit/6fc7281aae4b3c76881144b6ba714966c9f9f8ba))
* support large payload in Node.js functions ([#4906](https://github.com/aws-amplify/amplify-cli/issues/4906)) ([3733a16](https://github.com/aws-amplify/amplify-cli/commit/3733a161ea09472fe52d5fc8a6515a3e4e726338))
* **amplify-nodejs-function-runtime-provider:** unhandled errors ([#4418](https://github.com/aws-amplify/amplify-cli/issues/4418)) ([ea19aa2](https://github.com/aws-amplify/amplify-cli/commit/ea19aa27cc2118f9247abe3515a03e72de6c4ef3))
* **amplify-util-mock:** non-promise lambda failing ([#4203](https://github.com/aws-amplify/amplify-cli/issues/4203)) ([e34b97f](https://github.com/aws-amplify/amplify-cli/commit/e34b97f3750374a8bc8b693d9998fba1ec6f3ea0))
* pass deserialized obj to node lambda when mocking ([#3895](https://github.com/aws-amplify/amplify-cli/issues/3895)) ([c5a1891](https://github.com/aws-amplify/amplify-cli/commit/c5a1891f218e23434fec3516d845958fddf416d8))
* rename node pluign packages ([#3788](https://github.com/aws-amplify/amplify-cli/issues/3788)) ([7b1f0f2](https://github.com/aws-amplify/amplify-cli/commit/7b1f0f2c7bb67a9d154e8462643fb0fe35e88399))


### Features

* Lambda layers ([#4697](https://github.com/aws-amplify/amplify-cli/issues/4697)) ([4e97400](https://github.com/aws-amplify/amplify-cli/commit/4e974007d95c894ab4108a2dff8d5996e7e3ce25))





## [1.1.6](https://github.com/aws-amplify/amplify-cli/compare/amplify-nodejs-function-runtime-provider@1.1.5...amplify-nodejs-function-runtime-provider@1.1.6) (2020-10-30)


### Bug Fixes

* **amplify-nodejs-function-runtime-provider:** change the exit status appropriately ([#5608](https://github.com/aws-amplify/amplify-cli/issues/5608)) ([2db83ab](https://github.com/aws-amplify/amplify-cli/commit/2db83aba05f62d9a7927da580d85bfe31a3a1d7a))
* parse appSync go function resolvers to JOSN ([#5297](https://github.com/aws-amplify/amplify-cli/issues/5297)) ([43c6e82](https://github.com/aws-amplify/amplify-cli/commit/43c6e8247210446b133fef799ff21cd70ad9e022))
* **amplify-nodejs-function-runtime-provider:** invoke waits close event before rejects ([#5498](https://github.com/aws-amplify/amplify-cli/issues/5498)) ([cafefd6](https://github.com/aws-amplify/amplify-cli/commit/cafefd65a54fcd8b06ccdc1fb2362eeeff3122d5))





## [1.1.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-nodejs-function-runtime-provider@1.1.4...amplify-nodejs-function-runtime-provider@1.1.5) (2020-09-16)

**Note:** Version bump only for package amplify-nodejs-function-runtime-provider





## [1.1.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-nodejs-function-runtime-provider@1.1.3...amplify-nodejs-function-runtime-provider@1.1.4) (2020-08-31)

**Note:** Version bump only for package amplify-nodejs-function-runtime-provider





## [1.1.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-nodejs-function-runtime-provider@1.1.2...amplify-nodejs-function-runtime-provider@1.1.3) (2020-08-20)


### Bug Fixes

* **amplify-nodejs-function-runtime-provider:** truncated results ([#5107](https://github.com/aws-amplify/amplify-cli/issues/5107)) ([8f2607c](https://github.com/aws-amplify/amplify-cli/commit/8f2607cadfe3bf71c9b17847c3d6947998dfa76c))





## [1.1.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-nodejs-function-runtime-provider@1.1.0...amplify-nodejs-function-runtime-provider@1.1.2) (2020-07-29)


### Bug Fixes

* new json and snapshot ([#4947](https://github.com/aws-amplify/amplify-cli/issues/4947)) ([336858b](https://github.com/aws-amplify/amplify-cli/commit/336858bca104a2f63353e2db4e2d56b19c19a492))
* support large payload in Node.js functions ([#4906](https://github.com/aws-amplify/amplify-cli/issues/4906)) ([3733a16](https://github.com/aws-amplify/amplify-cli/commit/3733a161ea09472fe52d5fc8a6515a3e4e726338))
* **amplify-nodejs-function-runtime-provider:** restore console.log ([#4941](https://github.com/aws-amplify/amplify-cli/issues/4941)) ([bc1aa0b](https://github.com/aws-amplify/amplify-cli/commit/bc1aa0b21df3c969f1ddc0f3c7842ae1337fbdba))





## [1.1.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-nodejs-function-runtime-provider@1.1.0...amplify-nodejs-function-runtime-provider@1.1.1) (2020-07-23)


### Bug Fixes

* support large payload in Node.js functions ([#4906](https://github.com/aws-amplify/amplify-cli/issues/4906)) ([2945996](https://github.com/aws-amplify/amplify-cli/commit/2945996eae87462bfd09452e1966604015397a2f))





# [1.1.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-nodejs-function-runtime-provider@1.0.6...amplify-nodejs-function-runtime-provider@1.1.0) (2020-07-07)


### Features

* Lambda layers ([#4697](https://github.com/aws-amplify/amplify-cli/issues/4697)) ([c55b2e0](https://github.com/aws-amplify/amplify-cli/commit/c55b2e0c3377127aaf887591d7bc20d7240ef11d))





## [1.0.6](https://github.com/aws-amplify/amplify-cli/compare/amplify-nodejs-function-runtime-provider@1.0.5...amplify-nodejs-function-runtime-provider@1.0.6) (2020-06-25)


### Bug Fixes

* nodejs staleBuild glob ([#4499](https://github.com/aws-amplify/amplify-cli/issues/4499)) ([bcabc52](https://github.com/aws-amplify/amplify-cli/commit/bcabc528dc79ebfcd128b7e216e889dc61dd38be))





## [1.0.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-nodejs-function-runtime-provider@1.0.4...amplify-nodejs-function-runtime-provider@1.0.5) (2020-06-10)


### Bug Fixes

* **amplify-nodejs-function-runtime-provider:** unhandled errors ([#4418](https://github.com/aws-amplify/amplify-cli/issues/4418)) ([d28083b](https://github.com/aws-amplify/amplify-cli/commit/d28083b83a4a301980affe5aedef316374f39508))





## [1.0.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-nodejs-function-runtime-provider@1.0.3...amplify-nodejs-function-runtime-provider@1.0.4) (2020-05-15)


### Bug Fixes

* **amplify-util-mock:** non-promise lambda failing ([#4203](https://github.com/aws-amplify/amplify-cli/issues/4203)) ([cb533c6](https://github.com/aws-amplify/amplify-cli/commit/cb533c69aaddd6d2f38a7152f4471f2074cd8198))





## [1.0.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-nodejs-function-runtime-provider@1.0.2...amplify-nodejs-function-runtime-provider@1.0.3) (2020-05-08)

**Note:** Version bump only for package amplify-nodejs-function-runtime-provider





## [1.0.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-nodejs-function-runtime-provider@1.0.1...amplify-nodejs-function-runtime-provider@1.0.2) (2020-04-23)


### Bug Fixes

* pass deserialized obj to node lambda when mocking ([#3895](https://github.com/aws-amplify/amplify-cli/issues/3895)) ([c5a1891](https://github.com/aws-amplify/amplify-cli/commit/c5a1891f218e23434fec3516d845958fddf416d8))





## 1.0.1 (2020-04-06)


### Bug Fixes

* dotnet fucntion provider fixes, package.json cleanup, add pkg refs ([#3826](https://github.com/aws-amplify/amplify-cli/issues/3826)) ([75361fb](https://github.com/aws-amplify/amplify-cli/commit/75361fb266f15ba954a8b8e935874c74f66eb11a))
* rename node pluign packages ([#3788](https://github.com/aws-amplify/amplify-cli/issues/3788)) ([7b1f0f2](https://github.com/aws-amplify/amplify-cli/commit/7b1f0f2c7bb67a9d154e8462643fb0fe35e88399))
