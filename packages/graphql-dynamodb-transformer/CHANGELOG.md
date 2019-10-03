# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.0.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@3.8.5...graphql-dynamodb-transformer@5.0.0) (2019-08-30)


### Bug Fixes

* **graphql-dynamodb-transformer:** added scan index forward ([72cda1e](https://github.com/aws-amplify/amplify-cli/commit/72cda1e)), closes [#1676](https://github.com/aws-amplify/amplify-cli/issues/1676)


### Features

* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
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





# [4.0.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@3.8.5...graphql-dynamodb-transformer@4.0.0) (2019-08-28)


### Bug Fixes

* **graphql-dynamodb-transformer:** added scan index forward ([72cda1e](https://github.com/aws-amplify/amplify-cli/commit/72cda1e)), closes [#1676](https://github.com/aws-amplify/amplify-cli/issues/1676)


### Features

* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
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





# [3.12.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@3.8.5...graphql-dynamodb-transformer@3.12.0) (2019-08-13)


### Bug Fixes

* **graphql-dynamodb-transformer:** added scan index forward ([72cda1e](https://github.com/aws-amplify/amplify-cli/commit/72cda1e)), closes [#1676](https://github.com/aws-amplify/amplify-cli/issues/1676)


### Features

* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
* sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))





# [3.11.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@3.8.5...graphql-dynamodb-transformer@3.11.0) (2019-08-07)


### Features

* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
* sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))





# [3.10.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@3.8.5...graphql-dynamodb-transformer@3.10.0) (2019-08-02)


### Features

* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
* sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))





# [3.9.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@3.8.5...graphql-dynamodb-transformer@3.9.0) (2019-07-31)


### Features

* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
* sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))





## [3.8.5](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@3.8.4...graphql-dynamodb-transformer@3.8.5) (2019-07-24)

**Note:** Version bump only for package graphql-dynamodb-transformer





## [3.8.4](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@3.8.2...graphql-dynamodb-transformer@3.8.4) (2019-06-30)

**Note:** Version bump only for package graphql-dynamodb-transformer





## [3.8.2](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@3.8.1...graphql-dynamodb-transformer@3.8.2) (2019-06-26)

**Note:** Version bump only for package graphql-dynamodb-transformer





## [3.8.1](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@3.8.0...graphql-dynamodb-transformer@3.8.1) (2019-06-12)

**Note:** Version bump only for package graphql-dynamodb-transformer





# [3.8.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@3.7.0...graphql-dynamodb-transformer@3.8.0) (2019-05-29)


### Features

