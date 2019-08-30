# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 2.0.0 (2019-08-30)


### Bug Fixes

* **amplify-util-mock:** handle unsupported data source gracefully ([#1999](https://github.com/aws-amplify/amplify-cli/issues/1999)) ([f7cfe3e](https://github.com/aws-amplify/amplify-cli/commit/f7cfe3e)), closes [#1997](https://github.com/aws-amplify/amplify-cli/issues/1997)
* [#1056](https://github.com/aws-amplify/amplify-cli/issues/1056), dedup environment file reading ([#2088](https://github.com/aws-amplify/amplify-cli/issues/2088)) ([940deaa](https://github.com/aws-amplify/amplify-cli/commit/940deaa))
* local mock fix ([#1982](https://github.com/aws-amplify/amplify-cli/issues/1982)) ([8ee9029](https://github.com/aws-amplify/amplify-cli/commit/8ee9029))
* **amplify-util-mock:** include custom resolver templates ([#2119](https://github.com/aws-amplify/amplify-cli/issues/2119)) ([f7174a7](https://github.com/aws-amplify/amplify-cli/commit/f7174a7)), closes [#2049](https://github.com/aws-amplify/amplify-cli/issues/2049) [#2004](https://github.com/aws-amplify/amplify-cli/issues/2004)
* **amplify-util-mock:** prevent resolver file overwrite in windows ([#2007](https://github.com/aws-amplify/amplify-cli/issues/2007)) ([5b78d25](https://github.com/aws-amplify/amplify-cli/commit/5b78d25)), closes [#2006](https://github.com/aws-amplify/amplify-cli/issues/2006)
* **amplify-util-mock:** support large response from lambda ([#2060](https://github.com/aws-amplify/amplify-cli/issues/2060)) ([60efd28](https://github.com/aws-amplify/amplify-cli/commit/60efd28))


### Features

* mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
* **amplify-util-mock:** add support for S3 triggers in local mocking ([#2101](https://github.com/aws-amplify/amplify-cli/issues/2101)) ([ac9a134](https://github.com/aws-amplify/amplify-cli/commit/ac9a134))


* Adding Auth on Subscriptions (#2068) ([81c630d](https://github.com/aws-amplify/amplify-cli/commit/81c630d)), closes [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068)


### BREAKING CHANGES

* If an owner is used in the auth directive it will either be a requirement if it's
the only rule or an optional input if used with other rules
* If an owner is included in the auth directive it will either be a requirement if
it's the only rule or an optional input if used with other rules
* the subscription operations will require an argument if owner is the only auth rule
* Subscriptions will require an argument if an owner is only rule set - If owner &
group rules are owner will be an optional arg





# 1.0.0 (2019-08-28)


### Bug Fixes

* **amplify-util-mock:** handle unsupported data source gracefully ([#1999](https://github.com/aws-amplify/amplify-cli/issues/1999)) ([f7cfe3e](https://github.com/aws-amplify/amplify-cli/commit/f7cfe3e)), closes [#1997](https://github.com/aws-amplify/amplify-cli/issues/1997)
* [#1056](https://github.com/aws-amplify/amplify-cli/issues/1056), dedup environment file reading ([#2088](https://github.com/aws-amplify/amplify-cli/issues/2088)) ([940deaa](https://github.com/aws-amplify/amplify-cli/commit/940deaa))
* local mock fix ([#1982](https://github.com/aws-amplify/amplify-cli/issues/1982)) ([8ee9029](https://github.com/aws-amplify/amplify-cli/commit/8ee9029))
* **amplify-util-mock:** include custom resolver templates ([#2119](https://github.com/aws-amplify/amplify-cli/issues/2119)) ([f7174a7](https://github.com/aws-amplify/amplify-cli/commit/f7174a7)), closes [#2049](https://github.com/aws-amplify/amplify-cli/issues/2049) [#2004](https://github.com/aws-amplify/amplify-cli/issues/2004)
* **amplify-util-mock:** prevent resolver file overwrite in windows ([#2007](https://github.com/aws-amplify/amplify-cli/issues/2007)) ([5b78d25](https://github.com/aws-amplify/amplify-cli/commit/5b78d25)), closes [#2006](https://github.com/aws-amplify/amplify-cli/issues/2006)
* **amplify-util-mock:** support large response from lambda ([#2060](https://github.com/aws-amplify/amplify-cli/issues/2060)) ([60efd28](https://github.com/aws-amplify/amplify-cli/commit/60efd28))


### Features

* mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
* **amplify-util-mock:** add support for S3 triggers in local mocking ([#2101](https://github.com/aws-amplify/amplify-cli/issues/2101)) ([ac9a134](https://github.com/aws-amplify/amplify-cli/commit/ac9a134))


* Adding Auth on Subscriptions (#2068) ([81c630d](https://github.com/aws-amplify/amplify-cli/commit/81c630d)), closes [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068)


### BREAKING CHANGES

* If an owner is used in the auth directive it will either be a requirement if it's
the only rule or an optional input if used with other rules
* If an owner is included in the auth directive it will either be a requirement if
it's the only rule or an optional input if used with other rules
* the subscription operations will require an argument if owner is the only auth rule
* Subscriptions will require an argument if an owner is only rule set - If owner &
group rules are owner will be an optional arg





# 0.3.0 (2019-08-13)


### Bug Fixes

* local mock fix ([#1982](https://github.com/aws-amplify/amplify-cli/issues/1982)) ([8ee9029](https://github.com/aws-amplify/amplify-cli/commit/8ee9029))
* **amplify-util-mock:** handle unsupported data source gracefully ([#1999](https://github.com/aws-amplify/amplify-cli/issues/1999)) ([f7cfe3e](https://github.com/aws-amplify/amplify-cli/commit/f7cfe3e)), closes [#1997](https://github.com/aws-amplify/amplify-cli/issues/1997)
* **amplify-util-mock:** prevent resolver file overwrite in windows ([#2007](https://github.com/aws-amplify/amplify-cli/issues/2007)) ([5b78d25](https://github.com/aws-amplify/amplify-cli/commit/5b78d25)), closes [#2006](https://github.com/aws-amplify/amplify-cli/issues/2006)


### Features

* mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))





# 0.2.0 (2019-08-07)


### Bug Fixes

* local mock fix ([#1982](https://github.com/aws-amplify/amplify-cli/issues/1982)) ([8ee9029](https://github.com/aws-amplify/amplify-cli/commit/8ee9029))


### Features

* mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
