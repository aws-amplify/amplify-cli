# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.17.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.17.0...amplify-e2e-tests@2.17.1) (2020-04-23)


### Bug Fixes

* **amplify-e2e-tests:** add .NET template and remove ddb uuid ([#3958](https://github.com/aws-amplify/amplify-cli/issues/3958)) ([70b5edc](https://github.com/aws-amplify/amplify-cli/commit/70b5edc2b50b4e0ceb33956852cb5eb834a8016b))
* **amplify-provider-awscloudformation:** check before fetching backend ([#3848](https://github.com/aws-amplify/amplify-cli/issues/3848)) ([39be355](https://github.com/aws-amplify/amplify-cli/commit/39be3552f7f408dad02c2701a01f170be9badbb7))
* check for unavailable bucket ([#3972](https://github.com/aws-amplify/amplify-cli/issues/3972)) ([de9c4c4](https://github.com/aws-amplify/amplify-cli/commit/de9c4c461351352694d81d9e7b2f9044b1a9a2c4))
* implement retries and CFN polls in e2e tests ([#4028](https://github.com/aws-amplify/amplify-cli/issues/4028)) ([b71391f](https://github.com/aws-amplify/amplify-cli/commit/b71391facdd0d4f301522f10fb7d722aad406ed6))
* remove duplicate env vars in top level comment ([#3894](https://github.com/aws-amplify/amplify-cli/issues/3894)) fixes [#3744](https://github.com/aws-amplify/amplify-cli/issues/3744) ([d586863](https://github.com/aws-amplify/amplify-cli/commit/d586863aabcb1ad2fc4d8ee1bd0e693a4d86d0ea))
* select us-east-2 in integ tests ([#3992](https://github.com/aws-amplify/amplify-cli/issues/3992)) ([ed48cf5](https://github.com/aws-amplify/amplify-cli/commit/ed48cf59a2e60cc25a78f83641ca8f3bc63bc68f))


### Reverts

* Revert "fix(amplify-provider-awscloudformation): check before fetching backend (#3848)" (#3968) ([4abd582](https://github.com/aws-amplify/amplify-cli/commit/4abd5828bb5138944b116476d8b9491597aecc88)), closes [#3848](https://github.com/aws-amplify/amplify-cli/issues/3848) [#3968](https://github.com/aws-amplify/amplify-cli/issues/3968)





# [2.17.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.16.2...amplify-e2e-tests@2.17.0) (2020-04-06)


### Bug Fixes

* **amplify-category-auth:** fixed issue with updating urls in auth ([#3791](https://github.com/aws-amplify/amplify-cli/issues/3791)) ([236cd7a](https://github.com/aws-amplify/amplify-cli/commit/236cd7aecbdc2cbbb0dc9c565aae4e79ff40ebae))
* **amplify-e2e-tests:** fix failing api e2e tests ([#3827](https://github.com/aws-amplify/amplify-cli/issues/3827)) ([f676b8d](https://github.com/aws-amplify/amplify-cli/commit/f676b8d433ab5d5ecec664af27a07ecee83fa9f6))
* **amplify-provider-awscloudformation:** fixed deletion for large bucket ([#3656](https://github.com/aws-amplify/amplify-cli/issues/3656)) ([32038da](https://github.com/aws-amplify/amplify-cli/commit/32038dad6f1bd0b9cf55e055d6a4545a222a1149)), closes [#3447](https://github.com/aws-amplify/amplify-cli/issues/3447) [#3451](https://github.com/aws-amplify/amplify-cli/issues/3451)
* e2e failures ([#3856](https://github.com/aws-amplify/amplify-cli/issues/3856)) ([26ff656](https://github.com/aws-amplify/amplify-cli/commit/26ff6563a787abe87ee7d85309f1064e8b55f6b0))
* e2e fixes and circle ci install change ([#3838](https://github.com/aws-amplify/amplify-cli/issues/3838)) ([b646f53](https://github.com/aws-amplify/amplify-cli/commit/b646f539c90184be44dbd557c176a8c96d092db9))
* fix java local invoker and api e2e tests ([#3855](https://github.com/aws-amplify/amplify-cli/issues/3855)) ([93af865](https://github.com/aws-amplify/amplify-cli/commit/93af8651d4bedca0b8d08e778a74dc47230d5988))
* increase kinesis and cloudwatch sleeps ([#3859](https://github.com/aws-amplify/amplify-cli/issues/3859)) ([4971f51](https://github.com/aws-amplify/amplify-cli/commit/4971f517f71cf5b1d66e6937d26b6c5286569202))
* update function e2e tests with new template orderings ([#3817](https://github.com/aws-amplify/amplify-cli/issues/3817)) ([dfb910d](https://github.com/aws-amplify/amplify-cli/commit/dfb910ddccbd15df48801efce94d1fbf5822fb9e))


### Features

* golang function support for CLI ([#3789](https://github.com/aws-amplify/amplify-cli/issues/3789)) ([3dbc234](https://github.com/aws-amplify/amplify-cli/commit/3dbc23497d0d1c238c6868adcf3a6d00ad909edd))
* install python3 and pipenv in circleci ([#3825](https://github.com/aws-amplify/amplify-cli/issues/3825)) ([fa17a15](https://github.com/aws-amplify/amplify-cli/commit/fa17a15a02f4a8485af74e16e34ffa12e1eb8f0c))
* **amplify-category-function:** Support Lambda Scheduling  ([#3714](https://github.com/aws-amplify/amplify-cli/issues/3714)) ([4a488ed](https://github.com/aws-amplify/amplify-cli/commit/4a488edef14d9161600cf6ce6887baa3c04ebef5))
* select node runtime by default ([#3852](https://github.com/aws-amplify/amplify-cli/issues/3852)) ([aa712bd](https://github.com/aws-amplify/amplify-cli/commit/aa712bd26f7e02477d95d04e639c7234feba9715))





## [2.16.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.16.1...amplify-e2e-tests@2.16.2) (2020-03-22)


### Bug Fixes

* enable only-userpool flow without idp and addition of groups without roles tied to idp ([#3662](https://github.com/aws-amplify/amplify-cli/issues/3662)) ([67e0401](https://github.com/aws-amplify/amplify-cli/commit/67e04018d758e617374c4b8ba2298872e728d01e))
* **cli:** deleting the amplify app on delete ([#3568](https://github.com/aws-amplify/amplify-cli/issues/3568)) ([f39bbcb](https://github.com/aws-amplify/amplify-cli/commit/f39bbcb715875eeeb612bcbc40b275b33f85eaf6)), closes [#3239](https://github.com/aws-amplify/amplify-cli/issues/3239)
* fixing name of nodej function provider plugin name ([7e27785](https://github.com/aws-amplify/amplify-cli/commit/7e27785e9d4208d8e0d0674f1f1644e670139a86))
* update import ([#3690](https://github.com/aws-amplify/amplify-cli/issues/3690)) ([3bf6877](https://github.com/aws-amplify/amplify-cli/commit/3bf68778880b2a72ee792dcdbb7c976ddbeedcdc))
* update import ([#3716](https://github.com/aws-amplify/amplify-cli/issues/3716)) ([cd7f9eb](https://github.com/aws-amplify/amplify-cli/commit/cd7f9eb1be40681f7262631afd8fef7d5c68568f))





## [2.16.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.16.0...amplify-e2e-tests@2.16.1) (2020-03-10)


### Bug Fixes

* **amplify-category-analytics:** delete pinpoint project in delete ([#3165](https://github.com/aws-amplify/amplify-cli/issues/3165)) ([acc0240](https://github.com/aws-amplify/amplify-cli/commit/acc0240c02630b4b9424370732706955ea447057)), closes [#2974](https://github.com/aws-amplify/amplify-cli/issues/2974)





# [2.16.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.13.3...amplify-e2e-tests@2.16.0) (2020-03-07)


### Bug Fixes

* **cli:** 'remove env' wording ([#3425](https://github.com/aws-amplify/amplify-cli/issues/3425)) ([ddaeb23](https://github.com/aws-amplify/amplify-cli/commit/ddaeb23d2fbffa7ee7f0769c133b75e0d2be9bcc))
* add configuration.json placeholders ([#3508](https://github.com/aws-amplify/amplify-cli/issues/3508)) ([44265c4](https://github.com/aws-amplify/amplify-cli/commit/44265c439d4b7764ff52ab5b82f5fd1c88af799e))
* fix project template ([#3589](https://github.com/aws-amplify/amplify-cli/issues/3589)) ([0c11afc](https://github.com/aws-amplify/amplify-cli/commit/0c11afc476e5c6bb8bbf6e84bd1b7e7e688eed3b))
* fixing plugin e2e tests ([#3588](https://github.com/aws-amplify/amplify-cli/issues/3588)) ([10d831f](https://github.com/aws-amplify/amplify-cli/commit/10d831f1dcb330fbb9e06a9aaf16ecef05c30e51))


### Features

* ability to add custom EventSource and lambda triggers via amplify add function, kinesis support in analytics category ([#2463](https://github.com/aws-amplify/amplify-cli/issues/2463)) ([b25cfd0](https://github.com/aws-amplify/amplify-cli/commit/b25cfd00b21416a82ecefda1f6498206ef71531b))
* amplify console hosting plugin ([#3525](https://github.com/aws-amplify/amplify-cli/issues/3525)) ([2c84b71](https://github.com/aws-amplify/amplify-cli/commit/2c84b71687a0ebcdeb92ebe462c8cf4eab8c9e3c))





## [2.14.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.13.5-beta.0...amplify-e2e-tests@2.14.1) (2020-03-05)

**Note:** Version bump only for package amplify-e2e-tests





## [2.13.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.13.2...amplify-e2e-tests@2.13.3) (2020-02-13)

**Note:** Version bump only for package amplify-e2e-tests





## [2.13.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.13.1...amplify-e2e-tests@2.13.2) (2020-02-07)

**Note:** Version bump only for package amplify-e2e-tests





## [2.13.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@2.13.0...amplify-e2e-tests@2.13.1) (2020-01-24)

**Note:** Version bump only for package amplify-e2e-tests





# [2.13.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.30.0...amplify-e2e-tests@2.13.0) (2020-01-23)

### Bug Fixes

- amplify e2e test deps,lint,cleanup,standardize ([#2850](https://github.com/aws-amplify/amplify-cli/issues/2850)) ([cf888f3](https://github.com/aws-amplify/amplify-cli/commit/cf888f3da1acde6be4d2bfcb40f15587005c62f9))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))
- point to correct file to delete for amplify config ([#3116](https://github.com/aws-amplify/amplify-cli/issues/3116)) ([61c0769](https://github.com/aws-amplify/amplify-cli/commit/61c0769cb1d40faa76ff3de8e82f2f58199b4a0f)), closes [#2997](https://github.com/aws-amplify/amplify-cli/issues/2997)
- upgrade to node10 as min version for CLI ([#3128](https://github.com/aws-amplify/amplify-cli/issues/3128)) ([a0b18e0](https://github.com/aws-amplify/amplify-cli/commit/a0b18e0187a26b4ab0e6e986b0277f347e829444))
- **amplify-category-analytics:** reverted the hyphen and updated tests ([#3181](https://github.com/aws-amplify/amplify-cli/issues/3181)) ([1a1efcf](https://github.com/aws-amplify/amplify-cli/commit/1a1efcfe9ba11242316ebed3bca3bf5fe78761f7)), closes [#3163](https://github.com/aws-amplify/amplify-cli/issues/3163)
- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.12.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.30.0...amplify-e2e-tests@2.12.0) (2020-01-09)

### Bug Fixes

- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- amplify e2e test deps,lint,cleanup,standardize ([#2850](https://github.com/aws-amplify/amplify-cli/issues/2850)) ([cf888f3](https://github.com/aws-amplify/amplify-cli/commit/cf888f3da1acde6be4d2bfcb40f15587005c62f9))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))
- upgrade to node10 as min version for CLI ([#3128](https://github.com/aws-amplify/amplify-cli/issues/3128)) ([a0b18e0](https://github.com/aws-amplify/amplify-cli/commit/a0b18e0187a26b4ab0e6e986b0277f347e829444))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.11.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.30.0...amplify-e2e-tests@2.11.0) (2019-12-31)

### Bug Fixes

- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- amplify e2e test deps,lint,cleanup,standardize ([#2850](https://github.com/aws-amplify/amplify-cli/issues/2850)) ([cf888f3](https://github.com/aws-amplify/amplify-cli/commit/cf888f3da1acde6be4d2bfcb40f15587005c62f9))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.10.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.30.0...amplify-e2e-tests@2.10.0) (2019-12-28)

### Bug Fixes

- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- amplify e2e test deps,lint,cleanup,standardize ([#2850](https://github.com/aws-amplify/amplify-cli/issues/2850)) ([cf888f3](https://github.com/aws-amplify/amplify-cli/commit/cf888f3da1acde6be4d2bfcb40f15587005c62f9))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.9.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.30.0...amplify-e2e-tests@2.9.0) (2019-12-26)

### Bug Fixes

- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- amplify e2e test deps,lint,cleanup,standardize ([#2850](https://github.com/aws-amplify/amplify-cli/issues/2850)) ([cf888f3](https://github.com/aws-amplify/amplify-cli/commit/cf888f3da1acde6be4d2bfcb40f15587005c62f9))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.8.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.30.0...amplify-e2e-tests@2.8.0) (2019-12-25)

### Bug Fixes

- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- amplify e2e test deps,lint,cleanup,standardize ([#2850](https://github.com/aws-amplify/amplify-cli/issues/2850)) ([cf888f3](https://github.com/aws-amplify/amplify-cli/commit/cf888f3da1acde6be4d2bfcb40f15587005c62f9))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.7.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.30.0...amplify-e2e-tests@2.7.0) (2019-12-20)

### Bug Fixes

- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- amplify e2e test deps,lint,cleanup,standardize ([#2850](https://github.com/aws-amplify/amplify-cli/issues/2850)) ([cf888f3](https://github.com/aws-amplify/amplify-cli/commit/cf888f3da1acde6be4d2bfcb40f15587005c62f9))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.6.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.30.0...amplify-e2e-tests@2.6.0) (2019-12-10)

### Bug Fixes

- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- amplify e2e test deps,lint,cleanup,standardize ([#2850](https://github.com/aws-amplify/amplify-cli/issues/2850)) ([cf888f3](https://github.com/aws-amplify/amplify-cli/commit/cf888f3da1acde6be4d2bfcb40f15587005c62f9))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.4.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.30.0...amplify-e2e-tests@2.4.0) (2019-12-03)

### Bug Fixes

- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- amplify e2e test deps,lint,cleanup,standardize ([#2850](https://github.com/aws-amplify/amplify-cli/issues/2850)) ([cf888f3](https://github.com/aws-amplify/amplify-cli/commit/cf888f3da1acde6be4d2bfcb40f15587005c62f9))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.3.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.30.0...amplify-e2e-tests@2.3.0) (2019-12-01)

### Bug Fixes

- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- amplify e2e test deps,lint,cleanup,standardize ([#2850](https://github.com/aws-amplify/amplify-cli/issues/2850)) ([cf888f3](https://github.com/aws-amplify/amplify-cli/commit/cf888f3da1acde6be4d2bfcb40f15587005c62f9))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.2.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.30.0...amplify-e2e-tests@2.2.0) (2019-11-27)

### Bug Fixes

- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- amplify e2e test deps,lint,cleanup,standardize ([#2850](https://github.com/aws-amplify/amplify-cli/issues/2850)) ([cf888f3](https://github.com/aws-amplify/amplify-cli/commit/cf888f3da1acde6be4d2bfcb40f15587005c62f9))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.1.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.30.0...amplify-e2e-tests@2.1.0) (2019-11-27)

### Bug Fixes

- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- amplify e2e test deps,lint,cleanup,standardize ([#2850](https://github.com/aws-amplify/amplify-cli/issues/2850)) ([cf888f3](https://github.com/aws-amplify/amplify-cli/commit/cf888f3da1acde6be4d2bfcb40f15587005c62f9))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [1.12.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.6.2...amplify-e2e-tests@1.12.0) (2019-08-30)

### Bug Fixes

- **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad8))
- **amplify-e2e-tests:** fixing predictions e2e tests ([#1969](https://github.com/aws-amplify/amplify-cli/issues/1969)) ([6c6bbb2](https://github.com/aws-amplify/amplify-cli/commit/6c6bbb2))
- regression for e2e tests because of nexpect reference ([#2120](https://github.com/aws-amplify/amplify-cli/issues/2120)) ([7659500](https://github.com/aws-amplify/amplify-cli/commit/7659500))

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
- sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))

# [1.11.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.6.2...amplify-e2e-tests@1.11.0) (2019-08-28)

### Bug Fixes

- **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad8))
- **amplify-e2e-tests:** fixing predictions e2e tests ([#1969](https://github.com/aws-amplify/amplify-cli/issues/1969)) ([6c6bbb2](https://github.com/aws-amplify/amplify-cli/commit/6c6bbb2))
- regression for e2e tests because of nexpect reference ([#2120](https://github.com/aws-amplify/amplify-cli/issues/2120)) ([7659500](https://github.com/aws-amplify/amplify-cli/commit/7659500))

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
- sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))

# [1.10.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.6.2...amplify-e2e-tests@1.10.0) (2019-08-13)

### Bug Fixes

- **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad8))
- **amplify-e2e-tests:** fixing predictions e2e tests ([#1969](https://github.com/aws-amplify/amplify-cli/issues/1969)) ([6c6bbb2](https://github.com/aws-amplify/amplify-cli/commit/6c6bbb2))

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
- sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))

# [1.9.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.6.2...amplify-e2e-tests@1.9.0) (2019-08-07)

### Bug Fixes

- **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad8))
- **amplify-e2e-tests:** fixing predictions e2e tests ([#1969](https://github.com/aws-amplify/amplify-cli/issues/1969)) ([6c6bbb2](https://github.com/aws-amplify/amplify-cli/commit/6c6bbb2))

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
- sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))

# [1.8.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.6.2...amplify-e2e-tests@1.8.0) (2019-08-02)

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))

# [1.7.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.6.2...amplify-e2e-tests@1.7.0) (2019-07-31)

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))

## [1.6.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.6.0...amplify-e2e-tests@1.6.2) (2019-07-23)

**Note:** Version bump only for package amplify-e2e-tests

# [1.6.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.5.5...amplify-e2e-tests@1.6.0) (2019-07-09)

### Features

- cognito + s3 + dyanmodb lambda trigger support ([#1783](https://github.com/aws-amplify/amplify-cli/issues/1783)) ([c6fc838](https://github.com/aws-amplify/amplify-cli/commit/c6fc838))

## [1.5.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.5.3...amplify-e2e-tests@1.5.5) (2019-06-30)

### Bug Fixes

- fixing function build issue + e2e tests ([#1750](https://github.com/aws-amplify/amplify-cli/issues/1750)) ([c11c0bc](https://github.com/aws-amplify/amplify-cli/commit/c11c0bc)), closes [#1747](https://github.com/aws-amplify/amplify-cli/issues/1747)

## [1.5.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.5.2...amplify-e2e-tests@1.5.3) (2019-06-12)

### Bug Fixes

- **amplify-category-interactions:** call updateMetaAfterAdd only once ([#1653](https://github.com/aws-amplify/amplify-cli/issues/1653)) ([dc28758](https://github.com/aws-amplify/amplify-cli/commit/dc28758)), closes [#1621](https://github.com/aws-amplify/amplify-cli/issues/1621)

## [1.5.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.5.1...amplify-e2e-tests@1.5.2) (2019-04-16)

**Note:** Version bump only for package amplify-e2e-tests

## [1.5.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.4.1...amplify-e2e-tests@1.5.1) (2019-04-09)

**Note:** Version bump only for package amplify-e2e-tests

## [1.4.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.1.5...amplify-e2e-tests@1.4.1) (2019-04-03)

**Note:** Version bump only for package amplify-e2e-tests

## [1.1.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-e2e-tests@1.1.4...amplify-e2e-tests@1.1.5) (2019-03-22)

**Note:** Version bump only for package amplify-e2e-tests

## 1.1.4 (2019-02-25)

**Note:** Version bump only for package amplify-e2e-tests
