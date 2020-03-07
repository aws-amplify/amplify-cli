# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [3.15.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-util-mock@3.14.1...amplify-util-mock@3.15.2) (2020-03-07)


### Bug Fixes

* Bubbling error up to Graphiql from Lambda ([#3231](https://github.com/aws-amplify/amplify-cli/issues/3231)) ([12345da](https://github.com/aws-amplify/amplify-cli/commit/12345da3e99990d6f9994917667c30da0b0b2f2e))
* **amplify-util-mock:** fixes [#3510](https://github.com/aws-amplify/amplify-cli/issues/3510) bucketname error ([#3526](https://github.com/aws-amplify/amplify-cli/issues/3526)) ([0552f72](https://github.com/aws-amplify/amplify-cli/commit/0552f72cf3ec301c6ff0dc7d2617cf9beb787725))
* **graphql-auth-transformer:** add list support for ownerField in subs ([#3166](https://github.com/aws-amplify/amplify-cli/issues/3166)) ([8d68277](https://github.com/aws-amplify/amplify-cli/commit/8d6827752ebd076424d3c76122b136eca65b02a8))


### Reverts

* Revert "fix(graphql-auth-transformer): add list support for ownerField in subs (#3166)" (#3572) ([d693e6b](https://github.com/aws-amplify/amplify-cli/commit/d693e6b2819a5d20188fa9f68d94ef955e474bd3)), closes [#3166](https://github.com/aws-amplify/amplify-cli/issues/3166) [#3572](https://github.com/aws-amplify/amplify-cli/issues/3572)





## [3.15.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-util-mock@3.14.3-beta.0...amplify-util-mock@3.15.1) (2020-03-05)

**Note:** Version bump only for package amplify-util-mock





## [3.14.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-util-mock@3.14.0...amplify-util-mock@3.14.1) (2020-02-18)


### Bug Fixes

* regression in graphiql-explorer build ([#3453](https://github.com/aws-amplify/amplify-cli/issues/3453)) ([98c905e](https://github.com/aws-amplify/amplify-cli/commit/98c905edfdf52495224d2af3a934faeaab8b310a))





# [3.14.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-util-mock@3.13.2...amplify-util-mock@3.14.0) (2020-02-13)


### Features

* **amplify-util-mock:** update cfn processing  ([#3285](https://github.com/aws-amplify/amplify-cli/issues/3285)) ([ab369b3](https://github.com/aws-amplify/amplify-cli/commit/ab369b33a1459c9296c648748624e2219f1d1fcf))





## [3.13.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-util-mock@3.13.1...amplify-util-mock@3.13.2) (2020-02-07)


### Bug Fixes

* e2e tests, tsconfigs, [@deprecated](https://github.com/deprecated) directive for codegen: ([#3338](https://github.com/aws-amplify/amplify-cli/issues/3338)) ([2ed7715](https://github.com/aws-amplify/amplify-cli/commit/2ed77151dd6367ac9547f78fe600e7913a3d37b2))
* falsy values can be returned in mock now ([#3254](https://github.com/aws-amplify/amplify-cli/issues/3254)) ([6795e78](https://github.com/aws-amplify/amplify-cli/commit/6795e783c104004a2b2576f6903b35c1c6d2ed03)), closes [#2566](https://github.com/aws-amplify/amplify-cli/issues/2566)
* test config update for e2e ([#3345](https://github.com/aws-amplify/amplify-cli/issues/3345)) ([0d8cadc](https://github.com/aws-amplify/amplify-cli/commit/0d8cadcafeeaaaf1f4251017769021d00b8600be))





## [3.13.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-util-mock@3.13.0...amplify-util-mock@3.13.1) (2020-01-24)

**Note:** Version bump only for package amplify-util-mock





# [3.13.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-util-mock@2.17.0...amplify-util-mock@3.13.0) (2020-01-23)

### Bug Fixes

- **mock:** [#2606](https://github.com/aws-amplify/amplify-cli/issues/2606) - mocking does not start when there are LSIs in DynamoDB table ([#2667](https://github.com/aws-amplify/amplify-cli/issues/2667)) ([914470e](https://github.com/aws-amplify/amplify-cli/commit/914470e304391fbff756138d381754021aec6528))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- upgrade to node10 as min version for CLI ([#3128](https://github.com/aws-amplify/amplify-cli/issues/3128)) ([a0b18e0](https://github.com/aws-amplify/amplify-cli/commit/a0b18e0187a26b4ab0e6e986b0277f347e829444))

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [3.12.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-util-mock@2.17.0...amplify-util-mock@3.12.0) (2020-01-09)

### Bug Fixes

- **mock:** [#2606](https://github.com/aws-amplify/amplify-cli/issues/2606) - mocking does not start when there are LSIs in DynamoDB table ([#2667](https://github.com/aws-amplify/amplify-cli/issues/2667)) ([914470e](https://github.com/aws-amplify/amplify-cli/commit/914470e304391fbff756138d381754021aec6528))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- upgrade to node10 as min version for CLI ([#3128](https://github.com/aws-amplify/amplify-cli/issues/3128)) ([a0b18e0](https://github.com/aws-amplify/amplify-cli/commit/a0b18e0187a26b4ab0e6e986b0277f347e829444))

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [3.11.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-util-mock@2.17.0...amplify-util-mock@3.11.0) (2019-12-31)

### Bug Fixes

- **mock:** [#2606](https://github.com/aws-amplify/amplify-cli/issues/2606) - mocking does not start when there are LSIs in DynamoDB table ([#2667](https://github.com/aws-amplify/amplify-cli/issues/2667)) ([914470e](https://github.com/aws-amplify/amplify-cli/commit/914470e304391fbff756138d381754021aec6528))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [3.10.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-util-mock@2.17.0...amplify-util-mock@3.10.0) (2019-12-28)

### Bug Fixes

- **mock:** [#2606](https://github.com/aws-amplify/amplify-cli/issues/2606) - mocking does not start when there are LSIs in DynamoDB table ([#2667](https://github.com/aws-amplify/amplify-cli/issues/2667)) ([914470e](https://github.com/aws-amplify/amplify-cli/commit/914470e304391fbff756138d381754021aec6528))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [3.9.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-util-mock@2.17.0...amplify-util-mock@3.9.0) (2019-12-26)

### Bug Fixes

- **mock:** [#2606](https://github.com/aws-amplify/amplify-cli/issues/2606) - mocking does not start when there are LSIs in DynamoDB table ([#2667](https://github.com/aws-amplify/amplify-cli/issues/2667)) ([914470e](https://github.com/aws-amplify/amplify-cli/commit/914470e304391fbff756138d381754021aec6528))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [3.8.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-util-mock@2.17.0...amplify-util-mock@3.8.0) (2019-12-25)

### Bug Fixes

- **mock:** [#2606](https://github.com/aws-amplify/amplify-cli/issues/2606) - mocking does not start when there are LSIs in DynamoDB table ([#2667](https://github.com/aws-amplify/amplify-cli/issues/2667)) ([914470e](https://github.com/aws-amplify/amplify-cli/commit/914470e304391fbff756138d381754021aec6528))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [3.7.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-util-mock@2.17.0...amplify-util-mock@3.7.0) (2019-12-20)

### Bug Fixes

- **mock:** [#2606](https://github.com/aws-amplify/amplify-cli/issues/2606) - mocking does not start when there are LSIs in DynamoDB table ([#2667](https://github.com/aws-amplify/amplify-cli/issues/2667)) ([914470e](https://github.com/aws-amplify/amplify-cli/commit/914470e304391fbff756138d381754021aec6528))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [3.6.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-util-mock@2.17.0...amplify-util-mock@3.6.0) (2019-12-10)

### Bug Fixes

- **mock:** [#2606](https://github.com/aws-amplify/amplify-cli/issues/2606) - mocking does not start when there are LSIs in DynamoDB table ([#2667](https://github.com/aws-amplify/amplify-cli/issues/2667)) ([914470e](https://github.com/aws-amplify/amplify-cli/commit/914470e304391fbff756138d381754021aec6528))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [3.4.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-util-mock@2.17.0...amplify-util-mock@3.4.0) (2019-12-03)

### Bug Fixes

- **mock:** [#2606](https://github.com/aws-amplify/amplify-cli/issues/2606) - mocking does not start when there are LSIs in DynamoDB table ([#2667](https://github.com/aws-amplify/amplify-cli/issues/2667)) ([914470e](https://github.com/aws-amplify/amplify-cli/commit/914470e304391fbff756138d381754021aec6528))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [3.3.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-util-mock@2.17.0...amplify-util-mock@3.3.0) (2019-12-01)

### Bug Fixes

- **mock:** [#2606](https://github.com/aws-amplify/amplify-cli/issues/2606) - mocking does not start when there are LSIs in DynamoDB table ([#2667](https://github.com/aws-amplify/amplify-cli/issues/2667)) ([914470e](https://github.com/aws-amplify/amplify-cli/commit/914470e304391fbff756138d381754021aec6528))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [3.2.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-util-mock@2.17.0...amplify-util-mock@3.2.0) (2019-11-27)

### Bug Fixes

- **mock:** [#2606](https://github.com/aws-amplify/amplify-cli/issues/2606) - mocking does not start when there are LSIs in DynamoDB table ([#2667](https://github.com/aws-amplify/amplify-cli/issues/2667)) ([914470e](https://github.com/aws-amplify/amplify-cli/commit/914470e304391fbff756138d381754021aec6528))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [3.1.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-util-mock@2.17.0...amplify-util-mock@3.1.0) (2019-11-27)

### Bug Fixes

- **mock:** [#2606](https://github.com/aws-amplify/amplify-cli/issues/2606) - mocking does not start when there are LSIs in DynamoDB table ([#2667](https://github.com/aws-amplify/amplify-cli/issues/2667)) ([914470e](https://github.com/aws-amplify/amplify-cli/commit/914470e304391fbff756138d381754021aec6528))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))

### Features

- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# 2.0.0 (2019-08-30)

### Bug Fixes

- **amplify-util-mock:** handle unsupported data source gracefully ([#1999](https://github.com/aws-amplify/amplify-cli/issues/1999)) ([f7cfe3e](https://github.com/aws-amplify/amplify-cli/commit/f7cfe3e)), closes [#1997](https://github.com/aws-amplify/amplify-cli/issues/1997)
- [#1056](https://github.com/aws-amplify/amplify-cli/issues/1056), dedup environment file reading ([#2088](https://github.com/aws-amplify/amplify-cli/issues/2088)) ([940deaa](https://github.com/aws-amplify/amplify-cli/commit/940deaa))
- local mock fix ([#1982](https://github.com/aws-amplify/amplify-cli/issues/1982)) ([8ee9029](https://github.com/aws-amplify/amplify-cli/commit/8ee9029))
- **amplify-util-mock:** include custom resolver templates ([#2119](https://github.com/aws-amplify/amplify-cli/issues/2119)) ([f7174a7](https://github.com/aws-amplify/amplify-cli/commit/f7174a7)), closes [#2049](https://github.com/aws-amplify/amplify-cli/issues/2049) [#2004](https://github.com/aws-amplify/amplify-cli/issues/2004)
- **amplify-util-mock:** prevent resolver file overwrite in windows ([#2007](https://github.com/aws-amplify/amplify-cli/issues/2007)) ([5b78d25](https://github.com/aws-amplify/amplify-cli/commit/5b78d25)), closes [#2006](https://github.com/aws-amplify/amplify-cli/issues/2006)
- **amplify-util-mock:** support large response from lambda ([#2060](https://github.com/aws-amplify/amplify-cli/issues/2060)) ([60efd28](https://github.com/aws-amplify/amplify-cli/commit/60efd28))

### Features

- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
- **amplify-util-mock:** add support for S3 triggers in local mocking ([#2101](https://github.com/aws-amplify/amplify-cli/issues/2101)) ([ac9a134](https://github.com/aws-amplify/amplify-cli/commit/ac9a134))

* Adding Auth on Subscriptions (#2068) ([81c630d](https://github.com/aws-amplify/amplify-cli/commit/81c630d)), closes [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068)

### BREAKING CHANGES

- If an owner is used in the auth directive it will either be a requirement if it's
  the only rule or an optional input if used with other rules
- If an owner is included in the auth directive it will either be a requirement if
  it's the only rule or an optional input if used with other rules
- the subscription operations will require an argument if owner is the only auth rule
- Subscriptions will require an argument if an owner is only rule set - If owner &
  group rules are owner will be an optional arg

# 1.0.0 (2019-08-28)

### Bug Fixes

- **amplify-util-mock:** handle unsupported data source gracefully ([#1999](https://github.com/aws-amplify/amplify-cli/issues/1999)) ([f7cfe3e](https://github.com/aws-amplify/amplify-cli/commit/f7cfe3e)), closes [#1997](https://github.com/aws-amplify/amplify-cli/issues/1997)
- [#1056](https://github.com/aws-amplify/amplify-cli/issues/1056), dedup environment file reading ([#2088](https://github.com/aws-amplify/amplify-cli/issues/2088)) ([940deaa](https://github.com/aws-amplify/amplify-cli/commit/940deaa))
- local mock fix ([#1982](https://github.com/aws-amplify/amplify-cli/issues/1982)) ([8ee9029](https://github.com/aws-amplify/amplify-cli/commit/8ee9029))
- **amplify-util-mock:** include custom resolver templates ([#2119](https://github.com/aws-amplify/amplify-cli/issues/2119)) ([f7174a7](https://github.com/aws-amplify/amplify-cli/commit/f7174a7)), closes [#2049](https://github.com/aws-amplify/amplify-cli/issues/2049) [#2004](https://github.com/aws-amplify/amplify-cli/issues/2004)
- **amplify-util-mock:** prevent resolver file overwrite in windows ([#2007](https://github.com/aws-amplify/amplify-cli/issues/2007)) ([5b78d25](https://github.com/aws-amplify/amplify-cli/commit/5b78d25)), closes [#2006](https://github.com/aws-amplify/amplify-cli/issues/2006)
- **amplify-util-mock:** support large response from lambda ([#2060](https://github.com/aws-amplify/amplify-cli/issues/2060)) ([60efd28](https://github.com/aws-amplify/amplify-cli/commit/60efd28))

### Features

- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
- **amplify-util-mock:** add support for S3 triggers in local mocking ([#2101](https://github.com/aws-amplify/amplify-cli/issues/2101)) ([ac9a134](https://github.com/aws-amplify/amplify-cli/commit/ac9a134))

* Adding Auth on Subscriptions (#2068) ([81c630d](https://github.com/aws-amplify/amplify-cli/commit/81c630d)), closes [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068)

### BREAKING CHANGES

- If an owner is used in the auth directive it will either be a requirement if it's
  the only rule or an optional input if used with other rules
- If an owner is included in the auth directive it will either be a requirement if
  it's the only rule or an optional input if used with other rules
- the subscription operations will require an argument if owner is the only auth rule
- Subscriptions will require an argument if an owner is only rule set - If owner &
  group rules are owner will be an optional arg

# 0.3.0 (2019-08-13)

### Bug Fixes

- local mock fix ([#1982](https://github.com/aws-amplify/amplify-cli/issues/1982)) ([8ee9029](https://github.com/aws-amplify/amplify-cli/commit/8ee9029))
- **amplify-util-mock:** handle unsupported data source gracefully ([#1999](https://github.com/aws-amplify/amplify-cli/issues/1999)) ([f7cfe3e](https://github.com/aws-amplify/amplify-cli/commit/f7cfe3e)), closes [#1997](https://github.com/aws-amplify/amplify-cli/issues/1997)
- **amplify-util-mock:** prevent resolver file overwrite in windows ([#2007](https://github.com/aws-amplify/amplify-cli/issues/2007)) ([5b78d25](https://github.com/aws-amplify/amplify-cli/commit/5b78d25)), closes [#2006](https://github.com/aws-amplify/amplify-cli/issues/2006)

### Features

- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))

# 0.2.0 (2019-08-07)

### Bug Fixes

- local mock fix ([#1982](https://github.com/aws-amplify/amplify-cli/issues/1982)) ([8ee9029](https://github.com/aws-amplify/amplify-cli/commit/8ee9029))

### Features

- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
