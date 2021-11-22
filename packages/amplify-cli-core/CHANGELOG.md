# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.3.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@2.3.2...amplify-cli-core@2.3.3) (2021-11-21)


### Bug Fixes

* write CFN templates synchronously ([#8986](https://github.com/aws-amplify/amplify-cli/issues/8986)) ([c622eca](https://github.com/aws-amplify/amplify-cli/commit/c622ecae0baaf2bdaee7e2ea187e7d52771a614b))





## [2.3.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@2.3.1...amplify-cli-core@2.3.2) (2021-11-20)


### Bug Fixes

* remove await from sync read cfn calls ([#8977](https://github.com/aws-amplify/amplify-cli/issues/8977)) ([7ef6fb7](https://github.com/aws-amplify/amplify-cli/commit/7ef6fb72739d4618d02dba689a927831b53cb098))





## [2.3.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@2.3.0...amplify-cli-core@2.3.1) (2021-11-17)

**Note:** Version bump only for package amplify-cli-core





# [2.3.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.32.0...amplify-cli-core@2.3.0) (2021-11-15)


### Bug Fixes

* adds typescript json dependency ([#8487](https://github.com/aws-amplify/amplify-cli/issues/8487)) ([5e6b626](https://github.com/aws-amplify/amplify-cli/commit/5e6b626417014996700ecab99e46056eea9a902c))
* broken path on build-override ([798fd79](https://github.com/aws-amplify/amplify-cli/commit/798fd7988880f3c6617549e99b035e147e6d2137))
* broken unit tests ([e5f30e7](https://github.com/aws-amplify/amplify-cli/commit/e5f30e78de72b8c2047f2a98da1da6ba96d44f12))
* bug fixes in external auth enable ([b600861](https://github.com/aws-amplify/amplify-cli/commit/b6008614b5b1cd739d2966ed644edf810290a798))
* does not create build for ll ([#8706](https://github.com/aws-amplify/amplify-cli/issues/8706)) ([b897105](https://github.com/aws-amplify/amplify-cli/commit/b897105caaf28a51cd73a9f6f4667b171bb18ef3))
* ensure FF on stack transform, revert revert ([#8810](https://github.com/aws-amplify/amplify-cli/issues/8810)) ([868952f](https://github.com/aws-amplify/amplify-cli/commit/868952f9552f09aeb2b0b8e036c59954ee3391e0)), closes [#8796](https://github.com/aws-amplify/amplify-cli/issues/8796) [#8799](https://github.com/aws-amplify/amplify-cli/issues/8799)
* parameters file path and updates cloud backend with build ([#8564](https://github.com/aws-amplify/amplify-cli/issues/8564)) ([f9497fb](https://github.com/aws-amplify/amplify-cli/commit/f9497fb4cd28984d8c3ed9d089e507315e1a3a78))
* remove trailing 's' in documentation link ([#8853](https://github.com/aws-amplify/amplify-cli/issues/8853)) ([2077c98](https://github.com/aws-amplify/amplify-cli/commit/2077c98ab65737b2310f7bfcd7853f1ca18f50d5))
* test fixes ([#8647](https://github.com/aws-amplify/amplify-cli/issues/8647)) ([d746510](https://github.com/aws-amplify/amplify-cli/commit/d746510125b88c4a113adbe2a59beb45427cdb76))
* tsc global install error ([7d1cca8](https://github.com/aws-amplify/amplify-cli/commit/7d1cca890f138f32bac51fca085098a777aea1ae))
* update migration msg, ddb import e2e, lgtm errors ([#8796](https://github.com/aws-amplify/amplify-cli/issues/8796)) ([a2d87ec](https://github.com/aws-amplify/amplify-cli/commit/a2d87eca889ed8b23cfe3cf145c0372b655d4ed9))


### Features

* amplify export ([fd28279](https://github.com/aws-amplify/amplify-cli/commit/fd282791167177d72a42784b5de4f2fd461d590a)), closes [#8547](https://github.com/aws-amplify/amplify-cli/issues/8547) [#8488](https://github.com/aws-amplify/amplify-cli/issues/8488) [#8486](https://github.com/aws-amplify/amplify-cli/issues/8486) [#8547](https://github.com/aws-amplify/amplify-cli/issues/8547) [#8488](https://github.com/aws-amplify/amplify-cli/issues/8488) [#8486](https://github.com/aws-amplify/amplify-cli/issues/8486)
* **amplify-cli-core:** allow * in account and region in arn for custom policies ([#8722](https://github.com/aws-amplify/amplify-cli/issues/8722)) ([f720832](https://github.com/aws-amplify/amplify-cli/commit/f72083212beeef791fd92a0494ce7438123bfd5e))
* Auth refactor to  use cdk, eliminate EJS, overrides functionality ([#8355](https://github.com/aws-amplify/amplify-cli/issues/8355)) ([66d885f](https://github.com/aws-amplify/amplify-cli/commit/66d885f8125f11c0ea3c23f67fec51b553445d42))
* change override.ts file to override.ts.sample in resources/ for pkg CLI to work ([#8716](https://github.com/aws-amplify/amplify-cli/issues/8716)) ([1804b11](https://github.com/aws-amplify/amplify-cli/commit/1804b1162aaad67635ce5b669a5d8819ce88de0e))
* ddb overrides and flow refactor ([e601a36](https://github.com/aws-amplify/amplify-cli/commit/e601a3623fe028746454a55cc544ddd007ae9ac3))
* define custom resources with CDK or CFN ([#8590](https://github.com/aws-amplify/amplify-cli/issues/8590)) ([e835584](https://github.com/aws-amplify/amplify-cli/commit/e835584ee8d21a2e4b2480264581de22371cbdba))
* extensibility for REST APIs ([#8598](https://github.com/aws-amplify/amplify-cli/issues/8598)) ([de19d23](https://github.com/aws-amplify/amplify-cli/commit/de19d231465c1f16bf7d1c7ccb8dba2f36d039d8))
* FF for override stacks ([#8228](https://github.com/aws-amplify/amplify-cli/issues/8228)) ([5a9c68c](https://github.com/aws-amplify/amplify-cli/commit/5a9c68c68ea073ac10577045385f49268a6cdfe5))
* overrides uniformity accross all the categories ([#8695](https://github.com/aws-amplify/amplify-cli/issues/8695)) ([2f6f0eb](https://github.com/aws-amplify/amplify-cli/commit/2f6f0eba6922a345cc549455245a712957e2f352))
* root stack override ([#8276](https://github.com/aws-amplify/amplify-cli/issues/8276)) ([887f617](https://github.com/aws-amplify/amplify-cli/commit/887f617a83d99da1cf93850dc96ff0eebda0fe5a))


### Reverts

* Revert "fix: update migration msg, ddb import e2e, lgtm errors (#8796)" (#8799) ([394a32f](https://github.com/aws-amplify/amplify-cli/commit/394a32f7a801bcf845a180bfdaa7d1d95c5962e7)), closes [#8796](https://github.com/aws-amplify/amplify-cli/issues/8796) [#8799](https://github.com/aws-amplify/amplify-cli/issues/8799)





# [2.0.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.31.1...amplify-cli-core@2.0.0) (2021-11-13)


### Bug Fixes

* adds typescript json dependency ([#8487](https://github.com/aws-amplify/amplify-cli/issues/8487)) ([5e6b626](https://github.com/aws-amplify/amplify-cli/commit/5e6b626417014996700ecab99e46056eea9a902c))
* broken path on build-override ([798fd79](https://github.com/aws-amplify/amplify-cli/commit/798fd7988880f3c6617549e99b035e147e6d2137))
* broken unit tests ([e5f30e7](https://github.com/aws-amplify/amplify-cli/commit/e5f30e78de72b8c2047f2a98da1da6ba96d44f12))
* bug fixes in external auth enable ([b600861](https://github.com/aws-amplify/amplify-cli/commit/b6008614b5b1cd739d2966ed644edf810290a798))
* Custom policies works with `amplify status -v` ([#8531](https://github.com/aws-amplify/amplify-cli/issues/8531)) ([01f18e4](https://github.com/aws-amplify/amplify-cli/commit/01f18e4a8893f0a2f8833680ffae0f74ccdbdcd4))
* does not create build for ll ([#8706](https://github.com/aws-amplify/amplify-cli/issues/8706)) ([b897105](https://github.com/aws-amplify/amplify-cli/commit/b897105caaf28a51cd73a9f6f4667b171bb18ef3))
* ensure FF on stack transform, revert revert ([#8810](https://github.com/aws-amplify/amplify-cli/issues/8810)) ([868952f](https://github.com/aws-amplify/amplify-cli/commit/868952f9552f09aeb2b0b8e036c59954ee3391e0)), closes [#8796](https://github.com/aws-amplify/amplify-cli/issues/8796) [#8799](https://github.com/aws-amplify/amplify-cli/issues/8799)
* parameters file path and updates cloud backend with build ([#8564](https://github.com/aws-amplify/amplify-cli/issues/8564)) ([f9497fb](https://github.com/aws-amplify/amplify-cli/commit/f9497fb4cd28984d8c3ed9d089e507315e1a3a78))
* schema migrator utility as separate command ([#8720](https://github.com/aws-amplify/amplify-cli/issues/8720)) ([46e1ee6](https://github.com/aws-amplify/amplify-cli/commit/46e1ee6a49dd86bb682b182a37626bc3f2f966ea))
* test fixes ([#8647](https://github.com/aws-amplify/amplify-cli/issues/8647)) ([d746510](https://github.com/aws-amplify/amplify-cli/commit/d746510125b88c4a113adbe2a59beb45427cdb76))
* tsc global install error ([7d1cca8](https://github.com/aws-amplify/amplify-cli/commit/7d1cca890f138f32bac51fca085098a777aea1ae))
* update migration msg, ddb import e2e, lgtm errors ([#8796](https://github.com/aws-amplify/amplify-cli/issues/8796)) ([a2d87ec](https://github.com/aws-amplify/amplify-cli/commit/a2d87eca889ed8b23cfe3cf145c0372b655d4ed9))


### Features

* Activate graphql migrator behind feature flag ([5a76b3a](https://github.com/aws-amplify/amplify-cli/commit/5a76b3a320012c09d2ff2f424283fafba74fa74d))
* amplify export ([fd28279](https://github.com/aws-amplify/amplify-cli/commit/fd282791167177d72a42784b5de4f2fd461d590a)), closes [#8547](https://github.com/aws-amplify/amplify-cli/issues/8547) [#8488](https://github.com/aws-amplify/amplify-cli/issues/8488) [#8486](https://github.com/aws-amplify/amplify-cli/issues/8486) [#8547](https://github.com/aws-amplify/amplify-cli/issues/8547) [#8488](https://github.com/aws-amplify/amplify-cli/issues/8488) [#8486](https://github.com/aws-amplify/amplify-cli/issues/8486)
* **amplify-cli-core:** allow * in account and region in arn for custom policies ([#8722](https://github.com/aws-amplify/amplify-cli/issues/8722)) ([f720832](https://github.com/aws-amplify/amplify-cli/commit/f72083212beeef791fd92a0494ce7438123bfd5e))
* Auth refactor to  use cdk, eliminate EJS, overrides functionality ([#8355](https://github.com/aws-amplify/amplify-cli/issues/8355)) ([66d885f](https://github.com/aws-amplify/amplify-cli/commit/66d885f8125f11c0ea3c23f67fec51b553445d42))
* change override.ts file to override.ts.sample in resources/ for pkg CLI to work ([#8716](https://github.com/aws-amplify/amplify-cli/issues/8716)) ([1804b11](https://github.com/aws-amplify/amplify-cli/commit/1804b1162aaad67635ce5b669a5d8819ce88de0e))
* ddb overrides and flow refactor ([e601a36](https://github.com/aws-amplify/amplify-cli/commit/e601a3623fe028746454a55cc544ddd007ae9ac3))
* define custom resources with CDK or CFN ([#8590](https://github.com/aws-amplify/amplify-cli/issues/8590)) ([e835584](https://github.com/aws-amplify/amplify-cli/commit/e835584ee8d21a2e4b2480264581de22371cbdba))
* extensibility for REST APIs ([#8598](https://github.com/aws-amplify/amplify-cli/issues/8598)) ([de19d23](https://github.com/aws-amplify/amplify-cli/commit/de19d231465c1f16bf7d1c7ccb8dba2f36d039d8))
* FF for override stacks ([#8228](https://github.com/aws-amplify/amplify-cli/issues/8228)) ([5a9c68c](https://github.com/aws-amplify/amplify-cli/commit/5a9c68c68ea073ac10577045385f49268a6cdfe5))
* flag to allow destructive schema changes ([#8273](https://github.com/aws-amplify/amplify-cli/issues/8273)) ([18de856](https://github.com/aws-amplify/amplify-cli/commit/18de856fb61bf2df8f73375e4e55a58c6159a232))
* **graphql-model-transformer:** added transformer version feature flag ([#8328](https://github.com/aws-amplify/amplify-cli/issues/8328)) ([922bf61](https://github.com/aws-amplify/amplify-cli/commit/922bf6198b88826a72d2c1c47fbd31148e2b1250))
* overrides uniformity accross all the categories ([#8695](https://github.com/aws-amplify/amplify-cli/issues/8695)) ([2f6f0eb](https://github.com/aws-amplify/amplify-cli/commit/2f6f0eba6922a345cc549455245a712957e2f352))
* root stack override ([#8276](https://github.com/aws-amplify/amplify-cli/issues/8276)) ([887f617](https://github.com/aws-amplify/amplify-cli/commit/887f617a83d99da1cf93850dc96ff0eebda0fe5a))
* version blocking for CLI ([#8512](https://github.com/aws-amplify/amplify-cli/issues/8512)) ([52edf2b](https://github.com/aws-amplify/amplify-cli/commit/52edf2b58508c96e78184aba1f77c06c021cc9b1))
* version blocking for CLI ([#8737](https://github.com/aws-amplify/amplify-cli/issues/8737)) ([b92cd32](https://github.com/aws-amplify/amplify-cli/commit/b92cd32afc3afb75b3fd7ddcc93a5d510b4fac2e))


### Reverts

* Revert "fix: update migration msg, ddb import e2e, lgtm errors (#8796)" (#8799) ([394a32f](https://github.com/aws-amplify/amplify-cli/commit/394a32f7a801bcf845a180bfdaa7d1d95c5962e7)), closes [#8796](https://github.com/aws-amplify/amplify-cli/issues/8796) [#8799](https://github.com/aws-amplify/amplify-cli/issues/8799)
* Revert "feat: version blocking for CLI (#8737)" (#8747) ([2d5110c](https://github.com/aws-amplify/amplify-cli/commit/2d5110c22412a56027417bc691030aa1ea18121e)), closes [#8737](https://github.com/aws-amplify/amplify-cli/issues/8737) [#8747](https://github.com/aws-amplify/amplify-cli/issues/8747)
* Revert "Revert "feat(amplify-category-auth): use EnabledMFAs to only configure TOTP (#7779)" (#7790)" (#7971) ([ff418d1](https://github.com/aws-amplify/amplify-cli/commit/ff418d151879da2c89f2aced6d67d602f7395371)), closes [#7779](https://github.com/aws-amplify/amplify-cli/issues/7779) [#7790](https://github.com/aws-amplify/amplify-cli/issues/7790) [#7971](https://github.com/aws-amplify/amplify-cli/issues/7971)
* Revert "feat: version blocking for CLI (#8512)" (#8522) ([c48453b](https://github.com/aws-amplify/amplify-cli/commit/c48453bc261d3f424e15179d40d6a21f5b15002a)), closes [#8512](https://github.com/aws-amplify/amplify-cli/issues/8512) [#8522](https://github.com/aws-amplify/amplify-cli/issues/8522)





# [1.32.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.31.1...amplify-cli-core@1.32.0) (2021-11-11)


### Bug Fixes

* Custom policies works with `amplify status -v` ([#8531](https://github.com/aws-amplify/amplify-cli/issues/8531)) ([01f18e4](https://github.com/aws-amplify/amplify-cli/commit/01f18e4a8893f0a2f8833680ffae0f74ccdbdcd4))
* schema migrator utility as separate command ([#8720](https://github.com/aws-amplify/amplify-cli/issues/8720)) ([46e1ee6](https://github.com/aws-amplify/amplify-cli/commit/46e1ee6a49dd86bb682b182a37626bc3f2f966ea))


### Features

* Activate graphql migrator behind feature flag ([5a76b3a](https://github.com/aws-amplify/amplify-cli/commit/5a76b3a320012c09d2ff2f424283fafba74fa74d))
* flag to allow destructive schema changes ([#8273](https://github.com/aws-amplify/amplify-cli/issues/8273)) ([18de856](https://github.com/aws-amplify/amplify-cli/commit/18de856fb61bf2df8f73375e4e55a58c6159a232))
* **graphql-model-transformer:** added transformer version feature flag ([#8328](https://github.com/aws-amplify/amplify-cli/issues/8328)) ([922bf61](https://github.com/aws-amplify/amplify-cli/commit/922bf6198b88826a72d2c1c47fbd31148e2b1250))
* version blocking for CLI ([#8512](https://github.com/aws-amplify/amplify-cli/issues/8512)) ([52edf2b](https://github.com/aws-amplify/amplify-cli/commit/52edf2b58508c96e78184aba1f77c06c021cc9b1))
* version blocking for CLI ([#8737](https://github.com/aws-amplify/amplify-cli/issues/8737)) ([b92cd32](https://github.com/aws-amplify/amplify-cli/commit/b92cd32afc3afb75b3fd7ddcc93a5d510b4fac2e))


### Reverts

* Revert "feat: version blocking for CLI (#8737)" (#8747) ([2d5110c](https://github.com/aws-amplify/amplify-cli/commit/2d5110c22412a56027417bc691030aa1ea18121e)), closes [#8737](https://github.com/aws-amplify/amplify-cli/issues/8737) [#8747](https://github.com/aws-amplify/amplify-cli/issues/8747)
* Revert "Revert "feat(amplify-category-auth): use EnabledMFAs to only configure TOTP (#7779)" (#7790)" (#7971) ([ff418d1](https://github.com/aws-amplify/amplify-cli/commit/ff418d151879da2c89f2aced6d67d602f7395371)), closes [#7779](https://github.com/aws-amplify/amplify-cli/issues/7779) [#7790](https://github.com/aws-amplify/amplify-cli/issues/7790) [#7971](https://github.com/aws-amplify/amplify-cli/issues/7971)
* Revert "feat: version blocking for CLI (#8512)" (#8522) ([c48453b](https://github.com/aws-amplify/amplify-cli/commit/c48453bc261d3f424e15179d40d6a21f5b15002a)), closes [#8512](https://github.com/aws-amplify/amplify-cli/issues/8512) [#8522](https://github.com/aws-amplify/amplify-cli/issues/8522)





## [1.31.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.31.0...amplify-cli-core@1.31.1) (2021-10-10)


### Reverts

* temporarily setup new apps with old pluralization ([#8401](https://github.com/aws-amplify/amplify-cli/issues/8401)) ([7bb57d0](https://github.com/aws-amplify/amplify-cli/commit/7bb57d093bd76adf358d5fb414ed0c5a614e6ce9))





# [1.31.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.30.0...amplify-cli-core@1.31.0) (2021-10-06)


### Features

* Custom policies IAM Policies for Lambda and Containers ([#8068](https://github.com/aws-amplify/amplify-cli/issues/8068)) ([3e1ce0d](https://github.com/aws-amplify/amplify-cli/commit/3e1ce0de4d25ab239adcdcef778cc82f30b17a94))





# [1.30.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.29.0...amplify-cli-core@1.30.0) (2021-09-27)


### Bug Fixes

* [#8223](https://github.com/aws-amplify/amplify-cli/issues/8223), conversion to typescript ([#8245](https://github.com/aws-amplify/amplify-cli/issues/8245)) ([096e6ca](https://github.com/aws-amplify/amplify-cli/commit/096e6ca19b94aa40ef249ea98d008380395afa16))
* **amplify-cli-core:** add service mapping FFs ([#7024](https://github.com/aws-amplify/amplify-cli/issues/7024)) ([36fe24d](https://github.com/aws-amplify/amplify-cli/commit/36fe24db9f37a8a12d50f1e20ea44562eb44d04a))


### Features

* Flag to allow schema changes that require table replacement ([#8144](https://github.com/aws-amplify/amplify-cli/issues/8144)) ([2d4e65a](https://github.com/aws-amplify/amplify-cli/commit/2d4e65acfd034d33c6fa8ac1f5f8582e7e3bc399))


### Reverts

* Revert "feat: Flag to allow schema changes that require table replacement (#8144)" (#8268) ([422dd04](https://github.com/aws-amplify/amplify-cli/commit/422dd04425c72aa7276e086d38ce4d5f4681f9f3)), closes [#8144](https://github.com/aws-amplify/amplify-cli/issues/8144) [#8268](https://github.com/aws-amplify/amplify-cli/issues/8268)





# [1.29.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.28.0...amplify-cli-core@1.29.0) (2021-09-18)


### Features

* **amplify-category-auth:** use usernameAttributes by default, FF for aliasAttributes ([#8188](https://github.com/aws-amplify/amplify-cli/issues/8188)) ([f3044ee](https://github.com/aws-amplify/amplify-cli/commit/f3044eeff21fa900da5aac613db87502526bc165))





# [1.28.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.27.0...amplify-cli-core@1.28.0) (2021-09-14)



# 5.6.0 (2021-09-14)


### Features

* version blocking for CLI ([#7834](https://github.com/aws-amplify/amplify-cli/issues/7834)) ([045ef3b](https://github.com/aws-amplify/amplify-cli/commit/045ef3b83598c287b7e34bb5d1487bbe026026af))


### Reverts

* Revert "feat: version blocking for CLI (#7834)" (#8170) ([f5a92e3](https://github.com/aws-amplify/amplify-cli/commit/f5a92e3fcd288ba8f5eb48db62ccf02f6bb7d03d)), closes [#7834](https://github.com/aws-amplify/amplify-cli/issues/7834) [#8170](https://github.com/aws-amplify/amplify-cli/issues/8170)





# [1.27.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.26.2...amplify-cli-core@1.27.0) (2021-09-09)



# 5.5.0 (2021-09-07)


### Bug Fixes

* runtime hooks readme getting excluded in pkg CLI ([#8100](https://github.com/aws-amplify/amplify-cli/issues/8100)) ([1f491cf](https://github.com/aws-amplify/amplify-cli/commit/1f491cf6dbab4478bff18c084f0ff5c3a6746246))


### Features

* Amplify Command Hooks ([#7633](https://github.com/aws-amplify/amplify-cli/issues/7633)) ([4cacaad](https://github.com/aws-amplify/amplify-cli/commit/4cacaadcb87d377a37890b0092bf66c6e7b65b0b))





## [1.26.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.26.1...amplify-cli-core@1.26.2) (2021-09-02)


### Bug Fixes

* **amplify-cli-core:** extend js-yaml.JSON_SCHEMA to inherit json type conversions when parsing .yml cfn templates ([#7909](https://github.com/aws-amplify/amplify-cli/issues/7909)) ([fe5c1ec](https://github.com/aws-amplify/amplify-cli/commit/fe5c1ec63846d531f6828fae98e86464f32a58e4)), closes [#7819](https://github.com/aws-amplify/amplify-cli/issues/7819)





## [1.26.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.26.0...amplify-cli-core@1.26.1) (2021-08-24)

**Note:** Version bump only for package amplify-cli-core





# [1.26.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.25.1...amplify-cli-core@1.26.0) (2021-08-06)


### Bug Fixes

* improve size checks before packaging Lambda resources ([#7756](https://github.com/aws-amplify/amplify-cli/issues/7756)) ([5952f6a](https://github.com/aws-amplify/amplify-cli/commit/5952f6aa6c1a6bbf3693a465ab61c46b7ab5c37b))


### Features

* create new amplify-prompts package to handle all terminal interactions ([#7774](https://github.com/aws-amplify/amplify-cli/issues/7774)) ([39b3262](https://github.com/aws-amplify/amplify-cli/commit/39b326202283f402f82d7e38a830acdc3845a8d7))





## [1.25.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.25.0...amplify-cli-core@1.25.1) (2021-07-30)


### Bug Fixes

* **amplify-cli-core:** new-line escape sequence made os-specific ([#7814](https://github.com/aws-amplify/amplify-cli/issues/7814)) ([70cd7df](https://github.com/aws-amplify/amplify-cli/commit/70cd7dfe2a7882c1c2d2f2ff7230a0f81e8e8be9))





# [1.25.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.24.1...amplify-cli-core@1.25.0) (2021-07-27)


### Bug Fixes

* **cli:** prevent re-prompt of info on `amplify pull` ([#7730](https://github.com/aws-amplify/amplify-cli/issues/7730)) ([1919558](https://github.com/aws-amplify/amplify-cli/commit/19195589ab2d8b7382cac100c888bdbb62b9ba59))


### Features

* **amplify-category-auth:** use EnabledMFAs to only configure TOTP ([#7779](https://github.com/aws-amplify/amplify-cli/issues/7779)) ([c2102c5](https://github.com/aws-amplify/amplify-cli/commit/c2102c53fd2ca974fb95c4468ad7a87fefe14ab0))


### Reverts

* Revert "feat(amplify-category-auth): use EnabledMFAs to only configure TOTP (#7779)" (#7790) ([fa172c4](https://github.com/aws-amplify/amplify-cli/commit/fa172c4caf6f15de56925bd1ff4f8ee743788b52)), closes [#7779](https://github.com/aws-amplify/amplify-cli/issues/7779) [#7790](https://github.com/aws-amplify/amplify-cli/issues/7790)





## [1.24.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.24.0...amplify-cli-core@1.24.1) (2021-07-16)


### Bug Fixes

* checkout into existing env with new LL ([#7687](https://github.com/aws-amplify/amplify-cli/issues/7687)) ([3e2e630](https://github.com/aws-amplify/amplify-cli/commit/3e2e6305b5a74db2a282dc33b0cc5d24f1c8eaaf))





# [1.24.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.23.1...amplify-cli-core@1.24.0) (2021-06-30)



# 5.1.0 (2021-06-29)


### Bug Fixes

* [#7561](https://github.com/aws-amplify/amplify-cli/issues/7561) - auth trigger usage with user groups ([#7592](https://github.com/aws-amplify/amplify-cli/issues/7592)) ([d1d372e](https://github.com/aws-amplify/amplify-cli/commit/d1d372ee55d2fb1c15022642837c1f6fb6994ac8))


### Features

* **amplify-cli-core:** add FF for flutter null safety release ([#7607](https://github.com/aws-amplify/amplify-cli/issues/7607)) ([a65bfa9](https://github.com/aws-amplify/amplify-cli/commit/a65bfa99793a5d7d7106638d6fab4a40954a1ee9))
* configure env vars and secrets for lambda functions ([#7529](https://github.com/aws-amplify/amplify-cli/issues/7529)) ([fac354e](https://github.com/aws-amplify/amplify-cli/commit/fac354e5e26846e8b1499d3a4718b15983e0110f))





## [1.23.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.23.0...amplify-cli-core@1.23.1) (2021-06-24)


### Bug Fixes

* **graphql-transformer-common:** improve generated graphql pluralization ([#7258](https://github.com/aws-amplify/amplify-cli/issues/7258)) ([fc3ad0d](https://github.com/aws-amplify/amplify-cli/commit/fc3ad0dd5a12a7912c59ae12024f593b4cdf7f2d)), closes [#4224](https://github.com/aws-amplify/amplify-cli/issues/4224)





# [1.23.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.22.2...amplify-cli-core@1.23.0) (2021-06-15)



# 5.0.0 (2021-06-14)


### Bug Fixes

* copy env specific data from ccb on env checkout ([#7512](https://github.com/aws-amplify/amplify-cli/issues/7512)) ([bef6d9c](https://github.com/aws-amplify/amplify-cli/commit/bef6d9c5d1fd7e12bbacaf20639c00334d285517))


### Features

* add support for defining IAM Permissions Boundary for Project ([#7144](https://github.com/aws-amplify/amplify-cli/issues/7144)) ([acf031b](https://github.com/aws-amplify/amplify-cli/commit/acf031b29d4e554d647da39ffb8293010cf1d8ad))
* Define IAM Permissions Boundary for Project ([#7502](https://github.com/aws-amplify/amplify-cli/issues/7502)) (ref [#4618](https://github.com/aws-amplify/amplify-cli/issues/4618)) ([08f7a3c](https://github.com/aws-amplify/amplify-cli/commit/08f7a3c45b2e98535ef325eb0a97c5bc4d3008c6)), closes [#7053](https://github.com/aws-amplify/amplify-cli/issues/7053)
* lambda layers rework ([#7375](https://github.com/aws-amplify/amplify-cli/issues/7375)) ([a3b7d3e](https://github.com/aws-amplify/amplify-cli/commit/a3b7d3e427e16bac2b2ea27699fe53b48cf47656))


### Reverts

* Revert "feat: add support for defining IAM Permissions Boundary for Project (#7144)" (#7453) ([08704f0](https://github.com/aws-amplify/amplify-cli/commit/08704f0271f6f5d0e0e98ad7002f4b35c3890924)), closes [#7144](https://github.com/aws-amplify/amplify-cli/issues/7144) [#7453](https://github.com/aws-amplify/amplify-cli/issues/7453)





## [1.22.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.22.1...amplify-cli-core@1.22.2) (2021-05-26)

**Note:** Version bump only for package amplify-cli-core





## [1.22.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.22.0...amplify-cli-core@1.22.1) (2021-05-18)

**Note:** Version bump only for package amplify-cli-core





# [1.22.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.21.2...amplify-cli-core@1.22.0) (2021-05-14)



# 4.51.0 (2021-05-13)


### Bug Fixes

* [#7243](https://github.com/aws-amplify/amplify-cli/issues/7243) yaml parsing should support all cfn functions ([#7245](https://github.com/aws-amplify/amplify-cli/issues/7245)) ([4130f2f](https://github.com/aws-amplify/amplify-cli/commit/4130f2fc460f2d038365c4314c6293c203a6520e))


### Features

* defer root stack creation to first `amplify push` ([#7174](https://github.com/aws-amplify/amplify-cli/issues/7174)) ([d28dd1c](https://github.com/aws-amplify/amplify-cli/commit/d28dd1caca86b19a858dab0e7aa907d1cc74c86a))
* prep work for SMS Sandbox support ([#7302](https://github.com/aws-amplify/amplify-cli/issues/7302)) ([d1f85d2](https://github.com/aws-amplify/amplify-cli/commit/d1f85d2e0a9c367b71defefe6d9e00737f681ca4))


### Reverts

* Revert "feat: defer root stack creation to first `amplify push` (#7174)" (#7306) ([78854eb](https://github.com/aws-amplify/amplify-cli/commit/78854ebd4a3d41d34d68736d6556045302101265)), closes [#7174](https://github.com/aws-amplify/amplify-cli/issues/7174) [#7306](https://github.com/aws-amplify/amplify-cli/issues/7306)





## [1.21.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.21.0...amplify-cli-core@1.21.2) (2021-05-03)



## 4.50.1 (2021-05-03)


### Bug Fixes

* parse nested yaml GetAtt refs correctly ([#7220](https://github.com/aws-amplify/amplify-cli/issues/7220)) ([0b20951](https://github.com/aws-amplify/amplify-cli/commit/0b209510c32d5ded9f57805a72858900ec8e21f2))





## [1.21.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.21.0...amplify-cli-core@1.21.1) (2021-05-03)


### Bug Fixes

* parse nested yaml GetAtt refs correctly ([#7220](https://github.com/aws-amplify/amplify-cli/issues/7220)) ([0b20951](https://github.com/aws-amplify/amplify-cli/commit/0b209510c32d5ded9f57805a72858900ec8e21f2))





# [1.21.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.20.1...amplify-cli-core@1.21.0) (2021-04-27)


### Bug Fixes

* frontend flag not honoring passed in framework ([#7126](https://github.com/aws-amplify/amplify-cli/issues/7126)) (ref [#7046](https://github.com/aws-amplify/amplify-cli/issues/7046)) ([1e67fc9](https://github.com/aws-amplify/amplify-cli/commit/1e67fc9a2fab262334181bbb50cba91999e24c33))


### Features

* S3 SSE by default ([#7039](https://github.com/aws-amplify/amplify-cli/issues/7039)) (ref [#5708](https://github.com/aws-amplify/amplify-cli/issues/5708)) ([c1369ed](https://github.com/aws-amplify/amplify-cli/commit/c1369ed6f9c204c89ee2d4c805314a40d6eeaf92))





## [1.20.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.20.0...amplify-cli-core@1.20.1) (2021-04-19)

**Note:** Version bump only for package amplify-cli-core





# [1.20.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.19.1...amplify-cli-core@1.20.0) (2021-04-14)


### Features

* added new fields to usage data ([#6911](https://github.com/aws-amplify/amplify-cli/issues/6911)) ([dc1d256](https://github.com/aws-amplify/amplify-cli/commit/dc1d256edecec2009ca6649da0995be571886b03))





## [1.19.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.18.1...amplify-cli-core@1.19.1) (2021-04-09)


### Bug Fixes

* **cli:** use more inclusive language ([#6919](https://github.com/aws-amplify/amplify-cli/issues/6919)) ([bb70464](https://github.com/aws-amplify/amplify-cli/commit/bb70464d6c24fa931c0eb80d234a496d936913f5))





## [1.18.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.18.0...amplify-cli-core@1.18.1) (2021-03-11)


### Bug Fixes

* e2e fix PR [#6059](https://github.com/aws-amplify/amplify-cli/issues/6059) ([#6807](https://github.com/aws-amplify/amplify-cli/issues/6807)) ([3a9058e](https://github.com/aws-amplify/amplify-cli/commit/3a9058ee68ffb2b883d2cb000a2ec1adede22fbf))
* gql compiler fix for user defined mutation ([#6059](https://github.com/aws-amplify/amplify-cli/issues/6059)) ([063d84f](https://github.com/aws-amplify/amplify-cli/commit/063d84ff3d31762a4434f3146623132536f4667d))





# [1.18.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.17.2...amplify-cli-core@1.18.0) (2021-03-05)


### Features

* **FF-codegen:** add feature flags for new codegen features ([#6732](https://github.com/aws-amplify/amplify-cli/issues/6732)) ([d00a8e9](https://github.com/aws-amplify/amplify-cli/commit/d00a8e95721c2fb27ef650fa2099e12de7d99705))





## [1.17.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.17.1...amplify-cli-core@1.17.2) (2021-02-26)

**Note:** Version bump only for package amplify-cli-core





## [1.17.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.17.0...amplify-cli-core@1.17.1) (2021-02-24)

**Note:** Version bump only for package amplify-cli-core





# [1.17.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.16.0...amplify-cli-core@1.17.0) (2021-02-17)


### Features

* **amplify-cli-core:** add validations to tag Key and Value ([31eb8eb](https://github.com/aws-amplify/amplify-cli/commit/31eb8ebff2fcbd215975c8ac05287d023d544c42))
* Separate prod and dev lambda function builds ([#6494](https://github.com/aws-amplify/amplify-cli/issues/6494)) ([2977c6a](https://github.com/aws-amplify/amplify-cli/commit/2977c6a886b33a38ef46f898a2adc1ffdb6d228b))





# [1.16.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.15.0...amplify-cli-core@1.16.0) (2021-02-11)


### Features

* dont open urls when CLI is running in CI ([#6503](https://github.com/aws-amplify/amplify-cli/issues/6503)) ([27546a7](https://github.com/aws-amplify/amplify-cli/commit/27546a78159ea95c636dbbd094fe6a4f7fb8f8f4)), closes [#5973](https://github.com/aws-amplify/amplify-cli/issues/5973)





# [1.15.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.14.1...amplify-cli-core@1.15.0) (2021-02-10)


### Bug Fixes

* fix appsync permission assignment from functions ([#5342](https://github.com/aws-amplify/amplify-cli/issues/5342)) ([b2e2dd0](https://github.com/aws-amplify/amplify-cli/commit/b2e2dd0071c1a451ba032cf7f8cfe7cf6381a96e))
* **amplify-category-function:** use ref for S3Bucket and S3Key in CFN ([#6358](https://github.com/aws-amplify/amplify-cli/issues/6358)) ([84a141a](https://github.com/aws-amplify/amplify-cli/commit/84a141ac4812d95c27b14c8d9f81e4a5c8fadef8))
* optimize mock package imports ([#6455](https://github.com/aws-amplify/amplify-cli/issues/6455)) ([1b64a14](https://github.com/aws-amplify/amplify-cli/commit/1b64a147cbb3b56ce6f8465318d611de5d724685))


### Features

* **graphql-key-transformer:** change default to add GSIs when using [@key](https://github.com/key) ([#5648](https://github.com/aws-amplify/amplify-cli/issues/5648)) ([4287c63](https://github.com/aws-amplify/amplify-cli/commit/4287c630295c304c7ff8343922926b4830b75cd4))





## [1.14.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.14.0...amplify-cli-core@1.14.1) (2021-01-08)


### Bug Fixes

* apply tags on create and push nested stack ([#6321](https://github.com/aws-amplify/amplify-cli/issues/6321)) ([4faa3e5](https://github.com/aws-amplify/amplify-cli/commit/4faa3e5ac38d311fe7901fb1b8a1b542cf19e598))
* better error message when angular.json is missing ([#6253](https://github.com/aws-amplify/amplify-cli/issues/6253)) ([0c8175e](https://github.com/aws-amplify/amplify-cli/commit/0c8175e6312fc6fcd5b9e1334cf2011d1e8d392a))
* remove process on next and await ([#6239](https://github.com/aws-amplify/amplify-cli/issues/6239)) ([59d4a0e](https://github.com/aws-amplify/amplify-cli/commit/59d4a0eb318d2b3ad97be34bda9dee756cf82d74))





# [1.14.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.13.1...amplify-cli-core@1.14.0) (2020-12-31)


### Features

* **cli:** generate REAMDE file in amplify dir ([#5808](https://github.com/aws-amplify/amplify-cli/issues/5808)) ([cf0629f](https://github.com/aws-amplify/amplify-cli/commit/cf0629f7385df77aad19fddd58e3587e40482de2))





## [1.13.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.13.0...amplify-cli-core@1.13.1) (2020-12-21)


### Bug Fixes

* **amplify-provider-awscloudformation:** load correct file ([#6212](https://github.com/aws-amplify/amplify-cli/issues/6212)) ([7876187](https://github.com/aws-amplify/amplify-cli/commit/787618736540231efeeee8c803c178325b2c70b4))





# [1.13.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.12.0...amplify-cli-core@1.13.0) (2020-12-16)


### Bug Fixes

* [#4175](https://github.com/aws-amplify/amplify-cli/issues/4175) ([#6065](https://github.com/aws-amplify/amplify-cli/issues/6065)) ([85b1ae3](https://github.com/aws-amplify/amplify-cli/commit/85b1ae31253d06718e13a2e2ff8cca3fc1931073))
* provide better error message when unknown feature flags are present ([#6114](https://github.com/aws-amplify/amplify-cli/issues/6114)) ([d452e83](https://github.com/aws-amplify/amplify-cli/commit/d452e83c19bc6c4002a851c68b3961fc135f3689))


### Features

* **amplify-frontend-ios:** xcode integration feature flag ([#6072](https://github.com/aws-amplify/amplify-cli/issues/6072)) ([d7327ca](https://github.com/aws-amplify/amplify-cli/commit/d7327ca50b163c6104e99a112b8f5c5201e0bbbf))





# [1.12.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.11.0...amplify-cli-core@1.12.0) (2020-12-11)


### Features

* container-based deployments([#5727](https://github.com/aws-amplify/amplify-cli/issues/5727)) ([fad6377](https://github.com/aws-amplify/amplify-cli/commit/fad6377bd384862ca4429cb1a83eee90efd62b58))





# [1.11.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.10.0...amplify-cli-core@1.11.0) (2020-12-07)


### Features

* add support for multiple [@key](https://github.com/key) changes in same [@model](https://github.com/model) ([#6044](https://github.com/aws-amplify/amplify-cli/issues/6044)) ([e574637](https://github.com/aws-amplify/amplify-cli/commit/e5746379ea1330c53dacb55e8f6a9de7b17b55ae))





# [1.10.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.9.0...amplify-cli-core@1.10.0) (2020-11-30)


### Features

* pre-deploy pull, new login mechanism and pkg cli updates ([#5941](https://github.com/aws-amplify/amplify-cli/issues/5941)) ([7274251](https://github.com/aws-amplify/amplify-cli/commit/7274251faadc1035acce5f44699b172e10e2e67d))





# [1.9.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.8.0...amplify-cli-core@1.9.0) (2020-11-27)


### Bug Fixes

* fix to ignore deployment secret if not found ([#5985](https://github.com/aws-amplify/amplify-cli/issues/5985)) ([c1df18d](https://github.com/aws-amplify/amplify-cli/commit/c1df18ded1610bdabc342471dc67a40100a325dc))


### Features

* **iOS:** execute `amplify-app` flow on `init ` and `codegen models` ([#5917](https://github.com/aws-amplify/amplify-cli/issues/5917)) ([c47c8f7](https://github.com/aws-amplify/amplify-cli/commit/c47c8f78b37806181354d3842a2094c35b1795d0))


### Reverts

* Revert "feat(iOS): execute `amplify-app` flow on `init ` and `codegen models` (#5917)" (#5960) ([cd7951a](https://github.com/aws-amplify/amplify-cli/commit/cd7951ab6d26f1206c2f0ff95225ba7b2a5a25eb)), closes [#5917](https://github.com/aws-amplify/amplify-cli/issues/5917) [#5960](https://github.com/aws-amplify/amplify-cli/issues/5960)





# [1.8.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.6.0...amplify-cli-core@1.8.0) (2020-11-22)


### Bug Fixes

* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))


### Features

* storage import ([#5893](https://github.com/aws-amplify/amplify-cli/issues/5893)) ([ad7b028](https://github.com/aws-amplify/amplify-cli/commit/ad7b028330bcee64d5124be7f27a8494dc8e9400))





# 1.7.0 (2020-11-22)


### Bug Fixes

* add compatibility to json parse for non-string values ([#5147](https://github.com/aws-amplify/amplify-cli/issues/5147)) ([3bc9306](https://github.com/aws-amplify/amplify-cli/commit/3bc9306c7b3d078d9b531f5950e8a304fc031d23))
* added exit code on remove ([#5427](https://github.com/aws-amplify/amplify-cli/issues/5427)) ([33132f7](https://github.com/aws-amplify/amplify-cli/commit/33132f764b290cafd345720409a5db8ea6088069))
* data inconsitency ([#5344](https://github.com/aws-amplify/amplify-cli/issues/5344)) ([bfe1903](https://github.com/aws-amplify/amplify-cli/commit/bfe19038b5b676056f45d7ffcc4c2460057936d8))
* move mobile hub flag to context directly ([#5459](https://github.com/aws-amplify/amplify-cli/issues/5459)) ([1828d21](https://github.com/aws-amplify/amplify-cli/commit/1828d214e3491a3633d72f571b7a8f1ab271f7a1))
* move post-install steps to plugin platform rather than post install script ([#5678](https://github.com/aws-amplify/amplify-cli/issues/5678)) ([f83bbab](https://github.com/aws-amplify/amplify-cli/commit/f83bbab378f6857202653cd57c607cead11cbe52))
* publish returns with exitcode 1 ([#5413](https://github.com/aws-amplify/amplify-cli/issues/5413)) ([2064830](https://github.com/aws-amplify/amplify-cli/commit/20648308fca4d4ae6dba84874c3f5508405ff701))
* refactor amplify.json file handling ([#5282](https://github.com/aws-amplify/amplify-cli/issues/5282)) ([a6269f3](https://github.com/aws-amplify/amplify-cli/commit/a6269f3177f3242df81e9d7dce0625295bb7a9fc))
* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))
* update default file permissions for credentials/config ([#5246](https://github.com/aws-amplify/amplify-cli/issues/5246)) ([b64f1bd](https://github.com/aws-amplify/amplify-cli/commit/b64f1bd784b0595f49241fdd89686c5f8a421ae3))


### Features

* changes for native packaging ([#5548](https://github.com/aws-amplify/amplify-cli/issues/5548)) ([7a06f6d](https://github.com/aws-amplify/amplify-cli/commit/7a06f6d96e42a5863e2192560890adbd741b0dc6))
* feature flag implementation ([#4891](https://github.com/aws-amplify/amplify-cli/issues/4891)) ([6d1c632](https://github.com/aws-amplify/amplify-cli/commit/6d1c632952a49cb56670c11c9cb0c3620d0eb332))
* ff to turn off schema reserve word validation ([#5745](https://github.com/aws-amplify/amplify-cli/issues/5745)) ([de79514](https://github.com/aws-amplify/amplify-cli/commit/de79514c18bea7236a05f0658513b95318501d16))
* resource Tagging Support ([#5178](https://github.com/aws-amplify/amplify-cli/issues/5178)) ([e34226d](https://github.com/aws-amplify/amplify-cli/commit/e34226dde30d7d345e3cc2e72e187b242a09c389))
* storage import ([#5893](https://github.com/aws-amplify/amplify-cli/issues/5893)) ([ad7b028](https://github.com/aws-amplify/amplify-cli/commit/ad7b028330bcee64d5124be7f27a8494dc8e9400))
* support importing of auth resources ([#5591](https://github.com/aws-amplify/amplify-cli/issues/5591)) ([7903246](https://github.com/aws-amplify/amplify-cli/commit/790324680544fe18481f91390001f9f07a144203))
* transformer redesign ([#5534](https://github.com/aws-amplify/amplify-cli/issues/5534)) ([a93c685](https://github.com/aws-amplify/amplify-cli/commit/a93c6852f6588898ebc52b0574f4fcc3d2e87948))
* update post-install to copy executable assets to .amplify ([#5595](https://github.com/aws-amplify/amplify-cli/issues/5595)) ([53a23a0](https://github.com/aws-amplify/amplify-cli/commit/53a23a07cbb9e09566c1f0f577ba2b7488bc2eae))





## [1.6.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.6.0...amplify-cli-core@1.6.3) (2020-11-20)


### Bug Fixes

* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))





## [1.6.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.6.0...amplify-cli-core@1.6.2) (2020-11-20)


### Bug Fixes

* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))





## [1.6.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.6.0...amplify-cli-core@1.6.1) (2020-11-19)


### Bug Fixes

* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))





# [1.6.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.5.1...amplify-cli-core@1.6.0) (2020-11-08)


### Features

* ff to turn off schema reserve word validation ([#5745](https://github.com/aws-amplify/amplify-cli/issues/5745)) ([de79514](https://github.com/aws-amplify/amplify-cli/commit/de79514c18bea7236a05f0658513b95318501d16))
* transformer redesign ([#5534](https://github.com/aws-amplify/amplify-cli/issues/5534)) ([a93c685](https://github.com/aws-amplify/amplify-cli/commit/a93c6852f6588898ebc52b0574f4fcc3d2e87948))





## [1.5.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.5.0...amplify-cli-core@1.5.1) (2020-10-27)


### Bug Fixes

* move post-install steps to plugin platform rather than post install script ([#5678](https://github.com/aws-amplify/amplify-cli/issues/5678)) ([f83bbab](https://github.com/aws-amplify/amplify-cli/commit/f83bbab378f6857202653cd57c607cead11cbe52))





# [1.5.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.4.0...amplify-cli-core@1.5.0) (2020-10-22)


### Features

* update post-install to copy executable assets to .amplify ([#5595](https://github.com/aws-amplify/amplify-cli/issues/5595)) ([53a23a0](https://github.com/aws-amplify/amplify-cli/commit/53a23a07cbb9e09566c1f0f577ba2b7488bc2eae))





# [1.4.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.3.4...amplify-cli-core@1.4.0) (2020-10-17)


### Features

* changes for native packaging ([#5548](https://github.com/aws-amplify/amplify-cli/issues/5548)) ([7a06f6d](https://github.com/aws-amplify/amplify-cli/commit/7a06f6d96e42a5863e2192560890adbd741b0dc6))
* support importing of auth resources ([#5591](https://github.com/aws-amplify/amplify-cli/issues/5591)) ([7903246](https://github.com/aws-amplify/amplify-cli/commit/790324680544fe18481f91390001f9f07a144203))





## [1.3.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.3.3...amplify-cli-core@1.3.4) (2020-10-01)


### Bug Fixes

* added exit code on remove ([#5427](https://github.com/aws-amplify/amplify-cli/issues/5427)) ([33132f7](https://github.com/aws-amplify/amplify-cli/commit/33132f764b290cafd345720409a5db8ea6088069))
* move mobile hub flag to context directly ([#5459](https://github.com/aws-amplify/amplify-cli/issues/5459)) ([1828d21](https://github.com/aws-amplify/amplify-cli/commit/1828d214e3491a3633d72f571b7a8f1ab271f7a1))
* publish returns with exitcode 1 ([#5413](https://github.com/aws-amplify/amplify-cli/issues/5413)) ([2064830](https://github.com/aws-amplify/amplify-cli/commit/20648308fca4d4ae6dba84874c3f5508405ff701))





## [1.3.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.3.2...amplify-cli-core@1.3.3) (2020-09-25)


### Bug Fixes

* data inconsitency ([#5344](https://github.com/aws-amplify/amplify-cli/issues/5344)) ([bfe1903](https://github.com/aws-amplify/amplify-cli/commit/bfe19038b5b676056f45d7ffcc4c2460057936d8))





## [1.3.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.3.1...amplify-cli-core@1.3.2) (2020-09-16)


### Bug Fixes

* refactor amplify.json file handling ([#5282](https://github.com/aws-amplify/amplify-cli/issues/5282)) ([a6269f3](https://github.com/aws-amplify/amplify-cli/commit/a6269f3177f3242df81e9d7dce0625295bb7a9fc))





## [1.3.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.3.0...amplify-cli-core@1.3.1) (2020-09-09)


### Bug Fixes

* update default file permissions for credentials/config ([#5246](https://github.com/aws-amplify/amplify-cli/issues/5246)) ([b64f1bd](https://github.com/aws-amplify/amplify-cli/commit/b64f1bd784b0595f49241fdd89686c5f8a421ae3))





# [1.3.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.2.0...amplify-cli-core@1.3.0) (2020-08-31)


### Bug Fixes

* add compatibility to json parse for non-string values ([#5147](https://github.com/aws-amplify/amplify-cli/issues/5147)) ([3bc9306](https://github.com/aws-amplify/amplify-cli/commit/3bc9306c7b3d078d9b531f5950e8a304fc031d23))


### Features

* resource Tagging Support ([#5178](https://github.com/aws-amplify/amplify-cli/issues/5178)) ([e34226d](https://github.com/aws-amplify/amplify-cli/commit/e34226dde30d7d345e3cc2e72e187b242a09c389))





# 1.2.0 (2020-07-29)


### Features

* feature flag implementation ([#4891](https://github.com/aws-amplify/amplify-cli/issues/4891)) ([6d1c632](https://github.com/aws-amplify/amplify-cli/commit/6d1c632952a49cb56670c11c9cb0c3620d0eb332))





# 1.1.0 (2020-07-23)


### Features

* feature flag implementation ([#4891](https://github.com/aws-amplify/amplify-cli/issues/4891)) ([4639450](https://github.com/aws-amplify/amplify-cli/commit/463945029cfe861f74986d9a8b9af6b827d2063d))
