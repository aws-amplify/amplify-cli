# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.7.0-ext15.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-model-transformer@0.6.4...@aws-amplify/graphql-model-transformer@0.7.0-ext15.0) (2021-11-07)


### Bug Fixes

* **graphql-model-transformer:** fixed model transformer ID generation when ID field is not specified ([#8633](https://github.com/aws-amplify/amplify-cli/issues/8633)) ([b515d16](https://github.com/aws-amplify/amplify-cli/commit/b515d1617a98d613b2d9feb424ece12204d63402))
* **graphql-model-transformer:** override resource logical id to fix v1 to v2 transformer migration ([#8597](https://github.com/aws-amplify/amplify-cli/issues/8597)) ([e3a2afb](https://github.com/aws-amplify/amplify-cli/commit/e3a2afbbed6e97f143fc7c83064e2193f4c91bdd))


### Features

* generate list types as non-null ([#8166](https://github.com/aws-amplify/amplify-cli/issues/8166)) ([93786c1](https://github.com/aws-amplify/amplify-cli/commit/93786c13ef04c72748ca32a1ef7878c0e6b5b129))





## [0.6.4](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-model-transformer@0.6.3...@aws-amplify/graphql-model-transformer@0.6.4) (2021-10-10)

**Note:** Version bump only for package @aws-amplify/graphql-model-transformer





## [0.6.3](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-model-transformer@0.6.2...@aws-amplify/graphql-model-transformer@0.6.3) (2021-09-27)


### Bug Fixes

* **graphql-model-transformer:** [@model](https://github.com/model) conflict resolution ([#8035](https://github.com/aws-amplify/amplify-cli/issues/8035)) ([f3bdc4a](https://github.com/aws-amplify/amplify-cli/commit/f3bdc4ac1fcf596f634d9d2e968785e76f7b138c))
* **graphql-model-transformer:** iam role name does not exceed 64 characters ([#8244](https://github.com/aws-amplify/amplify-cli/issues/8244)) ([812a671](https://github.com/aws-amplify/amplify-cli/commit/812a67163d6dd33160bf7ace9afd538c83a7af1a))
* **graphql-model-transformer:** remove unnecessary warnings for resolver config per type ([#8265](https://github.com/aws-amplify/amplify-cli/issues/8265)) ([2f2f0a5](https://github.com/aws-amplify/amplify-cli/commit/2f2f0a5bea59278219c1f4ebb5276927dc5a0fbd))





## [0.6.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-model-transformer@0.6.1...@aws-amplify/graphql-model-transformer@0.6.2) (2021-09-14)


### Bug Fixes

* **graphql-model-transformer:** fix typo in print block ([#8152](https://github.com/aws-amplify/amplify-cli/issues/8152)) ([7377e58](https://github.com/aws-amplify/amplify-cli/commit/7377e58535dd5555d9e11cf3114fb23cdbb1f382))





## [0.6.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-model-transformer@0.6.0...@aws-amplify/graphql-model-transformer@0.6.1) (2021-09-02)


### Bug Fixes

* add model transformer v2 e2e tests ([#7946](https://github.com/aws-amplify/amplify-cli/issues/7946)) ([351a8bc](https://github.com/aws-amplify/amplify-cli/commit/351a8bce6069398535878fd62886e0ee5c402329))
* model transformer support condition ([#7935](https://github.com/aws-amplify/amplify-cli/issues/7935)) ([fc93dba](https://github.com/aws-amplify/amplify-cli/commit/fc93dbabb38427607ef6abb6f1d7fb2f357a284b))
* update and create input field type known model types filtering ([#7929](https://github.com/aws-amplify/amplify-cli/issues/7929)) ([16334f7](https://github.com/aws-amplify/amplify-cli/commit/16334f7217f0ac751a642d82512240aedec17721))





# [0.6.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-model-transformer@0.5.1...@aws-amplify/graphql-model-transformer@0.6.0) (2021-08-24)


### Bug Fixes

* **graphql-model-transformer:** added [@model](https://github.com/model) name reserved words validation ([#7877](https://github.com/aws-amplify/amplify-cli/issues/7877)) ([781ddbb](https://github.com/aws-amplify/amplify-cli/commit/781ddbb6733803487e16aedc69bb8182a00bcce9))


### Features

* add [@index](https://github.com/index) directive ([#7887](https://github.com/aws-amplify/amplify-cli/issues/7887)) ([e011555](https://github.com/aws-amplify/amplify-cli/commit/e0115557aad893b3286226e92ce8fecbd5636c1a))
* model transformer advanced subscriptions ([#7927](https://github.com/aws-amplify/amplify-cli/issues/7927)) ([1725630](https://github.com/aws-amplify/amplify-cli/commit/1725630c61c40923e8dfa3c697ea5472df2e5de1))





## [0.5.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-model-transformer@0.5.0...@aws-amplify/graphql-model-transformer@0.5.1) (2021-08-06)


### Bug Fixes

* add DDB params to model v2 ([#7827](https://github.com/aws-amplify/amplify-cli/issues/7827)) ([f43002e](https://github.com/aws-amplify/amplify-cli/commit/f43002ed46d0ee42a64cec3d12322d4ae552a70b))
* **graphql-model-transformer:** model input fields transform ([#7857](https://github.com/aws-amplify/amplify-cli/issues/7857)) ([12ff663](https://github.com/aws-amplify/amplify-cli/commit/12ff663a94a4896bd9eacef3847be15b7631d8df))
* misc [@model](https://github.com/model) v2 VTL cleanup ([#7856](https://github.com/aws-amplify/amplify-cli/issues/7856)) ([98d81d8](https://github.com/aws-amplify/amplify-cli/commit/98d81d8e2e13fc1525389ba21e6ad4b372e671fb))
* use improved pluralization in graphql transformer v2 ([#7817](https://github.com/aws-amplify/amplify-cli/issues/7817)) ([38e2599](https://github.com/aws-amplify/amplify-cli/commit/38e25996ee00479031c88714af3b9d40ef9e079c))





# [0.5.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-model-transformer@0.4.6...@aws-amplify/graphql-model-transformer@0.5.0) (2021-07-30)


### Features

* capability injection for the vNext GraphQL Transformer ([#7735](https://github.com/aws-amplify/amplify-cli/issues/7735)) ([f3eae13](https://github.com/aws-amplify/amplify-cli/commit/f3eae13ab2848df398e26429abf985b756abcff2))





## [0.4.6](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-model-transformer@0.4.5...@aws-amplify/graphql-model-transformer@0.4.6) (2021-07-27)

**Note:** Version bump only for package @aws-amplify/graphql-model-transformer





## [0.4.5](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-model-transformer@0.4.4...@aws-amplify/graphql-model-transformer@0.4.5) (2021-07-16)

**Note:** Version bump only for package @aws-amplify/graphql-model-transformer





## [0.4.4](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-model-transformer@0.4.3...@aws-amplify/graphql-model-transformer@0.4.4) (2021-07-12)


### Bug Fixes

* get mock working with gql transformer v2 ([#7574](https://github.com/aws-amplify/amplify-cli/issues/7574)) ([4fa2900](https://github.com/aws-amplify/amplify-cli/commit/4fa2900d6b9ca515677d06bdffe29f56401b9c86))





## [0.4.3](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-model-transformer@0.4.2...@aws-amplify/graphql-model-transformer@0.4.3) (2021-06-30)


### Bug Fixes

* update DDB data source name in gql transformer v2 ([#7443](https://github.com/aws-amplify/amplify-cli/issues/7443)) ([7abe3bd](https://github.com/aws-amplify/amplify-cli/commit/7abe3bd5788c0096f68fa5356bb0e7f6384d3bb5))





## [0.4.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-model-transformer@0.4.1...@aws-amplify/graphql-model-transformer@0.4.2) (2021-06-24)


### Bug Fixes

* correct 'tranformer' typo ([#7408](https://github.com/aws-amplify/amplify-cli/issues/7408)) ([9420f1b](https://github.com/aws-amplify/amplify-cli/commit/9420f1b29137fd7621d7d902a147e596776357df))
* remove extra $ output of model transformer v2 ([#7415](https://github.com/aws-amplify/amplify-cli/issues/7415)) ([a8680a2](https://github.com/aws-amplify/amplify-cli/commit/a8680a2c94d86b6b3fb29cf9b7e04ba8680b907b))





## [0.4.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-model-transformer@0.4.0...@aws-amplify/graphql-model-transformer@0.4.1) (2021-05-26)

**Note:** Version bump only for package @aws-amplify/graphql-model-transformer





# [0.4.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-model-transformer@0.3.6...@aws-amplify/graphql-model-transformer@0.4.0) (2021-05-18)


### Features

* port [@searchable](https://github.com/searchable) to GraphQL Transformer v2 ([#7291](https://github.com/aws-amplify/amplify-cli/issues/7291)) ([37a2df2](https://github.com/aws-amplify/amplify-cli/commit/37a2df2365fe4bf0eddf285a159221e34f695fe2))





## [0.3.6](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-model-transformer@0.3.4...@aws-amplify/graphql-model-transformer@0.3.6) (2021-05-03)



## 4.50.1 (2021-05-03)

**Note:** Version bump only for package @aws-amplify/graphql-model-transformer





## [0.3.5](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-model-transformer@0.3.4...@aws-amplify/graphql-model-transformer@0.3.5) (2021-05-03)

**Note:** Version bump only for package @aws-amplify/graphql-model-transformer





## [0.3.4](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-model-transformer@0.3.3...@aws-amplify/graphql-model-transformer@0.3.4) (2021-03-05)

**Note:** Version bump only for package @aws-amplify/graphql-model-transformer





## [0.3.3](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-model-transformer@0.3.2...@aws-amplify/graphql-model-transformer@0.3.3) (2021-02-26)

**Note:** Version bump only for package @aws-amplify/graphql-model-transformer





## [0.3.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-model-transformer@0.3.1...@aws-amplify/graphql-model-transformer@0.3.2) (2021-02-11)

**Note:** Version bump only for package @aws-amplify/graphql-model-transformer





## [0.3.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-model-transformer@0.3.0...@aws-amplify/graphql-model-transformer@0.3.1) (2021-02-10)

**Note:** Version bump only for package @aws-amplify/graphql-model-transformer





# [0.3.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-model-transformer@0.2.1...@aws-amplify/graphql-model-transformer@0.3.0) (2020-12-11)


### Features

* container-based deployments([#5727](https://github.com/aws-amplify/amplify-cli/issues/5727)) ([fad6377](https://github.com/aws-amplify/amplify-cli/commit/fad6377bd384862ca4429cb1a83eee90efd62b58))





## [0.2.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-model-transformer@0.1.0...@aws-amplify/graphql-model-transformer@0.2.1) (2020-11-22)

**Note:** Version bump only for package @aws-amplify/graphql-model-transformer





# 0.2.0 (2020-11-22)


### Features

* transformer redesign ([#5534](https://github.com/aws-amplify/amplify-cli/issues/5534)) ([a93c685](https://github.com/aws-amplify/amplify-cli/commit/a93c6852f6588898ebc52b0574f4fcc3d2e87948))





# 0.1.0 (2020-11-08)


### Features

* transformer redesign ([#5534](https://github.com/aws-amplify/amplify-cli/issues/5534)) ([a93c685](https://github.com/aws-amplify/amplify-cli/commit/a93c6852f6588898ebc52b0574f4fcc3d2e87948))
