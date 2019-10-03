# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.0.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.7.5...graphql-transformer-core@5.0.0) (2019-08-30)


### Bug Fixes

* [#1715](https://github.com/aws-amplify/amplify-cli/issues/1715) - Fix stack enumeration so transform.conf.json will be generated ([#2114](https://github.com/aws-amplify/amplify-cli/issues/2114)) ([d1b266b](https://github.com/aws-amplify/amplify-cli/commit/d1b266b))


### Features

* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
* mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
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





# [4.0.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.7.5...graphql-transformer-core@4.0.0) (2019-08-28)


### Bug Fixes

* [#1715](https://github.com/aws-amplify/amplify-cli/issues/1715) - Fix stack enumeration so transform.conf.json will be generated ([#2114](https://github.com/aws-amplify/amplify-cli/issues/2114)) ([d1b266b](https://github.com/aws-amplify/amplify-cli/commit/d1b266b))


### Features

* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
* mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
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





# [3.11.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.7.5...graphql-transformer-core@3.11.0) (2019-08-13)


### Features

* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
* mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
* sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))





# [3.10.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.7.5...graphql-transformer-core@3.10.0) (2019-08-07)


### Features

* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
* mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
* sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))





# [3.9.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.7.5...graphql-transformer-core@3.9.0) (2019-08-02)


### Features

* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
* sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))





# [3.8.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.7.5...graphql-transformer-core@3.8.0) (2019-07-31)


### Features

* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
* sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))





## [3.7.5](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.7.4...graphql-transformer-core@3.7.5) (2019-07-24)

**Note:** Version bump only for package graphql-transformer-core





## [3.7.4](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.7.2...graphql-transformer-core@3.7.4) (2019-06-30)

**Note:** Version bump only for package graphql-transformer-core





## [3.7.2](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.7.1...graphql-transformer-core@3.7.2) (2019-06-26)

**Note:** Version bump only for package graphql-transformer-core





## [3.7.1](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.7.0...graphql-transformer-core@3.7.1) (2019-06-12)

**Note:** Version bump only for package graphql-transformer-core





# [3.7.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.6.3...graphql-transformer-core@3.7.0) (2019-05-29)


### Features