* feature/[@key](https://github.com/key) ([#1463](https://github.com/aws-amplify/amplify-cli/issues/1463)) ([00ed819](https://github.com/aws-amplify/amplify-cli/commit/00ed819))





# [3.7.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@3.6.1...graphql-dynamodb-transformer@3.7.0) (2019-05-21)


### Bug Fixes

* **graphql-dynamodb-transformer:** backward compatibility ([de3e47c](https://github.com/aws-amplify/amplify-cli/commit/de3e47c))


### Features

* **graphql-dynamodb-transformer:** add more specific mapping ([5dc2d3b](https://github.com/aws-amplify/amplify-cli/commit/5dc2d3b))
* **graphql-dynamodb-transformer:** always output stream arn ([df1712b](https://github.com/aws-amplify/amplify-cli/commit/df1712b)), closes [#980](https://github.com/aws-amplify/amplify-cli/issues/980)





## [3.6.1](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@3.6.0...graphql-dynamodb-transformer@3.6.1) (2019-05-17)


### Bug Fixes

* **graphql-dynamodb-transformer:** always output datasource name ([#1182](https://github.com/aws-amplify/amplify-cli/issues/1182)) ([a58e1ac](https://github.com/aws-amplify/amplify-cli/commit/a58e1ac))





# [3.6.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@3.4.2...graphql-dynamodb-transformer@3.6.0) (2019-05-07)


### Features

* **graphql-dynamodb-transformer:** output table name ([#1215](https://github.com/aws-amplify/amplify-cli/issues/1215)) ([038b876](https://github.com/aws-amplify/amplify-cli/commit/038b876)), closes [#1145](https://github.com/aws-amplify/amplify-cli/issues/1145) [#1145](https://github.com/aws-amplify/amplify-cli/issues/1145)





# [3.5.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@3.4.2...graphql-dynamodb-transformer@3.5.0) (2019-05-06)


### Features

* **graphql-dynamodb-transformer:** output table name ([#1215](https://github.com/aws-amplify/amplify-cli/issues/1215)) ([038b876](https://github.com/aws-amplify/amplify-cli/commit/038b876)), closes [#1145](https://github.com/aws-amplify/amplify-cli/issues/1145) [#1145](https://github.com/aws-amplify/amplify-cli/issues/1145)





## [3.4.2](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@3.4.1...graphql-dynamodb-transformer@3.4.2) (2019-04-16)

**Note:** Version bump only for package graphql-dynamodb-transformer





## [3.4.1](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@3.3.1...graphql-dynamodb-transformer@3.4.1) (2019-04-09)

**Note:** Version bump only for package graphql-dynamodb-transformer





## [3.3.1](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@3.0.9...graphql-dynamodb-transformer@3.3.1) (2019-04-03)

**Note:** Version bump only for package graphql-dynamodb-transformer





## [3.0.9](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@3.0.8...graphql-dynamodb-transformer@3.0.9) (2019-03-22)

**Note:** Version bump only for package graphql-dynamodb-transformer





## [3.0.8](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@3.0.7...graphql-dynamodb-transformer@3.0.8) (2019-03-05)

**Note:** Version bump only for package graphql-dynamodb-transformer





## [3.0.7](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@3.0.6...graphql-dynamodb-transformer@3.0.7) (2019-02-20)


### Bug Fixes

* **graphql-dynamodb-transformer:** generate filters for connection ([#889](https://github.com/aws-amplify/amplify-cli/issues/889)) ([166d12c](https://github.com/aws-amplify/amplify-cli/commit/166d12c)), closes [#865](https://github.com/aws-amplify/amplify-cli/issues/865)





## [3.0.6](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@3.0.5...graphql-dynamodb-transformer@3.0.6) (2019-02-12)


### Bug Fixes

* cloudform/type versions ([ec6f99f](https://github.com/aws-amplify/amplify-cli/commit/ec6f99f))





## [3.0.5](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@3.0.3-beta.0...graphql-dynamodb-transformer@3.0.5) (2019-02-11)

**Note:** Version bump only for package graphql-dynamodb-transformer





## [3.0.3](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@3.0.3-beta.0...graphql-dynamodb-transformer@3.0.3) (2019-02-11)

**Note:** Version bump only for package graphql-dynamodb-transformer





## [3.0.3-beta.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@3.0.2...graphql-dynamodb-transformer@3.0.3-beta.0) (2019-02-11)

**Note:** Version bump only for package graphql-dynamodb-transformer





<a name="2.0.0-multienv.2"></a>
# [2.0.0-multienv.2](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@1.0.34-multienv.1...graphql-dynamodb-transformer@2.0.0-multienv.2) (2018-12-31)


### Bug Fixes

* update grahql transformer package versions for multienv ([8b4b2bd](https://github.com/aws-amplify/amplify-cli/commit/8b4b2bd))




<a name="1.0.34-multienv.1"></a>
## [1.0.34-multienv.1](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@1.0.34-multienv.0...graphql-dynamodb-transformer@1.0.34-multienv.1) (2018-12-19)


### Bug Fixes

* **amplify-category-api:** Updating dependsOn for certain resources ([#597](https://github.com/aws-amplify/amplify-cli/issues/597)) ([7a8f5f7](https://github.com/aws-amplify/amplify-cli/commit/7a8f5f7))




<a name="1.0.34-multienv.0"></a>
## [1.0.34-multienv.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@1.0.33...graphql-dynamodb-transformer@1.0.34-multienv.0) (2018-11-16)




**Note:** Version bump only for package graphql-dynamodb-transformer

<a name="1.0.33"></a>
## [1.0.33](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@1.0.33-beta.0...graphql-dynamodb-transformer@1.0.33) (2018-11-09)




**Note:** Version bump only for package graphql-dynamodb-transformer

<a name="1.0.33-beta.0"></a>
## [1.0.33-beta.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@1.0.12...graphql-dynamodb-transformer@1.0.33-beta.0) (2018-11-09)




**Note:** Version bump only for package graphql-dynamodb-transformer

<a name="1.0.32"></a>
## [1.0.32](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@1.0.32-beta.0...graphql-dynamodb-transformer@1.0.32) (2018-11-05)




**Note:** Version bump only for package graphql-dynamodb-transformer

<a name="1.0.32-beta.0"></a>
## [1.0.32-beta.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@1.0.12...graphql-dynamodb-transformer@1.0.32-beta.0) (2018-11-05)




**Note:** Version bump only for package graphql-dynamodb-transformer

<a name="1.0.31"></a>
## [1.0.31](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@1.0.12...graphql-dynamodb-transformer@1.0.31) (2018-11-02)




**Note:** Version bump only for package graphql-dynamodb-transformer

<a name="1.0.30"></a>
## [1.0.30](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@1.0.30-beta.0...graphql-dynamodb-transformer@1.0.30) (2018-11-02)




**Note:** Version bump only for package graphql-dynamodb-transformer

<a name="1.0.30-beta.0"></a>
## [1.0.30-beta.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@1.0.12...graphql-dynamodb-transformer@1.0.30-beta.0) (2018-11-02)




**Note:** Version bump only for package graphql-dynamodb-transformer

<a name="1.0.29"></a>
## [1.0.29](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@1.0.29-beta.0...graphql-dynamodb-transformer@1.0.29) (2018-10-23)




**Note:** Version bump only for package graphql-dynamodb-transformer

<a name="1.0.29-beta.0"></a>
## [1.0.29-beta.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@1.0.12...graphql-dynamodb-transformer@1.0.29-beta.0) (2018-10-23)




**Note:** Version bump only for package graphql-dynamodb-transformer

<a name="1.0.28"></a>
## [1.0.28](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@1.0.28-beta.0...graphql-dynamodb-transformer@1.0.28) (2018-10-18)




**Note:** Version bump only for package graphql-dynamodb-transformer

<a name="1.0.28-beta.0"></a>
## [1.0.28-beta.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@1.0.12...graphql-dynamodb-transformer@1.0.28-beta.0) (2018-10-12)




**Note:** Version bump only for package graphql-dynamodb-transformer

<a name="1.0.12"></a>
## [1.0.12](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@1.0.11...graphql-dynamodb-transformer@1.0.12) (2018-08-23)




**Note:** Version bump only for package graphql-dynamodb-transformer

<a name="1.0.11"></a>
## [1.0.11](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@1.0.10...graphql-dynamodb-transformer@1.0.11) (2018-08-23)




**Note:** Version bump only for package graphql-dynamodb-transformer

<a name="1.0.10"></a>
## [1.0.10](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@1.0.9...graphql-dynamodb-transformer@1.0.10) (2018-08-23)




**Note:** Version bump only for package graphql-dynamodb-transformer

<a name="1.0.9"></a>
## [1.0.9](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@1.0.8...graphql-dynamodb-transformer@1.0.9) (2018-08-23)




**Note:** Version bump only for package graphql-dynamodb-transformer

<a name="1.0.8"></a>
## [1.0.8](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@1.0.7...graphql-dynamodb-transformer@1.0.8) (2018-08-23)




**Note:** Version bump only for package graphql-dynamodb-transformer

<a name="1.0.7"></a>
## [1.0.7](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@1.0.6...graphql-dynamodb-transformer@1.0.7) (2018-08-23)




**Note:** Version bump only for package graphql-dynamodb-transformer

<a name="1.0.6"></a>
## [1.0.6](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@1.0.5...graphql-dynamodb-transformer@1.0.6) (2018-08-23)




**Note:** Version bump only for package graphql-dynamodb-transformer

<a name="1.0.5"></a>
## [1.0.5](https://github.com/aws-amplify/amplify-cli/compare/graphql-dynamodb-transformer@1.0.4...graphql-dynamodb-transformer@1.0.5) (2018-08-23)




**Note:** Version bump only for package graphql-dynamodb-transformer

<a name="1.0.4"></a>
## 1.0.4 (2018-08-23)




**Note:** Version bump only for package graphql-dynamodb-transformer

<a name="1.0.3"></a>
## 1.0.3 (2018-08-23)




**Note:** Version bump only for package graphql-dynamodb-transformer

<a name="1.0.2"></a>
## 1.0.2 (2018-08-23)




**Note:** Version bump only for package graphql-dynamodb-transformer

<a name="1.0.1"></a>
## 1.0.1 (2018-08-23)




**Note:** Version bump only for package graphql-dynamodb-transformer
