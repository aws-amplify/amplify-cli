# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.9.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-function-plugin-interface@1.9.0...amplify-function-plugin-interface@1.9.1) (2021-07-30)


### Bug Fixes

* [#7696](https://github.com/aws-amplify/amplify-cli/issues/7696) - support production package install for function category ([#7812](https://github.com/aws-amplify/amplify-cli/issues/7812)) ([b39141e](https://github.com/aws-amplify/amplify-cli/commit/b39141e9d00bf0dc23318dcc476ed92ab031e88b))





# [1.9.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-function-plugin-interface@1.8.0...amplify-function-plugin-interface@1.9.0) (2021-06-30)


### Features

* configure env vars and secrets for lambda functions ([#7529](https://github.com/aws-amplify/amplify-cli/issues/7529)) ([fac354e](https://github.com/aws-amplify/amplify-cli/commit/fac354e5e26846e8b1499d3a4718b15983e0110f))





# [1.8.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-function-plugin-interface@1.7.2...amplify-function-plugin-interface@1.8.0) (2021-06-15)


### Features

* lambda layers rework ([#7375](https://github.com/aws-amplify/amplify-cli/issues/7375)) ([a3b7d3e](https://github.com/aws-amplify/amplify-cli/commit/a3b7d3e427e16bac2b2ea27699fe53b48cf47656))





## [1.7.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-function-plugin-interface@1.7.1...amplify-function-plugin-interface@1.7.2) (2021-02-26)

**Note:** Version bump only for package amplify-function-plugin-interface





## [1.7.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-function-plugin-interface@1.7.0...amplify-function-plugin-interface@1.7.1) (2021-02-24)

**Note:** Version bump only for package amplify-function-plugin-interface





# [1.7.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-function-plugin-interface@1.6.0...amplify-function-plugin-interface@1.7.0) (2021-02-17)


### Features

* Separate prod and dev lambda function builds ([#6494](https://github.com/aws-amplify/amplify-cli/issues/6494)) ([2977c6a](https://github.com/aws-amplify/amplify-cli/commit/2977c6a886b33a38ef46f898a2adc1ffdb6d228b))





# [1.6.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-function-plugin-interface@1.5.1...amplify-function-plugin-interface@1.6.0) (2020-12-11)


### Features

* container-based deployments([#5727](https://github.com/aws-amplify/amplify-cli/issues/5727)) ([fad6377](https://github.com/aws-amplify/amplify-cli/commit/fad6377bd384862ca4429cb1a83eee90efd62b58))





## [1.5.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-function-plugin-interface@1.4.1...amplify-function-plugin-interface@1.5.1) (2020-11-22)

**Note:** Version bump only for package amplify-function-plugin-interface





# 1.5.0 (2020-11-22)


### Bug Fixes

* save default editor on add and load on update ([#3841](https://github.com/aws-amplify/amplify-cli/issues/3841)) ([edb94cf](https://github.com/aws-amplify/amplify-cli/commit/edb94cfa2f1a66af0d45afb74f46a3488def9ddd))


### Features

* Lambda layers ([#4697](https://github.com/aws-amplify/amplify-cli/issues/4697)) ([4e97400](https://github.com/aws-amplify/amplify-cli/commit/4e974007d95c894ab4108a2dff8d5996e7e3ce25))
* **amplify-category-function:** Refactor invoke to call runtime plugins ([#3768](https://github.com/aws-amplify/amplify-cli/issues/3768)) ([92293fa](https://github.com/aws-amplify/amplify-cli/commit/92293fa83190bd18aacdc2f46a22938f94b89609))
* **amplify-category-function:** refactor to support build and package interface of runtime plugins ([8c4ec55](https://github.com/aws-amplify/amplify-cli/commit/8c4ec55e46ed8a153eee306c23f9665d58d3c5f4))
* **amplify-category-function:** refactor to support runtime and template plugins ([#3517](https://github.com/aws-amplify/amplify-cli/issues/3517)) ([607ae21](https://github.com/aws-amplify/amplify-cli/commit/607ae21287941805f44ea8a9b78dd12d16d71f85))
* **amplify-category-function:** Support Lambda Scheduling  ([#3714](https://github.com/aws-amplify/amplify-cli/issues/3714)) ([4a488ed](https://github.com/aws-amplify/amplify-cli/commit/4a488edef14d9161600cf6ce6887baa3c04ebef5))
* **amplify-category-function:** support list in plugin runtime condition ([#3757](https://github.com/aws-amplify/amplify-cli/issues/3757)) ([b36c09d](https://github.com/aws-amplify/amplify-cli/commit/b36c09d6ef21c40999d1f5930aabece0a4315d21))
* **amplify-function-plugin-interface:** update contribute params ([#3711](https://github.com/aws-amplify/amplify-cli/issues/3711)) ([3a38f9e](https://github.com/aws-amplify/amplify-cli/commit/3a38f9ee021f51f48b4e978f0ed96d4cbfb1ff96))
* **amplify-python-runtime-provider:** implement python runtime provider ([#3710](https://github.com/aws-amplify/amplify-cli/issues/3710)) ([cddb5a7](https://github.com/aws-amplify/amplify-cli/commit/cddb5a7b47abacae11205776cb56d68a56286f45))


### Reverts

* Revert "feat(amplify-python-runtime-provider): implement python runtime provider (#3710)" (#3719) ([e20ed97](https://github.com/aws-amplify/amplify-cli/commit/e20ed975ea46f124e736b4dfc940e1be1a781f87)), closes [#3710](https://github.com/aws-amplify/amplify-cli/issues/3710) [#3719](https://github.com/aws-amplify/amplify-cli/issues/3719)





## [1.4.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-function-plugin-interface@1.4.0...amplify-function-plugin-interface@1.4.1) (2020-08-31)

**Note:** Version bump only for package amplify-function-plugin-interface





# [1.4.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-function-plugin-interface@1.3.1...amplify-function-plugin-interface@1.4.0) (2020-07-07)


### Features

* Lambda layers ([#4697](https://github.com/aws-amplify/amplify-cli/issues/4697)) ([c55b2e0](https://github.com/aws-amplify/amplify-cli/commit/c55b2e0c3377127aaf887591d7bc20d7240ef11d))





## [1.3.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-function-plugin-interface@1.3.0...amplify-function-plugin-interface@1.3.1) (2020-05-08)

**Note:** Version bump only for package amplify-function-plugin-interface





# [1.3.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-function-plugin-interface@1.2.0...amplify-function-plugin-interface@1.3.0) (2020-04-06)


### Bug Fixes

* save default editor on add and load on update ([#3841](https://github.com/aws-amplify/amplify-cli/issues/3841)) ([edb94cf](https://github.com/aws-amplify/amplify-cli/commit/edb94cfa2f1a66af0d45afb74f46a3488def9ddd))


### Features

* **amplify-category-function:** Refactor invoke to call runtime plugins ([#3768](https://github.com/aws-amplify/amplify-cli/issues/3768)) ([92293fa](https://github.com/aws-amplify/amplify-cli/commit/92293fa83190bd18aacdc2f46a22938f94b89609))
* **amplify-category-function:** Support Lambda Scheduling  ([#3714](https://github.com/aws-amplify/amplify-cli/issues/3714)) ([4a488ed](https://github.com/aws-amplify/amplify-cli/commit/4a488edef14d9161600cf6ce6887baa3c04ebef5))





# [1.2.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-function-plugin-interface@1.1.0...amplify-function-plugin-interface@1.2.0) (2020-03-26)


### Features

* **amplify-category-function:** support list in plugin runtime condition ([#3757](https://github.com/aws-amplify/amplify-cli/issues/3757)) ([b36c09d](https://github.com/aws-amplify/amplify-cli/commit/b36c09d6ef21c40999d1f5930aabece0a4315d21))





# 1.1.0 (2020-03-22)


### Features

* **amplify-category-function:** refactor to support build and package interface of runtime plugins ([8c4ec55](https://github.com/aws-amplify/amplify-cli/commit/8c4ec55e46ed8a153eee306c23f9665d58d3c5f4))
* **amplify-category-function:** refactor to support runtime and template plugins ([#3517](https://github.com/aws-amplify/amplify-cli/issues/3517)) ([607ae21](https://github.com/aws-amplify/amplify-cli/commit/607ae21287941805f44ea8a9b78dd12d16d71f85))
* **amplify-function-plugin-interface:** update contribute params ([#3711](https://github.com/aws-amplify/amplify-cli/issues/3711)) ([3a38f9e](https://github.com/aws-amplify/amplify-cli/commit/3a38f9ee021f51f48b4e978f0ed96d4cbfb1ff96))
* **amplify-python-runtime-provider:** implement python runtime provider ([#3710](https://github.com/aws-amplify/amplify-cli/issues/3710)) ([cddb5a7](https://github.com/aws-amplify/amplify-cli/commit/cddb5a7b47abacae11205776cb56d68a56286f45))


### Reverts

* Revert "feat(amplify-python-runtime-provider): implement python runtime provider (#3710)" (#3719) ([e20ed97](https://github.com/aws-amplify/amplify-cli/commit/e20ed975ea46f124e736b4dfc940e1be1a781f87)), closes [#3710](https://github.com/aws-amplify/amplify-cli/issues/3710) [#3719](https://github.com/aws-amplify/amplify-cli/issues/3719)
