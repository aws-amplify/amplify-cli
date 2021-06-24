# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.21.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.20.0...amplify-e2e-core@1.21.0) (2021-06-24)


### Bug Fixes

* support adding REST API paths in 'add api' ([#7229](https://github.com/aws-amplify/amplify-cli/issues/7229)) ([fa9404a](https://github.com/aws-amplify/amplify-cli/commit/fa9404afd1eedd342ea6ff2033fcbd143b33748a))


### Features

* **import-auth:** add headless support ([#7266](https://github.com/aws-amplify/amplify-cli/issues/7266)) ([7fa478b](https://github.com/aws-amplify/amplify-cli/commit/7fa478bbfebbbe70e286eb19d436d772c32c4fd2))





# [1.20.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.19.3...amplify-e2e-core@1.20.0) (2021-06-15)


### Features

* add support for defining IAM Permissions Boundary for Project ([#7144](https://github.com/aws-amplify/amplify-cli/issues/7144)) ([acf031b](https://github.com/aws-amplify/amplify-cli/commit/acf031b29d4e554d647da39ffb8293010cf1d8ad))
* Define IAM Permissions Boundary for Project ([#7502](https://github.com/aws-amplify/amplify-cli/issues/7502)) (ref [#4618](https://github.com/aws-amplify/amplify-cli/issues/4618)) ([08f7a3c](https://github.com/aws-amplify/amplify-cli/commit/08f7a3c45b2e98535ef325eb0a97c5bc4d3008c6)), closes [#7053](https://github.com/aws-amplify/amplify-cli/issues/7053)
* lambda layers rework ([#7375](https://github.com/aws-amplify/amplify-cli/issues/7375)) ([a3b7d3e](https://github.com/aws-amplify/amplify-cli/commit/a3b7d3e427e16bac2b2ea27699fe53b48cf47656))


### Reverts

* Revert "feat: add support for defining IAM Permissions Boundary for Project (#7144)" (#7453) ([08704f0](https://github.com/aws-amplify/amplify-cli/commit/08704f0271f6f5d0e0e98ad7002f4b35c3890924)), closes [#7144](https://github.com/aws-amplify/amplify-cli/issues/7144) [#7453](https://github.com/aws-amplify/amplify-cli/issues/7453)





## [1.19.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.19.2...amplify-e2e-core@1.19.3) (2021-05-26)

**Note:** Version bump only for package amplify-e2e-core





## [1.19.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.19.1...amplify-e2e-core@1.19.2) (2021-05-22)


### Bug Fixes

* updated ejs template for empty object triggers ([#7351](https://github.com/aws-amplify/amplify-cli/issues/7351)) ([572ddbd](https://github.com/aws-amplify/amplify-cli/commit/572ddbda4f339d364a8a20bab0053140cf798f34))





## [1.19.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.19.0...amplify-e2e-core@1.19.1) (2021-05-18)



## 4.51.1 (2021-05-18)


### Bug Fixes

* nexpect pathname parsing ([#7324](https://github.com/aws-amplify/amplify-cli/issues/7324)) ([#7325](https://github.com/aws-amplify/amplify-cli/issues/7325)) ([ed8dc22](https://github.com/aws-amplify/amplify-cli/commit/ed8dc221d92585a74e7e8214dcd721f5d27d5d11))





# [1.19.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.18.2...amplify-e2e-core@1.19.0) (2021-05-14)


### Features

* defer root stack creation to first `amplify push` ([#7174](https://github.com/aws-amplify/amplify-cli/issues/7174)) ([d28dd1c](https://github.com/aws-amplify/amplify-cli/commit/d28dd1caca86b19a858dab0e7aa907d1cc74c86a))
* Support for Apple Sign In ([#7265](https://github.com/aws-amplify/amplify-cli/issues/7265)) ([9f5e659](https://github.com/aws-amplify/amplify-cli/commit/9f5e659d63362c7f47eaa147c68d40d5bcc36fcc))


### Reverts

* Revert "feat: defer root stack creation to first `amplify push` (#7174)" (#7306) ([78854eb](https://github.com/aws-amplify/amplify-cli/commit/78854ebd4a3d41d34d68736d6556045302101265)), closes [#7174](https://github.com/aws-amplify/amplify-cli/issues/7174) [#7306](https://github.com/aws-amplify/amplify-cli/issues/7306)





## [1.18.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.18.0...amplify-e2e-core@1.18.2) (2021-05-03)



## 4.50.1 (2021-05-03)


### Bug Fixes

* ensure policy resource name when pushing REST APIs ([#7192](https://github.com/aws-amplify/amplify-cli/issues/7192)) ([fc77006](https://github.com/aws-amplify/amplify-cli/commit/fc77006d8f41301604fc4047edf794c23da6c552))





## [1.18.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.18.0...amplify-e2e-core@1.18.1) (2021-05-03)


### Bug Fixes

* ensure policy resource name when pushing REST APIs ([#7192](https://github.com/aws-amplify/amplify-cli/issues/7192)) ([fc77006](https://github.com/aws-amplify/amplify-cli/commit/fc77006d8f41301604fc4047edf794c23da6c552))





# [1.18.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.17.3...amplify-e2e-core@1.18.0) (2021-04-27)


### Bug Fixes

* consolidate REST API IAM policies ([#6904](https://github.com/aws-amplify/amplify-cli/issues/6904)) (ref [#2084](https://github.com/aws-amplify/amplify-cli/issues/2084)) ([5cfff17](https://github.com/aws-amplify/amplify-cli/commit/5cfff173d57ec9ab68984faf2d0f6474eccdcaae))


### Features

* S3 SSE by default ([#7039](https://github.com/aws-amplify/amplify-cli/issues/7039)) (ref [#5708](https://github.com/aws-amplify/amplify-cli/issues/5708)) ([c1369ed](https://github.com/aws-amplify/amplify-cli/commit/c1369ed6f9c204c89ee2d4c805314a40d6eeaf92))





## [1.17.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.17.2...amplify-e2e-core@1.17.3) (2021-04-19)


### Bug Fixes

* fix iterative delete for all objects and delete directory ([#7093](https://github.com/aws-amplify/amplify-cli/issues/7093)) ([189a826](https://github.com/aws-amplify/amplify-cli/commit/189a8260b25363caed3ab1f48b1fd9b7f4e4f829))
* render spinner in stateChange update e2e to wait on spinner text ([#7116](https://github.com/aws-amplify/amplify-cli/issues/7116)) ([a46f2a3](https://github.com/aws-amplify/amplify-cli/commit/a46f2a32ec9bf9e75684bc93a2e7089ac3fb894d))





## [1.17.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.17.1...amplify-e2e-core@1.17.2) (2021-04-14)


### Bug Fixes

* **amplify-e2e-core:** update source of truth for supported regions ([#6988](https://github.com/aws-amplify/amplify-cli/issues/6988)) ([bb8f8e6](https://github.com/aws-amplify/amplify-cli/commit/bb8f8e6c03baa99748d1b594fea4d18a947cac5c))





## [1.17.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.16.2...amplify-e2e-core@1.17.1) (2021-04-09)


### Bug Fixes

* **cli:** use more inclusive language ([#6919](https://github.com/aws-amplify/amplify-cli/issues/6919)) ([bb70464](https://github.com/aws-amplify/amplify-cli/commit/bb70464d6c24fa931c0eb80d234a496d936913f5))


### Reverts

* Revert "Init and Configure DX changes (#6745)" ([9078b69](https://github.com/aws-amplify/amplify-cli/commit/9078b69b5842c99f0624797a5e897353bacb65d0)), closes [#6745](https://github.com/aws-amplify/amplify-cli/issues/6745)





## [1.16.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.16.1...amplify-e2e-core@1.16.2) (2021-03-23)


### Bug Fixes

* **amplify-category-api:** mantain ff in iam api policy ([#6723](https://github.com/aws-amplify/amplify-cli/issues/6723)) ([51e5e1b](https://github.com/aws-amplify/amplify-cli/commit/51e5e1b53514a05788dd824a48991c0db0b9705d)), closes [#6675](https://github.com/aws-amplify/amplify-cli/issues/6675)





## [1.16.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.16.0...amplify-e2e-core@1.16.1) (2021-03-11)

**Note:** Version bump only for package amplify-e2e-core





# [1.16.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.15.2...amplify-e2e-core@1.16.0) (2021-03-05)


### Bug Fixes

* allow selecting all columns for GSIs ([#6689](https://github.com/aws-amplify/amplify-cli/issues/6689)) ([c33d29a](https://github.com/aws-amplify/amplify-cli/commit/c33d29a0398449379e49f023d068504c47872667))
* pull issue with multi-env notifications [#6475](https://github.com/aws-amplify/amplify-cli/issues/6475) ([#6525](https://github.com/aws-amplify/amplify-cli/issues/6525)) ([b0803d1](https://github.com/aws-amplify/amplify-cli/commit/b0803d1a361c15db8ad6e32648f29402539aa2e4))
* wording: Enable, instead of Configure, conflict detection ([#6708](https://github.com/aws-amplify/amplify-cli/issues/6708)) ([dac6ae9](https://github.com/aws-amplify/amplify-cli/commit/dac6ae94af47dd01da25ea4f61efd5442cb4c06b))


### Features

* generate datastore models for Admin CMS to consume post-deployment from CLI ([#6771](https://github.com/aws-amplify/amplify-cli/issues/6771)) ([0e74b65](https://github.com/aws-amplify/amplify-cli/commit/0e74b657491e53eb04376bb727eb442b59b2cf4c))





## [1.15.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.15.1...amplify-e2e-core@1.15.2) (2021-02-26)

**Note:** Version bump only for package amplify-e2e-core





## [1.15.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.15.0...amplify-e2e-core@1.15.1) (2021-02-24)

**Note:** Version bump only for package amplify-e2e-core





# [1.15.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.14.1...amplify-e2e-core@1.15.0) (2021-02-17)


### Features

* **amplify-cli-core:** add validations to tag Key and Value ([31eb8eb](https://github.com/aws-amplify/amplify-cli/commit/31eb8ebff2fcbd215975c8ac05287d023d544c42))





## [1.14.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.14.0...amplify-e2e-core@1.14.1) (2021-02-11)

**Note:** Version bump only for package amplify-e2e-core





# [1.14.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.13.4...amplify-e2e-core@1.14.0) (2021-02-10)


### Bug Fixes

* appclient secret output default to false ([#6333](https://github.com/aws-amplify/amplify-cli/issues/6333)) ([3da53b7](https://github.com/aws-amplify/amplify-cli/commit/3da53b7c9aacf718ebd8ea63e59928425af20764))
* fix appsync permission assignment from functions ([#5342](https://github.com/aws-amplify/amplify-cli/issues/5342)) ([b2e2dd0](https://github.com/aws-amplify/amplify-cli/commit/b2e2dd0071c1a451ba032cf7f8cfe7cf6381a96e))
* **amplify-provider-awscloudformation:** fix hosting output ([#6041](https://github.com/aws-amplify/amplify-cli/issues/6041)) ([a2c1577](https://github.com/aws-amplify/amplify-cli/commit/a2c15774762c0f07b44ca9c91c57ef4eb3752f2b)), closes [#402](https://github.com/aws-amplify/amplify-cli/issues/402)
* **amplify-provider-awscloudformation:** use prev deployment vars ([#6486](https://github.com/aws-amplify/amplify-cli/issues/6486)) ([39dfd27](https://github.com/aws-amplify/amplify-cli/commit/39dfd271bcf86b0ec424bb89c0bb38c0544d8d80))
* persist s3bucket metadata on pull and env change ([#6502](https://github.com/aws-amplify/amplify-cli/issues/6502)) ([357f787](https://github.com/aws-amplify/amplify-cli/commit/357f787c2d816e1defa1d0909b06f82775c35255))
* support choosing AWS authentication flow when admin UI is enabled ([#6433](https://github.com/aws-amplify/amplify-cli/issues/6433)) ([3bf56a8](https://github.com/aws-amplify/amplify-cli/commit/3bf56a8e2e5be67dd861a55807ecc94bd561b4a2))


### Features

* **graphql-key-transformer:** change default to add GSIs when using [@key](https://github.com/key) ([#5648](https://github.com/aws-amplify/amplify-cli/issues/5648)) ([4287c63](https://github.com/aws-amplify/amplify-cli/commit/4287c630295c304c7ff8343922926b4830b75cd4))





## [1.13.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.13.3...amplify-e2e-core@1.13.4) (2021-01-08)


### Bug Fixes

* removes nodeModules from currentCloudBackend ([#6261](https://github.com/aws-amplify/amplify-cli/issues/6261)) ([db9dca9](https://github.com/aws-amplify/amplify-cli/commit/db9dca9db019494a0c68f42d9ffeb92d0b9b2b43))





## [1.13.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.13.2...amplify-e2e-core@1.13.3) (2020-12-31)

**Note:** Version bump only for package amplify-e2e-core





## [1.13.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.13.1...amplify-e2e-core@1.13.2) (2020-12-21)

**Note:** Version bump only for package amplify-e2e-core





## [1.13.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.13.0...amplify-e2e-core@1.13.1) (2020-12-16)

**Note:** Version bump only for package amplify-e2e-core





# [1.13.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.12.0...amplify-e2e-core@1.13.0) (2020-12-11)


### Features

* container-based deployments([#5727](https://github.com/aws-amplify/amplify-cli/issues/5727)) ([fad6377](https://github.com/aws-amplify/amplify-cli/commit/fad6377bd384862ca4429cb1a83eee90efd62b58))





# [1.12.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.11.0...amplify-e2e-core@1.12.0) (2020-12-07)


### Features

* add support for multiple [@key](https://github.com/key) changes in same [@model](https://github.com/model) ([#6044](https://github.com/aws-amplify/amplify-cli/issues/6044)) ([e574637](https://github.com/aws-amplify/amplify-cli/commit/e5746379ea1330c53dacb55e8f6a9de7b17b55ae))





# [1.11.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.10.3...amplify-e2e-core@1.11.0) (2020-11-30)


### Features

* pre-deploy pull, new login mechanism and pkg cli updates ([#5941](https://github.com/aws-amplify/amplify-cli/issues/5941)) ([7274251](https://github.com/aws-amplify/amplify-cli/commit/7274251faadc1035acce5f44699b172e10e2e67d))





## [1.10.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.10.2...amplify-e2e-core@1.10.3) (2020-11-27)

**Note:** Version bump only for package amplify-e2e-core





## [1.10.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.10.1...amplify-e2e-core@1.10.2) (2020-11-26)

**Note:** Version bump only for package amplify-e2e-core





## [1.10.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.10.0...amplify-e2e-core@1.10.1) (2020-11-24)

**Note:** Version bump only for package amplify-e2e-core





# [1.10.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.8.4...amplify-e2e-core@1.10.0) (2020-11-22)


### Bug Fixes

* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))


### Features

* storage import ([#5893](https://github.com/aws-amplify/amplify-cli/issues/5893)) ([ad7b028](https://github.com/aws-amplify/amplify-cli/commit/ad7b028330bcee64d5124be7f27a8494dc8e9400))





# 1.9.0 (2020-11-22)


### Bug Fixes

* [#4950](https://github.com/aws-amplify/amplify-cli/issues/4950) amplify cli fails with checked in local settings ([#4959](https://github.com/aws-amplify/amplify-cli/issues/4959)) ([ba0529a](https://github.com/aws-amplify/amplify-cli/commit/ba0529ac358b6f6028c6dbc4235def312f4625be))
* [#5354](https://github.com/aws-amplify/amplify-cli/issues/5354) .net core lambda project file naming ([#5414](https://github.com/aws-amplify/amplify-cli/issues/5414)) ([c0f1953](https://github.com/aws-amplify/amplify-cli/commit/c0f1953acaca33eb0228e1528eb5ac4eb183ff6d))
* cli.json update on pull, E2E enhancements ([#5516](https://github.com/aws-amplify/amplify-cli/issues/5516)) ([952a92e](https://github.com/aws-amplify/amplify-cli/commit/952a92ef1926d86798efef2bbc27fe1c49d8e75f))
* deleted extra carriageReturn calls, fixed grammar in Auth dx ([#4237](https://github.com/aws-amplify/amplify-cli/issues/4237)) ([e6ccdab](https://github.com/aws-amplify/amplify-cli/commit/e6ccdab3f213e5b68999c18dd4ed2d1b7f60f0de))
* e2e raise test timeout because of CFN ([#3862](https://github.com/aws-amplify/amplify-cli/issues/3862)) ([5093654](https://github.com/aws-amplify/amplify-cli/commit/5093654a8a402a9290275a838c393dd115c0b897))
* e2e regressions from previous pr ([#5438](https://github.com/aws-amplify/amplify-cli/issues/5438)) ([398d98b](https://github.com/aws-amplify/amplify-cli/commit/398d98b6a57c41f5172d6b56e9a834cfd28b891b))
* implement retries and CFN polls in e2e tests ([#4028](https://github.com/aws-amplify/amplify-cli/issues/4028)) ([b71391f](https://github.com/aws-amplify/amplify-cli/commit/b71391facdd0d4f301522f10fb7d722aad406ed6))
* make Hello World the default choice for function templates ([#4466](https://github.com/aws-amplify/amplify-cli/issues/4466)) ([a91d681](https://github.com/aws-amplify/amplify-cli/commit/a91d681149d57e190e62a3d7fd16a75b9f327bca))
* populate API_KEY env var when present ([#4923](https://github.com/aws-amplify/amplify-cli/issues/4923)) ([81231f9](https://github.com/aws-amplify/amplify-cli/commit/81231f98305dd9e37bb64eb30a9c7307bb471ad9))
* refactor amplify.json file handling ([#5282](https://github.com/aws-amplify/amplify-cli/issues/5282)) ([a6269f3](https://github.com/aws-amplify/amplify-cli/commit/a6269f3177f3242df81e9d7dce0625295bb7a9fc))
* remove duplicate permissions from resources in same category ([#4091](https://github.com/aws-amplify/amplify-cli/issues/4091)) ([3f6036b](https://github.com/aws-amplify/amplify-cli/commit/3f6036b6b614a5e7a5f89e3ede289ffafba9fbb3))
* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))
* update current-cloud backend-config on resource removal ([#5658](https://github.com/aws-amplify/amplify-cli/issues/5658)) ([592f694](https://github.com/aws-amplify/amplify-cli/commit/592f694530dd61302ff790fbcf5b3ea135812c47))
* **amplify-category-api:** toggle datastore in update ([#4276](https://github.com/aws-amplify/amplify-cli/issues/4276)) ([4f02a62](https://github.com/aws-amplify/amplify-cli/commit/4f02a62f5c8929cabe914e2e38fb28dc535d2d61)), closes [#4058](https://github.com/aws-amplify/amplify-cli/issues/4058)
* **amplify-category-auth:** adding unique Id to Role name ([#4231](https://github.com/aws-amplify/amplify-cli/issues/4231)) ([21de1af](https://github.com/aws-amplify/amplify-cli/commit/21de1affd89142598a1f8022c387b3c04994b1e0))
* **amplify-category-auth:** fix auth console ([#5408](https://github.com/aws-amplify/amplify-cli/issues/5408)) ([afbe065](https://github.com/aws-amplify/amplify-cli/commit/afbe065757ce488c1769848d0db3d03465a9b6c9)), closes [#5364](https://github.com/aws-amplify/amplify-cli/issues/5364)
* **amplify-category-storage:** fix storage update ([#5191](https://github.com/aws-amplify/amplify-cli/issues/5191)) ([754f122](https://github.com/aws-amplify/amplify-cli/commit/754f12201c07132ff6c9e7ef88f4c567cdc6302d)), closes [#5124](https://github.com/aws-amplify/amplify-cli/issues/5124)
* **amplify-provider-awscloudformation:** fix bug for no credential file ([#4310](https://github.com/aws-amplify/amplify-cli/issues/4310)) ([2b941e0](https://github.com/aws-amplify/amplify-cli/commit/2b941e03e24a9589a332d3aa6b2897626a17ca1d)), closes [#4284](https://github.com/aws-amplify/amplify-cli/issues/4284)
* **cli:** fixes issues for missing build or start command ([#3918](https://github.com/aws-amplify/amplify-cli/issues/3918)) ([25c53ce](https://github.com/aws-amplify/amplify-cli/commit/25c53ce81a74c3f706f60b0519eda0a4338edbf7)), closes [#3728](https://github.com/aws-amplify/amplify-cli/issues/3728) [#3806](https://github.com/aws-amplify/amplify-cli/issues/3806)
* **cli:** moving the spinner above category initialization tasks ([#4836](https://github.com/aws-amplify/amplify-cli/issues/4836)) ([f9ad670](https://github.com/aws-amplify/amplify-cli/commit/f9ad670cb75f9c76208def8fc1da387d372bb12d)), closes [#4795](https://github.com/aws-amplify/amplify-cli/issues/4795)
* **graphql-auth-transformer:** add a time delay when creating apiKey ([#4493](https://github.com/aws-amplify/amplify-cli/issues/4493)) ([3f544e7](https://github.com/aws-amplify/amplify-cli/commit/3f544e7f421f66f3d4e920cdd89ddb926c412241))
* update circle ci check to not conflict with vs code jest ([#3840](https://github.com/aws-amplify/amplify-cli/issues/3840)) ([2e7a60d](https://github.com/aws-amplify/amplify-cli/commit/2e7a60d0a9ff3e5b8607d9aacea88f770ff3df3c))


### Features

* feature flag implementation ([#4891](https://github.com/aws-amplify/amplify-cli/issues/4891)) ([6d1c632](https://github.com/aws-amplify/amplify-cli/commit/6d1c632952a49cb56670c11c9cb0c3620d0eb332))
* golang function support for CLI ([#3789](https://github.com/aws-amplify/amplify-cli/issues/3789)) ([3dbc234](https://github.com/aws-amplify/amplify-cli/commit/3dbc23497d0d1c238c6868adcf3a6d00ad909edd))
* headless mode for API category ([#4834](https://github.com/aws-amplify/amplify-cli/issues/4834)) ([c2e09d7](https://github.com/aws-amplify/amplify-cli/commit/c2e09d73fd1bb461eeace8f4a7addd70a63047ad))
* headless update auth ([#5308](https://github.com/aws-amplify/amplify-cli/issues/5308)) ([b942f35](https://github.com/aws-amplify/amplify-cli/commit/b942f3589f1df1361ae7eb6e42f18dbf6900d1bf))
* Lambda layers ([#4697](https://github.com/aws-amplify/amplify-cli/issues/4697)) ([4e97400](https://github.com/aws-amplify/amplify-cli/commit/4e974007d95c894ab4108a2dff8d5996e7e3ce25))
* Multienv support for Lambda layers ([#5081](https://github.com/aws-amplify/amplify-cli/issues/5081)) ([4af1363](https://github.com/aws-amplify/amplify-cli/commit/4af13634bcdd58511712249e6774fc9f287c9ef5))
* resource Tagging Support ([#5178](https://github.com/aws-amplify/amplify-cli/issues/5178)) ([e34226d](https://github.com/aws-amplify/amplify-cli/commit/e34226dde30d7d345e3cc2e72e187b242a09c389))
* storage import ([#5893](https://github.com/aws-amplify/amplify-cli/issues/5893)) ([ad7b028](https://github.com/aws-amplify/amplify-cli/commit/ad7b028330bcee64d5124be7f27a8494dc8e9400))
* support importing of auth resources ([#5591](https://github.com/aws-amplify/amplify-cli/issues/5591)) ([7903246](https://github.com/aws-amplify/amplify-cli/commit/790324680544fe18481f91390001f9f07a144203))


### Performance Improvements

* **amplify-category-hosting:** http2 for cloudfront distconfig ([#3616](https://github.com/aws-amplify/amplify-cli/issues/3616)) ([dc1fd46](https://github.com/aws-amplify/amplify-cli/commit/dc1fd46535ee2b075f9ed0bc50c786dff9af1489))





## [1.8.7](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.8.4...amplify-e2e-core@1.8.7) (2020-11-20)


### Bug Fixes

* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))





## [1.8.6](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.8.4...amplify-e2e-core@1.8.6) (2020-11-20)


### Bug Fixes

* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))





## [1.8.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.8.4...amplify-e2e-core@1.8.5) (2020-11-19)


### Bug Fixes

* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))





## [1.8.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.8.3...amplify-e2e-core@1.8.4) (2020-11-08)

**Note:** Version bump only for package amplify-e2e-core





## [1.8.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.8.2...amplify-e2e-core@1.8.3) (2020-10-30)

**Note:** Version bump only for package amplify-e2e-core





## [1.8.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.8.1...amplify-e2e-core@1.8.2) (2020-10-27)

**Note:** Version bump only for package amplify-e2e-core





## [1.8.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.8.0...amplify-e2e-core@1.8.1) (2020-10-22)


### Bug Fixes

* update current-cloud backend-config on resource removal ([#5658](https://github.com/aws-amplify/amplify-cli/issues/5658)) ([592f694](https://github.com/aws-amplify/amplify-cli/commit/592f694530dd61302ff790fbcf5b3ea135812c47))





# [1.8.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.7.2...amplify-e2e-core@1.8.0) (2020-10-17)


### Features

* support importing of auth resources ([#5591](https://github.com/aws-amplify/amplify-cli/issues/5591)) ([7903246](https://github.com/aws-amplify/amplify-cli/commit/790324680544fe18481f91390001f9f07a144203))





## [1.7.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.7.1...amplify-e2e-core@1.7.2) (2020-10-09)


### Bug Fixes

* cli.json update on pull, E2E enhancements ([#5516](https://github.com/aws-amplify/amplify-cli/issues/5516)) ([952a92e](https://github.com/aws-amplify/amplify-cli/commit/952a92ef1926d86798efef2bbc27fe1c49d8e75f))





## [1.7.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.7.0...amplify-e2e-core@1.7.1) (2020-10-01)


### Bug Fixes

* **amplify-category-auth:** fix auth console ([#5408](https://github.com/aws-amplify/amplify-cli/issues/5408)) ([afbe065](https://github.com/aws-amplify/amplify-cli/commit/afbe065757ce488c1769848d0db3d03465a9b6c9)), closes [#5364](https://github.com/aws-amplify/amplify-cli/issues/5364)
* [#5354](https://github.com/aws-amplify/amplify-cli/issues/5354) .net core lambda project file naming ([#5414](https://github.com/aws-amplify/amplify-cli/issues/5414)) ([c0f1953](https://github.com/aws-amplify/amplify-cli/commit/c0f1953acaca33eb0228e1528eb5ac4eb183ff6d))
* e2e regressions from previous pr ([#5438](https://github.com/aws-amplify/amplify-cli/issues/5438)) ([398d98b](https://github.com/aws-amplify/amplify-cli/commit/398d98b6a57c41f5172d6b56e9a834cfd28b891b))





# [1.7.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.6.2...amplify-e2e-core@1.7.0) (2020-09-25)


### Features

* headless update auth ([#5308](https://github.com/aws-amplify/amplify-cli/issues/5308)) ([b942f35](https://github.com/aws-amplify/amplify-cli/commit/b942f3589f1df1361ae7eb6e42f18dbf6900d1bf))





## [1.6.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.6.1...amplify-e2e-core@1.6.2) (2020-09-16)


### Bug Fixes

* **amplify-category-storage:** fix storage update ([#5191](https://github.com/aws-amplify/amplify-cli/issues/5191)) ([754f122](https://github.com/aws-amplify/amplify-cli/commit/754f12201c07132ff6c9e7ef88f4c567cdc6302d)), closes [#5124](https://github.com/aws-amplify/amplify-cli/issues/5124)
* refactor amplify.json file handling ([#5282](https://github.com/aws-amplify/amplify-cli/issues/5282)) ([a6269f3](https://github.com/aws-amplify/amplify-cli/commit/a6269f3177f3242df81e9d7dce0625295bb7a9fc))





## [1.6.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.6.0...amplify-e2e-core@1.6.1) (2020-09-09)

**Note:** Version bump only for package amplify-e2e-core





# [1.6.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.5.0...amplify-e2e-core@1.6.0) (2020-09-03)


### Features

* Multienv support for Lambda layers ([#5081](https://github.com/aws-amplify/amplify-cli/issues/5081)) ([4af1363](https://github.com/aws-amplify/amplify-cli/commit/4af13634bcdd58511712249e6774fc9f287c9ef5))





# [1.5.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.4.3...amplify-e2e-core@1.5.0) (2020-08-31)


### Features

* resource Tagging Support ([#5178](https://github.com/aws-amplify/amplify-cli/issues/5178)) ([e34226d](https://github.com/aws-amplify/amplify-cli/commit/e34226dde30d7d345e3cc2e72e187b242a09c389))





## [1.4.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.4.2...amplify-e2e-core@1.4.3) (2020-08-14)

**Note:** Version bump only for package amplify-e2e-core





## [1.4.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.4.1...amplify-e2e-core@1.4.2) (2020-08-11)

**Note:** Version bump only for package amplify-e2e-core





## [1.4.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.4.0...amplify-e2e-core@1.4.1) (2020-08-06)

**Note:** Version bump only for package amplify-e2e-core





# [1.4.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.2.3...amplify-e2e-core@1.4.0) (2020-07-29)


### Bug Fixes

* [#4950](https://github.com/aws-amplify/amplify-cli/issues/4950) amplify cli fails with checked in local settings ([#4959](https://github.com/aws-amplify/amplify-cli/issues/4959)) ([ba0529a](https://github.com/aws-amplify/amplify-cli/commit/ba0529ac358b6f6028c6dbc4235def312f4625be))
* populate API_KEY env var when present ([#4923](https://github.com/aws-amplify/amplify-cli/issues/4923)) ([81231f9](https://github.com/aws-amplify/amplify-cli/commit/81231f98305dd9e37bb64eb30a9c7307bb471ad9))


### Features

* feature flag implementation ([#4891](https://github.com/aws-amplify/amplify-cli/issues/4891)) ([6d1c632](https://github.com/aws-amplify/amplify-cli/commit/6d1c632952a49cb56670c11c9cb0c3620d0eb332))
* headless mode for API category ([#4834](https://github.com/aws-amplify/amplify-cli/issues/4834)) ([c2e09d7](https://github.com/aws-amplify/amplify-cli/commit/c2e09d73fd1bb461eeace8f4a7addd70a63047ad))





# [1.3.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.2.3...amplify-e2e-core@1.3.0) (2020-07-23)


### Features

* feature flag implementation ([#4891](https://github.com/aws-amplify/amplify-cli/issues/4891)) ([4639450](https://github.com/aws-amplify/amplify-cli/commit/463945029cfe861f74986d9a8b9af6b827d2063d))
* headless mode for API category ([#4834](https://github.com/aws-amplify/amplify-cli/issues/4834)) ([b729266](https://github.com/aws-amplify/amplify-cli/commit/b729266b9bb519738ef88125784d72ac428f47e1))





## [1.2.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.2.2...amplify-e2e-core@1.2.3) (2020-07-18)


### Bug Fixes

* **amplify-provider-awscloudformation:** fix bug for no credential file ([#4310](https://github.com/aws-amplify/amplify-cli/issues/4310)) ([183e201](https://github.com/aws-amplify/amplify-cli/commit/183e20133eb938b596039ea63bd08e1c9b4c84e4)), closes [#4284](https://github.com/aws-amplify/amplify-cli/issues/4284)





## [1.2.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.2.1...amplify-e2e-core@1.2.2) (2020-07-15)


### Bug Fixes

* **cli:** moving the spinner above category initialization tasks ([#4836](https://github.com/aws-amplify/amplify-cli/issues/4836)) ([5884801](https://github.com/aws-amplify/amplify-cli/commit/5884801217cd07bfcea8273a56bdf0fff21c6994)), closes [#4795](https://github.com/aws-amplify/amplify-cli/issues/4795)
* **graphql-auth-transformer:** add a time delay when creating apiKey ([#4493](https://github.com/aws-amplify/amplify-cli/issues/4493)) ([1d56b40](https://github.com/aws-amplify/amplify-cli/commit/1d56b40d673b257e07905d9bc1830e8f9c8495a1))





## [1.2.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.2.0...amplify-e2e-core@1.2.1) (2020-07-11)

**Note:** Version bump only for package amplify-e2e-core





# [1.2.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.1.9...amplify-e2e-core@1.2.0) (2020-07-07)


### Features

* Lambda layers ([#4697](https://github.com/aws-amplify/amplify-cli/issues/4697)) ([c55b2e0](https://github.com/aws-amplify/amplify-cli/commit/c55b2e0c3377127aaf887591d7bc20d7240ef11d))





## [1.1.9](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.1.8...amplify-e2e-core@1.1.9) (2020-06-25)

**Note:** Version bump only for package amplify-e2e-core





## [1.1.8](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.1.7...amplify-e2e-core@1.1.8) (2020-06-18)

**Note:** Version bump only for package amplify-e2e-core





## [1.1.7](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.1.6...amplify-e2e-core@1.1.7) (2020-06-11)

**Note:** Version bump only for package amplify-e2e-core





## [1.1.6](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.1.5...amplify-e2e-core@1.1.6) (2020-06-10)


### Bug Fixes

* make Hello World the default choice for function templates ([#4466](https://github.com/aws-amplify/amplify-cli/issues/4466)) ([1c60b2b](https://github.com/aws-amplify/amplify-cli/commit/1c60b2ba617ccba625c1a6cf56840a9eedad4fb5))


### Performance Improvements

* **amplify-category-hosting:** http2 for cloudfront distconfig ([#3616](https://github.com/aws-amplify/amplify-cli/issues/3616)) ([b5de093](https://github.com/aws-amplify/amplify-cli/commit/b5de093cb0c387ac7f902498727af2c1111a77ca))





## [1.1.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.1.4...amplify-e2e-core@1.1.5) (2020-06-02)

**Note:** Version bump only for package amplify-e2e-core





## [1.1.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.1.3...amplify-e2e-core@1.1.4) (2020-05-26)


### Bug Fixes

* deleted extra carriageReturn calls, fixed grammar in Auth dx ([#4237](https://github.com/aws-amplify/amplify-cli/issues/4237)) ([4322a32](https://github.com/aws-amplify/amplify-cli/commit/4322a326df8c5c0a89de5f5e8f46bcfd4e1ad770))
* **amplify-category-api:** toggle datastore in update ([#4276](https://github.com/aws-amplify/amplify-cli/issues/4276)) ([c522f29](https://github.com/aws-amplify/amplify-cli/commit/c522f295304410aeb1d6f60aaba9b466d3304ee1)), closes [#4058](https://github.com/aws-amplify/amplify-cli/issues/4058)





## [1.1.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.1.2...amplify-e2e-core@1.1.3) (2020-05-15)


### Bug Fixes

* **amplify-category-auth:** adding unique Id to Role name ([#4231](https://github.com/aws-amplify/amplify-cli/issues/4231)) ([21de1af](https://github.com/aws-amplify/amplify-cli/commit/21de1affd89142598a1f8022c387b3c04994b1e0))
* **cli:** fixes issues for missing build or start command ([#3918](https://github.com/aws-amplify/amplify-cli/issues/3918)) ([25c53ce](https://github.com/aws-amplify/amplify-cli/commit/25c53ce81a74c3f706f60b0519eda0a4338edbf7)), closes [#3728](https://github.com/aws-amplify/amplify-cli/issues/3728) [#3806](https://github.com/aws-amplify/amplify-cli/issues/3806)





## [1.1.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.1.1...amplify-e2e-core@1.1.2) (2020-05-08)


### Bug Fixes

* remove duplicate permissions from resources in same category ([#4091](https://github.com/aws-amplify/amplify-cli/issues/4091)) ([3f6036b](https://github.com/aws-amplify/amplify-cli/commit/3f6036b6b614a5e7a5f89e3ede289ffafba9fbb3))





## [1.1.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.1.0...amplify-e2e-core@1.1.1) (2020-04-23)


### Bug Fixes

* implement retries and CFN polls in e2e tests ([#4028](https://github.com/aws-amplify/amplify-cli/issues/4028)) ([b71391f](https://github.com/aws-amplify/amplify-cli/commit/b71391facdd0d4f301522f10fb7d722aad406ed6))





# [1.1.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-core@1.0.1...amplify-e2e-core@1.1.0) (2020-04-06)


### Bug Fixes

* e2e raise test timeout because of CFN ([#3862](https://github.com/aws-amplify/amplify-cli/issues/3862)) ([5093654](https://github.com/aws-amplify/amplify-cli/commit/5093654a8a402a9290275a838c393dd115c0b897))
* update circle ci check to not conflict with vs code jest ([#3840](https://github.com/aws-amplify/amplify-cli/issues/3840)) ([2e7a60d](https://github.com/aws-amplify/amplify-cli/commit/2e7a60d0a9ff3e5b8607d9aacea88f770ff3df3c))


### Features

* golang function support for CLI ([#3789](https://github.com/aws-amplify/amplify-cli/issues/3789)) ([3dbc234](https://github.com/aws-amplify/amplify-cli/commit/3dbc23497d0d1c238c6868adcf3a6d00ad909edd))





## 1.0.1 (2020-03-22)

**Note:** Version bump only for package amplify-e2e-core
