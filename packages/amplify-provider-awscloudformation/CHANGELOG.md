# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.0.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.13.2...amplify-provider-awscloudformation@3.0.0) (2019-08-30)


### Bug Fixes

* [#1056](https://github.com/aws-amplify/amplify-cli/issues/1056), dedup environment file reading ([#2088](https://github.com/aws-amplify/amplify-cli/issues/2088)) ([940deaa](https://github.com/aws-amplify/amplify-cli/commit/940deaa))
* [#429](https://github.com/aws-amplify/amplify-cli/issues/429) - Editor hanging bug ([#2086](https://github.com/aws-amplify/amplify-cli/issues/2086)) ([6767445](https://github.com/aws-amplify/amplify-cli/commit/6767445))
* fix metric agent for tracking CLI usage ([#2024](https://github.com/aws-amplify/amplify-cli/issues/2024)) ([a2742a6](https://github.com/aws-amplify/amplify-cli/commit/a2742a6))
* Fix package.json exists check for functions ([#2030](https://github.com/aws-amplify/amplify-cli/issues/2030)) ([a5283b7](https://github.com/aws-amplify/amplify-cli/commit/a5283b7))
* move test package dependencies to devDependencies ([#2034](https://github.com/aws-amplify/amplify-cli/issues/2034)) ([f5623d0](https://github.com/aws-amplify/amplify-cli/commit/f5623d0))


### Features

* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
* mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
* **amplify-provider-awscloudformation:** hooks ([#1951](https://github.com/aws-amplify/amplify-cli/issues/1951)) ([caba157](https://github.com/aws-amplify/amplify-cli/commit/caba157))
* narrow-down idp roles scope ([#1974](https://github.com/aws-amplify/amplify-cli/issues/1974)) ([ccfd508](https://github.com/aws-amplify/amplify-cli/commit/ccfd508))
* sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))


* Adding Auth on Subscriptions (#2068) ([81c630d](https://github.com/aws-amplify/amplify-cli/commit/81c630d)), closes [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068)


### BREAKING CHANGES

* If an owner is used in the auth directive it will either be a requirement if it's
the only rule or an optional input if used with other rules
* If an owner is included in the auth directive it will either be a requirement if
it's the only rule or an optional input if used with other rules
* the subscription operations will require an argument if owner is the only auth rule
* Subscriptions will require an argument if an owner is only rule set - If owner &
group rules are owner will be an optional arg





# [2.0.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.13.2...amplify-provider-awscloudformation@2.0.0) (2019-08-28)


### Bug Fixes

* [#1056](https://github.com/aws-amplify/amplify-cli/issues/1056), dedup environment file reading ([#2088](https://github.com/aws-amplify/amplify-cli/issues/2088)) ([940deaa](https://github.com/aws-amplify/amplify-cli/commit/940deaa))
* [#429](https://github.com/aws-amplify/amplify-cli/issues/429) - Editor hanging bug ([#2086](https://github.com/aws-amplify/amplify-cli/issues/2086)) ([6767445](https://github.com/aws-amplify/amplify-cli/commit/6767445))
* fix metric agent for tracking CLI usage ([#2024](https://github.com/aws-amplify/amplify-cli/issues/2024)) ([a2742a6](https://github.com/aws-amplify/amplify-cli/commit/a2742a6))
* Fix package.json exists check for functions ([#2030](https://github.com/aws-amplify/amplify-cli/issues/2030)) ([a5283b7](https://github.com/aws-amplify/amplify-cli/commit/a5283b7))
* move test package dependencies to devDependencies ([#2034](https://github.com/aws-amplify/amplify-cli/issues/2034)) ([f5623d0](https://github.com/aws-amplify/amplify-cli/commit/f5623d0))


### Features

* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
* mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
* **amplify-provider-awscloudformation:** hooks ([#1951](https://github.com/aws-amplify/amplify-cli/issues/1951)) ([caba157](https://github.com/aws-amplify/amplify-cli/commit/caba157))
* narrow-down idp roles scope ([#1974](https://github.com/aws-amplify/amplify-cli/issues/1974)) ([ccfd508](https://github.com/aws-amplify/amplify-cli/commit/ccfd508))
* sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))


* Adding Auth on Subscriptions (#2068) ([81c630d](https://github.com/aws-amplify/amplify-cli/commit/81c630d)), closes [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068)


### BREAKING CHANGES

* If an owner is used in the auth directive it will either be a requirement if it's
the only rule or an optional input if used with other rules
* If an owner is included in the auth directive it will either be a requirement if
it's the only rule or an optional input if used with other rules
* the subscription operations will require an argument if owner is the only auth rule
* Subscriptions will require an argument if an owner is only rule set - If owner &
group rules are owner will be an optional arg





# [1.17.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.13.2...amplify-provider-awscloudformation@1.17.0) (2019-08-13)


### Bug Fixes

* fix metric agent for tracking CLI usage ([#2024](https://github.com/aws-amplify/amplify-cli/issues/2024)) ([a2742a6](https://github.com/aws-amplify/amplify-cli/commit/a2742a6))
* Fix package.json exists check for functions ([#2030](https://github.com/aws-amplify/amplify-cli/issues/2030)) ([a5283b7](https://github.com/aws-amplify/amplify-cli/commit/a5283b7))


### Features

* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
* mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
* **amplify-provider-awscloudformation:** hooks ([#1951](https://github.com/aws-amplify/amplify-cli/issues/1951)) ([caba157](https://github.com/aws-amplify/amplify-cli/commit/caba157))
* narrow-down idp roles scope ([#1974](https://github.com/aws-amplify/amplify-cli/issues/1974)) ([ccfd508](https://github.com/aws-amplify/amplify-cli/commit/ccfd508))
* sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))





# [1.16.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.13.2...amplify-provider-awscloudformation@1.16.0) (2019-08-07)


### Features

* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
* mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
* sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))





# [1.15.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.13.2...amplify-provider-awscloudformation@1.15.0) (2019-08-02)


### Features

* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
* sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))





# [1.14.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.13.2...amplify-provider-awscloudformation@1.14.0) (2019-07-31)


### Features

* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
* sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))





## [1.13.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.13.1...amplify-provider-awscloudformation@1.13.2) (2019-07-24)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [1.13.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.13.0...amplify-provider-awscloudformation@1.13.1) (2019-07-23)


### Bug Fixes

* **amplify-provider-awscloudformation:** fix MFA prompt during init ([#1858](https://github.com/aws-amplify/amplify-cli/issues/1858)) ([2de3185](https://github.com/aws-amplify/amplify-cli/commit/2de3185)), closes [#1807](https://github.com/aws-amplify/amplify-cli/issues/1807)





# [1.13.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.12.2...amplify-provider-awscloudformation@1.13.0) (2019-07-09)


### Bug Fixes

* **amplify-category-function:** enable SAM templates for functions ([#1763](https://github.com/aws-amplify/amplify-cli/issues/1763)) ([9fc3854](https://github.com/aws-amplify/amplify-cli/commit/9fc3854)), closes [#1740](https://github.com/aws-amplify/amplify-cli/issues/1740)


### Features

* cognito + s3 + dyanmodb lambda trigger support ([#1783](https://github.com/aws-amplify/amplify-cli/issues/1783)) ([c6fc838](https://github.com/aws-amplify/amplify-cli/commit/c6fc838))





## [1.12.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.12.0...amplify-provider-awscloudformation@1.12.2) (2019-06-30)


### Bug Fixes

* fixing function build issue + e2e tests ([#1750](https://github.com/aws-amplify/amplify-cli/issues/1750)) ([c11c0bc](https://github.com/aws-amplify/amplify-cli/commit/c11c0bc)), closes [#1747](https://github.com/aws-amplify/amplify-cli/issues/1747)





# [1.12.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.11.5...amplify-provider-awscloudformation@1.12.0) (2019-06-26)


### Bug Fixes

* **amplify-provider-awscloudformation:** generate consistent S3 keys ([#1668](https://github.com/aws-amplify/amplify-cli/issues/1668)) ([e393d3a](https://github.com/aws-amplify/amplify-cli/commit/e393d3a)), closes [#1666](https://github.com/aws-amplify/amplify-cli/issues/1666)


### Features

* **amplify-provider-awscloudformation:** update fn build file name ([#1702](https://github.com/aws-amplify/amplify-cli/issues/1702)) ([0658d75](https://github.com/aws-amplify/amplify-cli/commit/0658d75))





## [1.11.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.11.4...amplify-provider-awscloudformation@1.11.5) (2019-06-20)


### Bug Fixes

* **cli:** fix inquirer version ([#1690](https://github.com/aws-amplify/amplify-cli/issues/1690)) ([9246032](https://github.com/aws-amplify/amplify-cli/commit/9246032)), closes [#1688](https://github.com/aws-amplify/amplify-cli/issues/1688)





## [1.11.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.11.3...amplify-provider-awscloudformation@1.11.4) (2019-06-18)


### Bug Fixes

* **amplify-provider-awscloudformation:** prevent abrupt closing of CLI ([#1655](https://github.com/aws-amplify/amplify-cli/issues/1655)) ([cf755df](https://github.com/aws-amplify/amplify-cli/commit/cf755df))





## [1.11.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.11.2...amplify-provider-awscloudformation@1.11.3) (2019-06-12)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [1.11.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.11.1...amplify-provider-awscloudformation@1.11.2) (2019-06-11)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [1.11.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.11.0...amplify-provider-awscloudformation@1.11.1) (2019-06-06)


### Bug Fixes

* **amplify-provider-awscloudformation:** filter by template extensions ([#1596](https://github.com/aws-amplify/amplify-cli/issues/1596)) ([adbf95a](https://github.com/aws-amplify/amplify-cli/commit/adbf95a))
* **amplify-provider-awscloudformation:** fix general configeLevel init ([#1602](https://github.com/aws-amplify/amplify-cli/issues/1602)) ([426acbf](https://github.com/aws-amplify/amplify-cli/commit/426acbf)), closes [#1388](https://github.com/aws-amplify/amplify-cli/issues/1388)
* **amplify-provider-awscloudformation:** fix http proxy ([#1604](https://github.com/aws-amplify/amplify-cli/issues/1604)) ([16dc4b4](https://github.com/aws-amplify/amplify-cli/commit/16dc4b4)), closes [#495](https://github.com/aws-amplify/amplify-cli/issues/495)





# [1.11.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.10.0...amplify-provider-awscloudformation@1.11.0) (2019-05-29)


### Features

* feature/[@key](https://github.com/key) ([#1463](https://github.com/aws-amplify/amplify-cli/issues/1463)) ([00ed819](https://github.com/aws-amplify/amplify-cli/commit/00ed819))





# [1.10.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.9.1...amplify-provider-awscloudformation@1.10.0) (2019-05-21)


### Features

* **amplify-provider-awscloudformation:** add http default transformer ([#1410](https://github.com/aws-amplify/amplify-cli/issues/1410)) ([41cd9d0](https://github.com/aws-amplify/amplify-cli/commit/41cd9d0))





## [1.9.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.9.0...amplify-provider-awscloudformation@1.9.1) (2019-05-17)


### Bug Fixes

* **amplify-provider-awscloudformation:** check creds before setting ([#1438](https://github.com/aws-amplify/amplify-cli/issues/1438)) ([0c2e2d1](https://github.com/aws-amplify/amplify-cli/commit/0c2e2d1)), closes [#1424](https://github.com/aws-amplify/amplify-cli/issues/1424)
* **amplify-provider-awscloudformation:** ensure build directory exist ([#1435](https://github.com/aws-amplify/amplify-cli/issues/1435)) ([a82fa99](https://github.com/aws-amplify/amplify-cli/commit/a82fa99)), closes [#1430](https://github.com/aws-amplify/amplify-cli/issues/1430) [#1430](https://github.com/aws-amplify/amplify-cli/issues/1430)





# [1.9.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.8.0...amplify-provider-awscloudformation@1.9.0) (2019-05-07)


### Bug Fixes

* **1342:** api push error on CI/CD platforms. ([#1383](https://github.com/aws-amplify/amplify-cli/issues/1383)) ([e0eff65](https://github.com/aws-amplify/amplify-cli/commit/e0eff65)), closes [#1342](https://github.com/aws-amplify/amplify-cli/issues/1342) [#1342](https://github.com/aws-amplify/amplify-cli/issues/1342)
* **amplify-provider-awscloudformation:** support multiprofile delete ([#1353](https://github.com/aws-amplify/amplify-cli/issues/1353)) ([404f1c3](https://github.com/aws-amplify/amplify-cli/commit/404f1c3)), closes [#978](https://github.com/aws-amplify/amplify-cli/issues/978)


### Features

* bump aws-sdk ver to support mixed auth ([#1414](https://github.com/aws-amplify/amplify-cli/issues/1414)) ([b2ed52b](https://github.com/aws-amplify/amplify-cli/commit/b2ed52b))





## [1.8.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.8.0...amplify-provider-awscloudformation@1.8.1) (2019-05-06)


### Bug Fixes

* **1342:** api push error on CI/CD platforms. ([#1383](https://github.com/aws-amplify/amplify-cli/issues/1383)) ([e0eff65](https://github.com/aws-amplify/amplify-cli/commit/e0eff65)), closes [#1342](https://github.com/aws-amplify/amplify-cli/issues/1342) [#1342](https://github.com/aws-amplify/amplify-cli/issues/1342)
* **amplify-provider-awscloudformation:** support multiprofile delete ([#1353](https://github.com/aws-amplify/amplify-cli/issues/1353)) ([404f1c3](https://github.com/aws-amplify/amplify-cli/commit/404f1c3)), closes [#978](https://github.com/aws-amplify/amplify-cli/issues/978)





# [1.8.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.7.1...amplify-provider-awscloudformation@1.8.0) (2019-04-30)


### Bug Fixes

* update CLI to handle UTF8 BOM ([#1357](https://github.com/aws-amplify/amplify-cli/issues/1357)) ([b0afa07](https://github.com/aws-amplify/amplify-cli/commit/b0afa07)), closes [#1355](https://github.com/aws-amplify/amplify-cli/issues/1355) [#1122](https://github.com/aws-amplify/amplify-cli/issues/1122)


### Features

* **amplify-provider-awscloudformation:** append env name ([8d8e522](https://github.com/aws-amplify/amplify-cli/commit/8d8e522)), closes [#1340](https://github.com/aws-amplify/amplify-cli/issues/1340)





## [1.7.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.7.0...amplify-provider-awscloudformation@1.7.1) (2019-04-25)

**Note:** Version bump only for package amplify-provider-awscloudformation





# [1.7.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.6.1...amplify-provider-awscloudformation@1.7.0) (2019-04-16)


### Bug Fixes

* **amplify-provider-awscloudformation:** ignore dot files ([#1256](https://github.com/aws-amplify/amplify-cli/issues/1256)) ([845298a](https://github.com/aws-amplify/amplify-cli/commit/845298a)), closes [#1135](https://github.com/aws-amplify/amplify-cli/issues/1135)


### Features

* add support for ap-northeast-2 ([a263afc](https://github.com/aws-amplify/amplify-cli/commit/a263afc))
* **field-level-auth:** Add field level auth support via the [@auth](https://github.com/auth) directive ([#1262](https://github.com/aws-amplify/amplify-cli/issues/1262)) ([3b1c600](https://github.com/aws-amplify/amplify-cli/commit/3b1c600)), closes [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)





## [1.6.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.5.0...amplify-provider-awscloudformation@1.6.1) (2019-04-09)

**Note:** Version bump only for package amplify-provider-awscloudformation





# [1.5.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.1.3...amplify-provider-awscloudformation@1.5.0) (2019-04-03)


### Features

* support for provisioning Cognito Hosted UI and support CRUD operations in Storage and API categories ([729b0de](https://github.com/aws-amplify/amplify-cli/commit/729b0de))





## [1.1.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.1.2...amplify-provider-awscloudformation@1.1.3) (2019-03-22)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [1.1.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.1.1...amplify-provider-awscloudformation@1.1.2) (2019-03-05)


### Bug Fixes

* ignore file starting with a dot when compiling configs ([#905](https://github.com/aws-amplify/amplify-cli/issues/905)) ([f094160](https://github.com/aws-amplify/amplify-cli/commit/f094160))


### Performance Improvements

* speed up push ([#963](https://github.com/aws-amplify/amplify-cli/issues/963)) ([eb8b852](https://github.com/aws-amplify/amplify-cli/commit/eb8b852)), closes [#914](https://github.com/aws-amplify/amplify-cli/issues/914)





## [1.1.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.1.0...amplify-provider-awscloudformation@1.1.1) (2019-02-26)

**Note:** Version bump only for package amplify-provider-awscloudformation





# [1.1.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.0.10...amplify-provider-awscloudformation@1.1.0) (2019-02-25)


### Bug Fixes

* **amplify-provider-awscloudformation:** fix [#931](https://github.com/aws-amplify/amplify-cli/issues/931) ([bc724c9](https://github.com/aws-amplify/amplify-cli/commit/bc724c9))


### Features

* **amplify-provider-awscloudformation:** show CFN error when push fail  ([#917](https://github.com/aws-amplify/amplify-cli/issues/917)) ([4502e4f](https://github.com/aws-amplify/amplify-cli/commit/4502e4f))





## [1.0.10](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.0.9...amplify-provider-awscloudformation@1.0.10) (2019-02-22)


### Bug Fixes

* **amplify-provider-awscloudformation:** fix pinpoint console url ([#912](https://github.com/aws-amplify/amplify-cli/issues/912)) ([77e3af6](https://github.com/aws-amplify/amplify-cli/commit/77e3af6)), closes [#910](https://github.com/aws-amplify/amplify-cli/issues/910)





## [1.0.9](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.0.8...amplify-provider-awscloudformation@1.0.9) (2019-02-20)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [1.0.8](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.0.6...amplify-provider-awscloudformation@1.0.8) (2019-02-15)


### Bug Fixes

* add check for presence of s3template when forming nested cfn stack ([cc90080](https://github.com/aws-amplify/amplify-cli/commit/cc90080))
* copy providerMetadata to amplify-meta during env init ([#880](https://github.com/aws-amplify/amplify-cli/issues/880)) ([b9c5f67](https://github.com/aws-amplify/amplify-cli/commit/b9c5f67))
* remove console statement ([055967e](https://github.com/aws-amplify/amplify-cli/commit/055967e))





## [1.0.7](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.0.6...amplify-provider-awscloudformation@1.0.7) (2019-02-14)


### Bug Fixes

* add check for presence of s3template when forming nested cfn stack ([cc90080](https://github.com/aws-amplify/amplify-cli/commit/cc90080))
* remove console statement ([055967e](https://github.com/aws-amplify/amplify-cli/commit/055967e))





## [1.0.6](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.0.5...amplify-provider-awscloudformation@1.0.6) (2019-02-12)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [1.0.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.0.3-beta.0...amplify-provider-awscloudformation@1.0.5) (2019-02-11)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [1.0.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.0.3-beta.0...amplify-provider-awscloudformation@1.0.3) (2019-02-11)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [1.0.3-beta.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.0.2...amplify-provider-awscloudformation@1.0.3-beta.0) (2019-02-11)

**Note:** Version bump only for package amplify-provider-awscloudformation





<a name="0.2.1-multienv.30"></a>
## [0.2.1-multienv.30](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.29...amplify-provider-awscloudformation@0.2.1-multienv.30) (2019-01-30)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.29"></a>
## [0.2.1-multienv.29](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.28...amplify-provider-awscloudformation@0.2.1-multienv.29) (2019-01-29)


### Bug Fixes

* **amplify-provider-awscloudformation:** delete project without profile ([#788](https://github.com/aws-amplify/amplify-cli/issues/788)) ([a943adf](https://github.com/aws-amplify/amplify-cli/commit/a943adf))




<a name="0.2.1-multienv.28"></a>
## [0.2.1-multienv.28](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.27...amplify-provider-awscloudformation@0.2.1-multienv.28) (2019-01-25)


### Bug Fixes

* **amplify-provider-awscloudformation:** fix amplify delete error ([#771](https://github.com/aws-amplify/amplify-cli/issues/771)) ([13bc475](https://github.com/aws-amplify/amplify-cli/commit/13bc475))




<a name="0.2.1-multienv.27"></a>
## [0.2.1-multienv.27](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.26...amplify-provider-awscloudformation@0.2.1-multienv.27) (2019-01-25)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.26"></a>
## [0.2.1-multienv.26](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.25...amplify-provider-awscloudformation@0.2.1-multienv.26) (2019-01-24)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.25"></a>
## [0.2.1-multienv.25](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.24...amplify-provider-awscloudformation@0.2.1-multienv.25) (2019-01-22)


### Bug Fixes

* [#677](https://github.com/aws-amplify/amplify-cli/issues/677) ([#749](https://github.com/aws-amplify/amplify-cli/issues/749)) ([822060c](https://github.com/aws-amplify/amplify-cli/commit/822060c))




<a name="0.2.1-multienv.24"></a>
## [0.2.1-multienv.24](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.23...amplify-provider-awscloudformation@0.2.1-multienv.24) (2019-01-22)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.23"></a>
## [0.2.1-multienv.23](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.22...amplify-provider-awscloudformation@0.2.1-multienv.23) (2019-01-22)


### Bug Fixes

* **amplify-provider-awscloudformation:** batch cfn status polling ([#723](https://github.com/aws-amplify/amplify-cli/issues/723)) ([732fda1](https://github.com/aws-amplify/amplify-cli/commit/732fda1))




<a name="0.2.1-multienv.22"></a>
## [0.2.1-multienv.22](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.21...amplify-provider-awscloudformation@0.2.1-multienv.22) (2019-01-19)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.21"></a>
## [0.2.1-multienv.21](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.20...amplify-provider-awscloudformation@0.2.1-multienv.21) (2019-01-16)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.20"></a>
## [0.2.1-multienv.20](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.19...amplify-provider-awscloudformation@0.2.1-multienv.20) (2019-01-14)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.19"></a>
## [0.2.1-multienv.19](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.18...amplify-provider-awscloudformation@0.2.1-multienv.19) (2019-01-14)


### Features

* **amplify-provider-awscloudformation:** add pinpoint eu-central-1 region ([da6d3fb](https://github.com/aws-amplify/amplify-cli/commit/da6d3fb))




<a name="0.2.1-multienv.18"></a>
## [0.2.1-multienv.18](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.17...amplify-provider-awscloudformation@0.2.1-multienv.18) (2019-01-10)


### Bug Fixes

* **amplify-provider-awscloudformation:** fix profile loading ([#688](https://github.com/aws-amplify/amplify-cli/issues/688)) ([e96694b](https://github.com/aws-amplify/amplify-cli/commit/e96694b))




<a name="0.2.1-multienv.17"></a>
## [0.2.1-multienv.17](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.16...amplify-provider-awscloudformation@0.2.1-multienv.17) (2019-01-08)


### Features

* **amplify-provider-awscloudformation:** assume role ([#669](https://github.com/aws-amplify/amplify-cli/issues/669)) ([c3204bc](https://github.com/aws-amplify/amplify-cli/commit/c3204bc))




<a name="0.2.1-multienv.16"></a>
## [0.2.1-multienv.16](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.15...amplify-provider-awscloudformation@0.2.1-multienv.16) (2019-01-08)


### Bug Fixes

* **amplify-provider-awscloudformation:** fix region missing error ([#676](https://github.com/aws-amplify/amplify-cli/issues/676)) ([107ceac](https://github.com/aws-amplify/amplify-cli/commit/107ceac)), closes [#559](https://github.com/aws-amplify/amplify-cli/issues/559) [#559](https://github.com/aws-amplify/amplify-cli/issues/559)




<a name="0.2.1-multienv.15"></a>
## [0.2.1-multienv.15](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.14...amplify-provider-awscloudformation@0.2.1-multienv.15) (2018-12-31)


### Bug Fixes

* update grahql transformer package versions for multienv ([8b4b2bd](https://github.com/aws-amplify/amplify-cli/commit/8b4b2bd))




<a name="0.2.1-multienv.14"></a>
## [0.2.1-multienv.14](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.13...amplify-provider-awscloudformation@0.2.1-multienv.14) (2018-12-28)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.13"></a>
## [0.2.1-multienv.13](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.12...amplify-provider-awscloudformation@0.2.1-multienv.13) (2018-12-27)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.12"></a>
## [0.2.1-multienv.12](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.11...amplify-provider-awscloudformation@0.2.1-multienv.12) (2018-12-27)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.11"></a>
## [0.2.1-multienv.11](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.10...amplify-provider-awscloudformation@0.2.1-multienv.11) (2018-12-21)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.10"></a>
## [0.2.1-multienv.10](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.9...amplify-provider-awscloudformation@0.2.1-multienv.10) (2018-12-19)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.9"></a>
## [0.2.1-multienv.9](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.8...amplify-provider-awscloudformation@0.2.1-multienv.9) (2018-12-10)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.8"></a>
## [0.2.1-multienv.8](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.7...amplify-provider-awscloudformation@0.2.1-multienv.8) (2018-12-10)


### Bug Fixes

* **amplify-provider-awscloudformation:** fix: [#559](https://github.com/aws-amplify/amplify-cli/issues/559) ([#563](https://github.com/aws-amplify/amplify-cli/issues/563)) ([69d74be](https://github.com/aws-amplify/amplify-cli/commit/69d74be))




<a name="0.2.1-multienv.7"></a>
## [0.2.1-multienv.7](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.5...amplify-provider-awscloudformation@0.2.1-multienv.7) (2018-12-07)


### Bug Fixes

* **cli:** remove calls to gluegun's prompt.confirm ([#546](https://github.com/aws-amplify/amplify-cli/issues/546)) ([0080ddb](https://github.com/aws-amplify/amplify-cli/commit/0080ddb))




<a name="0.2.1-multienv.6"></a>
## [0.2.1-multienv.6](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.5...amplify-provider-awscloudformation@0.2.1-multienv.6) (2018-12-05)


### Bug Fixes

* **cli:** remove calls to gluegun's prompt.confirm ([#546](https://github.com/aws-amplify/amplify-cli/issues/546)) ([0080ddb](https://github.com/aws-amplify/amplify-cli/commit/0080ddb))




<a name="0.2.1-multienv.5"></a>
## [0.2.1-multienv.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.4...amplify-provider-awscloudformation@0.2.1-multienv.5) (2018-12-04)


### Bug Fixes

* **amplify-provider-awscloudformation:** trim profile name ([904f639](https://github.com/aws-amplify/amplify-cli/commit/904f639)), closes [#542](https://github.com/aws-amplify/amplify-cli/issues/542)




<a name="0.2.1-multienv.4"></a>
## [0.2.1-multienv.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.3...amplify-provider-awscloudformation@0.2.1-multienv.4) (2018-12-04)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.3"></a>
## [0.2.1-multienv.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.2...amplify-provider-awscloudformation@0.2.1-multienv.3) (2018-12-04)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.2"></a>
## [0.2.1-multienv.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.1...amplify-provider-awscloudformation@0.2.1-multienv.2) (2018-11-30)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.1"></a>
## [0.2.1-multienv.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.0...amplify-provider-awscloudformation@0.2.1-multienv.1) (2018-11-28)


### Features

* Multienv auth migrate ([#498](https://github.com/aws-amplify/amplify-cli/issues/498)) ([ef3e3b3](https://github.com/aws-amplify/amplify-cli/commit/ef3e3b3))




<a name="0.2.1-multienv.0"></a>
## [0.2.1-multienv.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.35-multienv.3...amplify-provider-awscloudformation@0.2.1-multienv.0) (2018-11-21)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.35-multienv.3"></a>
## [0.1.35-multienv.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.35-multienv.2...amplify-provider-awscloudformation@0.1.35-multienv.3) (2018-11-20)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.35-multienv.2"></a>
## [0.1.35-multienv.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.35-multienv.1...amplify-provider-awscloudformation@0.1.35-multienv.2) (2018-11-19)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.35-multienv.1"></a>
## [0.1.35-multienv.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.35-multienv.0...amplify-provider-awscloudformation@0.1.35-multienv.1) (2018-11-19)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.35-multienv.0"></a>
## [0.1.35-multienv.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.34...amplify-provider-awscloudformation@0.1.35-multienv.0) (2018-11-16)


### Bug Fixes

* fix projectPath references in ios and codegen packages & fix for  correct AWS profile pickup in the cloudformation provider ([a73656e](https://github.com/aws-amplify/amplify-cli/commit/a73656e))


### Features

* added amplify env sync and amplify env checkout command & added help commands for env  ([#430](https://github.com/aws-amplify/amplify-cli/issues/430)) ([de72729](https://github.com/aws-amplify/amplify-cli/commit/de72729))
* amplify env remove and ampify delete command for multi envs ([#458](https://github.com/aws-amplify/amplify-cli/issues/458)) ([ddca3bc](https://github.com/aws-amplify/amplify-cli/commit/ddca3bc))
* headless Init and configure ([#371](https://github.com/aws-amplify/amplify-cli/issues/371)) ([acd14a8](https://github.com/aws-amplify/amplify-cli/commit/acd14a8))
* multiple evironment support for analytics and s3 storage ([0400f26](https://github.com/aws-amplify/amplify-cli/commit/0400f26))




<a name="0.1.34"></a>
## [0.1.34](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.34-beta.0...amplify-provider-awscloudformation@0.1.34) (2018-11-13)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.34-beta.0"></a>
## [0.1.34-beta.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.33...amplify-provider-awscloudformation@0.1.34-beta.0) (2018-11-13)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.33"></a>
## [0.1.33](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.33-beta.0...amplify-provider-awscloudformation@0.1.33) (2018-11-09)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.33-beta.0"></a>
## [0.1.33-beta.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.12...amplify-provider-awscloudformation@0.1.33-beta.0) (2018-11-09)


### Bug Fixes

* **amplify-provider-awscloudformation:** Fixes lambda function src files changes detection ([b0f216f](https://github.com/aws-amplify/amplify-cli/commit/b0f216f))




<a name="0.1.32"></a>
## [0.1.32](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.32-beta.0...amplify-provider-awscloudformation@0.1.32) (2018-11-05)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.32-beta.0"></a>
## [0.1.32-beta.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.12...amplify-provider-awscloudformation@0.1.32-beta.0) (2018-11-05)


### Bug Fixes

* **amplify-provider-awscloudformation:** Fixes lambda function src files changes detection ([b0f216f](https://github.com/aws-amplify/amplify-cli/commit/b0f216f))




<a name="0.1.31"></a>
## [0.1.31](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.12...amplify-provider-awscloudformation@0.1.31) (2018-11-02)


### Bug Fixes

* **amplify-provider-awscloudformation:** Fixes lambda function src files changes detection ([b0f216f](https://github.com/aws-amplify/amplify-cli/commit/b0f216f))




<a name="0.1.30"></a>
## [0.1.30](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.30-beta.0...amplify-provider-awscloudformation@0.1.30) (2018-11-02)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.30-beta.0"></a>
## [0.1.30-beta.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.12...amplify-provider-awscloudformation@0.1.30-beta.0) (2018-11-02)


### Bug Fixes

* **amplify-provider-awscloudformation:** Fixes lambda function src files changes detection ([b0f216f](https://github.com/aws-amplify/amplify-cli/commit/b0f216f))




<a name="0.1.29"></a>
## [0.1.29](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.29-beta.0...amplify-provider-awscloudformation@0.1.29) (2018-10-23)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.29-beta.0"></a>
## [0.1.29-beta.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.12...amplify-provider-awscloudformation@0.1.29-beta.0) (2018-10-23)


### Bug Fixes

* **amplify-provider-awscloudformation:** Fixes lambda function src files changes detection ([b0f216f](https://github.com/aws-amplify/amplify-cli/commit/b0f216f))




<a name="0.1.28"></a>
## [0.1.28](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.28-beta.0...amplify-provider-awscloudformation@0.1.28) (2018-10-18)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.28-beta.0"></a>
## [0.1.28-beta.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.12...amplify-provider-awscloudformation@0.1.28-beta.0) (2018-10-12)


### Bug Fixes

* **amplify-provider-awscloudformation:** Fixes lambda function src files changes detection ([b0f216f](https://github.com/aws-amplify/amplify-cli/commit/b0f216f))




<a name="0.1.12"></a>
## [0.1.12](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.11...amplify-provider-awscloudformation@0.1.12) (2018-08-23)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.11"></a>
## [0.1.11](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.10...amplify-provider-awscloudformation@0.1.11) (2018-08-23)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.10"></a>
## [0.1.10](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.9...amplify-provider-awscloudformation@0.1.10) (2018-08-23)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.9"></a>
## [0.1.9](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.8...amplify-provider-awscloudformation@0.1.9) (2018-08-23)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.8"></a>
## [0.1.8](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.7...amplify-provider-awscloudformation@0.1.8) (2018-08-23)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.7"></a>
## [0.1.7](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.6...amplify-provider-awscloudformation@0.1.7) (2018-08-23)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.6"></a>
## [0.1.6](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.5...amplify-provider-awscloudformation@0.1.6) (2018-08-23)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.5"></a>
## [0.1.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.4...amplify-provider-awscloudformation@0.1.5) (2018-08-23)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.4"></a>
## 0.1.4 (2018-08-23)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.3"></a>
## 0.1.3 (2018-08-23)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.2"></a>
## 0.1.2 (2018-08-23)




**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.1"></a>
## 0.1.1 (2018-08-23)




**Note:** Version bump only for package amplify-provider-awscloudformation
