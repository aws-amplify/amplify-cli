# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.43.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.42.0...amplify-e2e-tests@2.43.0) (2021-06-24)



## 5.0.2 (2021-06-23)


### Bug Fixes

* e2e test for import auth headless ([#7593](https://github.com/aws-amplify/amplify-cli/issues/7593)) ([814e2c4](https://github.com/aws-amplify/amplify-cli/commit/814e2c49e1686696f57a9cee71d0a7e2a239b489))
* file path for Pipfile.lock for python layer globbing, add e2e tests ([#7577](https://github.com/aws-amplify/amplify-cli/issues/7577)) ([e8250af](https://github.com/aws-amplify/amplify-cli/commit/e8250afa0c0ae45d6379f2ad260d32bfb8cad3dc))
* includes getAtt to maintain dependency in root stack ([#7392](https://github.com/aws-amplify/amplify-cli/issues/7392)) ([d24b44a](https://github.com/aws-amplify/amplify-cli/commit/d24b44a4731e407fac0391817e851314f1bb13f8))
* **graphql-transformer-common:** improve generated graphql pluralization ([#7258](https://github.com/aws-amplify/amplify-cli/issues/7258)) ([fc3ad0d](https://github.com/aws-amplify/amplify-cli/commit/fc3ad0dd5a12a7912c59ae12024f593b4cdf7f2d)), closes [#4224](https://github.com/aws-amplify/amplify-cli/issues/4224)
* support adding REST API paths in 'add api' ([#7229](https://github.com/aws-amplify/amplify-cli/issues/7229)) ([fa9404a](https://github.com/aws-amplify/amplify-cli/commit/fa9404afd1eedd342ea6ff2033fcbd143b33748a))


### Features

* **import-auth:** add headless support ([#7266](https://github.com/aws-amplify/amplify-cli/issues/7266)) ([7fa478b](https://github.com/aws-amplify/amplify-cli/commit/7fa478bbfebbbe70e286eb19d436d772c32c4fd2))





# [2.42.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.41.0...amplify-e2e-tests@2.42.0) (2021-06-15)



# 5.0.0 (2021-06-14)


### Bug Fixes

* copy env specific data from ccb on env checkout ([#7512](https://github.com/aws-amplify/amplify-cli/issues/7512)) ([bef6d9c](https://github.com/aws-amplify/amplify-cli/commit/bef6d9c5d1fd7e12bbacaf20639c00334d285517))


### Features

* add support for defining IAM Permissions Boundary for Project ([#7144](https://github.com/aws-amplify/amplify-cli/issues/7144)) ([acf031b](https://github.com/aws-amplify/amplify-cli/commit/acf031b29d4e554d647da39ffb8293010cf1d8ad))
* Define IAM Permissions Boundary for Project ([#7502](https://github.com/aws-amplify/amplify-cli/issues/7502)) (ref [#4618](https://github.com/aws-amplify/amplify-cli/issues/4618)) ([08f7a3c](https://github.com/aws-amplify/amplify-cli/commit/08f7a3c45b2e98535ef325eb0a97c5bc4d3008c6)), closes [#7053](https://github.com/aws-amplify/amplify-cli/issues/7053)
* lambda layers rework ([#7375](https://github.com/aws-amplify/amplify-cli/issues/7375)) ([a3b7d3e](https://github.com/aws-amplify/amplify-cli/commit/a3b7d3e427e16bac2b2ea27699fe53b48cf47656))


### Reverts

* Revert "feat: add support for defining IAM Permissions Boundary for Project (#7144)" (#7453) ([08704f0](https://github.com/aws-amplify/amplify-cli/commit/08704f0271f6f5d0e0e98ad7002f4b35c3890924)), closes [#7144](https://github.com/aws-amplify/amplify-cli/issues/7144) [#7453](https://github.com/aws-amplify/amplify-cli/issues/7453)





# [2.41.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.40.3...amplify-e2e-tests@2.41.0) (2021-06-02)



# 4.52.0 (2021-06-01)


### Features

* add support for SMS Sandbox ([#7436](https://github.com/aws-amplify/amplify-cli/issues/7436)) ([cdcb626](https://github.com/aws-amplify/amplify-cli/commit/cdcb6260c11bbedef5b056fdcd730612d8bb3230))





## [2.40.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.40.2...amplify-e2e-tests@2.40.3) (2021-05-26)

**Note:** Version bump only for package amplify-e2e-tests





## [2.40.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.40.1...amplify-e2e-tests@2.40.2) (2021-05-22)

**Note:** Version bump only for package amplify-e2e-tests





## [2.40.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.40.0...amplify-e2e-tests@2.40.1) (2021-05-18)



## 4.51.1 (2021-05-18)

**Note:** Version bump only for package amplify-e2e-tests





# [2.40.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.39.2...amplify-e2e-tests@2.40.0) (2021-05-14)


### Features

* defer root stack creation to first `amplify push` ([#7174](https://github.com/aws-amplify/amplify-cli/issues/7174)) ([d28dd1c](https://github.com/aws-amplify/amplify-cli/commit/d28dd1caca86b19a858dab0e7aa907d1cc74c86a))
* Support for Apple Sign In ([#7265](https://github.com/aws-amplify/amplify-cli/issues/7265)) ([9f5e659](https://github.com/aws-amplify/amplify-cli/commit/9f5e659d63362c7f47eaa147c68d40d5bcc36fcc))


### Reverts

* Revert "feat: defer root stack creation to first `amplify push` (#7174)" (#7306) ([78854eb](https://github.com/aws-amplify/amplify-cli/commit/78854ebd4a3d41d34d68736d6556045302101265)), closes [#7174](https://github.com/aws-amplify/amplify-cli/issues/7174) [#7306](https://github.com/aws-amplify/amplify-cli/issues/7306)





## [2.39.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.39.0...amplify-e2e-tests@2.39.2) (2021-05-03)



## 4.50.1 (2021-05-03)


### Bug Fixes

* ensure policy resource name when pushing REST APIs ([#7192](https://github.com/aws-amplify/amplify-cli/issues/7192)) ([fc77006](https://github.com/aws-amplify/amplify-cli/commit/fc77006d8f41301604fc4047edf794c23da6c552))





## [2.39.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.39.0...amplify-e2e-tests@2.39.1) (2021-05-03)


### Bug Fixes

* ensure policy resource name when pushing REST APIs ([#7192](https://github.com/aws-amplify/amplify-cli/issues/7192)) ([fc77006](https://github.com/aws-amplify/amplify-cli/commit/fc77006d8f41301604fc4047edf794c23da6c552))





# [2.39.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.38.3...amplify-e2e-tests@2.39.0) (2021-04-27)


### Bug Fixes

* consolidate REST API IAM policies ([#6904](https://github.com/aws-amplify/amplify-cli/issues/6904)) (ref [#2084](https://github.com/aws-amplify/amplify-cli/issues/2084)) ([5cfff17](https://github.com/aws-amplify/amplify-cli/commit/5cfff173d57ec9ab68984faf2d0f6474eccdcaae))
* remove unused import ([#7134](https://github.com/aws-amplify/amplify-cli/issues/7134)) ([275955f](https://github.com/aws-amplify/amplify-cli/commit/275955f7e2cc808bccacb5957c89e281272f6a73))


### Features

* S3 SSE by default ([#7039](https://github.com/aws-amplify/amplify-cli/issues/7039)) (ref [#5708](https://github.com/aws-amplify/amplify-cli/issues/5708)) ([c1369ed](https://github.com/aws-amplify/amplify-cli/commit/c1369ed6f9c204c89ee2d4c805314a40d6eeaf92))





## [2.38.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.38.2...amplify-e2e-tests@2.38.3) (2021-04-19)


### Bug Fixes

* fix iterative delete for all objects and delete directory ([#7093](https://github.com/aws-amplify/amplify-cli/issues/7093)) ([189a826](https://github.com/aws-amplify/amplify-cli/commit/189a8260b25363caed3ab1f48b1fd9b7f4e4f829))
* render spinner in stateChange update e2e to wait on spinner text ([#7116](https://github.com/aws-amplify/amplify-cli/issues/7116)) ([a46f2a3](https://github.com/aws-amplify/amplify-cli/commit/a46f2a32ec9bf9e75684bc93a2e7089ac3fb894d))





## [2.38.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.38.1...amplify-e2e-tests@2.38.2) (2021-04-14)

**Note:** Version bump only for package amplify-e2e-tests





## [2.38.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.37.1...amplify-e2e-tests@2.38.1) (2021-04-09)


### Bug Fixes

* **amplify-category-auth:** add lambda with AdminQueries API permissions ([#6935](https://github.com/aws-amplify/amplify-cli/issues/6935)) ([756b0f7](https://github.com/aws-amplify/amplify-cli/commit/756b0f70e3b060a4603290c0ab1ff7e3033d6021)), closes [#6576](https://github.com/aws-amplify/amplify-cli/issues/6576)
* **cli:** use more inclusive language ([#6919](https://github.com/aws-amplify/amplify-cli/issues/6919)) ([bb70464](https://github.com/aws-amplify/amplify-cli/commit/bb70464d6c24fa931c0eb80d234a496d936913f5))





## [2.37.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.37.0...amplify-e2e-tests@2.37.1) (2021-03-24)


### Reverts

* Revert "Init and Configure DX changes (#6745)" ([9078b69](https://github.com/aws-amplify/amplify-cli/commit/9078b69b5842c99f0624797a5e897353bacb65d0)), closes [#6745](https://github.com/aws-amplify/amplify-cli/issues/6745)





# [2.37.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.36.1...amplify-e2e-tests@2.37.0) (2021-03-23)



# 4.46.0 (2021-03-20)


### Bug Fixes

* adding JSON stringify to example python function ([#6493](https://github.com/aws-amplify/amplify-cli/issues/6493)) ([a6584e2](https://github.com/aws-amplify/amplify-cli/commit/a6584e2920764be10108a799d93222e3c3397ef1)), closes [/github.com/aws-amplify/amplify-js/issues/6390#issuecomment-740757548](https://github.com//github.com/aws-amplify/amplify-js/issues/6390/issues/issuecomment-740757548)
* **amplify-category-api:** mantain ff in iam api policy ([#6723](https://github.com/aws-amplify/amplify-cli/issues/6723)) ([51e5e1b](https://github.com/aws-amplify/amplify-cli/commit/51e5e1b53514a05788dd824a48991c0db0b9705d)), closes [#6675](https://github.com/aws-amplify/amplify-cli/issues/6675)
* stop sanity check when resource is in create status ([#6349](https://github.com/aws-amplify/amplify-cli/issues/6349)) ([45e0246](https://github.com/aws-amplify/amplify-cli/commit/45e0246306136e513c735899b030f94bb004a330))


### Features

* **amplify-e2e-tests:** removed json stringify ([#6920](https://github.com/aws-amplify/amplify-cli/issues/6920)) ([3f3bc24](https://github.com/aws-amplify/amplify-cli/commit/3f3bc24d60693c9093c21e8f5a2df20f4e3d084f))





## [2.36.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.36.0...amplify-e2e-tests@2.36.1) (2021-03-11)

**Note:** Version bump only for package amplify-e2e-tests





# [2.36.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.35.0...amplify-e2e-tests@2.36.0) (2021-03-05)



# 4.45.0 (2021-03-05)


### Bug Fixes

* pull issue with multi-env notifications [#6475](https://github.com/aws-amplify/amplify-cli/issues/6475) ([#6525](https://github.com/aws-amplify/amplify-cli/issues/6525)) ([b0803d1](https://github.com/aws-amplify/amplify-cli/commit/b0803d1a361c15db8ad6e32648f29402539aa2e4))


### Features

* generate datastore models for Admin CMS to consume post-deployment from CLI ([#6771](https://github.com/aws-amplify/amplify-cli/issues/6771)) ([0e74b65](https://github.com/aws-amplify/amplify-cli/commit/0e74b657491e53eb04376bb727eb442b59b2cf4c))
* remove OAuth prompt from pull and new env ([#6739](https://github.com/aws-amplify/amplify-cli/issues/6739)) ([8ff15a6](https://github.com/aws-amplify/amplify-cli/commit/8ff15a6ea2c3c687f0344fb4e17547097cd575ea))





# [2.35.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.34.3...amplify-e2e-tests@2.35.0) (2021-02-26)


### Features

* **graphql-key-transformer:** only modify GSI sort key when present ([#6742](https://github.com/aws-amplify/amplify-cli/issues/6742)) ([7cbd396](https://github.com/aws-amplify/amplify-cli/commit/7cbd39632181a5bc323ac3ad3a835a358c74adf6))





## [2.34.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.34.2...amplify-e2e-tests@2.34.3) (2021-02-24)

**Note:** Version bump only for package amplify-e2e-tests





## [2.34.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.34.1...amplify-e2e-tests@2.34.2) (2021-02-17)


### Bug Fixes

* mock bug fixes and e2e test updates ([#6626](https://github.com/aws-amplify/amplify-cli/issues/6626)) ([af76446](https://github.com/aws-amplify/amplify-cli/commit/af76446d18bf626ca5f91c3ad41081175c959807))





## [2.34.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.34.0...amplify-e2e-tests@2.34.1) (2021-02-11)



# 4.43.0 (2021-02-11)


### Reverts

* Revert "chore: update amplify lib version (#6544)" (#6597) ([819a749](https://github.com/aws-amplify/amplify-cli/commit/819a74917ff1f8c1e9b66fea0a06338884d52b24)), closes [#6544](https://github.com/aws-amplify/amplify-cli/issues/6544) [#6597](https://github.com/aws-amplify/amplify-cli/issues/6597)





# [2.34.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.33.4...amplify-e2e-tests@2.34.0) (2021-02-10)


### Bug Fixes

* appclient secret output default to false ([#6333](https://github.com/aws-amplify/amplify-cli/issues/6333)) ([3da53b7](https://github.com/aws-amplify/amplify-cli/commit/3da53b7c9aacf718ebd8ea63e59928425af20764))
* **amplify-provider-awscloudformation:** fix hosting output ([#6041](https://github.com/aws-amplify/amplify-cli/issues/6041)) ([a2c1577](https://github.com/aws-amplify/amplify-cli/commit/a2c15774762c0f07b44ca9c91c57ef4eb3752f2b)), closes [#402](https://github.com/aws-amplify/amplify-cli/issues/402)
* **amplify-provider-awscloudformation:** use prev deployment vars ([#6486](https://github.com/aws-amplify/amplify-cli/issues/6486)) ([39dfd27](https://github.com/aws-amplify/amplify-cli/commit/39dfd271bcf86b0ec424bb89c0bb38c0544d8d80))
* check --yes flag instead of CI env vars, clean up test imports ([#6541](https://github.com/aws-amplify/amplify-cli/issues/6541)) ([989624e](https://github.com/aws-amplify/amplify-cli/commit/989624e8cba524d989982a7389cd43eb8dcd8760))
* enables cors support for lambda proxy integrations for python ([#6477](https://github.com/aws-amplify/amplify-cli/issues/6477)) ([44d1ce3](https://github.com/aws-amplify/amplify-cli/commit/44d1ce34786b6d1161d48332d7d026414a126c89))
* fix appsync permission assignment from functions ([#5342](https://github.com/aws-amplify/amplify-cli/issues/5342)) ([b2e2dd0](https://github.com/aws-amplify/amplify-cli/commit/b2e2dd0071c1a451ba032cf7f8cfe7cf6381a96e))
* persist s3bucket metadata on pull and env change ([#6502](https://github.com/aws-amplify/amplify-cli/issues/6502)) ([357f787](https://github.com/aws-amplify/amplify-cli/commit/357f787c2d816e1defa1d0909b06f82775c35255))
* support choosing AWS authentication flow when admin UI is enabled ([#6433](https://github.com/aws-amplify/amplify-cli/issues/6433)) ([3bf56a8](https://github.com/aws-amplify/amplify-cli/commit/3bf56a8e2e5be67dd861a55807ecc94bd561b4a2))
* update list bucket policies for s3 triggers ([#6497](https://github.com/aws-amplify/amplify-cli/issues/6497)) ([b09ccf0](https://github.com/aws-amplify/amplify-cli/commit/b09ccf0cd871eba6ca7e211846bde8d18d4b4b0f))


### Features

* add support for importing userpool with no appclient secret ([#6404](https://github.com/aws-amplify/amplify-cli/issues/6404)) ([4ce4138](https://github.com/aws-amplify/amplify-cli/commit/4ce413829f14aa90ca9ca27510249f1c6c39909f)), closes [#6333](https://github.com/aws-amplify/amplify-cli/issues/6333)
* provide tags on create app ([#6381](https://github.com/aws-amplify/amplify-cli/issues/6381)) ([0530d1a](https://github.com/aws-amplify/amplify-cli/commit/0530d1af0e1c46bac45da2c0185d213058a28849))


### Reverts

* Revert "feat: provide tags on create app (#6381)" (#6456) ([5789b26](https://github.com/aws-amplify/amplify-cli/commit/5789b26036c4e93f569669e25c3cf2637b4abdb8)), closes [#6381](https://github.com/aws-amplify/amplify-cli/issues/6381) [#6456](https://github.com/aws-amplify/amplify-cli/issues/6456)





## [2.33.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.33.3...amplify-e2e-tests@2.33.4) (2021-01-08)


### Bug Fixes

* removes nodeModules from currentCloudBackend ([#6261](https://github.com/aws-amplify/amplify-cli/issues/6261)) ([db9dca9](https://github.com/aws-amplify/amplify-cli/commit/db9dca9db019494a0c68f42d9ffeb92d0b9b2b43))





## [2.33.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.33.2...amplify-e2e-tests@2.33.3) (2020-12-31)



# 4.41.0 (2020-12-30)

**Note:** Version bump only for package amplify-e2e-tests





## [2.33.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.33.1...amplify-e2e-tests@2.33.2) (2020-12-21)

**Note:** Version bump only for package amplify-e2e-tests





## [2.33.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.33.0...amplify-e2e-tests@2.33.1) (2020-12-16)


### Bug Fixes

* **graphql-transformer-core:** fix gsi mutate san check ([#6095](https://github.com/aws-amplify/amplify-cli/issues/6095)) ([37d08d9](https://github.com/aws-amplify/amplify-cli/commit/37d08d941421fe030bb454e7f417b3198a4b04ac)), closes [#6013](https://github.com/aws-amplify/amplify-cli/issues/6013)





# [2.33.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.32.0...amplify-e2e-tests@2.33.0) (2020-12-11)


### Features

* container-based deployments([#5727](https://github.com/aws-amplify/amplify-cli/issues/5727)) ([fad6377](https://github.com/aws-amplify/amplify-cli/commit/fad6377bd384862ca4429cb1a83eee90efd62b58))





# [2.32.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.31.0...amplify-e2e-tests@2.32.0) (2020-12-07)



# 4.38.0 (2020-12-05)


### Bug Fixes

* added CORS headers to allow all type ([#6027](https://github.com/aws-amplify/amplify-cli/issues/6027)) ([74debca](https://github.com/aws-amplify/amplify-cli/commit/74debca39a4222b18bfbaddb872013b60da785de))
* update snapshot ([#6074](https://github.com/aws-amplify/amplify-cli/issues/6074)) ([747d290](https://github.com/aws-amplify/amplify-cli/commit/747d2902917ab75aed082dd8094de4c11c37fc3e))


### Features

* add support for multiple [@key](https://github.com/key) changes in same [@model](https://github.com/model) ([#6044](https://github.com/aws-amplify/amplify-cli/issues/6044)) ([e574637](https://github.com/aws-amplify/amplify-cli/commit/e5746379ea1330c53dacb55e8f6a9de7b17b55ae))





# [2.31.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.30.2...amplify-e2e-tests@2.31.0) (2020-11-30)


### Features

* pre-deploy pull, new login mechanism and pkg cli updates ([#5941](https://github.com/aws-amplify/amplify-cli/issues/5941)) ([7274251](https://github.com/aws-amplify/amplify-cli/commit/7274251faadc1035acce5f44699b172e10e2e67d))





## [2.30.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.30.1...amplify-e2e-tests@2.30.2) (2020-11-28)


### Reverts

* "fix: remove app client secret as best practice" ([#5992](https://github.com/aws-amplify/amplify-cli/issues/5992)) ([d7d7fcf](https://github.com/aws-amplify/amplify-cli/commit/d7d7fcf65fb2928f5d97c2ada9fac8ebf3522ee0)), closes [#5731](https://github.com/aws-amplify/amplify-cli/issues/5731) [#5829](https://github.com/aws-amplify/amplify-cli/issues/5829)





## [2.30.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.30.0...amplify-e2e-tests@2.30.1) (2020-11-27)

**Note:** Version bump only for package amplify-e2e-tests





# [2.30.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.29.1...amplify-e2e-tests@2.30.0) (2020-11-26)


### Features

* **amplify-frontend-flutter:** adds api construction to flutter ([#5955](https://github.com/aws-amplify/amplify-cli/issues/5955)) ([3d69c12](https://github.com/aws-amplify/amplify-cli/commit/3d69c12a26001cc3d9d9be10dee5520797ff7602))





## [2.29.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.29.0...amplify-e2e-tests@2.29.1) (2020-11-24)

**Note:** Version bump only for package amplify-e2e-tests





# [2.29.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.27.3...amplify-e2e-tests@2.29.0) (2020-11-22)


### Bug Fixes

* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))


### Features

* storage import ([#5893](https://github.com/aws-amplify/amplify-cli/issues/5893)) ([ad7b028](https://github.com/aws-amplify/amplify-cli/commit/ad7b028330bcee64d5124be7f27a8494dc8e9400))



## 4.32.1-alpha.0 (2020-11-11)


### Bug Fixes

* **graphql-transformer-core:** fix gsi update sanity check ([#5776](https://github.com/aws-amplify/amplify-cli/issues/5776)) ([b82a3e5](https://github.com/aws-amplify/amplify-cli/commit/b82a3e5a5deb432e7283b902c8abe90dc27f0f46))





# [2.28.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.6.2...amplify-e2e-tests@2.28.0) (2020-11-22)


### Bug Fixes

* amplify e2e test deps,lint,cleanup,standardize ([#2850](https://github.com/aws-amplify/amplify-cli/issues/2850)) ([cf888f3](https://github.com/aws-amplify/amplify-cli/commit/cf888f3da1acde6be4d2bfcb40f15587005c62f9))
* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))
* **graphql-transformer-core:** fix gsi update sanity check ([#5776](https://github.com/aws-amplify/amplify-cli/issues/5776)) ([b82a3e5](https://github.com/aws-amplify/amplify-cli/commit/b82a3e5a5deb432e7283b902c8abe90dc27f0f46))
* sync resolver for mock ([#5684](https://github.com/aws-amplify/amplify-cli/issues/5684)) ([80e2cd4](https://github.com/aws-amplify/amplify-cli/commit/80e2cd44bde1021d4415c6c3b670f44ec1bcae3c))
* update current-cloud backend-config on resource removal ([#5658](https://github.com/aws-amplify/amplify-cli/issues/5658)) ([592f694](https://github.com/aws-amplify/amplify-cli/commit/592f694530dd61302ff790fbcf5b3ea135812c47))
* **amplify-app:** initialize feature flag  ([#5643](https://github.com/aws-amplify/amplify-cli/issues/5643)) ([9608b56](https://github.com/aws-amplify/amplify-cli/commit/9608b5616c2b92417a1b559f41f5d3f8f42f97e5))
* **amplify-category-auth:** fix auth console ([#5408](https://github.com/aws-amplify/amplify-cli/issues/5408)) ([afbe065](https://github.com/aws-amplify/amplify-cli/commit/afbe065757ce488c1769848d0db3d03465a9b6c9)), closes [#5364](https://github.com/aws-amplify/amplify-cli/issues/5364)
* **amplify-category-function:** fix update permission bug ([#5421](https://github.com/aws-amplify/amplify-cli/issues/5421)) ([f1194fd](https://github.com/aws-amplify/amplify-cli/commit/f1194fdd0aacbd2c316545422ad5e659d7042118)), closes [#5333](https://github.com/aws-amplify/amplify-cli/issues/5333)
* **amplify-codegen-appsync-model-plugin:** generate nullable types for list ([#5493](https://github.com/aws-amplify/amplify-cli/issues/5493)) ([8b5043c](https://github.com/aws-amplify/amplify-cli/commit/8b5043c9e26ecb157ea3159e4e13dae097215301))
* **cli:** fixed projName and envName ([#5400](https://github.com/aws-amplify/amplify-cli/issues/5400)) ([8c18418](https://github.com/aws-amplify/amplify-cli/commit/8c184180a69755acc7ed87f03b40e07e231de245)), closes [#5399](https://github.com/aws-amplify/amplify-cli/issues/5399)
* [#4950](https://github.com/aws-amplify/amplify-cli/issues/4950) amplify cli fails with checked in local settings ([#4959](https://github.com/aws-amplify/amplify-cli/issues/4959)) ([ba0529a](https://github.com/aws-amplify/amplify-cli/commit/ba0529ac358b6f6028c6dbc4235def312f4625be))
* [#5354](https://github.com/aws-amplify/amplify-cli/issues/5354) .net core lambda project file naming ([#5414](https://github.com/aws-amplify/amplify-cli/issues/5414)) ([c0f1953](https://github.com/aws-amplify/amplify-cli/commit/c0f1953acaca33eb0228e1528eb5ac4eb183ff6d))
* /opt folder should be packaged at the root of the zipped dir ([#4835](https://github.com/aws-amplify/amplify-cli/issues/4835)) ([ec8199c](https://github.com/aws-amplify/amplify-cli/commit/ec8199c5ae8d4eda504d5bad2b30567a5e2b4810))
* e2e regressions from previous pr ([#5438](https://github.com/aws-amplify/amplify-cli/issues/5438)) ([398d98b](https://github.com/aws-amplify/amplify-cli/commit/398d98b6a57c41f5172d6b56e9a834cfd28b891b))
* refactor amplify.json file handling ([#5282](https://github.com/aws-amplify/amplify-cli/issues/5282)) ([a6269f3](https://github.com/aws-amplify/amplify-cli/commit/a6269f3177f3242df81e9d7dce0625295bb7a9fc))
* **amplify-category-storage:** fix storage update ([#5191](https://github.com/aws-amplify/amplify-cli/issues/5191)) ([754f122](https://github.com/aws-amplify/amplify-cli/commit/754f12201c07132ff6c9e7ef88f4c567cdc6302d)), closes [#5124](https://github.com/aws-amplify/amplify-cli/issues/5124)
* **amplify-provider-awscloudformation:** validate config input ([#5307](https://github.com/aws-amplify/amplify-cli/issues/5307)) ([5a324b2](https://github.com/aws-amplify/amplify-cli/commit/5a324b2ab015c0be8fe83d937325a38470c46c2d)), closes [#4998](https://github.com/aws-amplify/amplify-cli/issues/4998)
* Added check to stop prompts for cognito triggers while using env commands ([#5039](https://github.com/aws-amplify/amplify-cli/issues/5039)) ([744dbc4](https://github.com/aws-amplify/amplify-cli/commit/744dbc42e847e273160caf3672365391f055191b))
* function update no longer removes dependsOn array implicitly ([#4938](https://github.com/aws-amplify/amplify-cli/issues/4938)) ([200bbcb](https://github.com/aws-amplify/amplify-cli/commit/200bbcbda4439a144dc299355ea51c5ffd124594))
* populate API_KEY env var when present ([#4923](https://github.com/aws-amplify/amplify-cli/issues/4923)) ([81231f9](https://github.com/aws-amplify/amplify-cli/commit/81231f98305dd9e37bb64eb30a9c7307bb471ad9))
* return undefined for empty conflict resolution ([#4982](https://github.com/aws-amplify/amplify-cli/issues/4982)) ([7c5bf1a](https://github.com/aws-amplify/amplify-cli/commit/7c5bf1a36078a345d80ecbf2cea3a067ae1137e1)), closes [#4965](https://github.com/aws-amplify/amplify-cli/issues/4965)
* Validation check when mutating more than 1 GSI in update flow ([#5141](https://github.com/aws-amplify/amplify-cli/issues/5141)) ([4faaba0](https://github.com/aws-amplify/amplify-cli/commit/4faaba0509467aad03db11709175f4a3071459ae))
* **amplify-category-api:** toggle datastore in update ([#4276](https://github.com/aws-amplify/amplify-cli/issues/4276)) ([4f02a62](https://github.com/aws-amplify/amplify-cli/commit/4f02a62f5c8929cabe914e2e38fb28dc535d2d61)), closes [#4058](https://github.com/aws-amplify/amplify-cli/issues/4058)
* **amplify-category-auth:** adding unique Id to Role name ([#4231](https://github.com/aws-amplify/amplify-cli/issues/4231)) ([21de1af](https://github.com/aws-amplify/amplify-cli/commit/21de1affd89142598a1f8022c387b3c04994b1e0))
* **amplify-e2e-tests:** add .NET template and remove ddb uuid ([#3958](https://github.com/aws-amplify/amplify-cli/issues/3958)) ([70b5edc](https://github.com/aws-amplify/amplify-cli/commit/70b5edc2b50b4e0ceb33956852cb5eb834a8016b))
* **amplify-provider-awscloudformation:** check before fetching backend ([#3848](https://github.com/aws-amplify/amplify-cli/issues/3848)) ([39be355](https://github.com/aws-amplify/amplify-cli/commit/39be3552f7f408dad02c2701a01f170be9badbb7))
* **amplify-provider-awscloudformation:** fix bug for no credential file ([#4310](https://github.com/aws-amplify/amplify-cli/issues/4310)) ([2b941e0](https://github.com/aws-amplify/amplify-cli/commit/2b941e03e24a9589a332d3aa6b2897626a17ca1d)), closes [#4284](https://github.com/aws-amplify/amplify-cli/issues/4284)
* **amplify-provider-awscloudformation:** Stack delete condition ([#4465](https://github.com/aws-amplify/amplify-cli/issues/4465)) ([018bbab](https://github.com/aws-amplify/amplify-cli/commit/018bbabab02389f28b9c8e2ea83faacce47c5eb4))
* **cli:** add information on pre/post pull in learn more ([#3880](https://github.com/aws-amplify/amplify-cli/issues/3880)) ([b40867f](https://github.com/aws-amplify/amplify-cli/commit/b40867f148454d8d87a619d67e1df2e6a6f982dc))
* **cli:** fixes issues for missing build or start command ([#3918](https://github.com/aws-amplify/amplify-cli/issues/3918)) ([25c53ce](https://github.com/aws-amplify/amplify-cli/commit/25c53ce81a74c3f706f60b0519eda0a4338edbf7)), closes [#3728](https://github.com/aws-amplify/amplify-cli/issues/3728) [#3806](https://github.com/aws-amplify/amplify-cli/issues/3806)
* **graphql-mapping-template:** fix [@key](https://github.com/key) issue when datastore enabled ([#5175](https://github.com/aws-amplify/amplify-cli/issues/5175)) ([d58c4aa](https://github.com/aws-amplify/amplify-cli/commit/d58c4aa6ba07859a6fec250df281649bb17548e9)), closes [#4355](https://github.com/aws-amplify/amplify-cli/issues/4355)
* add AttributeTypeEnum for connections on models with no codegen ([#4102](https://github.com/aws-amplify/amplify-cli/issues/4102)) ([4e92402](https://github.com/aws-amplify/amplify-cli/commit/4e92402e0b0fae30501972f3ad16203fc19ba287))
* build break, chore: typescript, lerna update ([#2640](https://github.com/aws-amplify/amplify-cli/issues/2640)) ([29fae36](https://github.com/aws-amplify/amplify-cli/commit/29fae366f4cab054feefa58c7dc733002d19570c))
* check for unavailable bucket ([#3972](https://github.com/aws-amplify/amplify-cli/issues/3972)) ([de9c4c4](https://github.com/aws-amplify/amplify-cli/commit/de9c4c461351352694d81d9e7b2f9044b1a9a2c4))
* e2e failures ([#3856](https://github.com/aws-amplify/amplify-cli/issues/3856)) ([26ff656](https://github.com/aws-amplify/amplify-cli/commit/26ff6563a787abe87ee7d85309f1064e8b55f6b0))
* e2e fixes and circle ci install change ([#3838](https://github.com/aws-amplify/amplify-cli/issues/3838)) ([b646f53](https://github.com/aws-amplify/amplify-cli/commit/b646f539c90184be44dbd557c176a8c96d092db9))
* e2e init and prediction test failures ([#4195](https://github.com/aws-amplify/amplify-cli/issues/4195)) ([2ea6a42](https://github.com/aws-amplify/amplify-cli/commit/2ea6a42829086d0c6ab10acd77cbbd0fc9320938))
* e2e test failures after merge ([#2240](https://github.com/aws-amplify/amplify-cli/issues/2240)) ([d828c6c](https://github.com/aws-amplify/amplify-cli/commit/d828c6c182e7417367a3aea4f11d257aef8888d8))
* e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
* e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
* export Typescript definitions and fix resulting type errors ([#2452](https://github.com/aws-amplify/amplify-cli/issues/2452)) ([7de3845](https://github.com/aws-amplify/amplify-cli/commit/7de384594d3b9cbf22cdaa85107fc8df26c141ec)), closes [#2451](https://github.com/aws-amplify/amplify-cli/issues/2451)
* fix java local invoker and api e2e tests ([#3855](https://github.com/aws-amplify/amplify-cli/issues/3855)) ([93af865](https://github.com/aws-amplify/amplify-cli/commit/93af8651d4bedca0b8d08e778a74dc47230d5988))
* fixing name of nodej function provider plugin name ([7e27785](https://github.com/aws-amplify/amplify-cli/commit/7e27785e9d4208d8e0d0674f1f1644e670139a86))
* increase kinesis and cloudwatch sleeps ([#3859](https://github.com/aws-amplify/amplify-cli/issues/3859)) ([4971f51](https://github.com/aws-amplify/amplify-cli/commit/4971f517f71cf5b1d66e6937d26b6c5286569202))
* remove duplicate env vars in top level comment ([#3894](https://github.com/aws-amplify/amplify-cli/issues/3894)) fixes [#3744](https://github.com/aws-amplify/amplify-cli/issues/3744) ([d586863](https://github.com/aws-amplify/amplify-cli/commit/d586863aabcb1ad2fc4d8ee1bd0e693a4d86d0ea))
* **amplify-category-analytics:** delete pinpoint project in delete ([#3165](https://github.com/aws-amplify/amplify-cli/issues/3165)) ([acc0240](https://github.com/aws-amplify/amplify-cli/commit/acc0240c02630b4b9424370732706955ea447057)), closes [#2974](https://github.com/aws-amplify/amplify-cli/issues/2974)
* **amplify-category-auth:** fixed issue with updating urls in auth ([#3791](https://github.com/aws-amplify/amplify-cli/issues/3791)) ([236cd7a](https://github.com/aws-amplify/amplify-cli/commit/236cd7aecbdc2cbbb0dc9c565aae4e79ff40ebae))
* **amplify-e2e-tests:** fix failing api e2e tests ([#3827](https://github.com/aws-amplify/amplify-cli/issues/3827)) ([f676b8d](https://github.com/aws-amplify/amplify-cli/commit/f676b8d433ab5d5ecec664af27a07ecee83fa9f6))
* add configuration.json placeholders ([#3508](https://github.com/aws-amplify/amplify-cli/issues/3508)) ([44265c4](https://github.com/aws-amplify/amplify-cli/commit/44265c439d4b7764ff52ab5b82f5fd1c88af799e))
* fix project template ([#3589](https://github.com/aws-amplify/amplify-cli/issues/3589)) ([0c11afc](https://github.com/aws-amplify/amplify-cli/commit/0c11afc476e5c6bb8bbf6e84bd1b7e7e688eed3b))
* fixing plugin e2e tests ([#3588](https://github.com/aws-amplify/amplify-cli/issues/3588)) ([10d831f](https://github.com/aws-amplify/amplify-cli/commit/10d831f1dcb330fbb9e06a9aaf16ecef05c30e51))
* update function e2e tests with new template orderings ([#3817](https://github.com/aws-amplify/amplify-cli/issues/3817)) ([dfb910d](https://github.com/aws-amplify/amplify-cli/commit/dfb910ddccbd15df48801efce94d1fbf5822fb9e))
* **amplify-provider-awscloudformation:** fixed deletion for large bucket ([#3656](https://github.com/aws-amplify/amplify-cli/issues/3656)) ([32038da](https://github.com/aws-amplify/amplify-cli/commit/32038dad6f1bd0b9cf55e055d6a4545a222a1149)), closes [#3447](https://github.com/aws-amplify/amplify-cli/issues/3447) [#3451](https://github.com/aws-amplify/amplify-cli/issues/3451)
* point to correct file to delete for amplify config ([#3116](https://github.com/aws-amplify/amplify-cli/issues/3116)) ([61c0769](https://github.com/aws-amplify/amplify-cli/commit/61c0769cb1d40faa76ff3de8e82f2f58199b4a0f)), closes [#2997](https://github.com/aws-amplify/amplify-cli/issues/2997)
* update import ([#3690](https://github.com/aws-amplify/amplify-cli/issues/3690)) ([3bf6877](https://github.com/aws-amplify/amplify-cli/commit/3bf68778880b2a72ee792dcdbb7c976ddbeedcdc))
* update import ([#3716](https://github.com/aws-amplify/amplify-cli/issues/3716)) ([cd7f9eb](https://github.com/aws-amplify/amplify-cli/commit/cd7f9eb1be40681f7262631afd8fef7d5c68568f))
* **amplify-category-analytics:** Allow hyphens for pinpoint resources name ([#2516](https://github.com/aws-amplify/amplify-cli/issues/2516)) ([ecd87ee](https://github.com/aws-amplify/amplify-cli/commit/ecd87ee5b47b5d3e458feaa87b0949f5661a8901)), closes [#1877](https://github.com/aws-amplify/amplify-cli/issues/1877)
* **amplify-category-analytics:** reverted the hyphen and updated tests ([#3181](https://github.com/aws-amplify/amplify-cli/issues/3181)) ([1a1efcf](https://github.com/aws-amplify/amplify-cli/commit/1a1efcfe9ba11242316ebed3bca3bf5fe78761f7)), closes [#3163](https://github.com/aws-amplify/amplify-cli/issues/3163)
* **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad863ad4febde47e56209d6026cddb344044))
* **amplify-e2e-tests:** fixing predictions e2e tests ([#1969](https://github.com/aws-amplify/amplify-cli/issues/1969)) ([6c6bbb2](https://github.com/aws-amplify/amplify-cli/commit/6c6bbb26589a12aefc2f77ad059cbc65d6589a24))
* **cli:** 'remove env' wording ([#3425](https://github.com/aws-amplify/amplify-cli/issues/3425)) ([ddaeb23](https://github.com/aws-amplify/amplify-cli/commit/ddaeb23d2fbffa7ee7f0769c133b75e0d2be9bcc))
* **cli:** deleting the amplify app on delete ([#3568](https://github.com/aws-amplify/amplify-cli/issues/3568)) ([f39bbcb](https://github.com/aws-amplify/amplify-cli/commit/f39bbcb715875eeeb612bcbc40b275b33f85eaf6)), closes [#3239](https://github.com/aws-amplify/amplify-cli/issues/3239)
* enable only-userpool flow without idp and addition of groups without roles tied to idp ([#3662](https://github.com/aws-amplify/amplify-cli/issues/3662)) ([67e0401](https://github.com/aws-amplify/amplify-cli/commit/67e04018d758e617374c4b8ba2298872e728d01e))
* regression for e2e tests because of nexpect reference ([#2120](https://github.com/aws-amplify/amplify-cli/issues/2120)) ([7659500](https://github.com/aws-amplify/amplify-cli/commit/7659500225091d4bf3b84c9ac7fee1931716dce9))
* upgrade to node10 as min version for CLI ([#3128](https://github.com/aws-amplify/amplify-cli/issues/3128)) ([a0b18e0](https://github.com/aws-amplify/amplify-cli/commit/a0b18e0187a26b4ab0e6e986b0277f347e829444))
* **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
* fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))
* implement retries and CFN polls in e2e tests ([#4028](https://github.com/aws-amplify/amplify-cli/issues/4028)) ([b71391f](https://github.com/aws-amplify/amplify-cli/commit/b71391facdd0d4f301522f10fb7d722aad406ed6))
* remove duplicate permissions from resources in same category ([#4091](https://github.com/aws-amplify/amplify-cli/issues/4091)) ([3f6036b](https://github.com/aws-amplify/amplify-cli/commit/3f6036b6b614a5e7a5f89e3ede289ffafba9fbb3))
* select us-east-2 in integ tests ([#3992](https://github.com/aws-amplify/amplify-cli/issues/3992)) ([ed48cf5](https://github.com/aws-amplify/amplify-cli/commit/ed48cf59a2e60cc25a78f83641ca8f3bc63bc68f))
* **amplify-category-hosting:** fix hosting bug ([#2556](https://github.com/aws-amplify/amplify-cli/issues/2556)) ([75784fb](https://github.com/aws-amplify/amplify-cli/commit/75784fb27da321b5e1d1b1f11935425f602a3c4a))


### Features

* ability to add custom EventSource and lambda triggers via amplify add function, kinesis support in analytics category ([#2463](https://github.com/aws-amplify/amplify-cli/issues/2463)) ([b25cfd0](https://github.com/aws-amplify/amplify-cli/commit/b25cfd00b21416a82ecefda1f6498206ef71531b))
* added commented out cors headers ([#5315](https://github.com/aws-amplify/amplify-cli/issues/5315)) ([03ec394](https://github.com/aws-amplify/amplify-cli/commit/03ec394af21b0b5683441c14f22b8cdff9e71053))
* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c1927da10f8c54f38a523021187361131c))
* amplify console hosting plugin ([#3525](https://github.com/aws-amplify/amplify-cli/issues/3525)) ([2c84b71](https://github.com/aws-amplify/amplify-cli/commit/2c84b71687a0ebcdeb92ebe462c8cf4eab8c9e3c))
* conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
* Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
* feature flag implementation ([#4891](https://github.com/aws-amplify/amplify-cli/issues/4891)) ([6d1c632](https://github.com/aws-amplify/amplify-cli/commit/6d1c632952a49cb56670c11c9cb0c3620d0eb332))
* golang function support for CLI ([#3789](https://github.com/aws-amplify/amplify-cli/issues/3789)) ([3dbc234](https://github.com/aws-amplify/amplify-cli/commit/3dbc23497d0d1c238c6868adcf3a6d00ad909edd))
* headless mode for API category ([#4834](https://github.com/aws-amplify/amplify-cli/issues/4834)) ([c2e09d7](https://github.com/aws-amplify/amplify-cli/commit/c2e09d73fd1bb461eeace8f4a7addd70a63047ad))
* headless update auth ([#5308](https://github.com/aws-amplify/amplify-cli/issues/5308)) ([b942f35](https://github.com/aws-amplify/amplify-cli/commit/b942f3589f1df1361ae7eb6e42f18dbf6900d1bf))
* implement multi-auth functionality ([#1916](https://github.com/aws-amplify/amplify-cli/issues/1916)) ([b99f58e](https://github.com/aws-amplify/amplify-cli/commit/b99f58e4a2b85cbe9f430838554ae3c277440132))
* install python3 and pipenv in circleci ([#3825](https://github.com/aws-amplify/amplify-cli/issues/3825)) ([fa17a15](https://github.com/aws-amplify/amplify-cli/commit/fa17a15a02f4a8485af74e16e34ffa12e1eb8f0c))
* Lambda layers ([#4697](https://github.com/aws-amplify/amplify-cli/issues/4697)) ([4e97400](https://github.com/aws-amplify/amplify-cli/commit/4e974007d95c894ab4108a2dff8d5996e7e3ce25))
* Merge GSI from a previous add when updating a storage ([#2571](https://github.com/aws-amplify/amplify-cli/issues/2571)) ([c8ae475](https://github.com/aws-amplify/amplify-cli/commit/c8ae475e25e5ad27aab602a05c29c9ca9cef8a4b))
* mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e5346ee1f27a2e9bee25fbbdcb19417f5230f))
* Multienv support for Lambda layers ([#5081](https://github.com/aws-amplify/amplify-cli/issues/5081)) ([4af1363](https://github.com/aws-amplify/amplify-cli/commit/4af13634bcdd58511712249e6774fc9f287c9ef5))
* resource Tagging Support ([#5178](https://github.com/aws-amplify/amplify-cli/issues/5178)) ([e34226d](https://github.com/aws-amplify/amplify-cli/commit/e34226dde30d7d345e3cc2e72e187b242a09c389))
* sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe8925a4e73358b03ba927267a2df328b78))
* select node runtime by default ([#3852](https://github.com/aws-amplify/amplify-cli/issues/3852)) ([aa712bd](https://github.com/aws-amplify/amplify-cli/commit/aa712bd26f7e02477d95d04e639c7234feba9715))
* storage import ([#5893](https://github.com/aws-amplify/amplify-cli/issues/5893)) ([ad7b028](https://github.com/aws-amplify/amplify-cli/commit/ad7b028330bcee64d5124be7f27a8494dc8e9400))
* support importing of auth resources ([#5591](https://github.com/aws-amplify/amplify-cli/issues/5591)) ([7903246](https://github.com/aws-amplify/amplify-cli/commit/790324680544fe18481f91390001f9f07a144203))
* update post-install to copy executable assets to .amplify ([#5595](https://github.com/aws-amplify/amplify-cli/issues/5595)) ([53a23a0](https://github.com/aws-amplify/amplify-cli/commit/53a23a07cbb9e09566c1f0f577ba2b7488bc2eae))
* **amplify-app:** group amplify files in xcode integration ([#4268](https://github.com/aws-amplify/amplify-cli/issues/4268)) ([5670a08](https://github.com/aws-amplify/amplify-cli/commit/5670a0895d65702441de24d8873d48d156a9d121))
* **amplify-category-function:** Support Lambda Scheduling  ([#3714](https://github.com/aws-amplify/amplify-cli/issues/3714)) ([4a488ed](https://github.com/aws-amplify/amplify-cli/commit/4a488edef14d9161600cf6ce6887baa3c04ebef5))
* **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
* User Pool Groups, Admin Auth Support, Custom Group Role Policies ([#2443](https://github.com/aws-amplify/amplify-cli/issues/2443)) ([09aecfd](https://github.com/aws-amplify/amplify-cli/commit/09aecfd0cb3dae2c17d1c512946cc733c4fe3d4c))


### Performance Improvements

* **amplify-category-hosting:** http2 for cloudfront distconfig ([#3616](https://github.com/aws-amplify/amplify-cli/issues/3616)) ([dc1fd46](https://github.com/aws-amplify/amplify-cli/commit/dc1fd46535ee2b075f9ed0bc50c786dff9af1489))


### Reverts

* Revert "test(amplify-e2e-tests):test uncommented (#3742)" (#4324) ([0faddf2](https://github.com/aws-amplify/amplify-cli/commit/0faddf2ed21d68c32c919b98a16f3ba7a10c3752)), closes [#3742](https://github.com/aws-amplify/amplify-cli/issues/3742) [#4324](https://github.com/aws-amplify/amplify-cli/issues/4324)
* Revert "fix(amplify-provider-awscloudformation): check before fetching backend (#3848)" (#3968) ([4abd582](https://github.com/aws-amplify/amplify-cli/commit/4abd5828bb5138944b116476d8b9491597aecc88)), closes [#3848](https://github.com/aws-amplify/amplify-cli/issues/3848) [#3968](https://github.com/aws-amplify/amplify-cli/issues/3968)





## [2.27.6](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.27.3...amplify-e2e-tests@2.27.6) (2020-11-20)


### Bug Fixes

* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))



## 4.32.1-alpha.0 (2020-11-11)


### Bug Fixes

* **graphql-transformer-core:** fix gsi update sanity check ([#5776](https://github.com/aws-amplify/amplify-cli/issues/5776)) ([b82a3e5](https://github.com/aws-amplify/amplify-cli/commit/b82a3e5a5deb432e7283b902c8abe90dc27f0f46))





## [2.27.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.27.3...amplify-e2e-tests@2.27.5) (2020-11-20)


### Bug Fixes

* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))



## 4.32.1-alpha.0 (2020-11-11)


### Bug Fixes

* **graphql-transformer-core:** fix gsi update sanity check ([#5776](https://github.com/aws-amplify/amplify-cli/issues/5776)) ([b82a3e5](https://github.com/aws-amplify/amplify-cli/commit/b82a3e5a5deb432e7283b902c8abe90dc27f0f46))





## [2.27.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.27.3...amplify-e2e-tests@2.27.4) (2020-11-19)


### Bug Fixes

* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))



## 4.32.1-alpha.0 (2020-11-11)


### Bug Fixes

* **graphql-transformer-core:** fix gsi update sanity check ([#5776](https://github.com/aws-amplify/amplify-cli/issues/5776)) ([b82a3e5](https://github.com/aws-amplify/amplify-cli/commit/b82a3e5a5deb432e7283b902c8abe90dc27f0f46))





## [2.27.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.27.2...amplify-e2e-tests@2.27.3) (2020-11-08)

**Note:** Version bump only for package amplify-e2e-tests





## [2.27.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.27.1...amplify-e2e-tests@2.27.2) (2020-10-30)

**Note:** Version bump only for package amplify-e2e-tests





## [2.27.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.27.0...amplify-e2e-tests@2.27.1) (2020-10-27)


### Bug Fixes

* sync resolver for mock ([#5684](https://github.com/aws-amplify/amplify-cli/issues/5684)) ([80e2cd4](https://github.com/aws-amplify/amplify-cli/commit/80e2cd44bde1021d4415c6c3b670f44ec1bcae3c))





# [2.27.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.26.0...amplify-e2e-tests@2.27.0) (2020-10-22)


### Bug Fixes

* **amplify-app:** initialize feature flag  ([#5643](https://github.com/aws-amplify/amplify-cli/issues/5643)) ([9608b56](https://github.com/aws-amplify/amplify-cli/commit/9608b5616c2b92417a1b559f41f5d3f8f42f97e5))
* **amplify-codegen-appsync-model-plugin:** generate nullable types for list ([#5493](https://github.com/aws-amplify/amplify-cli/issues/5493)) ([8b5043c](https://github.com/aws-amplify/amplify-cli/commit/8b5043c9e26ecb157ea3159e4e13dae097215301))
* update current-cloud backend-config on resource removal ([#5658](https://github.com/aws-amplify/amplify-cli/issues/5658)) ([592f694](https://github.com/aws-amplify/amplify-cli/commit/592f694530dd61302ff790fbcf5b3ea135812c47))


### Features

* update post-install to copy executable assets to .amplify ([#5595](https://github.com/aws-amplify/amplify-cli/issues/5595)) ([53a23a0](https://github.com/aws-amplify/amplify-cli/commit/53a23a07cbb9e09566c1f0f577ba2b7488bc2eae))





# [2.26.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.25.3...amplify-e2e-tests@2.26.0) (2020-10-17)


### Features

* support importing of auth resources ([#5591](https://github.com/aws-amplify/amplify-cli/issues/5591)) ([7903246](https://github.com/aws-amplify/amplify-cli/commit/790324680544fe18481f91390001f9f07a144203))





## [2.25.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.25.2...amplify-e2e-tests@2.25.3) (2020-10-09)

**Note:** Version bump only for package amplify-e2e-tests





## [2.25.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.25.1...amplify-e2e-tests@2.25.2) (2020-10-07)


### Bug Fixes

* **amplify-category-function:** fix update permission bug ([#5421](https://github.com/aws-amplify/amplify-cli/issues/5421)) ([f1194fd](https://github.com/aws-amplify/amplify-cli/commit/f1194fdd0aacbd2c316545422ad5e659d7042118)), closes [#5333](https://github.com/aws-amplify/amplify-cli/issues/5333)





## [2.25.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.25.0...amplify-e2e-tests@2.25.1) (2020-10-01)


### Bug Fixes

* **amplify-category-auth:** fix auth console ([#5408](https://github.com/aws-amplify/amplify-cli/issues/5408)) ([afbe065](https://github.com/aws-amplify/amplify-cli/commit/afbe065757ce488c1769848d0db3d03465a9b6c9)), closes [#5364](https://github.com/aws-amplify/amplify-cli/issues/5364)
* [#5354](https://github.com/aws-amplify/amplify-cli/issues/5354) .net core lambda project file naming ([#5414](https://github.com/aws-amplify/amplify-cli/issues/5414)) ([c0f1953](https://github.com/aws-amplify/amplify-cli/commit/c0f1953acaca33eb0228e1528eb5ac4eb183ff6d))
* e2e regressions from previous pr ([#5438](https://github.com/aws-amplify/amplify-cli/issues/5438)) ([398d98b](https://github.com/aws-amplify/amplify-cli/commit/398d98b6a57c41f5172d6b56e9a834cfd28b891b))
* **cli:** fixed projName and envName ([#5400](https://github.com/aws-amplify/amplify-cli/issues/5400)) ([8c18418](https://github.com/aws-amplify/amplify-cli/commit/8c184180a69755acc7ed87f03b40e07e231de245)), closes [#5399](https://github.com/aws-amplify/amplify-cli/issues/5399)





# [2.25.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.24.0...amplify-e2e-tests@2.25.0) (2020-09-25)


### Features

* headless update auth ([#5308](https://github.com/aws-amplify/amplify-cli/issues/5308)) ([b942f35](https://github.com/aws-amplify/amplify-cli/commit/b942f3589f1df1361ae7eb6e42f18dbf6900d1bf))





# [2.24.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.23.1...amplify-e2e-tests@2.24.0) (2020-09-16)


### Bug Fixes

* **amplify-category-storage:** fix storage update ([#5191](https://github.com/aws-amplify/amplify-cli/issues/5191)) ([754f122](https://github.com/aws-amplify/amplify-cli/commit/754f12201c07132ff6c9e7ef88f4c567cdc6302d)), closes [#5124](https://github.com/aws-amplify/amplify-cli/issues/5124)
* **amplify-provider-awscloudformation:** validate config input ([#5307](https://github.com/aws-amplify/amplify-cli/issues/5307)) ([5a324b2](https://github.com/aws-amplify/amplify-cli/commit/5a324b2ab015c0be8fe83d937325a38470c46c2d)), closes [#4998](https://github.com/aws-amplify/amplify-cli/issues/4998)
* refactor amplify.json file handling ([#5282](https://github.com/aws-amplify/amplify-cli/issues/5282)) ([a6269f3](https://github.com/aws-amplify/amplify-cli/commit/a6269f3177f3242df81e9d7dce0625295bb7a9fc))


### Features

* added commented out cors headers ([#5315](https://github.com/aws-amplify/amplify-cli/issues/5315)) ([03ec394](https://github.com/aws-amplify/amplify-cli/commit/03ec394af21b0b5683441c14f22b8cdff9e71053))





## [2.23.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.23.0...amplify-e2e-tests@2.23.1) (2020-09-09)

**Note:** Version bump only for package amplify-e2e-tests





# [2.23.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.22.0...amplify-e2e-tests@2.23.0) (2020-09-03)


### Features

* Multienv support for Lambda layers ([#5081](https://github.com/aws-amplify/amplify-cli/issues/5081)) ([4af1363](https://github.com/aws-amplify/amplify-cli/commit/4af13634bcdd58511712249e6774fc9f287c9ef5))





# [2.22.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.21.3...amplify-e2e-tests@2.22.0) (2020-08-31)


### Bug Fixes

* **graphql-mapping-template:** fix [@key](https://github.com/key) issue when datastore enabled ([#5175](https://github.com/aws-amplify/amplify-cli/issues/5175)) ([d58c4aa](https://github.com/aws-amplify/amplify-cli/commit/d58c4aa6ba07859a6fec250df281649bb17548e9)), closes [#4355](https://github.com/aws-amplify/amplify-cli/issues/4355)
* Validation check when mutating more than 1 GSI in update flow ([#5141](https://github.com/aws-amplify/amplify-cli/issues/5141)) ([4faaba0](https://github.com/aws-amplify/amplify-cli/commit/4faaba0509467aad03db11709175f4a3071459ae))


### Features

* resource Tagging Support ([#5178](https://github.com/aws-amplify/amplify-cli/issues/5178)) ([e34226d](https://github.com/aws-amplify/amplify-cli/commit/e34226dde30d7d345e3cc2e72e187b242a09c389))





## [2.21.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.21.2...amplify-e2e-tests@2.21.3) (2020-08-14)


### Bug Fixes

* Added check to stop prompts for cognito triggers while using env commands ([#5039](https://github.com/aws-amplify/amplify-cli/issues/5039)) ([744dbc4](https://github.com/aws-amplify/amplify-cli/commit/744dbc42e847e273160caf3672365391f055191b))





## [2.21.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.21.1...amplify-e2e-tests@2.21.2) (2020-08-11)

**Note:** Version bump only for package amplify-e2e-tests





## [2.21.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.21.0...amplify-e2e-tests@2.21.1) (2020-08-06)


### Bug Fixes

* return undefined for empty conflict resolution ([#4982](https://github.com/aws-amplify/amplify-cli/issues/4982)) ([7c5bf1a](https://github.com/aws-amplify/amplify-cli/commit/7c5bf1a36078a345d80ecbf2cea3a067ae1137e1)), closes [#4965](https://github.com/aws-amplify/amplify-cli/issues/4965)





# [2.21.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.19.3...amplify-e2e-tests@2.21.0) (2020-07-29)


### Bug Fixes

* **amplify-provider-awscloudformation:** Stack delete condition ([#4465](https://github.com/aws-amplify/amplify-cli/issues/4465)) ([018bbab](https://github.com/aws-amplify/amplify-cli/commit/018bbabab02389f28b9c8e2ea83faacce47c5eb4))
* [#4950](https://github.com/aws-amplify/amplify-cli/issues/4950) amplify cli fails with checked in local settings ([#4959](https://github.com/aws-amplify/amplify-cli/issues/4959)) ([ba0529a](https://github.com/aws-amplify/amplify-cli/commit/ba0529ac358b6f6028c6dbc4235def312f4625be))
* /opt folder should be packaged at the root of the zipped dir ([#4835](https://github.com/aws-amplify/amplify-cli/issues/4835)) ([ec8199c](https://github.com/aws-amplify/amplify-cli/commit/ec8199c5ae8d4eda504d5bad2b30567a5e2b4810))
* function update no longer removes dependsOn array implicitly ([#4938](https://github.com/aws-amplify/amplify-cli/issues/4938)) ([200bbcb](https://github.com/aws-amplify/amplify-cli/commit/200bbcbda4439a144dc299355ea51c5ffd124594))
* populate API_KEY env var when present ([#4923](https://github.com/aws-amplify/amplify-cli/issues/4923)) ([81231f9](https://github.com/aws-amplify/amplify-cli/commit/81231f98305dd9e37bb64eb30a9c7307bb471ad9))


### Features

* feature flag implementation ([#4891](https://github.com/aws-amplify/amplify-cli/issues/4891)) ([6d1c632](https://github.com/aws-amplify/amplify-cli/commit/6d1c632952a49cb56670c11c9cb0c3620d0eb332))
* headless mode for API category ([#4834](https://github.com/aws-amplify/amplify-cli/issues/4834)) ([c2e09d7](https://github.com/aws-amplify/amplify-cli/commit/c2e09d73fd1bb461eeace8f4a7addd70a63047ad))





# [2.20.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.19.3...amplify-e2e-tests@2.20.0) (2020-07-23)


### Bug Fixes

* /opt folder should be packaged at the root of the zipped dir ([#4835](https://github.com/aws-amplify/amplify-cli/issues/4835)) ([f4abd69](https://github.com/aws-amplify/amplify-cli/commit/f4abd6918826bf565f157641593fb1d751877713))
* **amplify-provider-awscloudformation:** Stack delete condition ([#4465](https://github.com/aws-amplify/amplify-cli/issues/4465)) ([aa04e88](https://github.com/aws-amplify/amplify-cli/commit/aa04e88d6efeb826e9820230e1a19d5db5024bad))


### Features

* feature flag implementation ([#4891](https://github.com/aws-amplify/amplify-cli/issues/4891)) ([4639450](https://github.com/aws-amplify/amplify-cli/commit/463945029cfe861f74986d9a8b9af6b827d2063d))
* headless mode for API category ([#4834](https://github.com/aws-amplify/amplify-cli/issues/4834)) ([b729266](https://github.com/aws-amplify/amplify-cli/commit/b729266b9bb519738ef88125784d72ac428f47e1))





## [2.19.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.19.2...amplify-e2e-tests@2.19.3) (2020-07-18)


### Bug Fixes

* **amplify-provider-awscloudformation:** fix bug for no credential file ([#4310](https://github.com/aws-amplify/amplify-cli/issues/4310)) ([183e201](https://github.com/aws-amplify/amplify-cli/commit/183e20133eb938b596039ea63bd08e1c9b4c84e4)), closes [#4284](https://github.com/aws-amplify/amplify-cli/issues/4284)





## [2.19.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.19.1...amplify-e2e-tests@2.19.2) (2020-07-15)

**Note:** Version bump only for package amplify-e2e-tests





## [2.19.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.19.0...amplify-e2e-tests@2.19.1) (2020-07-11)

**Note:** Version bump only for package amplify-e2e-tests





# [2.19.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.18.5...amplify-e2e-tests@2.19.0) (2020-07-07)


### Features

* Lambda layers ([#4697](https://github.com/aws-amplify/amplify-cli/issues/4697)) ([c55b2e0](https://github.com/aws-amplify/amplify-cli/commit/c55b2e0c3377127aaf887591d7bc20d7240ef11d))





## [2.18.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.18.4...amplify-e2e-tests@2.18.5) (2020-06-25)


### Reverts

* Revert "fix: change scope of hashed files for AppSync (#4602)" ([73aaab1](https://github.com/aws-amplify/amplify-cli/commit/73aaab1a7b1f8b2de5fa22fa1ef9aeea7de35cb4)), closes [#4602](https://github.com/aws-amplify/amplify-cli/issues/4602)





## [2.18.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.18.3...amplify-e2e-tests@2.18.4) (2020-06-18)


### Bug Fixes

* change scope of hashed files for AppSync ([#4602](https://github.com/aws-amplify/amplify-cli/issues/4602)) ([10fa9da](https://github.com/aws-amplify/amplify-cli/commit/10fa9da646f4de755e2dc92cd4bb2a6319425d72)), closes [#4458](https://github.com/aws-amplify/amplify-cli/issues/4458)





## [2.18.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.18.2...amplify-e2e-tests@2.18.3) (2020-06-11)

**Note:** Version bump only for package amplify-e2e-tests





## [2.18.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.18.1...amplify-e2e-tests@2.18.2) (2020-06-10)


### Performance Improvements

* **amplify-category-hosting:** http2 for cloudfront distconfig ([#3616](https://github.com/aws-amplify/amplify-cli/issues/3616)) ([b5de093](https://github.com/aws-amplify/amplify-cli/commit/b5de093cb0c387ac7f902498727af2c1111a77ca))





## [2.18.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.18.0...amplify-e2e-tests@2.18.1) (2020-06-02)

**Note:** Version bump only for package amplify-e2e-tests





# [2.18.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.17.3...amplify-e2e-tests@2.18.0) (2020-05-26)


### Bug Fixes

* **amplify-category-api:** toggle datastore in update ([#4276](https://github.com/aws-amplify/amplify-cli/issues/4276)) ([c522f29](https://github.com/aws-amplify/amplify-cli/commit/c522f295304410aeb1d6f60aaba9b466d3304ee1)), closes [#4058](https://github.com/aws-amplify/amplify-cli/issues/4058)


### Features

* **amplify-app:** group amplify files in xcode integration ([#4268](https://github.com/aws-amplify/amplify-cli/issues/4268)) ([73f3eab](https://github.com/aws-amplify/amplify-cli/commit/73f3eabc11def219faa1724fee93ce171949e40f))


### Reverts

* Revert "test(amplify-e2e-tests):test uncommented (#3742)" (#4324) ([b4eb173](https://github.com/aws-amplify/amplify-cli/commit/b4eb1733139f24612fd89c046582b14a2e643227)), closes [#3742](https://github.com/aws-amplify/amplify-cli/issues/3742) [#4324](https://github.com/aws-amplify/amplify-cli/issues/4324)





## [2.17.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.17.2...amplify-e2e-tests@2.17.3) (2020-05-15)


### Bug Fixes

* **amplify-category-auth:** adding unique Id to Role name ([#4231](https://github.com/aws-amplify/amplify-cli/issues/4231)) ([21de1af](https://github.com/aws-amplify/amplify-cli/commit/21de1affd89142598a1f8022c387b3c04994b1e0))
* **cli:** add information on pre/post pull in learn more ([#3880](https://github.com/aws-amplify/amplify-cli/issues/3880)) ([b40867f](https://github.com/aws-amplify/amplify-cli/commit/b40867f148454d8d87a619d67e1df2e6a6f982dc))
* **cli:** fixes issues for missing build or start command ([#3918](https://github.com/aws-amplify/amplify-cli/issues/3918)) ([25c53ce](https://github.com/aws-amplify/amplify-cli/commit/25c53ce81a74c3f706f60b0519eda0a4338edbf7)), closes [#3728](https://github.com/aws-amplify/amplify-cli/issues/3728) [#3806](https://github.com/aws-amplify/amplify-cli/issues/3806)





## [2.17.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.17.1...amplify-e2e-tests@2.17.2) (2020-05-08)


### Bug Fixes

* add AttributeTypeEnum for connections on models with no codegen ([#4102](https://github.com/aws-amplify/amplify-cli/issues/4102)) ([4e92402](https://github.com/aws-amplify/amplify-cli/commit/4e92402e0b0fae30501972f3ad16203fc19ba287))
* e2e init and prediction test failures ([#4195](https://github.com/aws-amplify/amplify-cli/issues/4195)) ([2ea6a42](https://github.com/aws-amplify/amplify-cli/commit/2ea6a42829086d0c6ab10acd77cbbd0fc9320938))
* remove duplicate permissions from resources in same category ([#4091](https://github.com/aws-amplify/amplify-cli/issues/4091)) ([3f6036b](https://github.com/aws-amplify/amplify-cli/commit/3f6036b6b614a5e7a5f89e3ede289ffafba9fbb3))





## [2.17.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.17.0...amplify-e2e-tests@2.17.1) (2020-04-23)


### Bug Fixes

* **amplify-e2e-tests:** add .NET template and remove ddb uuid ([#3958](https://github.com/aws-amplify/amplify-cli/issues/3958)) ([70b5edc](https://github.com/aws-amplify/amplify-cli/commit/70b5edc2b50b4e0ceb33956852cb5eb834a8016b))
* **amplify-provider-awscloudformation:** check before fetching backend ([#3848](https://github.com/aws-amplify/amplify-cli/issues/3848)) ([39be355](https://github.com/aws-amplify/amplify-cli/commit/39be3552f7f408dad02c2701a01f170be9badbb7))
* check for unavailable bucket ([#3972](https://github.com/aws-amplify/amplify-cli/issues/3972)) ([de9c4c4](https://github.com/aws-amplify/amplify-cli/commit/de9c4c461351352694d81d9e7b2f9044b1a9a2c4))
* implement retries and CFN polls in e2e tests ([#4028](https://github.com/aws-amplify/amplify-cli/issues/4028)) ([b71391f](https://github.com/aws-amplify/amplify-cli/commit/b71391facdd0d4f301522f10fb7d722aad406ed6))
* remove duplicate env vars in top level comment ([#3894](https://github.com/aws-amplify/amplify-cli/issues/3894)) fixes [#3744](https://github.com/aws-amplify/amplify-cli/issues/3744) ([d586863](https://github.com/aws-amplify/amplify-cli/commit/d586863aabcb1ad2fc4d8ee1bd0e693a4d86d0ea))
* select us-east-2 in integ tests ([#3992](https://github.com/aws-amplify/amplify-cli/issues/3992)) ([ed48cf5](https://github.com/aws-amplify/amplify-cli/commit/ed48cf59a2e60cc25a78f83641ca8f3bc63bc68f))


### Reverts

* Revert "fix(amplify-provider-awscloudformation): check before fetching backend (#3848)" (#3968) ([4abd582](https://github.com/aws-amplify/amplify-cli/commit/4abd5828bb5138944b116476d8b9491597aecc88)), closes [#3848](https://github.com/aws-amplify/amplify-cli/issues/3848) [#3968](https://github.com/aws-amplify/amplify-cli/issues/3968)





# [2.17.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.16.2...amplify-e2e-tests@2.17.0) (2020-04-06)


### Bug Fixes

* **amplify-category-auth:** fixed issue with updating urls in auth ([#3791](https://github.com/aws-amplify/amplify-cli/issues/3791)) ([236cd7a](https://github.com/aws-amplify/amplify-cli/commit/236cd7aecbdc2cbbb0dc9c565aae4e79ff40ebae))
* **amplify-e2e-tests:** fix failing api e2e tests ([#3827](https://github.com/aws-amplify/amplify-cli/issues/3827)) ([f676b8d](https://github.com/aws-amplify/amplify-cli/commit/f676b8d433ab5d5ecec664af27a07ecee83fa9f6))
* **amplify-provider-awscloudformation:** fixed deletion for large bucket ([#3656](https://github.com/aws-amplify/amplify-cli/issues/3656)) ([32038da](https://github.com/aws-amplify/amplify-cli/commit/32038dad6f1bd0b9cf55e055d6a4545a222a1149)), closes [#3447](https://github.com/aws-amplify/amplify-cli/issues/3447) [#3451](https://github.com/aws-amplify/amplify-cli/issues/3451)
* e2e failures ([#3856](https://github.com/aws-amplify/amplify-cli/issues/3856)) ([26ff656](https://github.com/aws-amplify/amplify-cli/commit/26ff6563a787abe87ee7d85309f1064e8b55f6b0))
* e2e fixes and circle ci install change ([#3838](https://github.com/aws-amplify/amplify-cli/issues/3838)) ([b646f53](https://github.com/aws-amplify/amplify-cli/commit/b646f539c90184be44dbd557c176a8c96d092db9))
* fix java local invoker and api e2e tests ([#3855](https://github.com/aws-amplify/amplify-cli/issues/3855)) ([93af865](https://github.com/aws-amplify/amplify-cli/commit/93af8651d4bedca0b8d08e778a74dc47230d5988))
* increase kinesis and cloudwatch sleeps ([#3859](https://github.com/aws-amplify/amplify-cli/issues/3859)) ([4971f51](https://github.com/aws-amplify/amplify-cli/commit/4971f517f71cf5b1d66e6937d26b6c5286569202))
* update function e2e tests with new template orderings ([#3817](https://github.com/aws-amplify/amplify-cli/issues/3817)) ([dfb910d](https://github.com/aws-amplify/amplify-cli/commit/dfb910ddccbd15df48801efce94d1fbf5822fb9e))


### Features

* golang function support for CLI ([#3789](https://github.com/aws-amplify/amplify-cli/issues/3789)) ([3dbc234](https://github.com/aws-amplify/amplify-cli/commit/3dbc23497d0d1c238c6868adcf3a6d00ad909edd))
* install python3 and pipenv in circleci ([#3825](https://github.com/aws-amplify/amplify-cli/issues/3825)) ([fa17a15](https://github.com/aws-amplify/amplify-cli/commit/fa17a15a02f4a8485af74e16e34ffa12e1eb8f0c))
* **amplify-category-function:** Support Lambda Scheduling  ([#3714](https://github.com/aws-amplify/amplify-cli/issues/3714)) ([4a488ed](https://github.com/aws-amplify/amplify-cli/commit/4a488edef14d9161600cf6ce6887baa3c04ebef5))
* select node runtime by default ([#3852](https://github.com/aws-amplify/amplify-cli/issues/3852)) ([aa712bd](https://github.com/aws-amplify/amplify-cli/commit/aa712bd26f7e02477d95d04e639c7234feba9715))





## [2.16.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.16.1...amplify-e2e-tests@2.16.2) (2020-03-22)


### Bug Fixes

* enable only-userpool flow without idp and addition of groups without roles tied to idp ([#3662](https://github.com/aws-amplify/amplify-cli/issues/3662)) ([67e0401](https://github.com/aws-amplify/amplify-cli/commit/67e04018d758e617374c4b8ba2298872e728d01e))
* **cli:** deleting the amplify app on delete ([#3568](https://github.com/aws-amplify/amplify-cli/issues/3568)) ([f39bbcb](https://github.com/aws-amplify/amplify-cli/commit/f39bbcb715875eeeb612bcbc40b275b33f85eaf6)), closes [#3239](https://github.com/aws-amplify/amplify-cli/issues/3239)
* fixing name of nodej function provider plugin name ([7e27785](https://github.com/aws-amplify/amplify-cli/commit/7e27785e9d4208d8e0d0674f1f1644e670139a86))
* update import ([#3690](https://github.com/aws-amplify/amplify-cli/issues/3690)) ([3bf6877](https://github.com/aws-amplify/amplify-cli/commit/3bf68778880b2a72ee792dcdbb7c976ddbeedcdc))
* update import ([#3716](https://github.com/aws-amplify/amplify-cli/issues/3716)) ([cd7f9eb](https://github.com/aws-amplify/amplify-cli/commit/cd7f9eb1be40681f7262631afd8fef7d5c68568f))





## [2.16.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.16.0...amplify-e2e-tests@2.16.1) (2020-03-10)


### Bug Fixes

* **amplify-category-analytics:** delete pinpoint project in delete ([#3165](https://github.com/aws-amplify/amplify-cli/issues/3165)) ([acc0240](https://github.com/aws-amplify/amplify-cli/commit/acc0240c02630b4b9424370732706955ea447057)), closes [#2974](https://github.com/aws-amplify/amplify-cli/issues/2974)





# [2.16.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.13.3...amplify-e2e-tests@2.16.0) (2020-03-07)


### Bug Fixes

* **cli:** 'remove env' wording ([#3425](https://github.com/aws-amplify/amplify-cli/issues/3425)) ([ddaeb23](https://github.com/aws-amplify/amplify-cli/commit/ddaeb23d2fbffa7ee7f0769c133b75e0d2be9bcc))
* add configuration.json placeholders ([#3508](https://github.com/aws-amplify/amplify-cli/issues/3508)) ([44265c4](https://github.com/aws-amplify/amplify-cli/commit/44265c439d4b7764ff52ab5b82f5fd1c88af799e))
* fix project template ([#3589](https://github.com/aws-amplify/amplify-cli/issues/3589)) ([0c11afc](https://github.com/aws-amplify/amplify-cli/commit/0c11afc476e5c6bb8bbf6e84bd1b7e7e688eed3b))
* fixing plugin e2e tests ([#3588](https://github.com/aws-amplify/amplify-cli/issues/3588)) ([10d831f](https://github.com/aws-amplify/amplify-cli/commit/10d831f1dcb330fbb9e06a9aaf16ecef05c30e51))


### Features

* ability to add custom EventSource and lambda triggers via amplify add function, kinesis support in analytics category ([#2463](https://github.com/aws-amplify/amplify-cli/issues/2463)) ([b25cfd0](https://github.com/aws-amplify/amplify-cli/commit/b25cfd00b21416a82ecefda1f6498206ef71531b))
* amplify console hosting plugin ([#3525](https://github.com/aws-amplify/amplify-cli/issues/3525)) ([2c84b71](https://github.com/aws-amplify/amplify-cli/commit/2c84b71687a0ebcdeb92ebe462c8cf4eab8c9e3c))





## [2.14.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.13.5-beta.0...amplify-e2e-tests@2.14.1) (2020-03-05)

**Note:** Version bump only for package amplify-e2e-tests





## [2.13.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.13.2...amplify-e2e-tests@2.13.3) (2020-02-13)

**Note:** Version bump only for package amplify-e2e-tests





## [2.13.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.13.1...amplify-e2e-tests@2.13.2) (2020-02-07)

**Note:** Version bump only for package amplify-e2e-tests





## [2.13.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.13.0...amplify-e2e-tests@2.13.1) (2020-01-24)

**Note:** Version bump only for package amplify-e2e-tests





# [2.13.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.30.0...amplify-e2e-tests@2.13.0) (2020-01-23)

### Bug Fixes

- amplify e2e test deps,lint,cleanup,standardize ([#2850](https://github.com/aws-amplify/amplify-cli/issues/2850)) ([cf888f3](https://github.com/aws-amplify/amplify-cli/commit/cf888f3da1acde6be4d2bfcb40f15587005c62f9))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))
- point to correct file to delete for amplify config ([#3116](https://github.com/aws-amplify/amplify-cli/issues/3116)) ([61c0769](https://github.com/aws-amplify/amplify-cli/commit/61c0769cb1d40faa76ff3de8e82f2f58199b4a0f)), closes [#2997](https://github.com/aws-amplify/amplify-cli/issues/2997)
- upgrade to node10 as min version for CLI ([#3128](https://github.com/aws-amplify/amplify-cli/issues/3128)) ([a0b18e0](https://github.com/aws-amplify/amplify-cli/commit/a0b18e0187a26b4ab0e6e986b0277f347e829444))
- **amplify-category-analytics:** reverted the hyphen and updated tests ([#3181](https://github.com/aws-amplify/amplify-cli/issues/3181)) ([1a1efcf](https://github.com/aws-amplify/amplify-cli/commit/1a1efcfe9ba11242316ebed3bca3bf5fe78761f7)), closes [#3163](https://github.com/aws-amplify/amplify-cli/issues/3163)
- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.12.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.30.0...amplify-e2e-tests@2.12.0) (2020-01-09)

### Bug Fixes

- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- amplify e2e test deps,lint,cleanup,standardize ([#2850](https://github.com/aws-amplify/amplify-cli/issues/2850)) ([cf888f3](https://github.com/aws-amplify/amplify-cli/commit/cf888f3da1acde6be4d2bfcb40f15587005c62f9))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))
- upgrade to node10 as min version for CLI ([#3128](https://github.com/aws-amplify/amplify-cli/issues/3128)) ([a0b18e0](https://github.com/aws-amplify/amplify-cli/commit/a0b18e0187a26b4ab0e6e986b0277f347e829444))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.11.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.30.0...amplify-e2e-tests@2.11.0) (2019-12-31)

### Bug Fixes

- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- amplify e2e test deps,lint,cleanup,standardize ([#2850](https://github.com/aws-amplify/amplify-cli/issues/2850)) ([cf888f3](https://github.com/aws-amplify/amplify-cli/commit/cf888f3da1acde6be4d2bfcb40f15587005c62f9))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.10.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.30.0...amplify-e2e-tests@2.10.0) (2019-12-28)

### Bug Fixes

- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- amplify e2e test deps,lint,cleanup,standardize ([#2850](https://github.com/aws-amplify/amplify-cli/issues/2850)) ([cf888f3](https://github.com/aws-amplify/amplify-cli/commit/cf888f3da1acde6be4d2bfcb40f15587005c62f9))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.9.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.30.0...amplify-e2e-tests@2.9.0) (2019-12-26)

### Bug Fixes

- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- amplify e2e test deps,lint,cleanup,standardize ([#2850](https://github.com/aws-amplify/amplify-cli/issues/2850)) ([cf888f3](https://github.com/aws-amplify/amplify-cli/commit/cf888f3da1acde6be4d2bfcb40f15587005c62f9))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.8.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.30.0...amplify-e2e-tests@2.8.0) (2019-12-25)

### Bug Fixes

- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- amplify e2e test deps,lint,cleanup,standardize ([#2850](https://github.com/aws-amplify/amplify-cli/issues/2850)) ([cf888f3](https://github.com/aws-amplify/amplify-cli/commit/cf888f3da1acde6be4d2bfcb40f15587005c62f9))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.7.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.30.0...amplify-e2e-tests@2.7.0) (2019-12-20)

### Bug Fixes

- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- amplify e2e test deps,lint,cleanup,standardize ([#2850](https://github.com/aws-amplify/amplify-cli/issues/2850)) ([cf888f3](https://github.com/aws-amplify/amplify-cli/commit/cf888f3da1acde6be4d2bfcb40f15587005c62f9))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.6.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.30.0...amplify-e2e-tests@2.6.0) (2019-12-10)

### Bug Fixes

- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- amplify e2e test deps,lint,cleanup,standardize ([#2850](https://github.com/aws-amplify/amplify-cli/issues/2850)) ([cf888f3](https://github.com/aws-amplify/amplify-cli/commit/cf888f3da1acde6be4d2bfcb40f15587005c62f9))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.4.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.30.0...amplify-e2e-tests@2.4.0) (2019-12-03)

### Bug Fixes

- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- amplify e2e test deps,lint,cleanup,standardize ([#2850](https://github.com/aws-amplify/amplify-cli/issues/2850)) ([cf888f3](https://github.com/aws-amplify/amplify-cli/commit/cf888f3da1acde6be4d2bfcb40f15587005c62f9))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.3.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.30.0...amplify-e2e-tests@2.3.0) (2019-12-01)

### Bug Fixes

- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- amplify e2e test deps,lint,cleanup,standardize ([#2850](https://github.com/aws-amplify/amplify-cli/issues/2850)) ([cf888f3](https://github.com/aws-amplify/amplify-cli/commit/cf888f3da1acde6be4d2bfcb40f15587005c62f9))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.2.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.30.0...amplify-e2e-tests@2.2.0) (2019-11-27)

### Bug Fixes

- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- amplify e2e test deps,lint,cleanup,standardize ([#2850](https://github.com/aws-amplify/amplify-cli/issues/2850)) ([cf888f3](https://github.com/aws-amplify/amplify-cli/commit/cf888f3da1acde6be4d2bfcb40f15587005c62f9))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.1.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.30.0...amplify-e2e-tests@2.1.0) (2019-11-27)

### Bug Fixes

- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- amplify e2e test deps,lint,cleanup,standardize ([#2850](https://github.com/aws-amplify/amplify-cli/issues/2850)) ([cf888f3](https://github.com/aws-amplify/amplify-cli/commit/cf888f3da1acde6be4d2bfcb40f15587005c62f9))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [1.12.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.6.2...amplify-e2e-tests@1.12.0) (2019-08-30)

### Bug Fixes

- **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad8))
- **amplify-e2e-tests:** fixing predictions e2e tests ([#1969](https://github.com/aws-amplify/amplify-cli/issues/1969)) ([6c6bbb2](https://github.com/aws-amplify/amplify-cli/commit/6c6bbb2))
- regression for e2e tests because of nexpect reference ([#2120](https://github.com/aws-amplify/amplify-cli/issues/2120)) ([7659500](https://github.com/aws-amplify/amplify-cli/commit/7659500))

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
- sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))

# [1.11.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.6.2...amplify-e2e-tests@1.11.0) (2019-08-28)

### Bug Fixes

- **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad8))
- **amplify-e2e-tests:** fixing predictions e2e tests ([#1969](https://github.com/aws-amplify/amplify-cli/issues/1969)) ([6c6bbb2](https://github.com/aws-amplify/amplify-cli/commit/6c6bbb2))
- regression for e2e tests because of nexpect reference ([#2120](https://github.com/aws-amplify/amplify-cli/issues/2120)) ([7659500](https://github.com/aws-amplify/amplify-cli/commit/7659500))

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
- sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))

# [1.10.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.6.2...amplify-e2e-tests@1.10.0) (2019-08-13)

### Bug Fixes

- **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad8))
- **amplify-e2e-tests:** fixing predictions e2e tests ([#1969](https://github.com/aws-amplify/amplify-cli/issues/1969)) ([6c6bbb2](https://github.com/aws-amplify/amplify-cli/commit/6c6bbb2))

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
- sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))

# [1.9.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.6.2...amplify-e2e-tests@1.9.0) (2019-08-07)

### Bug Fixes

- **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad8))
- **amplify-e2e-tests:** fixing predictions e2e tests ([#1969](https://github.com/aws-amplify/amplify-cli/issues/1969)) ([6c6bbb2](https://github.com/aws-amplify/amplify-cli/commit/6c6bbb2))

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
- sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))

# [1.8.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.6.2...amplify-e2e-tests@1.8.0) (2019-08-02)

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))

# [1.7.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.6.2...amplify-e2e-tests@1.7.0) (2019-07-31)

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))

## [1.6.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.6.0...amplify-e2e-tests@1.6.2) (2019-07-23)

**Note:** Version bump only for package amplify-e2e-tests

# [1.6.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.5.5...amplify-e2e-tests@1.6.0) (2019-07-09)

### Features

- cognito + s3 + dyanmodb lambda trigger support ([#1783](https://github.com/aws-amplify/amplify-cli/issues/1783)) ([c6fc838](https://github.com/aws-amplify/amplify-cli/commit/c6fc838))

## [1.5.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.5.3...amplify-e2e-tests@1.5.5) (2019-06-30)

### Bug Fixes

- fixing function build issue + e2e tests ([#1750](https://github.com/aws-amplify/amplify-cli/issues/1750)) ([c11c0bc](https://github.com/aws-amplify/amplify-cli/commit/c11c0bc)), closes [#1747](https://github.com/aws-amplify/amplify-cli/issues/1747)

## [1.5.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.5.2...amplify-e2e-tests@1.5.3) (2019-06-12)

### Bug Fixes

- **amplify-category-interactions:** call updateMetaAfterAdd only once ([#1653](https://github.com/aws-amplify/amplify-cli/issues/1653)) ([dc28758](https://github.com/aws-amplify/amplify-cli/commit/dc28758)), closes [#1621](https://github.com/aws-amplify/amplify-cli/issues/1621)

## [1.5.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.5.1...amplify-e2e-tests@1.5.2) (2019-04-16)

**Note:** Version bump only for package amplify-e2e-tests

## [1.5.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.4.1...amplify-e2e-tests@1.5.1) (2019-04-09)

**Note:** Version bump only for package amplify-e2e-tests

## [1.4.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.1.5...amplify-e2e-tests@1.4.1) (2019-04-03)

**Note:** Version bump only for package amplify-e2e-tests

## [1.1.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.1.4...amplify-e2e-tests@1.1.5) (2019-03-22)

**Note:** Version bump only for package amplify-e2e-tests

## 1.1.4 (2019-02-25)

**Note:** Version bump only for package amplify-e2e-tests
