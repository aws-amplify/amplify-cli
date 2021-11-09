# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 1.1.0-ext17.0 (2021-11-09)


### Bug Fixes

* add missing await, fix import paths ([#8199](https://github.com/aws-amplify/amplify-cli/issues/8199)) ([51c4dd9](https://github.com/aws-amplify/amplify-cli/commit/51c4dd9c021d894fe2c06fc005e1e1960fe4529c))
* added public access to scoped packages ([#8485](https://github.com/aws-amplify/amplify-cli/issues/8485)) ([4a3cb86](https://github.com/aws-amplify/amplify-cli/commit/4a3cb869dbd955d5f529afc30a37b011c7957730))
* adds userPool resourceName instead of authResource ([#8497](https://github.com/aws-amplify/amplify-cli/issues/8497)) ([a627e18](https://github.com/aws-amplify/amplify-cli/commit/a627e18ce88b6ae2f02579b3c963b8a277e22905))
* admin UI test ([aeb53f7](https://github.com/aws-amplify/amplify-cli/commit/aeb53f7898be72a6be469f9994671f3e8865027d))
* alias attr bug and use enabled mfa ([6e99645](https://github.com/aws-amplify/amplify-cli/commit/6e996452685a151ad6c332026834c6382a3e04f0))
* **amplify-category-auth:** switching to social providers with user pools instead of identity pools ([#8308](https://github.com/aws-amplify/amplify-cli/issues/8308)) ([0c82fe3](https://github.com/aws-amplify/amplify-cli/commit/0c82fe3ef73456192e993c380bc35f01663eb0cf))
* **amplify-category-auth:** update attr mapping... ([#8135](https://github.com/aws-amplify/amplify-cli/issues/8135)) ([a35352d](https://github.com/aws-amplify/amplify-cli/commit/a35352d8b202440161a9e6fe8ea780e614f81c13)), closes [#7793](https://github.com/aws-amplify/amplify-cli/issues/7793)
* **amplify-category-auth:** update front end config on pull ([#8173](https://github.com/aws-amplify/amplify-cli/issues/8173)) ([da2b008](https://github.com/aws-amplify/amplify-cli/commit/da2b0083add2f5b10520efade8628080a34c8791))
* asana bug fixes ([#8692](https://github.com/aws-amplify/amplify-cli/issues/8692)) ([769e341](https://github.com/aws-amplify/amplify-cli/commit/769e3413f5e4c97d929ef1dc4ebd2ba1134fde38))
* auth e2e fixes ([49b204e](https://github.com/aws-amplify/amplify-cli/commit/49b204e4a007c432abb3bfc38f0a47012469cc76))
* auth issue in export tests ([#8710](https://github.com/aws-amplify/amplify-cli/issues/8710)) ([5c54579](https://github.com/aws-amplify/amplify-cli/commit/5c54579206c3fa0c4b502d6b6aec5887f119c8ec))
* broken unit tests ([6970410](https://github.com/aws-amplify/amplify-cli/commit/69704103a775235e107015f8be6086b2f75ae2e3))
* bug fixes in external auth enable ([312ff8e](https://github.com/aws-amplify/amplify-cli/commit/312ff8ef6d79f456f6361915441fec73b6bd56e8))
* enable scoped packages in plugin platform ([#8492](https://github.com/aws-amplify/amplify-cli/issues/8492)) ([76734c2](https://github.com/aws-amplify/amplify-cli/commit/76734c255fe4c31a05933abcddb350365df2b9c1))
* fixes dependsOn parameter and auth migration test ([#8480](https://github.com/aws-amplify/amplify-cli/issues/8480)) ([423fab1](https://github.com/aws-amplify/amplify-cli/commit/423fab1a579f500c70e9b8a0f1c4b3933969a7e6))
* headless migrate auth ([#8735](https://github.com/aws-amplify/amplify-cli/issues/8735)) ([b1e2d3c](https://github.com/aws-amplify/amplify-cli/commit/b1e2d3c78f90d0dc5aa0dac1f7781519b1346fef))
* latest changes ([3290e2e](https://github.com/aws-amplify/amplify-cli/commit/3290e2ea2fdaa6dc6126a69ffaee987cca6a9bba))
* parameters file path and updates cloud backend with build ([#8564](https://github.com/aws-amplify/amplify-cli/issues/8564)) ([2b2ad6b](https://github.com/aws-amplify/amplify-cli/commit/2b2ad6b6c05da591da8017fbe688aebbb36ef822))
* tsc global install error ([e540d00](https://github.com/aws-amplify/amplify-cli/commit/e540d000ee670bfbe6c09be57f5e19a0e50a0240))
* update custom cdk seleton tempaltes + format override skeleton file ([f19e441](https://github.com/aws-amplify/amplify-cli/commit/f19e44113c29f75d28de19ede001323697e12415))
* userPool group template fixes ([#8515](https://github.com/aws-amplify/amplify-cli/issues/8515)) ([518c35d](https://github.com/aws-amplify/amplify-cli/commit/518c35d9bcb6f11e7f31385866e8ef838a1e67ea))


### Features

* Auth refactor to  use cdk, eliminate EJS, overrides functionality ([#8355](https://github.com/aws-amplify/amplify-cli/issues/8355)) ([d25d7fb](https://github.com/aws-amplify/amplify-cli/commit/d25d7fb123274eb636717f454b482a714dd4c275))
* change override.ts file to override.ts.sample in resources/ for pkg CLI to work ([#8716](https://github.com/aws-amplify/amplify-cli/issues/8716)) ([4a14250](https://github.com/aws-amplify/amplify-cli/commit/4a14250c07f243ee5076c8829a567e6df5329b3a))
* extensibility for REST APIs ([#8598](https://github.com/aws-amplify/amplify-cli/issues/8598)) ([4ea2bc5](https://github.com/aws-amplify/amplify-cli/commit/4ea2bc5d4320a4c2ee0d69f0517106fde2460d3a))
* overrides uniformity accross all the categories ([#8695](https://github.com/aws-amplify/amplify-cli/issues/8695)) ([6ee2f4b](https://github.com/aws-amplify/amplify-cli/commit/6ee2f4b01420343bfcf7fcaf2141076ab3f1be05))


### Reverts

* Revert "Revert "feat(amplify-category-auth): use EnabledMFAs to only configure TOTP (#7779)" (#7790)" (#7971) ([ff418d1](https://github.com/aws-amplify/amplify-cli/commit/ff418d151879da2c89f2aced6d67d602f7395371)), closes [#7779](https://github.com/aws-amplify/amplify-cli/issues/7779) [#7790](https://github.com/aws-amplify/amplify-cli/issues/7790) [#7971](https://github.com/aws-amplify/amplify-cli/issues/7971)



## 6.0.1 (2021-09-20)


### Bug Fixes

* added warning for usernameAttributes ([#8202](https://github.com/aws-amplify/amplify-cli/issues/8202)) ([b56eef0](https://github.com/aws-amplify/amplify-cli/commit/b56eef07a42b6d44f3834a4f204bd029eb653a2e))
* **amplify-category-auth:** add auth user selections to aws-exports/amplifyconfiguration files ([#7807](https://github.com/aws-amplify/amplify-cli/issues/7807)) ([3deae39](https://github.com/aws-amplify/amplify-cli/commit/3deae3969740562c8fe1a82d2659e0efffccb49d))
* **amplify-category-auth:** add handling for undefined autoVerifiedAttributes ([#7780](https://github.com/aws-amplify/amplify-cli/issues/7780)) ([3aac45d](https://github.com/aws-amplify/amplify-cli/commit/3aac45d472903c2de2338409e71d6ba07248aa6b))
* **amplify-category-auth:** check for undefined aliasAttributes ([#8203](https://github.com/aws-amplify/amplify-cli/issues/8203)) ([c68dda1](https://github.com/aws-amplify/amplify-cli/commit/c68dda1888efe4fcc6d837864a50db54630cff5e))
* **amplify-category-auth:** fixed no parameter when hostedui is not present ([#7914](https://github.com/aws-amplify/amplify-cli/issues/7914)) ([a83c978](https://github.com/aws-amplify/amplify-cli/commit/a83c978bb18c6fc1980343523c7ee560079cefe5))
* **amplify-category-auth:** fixed walkthrough prompt after choosing same web & native app clients ([#7954](https://github.com/aws-amplify/amplify-cli/issues/7954)) ([49d0e51](https://github.com/aws-amplify/amplify-cli/commit/49d0e51e6cf8b9e986dc309abdb67df930b0da13))
* **amplify-category-auth:** handle undefined aliasattributes ([#8222](https://github.com/aws-amplify/amplify-cli/issues/8222)) ([c3b89af](https://github.com/aws-amplify/amplify-cli/commit/c3b89afbc410dd5de7964a8002dd4dc459199d00))
* **amplify-category-auth:** update attr mapping... ([#7979](https://github.com/aws-amplify/amplify-cli/issues/7979)) ([94d2491](https://github.com/aws-amplify/amplify-cli/commit/94d2491ca8b41c1673cca0dd7bf96ac1c3f2db69)), closes [#7793](https://github.com/aws-amplify/amplify-cli/issues/7793)
* lambda timeout should be an integer type ([#7699](https://github.com/aws-amplify/amplify-cli/issues/7699)) ([cbacf4d](https://github.com/aws-amplify/amplify-cli/commit/cbacf4d3e497421855c09825970e025550aacfd7))
* remove overwrite of email-only verification when triggers are added ([#7671](https://github.com/aws-amplify/amplify-cli/issues/7671)) ([704295b](https://github.com/aws-amplify/amplify-cli/commit/704295b918701eb81fdaabb786417463672fa02c))
* upgrade node default runtime to 14 ([#7700](https://github.com/aws-amplify/amplify-cli/issues/7700)) ([47968cc](https://github.com/aws-amplify/amplify-cli/commit/47968cc9c704ac1cffcbd0dbe40d164b1b1d48d6))
* verification-link variable with small typo ([#8073](https://github.com/aws-amplify/amplify-cli/issues/8073)) ([d9afc20](https://github.com/aws-amplify/amplify-cli/commit/d9afc20864cbfcc1eadc3e5c262888187624a5ad))


### Features

* **amplify-category-auth:** add auth verification mechanisms to frontend config ([#8037](https://github.com/aws-amplify/amplify-cli/issues/8037)) ([88494b3](https://github.com/aws-amplify/amplify-cli/commit/88494b3f12a9989273aa3ae3e68c629f4c4cdff9))
* **amplify-category-auth:** add auth verification mechanisms to frontend config ([#8037](https://github.com/aws-amplify/amplify-cli/issues/8037)) ([#8093](https://github.com/aws-amplify/amplify-cli/issues/8093)) ([b8949b2](https://github.com/aws-amplify/amplify-cli/commit/b8949b2b519f6b6a26bcab3596c051acec51e077))
* **amplify-category-auth:** enable alternative signup/signin options ([#7461](https://github.com/aws-amplify/amplify-cli/issues/7461)) ([56a0c35](https://github.com/aws-amplify/amplify-cli/commit/56a0c35d2cef0fbff27c80f78dba57516ef18afb)), closes [#1546](https://github.com/aws-amplify/amplify-cli/issues/1546)
* **amplify-category-auth:** use EnabledMFAs to only configure TOTP ([#7779](https://github.com/aws-amplify/amplify-cli/issues/7779)) ([c2102c5](https://github.com/aws-amplify/amplify-cli/commit/c2102c53fd2ca974fb95c4468ad7a87fefe14ab0))
* **amplify-category-auth:** use usernameAttributes by default, FF for aliasAttributes ([#8188](https://github.com/aws-amplify/amplify-cli/issues/8188)) ([f3044ee](https://github.com/aws-amplify/amplify-cli/commit/f3044eeff21fa900da5aac613db87502526bc165))


### Reverts

* Revert "feat(amplify-category-auth): add auth verification mechanisms to frontend config (#8037) (#8093)" (#8158) ([50f07ef](https://github.com/aws-amplify/amplify-cli/commit/50f07efcf7c5663b6fd123d300ec473377d03abe)), closes [#8037](https://github.com/aws-amplify/amplify-cli/issues/8037) [#8093](https://github.com/aws-amplify/amplify-cli/issues/8093) [#8158](https://github.com/aws-amplify/amplify-cli/issues/8158)
* Revert "fix(amplify-category-auth): update attr mapping... (#7979)" (#8115) ([35af7e1](https://github.com/aws-amplify/amplify-cli/commit/35af7e147d817206fe979fe2320e074407204a0a)), closes [#7979](https://github.com/aws-amplify/amplify-cli/issues/7979) [#8115](https://github.com/aws-amplify/amplify-cli/issues/8115)
* Revert "feat(amplify-category-auth): use EnabledMFAs to only configure TOTP (#7779)" (#7790) ([fa172c4](https://github.com/aws-amplify/amplify-cli/commit/fa172c4caf6f15de56925bd1ff4f8ee743788b52)), closes [#7779](https://github.com/aws-amplify/amplify-cli/issues/7779) [#7790](https://github.com/aws-amplify/amplify-cli/issues/7790)
* Revert "fix: upgrade node default runtime to 14 (#7700)" (#7763) ([3ab8769](https://github.com/aws-amplify/amplify-cli/commit/3ab87694203584cdfa208bf75e648e0e944f5e18)), closes [#7700](https://github.com/aws-amplify/amplify-cli/issues/7700) [#7763](https://github.com/aws-amplify/amplify-cli/issues/7763)



## 5.1.2 (2021-07-15)


### Bug Fixes

* **amplify-category-auth:** \n made OS specific ([#7663](https://github.com/aws-amplify/amplify-cli/issues/7663)) ([3c0823e](https://github.com/aws-amplify/amplify-cli/commit/3c0823e8e004e00808351e958f5b587e8d77bd01)), closes [#7662](https://github.com/aws-amplify/amplify-cli/issues/7662)
* **amplify-category-auth:** added passrole policy to MFALambaRole ([#7729](https://github.com/aws-amplify/amplify-cli/issues/7729)) ([cd5d33a](https://github.com/aws-amplify/amplify-cli/commit/cd5d33aa822ceeb19a1af847d8c3eab0f1d10632))
* **auth:** standardize CloudFormation trigger templates, prevent errors at runtime ([#7219](https://github.com/aws-amplify/amplify-cli/issues/7219)) ([f9796bd](https://github.com/aws-amplify/amplify-cli/commit/f9796bd3aca6606f155d37ac6a8931d6bdec25b9))



## 5.1.1 (2021-07-07)


### Bug Fixes

* **amplify-category-auth:** check for siwa Cognito idp params ([#7678](https://github.com/aws-amplify/amplify-cli/issues/7678)) ([0c0adfb](https://github.com/aws-amplify/amplify-cli/commit/0c0adfb78350a192d4f44b722d6038b23c505527))


### Features

* **import-auth:** add headless support ([#7266](https://github.com/aws-amplify/amplify-cli/issues/7266)) ([7fa478b](https://github.com/aws-amplify/amplify-cli/commit/7fa478bbfebbbe70e286eb19d436d772c32c4fd2))
* support for sign in with apple ([#7413](https://github.com/aws-amplify/amplify-cli/issues/7413)) ([00d6676](https://github.com/aws-amplify/amplify-cli/commit/00d6676b4c1d6995cac01956078f7b6ee6186814))



# 4.52.0 (2021-06-01)


### Features

* add support for SMS Sandbox ([#7436](https://github.com/aws-amplify/amplify-cli/issues/7436)) ([cdcb626](https://github.com/aws-amplify/amplify-cli/commit/cdcb6260c11bbedef5b056fdcd730612d8bb3230))



## 4.51.3 (2021-05-25)


### Bug Fixes

* add `sharedId` in `externalAuthEnable()` ([#7315](https://github.com/aws-amplify/amplify-cli/issues/7315)) ([fd552b4](https://github.com/aws-amplify/amplify-cli/commit/fd552b4c8d34d67c05330ae79804b00daa976f1d))
* scope down usage of PassRole ([#7317](https://github.com/aws-amplify/amplify-cli/issues/7317)) ([d4d9394](https://github.com/aws-amplify/amplify-cli/commit/d4d9394f33995a6852d5b00e09d38802798ca6d7))
* update auth sms workflow check ([#7396](https://github.com/aws-amplify/amplify-cli/issues/7396)) ([07a6fe4](https://github.com/aws-amplify/amplify-cli/commit/07a6fe47d1c39d952eef242400cdbb7e8a6a11eb))



## 4.51.2 (2021-05-20)


### Bug Fixes

* updated ejs template for empty object triggers ([#7351](https://github.com/aws-amplify/amplify-cli/issues/7351)) ([572ddbd](https://github.com/aws-amplify/amplify-cli/commit/572ddbda4f339d364a8a20bab0053140cf798f34))


### Features

* prep work for Cognito SMS Sandbox [#2](https://github.com/aws-amplify/amplify-cli/issues/2) ([#7338](https://github.com/aws-amplify/amplify-cli/issues/7338)) ([3dbb3bf](https://github.com/aws-amplify/amplify-cli/commit/3dbb3bfc199fdd7faac68cdee236d2625d6fb1ea))



## 4.51.1 (2021-05-18)



# 4.51.0 (2021-05-13)


### Bug Fixes

* [#4657](https://github.com/aws-amplify/amplify-cli/issues/4657) preserve previous authSelections in update flow ([#7255](https://github.com/aws-amplify/amplify-cli/issues/7255)) ([afbaa08](https://github.com/aws-amplify/amplify-cli/commit/afbaa08ac54bb001b640c808cf136c124089e5fc))
* e2e failed tests for auth Triggers PR ([#7262](https://github.com/aws-amplify/amplify-cli/issues/7262)) ([fedb6c4](https://github.com/aws-amplify/amplify-cli/commit/fedb6c49cf0695e21f59929e7d0554b59290f2f1))
* ejs template fix when no triggers added ([#7267](https://github.com/aws-amplify/amplify-cli/issues/7267)) ([81786a8](https://github.com/aws-amplify/amplify-cli/commit/81786a8d654f3ba2550e59986d85a654e5ed44dd))


### Features

* prep work for SMS Sandbox support ([#7302](https://github.com/aws-amplify/amplify-cli/issues/7302)) ([d1f85d2](https://github.com/aws-amplify/amplify-cli/commit/d1f85d2e0a9c367b71defefe6d9e00737f681ca4))
* Support for Apple Sign In ([#7265](https://github.com/aws-amplify/amplify-cli/issues/7265)) ([9f5e659](https://github.com/aws-amplify/amplify-cli/commit/9f5e659d63362c7f47eaa147c68d40d5bcc36fcc))



## 4.50.2 (2021-05-03)



## 4.50.1 (2021-05-03)


### Bug Fixes

* **amplify-category-auth:** add lambda with AdminQueries API permissions ([#6935](https://github.com/aws-amplify/amplify-cli/issues/6935)) ([756b0f7](https://github.com/aws-amplify/amplify-cli/commit/756b0f70e3b060a4603290c0ab1ff7e3033d6021)), closes [#6576](https://github.com/aws-amplify/amplify-cli/issues/6576)
* **cli:** use more inclusive language ([#6919](https://github.com/aws-amplify/amplify-cli/issues/6919)) ([bb70464](https://github.com/aws-amplify/amplify-cli/commit/bb70464d6c24fa931c0eb80d234a496d936913f5))
* render the right auth mode for admin queries in config files ([#7118](https://github.com/aws-amplify/amplify-cli/issues/7118)) ([8f8deba](https://github.com/aws-amplify/amplify-cli/commit/8f8deba9171a30433aa6820af1f32f5498db5028)), closes [#6983](https://github.com/aws-amplify/amplify-cli/issues/6983)



## 4.46.1 (2021-03-23)


### Bug Fixes

* [#4175](https://github.com/aws-amplify/amplify-cli/issues/4175) ([#6065](https://github.com/aws-amplify/amplify-cli/issues/6065)) ([85b1ae3](https://github.com/aws-amplify/amplify-cli/commit/85b1ae31253d06718e13a2e2ff8cca3fc1931073))
* [#6397](https://github.com/aws-amplify/amplify-cli/issues/6397) - auth update overwrite parameters ([#6403](https://github.com/aws-amplify/amplify-cli/issues/6403)) ([75f5ace](https://github.com/aws-amplify/amplify-cli/commit/75f5ace173a6b36b943e2110845e411a2cce5d6d))
* add check for undefined appId ([#6009](https://github.com/aws-amplify/amplify-cli/issues/6009)) ([db9bf58](https://github.com/aws-amplify/amplify-cli/commit/db9bf58c5c721be1125aca6972ce76a9ef222cd9))
* add sms auth message to cfn template ([#6789](https://github.com/aws-amplify/amplify-cli/issues/6789)) ([7f9ea84](https://github.com/aws-amplify/amplify-cli/commit/7f9ea84f741ec9001dac9be55944d05c4534acb3))
* appclient secret output default to false ([#6333](https://github.com/aws-amplify/amplify-cli/issues/6333)) ([3da53b7](https://github.com/aws-amplify/amplify-cli/commit/3da53b7c9aacf718ebd8ea63e59928425af20764))
* appId is only required for admin ([#6007](https://github.com/aws-amplify/amplify-cli/issues/6007)) ([6eee2a2](https://github.com/aws-amplify/amplify-cli/commit/6eee2a245d2deae9d6faf81c84bbcd551561cd5c))
* apply empty arrays as default values but not undefined values ([#6445](https://github.com/aws-amplify/amplify-cli/issues/6445)) ([c2d2a6c](https://github.com/aws-amplify/amplify-cli/commit/c2d2a6cbffaed255a4cac7738d4691dda25e8710))
* **auth:** update oauth prompt help text to mention that selecting "no" will remove existing configuration ([#6670](https://github.com/aws-amplify/amplify-cli/issues/6670)) ([83ec192](https://github.com/aws-amplify/amplify-cli/commit/83ec1923bdeffc328d0e97b658657894a79f4ca0))
* correct given_name fb attribute mapping ([#6510](https://github.com/aws-amplify/amplify-cli/issues/6510)) ([c26d958](https://github.com/aws-amplify/amplify-cli/commit/c26d95866a0496b26d4d7581eb2096b87390f50e))
* ensure auth selections overwrite defaults ([#6071](https://github.com/aws-amplify/amplify-cli/issues/6071)) ([4b22fb2](https://github.com/aws-amplify/amplify-cli/commit/4b22fb281ba1ba4efa6b9d41f736450f2a959cc7))
* exclude env add from check ([a7e0351](https://github.com/aws-amplify/amplify-cli/commit/a7e035126e264abf1c075b17cbd9a82fa3963481))
* generating condition for user pool ([#6426](https://github.com/aws-amplify/amplify-cli/issues/6426)) ([4f35e08](https://github.com/aws-amplify/amplify-cli/commit/4f35e08e38900f59e4b98da1417deb204f072f6a))
* insert hostedUIProviderCreds empty array on hostedUI ([#6485](https://github.com/aws-amplify/amplify-cli/issues/6485)) ([5ebee51](https://github.com/aws-amplify/amplify-cli/commit/5ebee516373c0544f1400f054eb382bb5b887253))


### Features

* add support for importing userpool with no appclient secret ([#6404](https://github.com/aws-amplify/amplify-cli/issues/6404)) ([4ce4138](https://github.com/aws-amplify/amplify-cli/commit/4ce413829f14aa90ca9ca27510249f1c6c39909f)), closes [#6333](https://github.com/aws-amplify/amplify-cli/issues/6333)
* container-based deployments([#5727](https://github.com/aws-amplify/amplify-cli/issues/5727)) ([fad6377](https://github.com/aws-amplify/amplify-cli/commit/fad6377bd384862ca4429cb1a83eee90efd62b58))
* dont open urls when CLI is running in CI ([#6503](https://github.com/aws-amplify/amplify-cli/issues/6503)) ([27546a7](https://github.com/aws-amplify/amplify-cli/commit/27546a78159ea95c636dbbd094fe6a4f7fb8f8f4)), closes [#5973](https://github.com/aws-amplify/amplify-cli/issues/5973)
* pre-deploy pull, new login mechanism and pkg cli updates ([#5941](https://github.com/aws-amplify/amplify-cli/issues/5941)) ([7274251](https://github.com/aws-amplify/amplify-cli/commit/7274251faadc1035acce5f44699b172e10e2e67d))
* remove OAuth prompt from pull and new env ([#6739](https://github.com/aws-amplify/amplify-cli/issues/6739)) ([8ff15a6](https://github.com/aws-amplify/amplify-cli/commit/8ff15a6ea2c3c687f0344fb4e17547097cd575ea))


### Reverts

* Revert "fix: insert hostedUIProviderCreds empty array on hostedUI (#6485)" (#6682) ([4185595](https://github.com/aws-amplify/amplify-cli/commit/41855953b074fe4179a68a4acaf9796515e12688)), closes [#6485](https://github.com/aws-amplify/amplify-cli/issues/6485) [#6682](https://github.com/aws-amplify/amplify-cli/issues/6682)
* Revert "fix: ensure auth selections overwrite defaults (#6071)" (#6179) ([05b88ad](https://github.com/aws-amplify/amplify-cli/commit/05b88ad1e8b9c286f38535ce8dfce58dc87d53fb)), closes [#6071](https://github.com/aws-amplify/amplify-cli/issues/6071) [#6179](https://github.com/aws-amplify/amplify-cli/issues/6179)
* "fix: remove app client secret as best practice" ([#5992](https://github.com/aws-amplify/amplify-cli/issues/5992)) ([d7d7fcf](https://github.com/aws-amplify/amplify-cli/commit/d7d7fcf65fb2928f5d97c2ada9fac8ebf3522ee0)), closes [#5731](https://github.com/aws-amplify/amplify-cli/issues/5731) [#5829](https://github.com/aws-amplify/amplify-cli/issues/5829)



# 4.37.0 (2020-11-27)


### Bug Fixes

* check hostedUI flag ([#5958](https://github.com/aws-amplify/amplify-cli/issues/5958)) ([ed310da](https://github.com/aws-amplify/amplify-cli/commit/ed310da1923b62242bf019f840deaa620aed32d1))



# 4.35.0 (2020-11-24)


### Bug Fixes

* **amplify-category-auth:** external auth enabled bugfix ([#5916](https://github.com/aws-amplify/amplify-cli/issues/5916)) ([a782103](https://github.com/aws-amplify/amplify-cli/commit/a78210316aac2692b4fe6d1e75ccb12b97682792))
* headless auth remove oauth when empty config specified ([#5930](https://github.com/aws-amplify/amplify-cli/issues/5930)) ([bb0d028](https://github.com/aws-amplify/amplify-cli/commit/bb0d028704f6508402794d5357c7501b366c9099))
* new auth triggers overwrite previous selections ([#5945](https://github.com/aws-amplify/amplify-cli/issues/5945)) ([419b6d3](https://github.com/aws-amplify/amplify-cli/commit/419b6d3997df25f0de4b55e5716a8dcbe2f042d9))
* remove app client secret as best practice ([#5731](https://github.com/aws-amplify/amplify-cli/issues/5731)) ([8bc0dd2](https://github.com/aws-amplify/amplify-cli/commit/8bc0dd2434b93c9a2cb1ff3bfad9cedd2d356c30))
* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))


### Features

* add support for listing Amazon Cognito groups ([#5109](https://github.com/aws-amplify/amplify-cli/issues/5109)) ([3157652](https://github.com/aws-amplify/amplify-cli/commit/3157652ecf51171b1a7375351bee1ba4af9d5f18))
* storage import ([#5893](https://github.com/aws-amplify/amplify-cli/issues/5893)) ([ad7b028](https://github.com/aws-amplify/amplify-cli/commit/ad7b028330bcee64d5124be7f27a8494dc8e9400))


### Reverts

* Revert "For the better security best practice, added PreventUserExistenceErrors: ENABLED. (#3534)" (#5736) ([3423228](https://github.com/aws-amplify/amplify-cli/commit/34232287c2e4dc466866528065c1900ac2954512)), closes [#3534](https://github.com/aws-amplify/amplify-cli/issues/3534) [#5736](https://github.com/aws-amplify/amplify-cli/issues/5736)



# 4.32.0-alpha.0 (2020-10-27)


### Bug Fixes

* [#1056](https://github.com/aws-amplify/amplify-cli/issues/1056), dedup environment file reading ([#2088](https://github.com/aws-amplify/amplify-cli/issues/2088)) ([940deaa](https://github.com/aws-amplify/amplify-cli/commit/940deaa6bbe7370e40e61946d0f1073623ba6e90))
* [#429](https://github.com/aws-amplify/amplify-cli/issues/429) - Editor hanging bug ([#2086](https://github.com/aws-amplify/amplify-cli/issues/2086)) ([6767445](https://github.com/aws-amplify/amplify-cli/commit/676744549f903fa3a4804d814eb325301ed462ba))
* add support for mobile hub migrated resources ([#5407](https://github.com/aws-amplify/amplify-cli/issues/5407)) ([5dfe287](https://github.com/aws-amplify/amplify-cli/commit/5dfe2872c153047ebdc56bc4f671fd57c12379d9))
* Added check to stop prompts for cognito triggers while using env commands ([#5039](https://github.com/aws-amplify/amplify-cli/issues/5039)) ([744dbc4](https://github.com/aws-amplify/amplify-cli/commit/744dbc42e847e273160caf3672365391f055191b))
* added exit code on remove ([#5427](https://github.com/aws-amplify/amplify-cli/issues/5427)) ([33132f7](https://github.com/aws-amplify/amplify-cli/commit/33132f764b290cafd345720409a5db8ea6088069))
* admin queries typo ([#5038](https://github.com/aws-amplify/amplify-cli/issues/5038)) ([1f37437](https://github.com/aws-amplify/amplify-cli/commit/1f374373061fff59b97e0f7ab3b3b84d1412416e))
* **amplify-category-api:** fix api add-graphql-datasource command ([#2320](https://github.com/aws-amplify/amplify-cli/issues/2320)) ([a9c829d](https://github.com/aws-amplify/amplify-cli/commit/a9c829d79e91246d2bb9a707ccfe886502ceebe2))
* **amplify-category-auth:** add policy name char length limit ([#1492](https://github.com/aws-amplify/amplify-cli/issues/1492)) ([d6a8785](https://github.com/aws-amplify/amplify-cli/commit/d6a87859e527bf94bff10382f7fea78b8f94cdf1)), closes [#1199](https://github.com/aws-amplify/amplify-cli/issues/1199)
* **amplify-category-auth:** adding PreAuthentication trigger ([42ee201](https://github.com/aws-amplify/amplify-cli/commit/42ee201051c3e4079837ebcc14bdba43fce45f8d)), closes [#1838](https://github.com/aws-amplify/amplify-cli/issues/1838)
* **amplify-category-auth:** adding unique Id to Role name ([#4231](https://github.com/aws-amplify/amplify-cli/issues/4231)) ([21de1af](https://github.com/aws-amplify/amplify-cli/commit/21de1affd89142598a1f8022c387b3c04994b1e0))
* **amplify-category-auth:** adds trigger flag to lambda response ([#2548](https://github.com/aws-amplify/amplify-cli/issues/2548)) ([270b4ac](https://github.com/aws-amplify/amplify-cli/commit/270b4ac8464ac1800235beceed158f58a9538488))
* **amplify-category-auth:** checks for google idp federation on native ([#2541](https://github.com/aws-amplify/amplify-cli/issues/2541)) ([e1de9ac](https://github.com/aws-amplify/amplify-cli/commit/e1de9acac96dc0f7f7630fe8e75a0c0b89d15986)), closes [#2284](https://github.com/aws-amplify/amplify-cli/issues/2284) [#2284](https://github.com/aws-amplify/amplify-cli/issues/2284)
* **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad863ad4febde47e56209d6026cddb344044))
* **amplify-category-auth:** fix add to group cognito trigger bug [#2216](https://github.com/aws-amplify/amplify-cli/issues/2216) ([9471576](https://github.com/aws-amplify/amplify-cli/commit/9471576dbf802d2212997c616eff4c1104a4cfc0)), closes [#2214](https://github.com/aws-amplify/amplify-cli/issues/2214)
* **amplify-category-auth:** Fix auth add not found on Windows. ([d9202fe](https://github.com/aws-amplify/amplify-cli/commit/d9202fe3886c02e3b5cdd20af5a5a8965556ae41))
* **amplify-category-auth:** fix auth console ([#5408](https://github.com/aws-amplify/amplify-cli/issues/5408)) ([afbe065](https://github.com/aws-amplify/amplify-cli/commit/afbe065757ce488c1769848d0db3d03465a9b6c9)), closes [#5364](https://github.com/aws-amplify/amplify-cli/issues/5364)
* **amplify-category-auth:** fix domain reserved words ([#1544](https://github.com/aws-amplify/amplify-cli/issues/1544)) ([31d4a89](https://github.com/aws-amplify/amplify-cli/commit/31d4a89173a1cc068160c13cdaaa68f4b7e4f64f)), closes [#1513](https://github.com/aws-amplify/amplify-cli/issues/1513)
* **amplify-category-auth:** fixed issue with updating urls in auth ([#3791](https://github.com/aws-amplify/amplify-cli/issues/3791)) ([236cd7a](https://github.com/aws-amplify/amplify-cli/commit/236cd7aecbdc2cbbb0dc9c565aae4e79ff40ebae))
* **amplify-category-auth:** fixes cloudformation template ([706de43](https://github.com/aws-amplify/amplify-cli/commit/706de438d542b825840b9142bcc93310902cdd29)), closes [#1247](https://github.com/aws-amplify/amplify-cli/issues/1247)
* **amplify-category-auth:** get env specific data in externalAuthEnable ([#473](https://github.com/aws-amplify/amplify-cli/issues/473)) ([6aa66cb](https://github.com/aws-amplify/amplify-cli/commit/6aa66cb166035981704f49034cf0b88539562dbc))
* **amplify-category-auth:** match cognito token expiration date range ([eb4c9ee](https://github.com/aws-amplify/amplify-cli/commit/eb4c9eecc92ba1cdb9959f173e806f71c601f750)), closes [#1385](https://github.com/aws-amplify/amplify-cli/issues/1385)
* **amplify-category-auth:** provide correct arn in permission policies ([#1610](https://github.com/aws-amplify/amplify-cli/issues/1610)) ([27fd157](https://github.com/aws-amplify/amplify-cli/commit/27fd157f8fd6d226772e164477748e1b28a4819f))
* **amplify-category-auth:** removes deprecated props for external auth ([#2587](https://github.com/aws-amplify/amplify-cli/issues/2587)) ([08c0c70](https://github.com/aws-amplify/amplify-cli/commit/08c0c706bce7fd5996ce7c782512f694c1ff0455)), closes [#2309](https://github.com/aws-amplify/amplify-cli/issues/2309)
* **amplify-category-auth:** update auth cfn template to quote string ([1ff9e16](https://github.com/aws-amplify/amplify-cli/commit/1ff9e16ab4584e4943022dbe9498d512d2108287)), closes [#882](https://github.com/aws-amplify/amplify-cli/issues/882)
* **amplify-category-auth:** use right response signal of cfn-response ([572ca45](https://github.com/aws-amplify/amplify-cli/commit/572ca4503f774a4f006082c5205127b67cad8067))
* **amplify-category-auth:** uses public_profile for FB scopes ([c9af7b7](https://github.com/aws-amplify/amplify-cli/commit/c9af7b7d559641118cb3aab07ee10ad047e4d2b1)), closes [#1335](https://github.com/aws-amplify/amplify-cli/issues/1335)
* **amplify-cli:** updating path in trigger indexes for node10 ([c4b1082](https://github.com/aws-amplify/amplify-cli/commit/c4b10820232e614a2951d840a6307031df73aebd)), closes [#3083](https://github.com/aws-amplify/amplify-cli/issues/3083)
* change auth method copy [#4184](https://github.com/aws-amplify/amplify-cli/issues/4184) ([#4198](https://github.com/aws-amplify/amplify-cli/issues/4198)) ([8097671](https://github.com/aws-amplify/amplify-cli/commit/809767143ebf7dd6868279407461d0657e83073a))
* change trigger assets path ([#5223](https://github.com/aws-amplify/amplify-cli/issues/5223)) ([f3eb615](https://github.com/aws-amplify/amplify-cli/commit/f3eb615a40bdb279938f9722d32468833d20f7b0))
* **cli:** add console command in the help message ([#2494](https://github.com/aws-amplify/amplify-cli/issues/2494)) ([cf0eddd](https://github.com/aws-amplify/amplify-cli/commit/cf0eddd1ba27b1126b0745cc068f205b2c2c8343)), closes [#1607](https://github.com/aws-amplify/amplify-cli/issues/1607)
* **cli:** fix inquirer version ([#1690](https://github.com/aws-amplify/amplify-cli/issues/1690)) ([9246032](https://github.com/aws-amplify/amplify-cli/commit/9246032603db49022c444e41faa5881592ce5dc9)), closes [#1688](https://github.com/aws-amplify/amplify-cli/issues/1688)
* **cli:** remove unnecessary stack trace log when adding services ([#4610](https://github.com/aws-amplify/amplify-cli/issues/4610)) ([56efb32](https://github.com/aws-amplify/amplify-cli/commit/56efb32b79c47839cb9506a9300d40a01875a9fc))
* data inconsitency ([#5344](https://github.com/aws-amplify/amplify-cli/issues/5344)) ([bfe1903](https://github.com/aws-amplify/amplify-cli/commit/bfe19038b5b676056f45d7ffcc4c2460057936d8))
* deleted extra carriageReturn calls, fixed grammar in Auth dx ([#4237](https://github.com/aws-amplify/amplify-cli/issues/4237)) ([e6ccdab](https://github.com/aws-amplify/amplify-cli/commit/e6ccdab3f213e5b68999c18dd4ed2d1b7f60f0de))
* enable only-userpool flow without idp and addition of groups without roles tied to idp ([#3662](https://github.com/aws-amplify/amplify-cli/issues/3662)) ([67e0401](https://github.com/aws-amplify/amplify-cli/commit/67e04018d758e617374c4b8ba2298872e728d01e))
* fix [#1254](https://github.com/aws-amplify/amplify-cli/issues/1254) ([0962650](https://github.com/aws-amplify/amplify-cli/commit/09626505aae3730e830e819bf627354c359b1fec))
* fix [#1264](https://github.com/aws-amplify/amplify-cli/issues/1264) ([d901daf](https://github.com/aws-amplify/amplify-cli/commit/d901daf825ef1857c57da85b559d813ec57ae212))
* fix redirect URI regex ([eaec6c2](https://github.com/aws-amplify/amplify-cli/commit/eaec6c2dac5972d1c979458147960b65e265fa2f))
* Fix string literal to be a `Ref` in the cloud formation template ([#3630](https://github.com/aws-amplify/amplify-cli/issues/3630)) ([61e4ac9](https://github.com/aws-amplify/amplify-cli/commit/61e4ac95acc728c46440927c79c158b35abe0e39))
* fixes [#1471](https://github.com/aws-amplify/amplify-cli/issues/1471) ([52b26cb](https://github.com/aws-amplify/amplify-cli/commit/52b26cbc9446d373edc09179866f9c5e9766a1bc))
* headless auth required attributes must be an array ([#5467](https://github.com/aws-amplify/amplify-cli/issues/5467)) ([dbde67c](https://github.com/aws-amplify/amplify-cli/commit/dbde67c3c39ecb14b32da82546927cee14405a0b))
* imports and addResource return val ([#5279](https://github.com/aws-amplify/amplify-cli/issues/5279)) ([963b47c](https://github.com/aws-amplify/amplify-cli/commit/963b47c476113a7ba50646f01d7e57add11ad920))
* internal add auth entry point ([#5281](https://github.com/aws-amplify/amplify-cli/issues/5281)) ([59734ac](https://github.com/aws-amplify/amplify-cli/commit/59734ac41f120771abdb31a1f6f796c852fe23b7))
* move test package dependencies to devDependencies ([#2034](https://github.com/aws-amplify/amplify-cli/issues/2034)) ([f5623d0](https://github.com/aws-amplify/amplify-cli/commit/f5623d04a43e685901f4f1cd96e2a227164c71ee))
* occurred spelling mistake ([#4595](https://github.com/aws-amplify/amplify-cli/issues/4595)) ([a461487](https://github.com/aws-amplify/amplify-cli/commit/a461487072dbf422892ca24c436581b49c568429))
* prevent naming conflicts with new env names ([#3875](https://github.com/aws-amplify/amplify-cli/issues/3875)) ([a7734ae](https://github.com/aws-amplify/amplify-cli/commit/a7734aedb8e846620874ae69e5c38da393dbbe30)), closes [#3854](https://github.com/aws-amplify/amplify-cli/issues/3854)
* randomize role-names and bucket-name for auth and storage category ([#2709](https://github.com/aws-amplify/amplify-cli/issues/2709)) ([fe0e979](https://github.com/aws-amplify/amplify-cli/commit/fe0e979812bd3142a56a62bf15444cbb3dbbb6bb))
* refactor mobile hub migration checks ([#5632](https://github.com/aws-amplify/amplify-cli/issues/5632)) ([b796eb8](https://github.com/aws-amplify/amplify-cli/commit/b796eb8303bb903f5f531506254441a63eba2962))
* replacing rel paths with plugin func ([71f553f](https://github.com/aws-amplify/amplify-cli/commit/71f553fd21a85da9ac6a54f9fbe070ea4a3debf1))
* scoping down user pool group IAM roles and adding --force to amplify push command ([#3609](https://github.com/aws-amplify/amplify-cli/issues/3609)) ([2e10a2f](https://github.com/aws-amplify/amplify-cli/commit/2e10a2ff62b61f57b2d513a7cfd0e4478f429f1f))
* store oauthMetadata properly on headless update ([#5597](https://github.com/aws-amplify/amplify-cli/issues/5597)) ([bdadafc](https://github.com/aws-amplify/amplify-cli/commit/bdadafca991bf9227046dba22cb196ac66e26cc6))
* translate include oAuthMetadata and fix hostedUI meta ([#5304](https://github.com/aws-amplify/amplify-cli/issues/5304)) ([3c44c11](https://github.com/aws-amplify/amplify-cli/commit/3c44c110964907be203c4c70ee4e80122956fe85))
* update auth supported services path ([#5184](https://github.com/aws-amplify/amplify-cli/issues/5184)) ([f8ff81d](https://github.com/aws-amplify/amplify-cli/commit/f8ff81da52f7a5376b5a36bdfed20d973b301f0f))
* update CLI to handle UTF8 BOM ([#1357](https://github.com/aws-amplify/amplify-cli/issues/1357)) ([b0afa07](https://github.com/aws-amplify/amplify-cli/commit/b0afa07ab22d50409ff93c41350995cd7d2a1084)), closes [#1355](https://github.com/aws-amplify/amplify-cli/issues/1355) [#1122](https://github.com/aws-amplify/amplify-cli/issues/1122)
* update current-cloud backend-config on resource removal ([#5658](https://github.com/aws-amplify/amplify-cli/issues/5658)) ([592f694](https://github.com/aws-amplify/amplify-cli/commit/592f694530dd61302ff790fbcf5b3ea135812c47))
* username is default signin, doesn't need to be specified ([#5474](https://github.com/aws-amplify/amplify-cli/issues/5474)) ([4c42ad5](https://github.com/aws-amplify/amplify-cli/commit/4c42ad59db93144e131193c41c5f3d4aa4db1b92))
* warning added for identity pool deletion ([#4731](https://github.com/aws-amplify/amplify-cli/issues/4731)) ([fb21a1c](https://github.com/aws-amplify/amplify-cli/commit/fb21a1cbb5d8b6254cca0ace6631c0a4e4820bba))


### Features

* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c1927da10f8c54f38a523021187361131c))
* **amplify-category-auth:** add headless init support for auth ([#465](https://github.com/aws-amplify/amplify-cli/issues/465)) ([18410f2](https://github.com/aws-amplify/amplify-cli/commit/18410f2d5ce1ea0b801fc8478649c597834f6bd9))
* **amplify-category-auth:** console ([#636](https://github.com/aws-amplify/amplify-cli/issues/636)) ([dea38aa](https://github.com/aws-amplify/amplify-cli/commit/dea38aa4555b2caa02dff1d85f7f6ace75b943db))
* **amplify-category-auth:** export lambda trigger roles in template ([#2894](https://github.com/aws-amplify/amplify-cli/issues/2894)) ([3d07717](https://github.com/aws-amplify/amplify-cli/commit/3d077179c28db7e2c8114bd88f27c99b08062313)), closes [#2303](https://github.com/aws-amplify/amplify-cli/issues/2303)
* **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
* **cli:** new plugin platform ([#2254](https://github.com/aws-amplify/amplify-cli/issues/2254)) ([7ec29dd](https://github.com/aws-amplify/amplify-cli/commit/7ec29dd4f2da8c90727b36469eca646d289877b6))
* **cli:** usage measurement ([#3641](https://github.com/aws-amplify/amplify-cli/issues/3641)) ([a755863](https://github.com/aws-amplify/amplify-cli/commit/a7558637fbb791dc22e0a91ae16f1b96fe4e99df))
* cognito + s3 + dyanmodb lambda trigger support ([#1783](https://github.com/aws-amplify/amplify-cli/issues/1783)) ([c6fc838](https://github.com/aws-amplify/amplify-cli/commit/c6fc83834ae70f3e0f5e1c8810a56de76ba36d41))
* Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
* feature flag implementation ([#4891](https://github.com/aws-amplify/amplify-cli/issues/4891)) ([6d1c632](https://github.com/aws-amplify/amplify-cli/commit/6d1c632952a49cb56670c11c9cb0c3620d0eb332))
* flow to add policies to access amplify resources from Lambda ([#1462](https://github.com/aws-amplify/amplify-cli/issues/1462)) ([fee247c](https://github.com/aws-amplify/amplify-cli/commit/fee247c74f54b050f7b7a6ea0733fbd08976f232))
* headless add auth ([#5224](https://github.com/aws-amplify/amplify-cli/issues/5224)) ([9f80512](https://github.com/aws-amplify/amplify-cli/commit/9f805128a8232278bb27d4fb1eaa5fecf7aa7a63))
* headless Init and configure ([#371](https://github.com/aws-amplify/amplify-cli/issues/371)) ([acd14a8](https://github.com/aws-amplify/amplify-cli/commit/acd14a8634b97474424f22cdd7031bff58138cd2))
* headless Init and configure ([#371](https://github.com/aws-amplify/amplify-cli/issues/371)) ([8780400](https://github.com/aws-amplify/amplify-cli/commit/8780400fb316d3e31a25a6ac395bb86235082c74))
* headless update auth ([#5308](https://github.com/aws-amplify/amplify-cli/issues/5308)) ([b942f35](https://github.com/aws-amplify/amplify-cli/commit/b942f3589f1df1361ae7eb6e42f18dbf6900d1bf))
* Lambda layers ([#4697](https://github.com/aws-amplify/amplify-cli/issues/4697)) ([4e97400](https://github.com/aws-amplify/amplify-cli/commit/4e974007d95c894ab4108a2dff8d5996e7e3ce25))
* Multienv auth migrate ([#498](https://github.com/aws-amplify/amplify-cli/issues/498)) ([ef3e3b3](https://github.com/aws-amplify/amplify-cli/commit/ef3e3b3e9f6c5f6ce1610bcf6da6fb4fb94265eb))
* support for provisioning Cognito Hosted UI and support CRUD operations in Storage and API categories ([729b0de](https://github.com/aws-amplify/amplify-cli/commit/729b0de411e5a576271f270d765cc31e4ee1424d))
* support importing of auth resources ([#5591](https://github.com/aws-amplify/amplify-cli/issues/5591)) ([7903246](https://github.com/aws-amplify/amplify-cli/commit/790324680544fe18481f91390001f9f07a144203))
* User Pool Groups, Admin Auth Support, Custom Group Role Policies ([#2443](https://github.com/aws-amplify/amplify-cli/issues/2443)) ([09aecfd](https://github.com/aws-amplify/amplify-cli/commit/09aecfd0cb3dae2c17d1c512946cc733c4fe3d4c))


### Performance Improvements

* fulfill promises to upload files to S3 concurrently ([#4575](https://github.com/aws-amplify/amplify-cli/issues/4575)) ([9fbee8a](https://github.com/aws-amplify/amplify-cli/commit/9fbee8a71b4bf941dbda9d2f76fbedd73ab754ef)), closes [#4158](https://github.com/aws-amplify/amplify-cli/issues/4158)


### Reverts

* Revert problematic PRs (#4803) ([f21a0f4](https://github.com/aws-amplify/amplify-cli/commit/f21a0f449a23c0c80a6f3280eef76bcbf3e9cb7c)), closes [#4803](https://github.com/aws-amplify/amplify-cli/issues/4803) [#4796](https://github.com/aws-amplify/amplify-cli/issues/4796) [#4576](https://github.com/aws-amplify/amplify-cli/issues/4576) [#4575](https://github.com/aws-amplify/amplify-cli/issues/4575) [#4610](https://github.com/aws-amplify/amplify-cli/issues/4610)
