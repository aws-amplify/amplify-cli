# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [6.17.0-beta.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@6.16.1...graphql-transformers-e2e-tests@6.17.0-beta.0) (2020-06-02)


### Bug Fixes

* **graphql-auth-transformer:** use read to allow subscriptions ([#4340](https://github.com/aws-amplify/amplify-cli/issues/4340)) ([15eac84](https://github.com/aws-amplify/amplify-cli/commit/15eac8454e0455cd402776308a2716ac406bacbb)), closes [#3777](https://github.com/aws-amplify/amplify-cli/issues/3777) [#4182](https://github.com/aws-amplify/amplify-cli/issues/4182) [#4137](https://github.com/aws-amplify/amplify-cli/issues/4137)


### Features

* **graphql-key-transformer:** auto population of id and timestamp ([#4382](https://github.com/aws-amplify/amplify-cli/issues/4382)) ([c0a4f88](https://github.com/aws-amplify/amplify-cli/commit/c0a4f8889fc363bb9c9d08ff822c591874777f7b))





## [6.16.1](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@6.16.0...graphql-transformers-e2e-tests@6.16.1) (2020-05-26)


### Bug Fixes

* **graphql-connection-transformer:** limit was not respected ([#4021](https://github.com/aws-amplify/amplify-cli/issues/4021)) ([9800384](https://github.com/aws-amplify/amplify-cli/commit/9800384efff53a57973105508482cad945523727))
* **graphql-elasticsearch-transformer:** support del in sync enabled API ([#4281](https://github.com/aws-amplify/amplify-cli/issues/4281)) ([f57f824](https://github.com/aws-amplify/amplify-cli/commit/f57f8242f18c79d48b751e29952e3cdd21409f98)), closes [#4228](https://github.com/aws-amplify/amplify-cli/issues/4228) [#4228](https://github.com/aws-amplify/amplify-cli/issues/4228)





# [6.16.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@6.15.4...graphql-transformers-e2e-tests@6.16.0) (2020-05-15)


### Bug Fixes

* **graphql-key-transformer:** add key validation in create ([#4146](https://github.com/aws-amplify/amplify-cli/issues/4146)) ([0e20424](https://github.com/aws-amplify/amplify-cli/commit/0e20424f78876a1e4d8d5e0c80e6f76bcef98f84)), closes [#1756](https://github.com/aws-amplify/amplify-cli/issues/1756)


### Features

* **graphql-dynamodb-transformer:** expose createdAt and updatedAt on model ([#4149](https://github.com/aws-amplify/amplify-cli/issues/4149)) ([8e0662e](https://github.com/aws-amplify/amplify-cli/commit/8e0662eac8c88da9393f32c33457a597acf591ed)), closes [#401](https://github.com/aws-amplify/amplify-cli/issues/401)





## [6.15.4](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@6.15.3...graphql-transformers-e2e-tests@6.15.4) (2020-05-08)


### Bug Fixes

* **graphql-auth-transformer:** fix dynamic group auth permission check ([#4084](https://github.com/aws-amplify/amplify-cli/issues/4084)) ([688e831](https://github.com/aws-amplify/amplify-cli/commit/688e83148f554eb5f0803d0a603ae569609757ab))





## [6.15.3](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@6.15.2...graphql-transformers-e2e-tests@6.15.3) (2020-04-23)


### Bug Fixes

* http transformer e2e test flakiness ([#3978](https://github.com/aws-amplify/amplify-cli/issues/3978)) ([976aa7a](https://github.com/aws-amplify/amplify-cli/commit/976aa7aca9e8b1860fdc378a0cfa181f39d24b77))





## [6.15.2](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@6.15.1...graphql-transformers-e2e-tests@6.15.2) (2020-03-22)

**Note:** Version bump only for package graphql-transformers-e2e-tests





## [6.15.1](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@6.13.4...graphql-transformers-e2e-tests@6.15.1) (2020-03-07)


### Bug Fixes

* **graphql-auth-transformer:** add list support for ownerField in subs ([#3166](https://github.com/aws-amplify/amplify-cli/issues/3166)) ([8d68277](https://github.com/aws-amplify/amplify-cli/commit/8d6827752ebd076424d3c76122b136eca65b02a8))
* **graphql-connection-transformer:** support non string type in sort key ([#3492](https://github.com/aws-amplify/amplify-cli/issues/3492)) ([bc4a1d9](https://github.com/aws-amplify/amplify-cli/commit/bc4a1d9bd707c62ea2c4ec685401f34dfeca0bd0)), closes [#3403](https://github.com/aws-amplify/amplify-cli/issues/3403)
* **graphql-elasticsearch-transformer:** use ddb keys as main id in es ([#3391](https://github.com/aws-amplify/amplify-cli/issues/3391)) ([9aae9a6](https://github.com/aws-amplify/amplify-cli/commit/9aae9a6681c5ff744d908b5292a5b00faa14de4d)), closes [#3359](https://github.com/aws-amplify/amplify-cli/issues/3359)
* [#2711](https://github.com/aws-amplify/amplify-cli/issues/2711) - usage of [@auth](https://github.com/auth) without [@model](https://github.com/model) on fields ([#3590](https://github.com/aws-amplify/amplify-cli/issues/3590)) ([553186e](https://github.com/aws-amplify/amplify-cli/commit/553186e53050cafdf27120443d176023ef4acebc))


### Reverts

* Revert "fix(graphql-auth-transformer): add list support for ownerField in subs (#3166)" (#3572) ([d693e6b](https://github.com/aws-amplify/amplify-cli/commit/d693e6b2819a5d20188fa9f68d94ef955e474bd3)), closes [#3166](https://github.com/aws-amplify/amplify-cli/issues/3166) [#3572](https://github.com/aws-amplify/amplify-cli/issues/3572)





## [6.14.1](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@6.13.6-beta.0...graphql-transformers-e2e-tests@6.14.1) (2020-03-05)

**Note:** Version bump only for package graphql-transformers-e2e-tests





## [6.13.4](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@6.13.3...graphql-transformers-e2e-tests@6.13.4) (2020-02-18)


### Bug Fixes

* **graphql-dynamodb-transformer:** prevent doble escape of nextToken ([#3452](https://github.com/aws-amplify/amplify-cli/issues/3452)) ([b6decfd](https://github.com/aws-amplify/amplify-cli/commit/b6decfddf232ed8a1d8b3e51ad881bc083b45114)), closes [#3411](https://github.com/aws-amplify/amplify-cli/issues/3411)





## [6.13.3](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@6.13.2...graphql-transformers-e2e-tests@6.13.3) (2020-02-13)

**Note:** Version bump only for package graphql-transformers-e2e-tests





## [6.13.2](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@6.13.1...graphql-transformers-e2e-tests@6.13.2) (2020-02-07)


### Bug Fixes

* e2e test dependency and cloudform depe for relational ([#3352](https://github.com/aws-amplify/amplify-cli/issues/3352)) ([6b74433](https://github.com/aws-amplify/amplify-cli/commit/6b74433a4ddf7706fef3834f02247a3cd0fd75c2))
* e2e tests, tsconfigs, [@deprecated](https://github.com/deprecated) directive for codegen: ([#3338](https://github.com/aws-amplify/amplify-cli/issues/3338)) ([2ed7715](https://github.com/aws-amplify/amplify-cli/commit/2ed77151dd6367ac9547f78fe600e7913a3d37b2))
* test config update for e2e ([#3345](https://github.com/aws-amplify/amplify-cli/issues/3345)) ([0d8cadc](https://github.com/aws-amplify/amplify-cli/commit/0d8cadcafeeaaaf1f4251017769021d00b8600be))





## [6.13.1](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@6.13.0...graphql-transformers-e2e-tests@6.13.1) (2020-01-24)

**Note:** Version bump only for package graphql-transformers-e2e-tests





# [6.13.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@5.18.0...graphql-transformers-e2e-tests@6.13.0) (2020-01-23)

### Bug Fixes

- [#2727](https://github.com/aws-amplify/amplify-cli/issues/2727) ([#2754](https://github.com/aws-amplify/amplify-cli/issues/2754)) ([44a7b54](https://github.com/aws-amplify/amplify-cli/commit/44a7b549f84ff8d752fd0dc87d6d689a609a579d))
- build break after recent merges ([#2758](https://github.com/aws-amplify/amplify-cli/issues/2758)) ([7155787](https://github.com/aws-amplify/amplify-cli/commit/7155787d74306e9708fe7115648ab6f702dc2093))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- graphql e2e test deployment ([#2887](https://github.com/aws-amplify/amplify-cli/issues/2887)) ([7ba515a](https://github.com/aws-amplify/amplify-cli/commit/7ba515acb40009f783d899f23b9fe89392afcbdb))
- remaining e2e tests ([#2889](https://github.com/aws-amplify/amplify-cli/issues/2889)) ([b518061](https://github.com/aws-amplify/amplify-cli/commit/b518061154261b21faeee842579f355d175981ba))
- upgrade to node10 as min version for CLI ([#3128](https://github.com/aws-amplify/amplify-cli/issues/3128)) ([a0b18e0](https://github.com/aws-amplify/amplify-cli/commit/a0b18e0187a26b4ab0e6e986b0277f347e829444))
- use managedpolicies and slice them ([#2883](https://github.com/aws-amplify/amplify-cli/issues/2883)) ([fa0f2ed](https://github.com/aws-amplify/amplify-cli/commit/fa0f2ed2fc725d964cbaf11a892b3850aaf42d84)), closes [#2084](https://github.com/aws-amplify/amplify-cli/issues/2084)
- **graphql-elasticsearch-transformer:** allow range on searches ([#3129](https://github.com/aws-amplify/amplify-cli/issues/3129)) ([f81ea32](https://github.com/aws-amplify/amplify-cli/commit/f81ea329f47194fbc19eb966cacee9877e04a389)), closes [#2775](https://github.com/aws-amplify/amplify-cli/issues/2775)
- **graphql-function-transformer:** add hash to function iam role name ([#3030](https://github.com/aws-amplify/amplify-cli/issues/3030)) ([e3c4a32](https://github.com/aws-amplify/amplify-cli/commit/e3c4a32135f3df6ffb06308d5250433aaf2c1ce9)), closes [#2468](https://github.com/aws-amplify/amplify-cli/issues/2468)
- **graphql-transformers-e2e-tests:** added amplify next ([#2839](https://github.com/aws-amplify/amplify-cli/issues/2839)) ([800d5a2](https://github.com/aws-amplify/amplify-cli/commit/800d5a2f46b02bbd7d6b6dcf76d5cbb825fcdb46))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- **graphql-elasticsearch-transformer:** support sets in es fn ([#2986](https://github.com/aws-amplify/amplify-cli/issues/2986)) ([16419f4](https://github.com/aws-amplify/amplify-cli/commit/16419f4d9e1733ed0ada064f9ced604083ee4703)), closes [#2860](https://github.com/aws-amplify/amplify-cli/issues/2860)

# [6.12.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@5.18.0...graphql-transformers-e2e-tests@6.12.0) (2020-01-09)

### Bug Fixes

- [#2727](https://github.com/aws-amplify/amplify-cli/issues/2727) ([#2754](https://github.com/aws-amplify/amplify-cli/issues/2754)) ([44a7b54](https://github.com/aws-amplify/amplify-cli/commit/44a7b549f84ff8d752fd0dc87d6d689a609a579d))
- build break after recent merges ([#2758](https://github.com/aws-amplify/amplify-cli/issues/2758)) ([7155787](https://github.com/aws-amplify/amplify-cli/commit/7155787d74306e9708fe7115648ab6f702dc2093))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- graphql e2e test deployment ([#2887](https://github.com/aws-amplify/amplify-cli/issues/2887)) ([7ba515a](https://github.com/aws-amplify/amplify-cli/commit/7ba515acb40009f783d899f23b9fe89392afcbdb))
- remaining e2e tests ([#2889](https://github.com/aws-amplify/amplify-cli/issues/2889)) ([b518061](https://github.com/aws-amplify/amplify-cli/commit/b518061154261b21faeee842579f355d175981ba))
- **graphql-function-transformer:** add hash to function iam role name ([#3030](https://github.com/aws-amplify/amplify-cli/issues/3030)) ([e3c4a32](https://github.com/aws-amplify/amplify-cli/commit/e3c4a32135f3df6ffb06308d5250433aaf2c1ce9)), closes [#2468](https://github.com/aws-amplify/amplify-cli/issues/2468)
- **graphql-transformers-e2e-tests:** added amplify next ([#2839](https://github.com/aws-amplify/amplify-cli/issues/2839)) ([800d5a2](https://github.com/aws-amplify/amplify-cli/commit/800d5a2f46b02bbd7d6b6dcf76d5cbb825fcdb46))
- upgrade to node10 as min version for CLI ([#3128](https://github.com/aws-amplify/amplify-cli/issues/3128)) ([a0b18e0](https://github.com/aws-amplify/amplify-cli/commit/a0b18e0187a26b4ab0e6e986b0277f347e829444))
- use managedpolicies and slice them ([#2883](https://github.com/aws-amplify/amplify-cli/issues/2883)) ([fa0f2ed](https://github.com/aws-amplify/amplify-cli/commit/fa0f2ed2fc725d964cbaf11a892b3850aaf42d84)), closes [#2084](https://github.com/aws-amplify/amplify-cli/issues/2084)

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- **graphql-elasticsearch-transformer:** support sets in es fn ([#2986](https://github.com/aws-amplify/amplify-cli/issues/2986)) ([16419f4](https://github.com/aws-amplify/amplify-cli/commit/16419f4d9e1733ed0ada064f9ced604083ee4703)), closes [#2860](https://github.com/aws-amplify/amplify-cli/issues/2860)

# [6.11.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@5.18.0...graphql-transformers-e2e-tests@6.11.0) (2019-12-31)

### Bug Fixes

- [#2727](https://github.com/aws-amplify/amplify-cli/issues/2727) ([#2754](https://github.com/aws-amplify/amplify-cli/issues/2754)) ([44a7b54](https://github.com/aws-amplify/amplify-cli/commit/44a7b549f84ff8d752fd0dc87d6d689a609a579d))
- build break after recent merges ([#2758](https://github.com/aws-amplify/amplify-cli/issues/2758)) ([7155787](https://github.com/aws-amplify/amplify-cli/commit/7155787d74306e9708fe7115648ab6f702dc2093))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- graphql e2e test deployment ([#2887](https://github.com/aws-amplify/amplify-cli/issues/2887)) ([7ba515a](https://github.com/aws-amplify/amplify-cli/commit/7ba515acb40009f783d899f23b9fe89392afcbdb))
- remaining e2e tests ([#2889](https://github.com/aws-amplify/amplify-cli/issues/2889)) ([b518061](https://github.com/aws-amplify/amplify-cli/commit/b518061154261b21faeee842579f355d175981ba))
- use managedpolicies and slice them ([#2883](https://github.com/aws-amplify/amplify-cli/issues/2883)) ([fa0f2ed](https://github.com/aws-amplify/amplify-cli/commit/fa0f2ed2fc725d964cbaf11a892b3850aaf42d84)), closes [#2084](https://github.com/aws-amplify/amplify-cli/issues/2084)
- **graphql-function-transformer:** add hash to function iam role name ([#3030](https://github.com/aws-amplify/amplify-cli/issues/3030)) ([e3c4a32](https://github.com/aws-amplify/amplify-cli/commit/e3c4a32135f3df6ffb06308d5250433aaf2c1ce9)), closes [#2468](https://github.com/aws-amplify/amplify-cli/issues/2468)
- **graphql-transformers-e2e-tests:** added amplify next ([#2839](https://github.com/aws-amplify/amplify-cli/issues/2839)) ([800d5a2](https://github.com/aws-amplify/amplify-cli/commit/800d5a2f46b02bbd7d6b6dcf76d5cbb825fcdb46))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [6.10.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@5.18.0...graphql-transformers-e2e-tests@6.10.0) (2019-12-28)

### Bug Fixes

- [#2727](https://github.com/aws-amplify/amplify-cli/issues/2727) ([#2754](https://github.com/aws-amplify/amplify-cli/issues/2754)) ([44a7b54](https://github.com/aws-amplify/amplify-cli/commit/44a7b549f84ff8d752fd0dc87d6d689a609a579d))
- build break after recent merges ([#2758](https://github.com/aws-amplify/amplify-cli/issues/2758)) ([7155787](https://github.com/aws-amplify/amplify-cli/commit/7155787d74306e9708fe7115648ab6f702dc2093))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- graphql e2e test deployment ([#2887](https://github.com/aws-amplify/amplify-cli/issues/2887)) ([7ba515a](https://github.com/aws-amplify/amplify-cli/commit/7ba515acb40009f783d899f23b9fe89392afcbdb))
- remaining e2e tests ([#2889](https://github.com/aws-amplify/amplify-cli/issues/2889)) ([b518061](https://github.com/aws-amplify/amplify-cli/commit/b518061154261b21faeee842579f355d175981ba))
- use managedpolicies and slice them ([#2883](https://github.com/aws-amplify/amplify-cli/issues/2883)) ([fa0f2ed](https://github.com/aws-amplify/amplify-cli/commit/fa0f2ed2fc725d964cbaf11a892b3850aaf42d84)), closes [#2084](https://github.com/aws-amplify/amplify-cli/issues/2084)
- **graphql-function-transformer:** add hash to function iam role name ([#3030](https://github.com/aws-amplify/amplify-cli/issues/3030)) ([e3c4a32](https://github.com/aws-amplify/amplify-cli/commit/e3c4a32135f3df6ffb06308d5250433aaf2c1ce9)), closes [#2468](https://github.com/aws-amplify/amplify-cli/issues/2468)
- **graphql-transformers-e2e-tests:** added amplify next ([#2839](https://github.com/aws-amplify/amplify-cli/issues/2839)) ([800d5a2](https://github.com/aws-amplify/amplify-cli/commit/800d5a2f46b02bbd7d6b6dcf76d5cbb825fcdb46))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [6.9.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@5.18.0...graphql-transformers-e2e-tests@6.9.0) (2019-12-26)

### Bug Fixes

- [#2727](https://github.com/aws-amplify/amplify-cli/issues/2727) ([#2754](https://github.com/aws-amplify/amplify-cli/issues/2754)) ([44a7b54](https://github.com/aws-amplify/amplify-cli/commit/44a7b549f84ff8d752fd0dc87d6d689a609a579d))
- build break after recent merges ([#2758](https://github.com/aws-amplify/amplify-cli/issues/2758)) ([7155787](https://github.com/aws-amplify/amplify-cli/commit/7155787d74306e9708fe7115648ab6f702dc2093))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- graphql e2e test deployment ([#2887](https://github.com/aws-amplify/amplify-cli/issues/2887)) ([7ba515a](https://github.com/aws-amplify/amplify-cli/commit/7ba515acb40009f783d899f23b9fe89392afcbdb))
- remaining e2e tests ([#2889](https://github.com/aws-amplify/amplify-cli/issues/2889)) ([b518061](https://github.com/aws-amplify/amplify-cli/commit/b518061154261b21faeee842579f355d175981ba))
- use managedpolicies and slice them ([#2883](https://github.com/aws-amplify/amplify-cli/issues/2883)) ([fa0f2ed](https://github.com/aws-amplify/amplify-cli/commit/fa0f2ed2fc725d964cbaf11a892b3850aaf42d84)), closes [#2084](https://github.com/aws-amplify/amplify-cli/issues/2084)
- **graphql-function-transformer:** add hash to function iam role name ([#3030](https://github.com/aws-amplify/amplify-cli/issues/3030)) ([e3c4a32](https://github.com/aws-amplify/amplify-cli/commit/e3c4a32135f3df6ffb06308d5250433aaf2c1ce9)), closes [#2468](https://github.com/aws-amplify/amplify-cli/issues/2468)
- **graphql-transformers-e2e-tests:** added amplify next ([#2839](https://github.com/aws-amplify/amplify-cli/issues/2839)) ([800d5a2](https://github.com/aws-amplify/amplify-cli/commit/800d5a2f46b02bbd7d6b6dcf76d5cbb825fcdb46))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [6.8.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@5.18.0...graphql-transformers-e2e-tests@6.8.0) (2019-12-25)

### Bug Fixes

- [#2727](https://github.com/aws-amplify/amplify-cli/issues/2727) ([#2754](https://github.com/aws-amplify/amplify-cli/issues/2754)) ([44a7b54](https://github.com/aws-amplify/amplify-cli/commit/44a7b549f84ff8d752fd0dc87d6d689a609a579d))
- build break after recent merges ([#2758](https://github.com/aws-amplify/amplify-cli/issues/2758)) ([7155787](https://github.com/aws-amplify/amplify-cli/commit/7155787d74306e9708fe7115648ab6f702dc2093))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- graphql e2e test deployment ([#2887](https://github.com/aws-amplify/amplify-cli/issues/2887)) ([7ba515a](https://github.com/aws-amplify/amplify-cli/commit/7ba515acb40009f783d899f23b9fe89392afcbdb))
- remaining e2e tests ([#2889](https://github.com/aws-amplify/amplify-cli/issues/2889)) ([b518061](https://github.com/aws-amplify/amplify-cli/commit/b518061154261b21faeee842579f355d175981ba))
- use managedpolicies and slice them ([#2883](https://github.com/aws-amplify/amplify-cli/issues/2883)) ([fa0f2ed](https://github.com/aws-amplify/amplify-cli/commit/fa0f2ed2fc725d964cbaf11a892b3850aaf42d84)), closes [#2084](https://github.com/aws-amplify/amplify-cli/issues/2084)
- **graphql-function-transformer:** add hash to function iam role name ([#3030](https://github.com/aws-amplify/amplify-cli/issues/3030)) ([e3c4a32](https://github.com/aws-amplify/amplify-cli/commit/e3c4a32135f3df6ffb06308d5250433aaf2c1ce9)), closes [#2468](https://github.com/aws-amplify/amplify-cli/issues/2468)
- **graphql-transformers-e2e-tests:** added amplify next ([#2839](https://github.com/aws-amplify/amplify-cli/issues/2839)) ([800d5a2](https://github.com/aws-amplify/amplify-cli/commit/800d5a2f46b02bbd7d6b6dcf76d5cbb825fcdb46))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [6.7.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@5.18.0...graphql-transformers-e2e-tests@6.7.0) (2019-12-20)

### Bug Fixes

- [#2727](https://github.com/aws-amplify/amplify-cli/issues/2727) ([#2754](https://github.com/aws-amplify/amplify-cli/issues/2754)) ([44a7b54](https://github.com/aws-amplify/amplify-cli/commit/44a7b549f84ff8d752fd0dc87d6d689a609a579d))
- build break after recent merges ([#2758](https://github.com/aws-amplify/amplify-cli/issues/2758)) ([7155787](https://github.com/aws-amplify/amplify-cli/commit/7155787d74306e9708fe7115648ab6f702dc2093))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- graphql e2e test deployment ([#2887](https://github.com/aws-amplify/amplify-cli/issues/2887)) ([7ba515a](https://github.com/aws-amplify/amplify-cli/commit/7ba515acb40009f783d899f23b9fe89392afcbdb))
- remaining e2e tests ([#2889](https://github.com/aws-amplify/amplify-cli/issues/2889)) ([b518061](https://github.com/aws-amplify/amplify-cli/commit/b518061154261b21faeee842579f355d175981ba))
- use managedpolicies and slice them ([#2883](https://github.com/aws-amplify/amplify-cli/issues/2883)) ([fa0f2ed](https://github.com/aws-amplify/amplify-cli/commit/fa0f2ed2fc725d964cbaf11a892b3850aaf42d84)), closes [#2084](https://github.com/aws-amplify/amplify-cli/issues/2084)
- **graphql-function-transformer:** add hash to function iam role name ([#3030](https://github.com/aws-amplify/amplify-cli/issues/3030)) ([e3c4a32](https://github.com/aws-amplify/amplify-cli/commit/e3c4a32135f3df6ffb06308d5250433aaf2c1ce9)), closes [#2468](https://github.com/aws-amplify/amplify-cli/issues/2468)
- **graphql-transformers-e2e-tests:** added amplify next ([#2839](https://github.com/aws-amplify/amplify-cli/issues/2839)) ([800d5a2](https://github.com/aws-amplify/amplify-cli/commit/800d5a2f46b02bbd7d6b6dcf76d5cbb825fcdb46))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [6.6.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@5.18.0...graphql-transformers-e2e-tests@6.6.0) (2019-12-10)

### Bug Fixes

- [#2727](https://github.com/aws-amplify/amplify-cli/issues/2727) ([#2754](https://github.com/aws-amplify/amplify-cli/issues/2754)) ([44a7b54](https://github.com/aws-amplify/amplify-cli/commit/44a7b549f84ff8d752fd0dc87d6d689a609a579d))
- build break after recent merges ([#2758](https://github.com/aws-amplify/amplify-cli/issues/2758)) ([7155787](https://github.com/aws-amplify/amplify-cli/commit/7155787d74306e9708fe7115648ab6f702dc2093))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- **graphql-transformers-e2e-tests:** added amplify next ([#2839](https://github.com/aws-amplify/amplify-cli/issues/2839)) ([800d5a2](https://github.com/aws-amplify/amplify-cli/commit/800d5a2f46b02bbd7d6b6dcf76d5cbb825fcdb46))
- graphql e2e test deployment ([#2887](https://github.com/aws-amplify/amplify-cli/issues/2887)) ([7ba515a](https://github.com/aws-amplify/amplify-cli/commit/7ba515acb40009f783d899f23b9fe89392afcbdb))
- remaining e2e tests ([#2889](https://github.com/aws-amplify/amplify-cli/issues/2889)) ([b518061](https://github.com/aws-amplify/amplify-cli/commit/b518061154261b21faeee842579f355d175981ba))
- use managedpolicies and slice them ([#2883](https://github.com/aws-amplify/amplify-cli/issues/2883)) ([fa0f2ed](https://github.com/aws-amplify/amplify-cli/commit/fa0f2ed2fc725d964cbaf11a892b3850aaf42d84)), closes [#2084](https://github.com/aws-amplify/amplify-cli/issues/2084)

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [6.4.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@5.18.0...graphql-transformers-e2e-tests@6.4.0) (2019-12-03)

### Bug Fixes

- [#2727](https://github.com/aws-amplify/amplify-cli/issues/2727) ([#2754](https://github.com/aws-amplify/amplify-cli/issues/2754)) ([44a7b54](https://github.com/aws-amplify/amplify-cli/commit/44a7b549f84ff8d752fd0dc87d6d689a609a579d))
- build break after recent merges ([#2758](https://github.com/aws-amplify/amplify-cli/issues/2758)) ([7155787](https://github.com/aws-amplify/amplify-cli/commit/7155787d74306e9708fe7115648ab6f702dc2093))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- **graphql-transformers-e2e-tests:** added amplify next ([#2839](https://github.com/aws-amplify/amplify-cli/issues/2839)) ([800d5a2](https://github.com/aws-amplify/amplify-cli/commit/800d5a2f46b02bbd7d6b6dcf76d5cbb825fcdb46))
- graphql e2e test deployment ([#2887](https://github.com/aws-amplify/amplify-cli/issues/2887)) ([7ba515a](https://github.com/aws-amplify/amplify-cli/commit/7ba515acb40009f783d899f23b9fe89392afcbdb))
- remaining e2e tests ([#2889](https://github.com/aws-amplify/amplify-cli/issues/2889)) ([b518061](https://github.com/aws-amplify/amplify-cli/commit/b518061154261b21faeee842579f355d175981ba))
- use managedpolicies and slice them ([#2883](https://github.com/aws-amplify/amplify-cli/issues/2883)) ([fa0f2ed](https://github.com/aws-amplify/amplify-cli/commit/fa0f2ed2fc725d964cbaf11a892b3850aaf42d84)), closes [#2084](https://github.com/aws-amplify/amplify-cli/issues/2084)

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [6.3.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@5.18.0...graphql-transformers-e2e-tests@6.3.0) (2019-12-01)

### Bug Fixes

- [#2727](https://github.com/aws-amplify/amplify-cli/issues/2727) ([#2754](https://github.com/aws-amplify/amplify-cli/issues/2754)) ([44a7b54](https://github.com/aws-amplify/amplify-cli/commit/44a7b549f84ff8d752fd0dc87d6d689a609a579d))
- build break after recent merges ([#2758](https://github.com/aws-amplify/amplify-cli/issues/2758)) ([7155787](https://github.com/aws-amplify/amplify-cli/commit/7155787d74306e9708fe7115648ab6f702dc2093))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- **graphql-transformers-e2e-tests:** added amplify next ([#2839](https://github.com/aws-amplify/amplify-cli/issues/2839)) ([800d5a2](https://github.com/aws-amplify/amplify-cli/commit/800d5a2f46b02bbd7d6b6dcf76d5cbb825fcdb46))
- graphql e2e test deployment ([#2887](https://github.com/aws-amplify/amplify-cli/issues/2887)) ([7ba515a](https://github.com/aws-amplify/amplify-cli/commit/7ba515acb40009f783d899f23b9fe89392afcbdb))
- remaining e2e tests ([#2889](https://github.com/aws-amplify/amplify-cli/issues/2889)) ([b518061](https://github.com/aws-amplify/amplify-cli/commit/b518061154261b21faeee842579f355d175981ba))
- use managedpolicies and slice them ([#2883](https://github.com/aws-amplify/amplify-cli/issues/2883)) ([fa0f2ed](https://github.com/aws-amplify/amplify-cli/commit/fa0f2ed2fc725d964cbaf11a892b3850aaf42d84)), closes [#2084](https://github.com/aws-amplify/amplify-cli/issues/2084)

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [6.2.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@5.18.0...graphql-transformers-e2e-tests@6.2.0) (2019-11-27)

### Bug Fixes

- [#2727](https://github.com/aws-amplify/amplify-cli/issues/2727) ([#2754](https://github.com/aws-amplify/amplify-cli/issues/2754)) ([44a7b54](https://github.com/aws-amplify/amplify-cli/commit/44a7b549f84ff8d752fd0dc87d6d689a609a579d))
- build break after recent merges ([#2758](https://github.com/aws-amplify/amplify-cli/issues/2758)) ([7155787](https://github.com/aws-amplify/amplify-cli/commit/7155787d74306e9708fe7115648ab6f702dc2093))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- **graphql-transformers-e2e-tests:** added amplify next ([#2839](https://github.com/aws-amplify/amplify-cli/issues/2839)) ([800d5a2](https://github.com/aws-amplify/amplify-cli/commit/800d5a2f46b02bbd7d6b6dcf76d5cbb825fcdb46))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [6.1.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@5.18.0...graphql-transformers-e2e-tests@6.1.0) (2019-11-27)

### Bug Fixes

- [#2727](https://github.com/aws-amplify/amplify-cli/issues/2727) ([#2754](https://github.com/aws-amplify/amplify-cli/issues/2754)) ([44a7b54](https://github.com/aws-amplify/amplify-cli/commit/44a7b549f84ff8d752fd0dc87d6d689a609a579d))
- build break after recent merges ([#2758](https://github.com/aws-amplify/amplify-cli/issues/2758)) ([7155787](https://github.com/aws-amplify/amplify-cli/commit/7155787d74306e9708fe7115648ab6f702dc2093))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- **graphql-transformers-e2e-tests:** added amplify next ([#2839](https://github.com/aws-amplify/amplify-cli/issues/2839)) ([800d5a2](https://github.com/aws-amplify/amplify-cli/commit/800d5a2f46b02bbd7d6b6dcf76d5cbb825fcdb46))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [5.0.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.6.8...graphql-transformers-e2e-tests@5.0.0) (2019-08-30)

- Adding Auth on Subscriptions (#2068) ([81c630d](https://github.com/aws-amplify/amplify-cli/commit/81c630d)), closes [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068)

### Bug Fixes

- **graphql-connection-transformer:** fix self connection bug ([#1944](https://github.com/aws-amplify/amplify-cli/issues/1944)) ([1a6affc](https://github.com/aws-amplify/amplify-cli/commit/1a6affc)), closes [#1799](https://github.com/aws-amplify/amplify-cli/issues/1799)
- [#2013](https://github.com/aws-amplify/amplify-cli/issues/2013) - Dynamic group auth when groups field is null ([#2097](https://github.com/aws-amplify/amplify-cli/issues/2097)) ([4ad3d5c](https://github.com/aws-amplify/amplify-cli/commit/4ad3d5c))
- **graphql-elasticsearch-transformer:** changed nonKeyword types ([#2090](https://github.com/aws-amplify/amplify-cli/issues/2090)) ([c2f71eb](https://github.com/aws-amplify/amplify-cli/commit/c2f71eb)), closes [#2080](https://github.com/aws-amplify/amplify-cli/issues/2080) [#800](https://github.com/aws-amplify/amplify-cli/issues/800) [#2080](https://github.com/aws-amplify/amplify-cli/issues/2080) [re#800](https://github.com/re/issues/800)
- **graphql-elasticsearch-transformer:** fixed es req template ([311f57d](https://github.com/aws-amplify/amplify-cli/commit/311f57d))

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))

### BREAKING CHANGES

- If an owner is used in the auth directive it will either be a requirement if it's
  the only rule or an optional input if used with other rules
- If an owner is included in the auth directive it will either be a requirement if
  it's the only rule or an optional input if used with other rules
- the subscription operations will require an argument if owner is the only auth rule
- Subscriptions will require an argument if an owner is only rule set - If owner &
  group rules are owner will be an optional arg

# [4.0.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.6.8...graphql-transformers-e2e-tests@4.0.0) (2019-08-28)

### Bug Fixes

- **graphql-connection-transformer:** fix self connection bug ([#1944](https://github.com/aws-amplify/amplify-cli/issues/1944)) ([1a6affc](https://github.com/aws-amplify/amplify-cli/commit/1a6affc)), closes [#1799](https://github.com/aws-amplify/amplify-cli/issues/1799)
- **graphql-elasticsearch-transformer:** fixed es req template ([311f57d](https://github.com/aws-amplify/amplify-cli/commit/311f57d))
- [#2013](https://github.com/aws-amplify/amplify-cli/issues/2013) - Dynamic group auth when groups field is null ([#2097](https://github.com/aws-amplify/amplify-cli/issues/2097)) ([4ad3d5c](https://github.com/aws-amplify/amplify-cli/commit/4ad3d5c))

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))

* Adding Auth on Subscriptions (#2068) ([81c630d](https://github.com/aws-amplify/amplify-cli/commit/81c630d)), closes [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068)

### BREAKING CHANGES

- If an owner is used in the auth directive it will either be a requirement if it's
  the only rule or an optional input if used with other rules
- If an owner is included in the auth directive it will either be a requirement if
  it's the only rule or an optional input if used with other rules
- the subscription operations will require an argument if owner is the only auth rule
- Subscriptions will require an argument if an owner is only rule set - If owner &
  group rules are owner will be an optional arg

# [3.10.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.6.8...graphql-transformers-e2e-tests@3.10.0) (2019-08-13)

### Bug Fixes

- **graphql-connection-transformer:** fix self connection bug ([#1944](https://github.com/aws-amplify/amplify-cli/issues/1944)) ([1a6affc](https://github.com/aws-amplify/amplify-cli/commit/1a6affc)), closes [#1799](https://github.com/aws-amplify/amplify-cli/issues/1799)
- **graphql-elasticsearch-transformer:** fixed es req template ([311f57d](https://github.com/aws-amplify/amplify-cli/commit/311f57d))

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))

# [3.9.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.6.8...graphql-transformers-e2e-tests@3.9.0) (2019-08-07)

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))

# [3.8.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.6.8...graphql-transformers-e2e-tests@3.8.0) (2019-08-02)

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))

# [3.7.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.6.8...graphql-transformers-e2e-tests@3.7.0) (2019-07-31)

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))

## [3.6.8](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.6.7...graphql-transformers-e2e-tests@3.6.8) (2019-07-24)

**Note:** Version bump only for package graphql-transformers-e2e-tests

## [3.6.7](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.6.6...graphql-transformers-e2e-tests@3.6.7) (2019-07-09)

### Bug Fixes

- **amplify-category-function:** enable SAM templates for functions ([#1763](https://github.com/aws-amplify/amplify-cli/issues/1763)) ([9fc3854](https://github.com/aws-amplify/amplify-cli/commit/9fc3854)), closes [#1740](https://github.com/aws-amplify/amplify-cli/issues/1740)

## [3.6.6](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.6.4...graphql-transformers-e2e-tests@3.6.6) (2019-06-30)

**Note:** Version bump only for package graphql-transformers-e2e-tests

## [3.6.4](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.6.3...graphql-transformers-e2e-tests@3.6.4) (2019-06-26)

### Bug Fixes

- **graphql-key-transformer:** Fix type resolve for 2 field [@key](https://github.com/key) when second field is an Enum ([#1619](https://github.com/aws-amplify/amplify-cli/issues/1619)) ([bbd82b0](https://github.com/aws-amplify/amplify-cli/commit/bbd82b0)), closes [#1572](https://github.com/aws-amplify/amplify-cli/issues/1572)

## [3.6.3](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.6.2...graphql-transformers-e2e-tests@3.6.3) (2019-06-12)

**Note:** Version bump only for package graphql-transformers-e2e-tests

## [3.6.2](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.6.1...graphql-transformers-e2e-tests@3.6.2) (2019-06-11)

### Bug Fixes

- **graphql-key-transformer:** 1587 bug fix ([3a04e19](https://github.com/aws-amplify/amplify-cli/commit/3a04e19)), closes [#1587](https://github.com/aws-amplify/amplify-cli/issues/1587)

## [3.6.1](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.6.0...graphql-transformers-e2e-tests@3.6.1) (2019-06-06)

### Bug Fixes

- **graphql-key-transformer:** update filter to emit JSON for filter expression([#1580](https://github.com/aws-amplify/amplify-cli/issues/1580)) ([8c9a3cd](https://github.com/aws-amplify/amplify-cli/commit/8c9a3cd)), closes [#1554](https://github.com/aws-amplify/amplify-cli/issues/1554)

# [3.6.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.5.5...graphql-transformers-e2e-tests@3.6.0) (2019-05-29)

### Features

- feature/[@key](https://github.com/key) ([#1463](https://github.com/aws-amplify/amplify-cli/issues/1463)) ([00ed819](https://github.com/aws-amplify/amplify-cli/commit/00ed819))

## [3.5.5](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.5.4...graphql-transformers-e2e-tests@3.5.5) (2019-05-21)

### Bug Fixes

- **graphql-function-transformer:** handle NONE env in [@function](https://github.com/function) ([#1491](https://github.com/aws-amplify/amplify-cli/issues/1491)) ([c742d7d](https://github.com/aws-amplify/amplify-cli/commit/c742d7d))

## [3.5.4](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.5.3...graphql-transformers-e2e-tests@3.5.4) (2019-05-17)

**Note:** Version bump only for package graphql-transformers-e2e-tests

## [3.5.3](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.5.1...graphql-transformers-e2e-tests@3.5.3) (2019-05-07)

**Note:** Version bump only for package graphql-transformers-e2e-tests

## [3.5.2](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.5.1...graphql-transformers-e2e-tests@3.5.2) (2019-05-06)

**Note:** Version bump only for package graphql-transformers-e2e-tests

## [3.5.1](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.5.0...graphql-transformers-e2e-tests@3.5.1) (2019-04-30)

**Note:** Version bump only for package graphql-transformers-e2e-tests

# [3.5.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.4.1...graphql-transformers-e2e-tests@3.5.0) (2019-04-16)

### Features

- **field-level-auth:** Add field level auth support via the [@auth](https://github.com/auth) directive ([#1262](https://github.com/aws-amplify/amplify-cli/issues/1262)) ([3b1c600](https://github.com/aws-amplify/amplify-cli/commit/3b1c600)), closes [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)

## [3.4.1](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.3.1...graphql-transformers-e2e-tests@3.4.1) (2019-04-09)

**Note:** Version bump only for package graphql-transformers-e2e-tests

## [3.3.1](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.0.9...graphql-transformers-e2e-tests@3.3.1) (2019-04-03)

### Bug Fixes

- **graphql-auth-transformer:** conditional group expression ([#1186](https://github.com/aws-amplify/amplify-cli/issues/1186)) ([83ef244](https://github.com/aws-amplify/amplify-cli/commit/83ef244)), closes [#360](https://github.com/aws-amplify/amplify-cli/issues/360)

## [3.0.9](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.0.8...graphql-transformers-e2e-tests@3.0.9) (2019-03-22)

**Note:** Version bump only for package graphql-transformers-e2e-tests

## [3.0.8](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.0.7...graphql-transformers-e2e-tests@3.0.8) (2019-03-05)

**Note:** Version bump only for package graphql-transformers-e2e-tests

## [3.0.7](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.0.6...graphql-transformers-e2e-tests@3.0.7) (2019-02-20)

**Note:** Version bump only for package graphql-transformers-e2e-tests

## [3.0.6](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.0.5...graphql-transformers-e2e-tests@3.0.6) (2019-02-12)

**Note:** Version bump only for package graphql-transformers-e2e-tests

## [3.0.5](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.0.3-beta.0...graphql-transformers-e2e-tests@3.0.5) (2019-02-11)

**Note:** Version bump only for package graphql-transformers-e2e-tests

## [3.0.3](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.0.3-beta.0...graphql-transformers-e2e-tests@3.0.3) (2019-02-11)

**Note:** Version bump only for package graphql-transformers-e2e-tests

## [3.0.3-beta.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@3.0.2...graphql-transformers-e2e-tests@3.0.3-beta.0) (2019-02-11)

**Note:** Version bump only for package graphql-transformers-e2e-tests

<a name="2.0.0-multienv.3"></a>

# [2.0.0-multienv.3](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@2.0.0-multienv.2...graphql-transformers-e2e-tests@2.0.0-multienv.3) (2019-01-24)

**Note:** Version bump only for package graphql-transformers-e2e-tests

<a name="2.0.0-multienv.2"></a>

# [2.0.0-multienv.2](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@1.0.34-multienv.2...graphql-transformers-e2e-tests@2.0.0-multienv.2) (2018-12-31)

### Bug Fixes

- update grahql transformer package versions for multienv ([8b4b2bd](https://github.com/aws-amplify/amplify-cli/commit/8b4b2bd))

<a name="1.0.34-multienv.2"></a>

## [1.0.34-multienv.2](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@1.0.34-multienv.1...graphql-transformers-e2e-tests@1.0.34-multienv.2) (2018-12-27)

**Note:** Version bump only for package graphql-transformers-e2e-tests

<a name="1.0.34-multienv.1"></a>

## [1.0.34-multienv.1](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@1.0.34-multienv.0...graphql-transformers-e2e-tests@1.0.34-multienv.1) (2018-12-19)

**Note:** Version bump only for package graphql-transformers-e2e-tests

<a name="1.0.34-multienv.0"></a>

## [1.0.34-multienv.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@1.0.33...graphql-transformers-e2e-tests@1.0.34-multienv.0) (2018-11-16)

**Note:** Version bump only for package graphql-transformers-e2e-tests

<a name="1.0.33"></a>

## [1.0.33](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@1.0.33-beta.0...graphql-transformers-e2e-tests@1.0.33) (2018-11-09)

**Note:** Version bump only for package graphql-transformers-e2e-tests

<a name="1.0.33-beta.0"></a>

## [1.0.33-beta.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@1.0.12...graphql-transformers-e2e-tests@1.0.33-beta.0) (2018-11-09)

**Note:** Version bump only for package graphql-transformers-e2e-tests

<a name="1.0.32"></a>

## [1.0.32](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@1.0.32-beta.0...graphql-transformers-e2e-tests@1.0.32) (2018-11-05)

**Note:** Version bump only for package graphql-transformers-e2e-tests

<a name="1.0.32-beta.0"></a>

## [1.0.32-beta.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@1.0.12...graphql-transformers-e2e-tests@1.0.32-beta.0) (2018-11-05)

**Note:** Version bump only for package graphql-transformers-e2e-tests

<a name="1.0.31"></a>

## [1.0.31](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@1.0.12...graphql-transformers-e2e-tests@1.0.31) (2018-11-02)

**Note:** Version bump only for package graphql-transformers-e2e-tests

<a name="1.0.30"></a>

## [1.0.30](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@1.0.30-beta.0...graphql-transformers-e2e-tests@1.0.30) (2018-11-02)

**Note:** Version bump only for package graphql-transformers-e2e-tests

<a name="1.0.30-beta.0"></a>

## [1.0.30-beta.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@1.0.12...graphql-transformers-e2e-tests@1.0.30-beta.0) (2018-11-02)

**Note:** Version bump only for package graphql-transformers-e2e-tests

<a name="1.0.29"></a>

## [1.0.29](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@1.0.29-beta.0...graphql-transformers-e2e-tests@1.0.29) (2018-10-23)

**Note:** Version bump only for package graphql-transformers-e2e-tests

<a name="1.0.29-beta.0"></a>

## [1.0.29-beta.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@1.0.12...graphql-transformers-e2e-tests@1.0.29-beta.0) (2018-10-23)

**Note:** Version bump only for package graphql-transformers-e2e-tests

<a name="1.0.28"></a>

## [1.0.28](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@1.0.28-beta.0...graphql-transformers-e2e-tests@1.0.28) (2018-10-18)

**Note:** Version bump only for package graphql-transformers-e2e-tests

<a name="1.0.28-beta.0"></a>

## [1.0.28-beta.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@1.0.12...graphql-transformers-e2e-tests@1.0.28-beta.0) (2018-10-12)

**Note:** Version bump only for package graphql-transformers-e2e-tests

<a name="1.0.12"></a>

## [1.0.12](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@1.0.11...graphql-transformers-e2e-tests@1.0.12) (2018-08-23)

**Note:** Version bump only for package graphql-transformers-e2e-tests

<a name="1.0.11"></a>

## [1.0.11](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@1.0.10...graphql-transformers-e2e-tests@1.0.11) (2018-08-23)

**Note:** Version bump only for package graphql-transformers-e2e-tests

<a name="1.0.10"></a>

## [1.0.10](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@1.0.9...graphql-transformers-e2e-tests@1.0.10) (2018-08-23)

**Note:** Version bump only for package graphql-transformers-e2e-tests

<a name="1.0.9"></a>

## [1.0.9](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@1.0.8...graphql-transformers-e2e-tests@1.0.9) (2018-08-23)

**Note:** Version bump only for package graphql-transformers-e2e-tests

<a name="1.0.8"></a>

## [1.0.8](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@1.0.7...graphql-transformers-e2e-tests@1.0.8) (2018-08-23)

**Note:** Version bump only for package graphql-transformers-e2e-tests

<a name="1.0.7"></a>

## [1.0.7](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@1.0.6...graphql-transformers-e2e-tests@1.0.7) (2018-08-23)

**Note:** Version bump only for package graphql-transformers-e2e-tests

<a name="1.0.6"></a>

## [1.0.6](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@1.0.5...graphql-transformers-e2e-tests@1.0.6) (2018-08-23)

**Note:** Version bump only for package graphql-transformers-e2e-tests

<a name="1.0.5"></a>

## [1.0.5](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformers-e2e-tests@1.0.4...graphql-transformers-e2e-tests@1.0.5) (2018-08-23)

**Note:** Version bump only for package graphql-transformers-e2e-tests

<a name="1.0.4"></a>

## 1.0.4 (2018-08-23)

**Note:** Version bump only for package graphql-transformers-e2e-tests

<a name="1.0.3"></a>

## 1.0.3 (2018-08-23)

**Note:** Version bump only for package graphql-transformers-e2e-tests

<a name="1.0.2"></a>

## 1.0.2 (2018-08-23)

**Note:** Version bump only for package graphql-transformers-e2e-tests

<a name="1.0.1"></a>

## 1.0.1 (2018-08-23)

**Note:** Version bump only for package graphql-transformers-e2e-tests
