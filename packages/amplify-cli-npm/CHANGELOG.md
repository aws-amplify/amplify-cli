# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [8.0.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@7.6.26...@aws-amplify/cli@8.0.0) (2022-04-07)


### chore

* prevent cold start by warming binary immediately after installation ([#10139](https://github.com/aws-amplify/amplify-cli/issues/10139)) ([d7c6ba6](https://github.com/aws-amplify/amplify-cli/commit/d7c6ba6a391ba5ead0eb49e896ae9c1f56239e95))


### Continuous Integration

* add arm64 linux deployment ([#10134](https://github.com/aws-amplify/amplify-cli/issues/10134)) ([f04af99](https://github.com/aws-amplify/amplify-cli/commit/f04af99f4877987e75eb025e3855ea1e64dff8ab))


### BREAKING CHANGES

* to make sure lerna does the right thing
* needed to make lerna behave

Co-authored-by: John Corser <xss@amazon.com>





## [7.6.26](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@7.6.25...@aws-amplify/cli@7.6.26) (2022-03-23)


### Bug Fixes

* make amplify prompts dependency explicit, lint errors ([#10007](https://github.com/aws-amplify/amplify-cli/issues/10007)) ([66cdc06](https://github.com/aws-amplify/amplify-cli/commit/66cdc06df5f4cba106345af6f6e196b3c3e39445))





## [7.6.25](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@7.6.24...@aws-amplify/cli@7.6.25) (2022-03-17)



## 7.6.25 (2022-03-16)


### Bug Fixes

* **amplify-category-auth:** expand [@auth](https://github.com/auth) directive to explicit set of allowed operations ([#9859](https://github.com/aws-amplify/amplify-cli/issues/9859)) ([e44ed18](https://github.com/aws-amplify/amplify-cli/commit/e44ed189b2c94230cbd5674606ffa488cb6c7bfe))





## [7.6.24](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@7.6.23...@aws-amplify/cli@7.6.24) (2022-03-14)

**Note:** Version bump only for package @aws-amplify/cli





## [7.6.23](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@7.6.22...@aws-amplify/cli@7.6.23) (2022-03-07)


### Bug Fixes

* **cli:** fix notification logic when API resource directory doesn't exist ([#9796](https://github.com/aws-amplify/amplify-cli/issues/9796)) ([5238264](https://github.com/aws-amplify/amplify-cli/commit/52382644a7fb3d242c9498785f3aa3293d19daf4)), closes [#9721](https://github.com/aws-amplify/amplify-cli/issues/9721)
* get the defaultEditor value from the localEnvInfo context variable ([#9783](https://github.com/aws-amplify/amplify-cli/issues/9783)) ([cdb5aec](https://github.com/aws-amplify/amplify-cli/commit/cdb5aec151060280e50ce755cd45bcc2fad84479)), closes [#8356](https://github.com/aws-amplify/amplify-cli/issues/8356)


### Performance Improvements

* remove ESM loader to speed up CLI execution ([#9873](https://github.com/aws-amplify/amplify-cli/issues/9873)) ([46ada02](https://github.com/aws-amplify/amplify-cli/commit/46ada029a7914b75c356c3ae9dcd782ffa324b2a))





## [7.6.22](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@7.6.21...@aws-amplify/cli@7.6.22) (2022-02-25)
## [7.6.26](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@7.6.21...@aws-amplify/cli@7.6.26) (2022-02-28)


### Bug Fixes

* **cli:** fix notification logic when API resource directory doesn't exist ([#9796](https://github.com/aws-amplify/amplify-cli/issues/9796)) ([5238264](https://github.com/aws-amplify/amplify-cli/commit/52382644a7fb3d242c9498785f3aa3293d19daf4)), closes [#9721](https://github.com/aws-amplify/amplify-cli/issues/9721)
* get the defaultEditor value from the localEnvInfo context variable ([#9783](https://github.com/aws-amplify/amplify-cli/issues/9783)) ([cdb5aec](https://github.com/aws-amplify/amplify-cli/commit/cdb5aec151060280e50ce755cd45bcc2fad84479)), closes [#8356](https://github.com/aws-amplify/amplify-cli/issues/8356)





## [7.6.25](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@7.6.21...@aws-amplify/cli@7.6.25) (2022-02-28)


### Bug Fixes

* **cli:** fix notification logic when API resource directory doesn't exist ([#9796](https://github.com/aws-amplify/amplify-cli/issues/9796)) ([5238264](https://github.com/aws-amplify/amplify-cli/commit/52382644a7fb3d242c9498785f3aa3293d19daf4)), closes [#9721](https://github.com/aws-amplify/amplify-cli/issues/9721)
* get the defaultEditor value from the localEnvInfo context variable ([#9783](https://github.com/aws-amplify/amplify-cli/issues/9783)) ([cdb5aec](https://github.com/aws-amplify/amplify-cli/commit/cdb5aec151060280e50ce755cd45bcc2fad84479)), closes [#8356](https://github.com/aws-amplify/amplify-cli/issues/8356)





## [7.6.24](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@7.6.21...@aws-amplify/cli@7.6.24) (2022-02-28)


### Bug Fixes

* **cli:** fix notification logic when API resource directory doesn't exist ([#9796](https://github.com/aws-amplify/amplify-cli/issues/9796)) ([5238264](https://github.com/aws-amplify/amplify-cli/commit/52382644a7fb3d242c9498785f3aa3293d19daf4)), closes [#9721](https://github.com/aws-amplify/amplify-cli/issues/9721)
* get the defaultEditor value from the localEnvInfo context variable ([#9783](https://github.com/aws-amplify/amplify-cli/issues/9783)) ([cdb5aec](https://github.com/aws-amplify/amplify-cli/commit/cdb5aec151060280e50ce755cd45bcc2fad84479)), closes [#8356](https://github.com/aws-amplify/amplify-cli/issues/8356)





## [7.6.23](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/cli@7.6.21...@aws-amplify/cli@7.6.23) (2022-02-28)


### Bug Fixes

* **cli:** fix notification logic when API resource directory doesn't exist ([#9796](https://github.com/aws-amplify/amplify-cli/issues/9796)) ([5238264](https://github.com/aws-amplify/amplify-cli/commit/52382644a7fb3d242c9498785f3aa3293d19daf4)), closes [#9721](https://github.com/aws-amplify/amplify-cli/issues/9721)
* get the defaultEditor value from the localEnvInfo context variable ([#9783](https://github.com/aws-amplify/amplify-cli/issues/9783)) ([cdb5aec](https://github.com/aws-amplify/amplify-cli/commit/cdb5aec151060280e50ce755cd45bcc2fad84479)), closes [#8356](https://github.com/aws-amplify/amplify-cli/issues/8356)
