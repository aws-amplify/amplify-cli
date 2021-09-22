# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.29.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.28.0...amplify-cli-core@1.29.0) (2021-09-18)


### Features

* **amplify-category-auth:** use usernameAttributes by default, FF for aliasAttributes ([#8188](https://github.com/aws-amplify/amplify-cli/issues/8188)) ([f3044ee](https://github.com/aws-amplify/amplify-cli/commit/f3044eeff21fa900da5aac613db87502526bc165))





# [1.28.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.27.0...amplify-cli-core@1.28.0) (2021-09-14)



# 5.6.0 (2021-09-14)


### Features

* version blocking for CLI ([#7834](https://github.com/aws-amplify/amplify-cli/issues/7834)) ([045ef3b](https://github.com/aws-amplify/amplify-cli/commit/045ef3b83598c287b7e34bb5d1487bbe026026af))


### Reverts

* Revert "feat: version blocking for CLI (#7834)" (#8170) ([f5a92e3](https://github.com/aws-amplify/amplify-cli/commit/f5a92e3fcd288ba8f5eb48db62ccf02f6bb7d03d)), closes [#7834](https://github.com/aws-amplify/amplify-cli/issues/7834) [#8170](https://github.com/aws-amplify/amplify-cli/issues/8170)





# [1.27.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.26.2...amplify-cli-core@1.27.0) (2021-09-09)



# 5.5.0 (2021-09-07)


### Bug Fixes

* runtime hooks readme getting excluded in pkg CLI ([#8100](https://github.com/aws-amplify/amplify-cli/issues/8100)) ([1f491cf](https://github.com/aws-amplify/amplify-cli/commit/1f491cf6dbab4478bff18c084f0ff5c3a6746246))


### Features

* Amplify Command Hooks ([#7633](https://github.com/aws-amplify/amplify-cli/issues/7633)) ([4cacaad](https://github.com/aws-amplify/amplify-cli/commit/4cacaadcb87d377a37890b0092bf66c6e7b65b0b))





## [1.26.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.26.1...amplify-cli-core@1.26.2) (2021-09-02)


### Bug Fixes

* **amplify-cli-core:** extend js-yaml.JSON_SCHEMA to inherit json type conversions when parsing .yml cfn templates ([#7909](https://github.com/aws-amplify/amplify-cli/issues/7909)) ([fe5c1ec](https://github.com/aws-amplify/amplify-cli/commit/fe5c1ec63846d531f6828fae98e86464f32a58e4)), closes [#7819](https://github.com/aws-amplify/amplify-cli/issues/7819)





## [1.26.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.26.0...amplify-cli-core@1.26.1) (2021-08-24)

**Note:** Version bump only for package amplify-cli-core





# [1.26.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.25.1...amplify-cli-core@1.26.0) (2021-08-06)


### Bug Fixes

* improve size checks before packaging Lambda resources ([#7756](https://github.com/aws-amplify/amplify-cli/issues/7756)) ([5952f6a](https://github.com/aws-amplify/amplify-cli/commit/5952f6aa6c1a6bbf3693a465ab61c46b7ab5c37b))


### Features

* create new amplify-prompts package to handle all terminal interactions ([#7774](https://github.com/aws-amplify/amplify-cli/issues/7774)) ([39b3262](https://github.com/aws-amplify/amplify-cli/commit/39b326202283f402f82d7e38a830acdc3845a8d7))





## [1.25.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.25.0...amplify-cli-core@1.25.1) (2021-07-30)


### Bug Fixes

* **amplify-cli-core:** new-line escape sequence made os-specific ([#7814](https://github.com/aws-amplify/amplify-cli/issues/7814)) ([70cd7df](https://github.com/aws-amplify/amplify-cli/commit/70cd7dfe2a7882c1c2d2f2ff7230a0f81e8e8be9))





# [1.25.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.24.1...amplify-cli-core@1.25.0) (2021-07-27)


### Bug Fixes

* **cli:** prevent re-prompt of info on `amplify pull` ([#7730](https://github.com/aws-amplify/amplify-cli/issues/7730)) ([1919558](https://github.com/aws-amplify/amplify-cli/commit/19195589ab2d8b7382cac100c888bdbb62b9ba59))


### Features

* **amplify-category-auth:** use EnabledMFAs to only configure TOTP ([#7779](https://github.com/aws-amplify/amplify-cli/issues/7779)) ([c2102c5](https://github.com/aws-amplify/amplify-cli/commit/c2102c53fd2ca974fb95c4468ad7a87fefe14ab0))


### Reverts

* Revert "feat(amplify-category-auth): use EnabledMFAs to only configure TOTP (#7779)" (#7790) ([fa172c4](https://github.com/aws-amplify/amplify-cli/commit/fa172c4caf6f15de56925bd1ff4f8ee743788b52)), closes [#7779](https://github.com/aws-amplify/amplify-cli/issues/7779) [#7790](https://github.com/aws-amplify/amplify-cli/issues/7790)





## [1.24.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.24.0...amplify-cli-core@1.24.1) (2021-07-16)


### Bug Fixes

* checkout into existing env with new LL ([#7687](https://github.com/aws-amplify/amplify-cli/issues/7687)) ([3e2e630](https://github.com/aws-amplify/amplify-cli/commit/3e2e6305b5a74db2a282dc33b0cc5d24f1c8eaaf))





# [1.24.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.23.1...amplify-cli-core@1.24.0) (2021-06-30)



# 5.1.0 (2021-06-29)


### Bug Fixes

* [#7561](https://github.com/aws-amplify/amplify-cli/issues/7561) - auth trigger usage with user groups ([#7592](https://github.com/aws-amplify/amplify-cli/issues/7592)) ([d1d372e](https://github.com/aws-amplify/amplify-cli/commit/d1d372ee55d2fb1c15022642837c1f6fb6994ac8))


### Features

* **amplify-cli-core:** add FF for flutter null safety release ([#7607](https://github.com/aws-amplify/amplify-cli/issues/7607)) ([a65bfa9](https://github.com/aws-amplify/amplify-cli/commit/a65bfa99793a5d7d7106638d6fab4a40954a1ee9))
* configure env vars and secrets for lambda functions ([#7529](https://github.com/aws-amplify/amplify-cli/issues/7529)) ([fac354e](https://github.com/aws-amplify/amplify-cli/commit/fac354e5e26846e8b1499d3a4718b15983e0110f))





## [1.23.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.23.0...amplify-cli-core@1.23.1) (2021-06-24)


### Bug Fixes

* **graphql-transformer-common:** improve generated graphql pluralization ([#7258](https://github.com/aws-amplify/amplify-cli/issues/7258)) ([fc3ad0d](https://github.com/aws-amplify/amplify-cli/commit/fc3ad0dd5a12a7912c59ae12024f593b4cdf7f2d)), closes [#4224](https://github.com/aws-amplify/amplify-cli/issues/4224)





# [1.23.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.22.2...amplify-cli-core@1.23.0) (2021-06-15)



# 5.0.0 (2021-06-14)


### Bug Fixes

* copy env specific data from ccb on env checkout ([#7512](https://github.com/aws-amplify/amplify-cli/issues/7512)) ([bef6d9c](https://github.com/aws-amplify/amplify-cli/commit/bef6d9c5d1fd7e12bbacaf20639c00334d285517))


### Features

* add support for defining IAM Permissions Boundary for Project ([#7144](https://github.com/aws-amplify/amplify-cli/issues/7144)) ([acf031b](https://github.com/aws-amplify/amplify-cli/commit/acf031b29d4e554d647da39ffb8293010cf1d8ad))
* Define IAM Permissions Boundary for Project ([#7502](https://github.com/aws-amplify/amplify-cli/issues/7502)) (ref [#4618](https://github.com/aws-amplify/amplify-cli/issues/4618)) ([08f7a3c](https://github.com/aws-amplify/amplify-cli/commit/08f7a3c45b2e98535ef325eb0a97c5bc4d3008c6)), closes [#7053](https://github.com/aws-amplify/amplify-cli/issues/7053)
* lambda layers rework ([#7375](https://github.com/aws-amplify/amplify-cli/issues/7375)) ([a3b7d3e](https://github.com/aws-amplify/amplify-cli/commit/a3b7d3e427e16bac2b2ea27699fe53b48cf47656))


### Reverts

* Revert "feat: add support for defining IAM Permissions Boundary for Project (#7144)" (#7453) ([08704f0](https://github.com/aws-amplify/amplify-cli/commit/08704f0271f6f5d0e0e98ad7002f4b35c3890924)), closes [#7144](https://github.com/aws-amplify/amplify-cli/issues/7144) [#7453](https://github.com/aws-amplify/amplify-cli/issues/7453)





## [1.22.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.22.1...amplify-cli-core@1.22.2) (2021-05-26)

**Note:** Version bump only for package amplify-cli-core





## [1.22.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.22.0...amplify-cli-core@1.22.1) (2021-05-18)

**Note:** Version bump only for package amplify-cli-core





# [1.22.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.21.2...amplify-cli-core@1.22.0) (2021-05-14)



# 4.51.0 (2021-05-13)


### Bug Fixes

* [#7243](https://github.com/aws-amplify/amplify-cli/issues/7243) yaml parsing should support all cfn functions ([#7245](https://github.com/aws-amplify/amplify-cli/issues/7245)) ([4130f2f](https://github.com/aws-amplify/amplify-cli/commit/4130f2fc460f2d038365c4314c6293c203a6520e))


### Features

* defer root stack creation to first `amplify push` ([#7174](https://github.com/aws-amplify/amplify-cli/issues/7174)) ([d28dd1c](https://github.com/aws-amplify/amplify-cli/commit/d28dd1caca86b19a858dab0e7aa907d1cc74c86a))
* prep work for SMS Sandbox support ([#7302](https://github.com/aws-amplify/amplify-cli/issues/7302)) ([d1f85d2](https://github.com/aws-amplify/amplify-cli/commit/d1f85d2e0a9c367b71defefe6d9e00737f681ca4))


### Reverts

* Revert "feat: defer root stack creation to first `amplify push` (#7174)" (#7306) ([78854eb](https://github.com/aws-amplify/amplify-cli/commit/78854ebd4a3d41d34d68736d6556045302101265)), closes [#7174](https://github.com/aws-amplify/amplify-cli/issues/7174) [#7306](https://github.com/aws-amplify/amplify-cli/issues/7306)





## [1.21.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.21.0...amplify-cli-core@1.21.2) (2021-05-03)



## 4.50.1 (2021-05-03)


### Bug Fixes

* parse nested yaml GetAtt refs correctly ([#7220](https://github.com/aws-amplify/amplify-cli/issues/7220)) ([0b20951](https://github.com/aws-amplify/amplify-cli/commit/0b209510c32d5ded9f57805a72858900ec8e21f2))





## [1.21.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.21.0...amplify-cli-core@1.21.1) (2021-05-03)


### Bug Fixes

* parse nested yaml GetAtt refs correctly ([#7220](https://github.com/aws-amplify/amplify-cli/issues/7220)) ([0b20951](https://github.com/aws-amplify/amplify-cli/commit/0b209510c32d5ded9f57805a72858900ec8e21f2))





# [1.21.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.20.1...amplify-cli-core@1.21.0) (2021-04-27)


### Bug Fixes

* frontend flag not honoring passed in framework ([#7126](https://github.com/aws-amplify/amplify-cli/issues/7126)) (ref [#7046](https://github.com/aws-amplify/amplify-cli/issues/7046)) ([1e67fc9](https://github.com/aws-amplify/amplify-cli/commit/1e67fc9a2fab262334181bbb50cba91999e24c33))


### Features

* S3 SSE by default ([#7039](https://github.com/aws-amplify/amplify-cli/issues/7039)) (ref [#5708](https://github.com/aws-amplify/amplify-cli/issues/5708)) ([c1369ed](https://github.com/aws-amplify/amplify-cli/commit/c1369ed6f9c204c89ee2d4c805314a40d6eeaf92))





## [1.20.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.20.0...amplify-cli-core@1.20.1) (2021-04-19)

**Note:** Version bump only for package amplify-cli-core





# [1.20.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.19.1...amplify-cli-core@1.20.0) (2021-04-14)


### Features

* added new fields to usage data ([#6911](https://github.com/aws-amplify/amplify-cli/issues/6911)) ([dc1d256](https://github.com/aws-amplify/amplify-cli/commit/dc1d256edecec2009ca6649da0995be571886b03))





## [1.19.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.18.1...amplify-cli-core@1.19.1) (2021-04-09)


### Bug Fixes

* **cli:** use more inclusive language ([#6919](https://github.com/aws-amplify/amplify-cli/issues/6919)) ([bb70464](https://github.com/aws-amplify/amplify-cli/commit/bb70464d6c24fa931c0eb80d234a496d936913f5))





## [1.18.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.18.0...amplify-cli-core@1.18.1) (2021-03-11)


### Bug Fixes

* e2e fix PR [#6059](https://github.com/aws-amplify/amplify-cli/issues/6059) ([#6807](https://github.com/aws-amplify/amplify-cli/issues/6807)) ([3a9058e](https://github.com/aws-amplify/amplify-cli/commit/3a9058ee68ffb2b883d2cb000a2ec1adede22fbf))
* gql compiler fix for user defined mutation ([#6059](https://github.com/aws-amplify/amplify-cli/issues/6059)) ([063d84f](https://github.com/aws-amplify/amplify-cli/commit/063d84ff3d31762a4434f3146623132536f4667d))





# [1.18.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.17.2...amplify-cli-core@1.18.0) (2021-03-05)


### Features

* **FF-codegen:** add feature flags for new codegen features ([#6732](https://github.com/aws-amplify/amplify-cli/issues/6732)) ([d00a8e9](https://github.com/aws-amplify/amplify-cli/commit/d00a8e95721c2fb27ef650fa2099e12de7d99705))





## [1.17.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.17.1...amplify-cli-core@1.17.2) (2021-02-26)

**Note:** Version bump only for package amplify-cli-core





## [1.17.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.17.0...amplify-cli-core@1.17.1) (2021-02-24)

**Note:** Version bump only for package amplify-cli-core





# [1.17.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.16.0...amplify-cli-core@1.17.0) (2021-02-17)


### Features

* **amplify-cli-core:** add validations to tag Key and Value ([31eb8eb](https://github.com/aws-amplify/amplify-cli/commit/31eb8ebff2fcbd215975c8ac05287d023d544c42))
* Separate prod and dev lambda function builds ([#6494](https://github.com/aws-amplify/amplify-cli/issues/6494)) ([2977c6a](https://github.com/aws-amplify/amplify-cli/commit/2977c6a886b33a38ef46f898a2adc1ffdb6d228b))





# [1.16.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.15.0...amplify-cli-core@1.16.0) (2021-02-11)


### Features

* dont open urls when CLI is running in CI ([#6503](https://github.com/aws-amplify/amplify-cli/issues/6503)) ([27546a7](https://github.com/aws-amplify/amplify-cli/commit/27546a78159ea95c636dbbd094fe6a4f7fb8f8f4)), closes [#5973](https://github.com/aws-amplify/amplify-cli/issues/5973)





# [1.15.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.14.1...amplify-cli-core@1.15.0) (2021-02-10)


### Bug Fixes

* fix appsync permission assignment from functions ([#5342](https://github.com/aws-amplify/amplify-cli/issues/5342)) ([b2e2dd0](https://github.com/aws-amplify/amplify-cli/commit/b2e2dd0071c1a451ba032cf7f8cfe7cf6381a96e))
* **amplify-category-function:** use ref for S3Bucket and S3Key in CFN ([#6358](https://github.com/aws-amplify/amplify-cli/issues/6358)) ([84a141a](https://github.com/aws-amplify/amplify-cli/commit/84a141ac4812d95c27b14c8d9f81e4a5c8fadef8))
* optimize mock package imports ([#6455](https://github.com/aws-amplify/amplify-cli/issues/6455)) ([1b64a14](https://github.com/aws-amplify/amplify-cli/commit/1b64a147cbb3b56ce6f8465318d611de5d724685))


### Features

* **graphql-key-transformer:** change default to add GSIs when using [@key](https://github.com/key) ([#5648](https://github.com/aws-amplify/amplify-cli/issues/5648)) ([4287c63](https://github.com/aws-amplify/amplify-cli/commit/4287c630295c304c7ff8343922926b4830b75cd4))





## [1.14.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.14.0...amplify-cli-core@1.14.1) (2021-01-08)


### Bug Fixes

* apply tags on create and push nested stack ([#6321](https://github.com/aws-amplify/amplify-cli/issues/6321)) ([4faa3e5](https://github.com/aws-amplify/amplify-cli/commit/4faa3e5ac38d311fe7901fb1b8a1b542cf19e598))
* better error message when angular.json is missing ([#6253](https://github.com/aws-amplify/amplify-cli/issues/6253)) ([0c8175e](https://github.com/aws-amplify/amplify-cli/commit/0c8175e6312fc6fcd5b9e1334cf2011d1e8d392a))
* remove process on next and await ([#6239](https://github.com/aws-amplify/amplify-cli/issues/6239)) ([59d4a0e](https://github.com/aws-amplify/amplify-cli/commit/59d4a0eb318d2b3ad97be34bda9dee756cf82d74))





# [1.14.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.13.1...amplify-cli-core@1.14.0) (2020-12-31)


### Features

* **cli:** generate REAMDE file in amplify dir ([#5808](https://github.com/aws-amplify/amplify-cli/issues/5808)) ([cf0629f](https://github.com/aws-amplify/amplify-cli/commit/cf0629f7385df77aad19fddd58e3587e40482de2))





## [1.13.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.13.0...amplify-cli-core@1.13.1) (2020-12-21)


### Bug Fixes

* **amplify-provider-awscloudformation:** load correct file ([#6212](https://github.com/aws-amplify/amplify-cli/issues/6212)) ([7876187](https://github.com/aws-amplify/amplify-cli/commit/787618736540231efeeee8c803c178325b2c70b4))





# [1.13.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.12.0...amplify-cli-core@1.13.0) (2020-12-16)


### Bug Fixes

* [#4175](https://github.com/aws-amplify/amplify-cli/issues/4175) ([#6065](https://github.com/aws-amplify/amplify-cli/issues/6065)) ([85b1ae3](https://github.com/aws-amplify/amplify-cli/commit/85b1ae31253d06718e13a2e2ff8cca3fc1931073))
* provide better error message when unknown feature flags are present ([#6114](https://github.com/aws-amplify/amplify-cli/issues/6114)) ([d452e83](https://github.com/aws-amplify/amplify-cli/commit/d452e83c19bc6c4002a851c68b3961fc135f3689))


### Features

* **amplify-frontend-ios:** xcode integration feature flag ([#6072](https://github.com/aws-amplify/amplify-cli/issues/6072)) ([d7327ca](https://github.com/aws-amplify/amplify-cli/commit/d7327ca50b163c6104e99a112b8f5c5201e0bbbf))





# [1.12.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.11.0...amplify-cli-core@1.12.0) (2020-12-11)


### Features

* container-based deployments([#5727](https://github.com/aws-amplify/amplify-cli/issues/5727)) ([fad6377](https://github.com/aws-amplify/amplify-cli/commit/fad6377bd384862ca4429cb1a83eee90efd62b58))





# [1.11.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.10.0...amplify-cli-core@1.11.0) (2020-12-07)


### Features

* add support for multiple [@key](https://github.com/key) changes in same [@model](https://github.com/model) ([#6044](https://github.com/aws-amplify/amplify-cli/issues/6044)) ([e574637](https://github.com/aws-amplify/amplify-cli/commit/e5746379ea1330c53dacb55e8f6a9de7b17b55ae))





# [1.10.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.9.0...amplify-cli-core@1.10.0) (2020-11-30)


### Features

* pre-deploy pull, new login mechanism and pkg cli updates ([#5941](https://github.com/aws-amplify/amplify-cli/issues/5941)) ([7274251](https://github.com/aws-amplify/amplify-cli/commit/7274251faadc1035acce5f44699b172e10e2e67d))





# [1.9.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.8.0...amplify-cli-core@1.9.0) (2020-11-27)


### Bug Fixes

* fix to ignore deployment secret if not found ([#5985](https://github.com/aws-amplify/amplify-cli/issues/5985)) ([c1df18d](https://github.com/aws-amplify/amplify-cli/commit/c1df18ded1610bdabc342471dc67a40100a325dc))


### Features

* **iOS:** execute `amplify-app` flow on `init ` and `codegen models` ([#5917](https://github.com/aws-amplify/amplify-cli/issues/5917)) ([c47c8f7](https://github.com/aws-amplify/amplify-cli/commit/c47c8f78b37806181354d3842a2094c35b1795d0))


### Reverts

* Revert "feat(iOS): execute `amplify-app` flow on `init ` and `codegen models` (#5917)" (#5960) ([cd7951a](https://github.com/aws-amplify/amplify-cli/commit/cd7951ab6d26f1206c2f0ff95225ba7b2a5a25eb)), closes [#5917](https://github.com/aws-amplify/amplify-cli/issues/5917) [#5960](https://github.com/aws-amplify/amplify-cli/issues/5960)





# [1.8.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.6.0...amplify-cli-core@1.8.0) (2020-11-22)


### Bug Fixes

* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))


### Features

* storage import ([#5893](https://github.com/aws-amplify/amplify-cli/issues/5893)) ([ad7b028](https://github.com/aws-amplify/amplify-cli/commit/ad7b028330bcee64d5124be7f27a8494dc8e9400))





# 1.7.0 (2020-11-22)


### Bug Fixes

* add compatibility to json parse for non-string values ([#5147](https://github.com/aws-amplify/amplify-cli/issues/5147)) ([3bc9306](https://github.com/aws-amplify/amplify-cli/commit/3bc9306c7b3d078d9b531f5950e8a304fc031d23))
* added exit code on remove ([#5427](https://github.com/aws-amplify/amplify-cli/issues/5427)) ([33132f7](https://github.com/aws-amplify/amplify-cli/commit/33132f764b290cafd345720409a5db8ea6088069))
* data inconsitency ([#5344](https://github.com/aws-amplify/amplify-cli/issues/5344)) ([bfe1903](https://github.com/aws-amplify/amplify-cli/commit/bfe19038b5b676056f45d7ffcc4c2460057936d8))
* move mobile hub flag to context directly ([#5459](https://github.com/aws-amplify/amplify-cli/issues/5459)) ([1828d21](https://github.com/aws-amplify/amplify-cli/commit/1828d214e3491a3633d72f571b7a8f1ab271f7a1))
* move post-install steps to plugin platform rather than post install script ([#5678](https://github.com/aws-amplify/amplify-cli/issues/5678)) ([f83bbab](https://github.com/aws-amplify/amplify-cli/commit/f83bbab378f6857202653cd57c607cead11cbe52))
* publish returns with exitcode 1 ([#5413](https://github.com/aws-amplify/amplify-cli/issues/5413)) ([2064830](https://github.com/aws-amplify/amplify-cli/commit/20648308fca4d4ae6dba84874c3f5508405ff701))
* refactor amplify.json file handling ([#5282](https://github.com/aws-amplify/amplify-cli/issues/5282)) ([a6269f3](https://github.com/aws-amplify/amplify-cli/commit/a6269f3177f3242df81e9d7dce0625295bb7a9fc))
* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))
* update default file permissions for credentials/config ([#5246](https://github.com/aws-amplify/amplify-cli/issues/5246)) ([b64f1bd](https://github.com/aws-amplify/amplify-cli/commit/b64f1bd784b0595f49241fdd89686c5f8a421ae3))


### Features

* changes for native packaging ([#5548](https://github.com/aws-amplify/amplify-cli/issues/5548)) ([7a06f6d](https://github.com/aws-amplify/amplify-cli/commit/7a06f6d96e42a5863e2192560890adbd741b0dc6))
* feature flag implementation ([#4891](https://github.com/aws-amplify/amplify-cli/issues/4891)) ([6d1c632](https://github.com/aws-amplify/amplify-cli/commit/6d1c632952a49cb56670c11c9cb0c3620d0eb332))
* ff to turn off schema reserve word validation ([#5745](https://github.com/aws-amplify/amplify-cli/issues/5745)) ([de79514](https://github.com/aws-amplify/amplify-cli/commit/de79514c18bea7236a05f0658513b95318501d16))
* resource Tagging Support ([#5178](https://github.com/aws-amplify/amplify-cli/issues/5178)) ([e34226d](https://github.com/aws-amplify/amplify-cli/commit/e34226dde30d7d345e3cc2e72e187b242a09c389))
* storage import ([#5893](https://github.com/aws-amplify/amplify-cli/issues/5893)) ([ad7b028](https://github.com/aws-amplify/amplify-cli/commit/ad7b028330bcee64d5124be7f27a8494dc8e9400))
* support importing of auth resources ([#5591](https://github.com/aws-amplify/amplify-cli/issues/5591)) ([7903246](https://github.com/aws-amplify/amplify-cli/commit/790324680544fe18481f91390001f9f07a144203))
* transformer redesign ([#5534](https://github.com/aws-amplify/amplify-cli/issues/5534)) ([a93c685](https://github.com/aws-amplify/amplify-cli/commit/a93c6852f6588898ebc52b0574f4fcc3d2e87948))
* update post-install to copy executable assets to .amplify ([#5595](https://github.com/aws-amplify/amplify-cli/issues/5595)) ([53a23a0](https://github.com/aws-amplify/amplify-cli/commit/53a23a07cbb9e09566c1f0f577ba2b7488bc2eae))





## [1.6.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.6.0...amplify-cli-core@1.6.3) (2020-11-20)


### Bug Fixes

* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))





## [1.6.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.6.0...amplify-cli-core@1.6.2) (2020-11-20)


### Bug Fixes

* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))





## [1.6.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.6.0...amplify-cli-core@1.6.1) (2020-11-19)


### Bug Fixes

* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))





# [1.6.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.5.1...amplify-cli-core@1.6.0) (2020-11-08)


### Features

* ff to turn off schema reserve word validation ([#5745](https://github.com/aws-amplify/amplify-cli/issues/5745)) ([de79514](https://github.com/aws-amplify/amplify-cli/commit/de79514c18bea7236a05f0658513b95318501d16))
* transformer redesign ([#5534](https://github.com/aws-amplify/amplify-cli/issues/5534)) ([a93c685](https://github.com/aws-amplify/amplify-cli/commit/a93c6852f6588898ebc52b0574f4fcc3d2e87948))





## [1.5.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.5.0...amplify-cli-core@1.5.1) (2020-10-27)


### Bug Fixes

* move post-install steps to plugin platform rather than post install script ([#5678](https://github.com/aws-amplify/amplify-cli/issues/5678)) ([f83bbab](https://github.com/aws-amplify/amplify-cli/commit/f83bbab378f6857202653cd57c607cead11cbe52))





# [1.5.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.4.0...amplify-cli-core@1.5.0) (2020-10-22)


### Features

* update post-install to copy executable assets to .amplify ([#5595](https://github.com/aws-amplify/amplify-cli/issues/5595)) ([53a23a0](https://github.com/aws-amplify/amplify-cli/commit/53a23a07cbb9e09566c1f0f577ba2b7488bc2eae))





# [1.4.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.3.4...amplify-cli-core@1.4.0) (2020-10-17)


### Features

* changes for native packaging ([#5548](https://github.com/aws-amplify/amplify-cli/issues/5548)) ([7a06f6d](https://github.com/aws-amplify/amplify-cli/commit/7a06f6d96e42a5863e2192560890adbd741b0dc6))
* support importing of auth resources ([#5591](https://github.com/aws-amplify/amplify-cli/issues/5591)) ([7903246](https://github.com/aws-amplify/amplify-cli/commit/790324680544fe18481f91390001f9f07a144203))





## [1.3.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.3.3...amplify-cli-core@1.3.4) (2020-10-01)


### Bug Fixes

* added exit code on remove ([#5427](https://github.com/aws-amplify/amplify-cli/issues/5427)) ([33132f7](https://github.com/aws-amplify/amplify-cli/commit/33132f764b290cafd345720409a5db8ea6088069))
* move mobile hub flag to context directly ([#5459](https://github.com/aws-amplify/amplify-cli/issues/5459)) ([1828d21](https://github.com/aws-amplify/amplify-cli/commit/1828d214e3491a3633d72f571b7a8f1ab271f7a1))
* publish returns with exitcode 1 ([#5413](https://github.com/aws-amplify/amplify-cli/issues/5413)) ([2064830](https://github.com/aws-amplify/amplify-cli/commit/20648308fca4d4ae6dba84874c3f5508405ff701))





## [1.3.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.3.2...amplify-cli-core@1.3.3) (2020-09-25)


### Bug Fixes

* data inconsitency ([#5344](https://github.com/aws-amplify/amplify-cli/issues/5344)) ([bfe1903](https://github.com/aws-amplify/amplify-cli/commit/bfe19038b5b676056f45d7ffcc4c2460057936d8))





## [1.3.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.3.1...amplify-cli-core@1.3.2) (2020-09-16)


### Bug Fixes

* refactor amplify.json file handling ([#5282](https://github.com/aws-amplify/amplify-cli/issues/5282)) ([a6269f3](https://github.com/aws-amplify/amplify-cli/commit/a6269f3177f3242df81e9d7dce0625295bb7a9fc))





## [1.3.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.3.0...amplify-cli-core@1.3.1) (2020-09-09)


### Bug Fixes

* update default file permissions for credentials/config ([#5246](https://github.com/aws-amplify/amplify-cli/issues/5246)) ([b64f1bd](https://github.com/aws-amplify/amplify-cli/commit/b64f1bd784b0595f49241fdd89686c5f8a421ae3))





# [1.3.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.2.0...amplify-cli-core@1.3.0) (2020-08-31)


### Bug Fixes

* add compatibility to json parse for non-string values ([#5147](https://github.com/aws-amplify/amplify-cli/issues/5147)) ([3bc9306](https://github.com/aws-amplify/amplify-cli/commit/3bc9306c7b3d078d9b531f5950e8a304fc031d23))


### Features

* resource Tagging Support ([#5178](https://github.com/aws-amplify/amplify-cli/issues/5178)) ([e34226d](https://github.com/aws-amplify/amplify-cli/commit/e34226dde30d7d345e3cc2e72e187b242a09c389))





# 1.2.0 (2020-07-29)


### Features

* feature flag implementation ([#4891](https://github.com/aws-amplify/amplify-cli/issues/4891)) ([6d1c632](https://github.com/aws-amplify/amplify-cli/commit/6d1c632952a49cb56670c11c9cb0c3620d0eb332))





# 1.1.0 (2020-07-23)


### Features

* feature flag implementation ([#4891](https://github.com/aws-amplify/amplify-cli/issues/4891)) ([4639450](https://github.com/aws-amplify/amplify-cli/commit/463945029cfe861f74986d9a8b9af6b827d2063d))