* feature/[@key](https://github.com/key) ([#1463](https://github.com/aws-amplify/amplify-cli/issues/1463)) ([00ed819](https://github.com/aws-amplify/amplify-cli/commit/00ed819))





## [3.6.3](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.6.2...graphql-transformer-core@3.6.3) (2019-05-21)

**Note:** Version bump only for package graphql-transformer-core





## [3.6.2](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.6.1...graphql-transformer-core@3.6.2) (2019-05-17)

**Note:** Version bump only for package graphql-transformer-core





## [3.6.1](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.6.0...graphql-transformer-core@3.6.1) (2019-05-07)

**Note:** Version bump only for package graphql-transformer-core





# [3.6.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.5.1...graphql-transformer-core@3.6.0) (2019-04-16)


### Features

* **field-level-auth:** Add field level auth support via the [@auth](https://github.com/auth) directive ([#1262](https://github.com/aws-amplify/amplify-cli/issues/1262)) ([3b1c600](https://github.com/aws-amplify/amplify-cli/commit/3b1c600)), closes [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)





## [3.5.1](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.4.0...graphql-transformer-core@3.5.1) (2019-04-09)

**Note:** Version bump only for package graphql-transformer-core





# [3.4.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.0.9...graphql-transformer-core@3.4.0) (2019-04-03)


### Features

* **graphql-elasticsearch-transformer:** map output to stack ([b7a8f6d](https://github.com/aws-amplify/amplify-cli/commit/b7a8f6d)), closes [#1047](https://github.com/aws-amplify/amplify-cli/issues/1047)
* **graphql-elasticsearch-transformer:** test output to stack map ([cf8b0be](https://github.com/aws-amplify/amplify-cli/commit/cf8b0be)), closes [#1047](https://github.com/aws-amplify/amplify-cli/issues/1047)





## [3.0.9](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.0.8...graphql-transformer-core@3.0.9) (2019-03-22)

**Note:** Version bump only for package graphql-transformer-core





## [3.0.8](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.0.7...graphql-transformer-core@3.0.8) (2019-03-05)


### Bug Fixes

* ignore file starting with a dot when compiling configs ([#905](https://github.com/aws-amplify/amplify-cli/issues/905)) ([f094160](https://github.com/aws-amplify/amplify-cli/commit/f094160))





## [3.0.7](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.0.6...graphql-transformer-core@3.0.7) (2019-02-20)

**Note:** Version bump only for package graphql-transformer-core





## [3.0.6](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.0.5...graphql-transformer-core@3.0.6) (2019-02-12)


### Bug Fixes

* cloudform/type versions ([ec6f99f](https://github.com/aws-amplify/amplify-cli/commit/ec6f99f))





## [3.0.5](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.0.3-beta.0...graphql-transformer-core@3.0.5) (2019-02-11)

**Note:** Version bump only for package graphql-transformer-core





## [3.0.3](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.0.3-beta.0...graphql-transformer-core@3.0.3) (2019-02-11)

**Note:** Version bump only for package graphql-transformer-core





## [3.0.3-beta.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.0.2...graphql-transformer-core@3.0.3-beta.0) (2019-02-11)

**Note:** Version bump only for package graphql-transformer-core





<a name="2.0.1-multienv.0"></a>
## [2.0.1-multienv.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.33...graphql-transformer-core@2.0.1-multienv.0) (2018-12-31)


### Bug Fixes

* update grahql transformer package versions for multienv ([8b4b2bd](https://github.com/aws-amplify/amplify-cli/commit/8b4b2bd))




<a name="1.0.33"></a>
## [1.0.33](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.33-beta.0...graphql-transformer-core@1.0.33) (2018-11-09)




**Note:** Version bump only for package graphql-transformer-core

<a name="1.0.33-beta.0"></a>
## [1.0.33-beta.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.12...graphql-transformer-core@1.0.33-beta.0) (2018-11-09)


### Bug Fixes

* **graphql-transformer-core:** Fix Readme.md docs for the `[@auth](https://github.com/auth)` directive ([db6ff7a](https://github.com/aws-amplify/amplify-cli/commit/db6ff7a))




<a name="1.0.32"></a>
## [1.0.32](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.32-beta.0...graphql-transformer-core@1.0.32) (2018-11-05)




**Note:** Version bump only for package graphql-transformer-core

<a name="1.0.32-beta.0"></a>
## [1.0.32-beta.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.12...graphql-transformer-core@1.0.32-beta.0) (2018-11-05)


### Bug Fixes

* **graphql-transformer-core:** Fix Readme.md docs for the `[@auth](https://github.com/auth)` directive ([db6ff7a](https://github.com/aws-amplify/amplify-cli/commit/db6ff7a))




<a name="1.0.31"></a>
## [1.0.31](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.12...graphql-transformer-core@1.0.31) (2018-11-02)


### Bug Fixes

* **graphql-transformer-core:** Fix Readme.md docs for the `[@auth](https://github.com/auth)` directive ([db6ff7a](https://github.com/aws-amplify/amplify-cli/commit/db6ff7a))




<a name="1.0.30"></a>
## [1.0.30](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.30-beta.0...graphql-transformer-core@1.0.30) (2018-11-02)




**Note:** Version bump only for package graphql-transformer-core

<a name="1.0.30-beta.0"></a>
## [1.0.30-beta.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.12...graphql-transformer-core@1.0.30-beta.0) (2018-11-02)


### Bug Fixes

* **graphql-transformer-core:** Fix Readme.md docs for the `[@auth](https://github.com/auth)` directive ([db6ff7a](https://github.com/aws-amplify/amplify-cli/commit/db6ff7a))




<a name="1.0.29"></a>
## [1.0.29](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.29-beta.0...graphql-transformer-core@1.0.29) (2018-10-23)




**Note:** Version bump only for package graphql-transformer-core

<a name="1.0.29-beta.0"></a>
## [1.0.29-beta.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.12...graphql-transformer-core@1.0.29-beta.0) (2018-10-23)


### Bug Fixes

* **graphql-transformer-core:** Fix Readme.md docs for the `[@auth](https://github.com/auth)` directive ([db6ff7a](https://github.com/aws-amplify/amplify-cli/commit/db6ff7a))




<a name="1.0.28"></a>
## [1.0.28](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.28-beta.0...graphql-transformer-core@1.0.28) (2018-10-18)




**Note:** Version bump only for package graphql-transformer-core

<a name="1.0.28-beta.0"></a>
## [1.0.28-beta.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.12...graphql-transformer-core@1.0.28-beta.0) (2018-10-12)


### Bug Fixes

* **graphql-transformer-core:** Fix Readme.md docs for the `[@auth](https://github.com/auth)` directive ([db6ff7a](https://github.com/aws-amplify/amplify-cli/commit/db6ff7a))




<a name="1.0.12"></a>
## [1.0.12](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.11...graphql-transformer-core@1.0.12) (2018-08-23)




**Note:** Version bump only for package graphql-transformer-core

<a name="1.0.11"></a>
## [1.0.11](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.10...graphql-transformer-core@1.0.11) (2018-08-23)




**Note:** Version bump only for package graphql-transformer-core

<a name="1.0.10"></a>
## [1.0.10](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.9...graphql-transformer-core@1.0.10) (2018-08-23)




**Note:** Version bump only for package graphql-transformer-core

<a name="1.0.9"></a>
## [1.0.9](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.8...graphql-transformer-core@1.0.9) (2018-08-23)




**Note:** Version bump only for package graphql-transformer-core

<a name="1.0.8"></a>
## [1.0.8](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.7...graphql-transformer-core@1.0.8) (2018-08-23)




**Note:** Version bump only for package graphql-transformer-core

<a name="1.0.7"></a>
## [1.0.7](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.6...graphql-transformer-core@1.0.7) (2018-08-23)




**Note:** Version bump only for package graphql-transformer-core

<a name="1.0.6"></a>
## [1.0.6](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.5...graphql-transformer-core@1.0.6) (2018-08-23)




**Note:** Version bump only for package graphql-transformer-core

<a name="1.0.5"></a>
## [1.0.5](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.4...graphql-transformer-core@1.0.5) (2018-08-23)




**Note:** Version bump only for package graphql-transformer-core

<a name="1.0.4"></a>
## 1.0.4 (2018-08-23)




**Note:** Version bump only for package graphql-transformer-core

<a name="1.0.3"></a>
## 1.0.3 (2018-08-23)




**Note:** Version bump only for package graphql-transformer-core

<a name="1.0.2"></a>
## 1.0.2 (2018-08-23)




**Note:** Version bump only for package graphql-transformer-core

<a name="1.0.1"></a>
## 1.0.1 (2018-08-23)




**Note:** Version bump only for package graphql-transformer-core
