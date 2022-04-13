# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.16.4](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.16.3...@aws-amplify/graphql-transformer-core@0.16.4) (2022-04-07)


### Bug Fixes

* **graphql:** avoid duplicate function when overriding resolvers ([#9980](https://github.com/aws-amplify/amplify-cli/issues/9980)) ([94398f8](https://github.com/aws-amplify/amplify-cli/commit/94398f88eca979a2e0806954e12272e126966a51))





## [0.16.3](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.16.2...@aws-amplify/graphql-transformer-core@0.16.3) (2022-03-23)


### Bug Fixes

* **graphql:** avoid static datastructures in gql transform ([#10006](https://github.com/aws-amplify/amplify-cli/issues/10006)) ([cd73fdd](https://github.com/aws-amplify/amplify-cli/commit/cd73fdde69f1545683e81684c4f9267145b845c6))





## [0.16.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.16.1...@aws-amplify/graphql-transformer-core@0.16.2) (2022-02-25)


### Bug Fixes

* **graphql-auth-transformer:** fix relational map key schema lookup when using LSI ([#9722](https://github.com/aws-amplify/amplify-cli/issues/9722)) ([1794cda](https://github.com/aws-amplify/amplify-cli/commit/1794cda7658d9d7596b372c2a78b3f753d7d6aaf))





## [0.16.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.16.0...@aws-amplify/graphql-transformer-core@0.16.1) (2022-02-15)

**Note:** Version bump only for package @aws-amplify/graphql-transformer-core





# [0.16.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.15.7...@aws-amplify/graphql-transformer-core@0.16.0) (2022-01-31)


### Features

* `[@maps](https://github.com/maps)To` directive to enable renaming models while retaining data ([#9340](https://github.com/aws-amplify/amplify-cli/issues/9340)) ([aedf45d](https://github.com/aws-amplify/amplify-cli/commit/aedf45d9237812d71bb8b56164efe0222ad3d534))





## [0.15.7](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.15.6...@aws-amplify/graphql-transformer-core@0.15.7) (2022-01-27)

**Note:** Version bump only for package @aws-amplify/graphql-transformer-core





## [0.15.6](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.15.5...@aws-amplify/graphql-transformer-core@0.15.6) (2022-01-20)


### Bug Fixes

* remove functionName from transform-host lambdas ([#9491](https://github.com/aws-amplify/amplify-cli/issues/9491)) ([959d6d8](https://github.com/aws-amplify/amplify-cli/commit/959d6d85056c672b3281794163a7bc534340a513))





## [0.15.5](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.15.4...@aws-amplify/graphql-transformer-core@0.15.5) (2022-01-13)


### Bug Fixes

* clean up missing and unused GraphQL v2 dependencies ([#9486](https://github.com/aws-amplify/amplify-cli/issues/9486)) ([a6ca44e](https://github.com/aws-amplify/amplify-cli/commit/a6ca44e6ea0ec0a70b648e399fc3e849ccc2a7c9))
* use StackMapping for V2 resolvers ([#9238](https://github.com/aws-amplify/amplify-cli/issues/9238)) ([d354e78](https://github.com/aws-amplify/amplify-cli/commit/d354e78dd1e253d9572da3b08a4d8883e2fe673e))





## [0.15.4](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.15.2...@aws-amplify/graphql-transformer-core@0.15.4) (2022-01-10)



## 7.6.7 (2022-01-10)

**Note:** Version bump only for package @aws-amplify/graphql-transformer-core





## [0.15.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.15.1...@aws-amplify/graphql-transformer-core@0.15.2) (2021-12-21)


### Bug Fixes

* **graphql-model-transformer:** [@aws](https://github.com/aws)_lambda GQL transformer pass through directive list ([#9231](https://github.com/aws-amplify/amplify-cli/issues/9231)) ([25f0c9d](https://github.com/aws-amplify/amplify-cli/commit/25f0c9d6d8735bd7f44a70de52b462826aabd8ed))
* predictions lambda access policy type ([#9058](https://github.com/aws-amplify/amplify-cli/issues/9058)) ([ef93353](https://github.com/aws-amplify/amplify-cli/commit/ef93353f0d26b2182dba061cd2507b32a2d54572))





## [0.15.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.15.0...@aws-amplify/graphql-transformer-core@0.15.1) (2021-12-17)


### Bug Fixes

* update gql v2 custom transformer loading logic ([#9252](https://github.com/aws-amplify/amplify-cli/issues/9252)) ([f728b4b](https://github.com/aws-amplify/amplify-cli/commit/f728b4bb835674afd32dab7243dd3d826601d333))





# [0.15.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.14.0...@aws-amplify/graphql-transformer-core@0.15.0) (2021-12-03)


### Bug Fixes

* skip truncating unresolved tokens ([#9152](https://github.com/aws-amplify/amplify-cli/issues/9152)) ([f83ac70](https://github.com/aws-amplify/amplify-cli/commit/f83ac70753a4564a2b458584fd2176274771b4fb))


### Features

* provide helpful error message when GQL schema validation fails ([#9159](https://github.com/aws-amplify/amplify-cli/issues/9159)) ([308706c](https://github.com/aws-amplify/amplify-cli/commit/308706c8a67712d7625f11a625e258101790d4c7))





# [0.14.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.13.2...@aws-amplify/graphql-transformer-core@0.14.0) (2021-11-23)


### Features

* override support for api category ([#9013](https://github.com/aws-amplify/amplify-cli/issues/9013)) ([ae7b001](https://github.com/aws-amplify/amplify-cli/commit/ae7b001f274f327a29c99c67fe851272c6208e84)), closes [#9001](https://github.com/aws-amplify/amplify-cli/issues/9001) [#8954](https://github.com/aws-amplify/amplify-cli/issues/8954) [#8958](https://github.com/aws-amplify/amplify-cli/issues/8958) [#8960](https://github.com/aws-amplify/amplify-cli/issues/8960) [#8967](https://github.com/aws-amplify/amplify-cli/issues/8967) [#8971](https://github.com/aws-amplify/amplify-cli/issues/8971) [#8976](https://github.com/aws-amplify/amplify-cli/issues/8976) [#8975](https://github.com/aws-amplify/amplify-cli/issues/8975) [#8981](https://github.com/aws-amplify/amplify-cli/issues/8981) [#8983](https://github.com/aws-amplify/amplify-cli/issues/8983) [#8992](https://github.com/aws-amplify/amplify-cli/issues/8992) [#9000](https://github.com/aws-amplify/amplify-cli/issues/9000) [#9002](https://github.com/aws-amplify/amplify-cli/issues/9002) [#9005](https://github.com/aws-amplify/amplify-cli/issues/9005) [#9006](https://github.com/aws-amplify/amplify-cli/issues/9006) [#9007](https://github.com/aws-amplify/amplify-cli/issues/9007) [#9008](https://github.com/aws-amplify/amplify-cli/issues/9008) [#9010](https://github.com/aws-amplify/amplify-cli/issues/9010) [#9011](https://github.com/aws-amplify/amplify-cli/issues/9011) [#9012](https://github.com/aws-amplify/amplify-cli/issues/9012) [#9014](https://github.com/aws-amplify/amplify-cli/issues/9014) [#9015](https://github.com/aws-amplify/amplify-cli/issues/9015) [#9017](https://github.com/aws-amplify/amplify-cli/issues/9017) [#9020](https://github.com/aws-amplify/amplify-cli/issues/9020) [#9024](https://github.com/aws-amplify/amplify-cli/issues/9024) [#9027](https://github.com/aws-amplify/amplify-cli/issues/9027) [#9028](https://github.com/aws-amplify/amplify-cli/issues/9028) [#9029](https://github.com/aws-amplify/amplify-cli/issues/9029) [#9032](https://github.com/aws-amplify/amplify-cli/issues/9032) [#9031](https://github.com/aws-amplify/amplify-cli/issues/9031) [#9035](https://github.com/aws-amplify/amplify-cli/issues/9035) [#9038](https://github.com/aws-amplify/amplify-cli/issues/9038) [#9039](https://github.com/aws-amplify/amplify-cli/issues/9039)





## [0.13.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.13.1...@aws-amplify/graphql-transformer-core@0.13.2) (2021-11-21)


### Bug Fixes

* group response and request resolvers by slot ([#8980](https://github.com/aws-amplify/amplify-cli/issues/8980)) ([74cbcc3](https://github.com/aws-amplify/amplify-cli/commit/74cbcc3799201eea4b68c26f4e44ad6bee6704ad))





## [0.13.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.13.0...@aws-amplify/graphql-transformer-core@0.13.1) (2021-11-19)


### Bug Fixes

* **graphql-default-value-transformer:** support for [@default](https://github.com/default) directive for required fields ([#8906](https://github.com/aws-amplify/amplify-cli/issues/8906)) ([dc0179d](https://github.com/aws-amplify/amplify-cli/commit/dc0179d69433db0f838d21ebc849b595f4c60c82))





# [0.13.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.12.1...@aws-amplify/graphql-transformer-core@0.13.0) (2021-11-17)


### Bug Fixes

* append apiKey if global auth is enabled and its not default auth ([#8843](https://github.com/aws-amplify/amplify-cli/issues/8843)) ([3aadcde](https://github.com/aws-amplify/amplify-cli/commit/3aadcde2225f0ede5c5d94c2a4cd9d1afece5288))
* **graphql-transformer-core:** remove the allow_public_global directive references ([#8751](https://github.com/aws-amplify/amplify-cli/issues/8751)) ([2eab995](https://github.com/aws-amplify/amplify-cli/commit/2eab995e0a46508437faa618e5974f7f87e117b1))
* passing ddb params from root to nested model stacks ([#8766](https://github.com/aws-amplify/amplify-cli/issues/8766)) ([7124cc0](https://github.com/aws-amplify/amplify-cli/commit/7124cc0c8df9fa3261b51141184c0c635bdff738))


### Features

* **graphql-transformer-core:** add support for user defined slots ([#8758](https://github.com/aws-amplify/amplify-cli/issues/8758)) ([87b532d](https://github.com/aws-amplify/amplify-cli/commit/87b532da226c4a3cab619fee115e8b7fd0476d71))





## [0.12.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.10.0...@aws-amplify/graphql-transformer-core@0.12.1) (2021-11-15)

**Note:** Version bump only for package @aws-amplify/graphql-transformer-core





# [0.10.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.9.2...@aws-amplify/graphql-transformer-core@0.10.0) (2021-11-11)


### Bug Fixes

* **amplify-category-api:** change auth directive type and fix codegen bug ([#8639](https://github.com/aws-amplify/amplify-cli/issues/8639)) ([b8d838d](https://github.com/aws-amplify/amplify-cli/commit/b8d838ddfd332c0f6fb36ef52ab76da24b5d26ca))
* datastore logical id ([#8761](https://github.com/aws-amplify/amplify-cli/issues/8761)) ([e86cbb9](https://github.com/aws-amplify/amplify-cli/commit/e86cbb9ebfb7ed22607ffd82f15a6b58a6ec7b3d))
* **graphql-model-transformer:** override resource logical id to fix v1 to v2 transformer migration ([#8597](https://github.com/aws-amplify/amplify-cli/issues/8597)) ([e3a2afb](https://github.com/aws-amplify/amplify-cli/commit/e3a2afbbed6e97f143fc7c83064e2193f4c91bdd))
* move [@model](https://github.com/model) params to root stack and fix ds logical id ([#8736](https://github.com/aws-amplify/amplify-cli/issues/8736)) ([df4408c](https://github.com/aws-amplify/amplify-cli/commit/df4408c4080949ddd638778df9ae20e763dd5824))
* override http datasource logical IDs ([#8714](https://github.com/aws-amplify/amplify-cli/issues/8714)) ([81cc461](https://github.com/aws-amplify/amplify-cli/commit/81cc461ed5e02b2f296825283993ad026f1126d1))
* override none,DDB,lambda datasource logical IDs ([#8723](https://github.com/aws-amplify/amplify-cli/issues/8723)) ([c534dc4](https://github.com/aws-amplify/amplify-cli/commit/c534dc46704cf2a1264e98d8af9b7a199c1419eb))
* revert none data source logical id override ([#8734](https://github.com/aws-amplify/amplify-cli/issues/8734)) ([c83507b](https://github.com/aws-amplify/amplify-cli/commit/c83507b1efee3c8252ea2c2dd7c4d3d40b20fd8a))
* sub "_" with hash in resource logical ID in transformer v2 ([#8600](https://github.com/aws-amplify/amplify-cli/issues/8600)) ([6bb620b](https://github.com/aws-amplify/amplify-cli/commit/6bb620bf1506749987ab0c7eead46bdcc3a7905a))


### Features

* **amplify-provider-awscloudformation:** change sandbox mode syntax in schema ([#8592](https://github.com/aws-amplify/amplify-cli/issues/8592)) ([a3bdd44](https://github.com/aws-amplify/amplify-cli/commit/a3bdd44fddd3414a39d561510092084a1b8e6e61))





## [0.9.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.9.1...@aws-amplify/graphql-transformer-core@0.9.2) (2021-10-10)

**Note:** Version bump only for package @aws-amplify/graphql-transformer-core





## [0.9.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.9.0...@aws-amplify/graphql-transformer-core@0.9.1) (2021-09-27)


### Bug Fixes

* **graphql-model-transformer:** [@model](https://github.com/model) conflict resolution ([#8035](https://github.com/aws-amplify/amplify-cli/issues/8035)) ([f3bdc4a](https://github.com/aws-amplify/amplify-cli/commit/f3bdc4ac1fcf596f634d9d2e968785e76f7b138c))
* **graphql-model-transformer:** iam role name does not exceed 64 characters ([#8244](https://github.com/aws-amplify/amplify-cli/issues/8244)) ([812a671](https://github.com/aws-amplify/amplify-cli/commit/812a67163d6dd33160bf7ace9afd538c83a7af1a))
* **graphql-transformer-core:** add default api name when generating stack ([#8201](https://github.com/aws-amplify/amplify-cli/issues/8201)) ([fe52f9b](https://github.com/aws-amplify/amplify-cli/commit/fe52f9b44900888b30f8ce5c88286b197e9cd3af))





# [0.9.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.8.2...@aws-amplify/graphql-transformer-core@0.9.0) (2021-09-02)


### Features

* add new relational modeling directives ([#7997](https://github.com/aws-amplify/amplify-cli/issues/7997)) ([e9cdb7a](https://github.com/aws-amplify/amplify-cli/commit/e9cdb7a1a45b8f16546952a469ab2d45f82e855c))





## [0.8.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.8.1...@aws-amplify/graphql-transformer-core@0.8.2) (2021-08-24)

**Note:** Version bump only for package @aws-amplify/graphql-transformer-core





## [0.8.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.8.0...@aws-amplify/graphql-transformer-core@0.8.1) (2021-08-06)

**Note:** Version bump only for package @aws-amplify/graphql-transformer-core





# [0.8.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.7.2...@aws-amplify/graphql-transformer-core@0.8.0) (2021-07-30)


### Features

* capability injection for the vNext GraphQL Transformer ([#7735](https://github.com/aws-amplify/amplify-cli/issues/7735)) ([f3eae13](https://github.com/aws-amplify/amplify-cli/commit/f3eae13ab2848df398e26429abf985b756abcff2))





## [0.7.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.7.1...@aws-amplify/graphql-transformer-core@0.7.2) (2021-07-27)

**Note:** Version bump only for package @aws-amplify/graphql-transformer-core





## [0.7.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.7.0...@aws-amplify/graphql-transformer-core@0.7.1) (2021-07-16)

**Note:** Version bump only for package @aws-amplify/graphql-transformer-core





# [0.7.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.6.3...@aws-amplify/graphql-transformer-core@0.7.0) (2021-07-12)


### Features

* port [@predictions](https://github.com/predictions) to GraphQL Transformer v2 ([#7387](https://github.com/aws-amplify/amplify-cli/issues/7387)) ([3f2e647](https://github.com/aws-amplify/amplify-cli/commit/3f2e647b9dfe14aa5919b46f53342937dd0c7fa9))





## [0.6.3](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.6.2...@aws-amplify/graphql-transformer-core@0.6.3) (2021-06-30)


### Bug Fixes

* correct featuer typo in gql transformer v2 ([#7584](https://github.com/aws-amplify/amplify-cli/issues/7584)) ([81659ee](https://github.com/aws-amplify/amplify-cli/commit/81659ee2399025307cc1aa05252a712623a95818))





## [0.6.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.6.1...@aws-amplify/graphql-transformer-core@0.6.2) (2021-06-24)


### Bug Fixes

* **graphql-transformer-common:** improve generated graphql pluralization ([#7258](https://github.com/aws-amplify/amplify-cli/issues/7258)) ([fc3ad0d](https://github.com/aws-amplify/amplify-cli/commit/fc3ad0dd5a12a7912c59ae12024f593b4cdf7f2d)), closes [#4224](https://github.com/aws-amplify/amplify-cli/issues/4224)





## [0.6.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.6.0...@aws-amplify/graphql-transformer-core@0.6.1) (2021-05-26)

**Note:** Version bump only for package @aws-amplify/graphql-transformer-core





# [0.6.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.5.0...@aws-amplify/graphql-transformer-core@0.6.0) (2021-05-18)


### Features

* port [@searchable](https://github.com/searchable) to GraphQL Transformer v2 ([#7291](https://github.com/aws-amplify/amplify-cli/issues/7291)) ([37a2df2](https://github.com/aws-amplify/amplify-cli/commit/37a2df2365fe4bf0eddf285a159221e34f695fe2))





# [0.5.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.3.4...@aws-amplify/graphql-transformer-core@0.5.0) (2021-05-03)



## 4.50.1 (2021-05-03)


### Features

* port [@http](https://github.com/http) to GraphQL Transformer v2 ([#7139](https://github.com/aws-amplify/amplify-cli/issues/7139)) ([2803605](https://github.com/aws-amplify/amplify-cli/commit/28036059229666c70ab8d8f7ff6b4d966f6acae8))
* **graphql-function-transformer:** port [@function](https://github.com/function) to v2 ([#7055](https://github.com/aws-amplify/amplify-cli/issues/7055)) ([463e975](https://github.com/aws-amplify/amplify-cli/commit/463e97593d5486d1f9d10bcabde26d3e36dee7f2))





# [0.4.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.3.4...@aws-amplify/graphql-transformer-core@0.4.0) (2021-05-03)


### Features

* port [@http](https://github.com/http) to GraphQL Transformer v2 ([#7139](https://github.com/aws-amplify/amplify-cli/issues/7139)) ([2803605](https://github.com/aws-amplify/amplify-cli/commit/28036059229666c70ab8d8f7ff6b4d966f6acae8))
* **graphql-function-transformer:** port [@function](https://github.com/function) to v2 ([#7055](https://github.com/aws-amplify/amplify-cli/issues/7055)) ([463e975](https://github.com/aws-amplify/amplify-cli/commit/463e97593d5486d1f9d10bcabde26d3e36dee7f2))





## [0.3.4](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.3.3...@aws-amplify/graphql-transformer-core@0.3.4) (2021-03-05)

**Note:** Version bump only for package @aws-amplify/graphql-transformer-core





## [0.3.3](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.3.2...@aws-amplify/graphql-transformer-core@0.3.3) (2021-02-26)

**Note:** Version bump only for package @aws-amplify/graphql-transformer-core





## [0.3.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.3.1...@aws-amplify/graphql-transformer-core@0.3.2) (2021-02-11)

**Note:** Version bump only for package @aws-amplify/graphql-transformer-core





## [0.3.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.3.0...@aws-amplify/graphql-transformer-core@0.3.1) (2021-02-10)

**Note:** Version bump only for package @aws-amplify/graphql-transformer-core





# [0.3.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.2.1...@aws-amplify/graphql-transformer-core@0.3.0) (2020-12-11)


### Features

* container-based deployments([#5727](https://github.com/aws-amplify/amplify-cli/issues/5727)) ([fad6377](https://github.com/aws-amplify/amplify-cli/commit/fad6377bd384862ca4429cb1a83eee90efd62b58))





## [0.2.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-core@0.1.0...@aws-amplify/graphql-transformer-core@0.2.1) (2020-11-22)

**Note:** Version bump only for package @aws-amplify/graphql-transformer-core





# 0.2.0 (2020-11-22)


### Features

* transformer redesign ([#5534](https://github.com/aws-amplify/amplify-cli/issues/5534)) ([a93c685](https://github.com/aws-amplify/amplify-cli/commit/a93c6852f6588898ebc52b0574f4fcc3d2e87948))





# 0.1.0 (2020-11-08)


### Features

* transformer redesign ([#5534](https://github.com/aws-amplify/amplify-cli/issues/5534)) ([a93c685](https://github.com/aws-amplify/amplify-cli/commit/a93c6852f6588898ebc52b0574f4fcc3d2e87948))





## [6.21.2](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@6.21.1...graphql-transformer-core@6.21.2) (2020-08-14)

**Note:** Version bump only for package graphql-transformer-core





## [6.21.1](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@6.21.0...graphql-transformer-core@6.21.1) (2020-08-11)


### Bug Fixes

* lambda resolver CFN syntax ([#5037](https://github.com/aws-amplify/amplify-cli/issues/5037)) ([79e7374](https://github.com/aws-amplify/amplify-cli/commit/79e7374e940f6a80b7dfaf317b890204ad53b2f1))





# [6.21.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@6.19.5...graphql-transformer-core@6.21.0) (2020-07-29)


### Features

* headless mode for API category ([#4834](https://github.com/aws-amplify/amplify-cli/issues/4834)) ([c2e09d7](https://github.com/aws-amplify/amplify-cli/commit/c2e09d73fd1bb461eeace8f4a7addd70a63047ad))





# [6.20.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@6.19.5...graphql-transformer-core@6.20.0) (2020-07-23)


### Features

* headless mode for API category ([#4834](https://github.com/aws-amplify/amplify-cli/issues/4834)) ([b729266](https://github.com/aws-amplify/amplify-cli/commit/b729266b9bb519738ef88125784d72ac428f47e1))





## [6.19.5](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@6.19.4...graphql-transformer-core@6.19.5) (2020-07-18)

**Note:** Version bump only for package graphql-transformer-core





## [6.19.4](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@6.19.3...graphql-transformer-core@6.19.4) (2020-07-15)

**Note:** Version bump only for package graphql-transformer-core





## [6.19.3](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@6.19.2...graphql-transformer-core@6.19.3) (2020-06-25)


### Reverts

* Revert "fix: change scope of hashed files for AppSync (#4602)" ([73aaab1](https://github.com/aws-amplify/amplify-cli/commit/73aaab1a7b1f8b2de5fa22fa1ef9aeea7de35cb4)), closes [#4602](https://github.com/aws-amplify/amplify-cli/issues/4602)





## [6.19.2](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@6.19.1...graphql-transformer-core@6.19.2) (2020-06-18)


### Bug Fixes

* change scope of hashed files for AppSync ([#4602](https://github.com/aws-amplify/amplify-cli/issues/4602)) ([10fa9da](https://github.com/aws-amplify/amplify-cli/commit/10fa9da646f4de755e2dc92cd4bb2a6319425d72)), closes [#4458](https://github.com/aws-amplify/amplify-cli/issues/4458)
* occurred spelling mistake ([#4595](https://github.com/aws-amplify/amplify-cli/issues/4595)) ([eaf08e0](https://github.com/aws-amplify/amplify-cli/commit/eaf08e00841830e9654fea61ce901f2cb478eebe))


### Performance Improvements

* optimize appsync file upload and bucket exist check ([#4533](https://github.com/aws-amplify/amplify-cli/issues/4533)) ([f45d32b](https://github.com/aws-amplify/amplify-cli/commit/f45d32bc0805f498a6171b2fd3455445863d9c04))





## [6.19.1](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@6.19.0...graphql-transformer-core@6.19.1) (2020-06-11)


### Reverts

* add query automatically for named keys ([#4513](https://github.com/aws-amplify/amplify-cli/issues/4513)) ([6d3123b](https://github.com/aws-amplify/amplify-cli/commit/6d3123bfe3ba412d3b1af076e550e6733c988c8f))





# [6.19.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@6.18.2...graphql-transformer-core@6.19.0) (2020-06-10)


### Features

* **graphql-key-transformer:** add query automatically for named keys ([#4458](https://github.com/aws-amplify/amplify-cli/issues/4458)) ([3d194f8](https://github.com/aws-amplify/amplify-cli/commit/3d194f805dcbd6325ddf78155c4327dbca3e7f4a))





## [6.18.2](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@6.18.1...graphql-transformer-core@6.18.2) (2020-06-02)

**Note:** Version bump only for package graphql-transformer-core





## [6.18.1](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@6.18.0...graphql-transformer-core@6.18.1) (2020-05-26)


### Bug Fixes

* **graphql-elasticsearch-transformer:** support del in sync enabled API ([#4281](https://github.com/aws-amplify/amplify-cli/issues/4281)) ([f57f824](https://github.com/aws-amplify/amplify-cli/commit/f57f8242f18c79d48b751e29952e3cdd21409f98)), closes [#4228](https://github.com/aws-amplify/amplify-cli/issues/4228) [#4228](https://github.com/aws-amplify/amplify-cli/issues/4228)





# [6.18.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@6.17.1...graphql-transformer-core@6.18.0) (2020-05-15)


### Features

* support for overriding pipeline function templates in transformer ([#4196](https://github.com/aws-amplify/amplify-cli/issues/4196)) ([e1830ae](https://github.com/aws-amplify/amplify-cli/commit/e1830aeb31fef8f035cb0a992a150d37f78e07bb)), closes [#4192](https://github.com/aws-amplify/amplify-cli/issues/4192)





## [6.17.1](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@6.17.0...graphql-transformer-core@6.17.1) (2020-05-08)


### Bug Fixes

* [#3438](https://github.com/aws-amplify/amplify-cli/issues/3438), many-to-many with conflict resolution generated wrong schema ([#4171](https://github.com/aws-amplify/amplify-cli/issues/4171)) ([9e8606c](https://github.com/aws-amplify/amplify-cli/commit/9e8606c4a300b5690839ec0869f7384aff189b1f))
* use ES external versioning when using DataStore ([#4127](https://github.com/aws-amplify/amplify-cli/issues/4127)) ([cef709b](https://github.com/aws-amplify/amplify-cli/commit/cef709ba2087affe860dd6fb141ccda1e5d58fd1))





# [6.17.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@6.16.1...graphql-transformer-core@6.17.0) (2020-04-23)


### Features

* **amplify-category-api:** allow minified CF stack templates ([#3520](https://github.com/aws-amplify/amplify-cli/issues/3520)) ([6da2a63](https://github.com/aws-amplify/amplify-cli/commit/6da2a634548fdf48deb4b1144c67d1e1515abb80)), closes [#2914](https://github.com/aws-amplify/amplify-cli/issues/2914)





## [6.16.1](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@6.16.0...graphql-transformer-core@6.16.1) (2020-03-22)


### Bug Fixes

* **graphql-elasticsearch-transformer:** fix duplicate records in es lambda ([#3712](https://github.com/aws-amplify/amplify-cli/issues/3712)) ([dd9f7e0](https://github.com/aws-amplify/amplify-cli/commit/dd9f7e0031a0dc68a9027de02f60bbe69d315c3d)), closes [#3602](https://github.com/aws-amplify/amplify-cli/issues/3602) [#3705](https://github.com/aws-amplify/amplify-cli/issues/3705)





# [6.16.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@6.13.3...graphql-transformer-core@6.16.0) (2020-03-07)


### Bug Fixes

* **graphql-auth-transformer:** add list support for ownerField in subs ([#3166](https://github.com/aws-amplify/amplify-cli/issues/3166)) ([8d68277](https://github.com/aws-amplify/amplify-cli/commit/8d6827752ebd076424d3c76122b136eca65b02a8))


### Features

* **graphql-transformer-core:** allow user overrides for functions ([#3367](https://github.com/aws-amplify/amplify-cli/issues/3367)) ([787128f](https://github.com/aws-amplify/amplify-cli/commit/787128f2fe2b66150cfae0712bdf86745949f85e)), closes [#3359](https://github.com/aws-amplify/amplify-cli/issues/3359)


### Reverts

* Revert "fix(graphql-auth-transformer): add list support for ownerField in subs (#3166)" (#3572) ([d693e6b](https://github.com/aws-amplify/amplify-cli/commit/d693e6b2819a5d20188fa9f68d94ef955e474bd3)), closes [#3166](https://github.com/aws-amplify/amplify-cli/issues/3166) [#3572](https://github.com/aws-amplify/amplify-cli/issues/3572)





## [6.14.1](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@6.13.5-beta.0...graphql-transformer-core@6.14.1) (2020-03-05)

**Note:** Version bump only for package graphql-transformer-core





## [6.13.3](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@6.13.2...graphql-transformer-core@6.13.3) (2020-02-13)

**Note:** Version bump only for package graphql-transformer-core





## [6.13.2](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@6.13.1...graphql-transformer-core@6.13.2) (2020-02-07)

**Note:** Version bump only for package graphql-transformer-core





## [6.13.1](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@6.13.0...graphql-transformer-core@6.13.1) (2020-01-24)

**Note:** Version bump only for package graphql-transformer-core





# [6.13.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@5.18.0...graphql-transformer-core@6.13.0) (2020-01-23)

### Bug Fixes

- pass appsync specific directives to model gen ([#3211](https://github.com/aws-amplify/amplify-cli/issues/3211)) ([c9a6ada](https://github.com/aws-amplify/amplify-cli/commit/c9a6ada683a32f2a82ef9fdc4b0cb37ea70ccb11))
- upgrade to node10 as min version for CLI ([#3128](https://github.com/aws-amplify/amplify-cli/issues/3128)) ([a0b18e0](https://github.com/aws-amplify/amplify-cli/commit/a0b18e0187a26b4ab0e6e986b0277f347e829444))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- resolver changes ([#2760](https://github.com/aws-amplify/amplify-cli/issues/2760)) ([8ce0d12](https://github.com/aws-amplify/amplify-cli/commit/8ce0d12eb1d3bd6d0132baca39b6e9daff04c39a))
- **graphql-elasticsearch-transformer:** support sets in es fn ([#2986](https://github.com/aws-amplify/amplify-cli/issues/2986)) ([16419f4](https://github.com/aws-amplify/amplify-cli/commit/16419f4d9e1733ed0ada064f9ced604083ee4703)), closes [#2860](https://github.com/aws-amplify/amplify-cli/issues/2860)

# [6.12.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@5.18.0...graphql-transformer-core@6.12.0) (2020-01-09)

### Bug Fixes

- upgrade to node10 as min version for CLI ([#3128](https://github.com/aws-amplify/amplify-cli/issues/3128)) ([a0b18e0](https://github.com/aws-amplify/amplify-cli/commit/a0b18e0187a26b4ab0e6e986b0277f347e829444))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- resolver changes ([#2760](https://github.com/aws-amplify/amplify-cli/issues/2760)) ([8ce0d12](https://github.com/aws-amplify/amplify-cli/commit/8ce0d12eb1d3bd6d0132baca39b6e9daff04c39a))
- **graphql-elasticsearch-transformer:** support sets in es fn ([#2986](https://github.com/aws-amplify/amplify-cli/issues/2986)) ([16419f4](https://github.com/aws-amplify/amplify-cli/commit/16419f4d9e1733ed0ada064f9ced604083ee4703)), closes [#2860](https://github.com/aws-amplify/amplify-cli/issues/2860)

# [6.11.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@5.18.0...graphql-transformer-core@6.11.0) (2019-12-31)

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- resolver changes ([#2760](https://github.com/aws-amplify/amplify-cli/issues/2760)) ([8ce0d12](https://github.com/aws-amplify/amplify-cli/commit/8ce0d12eb1d3bd6d0132baca39b6e9daff04c39a))

# [6.10.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@5.18.0...graphql-transformer-core@6.10.0) (2019-12-28)

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- resolver changes ([#2760](https://github.com/aws-amplify/amplify-cli/issues/2760)) ([8ce0d12](https://github.com/aws-amplify/amplify-cli/commit/8ce0d12eb1d3bd6d0132baca39b6e9daff04c39a))

# [6.9.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@5.18.0...graphql-transformer-core@6.9.0) (2019-12-26)

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- resolver changes ([#2760](https://github.com/aws-amplify/amplify-cli/issues/2760)) ([8ce0d12](https://github.com/aws-amplify/amplify-cli/commit/8ce0d12eb1d3bd6d0132baca39b6e9daff04c39a))

# [6.8.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@5.18.0...graphql-transformer-core@6.8.0) (2019-12-25)

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- resolver changes ([#2760](https://github.com/aws-amplify/amplify-cli/issues/2760)) ([8ce0d12](https://github.com/aws-amplify/amplify-cli/commit/8ce0d12eb1d3bd6d0132baca39b6e9daff04c39a))

# [6.7.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@5.18.0...graphql-transformer-core@6.7.0) (2019-12-20)

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- resolver changes ([#2760](https://github.com/aws-amplify/amplify-cli/issues/2760)) ([8ce0d12](https://github.com/aws-amplify/amplify-cli/commit/8ce0d12eb1d3bd6d0132baca39b6e9daff04c39a))

# [6.6.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@5.18.0...graphql-transformer-core@6.6.0) (2019-12-10)

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- resolver changes ([#2760](https://github.com/aws-amplify/amplify-cli/issues/2760)) ([8ce0d12](https://github.com/aws-amplify/amplify-cli/commit/8ce0d12eb1d3bd6d0132baca39b6e9daff04c39a))

# [6.4.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@5.18.0...graphql-transformer-core@6.4.0) (2019-12-03)

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- resolver changes ([#2760](https://github.com/aws-amplify/amplify-cli/issues/2760)) ([8ce0d12](https://github.com/aws-amplify/amplify-cli/commit/8ce0d12eb1d3bd6d0132baca39b6e9daff04c39a))

# [6.3.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@5.18.0...graphql-transformer-core@6.3.0) (2019-12-01)

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- resolver changes ([#2760](https://github.com/aws-amplify/amplify-cli/issues/2760)) ([8ce0d12](https://github.com/aws-amplify/amplify-cli/commit/8ce0d12eb1d3bd6d0132baca39b6e9daff04c39a))

# [6.2.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@5.18.0...graphql-transformer-core@6.2.0) (2019-11-27)

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- resolver changes ([#2760](https://github.com/aws-amplify/amplify-cli/issues/2760)) ([8ce0d12](https://github.com/aws-amplify/amplify-cli/commit/8ce0d12eb1d3bd6d0132baca39b6e9daff04c39a))

# [6.1.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@5.18.0...graphql-transformer-core@6.1.0) (2019-11-27)

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- resolver changes ([#2760](https://github.com/aws-amplify/amplify-cli/issues/2760)) ([8ce0d12](https://github.com/aws-amplify/amplify-cli/commit/8ce0d12eb1d3bd6d0132baca39b6e9daff04c39a))

# [5.0.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.7.5...graphql-transformer-core@5.0.0) (2019-08-30)

### Bug Fixes

- [#1715](https://github.com/aws-amplify/amplify-cli/issues/1715) - Fix stack enumeration so transform.conf.json will be generated ([#2114](https://github.com/aws-amplify/amplify-cli/issues/2114)) ([d1b266b](https://github.com/aws-amplify/amplify-cli/commit/d1b266b))

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
- sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))

* Adding Auth on Subscriptions (#2068) ([81c630d](https://github.com/aws-amplify/amplify-cli/commit/81c630d)), closes [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068)

### BREAKING CHANGES

- If an owner is used in the auth directive it will either be a requirement if it's
  the only rule or an optional input if used with other rules
- If an owner is included in the auth directive it will either be a requirement if
  it's the only rule or an optional input if used with other rules
- the subscription operations will require an argument if owner is the only auth rule
- Subscriptions will require an argument if an owner is only rule set - If owner &
  group rules are owner will be an optional arg

# [4.0.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.7.5...graphql-transformer-core@4.0.0) (2019-08-28)

### Bug Fixes

- [#1715](https://github.com/aws-amplify/amplify-cli/issues/1715) - Fix stack enumeration so transform.conf.json will be generated ([#2114](https://github.com/aws-amplify/amplify-cli/issues/2114)) ([d1b266b](https://github.com/aws-amplify/amplify-cli/commit/d1b266b))

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
- sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))

* Adding Auth on Subscriptions (#2068) ([81c630d](https://github.com/aws-amplify/amplify-cli/commit/81c630d)), closes [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068)

### BREAKING CHANGES

- If an owner is used in the auth directive it will either be a requirement if it's
  the only rule or an optional input if used with other rules
- If an owner is included in the auth directive it will either be a requirement if
  it's the only rule or an optional input if used with other rules
- the subscription operations will require an argument if owner is the only auth rule
- Subscriptions will require an argument if an owner is only rule set - If owner &
  group rules are owner will be an optional arg

# [3.11.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.7.5...graphql-transformer-core@3.11.0) (2019-08-13)

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
- sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))

# [3.10.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.7.5...graphql-transformer-core@3.10.0) (2019-08-07)

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
- sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))

# [3.9.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.7.5...graphql-transformer-core@3.9.0) (2019-08-02)

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))

# [3.8.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.7.5...graphql-transformer-core@3.8.0) (2019-07-31)

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))

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

- feature/[@key](https://github.com/key) ([#1463](https://github.com/aws-amplify/amplify-cli/issues/1463)) ([00ed819](https://github.com/aws-amplify/amplify-cli/commit/00ed819))

## [3.6.3](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.6.2...graphql-transformer-core@3.6.3) (2019-05-21)

**Note:** Version bump only for package graphql-transformer-core

## [3.6.2](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.6.1...graphql-transformer-core@3.6.2) (2019-05-17)

**Note:** Version bump only for package graphql-transformer-core

## [3.6.1](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.6.0...graphql-transformer-core@3.6.1) (2019-05-07)

**Note:** Version bump only for package graphql-transformer-core

# [3.6.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.5.1...graphql-transformer-core@3.6.0) (2019-04-16)

### Features

- **field-level-auth:** Add field level auth support via the [@auth](https://github.com/auth) directive ([#1262](https://github.com/aws-amplify/amplify-cli/issues/1262)) ([3b1c600](https://github.com/aws-amplify/amplify-cli/commit/3b1c600)), closes [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)

## [3.5.1](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.4.0...graphql-transformer-core@3.5.1) (2019-04-09)

**Note:** Version bump only for package graphql-transformer-core

# [3.4.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.0.9...graphql-transformer-core@3.4.0) (2019-04-03)

### Features

- **graphql-elasticsearch-transformer:** map output to stack ([b7a8f6d](https://github.com/aws-amplify/amplify-cli/commit/b7a8f6d)), closes [#1047](https://github.com/aws-amplify/amplify-cli/issues/1047)
- **graphql-elasticsearch-transformer:** test output to stack map ([cf8b0be](https://github.com/aws-amplify/amplify-cli/commit/cf8b0be)), closes [#1047](https://github.com/aws-amplify/amplify-cli/issues/1047)

## [3.0.9](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.0.8...graphql-transformer-core@3.0.9) (2019-03-22)

**Note:** Version bump only for package graphql-transformer-core

## [3.0.8](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.0.7...graphql-transformer-core@3.0.8) (2019-03-05)

### Bug Fixes

- ignore file starting with a dot when compiling configs ([#905](https://github.com/aws-amplify/amplify-cli/issues/905)) ([f094160](https://github.com/aws-amplify/amplify-cli/commit/f094160))

## [3.0.7](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.0.6...graphql-transformer-core@3.0.7) (2019-02-20)

**Note:** Version bump only for package graphql-transformer-core

## [3.0.6](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.0.5...graphql-transformer-core@3.0.6) (2019-02-12)

### Bug Fixes

- cloudform/type versions ([ec6f99f](https://github.com/aws-amplify/amplify-cli/commit/ec6f99f))

## [3.0.5](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.0.3-beta.0...graphql-transformer-core@3.0.5) (2019-02-11)

**Note:** Version bump only for package graphql-transformer-core

## [3.0.3](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.0.3-beta.0...graphql-transformer-core@3.0.3) (2019-02-11)

**Note:** Version bump only for package graphql-transformer-core

## [3.0.3-beta.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@3.0.2...graphql-transformer-core@3.0.3-beta.0) (2019-02-11)

**Note:** Version bump only for package graphql-transformer-core

<a name="2.0.1-multienv.0"></a>

## [2.0.1-multienv.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.33...graphql-transformer-core@2.0.1-multienv.0) (2018-12-31)

### Bug Fixes

- update grahql transformer package versions for multienv ([8b4b2bd](https://github.com/aws-amplify/amplify-cli/commit/8b4b2bd))

<a name="1.0.33"></a>

## [1.0.33](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.33-beta.0...graphql-transformer-core@1.0.33) (2018-11-09)

**Note:** Version bump only for package graphql-transformer-core

<a name="1.0.33-beta.0"></a>

## [1.0.33-beta.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.12...graphql-transformer-core@1.0.33-beta.0) (2018-11-09)

### Bug Fixes

- **graphql-transformer-core:** Fix Readme.md docs for the `[@auth](https://github.com/auth)` directive ([db6ff7a](https://github.com/aws-amplify/amplify-cli/commit/db6ff7a))

<a name="1.0.32"></a>

## [1.0.32](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.32-beta.0...graphql-transformer-core@1.0.32) (2018-11-05)

**Note:** Version bump only for package graphql-transformer-core

<a name="1.0.32-beta.0"></a>

## [1.0.32-beta.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.12...graphql-transformer-core@1.0.32-beta.0) (2018-11-05)

### Bug Fixes

- **graphql-transformer-core:** Fix Readme.md docs for the `[@auth](https://github.com/auth)` directive ([db6ff7a](https://github.com/aws-amplify/amplify-cli/commit/db6ff7a))

<a name="1.0.31"></a>

## [1.0.31](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.12...graphql-transformer-core@1.0.31) (2018-11-02)

### Bug Fixes

- **graphql-transformer-core:** Fix Readme.md docs for the `[@auth](https://github.com/auth)` directive ([db6ff7a](https://github.com/aws-amplify/amplify-cli/commit/db6ff7a))

<a name="1.0.30"></a>

## [1.0.30](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.30-beta.0...graphql-transformer-core@1.0.30) (2018-11-02)

**Note:** Version bump only for package graphql-transformer-core

<a name="1.0.30-beta.0"></a>

## [1.0.30-beta.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.12...graphql-transformer-core@1.0.30-beta.0) (2018-11-02)

### Bug Fixes

- **graphql-transformer-core:** Fix Readme.md docs for the `[@auth](https://github.com/auth)` directive ([db6ff7a](https://github.com/aws-amplify/amplify-cli/commit/db6ff7a))

<a name="1.0.29"></a>

## [1.0.29](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.29-beta.0...graphql-transformer-core@1.0.29) (2018-10-23)

**Note:** Version bump only for package graphql-transformer-core

<a name="1.0.29-beta.0"></a>

## [1.0.29-beta.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.12...graphql-transformer-core@1.0.29-beta.0) (2018-10-23)

### Bug Fixes

- **graphql-transformer-core:** Fix Readme.md docs for the `[@auth](https://github.com/auth)` directive ([db6ff7a](https://github.com/aws-amplify/amplify-cli/commit/db6ff7a))

<a name="1.0.28"></a>

## [1.0.28](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.28-beta.0...graphql-transformer-core@1.0.28) (2018-10-18)

**Note:** Version bump only for package graphql-transformer-core

<a name="1.0.28-beta.0"></a>

## [1.0.28-beta.0](https://github.com/aws-amplify/amplify-cli/compare/graphql-transformer-core@1.0.12...graphql-transformer-core@1.0.28-beta.0) (2018-10-12)

### Bug Fixes

- **graphql-transformer-core:** Fix Readme.md docs for the `[@auth](https://github.com/auth)` directive ([db6ff7a](https://github.com/aws-amplify/amplify-cli/commit/db6ff7a))

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
