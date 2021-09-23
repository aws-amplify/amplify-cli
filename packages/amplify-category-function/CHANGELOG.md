# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.34.7](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.34.6...amplify-category-function@2.34.7) (2021-09-18)

**Note:** Version bump only for package amplify-category-function





## [2.34.6](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.34.5...amplify-category-function@2.34.6) (2021-09-14)


### Bug Fixes

* **amplify-category-function:** specify UTC tz when selecting start time ([#8053](https://github.com/aws-amplify/amplify-cli/issues/8053)) ([5e3d69a](https://github.com/aws-amplify/amplify-cli/commit/5e3d69aef42d02b661a7ffe878f40de8a3881d5a))
* remove overwrite of email-only verification when triggers are added ([#7671](https://github.com/aws-amplify/amplify-cli/issues/7671)) ([704295b](https://github.com/aws-amplify/amplify-cli/commit/704295b918701eb81fdaabb786417463672fa02c))





## [2.34.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.34.4...amplify-category-function@2.34.5) (2021-09-09)


### Bug Fixes

* 'filter' of undefined when removing layers ([#8057](https://github.com/aws-amplify/amplify-cli/issues/8057)) ([b524870](https://github.com/aws-amplify/amplify-cli/commit/b524870200d56901482af5d6b18993ae1f6af6ec))





## [2.34.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.34.3...amplify-category-function@2.34.4) (2021-09-02)


### Bug Fixes

* **amplify-category-function:** check for new function when adding permissions ([#8017](https://github.com/aws-amplify/amplify-cli/issues/8017)) ([7af3b0d](https://github.com/aws-amplify/amplify-cli/commit/7af3b0d576310b8e9ec837a0f8c717a7b10c6f7e)), closes [#7970](https://github.com/aws-amplify/amplify-cli/issues/7970)
* **amplify-provider-awscloudformation:** display mfa prompt ([#7866](https://github.com/aws-amplify/amplify-cli/issues/7866)) ([8947b18](https://github.com/aws-amplify/amplify-cli/commit/8947b187bf7a7ff6c998488a9931839ca3169d02))
* function names are made to match package.json's format ([#7988](https://github.com/aws-amplify/amplify-cli/issues/7988)) ([25689dd](https://github.com/aws-amplify/amplify-cli/commit/25689ddd099895d3d2ea2f4cb70f69f3c7801661))
* include files starting with a period on packaging ([#7861](https://github.com/aws-amplify/amplify-cli/issues/7861)) ([870ad10](https://github.com/aws-amplify/amplify-cli/commit/870ad1001bb63b2f4b1b576bdde6c0ba24173676))
* parameterize AppId in secrets path for multi-account workflows ([#7922](https://github.com/aws-amplify/amplify-cli/issues/7922)) ([50a11a8](https://github.com/aws-amplify/amplify-cli/commit/50a11a8bfe173103d7f7490b87eace112d9d6412))
* resource key should be 'category', not 'categoryName' ([#8041](https://github.com/aws-amplify/amplify-cli/issues/8041)) ([3908d1b](https://github.com/aws-amplify/amplify-cli/commit/3908d1badde29ffe79da3c31274a7c893ee0afc4))


### Reverts

* Revert "fix(amplify-provider-awscloudformation): display mfa prompt (#7866)" (#8054) ([7b5de7b](https://github.com/aws-amplify/amplify-cli/commit/7b5de7b553e189a47c88e2902a0f21744a16dc10)), closes [#7866](https://github.com/aws-amplify/amplify-cli/issues/7866) [#8054](https://github.com/aws-amplify/amplify-cli/issues/8054)
* Revert "fix: function names are made to match package.json's format (#7988)" (#8051) ([b40faa7](https://github.com/aws-amplify/amplify-cli/commit/b40faa79244f3a24fc5f444759500bef522ecf6f)), closes [#7988](https://github.com/aws-amplify/amplify-cli/issues/7988) [#8051](https://github.com/aws-amplify/amplify-cli/issues/8051)





## [2.34.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.34.2...amplify-category-function@2.34.3) (2021-08-24)


### Bug Fixes

* **amplify-category-function:** fixed issue for removing function env variable ([#7917](https://github.com/aws-amplify/amplify-cli/issues/7917)) ([423c4b1](https://github.com/aws-amplify/amplify-cli/commit/423c4b1855a0de5eb627c982a6c54bd3b6c2c9e0)), closes [#7777](https://github.com/aws-amplify/amplify-cli/issues/7777)





## [2.34.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.34.1...amplify-category-function@2.34.2) (2021-08-06)


### Bug Fixes

* **amplify-category-function:** Storage env vars not added to lambda function ([#7785](https://github.com/aws-amplify/amplify-cli/issues/7785)) ([cb4daaa](https://github.com/aws-amplify/amplify-cli/commit/cb4daaa6edfbf8dd2f7cab71abbda0ef450b16c3))
* fiux e2e tests by passing categoryName for the resource ([#7886](https://github.com/aws-amplify/amplify-cli/issues/7886)) ([e420c6a](https://github.com/aws-amplify/amplify-cli/commit/e420c6ad11467dc8d1f52c8e65009794bf783944))
* improve size checks before packaging Lambda resources ([#7756](https://github.com/aws-amplify/amplify-cli/issues/7756)) ([5952f6a](https://github.com/aws-amplify/amplify-cli/commit/5952f6aa6c1a6bbf3693a465ab61c46b7ab5c37b))





## [2.34.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.34.0...amplify-category-function@2.34.1) (2021-07-30)



## 5.2.1 (2021-07-29)


### Bug Fixes

* [#7696](https://github.com/aws-amplify/amplify-cli/issues/7696) - support production package install for function category ([#7812](https://github.com/aws-amplify/amplify-cli/issues/7812)) ([b39141e](https://github.com/aws-amplify/amplify-cli/commit/b39141e9d00bf0dc23318dcc476ed92ab031e88b))
* correct behavior of --yes on push when missing env var ([#7826](https://github.com/aws-amplify/amplify-cli/issues/7826)) ([36b807b](https://github.com/aws-amplify/amplify-cli/commit/36b807bafa07c040eb66a1555bf95f17938aa93c))
* lambda timeout should be an integer type ([#7699](https://github.com/aws-amplify/amplify-cli/issues/7699)) ([cbacf4d](https://github.com/aws-amplify/amplify-cli/commit/cbacf4d3e497421855c09825970e025550aacfd7))





# [2.34.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.33.1...amplify-category-function@2.34.0) (2021-07-27)


### Bug Fixes

* disable layer version removal if fn depends on pinned version ([#7627](https://github.com/aws-amplify/amplify-cli/issues/7627)) ([a086789](https://github.com/aws-amplify/amplify-cli/commit/a086789661df95735679214a65a3808c8a5497e5))


### Features

* **amplify-category-function:** skip unnecessary prompt for 'amplify update function' ([12872a4](https://github.com/aws-amplify/amplify-cli/commit/12872a40d178f829cab3666037ebefde5eda02c2))





## [2.33.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.33.0...amplify-category-function@2.33.1) (2021-07-16)


### Bug Fixes

* [#7441](https://github.com/aws-amplify/amplify-cli/issues/7441) - init from git prompts for credentials twice ([#7682](https://github.com/aws-amplify/amplify-cli/issues/7682)) ([7471c5f](https://github.com/aws-amplify/amplify-cli/commit/7471c5fcc86af0e17a967066a388f67891f93355))
* add/update function when some LL are not yet migrated ([#7674](https://github.com/aws-amplify/amplify-cli/issues/7674)) ([9688681](https://github.com/aws-amplify/amplify-cli/commit/968868103744edcfbed6b082b3d9a92867180f73))
* check for undefined permissions when removing dependent permissions ([#7594](https://github.com/aws-amplify/amplify-cli/issues/7594)) ([b1b6291](https://github.com/aws-amplify/amplify-cli/commit/b1b6291ac79b18b55723f9463aa93005ab75be88))
* checkout into existing env with new LL ([#7687](https://github.com/aws-amplify/amplify-cli/issues/7687)) ([3e2e630](https://github.com/aws-amplify/amplify-cli/commit/3e2e6305b5a74db2a282dc33b0cc5d24f1c8eaaf))





# [2.33.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.32.2...amplify-category-function@2.33.0) (2021-06-30)


### Bug Fixes

* **amplify-category-function:** incorrectly migrated layers' parameters.json ([#7629](https://github.com/aws-amplify/amplify-cli/issues/7629)) ([22c5e8e](https://github.com/aws-amplify/amplify-cli/commit/22c5e8ebc7eda5da432599c9a60ff2a964ef5bc9))
* [#7587](https://github.com/aws-amplify/amplify-cli/issues/7587) - resource filtering in same category for crud ([#7598](https://github.com/aws-amplify/amplify-cli/issues/7598)) ([caf95d0](https://github.com/aws-amplify/amplify-cli/commit/caf95d005b5e8207a704bf481e93da5345a10356))
* handle migrated layers with no runtime or multiple runtimes ([#7603](https://github.com/aws-amplify/amplify-cli/issues/7603)) ([856fdf7](https://github.com/aws-amplify/amplify-cli/commit/856fdf7d226c8a6dc47a8e2278b13dd793fee22a))


### Features

* configure env vars and secrets for lambda functions ([#7529](https://github.com/aws-amplify/amplify-cli/issues/7529)) ([fac354e](https://github.com/aws-amplify/amplify-cli/commit/fac354e5e26846e8b1499d3a4718b15983e0110f))





## [2.32.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.32.1...amplify-category-function@2.32.2) (2021-06-24)


### Bug Fixes

* [#7569](https://github.com/aws-amplify/amplify-cli/issues/7569) - make hashing predictable by sorting files first ([#7581](https://github.com/aws-amplify/amplify-cli/issues/7581)) ([c3d60cd](https://github.com/aws-amplify/amplify-cli/commit/c3d60cd6798785867fbd47d1b98755cfb16a93d1))
* file path for Pipfile.lock for python layer globbing, add e2e tests ([#7577](https://github.com/aws-amplify/amplify-cli/issues/7577)) ([e8250af](https://github.com/aws-amplify/amplify-cli/commit/e8250afa0c0ae45d6379f2ad260d32bfb8cad3dc))





## [2.32.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.32.0...amplify-category-function@2.32.1) (2021-06-19)


### Bug Fixes

* change scope of change detection for python layers ([#7545](https://github.com/aws-amplify/amplify-cli/issues/7545)) ([a23ab9b](https://github.com/aws-amplify/amplify-cli/commit/a23ab9be295ed49db7bcd4f09d925a3eca98f5c7))
* lambda layer change handling ([#7537](https://github.com/aws-amplify/amplify-cli/issues/7537)) ([9b7a6b7](https://github.com/aws-amplify/amplify-cli/commit/9b7a6b7afdbdd2299557890e401c681a22922677))





# [2.32.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.31.10...amplify-category-function@2.32.0) (2021-06-15)



# 5.0.0 (2021-06-14)


### Bug Fixes

* copy env specific data from ccb on env checkout ([#7512](https://github.com/aws-amplify/amplify-cli/issues/7512)) ([bef6d9c](https://github.com/aws-amplify/amplify-cli/commit/bef6d9c5d1fd7e12bbacaf20639c00334d285517))


### Features

* lambda layers rework ([#7375](https://github.com/aws-amplify/amplify-cli/issues/7375)) ([a3b7d3e](https://github.com/aws-amplify/amplify-cli/commit/a3b7d3e427e16bac2b2ea27699fe53b48cf47656))





## [2.31.10](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.31.9...amplify-category-function@2.31.10) (2021-05-26)

**Note:** Version bump only for package amplify-category-function





## [2.31.9](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.31.8...amplify-category-function@2.31.9) (2021-05-22)


### Bug Fixes

* added check for undefined dependsOn ([#7363](https://github.com/aws-amplify/amplify-cli/issues/7363)) ([9caad85](https://github.com/aws-amplify/amplify-cli/commit/9caad85a4c73ac775d5e8cfdb21b179f66a84b96))





## [2.31.8](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.31.7...amplify-category-function@2.31.8) (2021-05-18)

**Note:** Version bump only for package amplify-category-function





## [2.31.7](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.31.6...amplify-category-function@2.31.7) (2021-05-14)


### Bug Fixes

* cross resource permission handling ([#7289](https://github.com/aws-amplify/amplify-cli/issues/7289)) ([4a9fb78](https://github.com/aws-amplify/amplify-cli/commit/4a9fb78d4e1fecdf79634c1782bdefa17d803632))
* function e2e tests ([#7295](https://github.com/aws-amplify/amplify-cli/issues/7295)) ([5c918be](https://github.com/aws-amplify/amplify-cli/commit/5c918be56f36fb9182d07af4f87a6a8f9f05b6ed))





## [2.31.6](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.31.4...amplify-category-function@2.31.6) (2021-05-03)



## 4.50.1 (2021-05-03)

**Note:** Version bump only for package amplify-category-function





## [2.31.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.31.4...amplify-category-function@2.31.5) (2021-05-03)

**Note:** Version bump only for package amplify-category-function





## [2.31.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.31.3...amplify-category-function@2.31.4) (2021-04-27)


### Bug Fixes

* lambdaLayers DependsOn removal ([#7021](https://github.com/aws-amplify/amplify-cli/issues/7021)) (ref [#6435](https://github.com/aws-amplify/amplify-cli/issues/6435) [#5961](https://github.com/aws-amplify/amplify-cli/issues/5961)) ([83c3c3c](https://github.com/aws-amplify/amplify-cli/commit/83c3c3ce3771fc5cb07e58c6e605dce6b547483a))





## [2.31.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.31.2...amplify-category-function@2.31.3) (2021-04-19)

**Note:** Version bump only for package amplify-category-function





## [2.31.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.31.1...amplify-category-function@2.31.2) (2021-04-14)


### Bug Fixes

* assign group env from source ([#7006](https://github.com/aws-amplify/amplify-cli/issues/7006)) ([139f44d](https://github.com/aws-amplify/amplify-cli/commit/139f44d3ecc3bbb5d4f25d24e8d2782a34eae281))





## [2.31.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.30.5...amplify-category-function@2.31.1) (2021-04-09)


### Bug Fixes

* remove validator on function categories access prompt ([#6766](https://github.com/aws-amplify/amplify-cli/issues/6766)) ([a326934](https://github.com/aws-amplify/amplify-cli/commit/a3269348f089326cb88af4f0607c99f61006536e)), closes [#6719](https://github.com/aws-amplify/amplify-cli/issues/6719)
* **amplify-category-function:** add condition for info printing ([#6967](https://github.com/aws-amplify/amplify-cli/issues/6967)) ([0c99bf6](https://github.com/aws-amplify/amplify-cli/commit/0c99bf672427dedd273d4100568894fa1fefd31e)), closes [/github.com/aws-amplify/amplify-cli/pull/6766#issuecomment-805291533](https://github.com//github.com/aws-amplify/amplify-cli/pull/6766/issues/issuecomment-805291533)





## [2.30.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.30.4...amplify-category-function@2.30.5) (2021-03-23)

**Note:** Version bump only for package amplify-category-function





## [2.30.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.30.3...amplify-category-function@2.30.4) (2021-03-11)

**Note:** Version bump only for package amplify-category-function





## [2.30.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.30.2...amplify-category-function@2.30.3) (2021-03-05)

**Note:** Version bump only for package amplify-category-function





## [2.30.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.30.1...amplify-category-function@2.30.2) (2021-02-26)

**Note:** Version bump only for package amplify-category-function





## [2.30.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.30.0...amplify-category-function@2.30.1) (2021-02-24)

**Note:** Version bump only for package amplify-category-function





# [2.30.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.29.0...amplify-category-function@2.30.0) (2021-02-17)


### Bug Fixes

* correct function resource name validation ([#6570](https://github.com/aws-amplify/amplify-cli/issues/6570)) ([5737b46](https://github.com/aws-amplify/amplify-cli/commit/5737b46df2ca405cfa0d56e03d5b8e74102cffd4))
* fix messed up merge ([#6612](https://github.com/aws-amplify/amplify-cli/issues/6612)) ([0e5d85b](https://github.com/aws-amplify/amplify-cli/commit/0e5d85be780c800aad2322ebb2b5598187c97ae8))
* mock bug fixes and e2e test updates ([#6626](https://github.com/aws-amplify/amplify-cli/issues/6626)) ([af76446](https://github.com/aws-amplify/amplify-cli/commit/af76446d18bf626ca5f91c3ad41081175c959807))


### Features

* fully populate mock function environment variables ([#6551](https://github.com/aws-amplify/amplify-cli/issues/6551)) ([dceb13a](https://github.com/aws-amplify/amplify-cli/commit/dceb13a76a85a05940078868a3e2e1ca85656938))
* Separate prod and dev lambda function builds ([#6494](https://github.com/aws-amplify/amplify-cli/issues/6494)) ([2977c6a](https://github.com/aws-amplify/amplify-cli/commit/2977c6a886b33a38ef46f898a2adc1ffdb6d228b))





# [2.29.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.28.5...amplify-category-function@2.29.0) (2021-02-11)


### Features

* dont open urls when CLI is running in CI ([#6503](https://github.com/aws-amplify/amplify-cli/issues/6503)) ([27546a7](https://github.com/aws-amplify/amplify-cli/commit/27546a78159ea95c636dbbd094fe6a4f7fb8f8f4)), closes [#5973](https://github.com/aws-amplify/amplify-cli/issues/5973)





## [2.28.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.28.4...amplify-category-function@2.28.5) (2021-02-10)


### Bug Fixes

* **amplify-category-function:** use ref for S3Bucket and S3Key in CFN ([#6358](https://github.com/aws-amplify/amplify-cli/issues/6358)) ([84a141a](https://github.com/aws-amplify/amplify-cli/commit/84a141ac4812d95c27b14c8d9f81e4a5c8fadef8))
* [#6397](https://github.com/aws-amplify/amplify-cli/issues/6397) - auth update overwrite parameters ([#6403](https://github.com/aws-amplify/amplify-cli/issues/6403)) ([75f5ace](https://github.com/aws-amplify/amplify-cli/commit/75f5ace173a6b36b943e2110845e411a2cce5d6d))
* fix appsync permission assignment from functions ([#5342](https://github.com/aws-amplify/amplify-cli/issues/5342)) ([b2e2dd0](https://github.com/aws-amplify/amplify-cli/commit/b2e2dd0071c1a451ba032cf7f8cfe7cf6381a96e))
* persist s3bucket metadata on pull and env change ([#6502](https://github.com/aws-amplify/amplify-cli/issues/6502)) ([357f787](https://github.com/aws-amplify/amplify-cli/commit/357f787c2d816e1defa1d0909b06f82775c35255))





## [2.28.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.28.3...amplify-category-function@2.28.4) (2021-01-08)


### Bug Fixes

* remove process on next and await ([#6239](https://github.com/aws-amplify/amplify-cli/issues/6239)) ([59d4a0e](https://github.com/aws-amplify/amplify-cli/commit/59d4a0eb318d2b3ad97be34bda9dee756cf82d74))





## [2.28.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.28.2...amplify-category-function@2.28.3) (2020-12-31)

**Note:** Version bump only for package amplify-category-function





## [2.28.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.28.1...amplify-category-function@2.28.2) (2020-12-21)

**Note:** Version bump only for package amplify-category-function





## [2.28.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.28.0...amplify-category-function@2.28.1) (2020-12-16)


### Bug Fixes

* removes overwrite of current DependsOn ([#6040](https://github.com/aws-amplify/amplify-cli/issues/6040)) ([8866f45](https://github.com/aws-amplify/amplify-cli/commit/8866f45a1a2306c205b651c8e7c68d90f1092acb))





# [2.28.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.27.0...amplify-category-function@2.28.0) (2020-12-11)


### Features

* container-based deployments([#5727](https://github.com/aws-amplify/amplify-cli/issues/5727)) ([fad6377](https://github.com/aws-amplify/amplify-cli/commit/fad6377bd384862ca4429cb1a83eee90efd62b58))





# [2.27.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.26.3...amplify-category-function@2.27.0) (2020-12-07)


### Features

* add support for multiple [@key](https://github.com/key) changes in same [@model](https://github.com/model) ([#6044](https://github.com/aws-amplify/amplify-cli/issues/6044)) ([e574637](https://github.com/aws-amplify/amplify-cli/commit/e5746379ea1330c53dacb55e8f6a9de7b17b55ae))





## [2.26.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.26.2...amplify-category-function@2.26.3) (2020-11-30)

**Note:** Version bump only for package amplify-category-function





## [2.26.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.26.1...amplify-category-function@2.26.2) (2020-11-27)

**Note:** Version bump only for package amplify-category-function





## [2.26.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.25.8...amplify-category-function@2.26.1) (2020-11-22)

**Note:** Version bump only for package amplify-category-function





# [2.26.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.7.3...amplify-category-function@2.26.0) (2020-11-22)


### Bug Fixes

* refactor mobile hub migration checks ([#5632](https://github.com/aws-amplify/amplify-cli/issues/5632)) ([b796eb8](https://github.com/aws-amplify/amplify-cli/commit/b796eb8303bb903f5f531506254441a63eba2962))
* **amplify-category-function:** fix update permission bug ([#5421](https://github.com/aws-amplify/amplify-cli/issues/5421)) ([f1194fd](https://github.com/aws-amplify/amplify-cli/commit/f1194fdd0aacbd2c316545422ad5e659d7042118)), closes [#5333](https://github.com/aws-amplify/amplify-cli/issues/5333)
* /opt folder should be packaged at the root of the zipped dir ([#4835](https://github.com/aws-amplify/amplify-cli/issues/4835)) ([ec8199c](https://github.com/aws-amplify/amplify-cli/commit/ec8199c5ae8d4eda504d5bad2b30567a5e2b4810))
* add support for mobile hub migrated resources ([#5407](https://github.com/aws-amplify/amplify-cli/issues/5407)) ([5dfe287](https://github.com/aws-amplify/amplify-cli/commit/5dfe2872c153047ebdc56bc4f671fd57c12379d9))
* Added check to stop prompts for cognito triggers while using env commands ([#5039](https://github.com/aws-amplify/amplify-cli/issues/5039)) ([744dbc4](https://github.com/aws-amplify/amplify-cli/commit/744dbc42e847e273160caf3672365391f055191b))
* added exit code on remove ([#5427](https://github.com/aws-amplify/amplify-cli/issues/5427)) ([33132f7](https://github.com/aws-amplify/amplify-cli/commit/33132f764b290cafd345720409a5db8ea6088069))
* change depends on logic to separate functions from layers ([#5064](https://github.com/aws-amplify/amplify-cli/issues/5064)) ([3903156](https://github.com/aws-amplify/amplify-cli/commit/3903156a4c6b8e5925c2b3c44769db8d1adc4cea))
* check on  dependsOn Array ([#5446](https://github.com/aws-amplify/amplify-cli/issues/5446)) ([7930961](https://github.com/aws-amplify/amplify-cli/commit/793096192bc8f2d17926f58fcf362d37a2f98668))
* data inconsitency ([#5344](https://github.com/aws-amplify/amplify-cli/issues/5344)) ([bfe1903](https://github.com/aws-amplify/amplify-cli/commit/bfe19038b5b676056f45d7ffcc4c2460057936d8))
* filter init env resources by function category ([#4778](https://github.com/aws-amplify/amplify-cli/issues/4778)) ([ac422fe](https://github.com/aws-amplify/amplify-cli/commit/ac422fe56a76fe0b8513904986303720b834d83d))
* isMockable() handles Lambda functions without dependsOn array ([#4762](https://github.com/aws-amplify/amplify-cli/issues/4762)) ([b4e8a8d](https://github.com/aws-amplify/amplify-cli/commit/b4e8a8d0da0278ce63d180d61b97480bbf57df7f))
* make Hello World the default choice for function templates ([#4466](https://github.com/aws-amplify/amplify-cli/issues/4466)) ([a91d681](https://github.com/aws-amplify/amplify-cli/commit/a91d681149d57e190e62a3d7fd16a75b9f327bca))
* move py test event to src/event.json ([#3851](https://github.com/aws-amplify/amplify-cli/issues/3851)) ([1c4a0cb](https://github.com/aws-amplify/amplify-cli/commit/1c4a0cb5022869fc6aa3c358e9a4c8935fec2b54))
* remove duplicate env vars in top level comment ([#3894](https://github.com/aws-amplify/amplify-cli/issues/3894)) fixes [#3744](https://github.com/aws-amplify/amplify-cli/issues/3744) ([d586863](https://github.com/aws-amplify/amplify-cli/commit/d586863aabcb1ad2fc4d8ee1bd0e693a4d86d0ea))
* remove duplicate permissions from resources in same category ([#4091](https://github.com/aws-amplify/amplify-cli/issues/4091)) ([3f6036b](https://github.com/aws-amplify/amplify-cli/commit/3f6036b6b614a5e7a5f89e3ede289ffafba9fbb3))
* remove env and region from dependsOn, return resource name from addResource, update cypress test ([#4715](https://github.com/aws-amplify/amplify-cli/issues/4715)) ([967a939](https://github.com/aws-amplify/amplify-cli/commit/967a93980fb96fe257cdd24891eb64bc2346dcb0))
* returns resourname instead of function ([#5208](https://github.com/aws-amplify/amplify-cli/issues/5208)) ([44c2d3d](https://github.com/aws-amplify/amplify-cli/commit/44c2d3d35cfdea3a7e206e852d17332d42fd2f0d))
* storage permission resource check - appsync ([#5461](https://github.com/aws-amplify/amplify-cli/issues/5461)) ([126b423](https://github.com/aws-amplify/amplify-cli/commit/126b4235e670bba3ae40f1fcf03d3fa26befef93))
* **amplify-category-api:** fix api add-graphql-datasource command ([#2320](https://github.com/aws-amplify/amplify-cli/issues/2320)) ([a9c829d](https://github.com/aws-amplify/amplify-cli/commit/a9c829d79e91246d2bb9a707ccfe886502ceebe2))
* **amplify-category-api:** plumb api id to resources that require it ([#3464](https://github.com/aws-amplify/amplify-cli/issues/3464)) ([2b2d52f](https://github.com/aws-amplify/amplify-cli/commit/2b2d52f05edc1190953965ca0f3ecd880ec66a63)), closes [#3431](https://github.com/aws-amplify/amplify-cli/issues/3431) [#3386](https://github.com/aws-amplify/amplify-cli/issues/3386)
* **amplify-category-api:** use standard json read ([#2581](https://github.com/aws-amplify/amplify-cli/issues/2581)) ([3adc395](https://github.com/aws-amplify/amplify-cli/commit/3adc395a5e4ccf3673735f8091db63923a46c501))
* **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad863ad4febde47e56209d6026cddb344044))
* **amplify-category-function:** fix function comments ([#5316](https://github.com/aws-amplify/amplify-cli/issues/5316)) ([81d9596](https://github.com/aws-amplify/amplify-cli/commit/81d9596bcc32a3e300fd648f0cf962ceeea3d018)), closes [#4934](https://github.com/aws-amplify/amplify-cli/issues/4934)
* [#223](https://github.com/aws-amplify/amplify-cli/issues/223) - Generate table name instead of resource name in CRUD Lambda ([#2107](https://github.com/aws-amplify/amplify-cli/issues/2107)) ([ad7c257](https://github.com/aws-amplify/amplify-cli/commit/ad7c25798b007954fb6b56c73d24a0fe9f163d6c))
* duplicate dependsOn entries for layers on update function ([#5312](https://github.com/aws-amplify/amplify-cli/issues/5312)) ([d22daaa](https://github.com/aws-amplify/amplify-cli/commit/d22daaa19282ea44caaa4659cd1c2cb57b721c7b))
* remove mutableParametersState from stored function-params ([#4897](https://github.com/aws-amplify/amplify-cli/issues/4897)) ([c608166](https://github.com/aws-amplify/amplify-cli/commit/c6081668798e94165ede40bb06439075946e3e86))
* remove permissions from meta files on func update ([#4287](https://github.com/aws-amplify/amplify-cli/issues/4287)) ([1c89ac9](https://github.com/aws-amplify/amplify-cli/commit/1c89ac9562d60752df109255267059bb9aa7d49b))
* save default editor on add and load on update ([#3841](https://github.com/aws-amplify/amplify-cli/issues/3841)) ([edb94cf](https://github.com/aws-amplify/amplify-cli/commit/edb94cfa2f1a66af0d45afb74f46a3488def9ddd))
* update function not loading previous selections ([#4823](https://github.com/aws-amplify/amplify-cli/issues/4823)) ([fd73e4b](https://github.com/aws-amplify/amplify-cli/commit/fd73e4b54e669526dbba07a331aa4d859cd365e6))
* use _.uniqWith instead of _.uniqBy to remove duplicates ([#5329](https://github.com/aws-amplify/amplify-cli/issues/5329)) ([532f3db](https://github.com/aws-amplify/amplify-cli/commit/532f3db378108091f0735539f824cba5c1dfbd16))
* **amplify-category-function:** removing envVariable for appsync storage ([#5265](https://github.com/aws-amplify/amplify-cli/issues/5265)) ([fe48ab6](https://github.com/aws-amplify/amplify-cli/commit/fe48ab69592a3e0e084d1fb47b30401a886a6453))
* function update no longer removes dependsOn array implicitly ([#4938](https://github.com/aws-amplify/amplify-cli/issues/4938)) ([200bbcb](https://github.com/aws-amplify/amplify-cli/commit/200bbcbda4439a144dc299355ea51c5ffd124594))
* migration issue with layers created before 4.29.0 ([#5256](https://github.com/aws-amplify/amplify-cli/issues/5256)) ([239deaa](https://github.com/aws-amplify/amplify-cli/commit/239deaa8f2074046d671b2192d4bdc4f74b5d2d4))
* **amplify-category-function:** fix ddb table name env var ([#3755](https://github.com/aws-amplify/amplify-cli/issues/3755)) ([9725a38](https://github.com/aws-amplify/amplify-cli/commit/9725a389b5d9c3c0d053a83a304f73b573c4b439)), closes [#3748](https://github.com/aws-amplify/amplify-cli/issues/3748) [#3737](https://github.com/aws-amplify/amplify-cli/issues/3737)
* **amplify-category-function:** fixes update CloudwatchRule in existing functions ([#3920](https://github.com/aws-amplify/amplify-cli/issues/3920)) ([2cafcff](https://github.com/aws-amplify/amplify-cli/commit/2cafcff25938f68365bdfd7ce9d221798e6f9ff8))
* **amplify-category-function:** prevent overwriting of parameters ([#4188](https://github.com/aws-amplify/amplify-cli/issues/4188)) ([7fefd29](https://github.com/aws-amplify/amplify-cli/commit/7fefd2973f5daa807d98caff4f374bf5a6ec3d31)), closes [#4065](https://github.com/aws-amplify/amplify-cli/issues/4065)
* **amplify-category-function:** revert invoke method signature ([#3703](https://github.com/aws-amplify/amplify-cli/issues/3703)) ([8ed6b9b](https://github.com/aws-amplify/amplify-cli/commit/8ed6b9b06c19663dc97cae32452c54937b51933d))
* **amplify-category-function:** updated trigger template path ([#3747](https://github.com/aws-amplify/amplify-cli/issues/3747)) ([f27f65a](https://github.com/aws-amplify/amplify-cli/commit/f27f65ac2deb135a3ec2944dc05a77d179952d47)), closes [#3746](https://github.com/aws-amplify/amplify-cli/issues/3746)
* **amplify-cli:** updating path in trigger indexes for node10 ([c4b1082](https://github.com/aws-amplify/amplify-cli/commit/c4b10820232e614a2951d840a6307031df73aebd)), closes [#3083](https://github.com/aws-amplify/amplify-cli/issues/3083)
* **amplify-function-plugin-interface:** guard against undefined runtime ([#3769](https://github.com/aws-amplify/amplify-cli/issues/3769)) ([3943f9b](https://github.com/aws-amplify/amplify-cli/commit/3943f9b673e2889bdd3985419ead5eeace56fd67))
* **cli:** deleting the amplify app on delete ([#3568](https://github.com/aws-amplify/amplify-cli/issues/3568)) ([f39bbcb](https://github.com/aws-amplify/amplify-cli/commit/f39bbcb715875eeeb612bcbc40b275b33f85eaf6)), closes [#3239](https://github.com/aws-amplify/amplify-cli/issues/3239)
* **cli:** remove unnecessary stack trace log when adding services ([#4610](https://github.com/aws-amplify/amplify-cli/issues/4610)) ([56efb32](https://github.com/aws-amplify/amplify-cli/commit/56efb32b79c47839cb9506a9300d40a01875a9fc))
* [#1978](https://github.com/aws-amplify/amplify-cli/issues/1978), adding update command to function category command list ([#2031](https://github.com/aws-amplify/amplify-cli/issues/2031)) ([8195152](https://github.com/aws-amplify/amplify-cli/commit/819515221314e247cfa2a498d6a90994e93462b6))
* move test package dependencies to devDependencies ([#2034](https://github.com/aws-amplify/amplify-cli/issues/2034)) ([f5623d0](https://github.com/aws-amplify/amplify-cli/commit/f5623d04a43e685901f4f1cd96e2a227164c71ee))


### Features

* added commented out cors headers ([#5315](https://github.com/aws-amplify/amplify-cli/issues/5315)) ([03ec394](https://github.com/aws-amplify/amplify-cli/commit/03ec394af21b0b5683441c14f22b8cdff9e71053))
* feature flag implementation ([#4891](https://github.com/aws-amplify/amplify-cli/issues/4891)) ([6d1c632](https://github.com/aws-amplify/amplify-cli/commit/6d1c632952a49cb56670c11c9cb0c3620d0eb332))
* Lambda layers ([#4697](https://github.com/aws-amplify/amplify-cli/issues/4697)) ([4e97400](https://github.com/aws-amplify/amplify-cli/commit/4e974007d95c894ab4108a2dff8d5996e7e3ce25))
* Multienv support for Lambda layers ([#5081](https://github.com/aws-amplify/amplify-cli/issues/5081)) ([4af1363](https://github.com/aws-amplify/amplify-cli/commit/4af13634bcdd58511712249e6774fc9f287c9ef5))
* **amplify-category-api:** support path parameters in REST APIs ([#3394](https://github.com/aws-amplify/amplify-cli/issues/3394)) ([fa7d07e](https://github.com/aws-amplify/amplify-cli/commit/fa7d07e1f6f54185a37851ea9d4c840b092501cc))
* **amplify-category-function:** Refactor invoke to call runtime plugins ([#3768](https://github.com/aws-amplify/amplify-cli/issues/3768)) ([92293fa](https://github.com/aws-amplify/amplify-cli/commit/92293fa83190bd18aacdc2f46a22938f94b89609))
* **amplify-category-function:** refactor to support build and package interface of runtime plugins ([8c4ec55](https://github.com/aws-amplify/amplify-cli/commit/8c4ec55e46ed8a153eee306c23f9665d58d3c5f4))
* **amplify-category-function:** refactor to support runtime and template plugins ([#3517](https://github.com/aws-amplify/amplify-cli/issues/3517)) ([607ae21](https://github.com/aws-amplify/amplify-cli/commit/607ae21287941805f44ea8a9b78dd12d16d71f85))
* **amplify-category-function:** Support Lambda Scheduling  ([#3714](https://github.com/aws-amplify/amplify-cli/issues/3714)) ([4a488ed](https://github.com/aws-amplify/amplify-cli/commit/4a488edef14d9161600cf6ce6887baa3c04ebef5))
* **amplify-category-function:** support list in plugin runtime condition ([#3757](https://github.com/aws-amplify/amplify-cli/issues/3757)) ([b36c09d](https://github.com/aws-amplify/amplify-cli/commit/b36c09d6ef21c40999d1f5930aabece0a4315d21))
* **amplify-dotnet-function-runtime-provider:** added dotnet CRUD ([#3931](https://github.com/aws-amplify/amplify-cli/issues/3931)) ([f589366](https://github.com/aws-amplify/amplify-cli/commit/f5893668ddadfc5b72a250502be78356ad65f7f9))
* **amplify-function-plugin-interface:** update contribute params ([#3711](https://github.com/aws-amplify/amplify-cli/issues/3711)) ([3a38f9e](https://github.com/aws-amplify/amplify-cli/commit/3a38f9ee021f51f48b4e978f0ed96d4cbfb1ff96))
* **amplify-python-runtime-provider:** implement python runtime provider ([#3787](https://github.com/aws-amplify/amplify-cli/issues/3787)) ([8996cb1](https://github.com/aws-amplify/amplify-cli/commit/8996cb11015873f1236340680694188fd17c0f2e))
* **cli:** usage measurement ([#3641](https://github.com/aws-amplify/amplify-cli/issues/3641)) ([a755863](https://github.com/aws-amplify/amplify-cli/commit/a7558637fbb791dc22e0a91ae16f1b96fe4e99df))
* ability to add custom EventSource and lambda triggers via amplify add function, kinesis support in analytics category ([#2463](https://github.com/aws-amplify/amplify-cli/issues/2463)) ([b25cfd0](https://github.com/aws-amplify/amplify-cli/commit/b25cfd00b21416a82ecefda1f6498206ef71531b))
* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c1927da10f8c54f38a523021187361131c))
* arrow function support in hello world lambda template ([#2802](https://github.com/aws-amplify/amplify-cli/issues/2802)) ([29c2ca1](https://github.com/aws-amplify/amplify-cli/commit/29c2ca18a58ce56cb2c17b8498af366fe1bbd34f))
* minor tweaks to multi-runtime platform ([#3804](https://github.com/aws-amplify/amplify-cli/issues/3804)) ([60d68d7](https://github.com/aws-amplify/amplify-cli/commit/60d68d7e1a6e8c00cd629a38e9aefb2396a59737))
* select node runtime by default ([#3852](https://github.com/aws-amplify/amplify-cli/issues/3852)) ([aa712bd](https://github.com/aws-amplify/amplify-cli/commit/aa712bd26f7e02477d95d04e639c7234feba9715))
* **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
* **cli:** new plugin platform ([#2254](https://github.com/aws-amplify/amplify-cli/issues/2254)) ([7ec29dd](https://github.com/aws-amplify/amplify-cli/commit/7ec29dd4f2da8c90727b36469eca646d289877b6))
* mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e5346ee1f27a2e9bee25fbbdcb19417f5230f))


### Reverts

* Revert problematic PRs (#4803) ([f21a0f4](https://github.com/aws-amplify/amplify-cli/commit/f21a0f449a23c0c80a6f3280eef76bcbf3e9cb7c)), closes [#4803](https://github.com/aws-amplify/amplify-cli/issues/4803) [#4796](https://github.com/aws-amplify/amplify-cli/issues/4796) [#4576](https://github.com/aws-amplify/amplify-cli/issues/4576) [#4575](https://github.com/aws-amplify/amplify-cli/issues/4575) [#4610](https://github.com/aws-amplify/amplify-cli/issues/4610)





## [2.25.11](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.25.8...amplify-category-function@2.25.11) (2020-11-20)

**Note:** Version bump only for package amplify-category-function





## [2.25.10](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.25.8...amplify-category-function@2.25.10) (2020-11-20)

**Note:** Version bump only for package amplify-category-function





## [2.25.9](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.25.8...amplify-category-function@2.25.9) (2020-11-19)

**Note:** Version bump only for package amplify-category-function





## [2.25.8](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.25.7...amplify-category-function@2.25.8) (2020-11-08)

**Note:** Version bump only for package amplify-category-function





## [2.25.7](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.25.6...amplify-category-function@2.25.7) (2020-10-30)

**Note:** Version bump only for package amplify-category-function





## [2.25.6](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.25.5...amplify-category-function@2.25.6) (2020-10-27)

**Note:** Version bump only for package amplify-category-function





## [2.25.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.25.4...amplify-category-function@2.25.5) (2020-10-22)


### Bug Fixes

* refactor mobile hub migration checks ([#5632](https://github.com/aws-amplify/amplify-cli/issues/5632)) ([b796eb8](https://github.com/aws-amplify/amplify-cli/commit/b796eb8303bb903f5f531506254441a63eba2962))





## [2.25.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.25.3...amplify-category-function@2.25.4) (2020-10-17)

**Note:** Version bump only for package amplify-category-function





## [2.25.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.25.2...amplify-category-function@2.25.3) (2020-10-07)


### Bug Fixes

* **amplify-category-function:** fix update permission bug ([#5421](https://github.com/aws-amplify/amplify-cli/issues/5421)) ([f1194fd](https://github.com/aws-amplify/amplify-cli/commit/f1194fdd0aacbd2c316545422ad5e659d7042118)), closes [#5333](https://github.com/aws-amplify/amplify-cli/issues/5333)





## [2.25.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.25.1...amplify-category-function@2.25.2) (2020-10-01)


### Bug Fixes

* add support for mobile hub migrated resources ([#5407](https://github.com/aws-amplify/amplify-cli/issues/5407)) ([5dfe287](https://github.com/aws-amplify/amplify-cli/commit/5dfe2872c153047ebdc56bc4f671fd57c12379d9))
* added exit code on remove ([#5427](https://github.com/aws-amplify/amplify-cli/issues/5427)) ([33132f7](https://github.com/aws-amplify/amplify-cli/commit/33132f764b290cafd345720409a5db8ea6088069))
* check on  dependsOn Array ([#5446](https://github.com/aws-amplify/amplify-cli/issues/5446)) ([7930961](https://github.com/aws-amplify/amplify-cli/commit/793096192bc8f2d17926f58fcf362d37a2f98668))
* storage permission resource check - appsync ([#5461](https://github.com/aws-amplify/amplify-cli/issues/5461)) ([126b423](https://github.com/aws-amplify/amplify-cli/commit/126b4235e670bba3ae40f1fcf03d3fa26befef93))





## [2.25.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.25.0...amplify-category-function@2.25.1) (2020-09-25)


### Bug Fixes

* data inconsitency ([#5344](https://github.com/aws-amplify/amplify-cli/issues/5344)) ([bfe1903](https://github.com/aws-amplify/amplify-cli/commit/bfe19038b5b676056f45d7ffcc4c2460057936d8))





# [2.25.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.24.1...amplify-category-function@2.25.0) (2020-09-16)


### Bug Fixes

* duplicate dependsOn entries for layers on update function ([#5312](https://github.com/aws-amplify/amplify-cli/issues/5312)) ([d22daaa](https://github.com/aws-amplify/amplify-cli/commit/d22daaa19282ea44caaa4659cd1c2cb57b721c7b))
* use _.uniqWith instead of _.uniqBy to remove duplicates ([#5329](https://github.com/aws-amplify/amplify-cli/issues/5329)) ([532f3db](https://github.com/aws-amplify/amplify-cli/commit/532f3db378108091f0735539f824cba5c1dfbd16))
* **amplify-category-function:** fix function comments ([#5316](https://github.com/aws-amplify/amplify-cli/issues/5316)) ([81d9596](https://github.com/aws-amplify/amplify-cli/commit/81d9596bcc32a3e300fd648f0cf962ceeea3d018)), closes [#4934](https://github.com/aws-amplify/amplify-cli/issues/4934)
* **amplify-category-function:** removing envVariable for appsync storage ([#5265](https://github.com/aws-amplify/amplify-cli/issues/5265)) ([fe48ab6](https://github.com/aws-amplify/amplify-cli/commit/fe48ab69592a3e0e084d1fb47b30401a886a6453))


### Features

* added commented out cors headers ([#5315](https://github.com/aws-amplify/amplify-cli/issues/5315)) ([03ec394](https://github.com/aws-amplify/amplify-cli/commit/03ec394af21b0b5683441c14f22b8cdff9e71053))





## [2.24.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.24.0...amplify-category-function@2.24.1) (2020-09-09)


### Bug Fixes

* migration issue with layers created before 4.29.0 ([#5256](https://github.com/aws-amplify/amplify-cli/issues/5256)) ([239deaa](https://github.com/aws-amplify/amplify-cli/commit/239deaa8f2074046d671b2192d4bdc4f74b5d2d4))





# [2.24.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.23.5...amplify-category-function@2.24.0) (2020-09-03)


### Features

* Multienv support for Lambda layers ([#5081](https://github.com/aws-amplify/amplify-cli/issues/5081)) ([4af1363](https://github.com/aws-amplify/amplify-cli/commit/4af13634bcdd58511712249e6774fc9f287c9ef5))





## [2.23.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.23.4...amplify-category-function@2.23.5) (2020-09-03)


### Bug Fixes

* returns resourname instead of function ([#5208](https://github.com/aws-amplify/amplify-cli/issues/5208)) ([44c2d3d](https://github.com/aws-amplify/amplify-cli/commit/44c2d3d35cfdea3a7e206e852d17332d42fd2f0d))





## [2.23.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.23.3...amplify-category-function@2.23.4) (2020-08-31)

**Note:** Version bump only for package amplify-category-function





## [2.23.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.23.2...amplify-category-function@2.23.3) (2020-08-20)

**Note:** Version bump only for package amplify-category-function





## [2.23.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.23.1...amplify-category-function@2.23.2) (2020-08-14)


### Bug Fixes

* Added check to stop prompts for cognito triggers while using env commands ([#5039](https://github.com/aws-amplify/amplify-cli/issues/5039)) ([744dbc4](https://github.com/aws-amplify/amplify-cli/commit/744dbc42e847e273160caf3672365391f055191b))
* change depends on logic to separate functions from layers ([#5064](https://github.com/aws-amplify/amplify-cli/issues/5064)) ([3903156](https://github.com/aws-amplify/amplify-cli/commit/3903156a4c6b8e5925c2b3c44769db8d1adc4cea))





## [2.23.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.23.0...amplify-category-function@2.23.1) (2020-08-11)

**Note:** Version bump only for package amplify-category-function





# [2.23.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.21.5...amplify-category-function@2.23.0) (2020-07-29)


### Bug Fixes

* /opt folder should be packaged at the root of the zipped dir ([#4835](https://github.com/aws-amplify/amplify-cli/issues/4835)) ([ec8199c](https://github.com/aws-amplify/amplify-cli/commit/ec8199c5ae8d4eda504d5bad2b30567a5e2b4810))
* function update no longer removes dependsOn array implicitly ([#4938](https://github.com/aws-amplify/amplify-cli/issues/4938)) ([200bbcb](https://github.com/aws-amplify/amplify-cli/commit/200bbcbda4439a144dc299355ea51c5ffd124594))
* remove mutableParametersState from stored function-params ([#4897](https://github.com/aws-amplify/amplify-cli/issues/4897)) ([c608166](https://github.com/aws-amplify/amplify-cli/commit/c6081668798e94165ede40bb06439075946e3e86))


### Features

* feature flag implementation ([#4891](https://github.com/aws-amplify/amplify-cli/issues/4891)) ([6d1c632](https://github.com/aws-amplify/amplify-cli/commit/6d1c632952a49cb56670c11c9cb0c3620d0eb332))





# [2.22.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.21.5...amplify-category-function@2.22.0) (2020-07-23)


### Bug Fixes

* /opt folder should be packaged at the root of the zipped dir ([#4835](https://github.com/aws-amplify/amplify-cli/issues/4835)) ([f4abd69](https://github.com/aws-amplify/amplify-cli/commit/f4abd6918826bf565f157641593fb1d751877713))
* remove mutableParametersState from stored function-params ([#4897](https://github.com/aws-amplify/amplify-cli/issues/4897)) ([6e379fa](https://github.com/aws-amplify/amplify-cli/commit/6e379fabd9f5ea2316ce91f03c3e7cb3aa39fe08))


### Features

* feature flag implementation ([#4891](https://github.com/aws-amplify/amplify-cli/issues/4891)) ([4639450](https://github.com/aws-amplify/amplify-cli/commit/463945029cfe861f74986d9a8b9af6b827d2063d))





## [2.21.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.21.4...amplify-category-function@2.21.5) (2020-07-18)

**Note:** Version bump only for package amplify-category-function





## [2.21.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.21.3...amplify-category-function@2.21.4) (2020-07-15)

**Note:** Version bump only for package amplify-category-function





## [2.21.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.21.2...amplify-category-function@2.21.3) (2020-07-14)


### Bug Fixes

* update function not loading previous selections ([#4823](https://github.com/aws-amplify/amplify-cli/issues/4823)) ([20a8dec](https://github.com/aws-amplify/amplify-cli/commit/20a8dec9b4c51239760846ec94a71dc528009498))





## [2.21.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.21.1...amplify-category-function@2.21.2) (2020-07-11)


### Bug Fixes

* **cli:** remove unnecessary stack trace log when adding services ([#4610](https://github.com/aws-amplify/amplify-cli/issues/4610)) ([5bee574](https://github.com/aws-amplify/amplify-cli/commit/5bee574bbcd956c032e7714b0813aedd7914a6cb))


### Reverts

* Revert problematic PRs (#4803) ([7f38d81](https://github.com/aws-amplify/amplify-cli/commit/7f38d81ef2f890c25d39b02407c5255c8760c511)), closes [#4803](https://github.com/aws-amplify/amplify-cli/issues/4803) [#4796](https://github.com/aws-amplify/amplify-cli/issues/4796) [#4576](https://github.com/aws-amplify/amplify-cli/issues/4576) [#4575](https://github.com/aws-amplify/amplify-cli/issues/4575) [#4610](https://github.com/aws-amplify/amplify-cli/issues/4610)





## [2.21.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.21.0...amplify-category-function@2.21.1) (2020-07-09)


### Bug Fixes

* filter init env resources by function category ([#4778](https://github.com/aws-amplify/amplify-cli/issues/4778)) ([c11c6bc](https://github.com/aws-amplify/amplify-cli/commit/c11c6bcfe9f2f769b7650bc45b369c9889d8040d))
* isMockable() handles Lambda functions without dependsOn array ([#4762](https://github.com/aws-amplify/amplify-cli/issues/4762)) ([9b9bf31](https://github.com/aws-amplify/amplify-cli/commit/9b9bf316ae2ebcec651ca3c62f848cb0e409392b))





# [2.21.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.20.8...amplify-category-function@2.21.0) (2020-07-07)


### Bug Fixes

* remove env and region from dependsOn, return resource name from addResource, update cypress test ([#4715](https://github.com/aws-amplify/amplify-cli/issues/4715)) ([c4ce4fa](https://github.com/aws-amplify/amplify-cli/commit/c4ce4fadd257a69d3cd4f1628d2b1496a918e72e))


### Features

* **cli:** usage measurement ([#3641](https://github.com/aws-amplify/amplify-cli/issues/3641)) ([30a7fe7](https://github.com/aws-amplify/amplify-cli/commit/30a7fe70f5838a766631befcc720a721e801bc5f))
* Lambda layers ([#4697](https://github.com/aws-amplify/amplify-cli/issues/4697)) ([c55b2e0](https://github.com/aws-amplify/amplify-cli/commit/c55b2e0c3377127aaf887591d7bc20d7240ef11d))





## [2.20.8](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.20.7...amplify-category-function@2.20.8) (2020-06-25)

**Note:** Version bump only for package amplify-category-function





## [2.20.7](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.20.6...amplify-category-function@2.20.7) (2020-06-18)

**Note:** Version bump only for package amplify-category-function





## [2.20.6](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.20.5...amplify-category-function@2.20.6) (2020-06-11)

**Note:** Version bump only for package amplify-category-function





## [2.20.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.20.4...amplify-category-function@2.20.5) (2020-06-10)


### Bug Fixes

* make Hello World the default choice for function templates ([#4466](https://github.com/aws-amplify/amplify-cli/issues/4466)) ([1c60b2b](https://github.com/aws-amplify/amplify-cli/commit/1c60b2ba617ccba625c1a6cf56840a9eedad4fb5))





## [2.20.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.20.3...amplify-category-function@2.20.4) (2020-06-02)


### Bug Fixes

* remove permissions from meta files on func update ([#4287](https://github.com/aws-amplify/amplify-cli/issues/4287)) ([129ec94](https://github.com/aws-amplify/amplify-cli/commit/129ec941df39eb5aa600a89de195fe3eeef13c4f))





## [2.20.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.20.2...amplify-category-function@2.20.3) (2020-05-26)

**Note:** Version bump only for package amplify-category-function





## [2.20.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.20.1...amplify-category-function@2.20.2) (2020-05-15)


### Bug Fixes

* **amplify-category-function:** prevent overwriting of parameters ([#4188](https://github.com/aws-amplify/amplify-cli/issues/4188)) ([7fefd29](https://github.com/aws-amplify/amplify-cli/commit/7fefd2973f5daa807d98caff4f374bf5a6ec3d31)), closes [#4065](https://github.com/aws-amplify/amplify-cli/issues/4065)





## [2.20.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.20.0...amplify-category-function@2.20.1) (2020-05-08)


### Bug Fixes

* **amplify-category-function:** fixes update CloudwatchRule in existing functions ([#3920](https://github.com/aws-amplify/amplify-cli/issues/3920)) ([2cafcff](https://github.com/aws-amplify/amplify-cli/commit/2cafcff25938f68365bdfd7ce9d221798e6f9ff8))
* remove duplicate permissions from resources in same category ([#4091](https://github.com/aws-amplify/amplify-cli/issues/4091)) ([3f6036b](https://github.com/aws-amplify/amplify-cli/commit/3f6036b6b614a5e7a5f89e3ede289ffafba9fbb3))





# [2.20.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.19.0...amplify-category-function@2.20.0) (2020-04-23)


### Bug Fixes

* remove duplicate env vars in top level comment ([#3894](https://github.com/aws-amplify/amplify-cli/issues/3894)) fixes [#3744](https://github.com/aws-amplify/amplify-cli/issues/3744) ([d586863](https://github.com/aws-amplify/amplify-cli/commit/d586863aabcb1ad2fc4d8ee1bd0e693a4d86d0ea))


### Features

* **amplify-dotnet-function-runtime-provider:** added dotnet CRUD ([#3931](https://github.com/aws-amplify/amplify-cli/issues/3931)) ([f589366](https://github.com/aws-amplify/amplify-cli/commit/f5893668ddadfc5b72a250502be78356ad65f7f9))





# [2.19.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.18.0...amplify-category-function@2.19.0) (2020-04-06)


### Bug Fixes

* move py test event to src/event.json ([#3851](https://github.com/aws-amplify/amplify-cli/issues/3851)) ([1c4a0cb](https://github.com/aws-amplify/amplify-cli/commit/1c4a0cb5022869fc6aa3c358e9a4c8935fec2b54))
* save default editor on add and load on update ([#3841](https://github.com/aws-amplify/amplify-cli/issues/3841)) ([edb94cf](https://github.com/aws-amplify/amplify-cli/commit/edb94cfa2f1a66af0d45afb74f46a3488def9ddd))


### Features

* **amplify-category-function:** Refactor invoke to call runtime plugins ([#3768](https://github.com/aws-amplify/amplify-cli/issues/3768)) ([92293fa](https://github.com/aws-amplify/amplify-cli/commit/92293fa83190bd18aacdc2f46a22938f94b89609))
* minor tweaks to multi-runtime platform ([#3804](https://github.com/aws-amplify/amplify-cli/issues/3804)) ([60d68d7](https://github.com/aws-amplify/amplify-cli/commit/60d68d7e1a6e8c00cd629a38e9aefb2396a59737))
* **amplify-category-function:** Support Lambda Scheduling  ([#3714](https://github.com/aws-amplify/amplify-cli/issues/3714)) ([4a488ed](https://github.com/aws-amplify/amplify-cli/commit/4a488edef14d9161600cf6ce6887baa3c04ebef5))
* **amplify-python-runtime-provider:** implement python runtime provider ([#3787](https://github.com/aws-amplify/amplify-cli/issues/3787)) ([8996cb1](https://github.com/aws-amplify/amplify-cli/commit/8996cb11015873f1236340680694188fd17c0f2e))
* select node runtime by default ([#3852](https://github.com/aws-amplify/amplify-cli/issues/3852)) ([aa712bd](https://github.com/aws-amplify/amplify-cli/commit/aa712bd26f7e02477d95d04e639c7234feba9715))





# [2.18.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.17.0...amplify-category-function@2.18.0) (2020-03-26)


### Bug Fixes

* **amplify-category-function:** fix ddb table name env var ([#3755](https://github.com/aws-amplify/amplify-cli/issues/3755)) ([9725a38](https://github.com/aws-amplify/amplify-cli/commit/9725a389b5d9c3c0d053a83a304f73b573c4b439)), closes [#3748](https://github.com/aws-amplify/amplify-cli/issues/3748) [#3737](https://github.com/aws-amplify/amplify-cli/issues/3737)
* **amplify-category-function:** updated trigger template path ([#3747](https://github.com/aws-amplify/amplify-cli/issues/3747)) ([f27f65a](https://github.com/aws-amplify/amplify-cli/commit/f27f65ac2deb135a3ec2944dc05a77d179952d47)), closes [#3746](https://github.com/aws-amplify/amplify-cli/issues/3746)
* **amplify-function-plugin-interface:** guard against undefined runtime ([#3769](https://github.com/aws-amplify/amplify-cli/issues/3769)) ([3943f9b](https://github.com/aws-amplify/amplify-cli/commit/3943f9b673e2889bdd3985419ead5eeace56fd67))


### Features

* **amplify-category-function:** support list in plugin runtime condition ([#3757](https://github.com/aws-amplify/amplify-cli/issues/3757)) ([b36c09d](https://github.com/aws-amplify/amplify-cli/commit/b36c09d6ef21c40999d1f5930aabece0a4315d21))





# [2.17.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.16.1...amplify-category-function@2.17.0) (2020-03-22)


### Bug Fixes

* **amplify-category-function:** revert invoke method signature ([#3703](https://github.com/aws-amplify/amplify-cli/issues/3703)) ([8ed6b9b](https://github.com/aws-amplify/amplify-cli/commit/8ed6b9b06c19663dc97cae32452c54937b51933d))
* **cli:** deleting the amplify app on delete ([#3568](https://github.com/aws-amplify/amplify-cli/issues/3568)) ([f39bbcb](https://github.com/aws-amplify/amplify-cli/commit/f39bbcb715875eeeb612bcbc40b275b33f85eaf6)), closes [#3239](https://github.com/aws-amplify/amplify-cli/issues/3239)


### Features

* **amplify-category-function:** refactor to support build and package interface of runtime plugins ([8c4ec55](https://github.com/aws-amplify/amplify-cli/commit/8c4ec55e46ed8a153eee306c23f9665d58d3c5f4))
* **amplify-category-function:** refactor to support runtime and template plugins ([#3517](https://github.com/aws-amplify/amplify-cli/issues/3517)) ([607ae21](https://github.com/aws-amplify/amplify-cli/commit/607ae21287941805f44ea8a9b78dd12d16d71f85))
* **amplify-function-plugin-interface:** update contribute params ([#3711](https://github.com/aws-amplify/amplify-cli/issues/3711)) ([3a38f9e](https://github.com/aws-amplify/amplify-cli/commit/3a38f9ee021f51f48b4e978f0ed96d4cbfb1ff96))





## [2.16.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.16.0...amplify-category-function@2.16.1) (2020-03-10)

**Note:** Version bump only for package amplify-category-function





# [2.16.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.13.3...amplify-category-function@2.16.0) (2020-03-07)


### Bug Fixes

* **amplify-category-api:** plumb api id to resources that require it ([#3464](https://github.com/aws-amplify/amplify-cli/issues/3464)) ([2b2d52f](https://github.com/aws-amplify/amplify-cli/commit/2b2d52f05edc1190953965ca0f3ecd880ec66a63)), closes [#3431](https://github.com/aws-amplify/amplify-cli/issues/3431) [#3386](https://github.com/aws-amplify/amplify-cli/issues/3386)


### Features

* **amplify-category-api:** support path parameters in REST APIs ([#3394](https://github.com/aws-amplify/amplify-cli/issues/3394)) ([fa7d07e](https://github.com/aws-amplify/amplify-cli/commit/fa7d07e1f6f54185a37851ea9d4c840b092501cc))
* ability to add custom EventSource and lambda triggers via amplify add function, kinesis support in analytics category ([#2463](https://github.com/aws-amplify/amplify-cli/issues/2463)) ([b25cfd0](https://github.com/aws-amplify/amplify-cli/commit/b25cfd00b21416a82ecefda1f6498206ef71531b))





## [2.14.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.13.5-beta.0...amplify-category-function@2.14.1) (2020-03-05)

**Note:** Version bump only for package amplify-category-function





## [2.13.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.13.2...amplify-category-function@2.13.3) (2020-02-13)

**Note:** Version bump only for package amplify-category-function





## [2.13.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.13.1...amplify-category-function@2.13.2) (2020-02-07)

**Note:** Version bump only for package amplify-category-function





## [2.13.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@2.13.0...amplify-category-function@2.13.1) (2020-01-24)

**Note:** Version bump only for package amplify-category-function





# [2.13.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.30.0...amplify-category-function@2.13.0) (2020-01-23)

### Bug Fixes

- **amplify-cli:** updating path in trigger indexes for node10 ([c4b1082](https://github.com/aws-amplify/amplify-cli/commit/c4b10820232e614a2951d840a6307031df73aebd)), closes [#3083](https://github.com/aws-amplify/amplify-cli/issues/3083)

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- arrow function support in hello world lambda template ([#2802](https://github.com/aws-amplify/amplify-cli/issues/2802)) ([29c2ca1](https://github.com/aws-amplify/amplify-cli/commit/29c2ca18a58ce56cb2c17b8498af366fe1bbd34f))

# [2.12.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.30.0...amplify-category-function@2.12.0) (2020-01-09)

### Bug Fixes

- **amplify-cli:** updating path in trigger indexes for node10 ([c4b1082](https://github.com/aws-amplify/amplify-cli/commit/c4b10820232e614a2951d840a6307031df73aebd)), closes [#3083](https://github.com/aws-amplify/amplify-cli/issues/3083)

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- arrow function support in hello world lambda template ([#2802](https://github.com/aws-amplify/amplify-cli/issues/2802)) ([29c2ca1](https://github.com/aws-amplify/amplify-cli/commit/29c2ca18a58ce56cb2c17b8498af366fe1bbd34f))

# [2.11.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.30.0...amplify-category-function@2.11.0) (2019-12-31)

### Bug Fixes

- **amplify-cli:** updating path in trigger indexes for node10 ([c4b1082](https://github.com/aws-amplify/amplify-cli/commit/c4b10820232e614a2951d840a6307031df73aebd)), closes [#3083](https://github.com/aws-amplify/amplify-cli/issues/3083)

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- arrow function support in hello world lambda template ([#2802](https://github.com/aws-amplify/amplify-cli/issues/2802)) ([29c2ca1](https://github.com/aws-amplify/amplify-cli/commit/29c2ca18a58ce56cb2c17b8498af366fe1bbd34f))

# [2.10.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.30.0...amplify-category-function@2.10.0) (2019-12-28)

### Bug Fixes

- **amplify-cli:** updating path in trigger indexes for node10 ([c4b1082](https://github.com/aws-amplify/amplify-cli/commit/c4b10820232e614a2951d840a6307031df73aebd)), closes [#3083](https://github.com/aws-amplify/amplify-cli/issues/3083)

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- arrow function support in hello world lambda template ([#2802](https://github.com/aws-amplify/amplify-cli/issues/2802)) ([29c2ca1](https://github.com/aws-amplify/amplify-cli/commit/29c2ca18a58ce56cb2c17b8498af366fe1bbd34f))

# [2.9.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.30.0...amplify-category-function@2.9.0) (2019-12-26)

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- arrow function support in hello world lambda template ([#2802](https://github.com/aws-amplify/amplify-cli/issues/2802)) ([29c2ca1](https://github.com/aws-amplify/amplify-cli/commit/29c2ca18a58ce56cb2c17b8498af366fe1bbd34f))

# [2.8.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.30.0...amplify-category-function@2.8.0) (2019-12-25)

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- arrow function support in hello world lambda template ([#2802](https://github.com/aws-amplify/amplify-cli/issues/2802)) ([29c2ca1](https://github.com/aws-amplify/amplify-cli/commit/29c2ca18a58ce56cb2c17b8498af366fe1bbd34f))

# [2.7.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.30.0...amplify-category-function@2.7.0) (2019-12-20)

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- arrow function support in hello world lambda template ([#2802](https://github.com/aws-amplify/amplify-cli/issues/2802)) ([29c2ca1](https://github.com/aws-amplify/amplify-cli/commit/29c2ca18a58ce56cb2c17b8498af366fe1bbd34f))

# [2.6.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.30.0...amplify-category-function@2.6.0) (2019-12-10)

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.4.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.30.0...amplify-category-function@2.4.0) (2019-12-03)

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.3.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.30.0...amplify-category-function@2.3.0) (2019-12-01)

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.2.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.30.0...amplify-category-function@2.2.0) (2019-11-27)

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.1.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.30.0...amplify-category-function@2.1.0) (2019-11-27)

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [1.13.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.7.3...amplify-category-function@1.13.0) (2019-08-30)

### Bug Fixes

- **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad8))
- [#1978](https://github.com/aws-amplify/amplify-cli/issues/1978), adding update command to function category command list ([#2031](https://github.com/aws-amplify/amplify-cli/issues/2031)) ([8195152](https://github.com/aws-amplify/amplify-cli/commit/8195152))
- [#223](https://github.com/aws-amplify/amplify-cli/issues/223) - Generate table name instead of resource name in CRUD Lambda ([#2107](https://github.com/aws-amplify/amplify-cli/issues/2107)) ([ad7c257](https://github.com/aws-amplify/amplify-cli/commit/ad7c257))
- move test package dependencies to devDependencies ([#2034](https://github.com/aws-amplify/amplify-cli/issues/2034)) ([f5623d0](https://github.com/aws-amplify/amplify-cli/commit/f5623d0))

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))

# [1.12.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.7.3...amplify-category-function@1.12.0) (2019-08-28)

### Bug Fixes

- **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad8))
- [#1978](https://github.com/aws-amplify/amplify-cli/issues/1978), adding update command to function category command list ([#2031](https://github.com/aws-amplify/amplify-cli/issues/2031)) ([8195152](https://github.com/aws-amplify/amplify-cli/commit/8195152))
- [#223](https://github.com/aws-amplify/amplify-cli/issues/223) - Generate table name instead of resource name in CRUD Lambda ([#2107](https://github.com/aws-amplify/amplify-cli/issues/2107)) ([ad7c257](https://github.com/aws-amplify/amplify-cli/commit/ad7c257))
- move test package dependencies to devDependencies ([#2034](https://github.com/aws-amplify/amplify-cli/issues/2034)) ([f5623d0](https://github.com/aws-amplify/amplify-cli/commit/f5623d0))

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))

# [1.11.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.7.3...amplify-category-function@1.11.0) (2019-08-13)

### Bug Fixes

- **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad8))

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))

# [1.10.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.7.3...amplify-category-function@1.10.0) (2019-08-07)

### Bug Fixes

- **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad8))

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))

# [1.9.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.7.3...amplify-category-function@1.9.0) (2019-08-02)

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))

# [1.8.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.7.3...amplify-category-function@1.8.0) (2019-07-31)

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))

## [1.7.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.7.1...amplify-category-function@1.7.3) (2019-07-23)

### Bug Fixes

- **amplify-category-function:** fixing headless params ([#1828](https://github.com/aws-amplify/amplify-cli/issues/1828)) ([816e526](https://github.com/aws-amplify/amplify-cli/commit/816e526)), closes [#1826](https://github.com/aws-amplify/amplify-cli/issues/1826) [#1826](https://github.com/aws-amplify/amplify-cli/issues/1826)
- remove grunt-lambda dependency for local function testing ([#1872](https://github.com/aws-amplify/amplify-cli/issues/1872)) ([bbe55bf](https://github.com/aws-amplify/amplify-cli/commit/bbe55bf))

## [1.7.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.7.0...amplify-category-function@1.7.1) (2019-07-10)

### Bug Fixes

- check that function-parameters.json exists before trying to read it ([#1808](https://github.com/aws-amplify/amplify-cli/issues/1808)) ([574218d](https://github.com/aws-amplify/amplify-cli/commit/574218d))

# [1.7.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.6.0...amplify-category-function@1.7.0) (2019-07-09)

### Bug Fixes

- **amplify-category-function:** open Editor fix for displayname ([#1798](https://github.com/aws-amplify/amplify-cli/issues/1798)) ([e62aba6](https://github.com/aws-amplify/amplify-cli/commit/e62aba6))

### Features

- cognito + s3 + dyanmodb lambda trigger support ([#1783](https://github.com/aws-amplify/amplify-cli/issues/1783)) ([c6fc838](https://github.com/aws-amplify/amplify-cli/commit/c6fc838))

# [1.6.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.5.4...amplify-category-function@1.6.0) (2019-06-26)

### Bug Fixes

- **amplify-category-function:** add policy for GSI ([#1618](https://github.com/aws-amplify/amplify-cli/issues/1618)) ([cc2f1b6](https://github.com/aws-amplify/amplify-cli/commit/cc2f1b6)), closes [#791](https://github.com/aws-amplify/amplify-cli/issues/791)

### Features

- **amplify-category-function:** provide evntName arg to lambda_invoke ([#1624](https://github.com/aws-amplify/amplify-cli/issues/1624)) ([a61237f](https://github.com/aws-amplify/amplify-cli/commit/a61237f))

## [1.5.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.5.3...amplify-category-function@1.5.4) (2019-06-20)

### Bug Fixes

- **cli:** fix inquirer version ([#1690](https://github.com/aws-amplify/amplify-cli/issues/1690)) ([9246032](https://github.com/aws-amplify/amplify-cli/commit/9246032)), closes [#1688](https://github.com/aws-amplify/amplify-cli/issues/1688)

## [1.5.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.5.2...amplify-category-function@1.5.3) (2019-06-18)

### Bug Fixes

- **amplify-category-function:** fixed openEditor ([#1664](https://github.com/aws-amplify/amplify-cli/issues/1664)) ([0b9cf28](https://github.com/aws-amplify/amplify-cli/commit/0b9cf28))

## [1.5.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.5.1...amplify-category-function@1.5.2) (2019-06-11)

**Note:** Version bump only for package amplify-category-function

## [1.5.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.5.0...amplify-category-function@1.5.1) (2019-06-06)

### Bug Fixes

- fixing auth update flow ([#1579](https://github.com/aws-amplify/amplify-cli/issues/1579)) ([65783b5](https://github.com/aws-amplify/amplify-cli/commit/65783b5))
- fixing ref name values in function cfn templates ([#1605](https://github.com/aws-amplify/amplify-cli/issues/1605)) ([3bda285](https://github.com/aws-amplify/amplify-cli/commit/3bda285)), closes [#1574](https://github.com/aws-amplify/amplify-cli/issues/1574)

# [1.5.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.4.6...amplify-category-function@1.5.0) (2019-05-29)

### Bug Fixes

- stringify region in function Cloudformation file ([#1536](https://github.com/aws-amplify/amplify-cli/issues/1536)) ([cb6f438](https://github.com/aws-amplify/amplify-cli/commit/cb6f438))

### Features

- flow to add policies to access amplify resources from Lambda ([#1462](https://github.com/aws-amplify/amplify-cli/issues/1462)) ([fee247c](https://github.com/aws-amplify/amplify-cli/commit/fee247c))

## [1.4.6](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.4.5...amplify-category-function@1.4.6) (2019-05-21)

**Note:** Version bump only for package amplify-category-function

## [1.4.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.4.4...amplify-category-function@1.4.5) (2019-05-17)

**Note:** Version bump only for package amplify-category-function

## [1.4.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.4.3...amplify-category-function@1.4.4) (2019-04-30)

### Bug Fixes

- update CLI to handle UTF8 BOM ([#1357](https://github.com/aws-amplify/amplify-cli/issues/1357)) ([b0afa07](https://github.com/aws-amplify/amplify-cli/commit/b0afa07)), closes [#1355](https://github.com/aws-amplify/amplify-cli/issues/1355) [#1122](https://github.com/aws-amplify/amplify-cli/issues/1122)

## [1.4.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.4.2...amplify-category-function@1.4.3) (2019-04-25)

**Note:** Version bump only for package amplify-category-function

## [1.4.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.4.1...amplify-category-function@1.4.2) (2019-04-16)

### Bug Fixes

- **amplify-category-function:** add error status code ([a3aaaad](https://github.com/aws-amplify/amplify-cli/commit/a3aaaad)), closes [#1003](https://github.com/aws-amplify/amplify-cli/issues/1003)

## [1.4.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.3.1...amplify-category-function@1.4.1) (2019-04-09)

**Note:** Version bump only for package amplify-category-function

## [1.3.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.0.8...amplify-category-function@1.3.1) (2019-04-03)

**Note:** Version bump only for package amplify-category-function

## [1.0.8](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.0.7...amplify-category-function@1.0.8) (2019-03-22)

**Note:** Version bump only for package amplify-category-function

## [1.0.7](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.0.6...amplify-category-function@1.0.7) (2019-02-26)

**Note:** Version bump only for package amplify-category-function

## [1.0.6](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.0.5...amplify-category-function@1.0.6) (2019-02-22)

**Note:** Version bump only for package amplify-category-function

## [1.0.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.0.3-beta.0...amplify-category-function@1.0.5) (2019-02-11)

**Note:** Version bump only for package amplify-category-function

## [1.0.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.0.3-beta.0...amplify-category-function@1.0.3) (2019-02-11)

**Note:** Version bump only for package amplify-category-function

## [1.0.3-beta.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@1.0.2...amplify-category-function@1.0.3-beta.0) (2019-02-11)

**Note:** Version bump only for package amplify-category-function

<a name="0.2.1-multienv.7"></a>

## [0.2.1-multienv.7](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.2.1-multienv.5...amplify-category-function@0.2.1-multienv.7) (2019-01-30)

### Features

- add metadata in lambda CFN for it to be compatible and worked with using SAM CLI ([8661012](https://github.com/aws-amplify/amplify-cli/commit/8661012))

<a name="0.2.1-multienv.6"></a>

## [0.2.1-multienv.6](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.2.1-multienv.5...amplify-category-function@0.2.1-multienv.6) (2019-01-16)

### Features

- add metadata in lambda CFN for it to be compatible and worked with using SAM CLI ([8661012](https://github.com/aws-amplify/amplify-cli/commit/8661012))

<a name="0.2.1-multienv.5"></a>

## [0.2.1-multienv.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.2.1-multienv.4...amplify-category-function@0.2.1-multienv.5) (2018-12-28)

**Note:** Version bump only for package amplify-category-function

<a name="0.2.1-multienv.4"></a>

## [0.2.1-multienv.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.2.1-multienv.3...amplify-category-function@0.2.1-multienv.4) (2018-12-21)

**Note:** Version bump only for package amplify-category-function

<a name="0.2.1-multienv.3"></a>

## [0.2.1-multienv.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.2.1-multienv.2...amplify-category-function@0.2.1-multienv.3) (2018-12-05)

### Bug Fixes

- **cli:** remove calls to gluegun's prompt.confirm ([#546](https://github.com/aws-amplify/amplify-cli/issues/546)) ([0080ddb](https://github.com/aws-amplify/amplify-cli/commit/0080ddb))

<a name="0.2.1-multienv.2"></a>

## [0.2.1-multienv.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.2.1-multienv.1...amplify-category-function@0.2.1-multienv.2) (2018-12-04)

**Note:** Version bump only for package amplify-category-function

<a name="0.2.1-multienv.1"></a>

## [0.2.1-multienv.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.2.1-multienv.0...amplify-category-function@0.2.1-multienv.1) (2018-11-28)

### Features

- migration of categories - s3,dynamo,appsync,apigw,function ([f63bc32](https://github.com/aws-amplify/amplify-cli/commit/f63bc32))
- migration of categories - s3,dynamo,lambda,appsync ([#495](https://github.com/aws-amplify/amplify-cli/issues/495)) ([1ef1d21](https://github.com/aws-amplify/amplify-cli/commit/1ef1d21))

<a name="0.2.1-multienv.0"></a>

## [0.2.1-multienv.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.1.34-multienv.2...amplify-category-function@0.2.1-multienv.0) (2018-11-21)

**Note:** Version bump only for package amplify-category-function

<a name="0.1.34-multienv.2"></a>

## [0.1.34-multienv.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.1.34-multienv.1...amplify-category-function@0.1.34-multienv.2) (2018-11-19)

**Note:** Version bump only for package amplify-category-function

<a name="0.1.34-multienv.1"></a>

## [0.1.34-multienv.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.1.34-multienv.0...amplify-category-function@0.1.34-multienv.1) (2018-11-19)

**Note:** Version bump only for package amplify-category-function

<a name="0.1.34-multienv.0"></a>

## [0.1.34-multienv.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.1.33...amplify-category-function@0.1.34-multienv.0) (2018-11-16)

### Features

- multi-enviornment support for Lambda & a minor fix in analytics plugin ([#414](https://github.com/aws-amplify/amplify-cli/issues/414)) ([e645b22](https://github.com/aws-amplify/amplify-cli/commit/e645b22))

<a name="0.1.33"></a>

## [0.1.33](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.1.33-beta.0...amplify-category-function@0.1.33) (2018-11-09)

**Note:** Version bump only for package amplify-category-function

<a name="0.1.33-beta.0"></a>

## [0.1.33-beta.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.1.13...amplify-category-function@0.1.33-beta.0) (2018-11-09)

**Note:** Version bump only for package amplify-category-function

<a name="0.1.32"></a>

## [0.1.32](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.1.32-beta.0...amplify-category-function@0.1.32) (2018-11-05)

**Note:** Version bump only for package amplify-category-function

<a name="0.1.32-beta.0"></a>

## [0.1.32-beta.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.1.13...amplify-category-function@0.1.32-beta.0) (2018-11-05)

**Note:** Version bump only for package amplify-category-function

<a name="0.1.31"></a>

## [0.1.31](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.1.13...amplify-category-function@0.1.31) (2018-11-02)

**Note:** Version bump only for package amplify-category-function

<a name="0.1.30"></a>

## [0.1.30](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.1.30-beta.0...amplify-category-function@0.1.30) (2018-11-02)

**Note:** Version bump only for package amplify-category-function

<a name="0.1.30-beta.0"></a>

## [0.1.30-beta.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.1.13...amplify-category-function@0.1.30-beta.0) (2018-11-02)

**Note:** Version bump only for package amplify-category-function

<a name="0.1.29"></a>

## [0.1.29](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.1.29-beta.0...amplify-category-function@0.1.29) (2018-10-23)

**Note:** Version bump only for package amplify-category-function

<a name="0.1.29-beta.0"></a>

## [0.1.29-beta.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.1.13...amplify-category-function@0.1.29-beta.0) (2018-10-23)

**Note:** Version bump only for package amplify-category-function

<a name="0.1.28"></a>

## [0.1.28](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.1.28-beta.0...amplify-category-function@0.1.28) (2018-10-18)

**Note:** Version bump only for package amplify-category-function

<a name="0.1.28-beta.0"></a>

## [0.1.28-beta.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.1.13...amplify-category-function@0.1.28-beta.0) (2018-10-12)

**Note:** Version bump only for package amplify-category-function

<a name="0.1.13"></a>

## [0.1.13](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.1.12...amplify-category-function@0.1.13) (2018-08-23)

**Note:** Version bump only for package amplify-category-function

<a name="0.1.12"></a>

## [0.1.12](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.1.11...amplify-category-function@0.1.12) (2018-08-23)

**Note:** Version bump only for package amplify-category-function

<a name="0.1.11"></a>

## [0.1.11](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.1.9...amplify-category-function@0.1.11) (2018-08-23)

**Note:** Version bump only for package amplify-category-function

<a name="0.1.10"></a>

## [0.1.10](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.1.9...amplify-category-function@0.1.10) (2018-08-23)

**Note:** Version bump only for package amplify-category-function

<a name="0.1.9"></a>

## [0.1.9](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.1.8...amplify-category-function@0.1.9) (2018-08-23)

**Note:** Version bump only for package amplify-category-function

<a name="0.1.8"></a>

## [0.1.8](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.1.7...amplify-category-function@0.1.8) (2018-08-23)

**Note:** Version bump only for package amplify-category-function

<a name="0.1.7"></a>

## [0.1.7](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.1.6...amplify-category-function@0.1.7) (2018-08-23)

**Note:** Version bump only for package amplify-category-function

<a name="0.1.6"></a>

## [0.1.6](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.1.5...amplify-category-function@0.1.6) (2018-08-23)

**Note:** Version bump only for package amplify-category-function

<a name="0.1.5"></a>

## [0.1.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-function@0.1.4...amplify-category-function@0.1.5) (2018-08-23)

**Note:** Version bump only for package amplify-category-function

<a name="0.1.4"></a>

## 0.1.4 (2018-08-23)

**Note:** Version bump only for package amplify-category-function

<a name="0.1.3"></a>

## 0.1.3 (2018-08-23)

**Note:** Version bump only for package amplify-category-function

<a name="0.1.2"></a>

## 0.1.2 (2018-08-23)

**Note:** Version bump only for package amplify-category-function

<a name="0.1.1"></a>

## 0.1.1 (2018-08-23)

**Note:** Version bump only for package amplify-category-function
