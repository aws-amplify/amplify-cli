# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.6.4](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-relational-transformer@0.6.2...@aws-amplify/graphql-relational-transformer@0.6.4) (2021-11-19)

**Note:** Version bump only for package @aws-amplify/graphql-relational-transformer





## [0.6.3](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-relational-transformer@0.6.2...@aws-amplify/graphql-relational-transformer@0.6.3) (2021-11-19)

**Note:** Version bump only for package @aws-amplify/graphql-relational-transformer





## [0.6.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-relational-transformer@0.6.1...@aws-amplify/graphql-relational-transformer@0.6.2) (2021-11-17)


### Bug Fixes

* **graphql-relational-transformer:** fixes belongs to relation field name ([#8865](https://github.com/aws-amplify/amplify-cli/issues/8865)) ([068b03b](https://github.com/aws-amplify/amplify-cli/commit/068b03bd4c78c840c74557b05f5d109c2c300210))
* reintroduce connection stack in transformer v2 ([#8757](https://github.com/aws-amplify/amplify-cli/issues/8757)) ([81ffeeb](https://github.com/aws-amplify/amplify-cli/commit/81ffeeb7fecfbad1200e45291cb8052be025f761))





## [0.6.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-relational-transformer@0.4.0...@aws-amplify/graphql-relational-transformer@0.6.1) (2021-11-15)

**Note:** Version bump only for package @aws-amplify/graphql-relational-transformer





# [0.4.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-relational-transformer@0.3.1...@aws-amplify/graphql-relational-transformer@0.4.0) (2021-11-11)


### Bug Fixes

* [@auth](https://github.com/auth) fix relational auth, authv2 e2e with utils and fixes ([#8450](https://github.com/aws-amplify/amplify-cli/issues/8450)) ([aa320cd](https://github.com/aws-amplify/amplify-cli/commit/aa320cd2414665a484438f0764cf68fd78caa26a))
* add [@manytomany](https://github.com/manytomany) join table auth ([#8460](https://github.com/aws-amplify/amplify-cli/issues/8460)) ([424bbda](https://github.com/aws-amplify/amplify-cli/commit/424bbda410fbab100d475d37fa9ab291bfd05317))
* allow duplicate auth rules when creating the join type ([#8680](https://github.com/aws-amplify/amplify-cli/issues/8680)) ([1a0636d](https://github.com/aws-amplify/amplify-cli/commit/1a0636d72d010b9d0ed18d511f853bcbffa9d421))
* **graphql-model-transformer:** override resource logical id to fix v1 to v2 transformer migration ([#8597](https://github.com/aws-amplify/amplify-cli/issues/8597)) ([e3a2afb](https://github.com/aws-amplify/amplify-cli/commit/e3a2afbbed6e97f143fc7c83064e2193f4c91bdd))
* **graphql-relational-schema-transformer:** has-many transformer update filter/condition inputs ([#8565](https://github.com/aws-amplify/amplify-cli/issues/8565)) ([9f5570b](https://github.com/aws-amplify/amplify-cli/commit/9f5570b6095ba57f2f3e514279a2f13f041e2b38))
* **graphql-relational-transformer:** fix belongs to e2e test ([#8738](https://github.com/aws-amplify/amplify-cli/issues/8738)) ([233ed56](https://github.com/aws-amplify/amplify-cli/commit/233ed56d2fc74020321816c53555cb04b23b9d6a))
* **graphql-relational-transformer:** fix has many without fields ([#8700](https://github.com/aws-amplify/amplify-cli/issues/8700)) ([cc21d4d](https://github.com/aws-amplify/amplify-cli/commit/cc21d4dcf827a9ef27a89dffe828f3726a03ecea))
* **graphql-relational-transformer:** fixed has one and belongs to relationship ([#8679](https://github.com/aws-amplify/amplify-cli/issues/8679)) ([8a390fb](https://github.com/aws-amplify/amplify-cli/commit/8a390fba8a34002abb94d28702db2dde088811d9))
* reuse foreign key field in `[@belongs](https://github.com/belongs)To` transformer ([#8557](https://github.com/aws-amplify/amplify-cli/issues/8557)) ([39fbe6f](https://github.com/aws-amplify/amplify-cli/commit/39fbe6f61687a0ffbaff5914069f64a69c23e0d6))
* use output when looking up relational related type index ([#8657](https://github.com/aws-amplify/amplify-cli/issues/8657)) ([1f5dd5c](https://github.com/aws-amplify/amplify-cli/commit/1f5dd5ce2eeb3b91a13c7e2bd9e3ffbfcab0c3fe))


### Features

* add admin roles which have admin control over a graphql api ([#8601](https://github.com/aws-amplify/amplify-cli/issues/8601)) ([4d50df0](https://github.com/aws-amplify/amplify-cli/commit/4d50df000c6e11165d2da766c0eaa0097d88a0c2))
* generate list types as non-null ([#8166](https://github.com/aws-amplify/amplify-cli/issues/8166)) ([93786c1](https://github.com/aws-amplify/amplify-cli/commit/93786c13ef04c72748ca32a1ef7878c0e6b5b129))





## [0.3.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-relational-transformer@0.3.0...@aws-amplify/graphql-relational-transformer@0.3.1) (2021-10-10)

**Note:** Version bump only for package @aws-amplify/graphql-relational-transformer





# [0.3.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-relational-transformer@0.2.1...@aws-amplify/graphql-relational-transformer@0.3.0) (2021-09-27)


### Features

* add [@many](https://github.com/many)ToMany directive ([#8195](https://github.com/aws-amplify/amplify-cli/issues/8195)) ([cc644eb](https://github.com/aws-amplify/amplify-cli/commit/cc644ebc4968f29ad6b3f0b42013d7ee6a142f7e))





## [0.2.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-relational-transformer@0.2.0...@aws-amplify/graphql-relational-transformer@0.2.1) (2021-09-14)

**Note:** Version bump only for package @aws-amplify/graphql-relational-transformer





# 0.2.0 (2021-09-02)


### Features

* add new relational modeling directives ([#7997](https://github.com/aws-amplify/amplify-cli/issues/7997)) ([e9cdb7a](https://github.com/aws-amplify/amplify-cli/commit/e9cdb7a1a45b8f16546952a469ab2d45f82e855c))
