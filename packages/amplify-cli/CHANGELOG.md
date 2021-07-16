# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.1.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@5.1.0...@aws-amplify/cli@5.1.1) (2021-07-12)

**Note:** Version bump only for package @aws-amplify/cli





# [5.1.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@5.0.2...@aws-amplify/cli@5.1.0) (2021-06-30)


### Bug Fixes

* [#7561](https://github.com/aws-amplify/amplify-cli/issues/7561) - auth trigger usage with user groups ([#7592](https://github.com/aws-amplify/amplify-cli/issues/7592)) ([d1d372e](https://github.com/aws-amplify/amplify-cli/commit/d1d372ee55d2fb1c15022642837c1f6fb6994ac8))


### Features

* configure env vars and secrets for lambda functions ([#7529](https://github.com/aws-amplify/amplify-cli/issues/7529)) ([fac354e](https://github.com/aws-amplify/amplify-cli/commit/fac354e5e26846e8b1499d3a4718b15983e0110f))





## [5.0.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@5.0.1...@aws-amplify/cli@5.0.2) (2021-06-24)


### Bug Fixes

* **cli:** make sure to await returned promise from async functions ([#7379](https://github.com/aws-amplify/amplify-cli/issues/7379)) ([af2a52a](https://github.com/aws-amplify/amplify-cli/commit/af2a52a445266f875d2849898501b6c0ca82288f))





## [5.0.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@5.0.0...@aws-amplify/cli@5.0.1) (2021-06-19)



## 5.0.1 (2021-06-18)


### Bug Fixes

* catch no updates CFN error and fix CFN poller hang ([#7548](https://github.com/aws-amplify/amplify-cli/issues/7548)) ([312eec3](https://github.com/aws-amplify/amplify-cli/commit/312eec3b5cd9019b500cf1984919af1dee5ef2e0))





# [5.0.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.52.0...@aws-amplify/cli@5.0.0) (2021-06-15)


### Bug Fixes

* bump amplify-cli to v5 and fix layers migration tests ([#7493](https://github.com/aws-amplify/amplify-cli/issues/7493)) ([cb196ab](https://github.com/aws-amplify/amplify-cli/commit/cb196ab4d1c9e25ef30b5276c55202a3ef347c75))


### Features

* add support for defining IAM Permissions Boundary for Project ([#7144](https://github.com/aws-amplify/amplify-cli/issues/7144)) ([acf031b](https://github.com/aws-amplify/amplify-cli/commit/acf031b29d4e554d647da39ffb8293010cf1d8ad))
* Define IAM Permissions Boundary for Project ([#7502](https://github.com/aws-amplify/amplify-cli/issues/7502)) (ref [#4618](https://github.com/aws-amplify/amplify-cli/issues/4618)) ([08f7a3c](https://github.com/aws-amplify/amplify-cli/commit/08f7a3c45b2e98535ef325eb0a97c5bc4d3008c6)), closes [#7053](https://github.com/aws-amplify/amplify-cli/issues/7053)
* lambda layers rework ([#7375](https://github.com/aws-amplify/amplify-cli/issues/7375)) ([a3b7d3e](https://github.com/aws-amplify/amplify-cli/commit/a3b7d3e427e16bac2b2ea27699fe53b48cf47656))


### Reverts

* Revert "feat: add support for defining IAM Permissions Boundary for Project (#7144)" (#7453) ([08704f0](https://github.com/aws-amplify/amplify-cli/commit/08704f0271f6f5d0e0e98ad7002f4b35c3890924)), closes [#7144](https://github.com/aws-amplify/amplify-cli/issues/7144) [#7453](https://github.com/aws-amplify/amplify-cli/issues/7453)


### BREAKING CHANGES

* bump amplify-cli to v5 for Lambda layers rework





# [4.52.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.51.4...@aws-amplify/cli@4.52.0) (2021-06-02)



# 4.52.0 (2021-06-01)


### Features

* add support for SMS Sandbox ([#7436](https://github.com/aws-amplify/amplify-cli/issues/7436)) ([cdcb626](https://github.com/aws-amplify/amplify-cli/commit/cdcb6260c11bbedef5b056fdcd730612d8bb3230))





## [4.51.4](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.51.3...@aws-amplify/cli@4.51.4) (2021-05-29)

**Note:** Version bump only for package @aws-amplify/cli





## [4.51.3](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.51.2...@aws-amplify/cli@4.51.3) (2021-05-26)

**Note:** Version bump only for package @aws-amplify/cli





## [4.51.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.51.1...@aws-amplify/cli@4.51.2) (2021-05-22)

**Note:** Version bump only for package @aws-amplify/cli





## [4.51.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.51.0...@aws-amplify/cli@4.51.1) (2021-05-18)

**Note:** Version bump only for package @aws-amplify/cli





# [4.51.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.50.2...@aws-amplify/cli@4.51.0) (2021-05-14)



# 4.51.0 (2021-05-13)


### Bug Fixes

* cross resource permission handling ([#7289](https://github.com/aws-amplify/amplify-cli/issues/7289)) ([4a9fb78](https://github.com/aws-amplify/amplify-cli/commit/4a9fb78d4e1fecdf79634c1782bdefa17d803632))
* respect headless frontend input ([#7257](https://github.com/aws-amplify/amplify-cli/issues/7257)) ([aab4275](https://github.com/aws-amplify/amplify-cli/commit/aab4275ef3aba2c648b53ca46ecf530d2521cbc9))


### Features

* defer root stack creation to first `amplify push` ([#7174](https://github.com/aws-amplify/amplify-cli/issues/7174)) ([d28dd1c](https://github.com/aws-amplify/amplify-cli/commit/d28dd1caca86b19a858dab0e7aa907d1cc74c86a))
* prep work for SMS Sandbox support ([#7302](https://github.com/aws-amplify/amplify-cli/issues/7302)) ([d1f85d2](https://github.com/aws-amplify/amplify-cli/commit/d1f85d2e0a9c367b71defefe6d9e00737f681ca4))
* **amplify-frontend-ios:** amplify-xcode integration ([#6867](https://github.com/aws-amplify/amplify-cli/issues/6867)) ([338cea2](https://github.com/aws-amplify/amplify-cli/commit/338cea2f574bab242311989bc5024b9e149bd48b))


### Reverts

* Revert "feat: defer root stack creation to first `amplify push` (#7174)" (#7306) ([78854eb](https://github.com/aws-amplify/amplify-cli/commit/78854ebd4a3d41d34d68736d6556045302101265)), closes [#7174](https://github.com/aws-amplify/amplify-cli/issues/7174) [#7306](https://github.com/aws-amplify/amplify-cli/issues/7306)





## [4.50.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.50.0...@aws-amplify/cli@4.50.2) (2021-05-03)



## 4.50.1 (2021-05-03)

**Note:** Version bump only for package @aws-amplify/cli





## [4.50.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.50.0...@aws-amplify/cli@4.50.1) (2021-05-03)

**Note:** Version bump only for package @aws-amplify/cli





# [4.50.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.49.0...@aws-amplify/cli@4.50.0) (2021-04-27)


### Features

* S3 SSE by default ([#7039](https://github.com/aws-amplify/amplify-cli/issues/7039)) (ref [#5708](https://github.com/aws-amplify/amplify-cli/issues/5708)) ([c1369ed](https://github.com/aws-amplify/amplify-cli/commit/c1369ed6f9c204c89ee2d4c805314a40d6eeaf92))





# [4.49.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.48.0...@aws-amplify/cli@4.49.0) (2021-04-19)


### Bug Fixes

* **cli:** adds dart config to git ignore; rebased branch ([808edd9](https://github.com/aws-amplify/amplify-cli/commit/808edd9fa7f7431cc0d7cdb4c450be23b8a8d2ca))
* removed sts call ([#7092](https://github.com/aws-amplify/amplify-cli/issues/7092)) ([550a135](https://github.com/aws-amplify/amplify-cli/commit/550a135c9f1271e859f08f43cd685d7fff46e949))


### Features

* **cli:** validate iterative rollback input ([9cd69c9](https://github.com/aws-amplify/amplify-cli/commit/9cd69c9732d4824601e1d33806937e574155778b))





# [4.48.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.47.1...@aws-amplify/cli@4.48.0) (2021-04-14)


### Bug Fixes

* **cli:** display gql schema errors on failed push ([#7001](https://github.com/aws-amplify/amplify-cli/issues/7001)) ([3e88993](https://github.com/aws-amplify/amplify-cli/commit/3e88993a4a91794690099205580cf0ae935eff40))
* fixes e2e bug ([#7067](https://github.com/aws-amplify/amplify-cli/issues/7067)) ([18c9a31](https://github.com/aws-amplify/amplify-cli/commit/18c9a310fd6fbc25c01df40dfd7d0ad731da17d1))


### Features

* added new fields to usage data ([#6911](https://github.com/aws-amplify/amplify-cli/issues/6911)) ([dc1d256](https://github.com/aws-amplify/amplify-cli/commit/dc1d256edecec2009ca6649da0995be571886b03))





## [4.47.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.46.1...@aws-amplify/cli@4.47.1) (2021-04-09)


### Bug Fixes

* update delete prompt text color to red ([#6881](https://github.com/aws-amplify/amplify-cli/issues/6881)) ([0546850](https://github.com/aws-amplify/amplify-cli/commit/0546850484fac85023573b4bbeba7d46c0b34970))
* **amplify-cli:** add a warning on entering invalid subcommand for amplify env ([#6925](https://github.com/aws-amplify/amplify-cli/issues/6925)) ([2dfd2ac](https://github.com/aws-amplify/amplify-cli/commit/2dfd2acac1a721e174818eebd36332679197d25d))





## [4.46.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.46.0...@aws-amplify/cli@4.46.1) (2021-03-24)


### Reverts

* Revert "Init and Configure DX changes (#6745)" ([9078b69](https://github.com/aws-amplify/amplify-cli/commit/9078b69b5842c99f0624797a5e897353bacb65d0)), closes [#6745](https://github.com/aws-amplify/amplify-cli/issues/6745)





# [4.46.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.45.2...@aws-amplify/cli@4.46.0) (2021-03-23)


### Bug Fixes

* **cli:** freeze constants object to not be changed ([#6821](https://github.com/aws-amplify/amplify-cli/issues/6821)) ([10a4160](https://github.com/aws-amplify/amplify-cli/commit/10a41601912d00770b2fae6e2884c6a57d69ee80))
* detect changes in dockerfile ([#6495](https://github.com/aws-amplify/amplify-cli/issues/6495)) ([2333dec](https://github.com/aws-amplify/amplify-cli/commit/2333decdd61c2a5421a7030723f20d05f3c00269)), closes [#6359](https://github.com/aws-amplify/amplify-cli/issues/6359)
* fix s3Cloudfront exception on push ([#6913](https://github.com/aws-amplify/amplify-cli/issues/6913)) ([1799089](https://github.com/aws-amplify/amplify-cli/commit/1799089ef8f84bb2a7b853e62d95b62eeea8cd31))


### Features

* **cli:** add 'amplify env ls' alias ([#6618](https://github.com/aws-amplify/amplify-cli/issues/6618)) ([50a5775](https://github.com/aws-amplify/amplify-cli/commit/50a5775a4468ea88e3ba5050c0365b29691afb61))





## [4.45.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.45.1...@aws-amplify/cli@4.45.2) (2021-03-12)



## 4.45.2 (2021-03-12)


### Bug Fixes

* bump codegen versions ([#6871](https://github.com/aws-amplify/amplify-cli/issues/6871)) ([e53175d](https://github.com/aws-amplify/amplify-cli/commit/e53175d96136fba57662b1a035d3cea4a65a7601))





## [4.45.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.45.0...@aws-amplify/cli@4.45.1) (2021-03-11)

**Note:** Version bump only for package @aws-amplify/cli





# [4.45.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.44.2...@aws-amplify/cli@4.45.0) (2021-03-05)


### Bug Fixes

* **amplify-codegen:** update dependency on amplify-codegen to latest ([#6796](https://github.com/aws-amplify/amplify-cli/issues/6796)) ([33f4c15](https://github.com/aws-amplify/amplify-cli/commit/33f4c156153ef6398659dd5c24a7de8b0d9b13f2))
* [#5765](https://github.com/aws-amplify/amplify-cli/issues/5765) add support for android studio, xcode ([#6527](https://github.com/aws-amplify/amplify-cli/issues/6527)) ([092afa2](https://github.com/aws-amplify/amplify-cli/commit/092afa2340762cac781336ac411d489e3affccb0))
* [#6681](https://github.com/aws-amplify/amplify-cli/issues/6681), handling case when no frontend plugins found ([#6688](https://github.com/aws-amplify/amplify-cli/issues/6688)) ([fd9f50f](https://github.com/aws-amplify/amplify-cli/commit/fd9f50f39a3cf97bae902cf10c42ce54d1ae3d5b))
* **cli:** add defensive coding to isContainersEnabled() ([#6758](https://github.com/aws-amplify/amplify-cli/issues/6758)) ([78bb42d](https://github.com/aws-amplify/amplify-cli/commit/78bb42d6f73d774741a4d5dc93ae31176becac62))


### Features

* **amplify-codegen:** Migrate codegen ([#6730](https://github.com/aws-amplify/amplify-cli/issues/6730)) ([9c7a69a](https://github.com/aws-amplify/amplify-cli/commit/9c7a69a7d72e31c42572f3ebf2131c6053f96abd))





## [4.44.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.44.1...@aws-amplify/cli@4.44.2) (2021-02-26)



## 4.44.2 (2021-02-26)


### Bug Fixes

* truncate long app names on pull ([#6741](https://github.com/aws-amplify/amplify-cli/issues/6741)) ([748b252](https://github.com/aws-amplify/amplify-cli/commit/748b2524115e6ea071e09430f0d8174110c84829))





## [4.44.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.44.0...@aws-amplify/cli@4.44.1) (2021-02-24)


### Bug Fixes

* [#6153](https://github.com/aws-amplify/amplify-cli/issues/6153) highlight the destructive delete prompt ([#6528](https://github.com/aws-amplify/amplify-cli/issues/6528)) ([13333b2](https://github.com/aws-amplify/amplify-cli/commit/13333b2e7a128b9b33dc08960422d3183dcb7e28))





# [4.44.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.43.0...@aws-amplify/cli@4.44.0) (2021-02-17)


### Features

* Separate prod and dev lambda function builds ([#6494](https://github.com/aws-amplify/amplify-cli/issues/6494)) ([2977c6a](https://github.com/aws-amplify/amplify-cli/commit/2977c6a886b33a38ef46f898a2adc1ffdb6d228b))





# [4.43.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.42.0...@aws-amplify/cli@4.43.0) (2021-02-11)


### Features

* dont open urls when CLI is running in CI ([#6503](https://github.com/aws-amplify/amplify-cli/issues/6503)) ([27546a7](https://github.com/aws-amplify/amplify-cli/commit/27546a78159ea95c636dbbd094fe6a4f7fb8f8f4)), closes [#5973](https://github.com/aws-amplify/amplify-cli/issues/5973)





# [4.42.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.41.2...@aws-amplify/cli@4.42.0) (2021-02-10)


### Bug Fixes

* **amplify-category-function:** use ref for S3Bucket and S3Key in CFN ([#6358](https://github.com/aws-amplify/amplify-cli/issues/6358)) ([84a141a](https://github.com/aws-amplify/amplify-cli/commit/84a141ac4812d95c27b14c8d9f81e4a5c8fadef8))
* [#6397](https://github.com/aws-amplify/amplify-cli/issues/6397) - auth update overwrite parameters ([#6403](https://github.com/aws-amplify/amplify-cli/issues/6403)) ([75f5ace](https://github.com/aws-amplify/amplify-cli/commit/75f5ace173a6b36b943e2110845e411a2cce5d6d))
* check for local env file and then fall back on exeinfo ([#6500](https://github.com/aws-amplify/amplify-cli/issues/6500)) ([d2bc6d8](https://github.com/aws-amplify/amplify-cli/commit/d2bc6d86ada45fbda8014a54ed2d09459411d7ab))
* persist s3bucket metadata on pull and env change ([#6502](https://github.com/aws-amplify/amplify-cli/issues/6502)) ([357f787](https://github.com/aws-amplify/amplify-cli/commit/357f787c2d816e1defa1d0909b06f82775c35255))


### Features

* add Flutter  support for Admin UI ([#6516](https://github.com/aws-amplify/amplify-cli/issues/6516)) ([d9ee44b](https://github.com/aws-amplify/amplify-cli/commit/d9ee44be73f43b11da2a07d21fd60108f49b1608))





## [4.41.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.41.1...@aws-amplify/cli@4.41.2) (2021-01-13)

**Note:** Version bump only for package @aws-amplify/cli





## [4.41.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.41.0...@aws-amplify/cli@4.41.1) (2021-01-08)


### Bug Fixes

* **cli:** handle undefined enabledProviders ([#6293](https://github.com/aws-amplify/amplify-cli/issues/6293)) ([b57b05d](https://github.com/aws-amplify/amplify-cli/commit/b57b05dc95109e490cb4b07c7304f32949607b77))
* apply tags on create and push nested stack ([#6321](https://github.com/aws-amplify/amplify-cli/issues/6321)) ([4faa3e5](https://github.com/aws-amplify/amplify-cli/commit/4faa3e5ac38d311fe7901fb1b8a1b542cf19e598))
* remove process on next and await ([#6239](https://github.com/aws-amplify/amplify-cli/issues/6239)) ([59d4a0e](https://github.com/aws-amplify/amplify-cli/commit/59d4a0eb318d2b3ad97be34bda9dee756cf82d74))
* removes nodeModules for lambda functions ([#6317](https://github.com/aws-amplify/amplify-cli/issues/6317)) ([091e148](https://github.com/aws-amplify/amplify-cli/commit/091e148ada698567bbdc78fc528da8c5a8e57a73))
* removes nodeModules from currentCloudBackend ([#6261](https://github.com/aws-amplify/amplify-cli/issues/6261)) ([db9dca9](https://github.com/aws-amplify/amplify-cli/commit/db9dca9db019494a0c68f42d9ffeb92d0b9b2b43))





# [4.41.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.40.1...@aws-amplify/cli@4.41.0) (2020-12-31)


### Features

* **cli:** generate REAMDE file in amplify dir ([#5808](https://github.com/aws-amplify/amplify-cli/issues/5808)) ([cf0629f](https://github.com/aws-amplify/amplify-cli/commit/cf0629f7385df77aad19fddd58e3587e40482de2))





## [4.40.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.40.0...@aws-amplify/cli@4.40.1) (2020-12-21)


### Bug Fixes

* **cli:** update plugin type details url ([#6120](https://github.com/aws-amplify/amplify-cli/issues/6120)) ([d6c44cc](https://github.com/aws-amplify/amplify-cli/commit/d6c44cc2770a13f86ee208d2585ec625517523dd))
* [#6168](https://github.com/aws-amplify/amplify-cli/issues/6168), update error messages, yarn.lock ([#6207](https://github.com/aws-amplify/amplify-cli/issues/6207)) ([450eb0e](https://github.com/aws-amplify/amplify-cli/commit/450eb0e618c66ed34719f65a5a799a193d6a8a94))
* skip delete ([#6204](https://github.com/aws-amplify/amplify-cli/issues/6204)) ([33f51d0](https://github.com/aws-amplify/amplify-cli/commit/33f51d07b7a7584575788f6265c43b28cec72e05))





# [4.40.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.39.0...@aws-amplify/cli@4.40.0) (2020-12-16)


### Bug Fixes

* check that cfn template exists ([#6163](https://github.com/aws-amplify/amplify-cli/issues/6163)) ([04b9918](https://github.com/aws-amplify/amplify-cli/commit/04b991810897525816257272822ded002b27f0e5))
* hostedUIProviderCreds Not found and check for localenv ([#6099](https://github.com/aws-amplify/amplify-cli/issues/6099)) ([874ceaa](https://github.com/aws-amplify/amplify-cli/commit/874ceaa7811bad2cd0ad3ba35f588b7fca0ead0f))
* provide better error message when unknown feature flags are present ([#6114](https://github.com/aws-amplify/amplify-cli/issues/6114)) ([d452e83](https://github.com/aws-amplify/amplify-cli/commit/d452e83c19bc6c4002a851c68b3961fc135f3689))


### Features

* added exception item into options ([#6018](https://github.com/aws-amplify/amplify-cli/issues/6018)) ([7a3be75](https://github.com/aws-amplify/amplify-cli/commit/7a3be75935de928b0e080afc3a07e7efa1eeb8bf))


### Reverts

* Revert "feat: added exception item into options (#6018)" (#6157) ([6fb0b07](https://github.com/aws-amplify/amplify-cli/commit/6fb0b07b4daf7e4d964f3db35194d2ba8652d76c)), closes [#6018](https://github.com/aws-amplify/amplify-cli/issues/6018) [#6157](https://github.com/aws-amplify/amplify-cli/issues/6157)





# [4.39.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.38.2...@aws-amplify/cli@4.39.0) (2020-12-11)


### Bug Fixes

* disabling local logging ([#6125](https://github.com/aws-amplify/amplify-cli/issues/6125)) ([89c9d8b](https://github.com/aws-amplify/amplify-cli/commit/89c9d8b6fe811cc45749062c65266d280f8f47e1))


### Features

* container-based deployments([#5727](https://github.com/aws-amplify/amplify-cli/issues/5727)) ([fad6377](https://github.com/aws-amplify/amplify-cli/commit/fad6377bd384862ca4429cb1a83eee90efd62b58))





## [4.38.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.38.1...@aws-amplify/cli@4.38.2) (2020-12-09)

**Note:** Version bump only for package @aws-amplify/cli





## [4.38.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.38.0...@aws-amplify/cli@4.38.1) (2020-12-09)



## 4.38.1 (2020-12-08)


### Bug Fixes

* check amplify/backend to determine project existence ([#6115](https://github.com/aws-amplify/amplify-cli/issues/6115)) ([4135a24](https://github.com/aws-amplify/amplify-cli/commit/4135a2428027d801c78e6877d0936f9753ba83e4))





# [4.38.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.37.1...@aws-amplify/cli@4.38.0) (2020-12-07)


### Features

* add support for multiple [@key](https://github.com/key) changes in same [@model](https://github.com/model) ([#6044](https://github.com/aws-amplify/amplify-cli/issues/6044)) ([e574637](https://github.com/aws-amplify/amplify-cli/commit/e5746379ea1330c53dacb55e8f6a9de7b17b55ae))





## [4.37.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.37.0...@aws-amplify/cli@4.37.1) (2020-12-03)

**Note:** Version bump only for package @aws-amplify/cli





# [4.37.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.36.2...@aws-amplify/cli@4.37.0) (2020-11-30)


### Features

* pre-deploy pull, new login mechanism and pkg cli updates ([#5941](https://github.com/aws-amplify/amplify-cli/issues/5941)) ([7274251](https://github.com/aws-amplify/amplify-cli/commit/7274251faadc1035acce5f44699b172e10e2e67d))





## [4.36.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.36.1...@aws-amplify/cli@4.36.2) (2020-11-28)

**Note:** Version bump only for package @aws-amplify/cli





## [4.36.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.36.0...@aws-amplify/cli@4.36.1) (2020-11-27)


### Bug Fixes

* migrate check for env command ([#5987](https://github.com/aws-amplify/amplify-cli/issues/5987)) ([4b10034](https://github.com/aws-amplify/amplify-cli/commit/4b10034f247d3f441ec8ee13d579972be64a5132))





# [4.36.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.35.0...@aws-amplify/cli@4.36.0) (2020-11-26)


### Bug Fixes

* removing deployment secrets and skip check on get ([#5943](https://github.com/aws-amplify/amplify-cli/issues/5943)) ([2b200b6](https://github.com/aws-amplify/amplify-cli/commit/2b200b6c97ba843b7cd37c0ee52a365f02614053))


### Features

* **iOS:** execute `amplify-app` flow on `init ` and `codegen models` ([#5917](https://github.com/aws-amplify/amplify-cli/issues/5917)) ([c47c8f7](https://github.com/aws-amplify/amplify-cli/commit/c47c8f78b37806181354d3842a2094c35b1795d0))


### Reverts

* Revert "feat(iOS): execute `amplify-app` flow on `init ` and `codegen models` (#5917)" (#5960) ([cd7951a](https://github.com/aws-amplify/amplify-cli/commit/cd7951ab6d26f1206c2f0ff95225ba7b2a5a25eb)), closes [#5917](https://github.com/aws-amplify/amplify-cli/issues/5917) [#5960](https://github.com/aws-amplify/amplify-cli/issues/5960)





# [4.35.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.34.0...@aws-amplify/cli@4.35.0) (2020-11-24)


### Features

* amplify upgrade and amplify uninstall commands ([#5852](https://github.com/aws-amplify/amplify-cli/issues/5852)) ([c0aa2d9](https://github.com/aws-amplify/amplify-cli/commit/c0aa2d9fa4739214aba42fa9fff5d6c5164f540c))





# [4.34.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.32.1...@aws-amplify/cli@4.34.0) (2020-11-22)


### Bug Fixes

* removed extra blank space in error message ([#5821](https://github.com/aws-amplify/amplify-cli/issues/5821)) ([da2cca3](https://github.com/aws-amplify/amplify-cli/commit/da2cca3d44ba2c995407acae6ce1c97ba4a0a21d))
* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))


### Features

* storage import ([#5893](https://github.com/aws-amplify/amplify-cli/issues/5893)) ([ad7b028](https://github.com/aws-amplify/amplify-cli/commit/ad7b028330bcee64d5124be7f27a8494dc8e9400))





# [4.33.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.8.4...@aws-amplify/cli@4.33.0) (2020-11-22)


### Bug Fixes

* --yes on pull and init no longer does a force push. Use --forcePush in addition to --yes to force a push ([#5546](https://github.com/aws-amplify/amplify-cli/issues/5546)) ([b20c2d6](https://github.com/aws-amplify/amplify-cli/commit/b20c2d6f1240565604f4a6b8ffe53987c4f76ed4))
* [#4549](https://github.com/aws-amplify/amplify-cli/issues/4549) [#4550](https://github.com/aws-amplify/amplify-cli/issues/4550) init and folder exist checks ([#4553](https://github.com/aws-amplify/amplify-cli/issues/4553)) ([30a33f9](https://github.com/aws-amplify/amplify-cli/commit/30a33f9e8ca9ff23d6e7343ef8e869461133f709))
* [#4950](https://github.com/aws-amplify/amplify-cli/issues/4950) amplify cli fails with checked in local settings ([#4959](https://github.com/aws-amplify/amplify-cli/issues/4959)) ([ba0529a](https://github.com/aws-amplify/amplify-cli/commit/ba0529ac358b6f6028c6dbc4235def312f4625be))
* [#5516](https://github.com/aws-amplify/amplify-cli/issues/5516) exclude pinpoint from provider check for false positives ([#5535](https://github.com/aws-amplify/amplify-cli/issues/5535)) ([c3ea3a4](https://github.com/aws-amplify/amplify-cli/commit/c3ea3a4343d6ebd2f48d1c0ac6574c6d118e73d0))
* abort being called multiple times ([#5302](https://github.com/aws-amplify/amplify-cli/issues/5302)) ([83b2d10](https://github.com/aws-amplify/amplify-cli/commit/83b2d109b6f3cf2e9962bad78607b6a41e7599e2))
* add compatibility to json parse for non-string values ([#5147](https://github.com/aws-amplify/amplify-cli/issues/5147)) ([3bc9306](https://github.com/aws-amplify/amplify-cli/commit/3bc9306c7b3d078d9b531f5950e8a304fc031d23))
* add support for mobile hub migrated resources ([#5407](https://github.com/aws-amplify/amplify-cli/issues/5407)) ([5dfe287](https://github.com/aws-amplify/amplify-cli/commit/5dfe2872c153047ebdc56bc4f671fd57c12379d9))
* added exit code on remove ([#5427](https://github.com/aws-amplify/amplify-cli/issues/5427)) ([33132f7](https://github.com/aws-amplify/amplify-cli/commit/33132f764b290cafd345720409a5db8ea6088069))
* append env resource params instead of replace ([#4161](https://github.com/aws-amplify/amplify-cli/issues/4161)) ([4f1aa97](https://github.com/aws-amplify/amplify-cli/commit/4f1aa97685c0162044e299d97668b1d92e4ad1dc))
* check lib before running post-install ([#5669](https://github.com/aws-amplify/amplify-cli/issues/5669)) ([9ccda46](https://github.com/aws-amplify/amplify-cli/commit/9ccda46fb3ea545f838939b2b13d1555d95437dd))
* Check that config object exists before creating new env ([#3624](https://github.com/aws-amplify/amplify-cli/issues/3624)) ([fc6f6a1](https://github.com/aws-amplify/amplify-cli/commit/fc6f6a1ef11f3113df88e68268d3c1c47350f1fa))
* data inconsitency ([#5344](https://github.com/aws-amplify/amplify-cli/issues/5344)) ([bfe1903](https://github.com/aws-amplify/amplify-cli/commit/bfe19038b5b676056f45d7ffcc4c2460057936d8))
* fixed Tags update when no resource ([#5187](https://github.com/aws-amplify/amplify-cli/issues/5187)) ([3bc85b0](https://github.com/aws-amplify/amplify-cli/commit/3bc85b02ccf127a79689ca7600ab6f35f6421187))
* mobile hub check miss for uninitialized projects ([#5457](https://github.com/aws-amplify/amplify-cli/issues/5457)) ([879b0dd](https://github.com/aws-amplify/amplify-cli/commit/879b0ddf947c418a1fe778eaf7925128812f0248))
* move mobile hub flag to context directly ([#5459](https://github.com/aws-amplify/amplify-cli/issues/5459)) ([1828d21](https://github.com/aws-amplify/amplify-cli/commit/1828d214e3491a3633d72f571b7a8f1ab271f7a1))
* move post-install steps to plugin platform rather than post install script ([#5678](https://github.com/aws-amplify/amplify-cli/issues/5678)) ([f83bbab](https://github.com/aws-amplify/amplify-cli/commit/f83bbab378f6857202653cd57c607cead11cbe52))
* occurred spelling mistake ([#4595](https://github.com/aws-amplify/amplify-cli/issues/4595)) ([a461487](https://github.com/aws-amplify/amplify-cli/commit/a461487072dbf422892ca24c436581b49c568429))
* publish returns with exitcode 1 ([#5413](https://github.com/aws-amplify/amplify-cli/issues/5413)) ([2064830](https://github.com/aws-amplify/amplify-cli/commit/20648308fca4d4ae6dba84874c3f5508405ff701))
* refactor amplify.json file handling ([#5282](https://github.com/aws-amplify/amplify-cli/issues/5282)) ([a6269f3](https://github.com/aws-amplify/amplify-cli/commit/a6269f3177f3242df81e9d7dce0625295bb7a9fc))
* refactor mobile hub migration checks ([#5632](https://github.com/aws-amplify/amplify-cli/issues/5632)) ([b796eb8](https://github.com/aws-amplify/amplify-cli/commit/b796eb8303bb903f5f531506254441a63eba2962))
* removed extra blank space in error message ([#5821](https://github.com/aws-amplify/amplify-cli/issues/5821)) ([da2cca3](https://github.com/aws-amplify/amplify-cli/commit/da2cca3d44ba2c995407acae6ce1c97ba4a0a21d))
* replaced v1 docs references with v2 docs references ([#4169](https://github.com/aws-amplify/amplify-cli/issues/4169)) ([b578c2d](https://github.com/aws-amplify/amplify-cli/commit/b578c2dcd10038367c653ede2f6da42e7644b41b))
* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))
* update current-cloud backend-config on resource removal ([#5658](https://github.com/aws-amplify/amplify-cli/issues/5658)) ([592f694](https://github.com/aws-amplify/amplify-cli/commit/592f694530dd61302ff790fbcf5b3ea135812c47))
* **amplify-app:** initialize feature flag  ([#5643](https://github.com/aws-amplify/amplify-cli/issues/5643)) ([9608b56](https://github.com/aws-amplify/amplify-cli/commit/9608b5616c2b92417a1b559f41f5d3f8f42f97e5))
* **amplify-python-function-runtime-provider:** change exec to execa ([#4673](https://github.com/aws-amplify/amplify-cli/issues/4673)) ([ef27517](https://github.com/aws-amplify/amplify-cli/commit/ef27517279fef07ee06b0af5287e6548b76f0c6d))
* **cli:** add information on pre/post pull in learn more ([#3880](https://github.com/aws-amplify/amplify-cli/issues/3880)) ([b40867f](https://github.com/aws-amplify/amplify-cli/commit/b40867f148454d8d87a619d67e1df2e6a6f982dc))
* **cli:** change in usage data ux and revert usage data disable ([#4791](https://github.com/aws-amplify/amplify-cli/issues/4791)) ([2303b08](https://github.com/aws-amplify/amplify-cli/commit/2303b0897fa599aa9c0a1b6cdbd4d9012b2fa2db))
* **cli:** config init wasn't reading string ([#4711](https://github.com/aws-amplify/amplify-cli/issues/4711)) ([98d7d28](https://github.com/aws-amplify/amplify-cli/commit/98d7d288f6960a2f2384ba0bdf4489864e8fa69c))
* **cli:** disabling usage-data until new end point is enabled ([#4749](https://github.com/aws-amplify/amplify-cli/issues/4749)) ([3ea86e6](https://github.com/aws-amplify/amplify-cli/commit/3ea86e63a65b63bf7910ef2ae151ff8ad9e90d90))
* **cli:** do not display stack trace on env list ([#4988](https://github.com/aws-amplify/amplify-cli/issues/4988)) ([a6ed3df](https://github.com/aws-amplify/amplify-cli/commit/a6ed3df3ac35f135ea22b162613096a682bc2c21))
* **cli:** fix amplify console url ([#5258](https://github.com/aws-amplify/amplify-cli/issues/5258)) ([e4a9568](https://github.com/aws-amplify/amplify-cli/commit/e4a9568d7df6752f51a610cb8739745d1fd2eb67)), closes [#5248](https://github.com/aws-amplify/amplify-cli/issues/5248)
* **cli:** fix print.warn to print.warning ([#5576](https://github.com/aws-amplify/amplify-cli/issues/5576)) ([ef8dbc8](https://github.com/aws-amplify/amplify-cli/commit/ef8dbc89adfea685afc9aba10fe3b252959e3252))
* **cli:** fixed projName and envName ([#5400](https://github.com/aws-amplify/amplify-cli/issues/5400)) ([8c18418](https://github.com/aws-amplify/amplify-cli/commit/8c184180a69755acc7ed87f03b40e07e231de245)), closes [#5399](https://github.com/aws-amplify/amplify-cli/issues/5399)
* support serve script ([#5211](https://github.com/aws-amplify/amplify-cli/issues/5211)) ([cc71f5a](https://github.com/aws-amplify/amplify-cli/commit/cc71f5a3561e3a5a163bb04bb56144a3f23971db))
* update default file permissions for credentials/config ([#5246](https://github.com/aws-amplify/amplify-cli/issues/5246)) ([b64f1bd](https://github.com/aws-amplify/amplify-cli/commit/b64f1bd784b0595f49241fdd89686c5f8a421ae3))
* **cli:** fixes issues for missing build or start command ([#3918](https://github.com/aws-amplify/amplify-cli/issues/3918)) ([25c53ce](https://github.com/aws-amplify/amplify-cli/commit/25c53ce81a74c3f706f60b0519eda0a4338edbf7)), closes [#3728](https://github.com/aws-amplify/amplify-cli/issues/3728) [#3806](https://github.com/aws-amplify/amplify-cli/issues/3806)
* **cli:** moving the spinner above category initialization tasks ([#4836](https://github.com/aws-amplify/amplify-cli/issues/4836)) ([f9ad670](https://github.com/aws-amplify/amplify-cli/commit/f9ad670cb75f9c76208def8fc1da387d372bb12d)), closes [#4795](https://github.com/aws-amplify/amplify-cli/issues/4795)
* **cli:** open editor in windows ([#5091](https://github.com/aws-amplify/amplify-cli/issues/5091)) ([33995eb](https://github.com/aws-amplify/amplify-cli/commit/33995eb98cf0b893262db5c4f6e8a803492e2d8a)), closes [#5028](https://github.com/aws-amplify/amplify-cli/issues/5028)
* **cli:** remove unnecessary stack trace log when adding services ([#4610](https://github.com/aws-amplify/amplify-cli/issues/4610)) ([56efb32](https://github.com/aws-amplify/amplify-cli/commit/56efb32b79c47839cb9506a9300d40a01875a9fc))
* **cli:** throw error on attach backend ([#4779](https://github.com/aws-amplify/amplify-cli/issues/4779)) ([caf7856](https://github.com/aws-amplify/amplify-cli/commit/caf78564bc821b0f4bd2747e8fe084ffdebdadb0))
* **cli:** update the warning message for delete command ([#4288](https://github.com/aws-amplify/amplify-cli/issues/4288)) ([8c1e950](https://github.com/aws-amplify/amplify-cli/commit/8c1e9505af892352e67f1a8fc825a270e2f64138))
* prevent naming conflicts with new env names ([#3875](https://github.com/aws-amplify/amplify-cli/issues/3875)) ([a7734ae](https://github.com/aws-amplify/amplify-cli/commit/a7734aedb8e846620874ae69e5c38da393dbbe30)), closes [#3854](https://github.com/aws-amplify/amplify-cli/issues/3854)
* **cli:** fix amplify console welcome message format ([#3936](https://github.com/aws-amplify/amplify-cli/issues/3936)) ([ee601a5](https://github.com/aws-amplify/amplify-cli/commit/ee601a501ad516db50c9ac83dc57bb730134e998))
* [#3304](https://github.com/aws-amplify/amplify-cli/issues/3304) - MaxListenersExceededWarning ([#3527](https://github.com/aws-amplify/amplify-cli/issues/3527)) ([aa391ef](https://github.com/aws-amplify/amplify-cli/commit/aa391ef86071672b8e0f7b61f9593a9aff3bea71))
* add default editor if not present ([#3844](https://github.com/aws-amplify/amplify-cli/issues/3844)) ([549e1ad](https://github.com/aws-amplify/amplify-cli/commit/549e1ade795da3f7d3d9e9fbeb5a380bacab6dd2))
* add function plugin interface to cli deps ([#3905](https://github.com/aws-amplify/amplify-cli/issues/3905)) ([001adfb](https://github.com/aws-amplify/amplify-cli/commit/001adfb137929e71acdc393e03916ad621bf2c8f))
* add function runtime and template provider dependencies to core ([0936ec7](https://github.com/aws-amplify/amplify-cli/commit/0936ec795b2401257450e2a6d7e2d897712b546c))
* api key creation/deletion logic ([#2678](https://github.com/aws-amplify/amplify-cli/issues/2678)) ([e1d111d](https://github.com/aws-amplify/amplify-cli/commit/e1d111d87cbe71f9c7a41a61e243f6d907905878))
* dotnet fucntion provider fixes, package.json cleanup, add pkg refs ([#3826](https://github.com/aws-amplify/amplify-cli/issues/3826)) ([75361fb](https://github.com/aws-amplify/amplify-cli/commit/75361fb266f15ba954a8b8e935874c74f66eb11a))
* prevent hyphenated project names ([#3893](https://github.com/aws-amplify/amplify-cli/issues/3893)) ([236137d](https://github.com/aws-amplify/amplify-cli/commit/236137d84b3ff3c1e0a84ff7c7bd22bf4a8a52dd))
* rename node pluign packages ([#3788](https://github.com/aws-amplify/amplify-cli/issues/3788)) ([7b1f0f2](https://github.com/aws-amplify/amplify-cli/commit/7b1f0f2c7bb67a9d154e8462643fb0fe35e88399))
* **amplify-category-notifications:** fix notifications env change issue ([#2669](https://github.com/aws-amplify/amplify-cli/issues/2669)) ([54d4d64](https://github.com/aws-amplify/amplify-cli/commit/54d4d64e03dc246e42ba3e2d19b1789d2dbeaddc)), closes [#2616](https://github.com/aws-amplify/amplify-cli/issues/2616)
* **cli:** 'remove env' wording ([#3425](https://github.com/aws-amplify/amplify-cli/issues/3425)) ([ddaeb23](https://github.com/aws-amplify/amplify-cli/commit/ddaeb23d2fbffa7ee7f0769c133b75e0d2be9bcc))
* **cli:** add cli core aliases, and two minor fixes ([#2394](https://github.com/aws-amplify/amplify-cli/issues/2394)) ([69c7ab3](https://github.com/aws-amplify/amplify-cli/commit/69c7ab36f5a78e875ca117cbbadfb80f44b288c8))
* **cli:** added logic for use of dir separator in generate() ([#3739](https://github.com/aws-amplify/amplify-cli/issues/3739)) ([da17add](https://github.com/aws-amplify/amplify-cli/commit/da17adda27addc9fd37834f8968093c123988fce)), closes [#3761](https://github.com/aws-amplify/amplify-cli/issues/3761)
* **cli:** deleting the amplify app on delete ([#3568](https://github.com/aws-amplify/amplify-cli/issues/3568)) ([f39bbcb](https://github.com/aws-amplify/amplify-cli/commit/f39bbcb715875eeeb612bcbc40b275b33f85eaf6)), closes [#3239](https://github.com/aws-amplify/amplify-cli/issues/3239)
* scoping down user pool group IAM roles and adding --force to amplify push command ([#3609](https://github.com/aws-amplify/amplify-cli/issues/3609)) ([2e10a2f](https://github.com/aws-amplify/amplify-cli/commit/2e10a2ff62b61f57b2d513a7cfd0e4478f429f1f))
* **cli:** disable ESM cache ([#3230](https://github.com/aws-amplify/amplify-cli/issues/3230)) ([3a5e43a](https://github.com/aws-amplify/amplify-cli/commit/3a5e43a4a5392c5bbe3cce1b5d4c7f793ca14273)), closes [#3199](https://github.com/aws-amplify/amplify-cli/issues/3199) [#3199](https://github.com/aws-amplify/amplify-cli/issues/3199)
* **cli:** fix cli crash when opening editor ([#2172](https://github.com/aws-amplify/amplify-cli/issues/2172)) ([d29f14f](https://github.com/aws-amplify/amplify-cli/commit/d29f14fd47f9d6d1e49512b2b3add23ba1460644))
* **cli:** fix console issue 342 and 350 ([#3189](https://github.com/aws-amplify/amplify-cli/issues/3189)) ([cbe26e0](https://github.com/aws-amplify/amplify-cli/commit/cbe26e01c657031e73b77fe408e53430029cab17)), closes [#350](https://github.com/aws-amplify/amplify-cli/issues/350)
* **cli:** fix postinit invokation ([#3130](https://github.com/aws-amplify/amplify-cli/issues/3130)) ([b25105c](https://github.com/aws-amplify/amplify-cli/commit/b25105c4f4417c21075f92004cd4a6c19aa61a87)), closes [#2642](https://github.com/aws-amplify/amplify-cli/issues/2642)
* build break, chore: typescript, lerna update ([#2640](https://github.com/aws-amplify/amplify-cli/issues/2640)) ([29fae36](https://github.com/aws-amplify/amplify-cli/commit/29fae366f4cab054feefa58c7dc733002d19570c))
* e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
* remove env fix ([#2970](https://github.com/aws-amplify/amplify-cli/issues/2970)) ([5c1a8e6](https://github.com/aws-amplify/amplify-cli/commit/5c1a8e62e295db45d0219c2b1f4950e33f8c25b3))
* update transformer conf version to 5 ([#2812](https://github.com/aws-amplify/amplify-cli/issues/2812)) ([c8dd1c9](https://github.com/aws-amplify/amplify-cli/commit/c8dd1c968ebcda9bc1f96b4ed8af3304c5b94c22))
* upgrade to node10 as min version for CLI ([#3128](https://github.com/aws-amplify/amplify-cli/issues/3128)) ([a0b18e0](https://github.com/aws-amplify/amplify-cli/commit/a0b18e0187a26b4ab0e6e986b0277f347e829444))
* **amplify-category-api:** use standard json read ([#2581](https://github.com/aws-amplify/amplify-cli/issues/2581)) ([3adc395](https://github.com/aws-amplify/amplify-cli/commit/3adc395a5e4ccf3673735f8091db63923a46c501))
* **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad863ad4febde47e56209d6026cddb344044))
* **cli:** add console command in the help message ([#2494](https://github.com/aws-amplify/amplify-cli/issues/2494)) ([cf0eddd](https://github.com/aws-amplify/amplify-cli/commit/cf0eddd1ba27b1126b0745cc068f205b2c2c8343)), closes [#1607](https://github.com/aws-amplify/amplify-cli/issues/1607)
* **cli:** add context.print.fancy ([#2352](https://github.com/aws-amplify/amplify-cli/issues/2352)) ([099ca0d](https://github.com/aws-amplify/amplify-cli/commit/099ca0d7eabe58a75845e8f96caa6c4888be2915)), closes [#2351](https://github.com/aws-amplify/amplify-cli/issues/2351)
* **cli:** fix appsync api native config file for legacy metadata ([#2842](https://github.com/aws-amplify/amplify-cli/issues/2842)) ([a8e55b7](https://github.com/aws-amplify/amplify-cli/commit/a8e55b727fca53e9006f45da772a56e7953fc6db))
* **cli:** fix new plugin platform codegen related issue ([#2266](https://github.com/aws-amplify/amplify-cli/issues/2266)) ([c557182](https://github.com/aws-amplify/amplify-cli/commit/c557182b2d423bb1c2f8832ecd49076c806b05bb))
* **cli:** fixes cognito trigger removal bug ([#3063](https://github.com/aws-amplify/amplify-cli/issues/3063)) ([9e0f33d](https://github.com/aws-amplify/amplify-cli/commit/9e0f33d7ae6ed3f90f082d91d0c1bf8a8a7a14fd)), closes [#2458](https://github.com/aws-amplify/amplify-cli/issues/2458)
* **cli:** prevent cli crash when default editor is missing ([#2163](https://github.com/aws-amplify/amplify-cli/issues/2163)) ([67769fb](https://github.com/aws-amplify/amplify-cli/commit/67769fb628978fffbf6f58a1048e0fb09893d524))
* **cli:** print correct message if no provider plugins are active ([#2886](https://github.com/aws-amplify/amplify-cli/issues/2886)) ([37405b1](https://github.com/aws-amplify/amplify-cli/commit/37405b1ecc4c3818570b541d17e132bebaca5553))
* **cli:** print correct message if no provider plugins are active ([#2907](https://github.com/aws-amplify/amplify-cli/issues/2907)) ([adce3b5](https://github.com/aws-amplify/amplify-cli/commit/adce3b5df0f2d61936a4f999b091850607069581))
* **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
* [#1056](https://github.com/aws-amplify/amplify-cli/issues/1056), dedup environment file reading ([#2088](https://github.com/aws-amplify/amplify-cli/issues/2088)) ([940deaa](https://github.com/aws-amplify/amplify-cli/commit/940deaa6bbe7370e40e61946d0f1073623ba6e90))
* [#429](https://github.com/aws-amplify/amplify-cli/issues/429) - Editor hanging bug ([#2086](https://github.com/aws-amplify/amplify-cli/issues/2086)) ([6767445](https://github.com/aws-amplify/amplify-cli/commit/676744549f903fa3a4804d814eb325301ed462ba))
* fix the amplify env checkout command ([#2339](https://github.com/aws-amplify/amplify-cli/issues/2339)) ([a96b42a](https://github.com/aws-amplify/amplify-cli/commit/a96b42a5e6d92e44018dc87cc4dbf51ff2107c09))
* **cli:** update inquirer validation function to return msg ([#2166](https://github.com/aws-amplify/amplify-cli/issues/2166)) ([b3b8c21](https://github.com/aws-amplify/amplify-cli/commit/b3b8c212a371027320eca97aad1c4edb95eace71)), closes [#2164](https://github.com/aws-amplify/amplify-cli/issues/2164)
* fixing force push on init of new env ([#1949](https://github.com/aws-amplify/amplify-cli/issues/1949)) ([d4d0c97](https://github.com/aws-amplify/amplify-cli/commit/d4d0c97d6445630ed49d669531cebb1bcd9e0218)), closes [#1945](https://github.com/aws-amplify/amplify-cli/issues/1945)
* local mock fix ([#1982](https://github.com/aws-amplify/amplify-cli/issues/1982)) ([8ee9029](https://github.com/aws-amplify/amplify-cli/commit/8ee90298189f4d3140ab84fe2d40d16bcb95485f))
* move test package dependencies to devDependencies ([#2034](https://github.com/aws-amplify/amplify-cli/issues/2034)) ([f5623d0](https://github.com/aws-amplify/amplify-cli/commit/f5623d04a43e685901f4f1cd96e2a227164c71ee))
* revert esm change temporarily, it conflicts with some imports ([#4223](https://github.com/aws-amplify/amplify-cli/issues/4223)) ([1b9bf06](https://github.com/aws-amplify/amplify-cli/commit/1b9bf063c500b32c13d8190277e1940fcba8cf21))


### Features

* storage import ([#5893](https://github.com/aws-amplify/amplify-cli/issues/5893)) ([ad7b028](https://github.com/aws-amplify/amplify-cli/commit/ad7b028330bcee64d5124be7f27a8494dc8e9400))
* **amplify-cli-core:** visually hide "immutable files" for VSCode users ([#5321](https://github.com/aws-amplify/amplify-cli/issues/5321)) ([01d4cdb](https://github.com/aws-amplify/amplify-cli/commit/01d4cdb2265fa74a169ff7ba12551b69709f129d))
* ability to add custom EventSource and lambda triggers via amplify add function, kinesis support in analytics category ([#2463](https://github.com/aws-amplify/amplify-cli/issues/2463)) ([b25cfd0](https://github.com/aws-amplify/amplify-cli/commit/b25cfd00b21416a82ecefda1f6498206ef71531b))
* add amplify-app command ([#2761](https://github.com/aws-amplify/amplify-cli/issues/2761)) ([c46cdd4](https://github.com/aws-amplify/amplify-cli/commit/c46cdd421bce40d7995b3e75f0ea7f4f646d2308))
* add check for extra command line args provided with amplify delete ([#4576](https://github.com/aws-amplify/amplify-cli/issues/4576)) ([48b27b7](https://github.com/aws-amplify/amplify-cli/commit/48b27b79698b33ee62a01df2ad00b701f79029d8)), closes [#4115](https://github.com/aws-amplify/amplify-cli/issues/4115)
* add check for extra command line args provided with amplify delete ([#4802](https://github.com/aws-amplify/amplify-cli/issues/4802)) ([46351a1](https://github.com/aws-amplify/amplify-cli/commit/46351a17dcc3067ace51673f403efb7be2e31228)), closes [#4115](https://github.com/aws-amplify/amplify-cli/issues/4115)
* add env to retain amplify app ([#5714](https://github.com/aws-amplify/amplify-cli/issues/5714)) ([d3b4948](https://github.com/aws-amplify/amplify-cli/commit/d3b4948b39f2c1e0f4d7674aceda313f31cb189e))
* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c1927da10f8c54f38a523021187361131c))
* change `amplify delete` prompt default value from yes to no ([#4580](https://github.com/aws-amplify/amplify-cli/issues/4580)) ([eea2e77](https://github.com/aws-amplify/amplify-cli/commit/eea2e7731fe1fe2a5e7a4885c132a460dfce5c06)), closes [#4579](https://github.com/aws-amplify/amplify-cli/issues/4579)
* changes for native packaging ([#5548](https://github.com/aws-amplify/amplify-cli/issues/5548)) ([7a06f6d](https://github.com/aws-amplify/amplify-cli/commit/7a06f6d96e42a5863e2192560890adbd741b0dc6))
* Cloudformation logging ([#5195](https://github.com/aws-amplify/amplify-cli/issues/5195)) ([19b2165](https://github.com/aws-amplify/amplify-cli/commit/19b21651375848c0858328952852201da47b17bb))
* conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
* Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
* feature flag implementation ([#4891](https://github.com/aws-amplify/amplify-cli/issues/4891)) ([6d1c632](https://github.com/aws-amplify/amplify-cli/commit/6d1c632952a49cb56670c11c9cb0c3620d0eb332))
* golang function support for CLI ([#3789](https://github.com/aws-amplify/amplify-cli/issues/3789)) ([3dbc234](https://github.com/aws-amplify/amplify-cli/commit/3dbc23497d0d1c238c6868adcf3a6d00ad909edd))
* headless mode for API category ([#4834](https://github.com/aws-amplify/amplify-cli/issues/4834)) ([c2e09d7](https://github.com/aws-amplify/amplify-cli/commit/c2e09d73fd1bb461eeace8f4a7addd70a63047ad))
* implement multi-auth functionality ([#1916](https://github.com/aws-amplify/amplify-cli/issues/1916)) ([b99f58e](https://github.com/aws-amplify/amplify-cli/commit/b99f58e4a2b85cbe9f430838554ae3c277440132))
* Lambda layers ([#4697](https://github.com/aws-amplify/amplify-cli/issues/4697)) ([4e97400](https://github.com/aws-amplify/amplify-cli/commit/4e974007d95c894ab4108a2dff8d5996e7e3ce25))
* make 'dev' the default envname if it's not present ([#4201](https://github.com/aws-amplify/amplify-cli/issues/4201)) ([0b0e775](https://github.com/aws-amplify/amplify-cli/commit/0b0e7758b825d78686af2fd37b13b8dcd1f28674))
* minor tweaks to multi-runtime platform ([#3804](https://github.com/aws-amplify/amplify-cli/issues/3804)) ([60d68d7](https://github.com/aws-amplify/amplify-cli/commit/60d68d7e1a6e8c00cd629a38e9aefb2396a59737))
* Multienv support for Lambda layers ([#5081](https://github.com/aws-amplify/amplify-cli/issues/5081)) ([4af1363](https://github.com/aws-amplify/amplify-cli/commit/4af13634bcdd58511712249e6774fc9f287c9ef5))
* notify if a CLI update is available ([#4046](https://github.com/aws-amplify/amplify-cli/issues/4046)) ([1a597a8](https://github.com/aws-amplify/amplify-cli/commit/1a597a8c05609521ea283be3d28a1f51ba3c4a8a))
* resource Tagging Support ([#5178](https://github.com/aws-amplify/amplify-cli/issues/5178)) ([e34226d](https://github.com/aws-amplify/amplify-cli/commit/e34226dde30d7d345e3cc2e72e187b242a09c389))
* support importing of auth resources ([#5591](https://github.com/aws-amplify/amplify-cli/issues/5591)) ([7903246](https://github.com/aws-amplify/amplify-cli/commit/790324680544fe18481f91390001f9f07a144203))
* update post-install to copy executable assets to .amplify ([#5595](https://github.com/aws-amplify/amplify-cli/issues/5595)) ([53a23a0](https://github.com/aws-amplify/amplify-cli/commit/53a23a07cbb9e09566c1f0f577ba2b7488bc2eae))
* using ci-info ci status ([#5345](https://github.com/aws-amplify/amplify-cli/issues/5345)) ([827f14f](https://github.com/aws-amplify/amplify-cli/commit/827f14f888778b323761cda851fe45e797ca88f6))
* **amplify-app:** group amplify files in xcode integration ([#4268](https://github.com/aws-amplify/amplify-cli/issues/4268)) ([5670a08](https://github.com/aws-amplify/amplify-cli/commit/5670a0895d65702441de24d8873d48d156a9d121))
* **amplify-category-function:** Refactor invoke to call runtime plugins ([#3768](https://github.com/aws-amplify/amplify-cli/issues/3768)) ([92293fa](https://github.com/aws-amplify/amplify-cli/commit/92293fa83190bd18aacdc2f46a22938f94b89609))
* **amplify-category-function:** refactor to support build and package interface of runtime plugins ([8c4ec55](https://github.com/aws-amplify/amplify-cli/commit/8c4ec55e46ed8a153eee306c23f9665d58d3c5f4))
* **amplify-category-function:** refactor to support runtime and template plugins ([#3517](https://github.com/aws-amplify/amplify-cli/issues/3517)) ([607ae21](https://github.com/aws-amplify/amplify-cli/commit/607ae21287941805f44ea8a9b78dd12d16d71f85))
* **cli:** add amplifyconfiguration.json for native apps ([#2787](https://github.com/aws-amplify/amplify-cli/issues/2787)) ([0393535](https://github.com/aws-amplify/amplify-cli/commit/03935353596582bfac620ef7a0e68cf01ad376ee))
* **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
* **cli:** new plugin platform ([#2254](https://github.com/aws-amplify/amplify-cli/issues/2254)) ([7ec29dd](https://github.com/aws-amplify/amplify-cli/commit/7ec29dd4f2da8c90727b36469eca646d289877b6))
* **cli:** support for samples with --app params in init command ([#2358](https://github.com/aws-amplify/amplify-cli/issues/2358)) ([7ba1a9d](https://github.com/aws-amplify/amplify-cli/commit/7ba1a9dc510caeafda74ce2ce04942fa157ea234))
* **cli:** update publish command to use the updated push command ([#2826](https://github.com/aws-amplify/amplify-cli/issues/2826)) ([9fead0e](https://github.com/aws-amplify/amplify-cli/commit/9fead0e8b981a4d32b46bcf0c90cff88d16c5e70))
* **cli:** usage measurement ([#3641](https://github.com/aws-amplify/amplify-cli/issues/3641)) ([a755863](https://github.com/aws-amplify/amplify-cli/commit/a7558637fbb791dc22e0a91ae16f1b96fe4e99df))
* mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e5346ee1f27a2e9bee25fbbdcb19417f5230f))
* User Pool Groups, Admin Auth Support, Custom Group Role Policies ([#2443](https://github.com/aws-amplify/amplify-cli/issues/2443)) ([09aecfd](https://github.com/aws-amplify/amplify-cli/commit/09aecfd0cb3dae2c17d1c512946cc733c4fe3d4c))


### Performance Improvements

* plugin scan perf optimization ([#4187](https://github.com/aws-amplify/amplify-cli/issues/4187)) ([3b2cae6](https://github.com/aws-amplify/amplify-cli/commit/3b2cae6f5deb78069955676714c9b8248ca89019))
* use node's async esm module loader above node>=12 ([#4221](https://github.com/aws-amplify/amplify-cli/issues/4221)) ([a26eebe](https://github.com/aws-amplify/amplify-cli/commit/a26eebe68fde928b1286b158c33eeaa2db6151e9))


### Reverts

* Revert problematic PRs (#4803) ([f21a0f4](https://github.com/aws-amplify/amplify-cli/commit/f21a0f449a23c0c80a6f3280eef76bcbf3e9cb7c)), closes [#4803](https://github.com/aws-amplify/amplify-cli/issues/4803) [#4796](https://github.com/aws-amplify/amplify-cli/issues/4796) [#4576](https://github.com/aws-amplify/amplify-cli/issues/4576) [#4575](https://github.com/aws-amplify/amplify-cli/issues/4575) [#4610](https://github.com/aws-amplify/amplify-cli/issues/4610)
* Revert "fix: add function plugin interface to cli deps (#3905)" (#3906) ([f534324](https://github.com/aws-amplify/amplify-cli/commit/f534324f4e315ea4e1e3f95afa840962ef8fc17a)), closes [#3905](https://github.com/aws-amplify/amplify-cli/issues/3905) [#3906](https://github.com/aws-amplify/amplify-cli/issues/3906)
* revert 37405b1ecc4c3818570b541d17e132bebaca5553 (#2902) ([374937f](https://github.com/aws-amplify/amplify-cli/commit/374937fe071a531ca506da42d37037e5c1aca010)), closes [#2902](https://github.com/aws-amplify/amplify-cli/issues/2902) [#2886](https://github.com/aws-amplify/amplify-cli/issues/2886)


* Adding Auth on Subscriptions (#2068) ([81c630d](https://github.com/aws-amplify/amplify-cli/commit/81c630d782a6be720e513677a34b7a7dacbdc629)), closes [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068)


### BREAKING CHANGES

* If an owner is used in the auth directive it will either be a requirement if it's
the only rule or an optional input if used with other rules
* If an owner is included in the auth directive it will either be a requirement if
it's the only rule or an optional input if used with other rules
* the subscription operations will require an argument if owner is the only auth rule
* Subscriptions will require an argument if an owner is only rule set - If owner &
group rules are owner will be an optional arg





## [4.32.4](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.32.1...@aws-amplify/cli@4.32.4) (2020-11-20)


### Bug Fixes

* removed extra blank space in error message ([#5821](https://github.com/aws-amplify/amplify-cli/issues/5821)) ([da2cca3](https://github.com/aws-amplify/amplify-cli/commit/da2cca3d44ba2c995407acae6ce1c97ba4a0a21d))
* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))





## [4.32.3](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.32.1...@aws-amplify/cli@4.32.3) (2020-11-20)


### Bug Fixes

* removed extra blank space in error message ([#5821](https://github.com/aws-amplify/amplify-cli/issues/5821)) ([da2cca3](https://github.com/aws-amplify/amplify-cli/commit/da2cca3d44ba2c995407acae6ce1c97ba4a0a21d))
* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))





## [4.32.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.32.1...@aws-amplify/cli@4.32.2) (2020-11-19)


### Bug Fixes

* removed extra blank space in error message ([#5821](https://github.com/aws-amplify/amplify-cli/issues/5821)) ([da2cca3](https://github.com/aws-amplify/amplify-cli/commit/da2cca3d44ba2c995407acae6ce1c97ba4a0a21d))
* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))





## [4.32.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.32.0...@aws-amplify/cli@4.32.1) (2020-11-08)

**Note:** Version bump only for package @aws-amplify/cli





# [4.32.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.31.1...@aws-amplify/cli@4.32.0) (2020-10-30)


### Features

* add env to retain amplify app ([#5714](https://github.com/aws-amplify/amplify-cli/issues/5714)) ([d3b4948](https://github.com/aws-amplify/amplify-cli/commit/d3b4948b39f2c1e0f4d7674aceda313f31cb189e))
* **amplify-cli-core:** visually hide "immutable files" for VSCode users ([#5321](https://github.com/aws-amplify/amplify-cli/issues/5321)) ([01d4cdb](https://github.com/aws-amplify/amplify-cli/commit/01d4cdb2265fa74a169ff7ba12551b69709f129d))





## [4.31.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.31.0...@aws-amplify/cli@4.31.1) (2020-10-27)


### Bug Fixes

* move post-install steps to plugin platform rather than post install script ([#5678](https://github.com/aws-amplify/amplify-cli/issues/5678)) ([f83bbab](https://github.com/aws-amplify/amplify-cli/commit/f83bbab378f6857202653cd57c607cead11cbe52))





# [4.31.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.30.0...@aws-amplify/cli@4.31.0) (2020-10-22)


### Bug Fixes

* **amplify-app:** initialize feature flag  ([#5643](https://github.com/aws-amplify/amplify-cli/issues/5643)) ([9608b56](https://github.com/aws-amplify/amplify-cli/commit/9608b5616c2b92417a1b559f41f5d3f8f42f97e5))
* check lib before running post-install ([#5669](https://github.com/aws-amplify/amplify-cli/issues/5669)) ([9ccda46](https://github.com/aws-amplify/amplify-cli/commit/9ccda46fb3ea545f838939b2b13d1555d95437dd))
* refactor mobile hub migration checks ([#5632](https://github.com/aws-amplify/amplify-cli/issues/5632)) ([b796eb8](https://github.com/aws-amplify/amplify-cli/commit/b796eb8303bb903f5f531506254441a63eba2962))
* update current-cloud backend-config on resource removal ([#5658](https://github.com/aws-amplify/amplify-cli/issues/5658)) ([592f694](https://github.com/aws-amplify/amplify-cli/commit/592f694530dd61302ff790fbcf5b3ea135812c47))


### Features

* Cloudformation logging ([#5195](https://github.com/aws-amplify/amplify-cli/issues/5195)) ([19b2165](https://github.com/aws-amplify/amplify-cli/commit/19b21651375848c0858328952852201da47b17bb))
* update post-install to copy executable assets to .amplify ([#5595](https://github.com/aws-amplify/amplify-cli/issues/5595)) ([53a23a0](https://github.com/aws-amplify/amplify-cli/commit/53a23a07cbb9e09566c1f0f577ba2b7488bc2eae))





# [4.30.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.29.8...@aws-amplify/cli@4.30.0) (2020-10-17)


### Bug Fixes

* --yes on pull and init no longer does a force push. Use --forcePush in addition to --yes to force a push ([#5546](https://github.com/aws-amplify/amplify-cli/issues/5546)) ([b20c2d6](https://github.com/aws-amplify/amplify-cli/commit/b20c2d6f1240565604f4a6b8ffe53987c4f76ed4))


### Features

* changes for native packaging ([#5548](https://github.com/aws-amplify/amplify-cli/issues/5548)) ([7a06f6d](https://github.com/aws-amplify/amplify-cli/commit/7a06f6d96e42a5863e2192560890adbd741b0dc6))
* support importing of auth resources ([#5591](https://github.com/aws-amplify/amplify-cli/issues/5591)) ([7903246](https://github.com/aws-amplify/amplify-cli/commit/790324680544fe18481f91390001f9f07a144203))
* using ci-info ci status ([#5345](https://github.com/aws-amplify/amplify-cli/issues/5345)) ([827f14f](https://github.com/aws-amplify/amplify-cli/commit/827f14f888778b323761cda851fe45e797ca88f6))





## [4.29.8](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.29.7...@aws-amplify/cli@4.29.8) (2020-10-15)


### Bug Fixes

* **cli:** fix print.warn to print.warning ([#5576](https://github.com/aws-amplify/amplify-cli/issues/5576)) ([ef8dbc8](https://github.com/aws-amplify/amplify-cli/commit/ef8dbc89adfea685afc9aba10fe3b252959e3252))





## [4.29.7](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.29.6...@aws-amplify/cli@4.29.7) (2020-10-13)

**Note:** Version bump only for package @aws-amplify/cli





## [4.29.6](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.29.5...@aws-amplify/cli@4.29.6) (2020-10-09)


### Bug Fixes

* [#5516](https://github.com/aws-amplify/amplify-cli/issues/5516) exclude pinpoint from provider check for false positives ([#5535](https://github.com/aws-amplify/amplify-cli/issues/5535)) ([c3ea3a4](https://github.com/aws-amplify/amplify-cli/commit/c3ea3a4343d6ebd2f48d1c0ac6574c6d118e73d0))





## [4.29.5](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.29.4...@aws-amplify/cli@4.29.5) (2020-10-07)

**Note:** Version bump only for package @aws-amplify/cli





## [4.29.4](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.29.3...@aws-amplify/cli@4.29.4) (2020-10-01)


### Bug Fixes

* add support for mobile hub migrated resources ([#5407](https://github.com/aws-amplify/amplify-cli/issues/5407)) ([5dfe287](https://github.com/aws-amplify/amplify-cli/commit/5dfe2872c153047ebdc56bc4f671fd57c12379d9))
* added exit code on remove ([#5427](https://github.com/aws-amplify/amplify-cli/issues/5427)) ([33132f7](https://github.com/aws-amplify/amplify-cli/commit/33132f764b290cafd345720409a5db8ea6088069))
* **cli:** fixed projName and envName ([#5400](https://github.com/aws-amplify/amplify-cli/issues/5400)) ([8c18418](https://github.com/aws-amplify/amplify-cli/commit/8c184180a69755acc7ed87f03b40e07e231de245)), closes [#5399](https://github.com/aws-amplify/amplify-cli/issues/5399)
* mobile hub check miss for uninitialized projects ([#5457](https://github.com/aws-amplify/amplify-cli/issues/5457)) ([879b0dd](https://github.com/aws-amplify/amplify-cli/commit/879b0ddf947c418a1fe778eaf7925128812f0248))
* move mobile hub flag to context directly ([#5459](https://github.com/aws-amplify/amplify-cli/issues/5459)) ([1828d21](https://github.com/aws-amplify/amplify-cli/commit/1828d214e3491a3633d72f571b7a8f1ab271f7a1))
* publish returns with exitcode 1 ([#5413](https://github.com/aws-amplify/amplify-cli/issues/5413)) ([2064830](https://github.com/aws-amplify/amplify-cli/commit/20648308fca4d4ae6dba84874c3f5508405ff701))





## [4.29.3](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.29.2...@aws-amplify/cli@4.29.3) (2020-09-25)


### Bug Fixes

* abort being called multiple times ([#5302](https://github.com/aws-amplify/amplify-cli/issues/5302)) ([83b2d10](https://github.com/aws-amplify/amplify-cli/commit/83b2d109b6f3cf2e9962bad78607b6a41e7599e2))
* data inconsitency ([#5344](https://github.com/aws-amplify/amplify-cli/issues/5344)) ([bfe1903](https://github.com/aws-amplify/amplify-cli/commit/bfe19038b5b676056f45d7ffcc4c2460057936d8))





## [4.29.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.29.1...@aws-amplify/cli@4.29.2) (2020-09-16)


### Bug Fixes

* refactor amplify.json file handling ([#5282](https://github.com/aws-amplify/amplify-cli/issues/5282)) ([a6269f3](https://github.com/aws-amplify/amplify-cli/commit/a6269f3177f3242df81e9d7dce0625295bb7a9fc))





## [4.29.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.29.0...@aws-amplify/cli@4.29.1) (2020-09-09)


### Bug Fixes

* **cli:** do not display stack trace on env list ([#4988](https://github.com/aws-amplify/amplify-cli/issues/4988)) ([a6ed3df](https://github.com/aws-amplify/amplify-cli/commit/a6ed3df3ac35f135ea22b162613096a682bc2c21))
* **cli:** fix amplify console url ([#5258](https://github.com/aws-amplify/amplify-cli/issues/5258)) ([e4a9568](https://github.com/aws-amplify/amplify-cli/commit/e4a9568d7df6752f51a610cb8739745d1fd2eb67)), closes [#5248](https://github.com/aws-amplify/amplify-cli/issues/5248)
* update default file permissions for credentials/config ([#5246](https://github.com/aws-amplify/amplify-cli/issues/5246)) ([b64f1bd](https://github.com/aws-amplify/amplify-cli/commit/b64f1bd784b0595f49241fdd89686c5f8a421ae3))





# [4.29.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.28.2...@aws-amplify/cli@4.29.0) (2020-09-03)


### Features

* Multienv support for Lambda layers ([#5081](https://github.com/aws-amplify/amplify-cli/issues/5081)) ([4af1363](https://github.com/aws-amplify/amplify-cli/commit/4af13634bcdd58511712249e6774fc9f287c9ef5))





## [4.28.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.28.1...@aws-amplify/cli@4.28.2) (2020-09-03)


### Bug Fixes

* support serve script ([#5211](https://github.com/aws-amplify/amplify-cli/issues/5211)) ([cc71f5a](https://github.com/aws-amplify/amplify-cli/commit/cc71f5a3561e3a5a163bb04bb56144a3f23971db))





## [4.28.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.28.0...@aws-amplify/cli@4.28.1) (2020-09-02)

**Note:** Version bump only for package @aws-amplify/cli





# [4.28.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.27.3...@aws-amplify/cli@4.28.0) (2020-08-31)


### Bug Fixes

* add compatibility to json parse for non-string values ([#5147](https://github.com/aws-amplify/amplify-cli/issues/5147)) ([3bc9306](https://github.com/aws-amplify/amplify-cli/commit/3bc9306c7b3d078d9b531f5950e8a304fc031d23))
* fixed Tags update when no resource ([#5187](https://github.com/aws-amplify/amplify-cli/issues/5187)) ([3bc85b0](https://github.com/aws-amplify/amplify-cli/commit/3bc85b02ccf127a79689ca7600ab6f35f6421187))


### Features

* resource Tagging Support ([#5178](https://github.com/aws-amplify/amplify-cli/issues/5178)) ([e34226d](https://github.com/aws-amplify/amplify-cli/commit/e34226dde30d7d345e3cc2e72e187b242a09c389))





## [4.27.3](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.27.2...@aws-amplify/cli@4.27.3) (2020-08-20)


### Bug Fixes

* **cli:** open editor in windows ([#5091](https://github.com/aws-amplify/amplify-cli/issues/5091)) ([33995eb](https://github.com/aws-amplify/amplify-cli/commit/33995eb98cf0b893262db5c4f6e8a803492e2d8a)), closes [#5028](https://github.com/aws-amplify/amplify-cli/issues/5028)





## [4.27.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.27.1...@aws-amplify/cli@4.27.2) (2020-08-14)

**Note:** Version bump only for package @aws-amplify/cli





## [4.27.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.27.0...@aws-amplify/cli@4.27.1) (2020-08-11)

**Note:** Version bump only for package @aws-amplify/cli





# [4.27.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.26.0...@aws-amplify/cli@4.27.0) (2020-08-06)


### Features

* add check for extra command line args provided with amplify delete ([#4802](https://github.com/aws-amplify/amplify-cli/issues/4802)) ([46351a1](https://github.com/aws-amplify/amplify-cli/commit/46351a17dcc3067ace51673f403efb7be2e31228)), closes [#4115](https://github.com/aws-amplify/amplify-cli/issues/4115)





# [4.26.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.24.3...@aws-amplify/cli@4.26.0) (2020-07-29)


### Bug Fixes

* [#4950](https://github.com/aws-amplify/amplify-cli/issues/4950) amplify cli fails with checked in local settings ([#4959](https://github.com/aws-amplify/amplify-cli/issues/4959)) ([ba0529a](https://github.com/aws-amplify/amplify-cli/commit/ba0529ac358b6f6028c6dbc4235def312f4625be))


### Features

* feature flag implementation ([#4891](https://github.com/aws-amplify/amplify-cli/issues/4891)) ([6d1c632](https://github.com/aws-amplify/amplify-cli/commit/6d1c632952a49cb56670c11c9cb0c3620d0eb332))
* headless mode for API category ([#4834](https://github.com/aws-amplify/amplify-cli/issues/4834)) ([c2e09d7](https://github.com/aws-amplify/amplify-cli/commit/c2e09d73fd1bb461eeace8f4a7addd70a63047ad))





# [4.25.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.24.3...@aws-amplify/cli@4.25.0) (2020-07-23)


### Features

* feature flag implementation ([#4891](https://github.com/aws-amplify/amplify-cli/issues/4891)) ([4639450](https://github.com/aws-amplify/amplify-cli/commit/463945029cfe861f74986d9a8b9af6b827d2063d))
* headless mode for API category ([#4834](https://github.com/aws-amplify/amplify-cli/issues/4834)) ([b729266](https://github.com/aws-amplify/amplify-cli/commit/b729266b9bb519738ef88125784d72ac428f47e1))





## [4.24.3](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.24.2...@aws-amplify/cli@4.24.3) (2020-07-18)

**Note:** Version bump only for package @aws-amplify/cli





## [4.24.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.24.1...@aws-amplify/cli@4.24.2) (2020-07-15)


### Bug Fixes

* Check that config object exists before creating new env ([#3624](https://github.com/aws-amplify/amplify-cli/issues/3624)) ([89bbdb9](https://github.com/aws-amplify/amplify-cli/commit/89bbdb9ca661eea36d529131e5a1b8cac4a43816))
* **cli:** moving the spinner above category initialization tasks ([#4836](https://github.com/aws-amplify/amplify-cli/issues/4836)) ([5884801](https://github.com/aws-amplify/amplify-cli/commit/5884801217cd07bfcea8273a56bdf0fff21c6994)), closes [#4795](https://github.com/aws-amplify/amplify-cli/issues/4795)





## [4.24.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.24.0...@aws-amplify/cli@4.24.1) (2020-07-14)


### Bug Fixes

* **amplify-python-function-runtime-provider:** change exec to execa ([#4673](https://github.com/aws-amplify/amplify-cli/issues/4673)) ([56771d9](https://github.com/aws-amplify/amplify-cli/commit/56771d91eeed76a23a1dbf1e0d1d038070c37ad1))
* **cli:** change in usage data ux and revert usage data disable ([#4791](https://github.com/aws-amplify/amplify-cli/issues/4791)) ([28328a3](https://github.com/aws-amplify/amplify-cli/commit/28328a3d3452f34dbb649fef42211bc8849ee520))





# [4.24.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.23.1...@aws-amplify/cli@4.24.0) (2020-07-11)


### Bug Fixes

* **cli:** remove unnecessary stack trace log when adding services ([#4610](https://github.com/aws-amplify/amplify-cli/issues/4610)) ([5bee574](https://github.com/aws-amplify/amplify-cli/commit/5bee574bbcd956c032e7714b0813aedd7914a6cb))


### Features

* add check for extra command line args provided with amplify delete ([#4576](https://github.com/aws-amplify/amplify-cli/issues/4576)) ([82d1093](https://github.com/aws-amplify/amplify-cli/commit/82d10933754230c311bf5f24dc1c59dfa393ce63)), closes [#4115](https://github.com/aws-amplify/amplify-cli/issues/4115)


### Reverts

* Revert problematic PRs (#4803) ([7f38d81](https://github.com/aws-amplify/amplify-cli/commit/7f38d81ef2f890c25d39b02407c5255c8760c511)), closes [#4803](https://github.com/aws-amplify/amplify-cli/issues/4803) [#4796](https://github.com/aws-amplify/amplify-cli/issues/4796) [#4576](https://github.com/aws-amplify/amplify-cli/issues/4576) [#4575](https://github.com/aws-amplify/amplify-cli/issues/4575) [#4610](https://github.com/aws-amplify/amplify-cli/issues/4610)





## [4.23.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.23.0...@aws-amplify/cli@4.23.1) (2020-07-09)


### Bug Fixes

* **cli:** throw error on attach backend ([#4779](https://github.com/aws-amplify/amplify-cli/issues/4779)) ([11c55e3](https://github.com/aws-amplify/amplify-cli/commit/11c55e33e64d25dd198ef06fe76af7f7f402759a))





# [4.23.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.22.0...@aws-amplify/cli@4.23.0) (2020-07-07)


### Bug Fixes

* **cli:** config init wasn't reading string ([#4711](https://github.com/aws-amplify/amplify-cli/issues/4711)) ([4d217af](https://github.com/aws-amplify/amplify-cli/commit/4d217af830e04d7157d65e14f25af6c39d0315de))
* **cli:** disabling usage-data until new end point is enabled ([#4749](https://github.com/aws-amplify/amplify-cli/issues/4749)) ([2cac361](https://github.com/aws-amplify/amplify-cli/commit/2cac361439aa977eda0b92f5e4ce4a2ea4d8bb29))


### Features

* **cli:** usage measurement ([#3641](https://github.com/aws-amplify/amplify-cli/issues/3641)) ([30a7fe7](https://github.com/aws-amplify/amplify-cli/commit/30a7fe70f5838a766631befcc720a721e801bc5f))
* Lambda layers ([#4697](https://github.com/aws-amplify/amplify-cli/issues/4697)) ([c55b2e0](https://github.com/aws-amplify/amplify-cli/commit/c55b2e0c3377127aaf887591d7bc20d7240ef11d))





# [4.22.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.21.4...@aws-amplify/cli@4.22.0) (2020-06-25)


### Features

* change `amplify delete` prompt default value from yes to no ([#4580](https://github.com/aws-amplify/amplify-cli/issues/4580)) ([0bdbb77](https://github.com/aws-amplify/amplify-cli/commit/0bdbb775915f84efb863821cfa9b1b0f048a0f95)), closes [#4579](https://github.com/aws-amplify/amplify-cli/issues/4579)





## [4.21.4](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.21.3...@aws-amplify/cli@4.21.4) (2020-06-18)


### Bug Fixes

* [#4549](https://github.com/aws-amplify/amplify-cli/issues/4549) [#4550](https://github.com/aws-amplify/amplify-cli/issues/4550) init and folder exist checks ([#4553](https://github.com/aws-amplify/amplify-cli/issues/4553)) ([543d531](https://github.com/aws-amplify/amplify-cli/commit/543d5312823783db7794ad574d03d0ca3991c8b5))
* occurred spelling mistake ([#4595](https://github.com/aws-amplify/amplify-cli/issues/4595)) ([eaf08e0](https://github.com/aws-amplify/amplify-cli/commit/eaf08e00841830e9654fea61ce901f2cb478eebe))





## [4.21.3](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.21.2...@aws-amplify/cli@4.21.3) (2020-06-11)

**Note:** Version bump only for package @aws-amplify/cli





## [4.21.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.21.1...@aws-amplify/cli@4.21.2) (2020-06-10)

**Note:** Version bump only for package @aws-amplify/cli





## [4.21.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.21.0...@aws-amplify/cli@4.21.1) (2020-06-02)

**Note:** Version bump only for package @aws-amplify/cli





# [4.21.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.20.0...@aws-amplify/cli@4.21.0) (2020-05-26)


### Bug Fixes

* **cli:** update the warning message for delete command ([#4288](https://github.com/aws-amplify/amplify-cli/issues/4288)) ([cf0c528](https://github.com/aws-amplify/amplify-cli/commit/cf0c528d9763e6a9b525893acbf609e2aa4c6495))


### Features

* **amplify-app:** group amplify files in xcode integration ([#4268](https://github.com/aws-amplify/amplify-cli/issues/4268)) ([73f3eab](https://github.com/aws-amplify/amplify-cli/commit/73f3eabc11def219faa1724fee93ce171949e40f))





# [4.20.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.19.0...@aws-amplify/cli@4.20.0) (2020-05-15)


### Bug Fixes

* **cli:** add information on pre/post pull in learn more ([#3880](https://github.com/aws-amplify/amplify-cli/issues/3880)) ([b40867f](https://github.com/aws-amplify/amplify-cli/commit/b40867f148454d8d87a619d67e1df2e6a6f982dc))
* **cli:** fixes issues for missing build or start command ([#3918](https://github.com/aws-amplify/amplify-cli/issues/3918)) ([25c53ce](https://github.com/aws-amplify/amplify-cli/commit/25c53ce81a74c3f706f60b0519eda0a4338edbf7)), closes [#3728](https://github.com/aws-amplify/amplify-cli/issues/3728) [#3806](https://github.com/aws-amplify/amplify-cli/issues/3806)
* append env resource params instead of replace ([#4161](https://github.com/aws-amplify/amplify-cli/issues/4161)) ([4f1aa97](https://github.com/aws-amplify/amplify-cli/commit/4f1aa97685c0162044e299d97668b1d92e4ad1dc))
* revert esm change temporarily, it conflicts with some imports ([#4223](https://github.com/aws-amplify/amplify-cli/issues/4223)) ([1b9bf06](https://github.com/aws-amplify/amplify-cli/commit/1b9bf063c500b32c13d8190277e1940fcba8cf21))


### Features

* make 'dev' the default envname if it's not present ([#4201](https://github.com/aws-amplify/amplify-cli/issues/4201)) ([0b0e775](https://github.com/aws-amplify/amplify-cli/commit/0b0e7758b825d78686af2fd37b13b8dcd1f28674))


### Performance Improvements

* use node's async esm module loader above node>=12 ([#4221](https://github.com/aws-amplify/amplify-cli/issues/4221)) ([a26eebe](https://github.com/aws-amplify/amplify-cli/commit/a26eebe68fde928b1286b158c33eeaa2db6151e9))





# [4.19.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.18.1...@aws-amplify/cli@4.19.0) (2020-05-08)


### Bug Fixes

* prevent naming conflicts with new env names ([#3875](https://github.com/aws-amplify/amplify-cli/issues/3875)) ([a7734ae](https://github.com/aws-amplify/amplify-cli/commit/a7734aedb8e846620874ae69e5c38da393dbbe30)), closes [#3854](https://github.com/aws-amplify/amplify-cli/issues/3854)
* replaced v1 docs references with v2 docs references ([#4169](https://github.com/aws-amplify/amplify-cli/issues/4169)) ([b578c2d](https://github.com/aws-amplify/amplify-cli/commit/b578c2dcd10038367c653ede2f6da42e7644b41b))


### Features

* notify if a CLI update is available ([#4046](https://github.com/aws-amplify/amplify-cli/issues/4046)) ([1a597a8](https://github.com/aws-amplify/amplify-cli/commit/1a597a8c05609521ea283be3d28a1f51ba3c4a8a))


### Performance Improvements

* plugin scan perf optimization ([#4187](https://github.com/aws-amplify/amplify-cli/issues/4187)) ([3b2cae6](https://github.com/aws-amplify/amplify-cli/commit/3b2cae6f5deb78069955676714c9b8248ca89019))





## [4.18.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.18.0...@aws-amplify/cli@4.18.1) (2020-04-23)


### Bug Fixes

* add function plugin interface to cli deps ([#3905](https://github.com/aws-amplify/amplify-cli/issues/3905)) ([001adfb](https://github.com/aws-amplify/amplify-cli/commit/001adfb137929e71acdc393e03916ad621bf2c8f))
* prevent hyphenated project names ([#3893](https://github.com/aws-amplify/amplify-cli/issues/3893)) ([236137d](https://github.com/aws-amplify/amplify-cli/commit/236137d84b3ff3c1e0a84ff7c7bd22bf4a8a52dd))
* **cli:** fix amplify console welcome message format ([#3936](https://github.com/aws-amplify/amplify-cli/issues/3936)) ([ee601a5](https://github.com/aws-amplify/amplify-cli/commit/ee601a501ad516db50c9ac83dc57bb730134e998))


### Reverts

* Revert "fix: add function plugin interface to cli deps (#3905)" (#3906) ([f534324](https://github.com/aws-amplify/amplify-cli/commit/f534324f4e315ea4e1e3f95afa840962ef8fc17a)), closes [#3905](https://github.com/aws-amplify/amplify-cli/issues/3905) [#3906](https://github.com/aws-amplify/amplify-cli/issues/3906)





# [4.18.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.17.2...@aws-amplify/cli@4.18.0) (2020-04-06)


### Bug Fixes

* add default editor if not present ([#3844](https://github.com/aws-amplify/amplify-cli/issues/3844)) ([549e1ad](https://github.com/aws-amplify/amplify-cli/commit/549e1ade795da3f7d3d9e9fbeb5a380bacab6dd2))
* dotnet function provider fixes, package.json cleanup, add pkg refs ([#3826](https://github.com/aws-amplify/amplify-cli/issues/3826)) ([75361fb](https://github.com/aws-amplify/amplify-cli/commit/75361fb266f15ba954a8b8e935874c74f66eb11a))
* rename node pluign packages ([#3788](https://github.com/aws-amplify/amplify-cli/issues/3788)) ([7b1f0f2](https://github.com/aws-amplify/amplify-cli/commit/7b1f0f2c7bb67a9d154e8462643fb0fe35e88399))


### Features

* **amplify-category-function:** Refactor invoke to call runtime plugins ([#3768](https://github.com/aws-amplify/amplify-cli/issues/3768)) ([92293fa](https://github.com/aws-amplify/amplify-cli/commit/92293fa83190bd18aacdc2f46a22938f94b89609))
* golang function support for CLI ([#3789](https://github.com/aws-amplify/amplify-cli/issues/3789)) ([3dbc234](https://github.com/aws-amplify/amplify-cli/commit/3dbc23497d0d1c238c6868adcf3a6d00ad909edd))
* minor tweaks to multi-runtime platform ([#3804](https://github.com/aws-amplify/amplify-cli/issues/3804)) ([60d68d7](https://github.com/aws-amplify/amplify-cli/commit/60d68d7e1a6e8c00cd629a38e9aefb2396a59737))





## [4.17.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.17.1...@aws-amplify/cli@4.17.2) (2020-03-26)


### Bug Fixes

* **cli:** added logic for use of dir separator in generate() ([#3739](https://github.com/aws-amplify/amplify-cli/issues/3739)) ([da17add](https://github.com/aws-amplify/amplify-cli/commit/da17adda27addc9fd37834f8968093c123988fce)), closes [#3761](https://github.com/aws-amplify/amplify-cli/issues/3761)





## [4.17.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.17.0...@aws-amplify/cli@4.17.1) (2020-03-22)


### Bug Fixes

* add function runtime and template provider dependencies to core ([0936ec7](https://github.com/aws-amplify/amplify-cli/commit/0936ec795b2401257450e2a6d7e2d897712b546c))





# [4.17.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.16.1...@aws-amplify/cli@4.17.0) (2020-03-22)


### Bug Fixes

* **cli:** deleting the amplify app on delete ([#3568](https://github.com/aws-amplify/amplify-cli/issues/3568)) ([f39bbcb](https://github.com/aws-amplify/amplify-cli/commit/f39bbcb715875eeeb612bcbc40b275b33f85eaf6)), closes [#3239](https://github.com/aws-amplify/amplify-cli/issues/3239)


### Features

* **amplify-category-function:** refactor to support build and package interface of runtime plugins ([8c4ec55](https://github.com/aws-amplify/amplify-cli/commit/8c4ec55e46ed8a153eee306c23f9665d58d3c5f4))
* **amplify-category-function:** refactor to support runtime and template plugins ([#3517](https://github.com/aws-amplify/amplify-cli/issues/3517)) ([607ae21](https://github.com/aws-amplify/amplify-cli/commit/607ae21287941805f44ea8a9b78dd12d16d71f85))





## [4.16.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.16.0...@aws-amplify/cli@4.16.1) (2020-03-10)

**Note:** Version bump only for package @aws-amplify/cli





# [4.16.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.13.4...@aws-amplify/cli@4.16.0) (2020-03-07)


### Bug Fixes

* **cli:** 'remove env' wording ([#3425](https://github.com/aws-amplify/amplify-cli/issues/3425)) ([ddaeb23](https://github.com/aws-amplify/amplify-cli/commit/ddaeb23d2fbffa7ee7f0769c133b75e0d2be9bcc))
* [#3304](https://github.com/aws-amplify/amplify-cli/issues/3304) - MaxListenersExceededWarning ([#3527](https://github.com/aws-amplify/amplify-cli/issues/3527)) ([aa391ef](https://github.com/aws-amplify/amplify-cli/commit/aa391ef86071672b8e0f7b61f9593a9aff3bea71))
* scoping down user pool group IAM roles and adding --force to amplify push command ([#3609](https://github.com/aws-amplify/amplify-cli/issues/3609)) ([2e10a2f](https://github.com/aws-amplify/amplify-cli/commit/2e10a2ff62b61f57b2d513a7cfd0e4478f429f1f))


### Features

* ability to add custom EventSource and lambda triggers via amplify add function, kinesis support in analytics category ([#2463](https://github.com/aws-amplify/amplify-cli/issues/2463)) ([b25cfd0](https://github.com/aws-amplify/amplify-cli/commit/b25cfd00b21416a82ecefda1f6498206ef71531b))





## [4.14.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.13.6-beta.1...@aws-amplify/cli@4.14.1) (2020-03-05)

**Note:** Version bump only for package @aws-amplify/cli





## [4.13.4](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.13.3...@aws-amplify/cli@4.13.4) (2020-02-18)

**Note:** Version bump only for package @aws-amplify/cli





## [4.13.3](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.13.2...@aws-amplify/cli@4.13.3) (2020-02-13)

**Note:** Version bump only for package @aws-amplify/cli





## [4.13.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.13.1...@aws-amplify/cli@4.13.2) (2020-02-07)

**Note:** Version bump only for package @aws-amplify/cli





## [4.13.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@4.13.0...@aws-amplify/cli@4.13.1) (2020-01-24)

**Note:** Version bump only for package @aws-amplify/cli





# [4.13.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@3.17.0...@aws-amplify/cli@4.13.0) (2020-01-23)

### Bug Fixes

- **cli:** print correct message if no provider plugins are active ([#2886](https://github.com/aws-amplify/amplify-cli/issues/2886)) ([37405b1](https://github.com/aws-amplify/amplify-cli/commit/37405b1ecc4c3818570b541d17e132bebaca5553))
- api key creation/deletion logic ([#2678](https://github.com/aws-amplify/amplify-cli/issues/2678)) ([e1d111d](https://github.com/aws-amplify/amplify-cli/commit/e1d111d87cbe71f9c7a41a61e243f6d907905878))
- **amplify-category-notifications:** fix notifications env change issue ([#2669](https://github.com/aws-amplify/amplify-cli/issues/2669)) ([54d4d64](https://github.com/aws-amplify/amplify-cli/commit/54d4d64e03dc246e42ba3e2d19b1789d2dbeaddc)), closes [#2616](https://github.com/aws-amplify/amplify-cli/issues/2616)
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- **cli:** disable ESM cache ([#3230](https://github.com/aws-amplify/amplify-cli/issues/3230)) ([3a5e43a](https://github.com/aws-amplify/amplify-cli/commit/3a5e43a4a5392c5bbe3cce1b5d4c7f793ca14273)), closes [#3199](https://github.com/aws-amplify/amplify-cli/issues/3199) [#3199](https://github.com/aws-amplify/amplify-cli/issues/3199)
- **cli:** fix appsync api native config file for legacy metadata ([#2842](https://github.com/aws-amplify/amplify-cli/issues/2842)) ([a8e55b7](https://github.com/aws-amplify/amplify-cli/commit/a8e55b727fca53e9006f45da772a56e7953fc6db))
- **cli:** fix console issue 342 and 350 ([#3189](https://github.com/aws-amplify/amplify-cli/issues/3189)) ([cbe26e0](https://github.com/aws-amplify/amplify-cli/commit/cbe26e01c657031e73b77fe408e53430029cab17)), closes [#350](https://github.com/aws-amplify/amplify-cli/issues/350)
- **cli:** fix postinit invokation ([#3130](https://github.com/aws-amplify/amplify-cli/issues/3130)) ([b25105c](https://github.com/aws-amplify/amplify-cli/commit/b25105c4f4417c21075f92004cd4a6c19aa61a87)), closes [#2642](https://github.com/aws-amplify/amplify-cli/issues/2642)
- **cli:** fixes cognito trigger removal bug ([#3063](https://github.com/aws-amplify/amplify-cli/issues/3063)) ([9e0f33d](https://github.com/aws-amplify/amplify-cli/commit/9e0f33d7ae6ed3f90f082d91d0c1bf8a8a7a14fd)), closes [#2458](https://github.com/aws-amplify/amplify-cli/issues/2458)
- **cli:** print correct message if no provider plugins are active ([#2907](https://github.com/aws-amplify/amplify-cli/issues/2907)) ([adce3b5](https://github.com/aws-amplify/amplify-cli/commit/adce3b5df0f2d61936a4f999b091850607069581))
- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- remove env fix ([#2970](https://github.com/aws-amplify/amplify-cli/issues/2970)) ([5c1a8e6](https://github.com/aws-amplify/amplify-cli/commit/5c1a8e62e295db45d0219c2b1f4950e33f8c25b3))
- update transformer conf version to 5 ([#2812](https://github.com/aws-amplify/amplify-cli/issues/2812)) ([c8dd1c9](https://github.com/aws-amplify/amplify-cli/commit/c8dd1c968ebcda9bc1f96b4ed8af3304c5b94c22))
- upgrade to node10 as min version for CLI ([#3128](https://github.com/aws-amplify/amplify-cli/issues/3128)) ([a0b18e0](https://github.com/aws-amplify/amplify-cli/commit/a0b18e0187a26b4ab0e6e986b0277f347e829444))

### Features

- add amplify-app command ([#2761](https://github.com/aws-amplify/amplify-cli/issues/2761)) ([c46cdd4](https://github.com/aws-amplify/amplify-cli/commit/c46cdd421bce40d7995b3e75f0ea7f4f646d2308))
- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** add amplifyconfiguration.json for native apps ([#2787](https://github.com/aws-amplify/amplify-cli/issues/2787)) ([0393535](https://github.com/aws-amplify/amplify-cli/commit/03935353596582bfac620ef7a0e68cf01ad376ee))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- **cli:** update publish command to use the updated push command ([#2826](https://github.com/aws-amplify/amplify-cli/issues/2826)) ([9fead0e](https://github.com/aws-amplify/amplify-cli/commit/9fead0e8b981a4d32b46bcf0c90cff88d16c5e70))

### Reverts

- revert 37405b1ecc4c3818570b541d17e132bebaca5553 (#2902) ([374937f](https://github.com/aws-amplify/amplify-cli/commit/374937fe071a531ca506da42d37037e5c1aca010)), closes [#2902](https://github.com/aws-amplify/amplify-cli/issues/2902) [#2886](https://github.com/aws-amplify/amplify-cli/issues/2886)

# [4.12.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@3.17.0...@aws-amplify/cli@4.12.0) (2020-01-09)

### Bug Fixes

- api key creation/deletion logic ([#2678](https://github.com/aws-amplify/amplify-cli/issues/2678)) ([e1d111d](https://github.com/aws-amplify/amplify-cli/commit/e1d111d87cbe71f9c7a41a61e243f6d907905878))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- **amplify-category-notifications:** fix notifications env change issue ([#2669](https://github.com/aws-amplify/amplify-cli/issues/2669)) ([54d4d64](https://github.com/aws-amplify/amplify-cli/commit/54d4d64e03dc246e42ba3e2d19b1789d2dbeaddc)), closes [#2616](https://github.com/aws-amplify/amplify-cli/issues/2616)
- **cli:** fix appsync api native config file for legacy metadata ([#2842](https://github.com/aws-amplify/amplify-cli/issues/2842)) ([a8e55b7](https://github.com/aws-amplify/amplify-cli/commit/a8e55b727fca53e9006f45da772a56e7953fc6db))
- **cli:** fix postinit invokation ([#3130](https://github.com/aws-amplify/amplify-cli/issues/3130)) ([b25105c](https://github.com/aws-amplify/amplify-cli/commit/b25105c4f4417c21075f92004cd4a6c19aa61a87)), closes [#2642](https://github.com/aws-amplify/amplify-cli/issues/2642)
- remove env fix ([#2970](https://github.com/aws-amplify/amplify-cli/issues/2970)) ([5c1a8e6](https://github.com/aws-amplify/amplify-cli/commit/5c1a8e62e295db45d0219c2b1f4950e33f8c25b3))
- update transformer conf version to 5 ([#2812](https://github.com/aws-amplify/amplify-cli/issues/2812)) ([c8dd1c9](https://github.com/aws-amplify/amplify-cli/commit/c8dd1c968ebcda9bc1f96b4ed8af3304c5b94c22))
- upgrade to node10 as min version for CLI ([#3128](https://github.com/aws-amplify/amplify-cli/issues/3128)) ([a0b18e0](https://github.com/aws-amplify/amplify-cli/commit/a0b18e0187a26b4ab0e6e986b0277f347e829444))
- **cli:** fixes cognito trigger removal bug ([#3063](https://github.com/aws-amplify/amplify-cli/issues/3063)) ([9e0f33d](https://github.com/aws-amplify/amplify-cli/commit/9e0f33d7ae6ed3f90f082d91d0c1bf8a8a7a14fd)), closes [#2458](https://github.com/aws-amplify/amplify-cli/issues/2458)
- **cli:** print correct message if no provider plugins are active ([#2886](https://github.com/aws-amplify/amplify-cli/issues/2886)) ([37405b1](https://github.com/aws-amplify/amplify-cli/commit/37405b1ecc4c3818570b541d17e132bebaca5553))
- **cli:** print correct message if no provider plugins are active ([#2907](https://github.com/aws-amplify/amplify-cli/issues/2907)) ([adce3b5](https://github.com/aws-amplify/amplify-cli/commit/adce3b5df0f2d61936a4f999b091850607069581))
- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))

### Features

- add amplify-app command ([#2761](https://github.com/aws-amplify/amplify-cli/issues/2761)) ([c46cdd4](https://github.com/aws-amplify/amplify-cli/commit/c46cdd421bce40d7995b3e75f0ea7f4f646d2308))
- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** add amplifyconfiguration.json for native apps ([#2787](https://github.com/aws-amplify/amplify-cli/issues/2787)) ([0393535](https://github.com/aws-amplify/amplify-cli/commit/03935353596582bfac620ef7a0e68cf01ad376ee))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- **cli:** update publish command to use the updated push command ([#2826](https://github.com/aws-amplify/amplify-cli/issues/2826)) ([9fead0e](https://github.com/aws-amplify/amplify-cli/commit/9fead0e8b981a4d32b46bcf0c90cff88d16c5e70))

### Reverts

- revert 37405b1ecc4c3818570b541d17e132bebaca5553 (#2902) ([374937f](https://github.com/aws-amplify/amplify-cli/commit/374937fe071a531ca506da42d37037e5c1aca010)), closes [#2902](https://github.com/aws-amplify/amplify-cli/issues/2902) [#2886](https://github.com/aws-amplify/amplify-cli/issues/2886)

# [4.11.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@3.17.0...@aws-amplify/cli@4.11.0) (2019-12-31)

### Bug Fixes

- api key creation/deletion logic ([#2678](https://github.com/aws-amplify/amplify-cli/issues/2678)) ([e1d111d](https://github.com/aws-amplify/amplify-cli/commit/e1d111d87cbe71f9c7a41a61e243f6d907905878))
- **amplify-category-notifications:** fix notifications env change issue ([#2669](https://github.com/aws-amplify/amplify-cli/issues/2669)) ([54d4d64](https://github.com/aws-amplify/amplify-cli/commit/54d4d64e03dc246e42ba3e2d19b1789d2dbeaddc)), closes [#2616](https://github.com/aws-amplify/amplify-cli/issues/2616)
- **cli:** fix appsync api native config file for legacy metadata ([#2842](https://github.com/aws-amplify/amplify-cli/issues/2842)) ([a8e55b7](https://github.com/aws-amplify/amplify-cli/commit/a8e55b727fca53e9006f45da772a56e7953fc6db))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- remove env fix ([#2970](https://github.com/aws-amplify/amplify-cli/issues/2970)) ([5c1a8e6](https://github.com/aws-amplify/amplify-cli/commit/5c1a8e62e295db45d0219c2b1f4950e33f8c25b3))
- update transformer conf version to 5 ([#2812](https://github.com/aws-amplify/amplify-cli/issues/2812)) ([c8dd1c9](https://github.com/aws-amplify/amplify-cli/commit/c8dd1c968ebcda9bc1f96b4ed8af3304c5b94c22))
- **cli:** fixes cognito trigger removal bug ([#3063](https://github.com/aws-amplify/amplify-cli/issues/3063)) ([9e0f33d](https://github.com/aws-amplify/amplify-cli/commit/9e0f33d7ae6ed3f90f082d91d0c1bf8a8a7a14fd)), closes [#2458](https://github.com/aws-amplify/amplify-cli/issues/2458)
- **cli:** print correct message if no provider plugins are active ([#2886](https://github.com/aws-amplify/amplify-cli/issues/2886)) ([37405b1](https://github.com/aws-amplify/amplify-cli/commit/37405b1ecc4c3818570b541d17e132bebaca5553))
- **cli:** print correct message if no provider plugins are active ([#2907](https://github.com/aws-amplify/amplify-cli/issues/2907)) ([adce3b5](https://github.com/aws-amplify/amplify-cli/commit/adce3b5df0f2d61936a4f999b091850607069581))
- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))

### Features

- add amplify-app command ([#2761](https://github.com/aws-amplify/amplify-cli/issues/2761)) ([c46cdd4](https://github.com/aws-amplify/amplify-cli/commit/c46cdd421bce40d7995b3e75f0ea7f4f646d2308))
- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** add amplifyconfiguration.json for native apps ([#2787](https://github.com/aws-amplify/amplify-cli/issues/2787)) ([0393535](https://github.com/aws-amplify/amplify-cli/commit/03935353596582bfac620ef7a0e68cf01ad376ee))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- **cli:** update publish command to use the updated push command ([#2826](https://github.com/aws-amplify/amplify-cli/issues/2826)) ([9fead0e](https://github.com/aws-amplify/amplify-cli/commit/9fead0e8b981a4d32b46bcf0c90cff88d16c5e70))

### Reverts

- revert 37405b1ecc4c3818570b541d17e132bebaca5553 (#2902) ([374937f](https://github.com/aws-amplify/amplify-cli/commit/374937fe071a531ca506da42d37037e5c1aca010)), closes [#2902](https://github.com/aws-amplify/amplify-cli/issues/2902) [#2886](https://github.com/aws-amplify/amplify-cli/issues/2886)

# [4.10.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@3.17.0...@aws-amplify/cli@4.10.0) (2019-12-28)

### Bug Fixes

- api key creation/deletion logic ([#2678](https://github.com/aws-amplify/amplify-cli/issues/2678)) ([e1d111d](https://github.com/aws-amplify/amplify-cli/commit/e1d111d87cbe71f9c7a41a61e243f6d907905878))
- **amplify-category-notifications:** fix notifications env change issue ([#2669](https://github.com/aws-amplify/amplify-cli/issues/2669)) ([54d4d64](https://github.com/aws-amplify/amplify-cli/commit/54d4d64e03dc246e42ba3e2d19b1789d2dbeaddc)), closes [#2616](https://github.com/aws-amplify/amplify-cli/issues/2616)
- **cli:** fix appsync api native config file for legacy metadata ([#2842](https://github.com/aws-amplify/amplify-cli/issues/2842)) ([a8e55b7](https://github.com/aws-amplify/amplify-cli/commit/a8e55b727fca53e9006f45da772a56e7953fc6db))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- remove env fix ([#2970](https://github.com/aws-amplify/amplify-cli/issues/2970)) ([5c1a8e6](https://github.com/aws-amplify/amplify-cli/commit/5c1a8e62e295db45d0219c2b1f4950e33f8c25b3))
- update transformer conf version to 5 ([#2812](https://github.com/aws-amplify/amplify-cli/issues/2812)) ([c8dd1c9](https://github.com/aws-amplify/amplify-cli/commit/c8dd1c968ebcda9bc1f96b4ed8af3304c5b94c22))
- **cli:** fixes cognito trigger removal bug ([#3063](https://github.com/aws-amplify/amplify-cli/issues/3063)) ([9e0f33d](https://github.com/aws-amplify/amplify-cli/commit/9e0f33d7ae6ed3f90f082d91d0c1bf8a8a7a14fd)), closes [#2458](https://github.com/aws-amplify/amplify-cli/issues/2458)
- **cli:** print correct message if no provider plugins are active ([#2886](https://github.com/aws-amplify/amplify-cli/issues/2886)) ([37405b1](https://github.com/aws-amplify/amplify-cli/commit/37405b1ecc4c3818570b541d17e132bebaca5553))
- **cli:** print correct message if no provider plugins are active ([#2907](https://github.com/aws-amplify/amplify-cli/issues/2907)) ([adce3b5](https://github.com/aws-amplify/amplify-cli/commit/adce3b5df0f2d61936a4f999b091850607069581))
- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))

### Features

- add amplify-app command ([#2761](https://github.com/aws-amplify/amplify-cli/issues/2761)) ([c46cdd4](https://github.com/aws-amplify/amplify-cli/commit/c46cdd421bce40d7995b3e75f0ea7f4f646d2308))
- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** add amplifyconfiguration.json for native apps ([#2787](https://github.com/aws-amplify/amplify-cli/issues/2787)) ([0393535](https://github.com/aws-amplify/amplify-cli/commit/03935353596582bfac620ef7a0e68cf01ad376ee))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- **cli:** update publish command to use the updated push command ([#2826](https://github.com/aws-amplify/amplify-cli/issues/2826)) ([9fead0e](https://github.com/aws-amplify/amplify-cli/commit/9fead0e8b981a4d32b46bcf0c90cff88d16c5e70))

### Reverts

- revert 37405b1ecc4c3818570b541d17e132bebaca5553 (#2902) ([374937f](https://github.com/aws-amplify/amplify-cli/commit/374937fe071a531ca506da42d37037e5c1aca010)), closes [#2902](https://github.com/aws-amplify/amplify-cli/issues/2902) [#2886](https://github.com/aws-amplify/amplify-cli/issues/2886)

# [4.9.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@3.17.0...@aws-amplify/cli@4.9.0) (2019-12-26)

### Bug Fixes

- api key creation/deletion logic ([#2678](https://github.com/aws-amplify/amplify-cli/issues/2678)) ([e1d111d](https://github.com/aws-amplify/amplify-cli/commit/e1d111d87cbe71f9c7a41a61e243f6d907905878))
- **amplify-category-notifications:** fix notifications env change issue ([#2669](https://github.com/aws-amplify/amplify-cli/issues/2669)) ([54d4d64](https://github.com/aws-amplify/amplify-cli/commit/54d4d64e03dc246e42ba3e2d19b1789d2dbeaddc)), closes [#2616](https://github.com/aws-amplify/amplify-cli/issues/2616)
- **cli:** fix appsync api native config file for legacy metadata ([#2842](https://github.com/aws-amplify/amplify-cli/issues/2842)) ([a8e55b7](https://github.com/aws-amplify/amplify-cli/commit/a8e55b727fca53e9006f45da772a56e7953fc6db))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- remove env fix ([#2970](https://github.com/aws-amplify/amplify-cli/issues/2970)) ([5c1a8e6](https://github.com/aws-amplify/amplify-cli/commit/5c1a8e62e295db45d0219c2b1f4950e33f8c25b3))
- update transformer conf version to 5 ([#2812](https://github.com/aws-amplify/amplify-cli/issues/2812)) ([c8dd1c9](https://github.com/aws-amplify/amplify-cli/commit/c8dd1c968ebcda9bc1f96b4ed8af3304c5b94c22))
- **cli:** fixes cognito trigger removal bug ([#3063](https://github.com/aws-amplify/amplify-cli/issues/3063)) ([9e0f33d](https://github.com/aws-amplify/amplify-cli/commit/9e0f33d7ae6ed3f90f082d91d0c1bf8a8a7a14fd)), closes [#2458](https://github.com/aws-amplify/amplify-cli/issues/2458)
- **cli:** print correct message if no provider plugins are active ([#2886](https://github.com/aws-amplify/amplify-cli/issues/2886)) ([37405b1](https://github.com/aws-amplify/amplify-cli/commit/37405b1ecc4c3818570b541d17e132bebaca5553))
- **cli:** print correct message if no provider plugins are active ([#2907](https://github.com/aws-amplify/amplify-cli/issues/2907)) ([adce3b5](https://github.com/aws-amplify/amplify-cli/commit/adce3b5df0f2d61936a4f999b091850607069581))
- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))

### Features

- add amplify-app command ([#2761](https://github.com/aws-amplify/amplify-cli/issues/2761)) ([c46cdd4](https://github.com/aws-amplify/amplify-cli/commit/c46cdd421bce40d7995b3e75f0ea7f4f646d2308))
- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** add amplifyconfiguration.json for native apps ([#2787](https://github.com/aws-amplify/amplify-cli/issues/2787)) ([0393535](https://github.com/aws-amplify/amplify-cli/commit/03935353596582bfac620ef7a0e68cf01ad376ee))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- **cli:** update publish command to use the updated push command ([#2826](https://github.com/aws-amplify/amplify-cli/issues/2826)) ([9fead0e](https://github.com/aws-amplify/amplify-cli/commit/9fead0e8b981a4d32b46bcf0c90cff88d16c5e70))

### Reverts

- revert 37405b1ecc4c3818570b541d17e132bebaca5553 (#2902) ([374937f](https://github.com/aws-amplify/amplify-cli/commit/374937fe071a531ca506da42d37037e5c1aca010)), closes [#2902](https://github.com/aws-amplify/amplify-cli/issues/2902) [#2886](https://github.com/aws-amplify/amplify-cli/issues/2886)

# [4.8.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@3.17.0...@aws-amplify/cli@4.8.0) (2019-12-25)

### Bug Fixes

- api key creation/deletion logic ([#2678](https://github.com/aws-amplify/amplify-cli/issues/2678)) ([e1d111d](https://github.com/aws-amplify/amplify-cli/commit/e1d111d87cbe71f9c7a41a61e243f6d907905878))
- **amplify-category-notifications:** fix notifications env change issue ([#2669](https://github.com/aws-amplify/amplify-cli/issues/2669)) ([54d4d64](https://github.com/aws-amplify/amplify-cli/commit/54d4d64e03dc246e42ba3e2d19b1789d2dbeaddc)), closes [#2616](https://github.com/aws-amplify/amplify-cli/issues/2616)
- **cli:** fix appsync api native config file for legacy metadata ([#2842](https://github.com/aws-amplify/amplify-cli/issues/2842)) ([a8e55b7](https://github.com/aws-amplify/amplify-cli/commit/a8e55b727fca53e9006f45da772a56e7953fc6db))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- remove env fix ([#2970](https://github.com/aws-amplify/amplify-cli/issues/2970)) ([5c1a8e6](https://github.com/aws-amplify/amplify-cli/commit/5c1a8e62e295db45d0219c2b1f4950e33f8c25b3))
- update transformer conf version to 5 ([#2812](https://github.com/aws-amplify/amplify-cli/issues/2812)) ([c8dd1c9](https://github.com/aws-amplify/amplify-cli/commit/c8dd1c968ebcda9bc1f96b4ed8af3304c5b94c22))
- **cli:** fixes cognito trigger removal bug ([#3063](https://github.com/aws-amplify/amplify-cli/issues/3063)) ([9e0f33d](https://github.com/aws-amplify/amplify-cli/commit/9e0f33d7ae6ed3f90f082d91d0c1bf8a8a7a14fd)), closes [#2458](https://github.com/aws-amplify/amplify-cli/issues/2458)
- **cli:** print correct message if no provider plugins are active ([#2886](https://github.com/aws-amplify/amplify-cli/issues/2886)) ([37405b1](https://github.com/aws-amplify/amplify-cli/commit/37405b1ecc4c3818570b541d17e132bebaca5553))
- **cli:** print correct message if no provider plugins are active ([#2907](https://github.com/aws-amplify/amplify-cli/issues/2907)) ([adce3b5](https://github.com/aws-amplify/amplify-cli/commit/adce3b5df0f2d61936a4f999b091850607069581))
- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))

### Features

- add amplify-app command ([#2761](https://github.com/aws-amplify/amplify-cli/issues/2761)) ([c46cdd4](https://github.com/aws-amplify/amplify-cli/commit/c46cdd421bce40d7995b3e75f0ea7f4f646d2308))
- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** add amplifyconfiguration.json for native apps ([#2787](https://github.com/aws-amplify/amplify-cli/issues/2787)) ([0393535](https://github.com/aws-amplify/amplify-cli/commit/03935353596582bfac620ef7a0e68cf01ad376ee))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- **cli:** update publish command to use the updated push command ([#2826](https://github.com/aws-amplify/amplify-cli/issues/2826)) ([9fead0e](https://github.com/aws-amplify/amplify-cli/commit/9fead0e8b981a4d32b46bcf0c90cff88d16c5e70))

### Reverts

- revert 37405b1ecc4c3818570b541d17e132bebaca5553 (#2902) ([374937f](https://github.com/aws-amplify/amplify-cli/commit/374937fe071a531ca506da42d37037e5c1aca010)), closes [#2902](https://github.com/aws-amplify/amplify-cli/issues/2902) [#2886](https://github.com/aws-amplify/amplify-cli/issues/2886)

# [4.7.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@3.17.0...@aws-amplify/cli@4.7.0) (2019-12-20)

### Bug Fixes

- api key creation/deletion logic ([#2678](https://github.com/aws-amplify/amplify-cli/issues/2678)) ([e1d111d](https://github.com/aws-amplify/amplify-cli/commit/e1d111d87cbe71f9c7a41a61e243f6d907905878))
- **amplify-category-notifications:** fix notifications env change issue ([#2669](https://github.com/aws-amplify/amplify-cli/issues/2669)) ([54d4d64](https://github.com/aws-amplify/amplify-cli/commit/54d4d64e03dc246e42ba3e2d19b1789d2dbeaddc)), closes [#2616](https://github.com/aws-amplify/amplify-cli/issues/2616)
- **cli:** fix appsync api native config file for legacy metadata ([#2842](https://github.com/aws-amplify/amplify-cli/issues/2842)) ([a8e55b7](https://github.com/aws-amplify/amplify-cli/commit/a8e55b727fca53e9006f45da772a56e7953fc6db))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- **cli:** print correct message if no provider plugins are active ([#2886](https://github.com/aws-amplify/amplify-cli/issues/2886)) ([37405b1](https://github.com/aws-amplify/amplify-cli/commit/37405b1ecc4c3818570b541d17e132bebaca5553))
- **cli:** print correct message if no provider plugins are active ([#2907](https://github.com/aws-amplify/amplify-cli/issues/2907)) ([adce3b5](https://github.com/aws-amplify/amplify-cli/commit/adce3b5df0f2d61936a4f999b091850607069581))
- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- remove env fix ([#2970](https://github.com/aws-amplify/amplify-cli/issues/2970)) ([5c1a8e6](https://github.com/aws-amplify/amplify-cli/commit/5c1a8e62e295db45d0219c2b1f4950e33f8c25b3))
- update transformer conf version to 5 ([#2812](https://github.com/aws-amplify/amplify-cli/issues/2812)) ([c8dd1c9](https://github.com/aws-amplify/amplify-cli/commit/c8dd1c968ebcda9bc1f96b4ed8af3304c5b94c22))

### Features

- add amplify-app command ([#2761](https://github.com/aws-amplify/amplify-cli/issues/2761)) ([c46cdd4](https://github.com/aws-amplify/amplify-cli/commit/c46cdd421bce40d7995b3e75f0ea7f4f646d2308))
- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** add amplifyconfiguration.json for native apps ([#2787](https://github.com/aws-amplify/amplify-cli/issues/2787)) ([0393535](https://github.com/aws-amplify/amplify-cli/commit/03935353596582bfac620ef7a0e68cf01ad376ee))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- **cli:** update publish command to use the updated push command ([#2826](https://github.com/aws-amplify/amplify-cli/issues/2826)) ([9fead0e](https://github.com/aws-amplify/amplify-cli/commit/9fead0e8b981a4d32b46bcf0c90cff88d16c5e70))

### Reverts

- revert 37405b1ecc4c3818570b541d17e132bebaca5553 (#2902) ([374937f](https://github.com/aws-amplify/amplify-cli/commit/374937fe071a531ca506da42d37037e5c1aca010)), closes [#2902](https://github.com/aws-amplify/amplify-cli/issues/2902) [#2886](https://github.com/aws-amplify/amplify-cli/issues/2886)

# [4.6.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@3.17.0...@aws-amplify/cli@4.6.0) (2019-12-10)

### Bug Fixes

- api key creation/deletion logic ([#2678](https://github.com/aws-amplify/amplify-cli/issues/2678)) ([e1d111d](https://github.com/aws-amplify/amplify-cli/commit/e1d111d87cbe71f9c7a41a61e243f6d907905878))
- **amplify-category-notifications:** fix notifications env change issue ([#2669](https://github.com/aws-amplify/amplify-cli/issues/2669)) ([54d4d64](https://github.com/aws-amplify/amplify-cli/commit/54d4d64e03dc246e42ba3e2d19b1789d2dbeaddc)), closes [#2616](https://github.com/aws-amplify/amplify-cli/issues/2616)
- **cli:** fix appsync api native config file for legacy metadata ([#2842](https://github.com/aws-amplify/amplify-cli/issues/2842)) ([a8e55b7](https://github.com/aws-amplify/amplify-cli/commit/a8e55b727fca53e9006f45da772a56e7953fc6db))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- update transformer conf version to 5 ([#2812](https://github.com/aws-amplify/amplify-cli/issues/2812)) ([c8dd1c9](https://github.com/aws-amplify/amplify-cli/commit/c8dd1c968ebcda9bc1f96b4ed8af3304c5b94c22))
- **cli:** print correct message if no provider plugins are active ([#2886](https://github.com/aws-amplify/amplify-cli/issues/2886)) ([37405b1](https://github.com/aws-amplify/amplify-cli/commit/37405b1ecc4c3818570b541d17e132bebaca5553))
- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))

### Features

- add amplify-app command ([#2761](https://github.com/aws-amplify/amplify-cli/issues/2761)) ([c46cdd4](https://github.com/aws-amplify/amplify-cli/commit/c46cdd421bce40d7995b3e75f0ea7f4f646d2308))
- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** add amplifyconfiguration.json for native apps ([#2787](https://github.com/aws-amplify/amplify-cli/issues/2787)) ([0393535](https://github.com/aws-amplify/amplify-cli/commit/03935353596582bfac620ef7a0e68cf01ad376ee))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- **cli:** update publish command to use the updated push command ([#2826](https://github.com/aws-amplify/amplify-cli/issues/2826)) ([9fead0e](https://github.com/aws-amplify/amplify-cli/commit/9fead0e8b981a4d32b46bcf0c90cff88d16c5e70))

### Reverts

- revert 37405b1ecc4c3818570b541d17e132bebaca5553 (#2902) ([374937f](https://github.com/aws-amplify/amplify-cli/commit/374937fe071a531ca506da42d37037e5c1aca010)), closes [#2902](https://github.com/aws-amplify/amplify-cli/issues/2902) [#2886](https://github.com/aws-amplify/amplify-cli/issues/2886)

# [4.4.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@3.17.0...@aws-amplify/cli@4.4.0) (2019-12-03)

### Bug Fixes

- api key creation/deletion logic ([#2678](https://github.com/aws-amplify/amplify-cli/issues/2678)) ([e1d111d](https://github.com/aws-amplify/amplify-cli/commit/e1d111d87cbe71f9c7a41a61e243f6d907905878))
- **amplify-category-notifications:** fix notifications env change issue ([#2669](https://github.com/aws-amplify/amplify-cli/issues/2669)) ([54d4d64](https://github.com/aws-amplify/amplify-cli/commit/54d4d64e03dc246e42ba3e2d19b1789d2dbeaddc)), closes [#2616](https://github.com/aws-amplify/amplify-cli/issues/2616)
- **cli:** fix appsync api native config file for legacy metadata ([#2842](https://github.com/aws-amplify/amplify-cli/issues/2842)) ([a8e55b7](https://github.com/aws-amplify/amplify-cli/commit/a8e55b727fca53e9006f45da772a56e7953fc6db))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- update transformer conf version to 5 ([#2812](https://github.com/aws-amplify/amplify-cli/issues/2812)) ([c8dd1c9](https://github.com/aws-amplify/amplify-cli/commit/c8dd1c968ebcda9bc1f96b4ed8af3304c5b94c22))
- **cli:** print correct message if no provider plugins are active ([#2886](https://github.com/aws-amplify/amplify-cli/issues/2886)) ([37405b1](https://github.com/aws-amplify/amplify-cli/commit/37405b1ecc4c3818570b541d17e132bebaca5553))
- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))

### Features

- add amplify-app command ([#2761](https://github.com/aws-amplify/amplify-cli/issues/2761)) ([c46cdd4](https://github.com/aws-amplify/amplify-cli/commit/c46cdd421bce40d7995b3e75f0ea7f4f646d2308))
- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** add amplifyconfiguration.json for native apps ([#2787](https://github.com/aws-amplify/amplify-cli/issues/2787)) ([0393535](https://github.com/aws-amplify/amplify-cli/commit/03935353596582bfac620ef7a0e68cf01ad376ee))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- **cli:** update publish command to use the updated push command ([#2826](https://github.com/aws-amplify/amplify-cli/issues/2826)) ([9fead0e](https://github.com/aws-amplify/amplify-cli/commit/9fead0e8b981a4d32b46bcf0c90cff88d16c5e70))

### Reverts

- revert 37405b1ecc4c3818570b541d17e132bebaca5553 (#2902) ([374937f](https://github.com/aws-amplify/amplify-cli/commit/374937fe071a531ca506da42d37037e5c1aca010)), closes [#2902](https://github.com/aws-amplify/amplify-cli/issues/2902) [#2886](https://github.com/aws-amplify/amplify-cli/issues/2886)

# [4.3.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@3.17.0...@aws-amplify/cli@4.3.0) (2019-12-01)

### Bug Fixes

- api key creation/deletion logic ([#2678](https://github.com/aws-amplify/amplify-cli/issues/2678)) ([e1d111d](https://github.com/aws-amplify/amplify-cli/commit/e1d111d87cbe71f9c7a41a61e243f6d907905878))
- **amplify-category-notifications:** fix notifications env change issue ([#2669](https://github.com/aws-amplify/amplify-cli/issues/2669)) ([54d4d64](https://github.com/aws-amplify/amplify-cli/commit/54d4d64e03dc246e42ba3e2d19b1789d2dbeaddc)), closes [#2616](https://github.com/aws-amplify/amplify-cli/issues/2616)
- **cli:** fix appsync api native config file for legacy metadata ([#2842](https://github.com/aws-amplify/amplify-cli/issues/2842)) ([a8e55b7](https://github.com/aws-amplify/amplify-cli/commit/a8e55b727fca53e9006f45da772a56e7953fc6db))
- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- update transformer conf version to 5 ([#2812](https://github.com/aws-amplify/amplify-cli/issues/2812)) ([c8dd1c9](https://github.com/aws-amplify/amplify-cli/commit/c8dd1c968ebcda9bc1f96b4ed8af3304c5b94c22))

### Features

- add amplify-app command ([#2761](https://github.com/aws-amplify/amplify-cli/issues/2761)) ([c46cdd4](https://github.com/aws-amplify/amplify-cli/commit/c46cdd421bce40d7995b3e75f0ea7f4f646d2308))
- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** add amplifyconfiguration.json for native apps ([#2787](https://github.com/aws-amplify/amplify-cli/issues/2787)) ([0393535](https://github.com/aws-amplify/amplify-cli/commit/03935353596582bfac620ef7a0e68cf01ad376ee))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- **cli:** update publish command to use the updated push command ([#2826](https://github.com/aws-amplify/amplify-cli/issues/2826)) ([9fead0e](https://github.com/aws-amplify/amplify-cli/commit/9fead0e8b981a4d32b46bcf0c90cff88d16c5e70))

# [4.2.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@3.17.0...@aws-amplify/cli@4.2.0) (2019-11-27)

### Bug Fixes

- api key creation/deletion logic ([#2678](https://github.com/aws-amplify/amplify-cli/issues/2678)) ([e1d111d](https://github.com/aws-amplify/amplify-cli/commit/e1d111d87cbe71f9c7a41a61e243f6d907905878))
- **amplify-category-notifications:** fix notifications env change issue ([#2669](https://github.com/aws-amplify/amplify-cli/issues/2669)) ([54d4d64](https://github.com/aws-amplify/amplify-cli/commit/54d4d64e03dc246e42ba3e2d19b1789d2dbeaddc)), closes [#2616](https://github.com/aws-amplify/amplify-cli/issues/2616)
- **cli:** fix appsync api native config file for legacy metadata ([#2842](https://github.com/aws-amplify/amplify-cli/issues/2842)) ([a8e55b7](https://github.com/aws-amplify/amplify-cli/commit/a8e55b727fca53e9006f45da772a56e7953fc6db))
- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- update transformer conf version to 5 ([#2812](https://github.com/aws-amplify/amplify-cli/issues/2812)) ([c8dd1c9](https://github.com/aws-amplify/amplify-cli/commit/c8dd1c968ebcda9bc1f96b4ed8af3304c5b94c22))

### Features

- add amplify-app command ([#2761](https://github.com/aws-amplify/amplify-cli/issues/2761)) ([c46cdd4](https://github.com/aws-amplify/amplify-cli/commit/c46cdd421bce40d7995b3e75f0ea7f4f646d2308))
- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** add amplifyconfiguration.json for native apps ([#2787](https://github.com/aws-amplify/amplify-cli/issues/2787)) ([0393535](https://github.com/aws-amplify/amplify-cli/commit/03935353596582bfac620ef7a0e68cf01ad376ee))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- **cli:** update publish command to use the updated push command ([#2826](https://github.com/aws-amplify/amplify-cli/issues/2826)) ([9fead0e](https://github.com/aws-amplify/amplify-cli/commit/9fead0e8b981a4d32b46bcf0c90cff88d16c5e70))

# [4.1.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@3.17.0...@aws-amplify/cli@4.1.0) (2019-11-27)

### Bug Fixes

- api key creation/deletion logic ([#2678](https://github.com/aws-amplify/amplify-cli/issues/2678)) ([e1d111d](https://github.com/aws-amplify/amplify-cli/commit/e1d111d87cbe71f9c7a41a61e243f6d907905878))
- **amplify-category-notifications:** fix notifications env change issue ([#2669](https://github.com/aws-amplify/amplify-cli/issues/2669)) ([54d4d64](https://github.com/aws-amplify/amplify-cli/commit/54d4d64e03dc246e42ba3e2d19b1789d2dbeaddc)), closes [#2616](https://github.com/aws-amplify/amplify-cli/issues/2616)
- **cli:** fix appsync api native config file for legacy metadata ([#2842](https://github.com/aws-amplify/amplify-cli/issues/2842)) ([a8e55b7](https://github.com/aws-amplify/amplify-cli/commit/a8e55b727fca53e9006f45da772a56e7953fc6db))
- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- update transformer conf version to 5 ([#2812](https://github.com/aws-amplify/amplify-cli/issues/2812)) ([c8dd1c9](https://github.com/aws-amplify/amplify-cli/commit/c8dd1c968ebcda9bc1f96b4ed8af3304c5b94c22))

### Features

- add amplify-app command ([#2761](https://github.com/aws-amplify/amplify-cli/issues/2761)) ([c46cdd4](https://github.com/aws-amplify/amplify-cli/commit/c46cdd421bce40d7995b3e75f0ea7f4f646d2308))
- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** add amplifyconfiguration.json for native apps ([#2787](https://github.com/aws-amplify/amplify-cli/issues/2787)) ([0393535](https://github.com/aws-amplify/amplify-cli/commit/03935353596582bfac620ef7a0e68cf01ad376ee))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- **cli:** update publish command to use the updated push command ([#2826](https://github.com/aws-amplify/amplify-cli/issues/2826)) ([9fead0e](https://github.com/aws-amplify/amplify-cli/commit/9fead0e8b981a4d32b46bcf0c90cff88d16c5e70))

# [3.0.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.8.4...@aws-amplify/cli@3.0.0) (2019-08-30)

- Adding Auth on Subscriptions (#2068) ([81c630d](https://github.com/aws-amplify/amplify-cli/commit/81c630d)), closes [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068)

### Bug Fixes

- **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad8))
- [#1056](https://github.com/aws-amplify/amplify-cli/issues/1056), dedup environment file reading ([#2088](https://github.com/aws-amplify/amplify-cli/issues/2088)) ([940deaa](https://github.com/aws-amplify/amplify-cli/commit/940deaa))
- [#429](https://github.com/aws-amplify/amplify-cli/issues/429) - Editor hanging bug ([#2086](https://github.com/aws-amplify/amplify-cli/issues/2086)) ([6767445](https://github.com/aws-amplify/amplify-cli/commit/6767445))
- fixing force push on init of new env ([#1949](https://github.com/aws-amplify/amplify-cli/issues/1949)) ([d4d0c97](https://github.com/aws-amplify/amplify-cli/commit/d4d0c97)), closes [#1945](https://github.com/aws-amplify/amplify-cli/issues/1945)
- local mock fix ([#1982](https://github.com/aws-amplify/amplify-cli/issues/1982)) ([8ee9029](https://github.com/aws-amplify/amplify-cli/commit/8ee9029))
- move test package dependencies to devDependencies ([#2034](https://github.com/aws-amplify/amplify-cli/issues/2034)) ([f5623d0](https://github.com/aws-amplify/amplify-cli/commit/f5623d0))
- **cli:** fix cli crash when opening editor ([#2172](https://github.com/aws-amplify/amplify-cli/issues/2172)) ([d29f14f](https://github.com/aws-amplify/amplify-cli/commit/d29f14f))
- **cli:** prevent cli crash when default editor is missing ([#2163](https://github.com/aws-amplify/amplify-cli/issues/2163)) ([67769fb](https://github.com/aws-amplify/amplify-cli/commit/67769fb))
- **cli:** update inquirer validation function to return msg ([#2166](https://github.com/aws-amplify/amplify-cli/issues/2166)) ([b3b8c21](https://github.com/aws-amplify/amplify-cli/commit/b3b8c21)), closes [#2164](https://github.com/aws-amplify/amplify-cli/issues/2164)

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))

### BREAKING CHANGES

- If an owner is used in the auth directive it will either be a requirement if it's
  the only rule or an optional input if used with other rules
- If an owner is included in the auth directive it will either be a requirement if
  it's the only rule or an optional input if used with other rules
- the subscription operations will require an argument if owner is the only auth rule
- Subscriptions will require an argument if an owner is only rule set - If owner &
  group rules are owner will be an optional arg

# [2.0.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.8.4...@aws-amplify/cli@2.0.0) (2019-08-28)

### Bug Fixes

- **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad8))
- [#1056](https://github.com/aws-amplify/amplify-cli/issues/1056), dedup environment file reading ([#2088](https://github.com/aws-amplify/amplify-cli/issues/2088)) ([940deaa](https://github.com/aws-amplify/amplify-cli/commit/940deaa))
- [#429](https://github.com/aws-amplify/amplify-cli/issues/429) - Editor hanging bug ([#2086](https://github.com/aws-amplify/amplify-cli/issues/2086)) ([6767445](https://github.com/aws-amplify/amplify-cli/commit/6767445))
- fixing force push on init of new env ([#1949](https://github.com/aws-amplify/amplify-cli/issues/1949)) ([d4d0c97](https://github.com/aws-amplify/amplify-cli/commit/d4d0c97)), closes [#1945](https://github.com/aws-amplify/amplify-cli/issues/1945)
- local mock fix ([#1982](https://github.com/aws-amplify/amplify-cli/issues/1982)) ([8ee9029](https://github.com/aws-amplify/amplify-cli/commit/8ee9029))
- move test package dependencies to devDependencies ([#2034](https://github.com/aws-amplify/amplify-cli/issues/2034)) ([f5623d0](https://github.com/aws-amplify/amplify-cli/commit/f5623d0))

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))

* Adding Auth on Subscriptions (#2068) ([81c630d](https://github.com/aws-amplify/amplify-cli/commit/81c630d)), closes [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068)

### BREAKING CHANGES

- If an owner is used in the auth directive it will either be a requirement if it's
  the only rule or an optional input if used with other rules
- If an owner is included in the auth directive it will either be a requirement if
  it's the only rule or an optional input if used with other rules
- the subscription operations will require an argument if owner is the only auth rule
- Subscriptions will require an argument if an owner is only rule set - If owner &
  group rules are owner will be an optional arg

# [1.12.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.8.4...@aws-amplify/cli@1.12.0) (2019-08-13)

### Bug Fixes

- fixing force push on init of new env ([#1949](https://github.com/aws-amplify/amplify-cli/issues/1949)) ([d4d0c97](https://github.com/aws-amplify/amplify-cli/commit/d4d0c97)), closes [#1945](https://github.com/aws-amplify/amplify-cli/issues/1945)
- **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad8))
- local mock fix ([#1982](https://github.com/aws-amplify/amplify-cli/issues/1982)) ([8ee9029](https://github.com/aws-amplify/amplify-cli/commit/8ee9029))

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))

# [1.11.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.8.4...@aws-amplify/cli@1.11.0) (2019-08-07)

### Bug Fixes

- fixing force push on init of new env ([#1949](https://github.com/aws-amplify/amplify-cli/issues/1949)) ([d4d0c97](https://github.com/aws-amplify/amplify-cli/commit/d4d0c97)), closes [#1945](https://github.com/aws-amplify/amplify-cli/issues/1945)
- **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad8))
- local mock fix ([#1982](https://github.com/aws-amplify/amplify-cli/issues/1982)) ([8ee9029](https://github.com/aws-amplify/amplify-cli/commit/8ee9029))

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))

# [1.10.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.8.4...@aws-amplify/cli@1.10.0) (2019-08-02)

### Bug Fixes

- fixing force push on init of new env ([#1949](https://github.com/aws-amplify/amplify-cli/issues/1949)) ([d4d0c97](https://github.com/aws-amplify/amplify-cli/commit/d4d0c97)), closes [#1945](https://github.com/aws-amplify/amplify-cli/issues/1945)

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))

# [1.9.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.8.4...@aws-amplify/cli@1.9.0) (2019-07-31)

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))

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

- replacing rel paths with plugin func ([71f553f](https://github.com/aws-amplify/amplify-cli/commit/71f553f))

### Features

- cognito + s3 + dyanmodb lambda trigger support ([#1783](https://github.com/aws-amplify/amplify-cli/issues/1783)) ([c6fc838](https://github.com/aws-amplify/amplify-cli/commit/c6fc838))

## [1.7.8](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.7.6...@aws-amplify/cli@1.7.8) (2019-06-30)

**Note:** Version bump only for package @aws-amplify/cli

## [1.7.6](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.7.5...@aws-amplify/cli@1.7.6) (2019-06-26)

**Note:** Version bump only for package @aws-amplify/cli

## [1.7.5](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.7.4...@aws-amplify/cli@1.7.5) (2019-06-20)

### Bug Fixes

- **cli:** fix inquirer version ([#1690](https://github.com/aws-amplify/amplify-cli/issues/1690)) ([9246032](https://github.com/aws-amplify/amplify-cli/commit/9246032)), closes [#1688](https://github.com/aws-amplify/amplify-cli/issues/1688)

## [1.7.4](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.7.3...@aws-amplify/cli@1.7.4) (2019-06-18)

**Note:** Version bump only for package @aws-amplify/cli

## [1.7.3](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.7.2...@aws-amplify/cli@1.7.3) (2019-06-12)

### Bug Fixes

- **amplify-category-interactions:** call updateMetaAfterAdd only once ([#1653](https://github.com/aws-amplify/amplify-cli/issues/1653)) ([dc28758](https://github.com/aws-amplify/amplify-cli/commit/dc28758)), closes [#1621](https://github.com/aws-amplify/amplify-cli/issues/1621)
- **cli:** add default value for options in updateAmplifyMeta ([#1648](https://github.com/aws-amplify/amplify-cli/issues/1648)) ([f9c87bb](https://github.com/aws-amplify/amplify-cli/commit/f9c87bb)), closes [#1621](https://github.com/aws-amplify/amplify-cli/issues/1621)

## [1.7.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.7.1...@aws-amplify/cli@1.7.2) (2019-06-11)

### Bug Fixes

- **amplify-cli:** return valid JSON when using amplify env get --json ([#1622](https://github.com/aws-amplify/amplify-cli/issues/1622)) ([49f4339](https://github.com/aws-amplify/amplify-cli/commit/49f4339)), closes [#1616](https://github.com/aws-amplify/amplify-cli/issues/1616)
- **cli:** support es6 import/export ([#1635](https://github.com/aws-amplify/amplify-cli/issues/1635)) ([18d5409](https://github.com/aws-amplify/amplify-cli/commit/18d5409)), closes [#1623](https://github.com/aws-amplify/amplify-cli/issues/1623)

## [1.7.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.7.0...@aws-amplify/cli@1.7.1) (2019-06-06)

**Note:** Version bump only for package @aws-amplify/cli

# [1.7.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.6.11...@aws-amplify/cli@1.7.0) (2019-05-29)

### Features

- flow to add policies to access amplify resources from Lambda ([#1462](https://github.com/aws-amplify/amplify-cli/issues/1462)) ([fee247c](https://github.com/aws-amplify/amplify-cli/commit/fee247c))

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

- update CLI to handle UTF8 BOM ([#1357](https://github.com/aws-amplify/amplify-cli/issues/1357)) ([b0afa07](https://github.com/aws-amplify/amplify-cli/commit/b0afa07)), closes [#1355](https://github.com/aws-amplify/amplify-cli/issues/1355) [#1122](https://github.com/aws-amplify/amplify-cli/issues/1122)

## [1.6.5](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.6.4...@aws-amplify/cli@1.6.5) (2019-04-25)

**Note:** Version bump only for package @aws-amplify/cli

## [1.6.4](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.6.3...@aws-amplify/cli@1.6.4) (2019-04-24)

### Bug Fixes

- **cli:** check BOM in json read ([#1293](https://github.com/aws-amplify/amplify-cli/issues/1293)) ([adf7ab7](https://github.com/aws-amplify/amplify-cli/commit/adf7ab7)), closes [#1280](https://github.com/aws-amplify/amplify-cli/issues/1280)

## [1.6.3](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.6.2...@aws-amplify/cli@1.6.3) (2019-04-16)

**Note:** Version bump only for package @aws-amplify/cli

## [1.6.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.6.1...@aws-amplify/cli@1.6.2) (2019-04-16)

### Bug Fixes

- **cli:** publish check user response ([f88e9b2](https://github.com/aws-amplify/amplify-cli/commit/f88e9b2)), closes [#965](https://github.com/aws-amplify/amplify-cli/issues/965)

## [1.6.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.5.1...@aws-amplify/cli@1.6.1) (2019-04-09)

**Note:** Version bump only for package @aws-amplify/cli

## [1.5.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.5.0...@aws-amplify/cli@1.5.1) (2019-04-03)

### Bug Fixes

- fix [#1201](https://github.com/aws-amplify/amplify-cli/issues/1201) ([0dfdda5](https://github.com/aws-amplify/amplify-cli/commit/0dfdda5))

# [1.5.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.1.8...@aws-amplify/cli@1.5.0) (2019-04-03)

### Bug Fixes

- **amplify-cli:** promise not resolving in lts/dubnium ([#1028](https://github.com/aws-amplify/amplify-cli/issues/1028)) ([8a966be](https://github.com/aws-amplify/amplify-cli/commit/8a966be))
- fixes update of aws exports when switching envs ([55a14bf](https://github.com/aws-amplify/amplify-cli/commit/55a14bf))
- lint errors ([4cb6e57](https://github.com/aws-amplify/amplify-cli/commit/4cb6e57))
- use helper functions for adding metadata ([50f8d76](https://github.com/aws-amplify/amplify-cli/commit/50f8d76))

### Features

- support for provisioning Cognito Hosted UI and support CRUD operations in Storage and API categories ([729b0de](https://github.com/aws-amplify/amplify-cli/commit/729b0de))
- use cloudformation to update meta ([d4ae437](https://github.com/aws-amplify/amplify-cli/commit/d4ae437))

## [1.1.8](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.1.7...@aws-amplify/cli@1.1.8) (2019-03-22)

### Bug Fixes

- **cli:** allow update value to be other types ([c3832b6](https://github.com/aws-amplify/amplify-cli/commit/c3832b6))

## [1.1.7](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.1.6...@aws-amplify/cli@1.1.7) (2019-03-05)

### Bug Fixes

- mispelling with amplify delete instructions ([1bca2cd](https://github.com/aws-amplify/amplify-cli/commit/1bca2cd))
- remove env command instructions ([6207dc2](https://github.com/aws-amplify/amplify-cli/commit/6207dc2))
- **cli:** added global windows npm path to plugin import ([6c1a2e7](https://github.com/aws-amplify/amplify-cli/commit/6c1a2e7))

### Performance Improvements

- speed up push ([#963](https://github.com/aws-amplify/amplify-cli/issues/963)) ([eb8b852](https://github.com/aws-amplify/amplify-cli/commit/eb8b852)), closes [#914](https://github.com/aws-amplify/amplify-cli/issues/914)

## [1.1.6](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.1.5...@aws-amplify/cli@1.1.6) (2019-02-26)

### Bug Fixes

- **@aws-amplify/cli:** change get-when fn to use updated proj config ([b1ef085](https://github.com/aws-amplify/amplify-cli/commit/b1ef085))

## [1.1.5](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.1.4...@aws-amplify/cli@1.1.5) (2019-02-25)

### Bug Fixes

- typo on `amplify env` help text ([4837ec9](https://github.com/aws-amplify/amplify-cli/commit/4837ec9))

## [1.1.4](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.1.3...@aws-amplify/cli@1.1.4) (2019-02-22)

**Note:** Version bump only for package @aws-amplify/cli

## [1.1.3](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.1.2...@aws-amplify/cli@1.1.3) (2019-02-20)

**Note:** Version bump only for package @aws-amplify/cli

## [1.1.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.1.0...@aws-amplify/cli@1.1.2) (2019-02-15)

### Bug Fixes

- remove warning about beta version of the CLI ([5029f4a](https://github.com/aws-amplify/amplify-cli/commit/5029f4a))

## [1.1.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.1.0...@aws-amplify/cli@1.1.1) (2019-02-14)

### Bug Fixes

- remove warning about beta version of the CLI ([5029f4a](https://github.com/aws-amplify/amplify-cli/commit/5029f4a))

# [1.1.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.0.5...@aws-amplify/cli@1.1.0) (2019-02-12)

### Features

- add warning message when migrating for manually modified CFN files ([c175102](https://github.com/aws-amplify/amplify-cli/commit/c175102))

## [1.0.5](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.0.3-beta.0...@aws-amplify/cli@1.0.5) (2019-02-11)

**Note:** Version bump only for package @aws-amplify/cli

## [1.0.3](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.0.3-beta.0...@aws-amplify/cli@1.0.3) (2019-02-11)

**Note:** Version bump only for package @aws-amplify/cli

## [1.0.3-beta.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@1.0.2...@aws-amplify/cli@1.0.3-beta.0) (2019-02-11)

**Note:** Version bump only for package @aws-amplify/cli

<a name="0.2.1-multienv.42"></a>

## [0.2.1-multienv.42](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.41...@aws-amplify/cli@0.2.1-multienv.42) (2019-02-01)

### Bug Fixes

- restrict env names to lowercase ([c4d0523](https://github.com/aws-amplify/amplify-cli/commit/c4d0523)), closes [#373](https://github.com/aws-amplify/amplify-cli/issues/373)

### Features

- Modify amplify env add/import behvior ([ca4a459](https://github.com/aws-amplify/amplify-cli/commit/ca4a459))

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

- Fix help message `sync` to `pull`. ([#747](https://github.com/aws-amplify/amplify-cli/issues/747)) ([97bbc12](https://github.com/aws-amplify/amplify-cli/commit/97bbc12))

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

- update dependsOn block when updating api ([ef8cb27](https://github.com/aws-amplify/amplify-cli/commit/ef8cb27))

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

- adding warning message when using beta-multienv cli ([e0c73fd](https://github.com/aws-amplify/amplify-cli/commit/e0c73fd))

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

- **cli:** remove calls to gluegun's prompt.confirm ([#546](https://github.com/aws-amplify/amplify-cli/issues/546)) ([0080ddb](https://github.com/aws-amplify/amplify-cli/commit/0080ddb))

<a name="0.2.1-multienv.8"></a>

## [0.2.1-multienv.8](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.7...@aws-amplify/cli@0.2.1-multienv.8) (2018-12-05)

### Bug Fixes

- **cli:** remove calls to gluegun's prompt.confirm ([#546](https://github.com/aws-amplify/amplify-cli/issues/546)) ([0080ddb](https://github.com/aws-amplify/amplify-cli/commit/0080ddb))

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

- make projects compatible with new version of CLI initialized between 11/25/2018 to 11/28/2018 ([9a30988](https://github.com/aws-amplify/amplify-cli/commit/9a30988))

<a name="0.2.1-multienv.2"></a>

## [0.2.1-multienv.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.1...@aws-amplify/cli@0.2.1-multienv.2) (2018-11-28)

### Bug Fixes

- allow only alphabets for env names ([0ef64e8](https://github.com/aws-amplify/amplify-cli/commit/0ef64e8))

### Features

- Add second level of messaging when migrating projects from old version to newer version ([aea7c4c](https://github.com/aws-amplify/amplify-cli/commit/aea7c4c))
- Add second level of messaging when migrating projects from old version to newer version ([#514](https://github.com/aws-amplify/amplify-cli/issues/514)) ([b373ebe](https://github.com/aws-amplify/amplify-cli/commit/b373ebe))
- core metadata migration of projects using the old version of the CLI ([#482](https://github.com/aws-amplify/amplify-cli/issues/482)) ([340b7e4](https://github.com/aws-amplify/amplify-cli/commit/340b7e4))
- migration of API GW and Interactions ([a91ba9a](https://github.com/aws-amplify/amplify-cli/commit/a91ba9a))
- migration of hosting and notifications ([#497](https://github.com/aws-amplify/amplify-cli/issues/497)) ([f6a60b6](https://github.com/aws-amplify/amplify-cli/commit/f6a60b6))
- migration of projects using the old version of the CLI ([f16c5a9](https://github.com/aws-amplify/amplify-cli/commit/f16c5a9))
- Multienv auth migrate ([#498](https://github.com/aws-amplify/amplify-cli/issues/498)) ([ef3e3b3](https://github.com/aws-amplify/amplify-cli/commit/ef3e3b3))

<a name="0.2.1-multienv.1"></a>

## [0.2.1-multienv.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.2.1-multienv.0...@aws-amplify/cli@0.2.1-multienv.1) (2018-11-22)

### Bug Fixes

- add additional checks for the presence of team-provider-info ([#492](https://github.com/aws-amplify/amplify-cli/issues/492)) ([0b98101](https://github.com/aws-amplify/amplify-cli/commit/0b98101))

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

- fix projectPath references in ios and codegen packages & fix for correct AWS profile pickup in the cloudformation provider ([a73656e](https://github.com/aws-amplify/amplify-cli/commit/a73656e))
- fix projectPath references in ios and codegen packages & fix for correct AWS profile pickup in the cloudformation provider ([f44e367](https://github.com/aws-amplify/amplify-cli/commit/f44e367))
- fixes for correct AWS profile pickup in the clouformation provider ([3c538b3](https://github.com/aws-amplify/amplify-cli/commit/3c538b3))
- fixes for correct AWS profile pickup in the clouformation provider ([779b431](https://github.com/aws-amplify/amplify-cli/commit/779b431))
- rename amplify env sync to amplify env pull ([cc5f5d0](https://github.com/aws-amplify/amplify-cli/commit/cc5f5d0))
- rename amplify env sync to amplify env pull ([825e16a](https://github.com/aws-amplify/amplify-cli/commit/825e16a))
- revert back profilename to default in headless script ([ff9b2f1](https://github.com/aws-amplify/amplify-cli/commit/ff9b2f1))
- revert back profilename to default in headless script ([f484707](https://github.com/aws-amplify/amplify-cli/commit/f484707))
- stringify env json outputs ([#427](https://github.com/aws-amplify/amplify-cli/issues/427)) ([798e949](https://github.com/aws-amplify/amplify-cli/commit/798e949))
- stringify env json outputs ([#427](https://github.com/aws-amplify/amplify-cli/issues/427)) ([ba25694](https://github.com/aws-amplify/amplify-cli/commit/ba25694))
- **cli:** downgrade fs-extra version ([6b0d632](https://github.com/aws-amplify/amplify-cli/commit/6b0d632))

### Features

- add json option to env display commands and add sample headless scripts ([#410](https://github.com/aws-amplify/amplify-cli/issues/410)) ([741590a](https://github.com/aws-amplify/amplify-cli/commit/741590a))
- add json option to env display commands and add sample headless scripts ([#410](https://github.com/aws-amplify/amplify-cli/issues/410)) ([e7f1f5f](https://github.com/aws-amplify/amplify-cli/commit/e7f1f5f))
- added amplify env sync and amplify env checkout command & added help commands for env ([#430](https://github.com/aws-amplify/amplify-cli/issues/430)) ([5219e08](https://github.com/aws-amplify/amplify-cli/commit/5219e08))
- added amplify env sync and amplify env checkout command & added help commands for env ([#430](https://github.com/aws-amplify/amplify-cli/issues/430)) ([de72729](https://github.com/aws-amplify/amplify-cli/commit/de72729))
- amplify env remove and ampify delete command for multi envs ([#458](https://github.com/aws-amplify/amplify-cli/issues/458)) ([f2495be](https://github.com/aws-amplify/amplify-cli/commit/f2495be))
- amplify env remove and ampify delete command for multi envs ([#458](https://github.com/aws-amplify/amplify-cli/issues/458)) ([ddca3bc](https://github.com/aws-amplify/amplify-cli/commit/ddca3bc))
- headless Init and configure ([#371](https://github.com/aws-amplify/amplify-cli/issues/371)) ([acd14a8](https://github.com/aws-amplify/amplify-cli/commit/acd14a8))
- headless Init and configure ([#371](https://github.com/aws-amplify/amplify-cli/issues/371)) ([8780400](https://github.com/aws-amplify/amplify-cli/commit/8780400))
- **amplify-category-auth:** add headless init support for auth ([#465](https://github.com/aws-amplify/amplify-cli/issues/465)) ([18410f2](https://github.com/aws-amplify/amplify-cli/commit/18410f2))
- help commands for multi-env and also add env&codegen to overall help command list ([1ed4591](https://github.com/aws-amplify/amplify-cli/commit/1ed4591))
- help commands for multi-env and also add env&codegen to overall help command list ([bba07c3](https://github.com/aws-amplify/amplify-cli/commit/bba07c3))
- multi-environment support for interactions category ([577a546](https://github.com/aws-amplify/amplify-cli/commit/577a546))
- multi-environment support for interactions category ([4ca2617](https://github.com/aws-amplify/amplify-cli/commit/4ca2617))
- multienv support for Notifications ([#440](https://github.com/aws-amplify/amplify-cli/issues/440)) ([a2964d4](https://github.com/aws-amplify/amplify-cli/commit/a2964d4))
- multienv support for Notifications ([#440](https://github.com/aws-amplify/amplify-cli/issues/440)) ([4dac0de](https://github.com/aws-amplify/amplify-cli/commit/4dac0de))
- multiple evironment support for analytics and s3 storage ([0400f26](https://github.com/aws-amplify/amplify-cli/commit/0400f26))
- multiple evironment support for analytics and s3 storage ([d1ca7bc](https://github.com/aws-amplify/amplify-cli/commit/d1ca7bc))

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

- **@aws-amplify/cli:** lint errors ([73d1ff6](https://github.com/aws-amplify/amplify-cli/commit/73d1ff6))
- **@aws-amplify/cli:** support yarn ([59cc5c2](https://github.com/aws-amplify/amplify-cli/commit/59cc5c2))
- **yarn:** support symlink dotfiles ([b604ed2](https://github.com/aws-amplify/amplify-cli/commit/b604ed2))

<a name="0.1.32"></a>

## [0.1.32](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.32-beta.0...@aws-amplify/cli@0.1.32) (2018-11-05)

**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.32-beta.0"></a>

## [0.1.32-beta.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.13...@aws-amplify/cli@0.1.32-beta.0) (2018-11-05)

### Bug Fixes

- **@aws-amplify/cli:** lint errors ([73d1ff6](https://github.com/aws-amplify/amplify-cli/commit/73d1ff6))
- **@aws-amplify/cli:** support yarn ([59cc5c2](https://github.com/aws-amplify/amplify-cli/commit/59cc5c2))
- **yarn:** support symlink dotfiles ([b604ed2](https://github.com/aws-amplify/amplify-cli/commit/b604ed2))

<a name="0.1.31"></a>

## [0.1.31](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.13...@aws-amplify/cli@0.1.31) (2018-11-02)

### Bug Fixes

- **@aws-amplify/cli:** lint errors ([73d1ff6](https://github.com/aws-amplify/amplify-cli/commit/73d1ff6))
- **@aws-amplify/cli:** support yarn ([59cc5c2](https://github.com/aws-amplify/amplify-cli/commit/59cc5c2))
- **yarn:** support symlink dotfiles ([b604ed2](https://github.com/aws-amplify/amplify-cli/commit/b604ed2))

<a name="0.1.30"></a>

## [0.1.30](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.30-beta.0...@aws-amplify/cli@0.1.30) (2018-11-02)

**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.30-beta.0"></a>

## [0.1.30-beta.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.13...@aws-amplify/cli@0.1.30-beta.0) (2018-11-02)

### Bug Fixes

- **@aws-amplify/cli:** lint errors ([73d1ff6](https://github.com/aws-amplify/amplify-cli/commit/73d1ff6))
- **@aws-amplify/cli:** support yarn ([59cc5c2](https://github.com/aws-amplify/amplify-cli/commit/59cc5c2))
- **yarn:** support symlink dotfiles ([b604ed2](https://github.com/aws-amplify/amplify-cli/commit/b604ed2))

<a name="0.1.29"></a>

## [0.1.29](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.29-beta.1...@aws-amplify/cli@0.1.29) (2018-10-23)

**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.29-beta.1"></a>

## [0.1.29-beta.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.29-beta.0...@aws-amplify/cli@0.1.29-beta.1) (2018-10-23)

**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.29-beta.0"></a>

## [0.1.29-beta.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.13...@aws-amplify/cli@0.1.29-beta.0) (2018-10-23)

### Bug Fixes

- **@aws-amplify/cli:** lint errors ([73d1ff6](https://github.com/aws-amplify/amplify-cli/commit/73d1ff6))
- **@aws-amplify/cli:** support yarn ([59cc5c2](https://github.com/aws-amplify/amplify-cli/commit/59cc5c2))
- **yarn:** support symlink dotfiles ([b604ed2](https://github.com/aws-amplify/amplify-cli/commit/b604ed2))

<a name="0.1.28"></a>

## [0.1.28](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.28-beta.0...@aws-amplify/cli@0.1.28) (2018-10-18)

**Note:** Version bump only for package @aws-amplify/cli

<a name="0.1.28-beta.0"></a>

## [0.1.28-beta.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@0.1.13...@aws-amplify/cli@0.1.28-beta.0) (2018-10-12)

### Bug Fixes

- **@aws-amplify/cli:** lint errors ([73d1ff6](https://github.com/aws-amplify/amplify-cli/commit/73d1ff6))
- **@aws-amplify/cli:** support yarn ([59cc5c2](https://github.com/aws-amplify/amplify-cli/commit/59cc5c2))
- **yarn:** support symlink dotfiles ([b604ed2](https://github.com/aws-amplify/amplify-cli/commit/b604ed2))

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
