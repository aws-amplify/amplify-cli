# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.7.11](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-auth-transformer@0.7.10...@aws-amplify/graphql-auth-transformer@0.7.11) (2022-04-07)

**Note:** Version bump only for package @aws-amplify/graphql-auth-transformer





## [0.7.10](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-auth-transformer@0.7.9...@aws-amplify/graphql-auth-transformer@0.7.10) (2022-03-23)

**Note:** Version bump only for package @aws-amplify/graphql-auth-transformer





## [0.7.9](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-auth-transformer@0.7.8...@aws-amplify/graphql-auth-transformer@0.7.9) (2022-03-17)


### Bug Fixes

* **amplify-category-auth:** expand [@auth](https://github.com/auth) directive to explicit set of allowed operations ([#9859](https://github.com/aws-amplify/amplify-cli/issues/9859)) ([e44ed18](https://github.com/aws-amplify/amplify-cli/commit/e44ed189b2c94230cbd5674606ffa488cb6c7bfe))





## [0.7.8](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-auth-transformer@0.7.7...@aws-amplify/graphql-auth-transformer@0.7.8) (2022-03-07)

**Note:** Version bump only for package @aws-amplify/graphql-auth-transformer





## [0.7.7](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-auth-transformer@0.7.6...@aws-amplify/graphql-auth-transformer@0.7.7) (2022-02-25)



## 7.6.22 (2022-02-24)


### Bug Fixes

* **graphql-auth-transformer:** fix relational map key schema lookup when using LSI ([#9722](https://github.com/aws-amplify/amplify-cli/issues/9722)) ([1794cda](https://github.com/aws-amplify/amplify-cli/commit/1794cda7658d9d7596b372c2a78b3f753d7d6aaf))
* **graphql-auth-transformer:** update resolver should allow if update operation is set ([#9808](https://github.com/aws-amplify/amplify-cli/issues/9808)) ([44a9bea](https://github.com/aws-amplify/amplify-cli/commit/44a9bea139a9a1483cfbc7db29b84938510ffdca))





## [0.7.6](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-auth-transformer@0.7.5...@aws-amplify/graphql-auth-transformer@0.7.6) (2022-02-15)

**Note:** Version bump only for package @aws-amplify/graphql-auth-transformer





## [0.7.5](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-auth-transformer@0.7.1...@aws-amplify/graphql-auth-transformer@0.7.5) (2022-02-10)



## 7.6.19 (2022-02-08)


### Bug Fixes

* **graphql:** allow iam private rule to access update mutation when authenticated by cognito ([#9682](https://github.com/aws-amplify/amplify-cli/issues/9682)) ([acd995f](https://github.com/aws-amplify/amplify-cli/commit/acd995f12c67e625997794d5bb5d394e227f83c7))





## [0.7.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-auth-transformer@0.7.0...@aws-amplify/graphql-auth-transformer@0.7.1) (2022-02-03)


### Bug Fixes

* separate field level subscription errors and field level resolver generation ([#9671](https://github.com/aws-amplify/amplify-cli/issues/9671)) ([657c344](https://github.com/aws-amplify/amplify-cli/commit/657c344633d4a72d322008f23a29f78df5a8a55a))





# [0.7.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-auth-transformer@0.5.12...@aws-amplify/graphql-auth-transformer@0.7.0) (2022-01-31)



## 7.6.14 (2022-01-28)


### Features

* `[@maps](https://github.com/maps)To` directive to enable renaming models while retaining data ([#9340](https://github.com/aws-amplify/amplify-cli/issues/9340)) ([aedf45d](https://github.com/aws-amplify/amplify-cli/commit/aedf45d9237812d71bb8b56164efe0222ad3d534))





## [0.5.12](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-auth-transformer@0.5.11...@aws-amplify/graphql-auth-transformer@0.5.12) (2022-01-27)

**Note:** Version bump only for package @aws-amplify/graphql-auth-transformer





## [0.5.11](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-auth-transformer@0.5.10...@aws-amplify/graphql-auth-transformer@0.5.11) (2022-01-23)


### Bug Fixes

* listX operations with no args where authField is used in primaryKey ([#9570](https://github.com/aws-amplify/amplify-cli/issues/9570)) ([1496724](https://github.com/aws-amplify/amplify-cli/commit/1496724495010f2daec8b160e35e613ca34eaa5e))





## [0.5.10](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-auth-transformer@0.5.9...@aws-amplify/graphql-auth-transformer@0.5.10) (2022-01-20)



## 7.6.11 (2022-01-20)


### Reverts

* Revert "fix(graphql-auth-transformer): fix key condition expression (#9264)" (#9566) ([1d15762](https://github.com/aws-amplify/amplify-cli/commit/1d1576228fd1ed131b8447f21a146b3ffeee1d2b)), closes [#9264](https://github.com/aws-amplify/amplify-cli/issues/9264) [#9566](https://github.com/aws-amplify/amplify-cli/issues/9566)





## [0.5.9](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-auth-transformer@0.5.8...@aws-amplify/graphql-auth-transformer@0.5.9) (2022-01-20)


### Bug Fixes

* parse dynamic groups custom claim to list ([#9466](https://github.com/aws-amplify/amplify-cli/issues/9466)) ([80d692b](https://github.com/aws-amplify/amplify-cli/commit/80d692bfb38f0efde2d6d32b63b1c60ad4148849))





## [0.5.8](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-auth-transformer@0.5.7...@aws-amplify/graphql-auth-transformer@0.5.8) (2022-01-13)


### Bug Fixes

* clean up missing and unused GraphQL v2 dependencies ([#9486](https://github.com/aws-amplify/amplify-cli/issues/9486)) ([a6ca44e](https://github.com/aws-amplify/amplify-cli/commit/a6ca44e6ea0ec0a70b648e399fc3e849ccc2a7c9))
* dynamic group auth VTL error ([#9463](https://github.com/aws-amplify/amplify-cli/issues/9463)) ([e64124f](https://github.com/aws-amplify/amplify-cli/commit/e64124f8f846e65b0c1a198ed63167e15a08445c))
* **graphql:** modify fields match logic for hasOne directive when using auth directive ([#9459](https://github.com/aws-amplify/amplify-cli/issues/9459)) ([a924892](https://github.com/aws-amplify/amplify-cli/commit/a92489298625d46255263d50bbceb074eb6d2269))
* use optional field access for subscriptions.level ([#9213](https://github.com/aws-amplify/amplify-cli/issues/9213)) ([8cbd507](https://github.com/aws-amplify/amplify-cli/commit/8cbd507357b93e856fc2d5a3f455bc340b507333))





## [0.5.7](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-auth-transformer@0.5.5...@aws-amplify/graphql-auth-transformer@0.5.7) (2022-01-10)



## 7.6.7 (2022-01-10)


### Bug Fixes

* return field value for admin roles on field resolver fixes issue [#9242](https://github.com/aws-amplify/amplify-cli/issues/9242) ([#9275](https://github.com/aws-amplify/amplify-cli/issues/9275)) ([dbef299](https://github.com/aws-amplify/amplify-cli/commit/dbef2992e53b65789d1ab51a0d342a0671f9661f))





## [0.5.5](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-auth-transformer@0.5.4...@aws-amplify/graphql-auth-transformer@0.5.5) (2021-12-21)


### Bug Fixes

* **graphql-auth-transformer:** fix key condition expression ([#9264](https://github.com/aws-amplify/amplify-cli/issues/9264)) ([5794692](https://github.com/aws-amplify/amplify-cli/commit/5794692a05c16f23d903321644fe37a4913861e0))





## [0.5.4](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-auth-transformer@0.5.3...@aws-amplify/graphql-auth-transformer@0.5.4) (2021-12-17)

**Note:** Version bump only for package @aws-amplify/graphql-auth-transformer





## [0.5.3](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-auth-transformer@0.5.2...@aws-amplify/graphql-auth-transformer@0.5.3) (2021-12-03)

**Note:** Version bump only for package @aws-amplify/graphql-auth-transformer





## [0.5.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-auth-transformer@0.5.1...@aws-amplify/graphql-auth-transformer@0.5.2) (2021-12-01)


### Bug Fixes

* **graphql-auth-transformer:** fix datastore fields auth ([#9135](https://github.com/aws-amplify/amplify-cli/issues/9135)) ([cb9fdd3](https://github.com/aws-amplify/amplify-cli/commit/cb9fdd30c5212e36149d942f929d77601c75b8e7))





## [0.5.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-auth-transformer@0.5.0...@aws-amplify/graphql-auth-transformer@0.5.1) (2021-11-26)


### Bug Fixes

* remove extra $ in vtl template ([#9077](https://github.com/aws-amplify/amplify-cli/issues/9077)) ([3dc4dc4](https://github.com/aws-amplify/amplify-cli/commit/3dc4dc49ce1698683251dacd85fd4433ead1688f))





# [0.5.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-auth-transformer@0.4.6...@aws-amplify/graphql-auth-transformer@0.5.0) (2021-11-23)


### Bug Fixes

* update admin role check to make sure the name is not authRole or unauthRole ([#9046](https://github.com/aws-amplify/amplify-cli/issues/9046)) ([27fb223](https://github.com/aws-amplify/amplify-cli/commit/27fb223c73da79fe5a2bd72ed8b3bd44d8b04960))
* use not equals for iam role check ([#9048](https://github.com/aws-amplify/amplify-cli/issues/9048)) ([352763c](https://github.com/aws-amplify/amplify-cli/commit/352763ceae03444ba9b0697c25af3cf6957e536c))


### Features

* override support for api category ([#9013](https://github.com/aws-amplify/amplify-cli/issues/9013)) ([ae7b001](https://github.com/aws-amplify/amplify-cli/commit/ae7b001f274f327a29c99c67fe851272c6208e84)), closes [#9001](https://github.com/aws-amplify/amplify-cli/issues/9001) [#8954](https://github.com/aws-amplify/amplify-cli/issues/8954) [#8958](https://github.com/aws-amplify/amplify-cli/issues/8958) [#8960](https://github.com/aws-amplify/amplify-cli/issues/8960) [#8967](https://github.com/aws-amplify/amplify-cli/issues/8967) [#8971](https://github.com/aws-amplify/amplify-cli/issues/8971) [#8976](https://github.com/aws-amplify/amplify-cli/issues/8976) [#8975](https://github.com/aws-amplify/amplify-cli/issues/8975) [#8981](https://github.com/aws-amplify/amplify-cli/issues/8981) [#8983](https://github.com/aws-amplify/amplify-cli/issues/8983) [#8992](https://github.com/aws-amplify/amplify-cli/issues/8992) [#9000](https://github.com/aws-amplify/amplify-cli/issues/9000) [#9002](https://github.com/aws-amplify/amplify-cli/issues/9002) [#9005](https://github.com/aws-amplify/amplify-cli/issues/9005) [#9006](https://github.com/aws-amplify/amplify-cli/issues/9006) [#9007](https://github.com/aws-amplify/amplify-cli/issues/9007) [#9008](https://github.com/aws-amplify/amplify-cli/issues/9008) [#9010](https://github.com/aws-amplify/amplify-cli/issues/9010) [#9011](https://github.com/aws-amplify/amplify-cli/issues/9011) [#9012](https://github.com/aws-amplify/amplify-cli/issues/9012) [#9014](https://github.com/aws-amplify/amplify-cli/issues/9014) [#9015](https://github.com/aws-amplify/amplify-cli/issues/9015) [#9017](https://github.com/aws-amplify/amplify-cli/issues/9017) [#9020](https://github.com/aws-amplify/amplify-cli/issues/9020) [#9024](https://github.com/aws-amplify/amplify-cli/issues/9024) [#9027](https://github.com/aws-amplify/amplify-cli/issues/9027) [#9028](https://github.com/aws-amplify/amplify-cli/issues/9028) [#9029](https://github.com/aws-amplify/amplify-cli/issues/9029) [#9032](https://github.com/aws-amplify/amplify-cli/issues/9032) [#9031](https://github.com/aws-amplify/amplify-cli/issues/9031) [#9035](https://github.com/aws-amplify/amplify-cli/issues/9035) [#9038](https://github.com/aws-amplify/amplify-cli/issues/9038) [#9039](https://github.com/aws-amplify/amplify-cli/issues/9039)





## [0.4.6](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-auth-transformer@0.4.5...@aws-amplify/graphql-auth-transformer@0.4.6) (2021-11-21)

**Note:** Version bump only for package @aws-amplify/graphql-auth-transformer





## [0.4.5](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-auth-transformer@0.4.4...@aws-amplify/graphql-auth-transformer@0.4.5) (2021-11-20)


### Bug Fixes

* update field auth check logic and error message to account for subscription level ([#8951](https://github.com/aws-amplify/amplify-cli/issues/8951)) ([acfefd4](https://github.com/aws-amplify/amplify-cli/commit/acfefd4b957d534b6d2031df22c56237d43d0261))





## [0.4.4](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-auth-transformer@0.4.2...@aws-amplify/graphql-auth-transformer@0.4.4) (2021-11-19)

**Note:** Version bump only for package @aws-amplify/graphql-auth-transformer





## [0.4.3](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-auth-transformer@0.4.2...@aws-amplify/graphql-auth-transformer@0.4.3) (2021-11-19)

**Note:** Version bump only for package @aws-amplify/graphql-auth-transformer





## [0.4.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-auth-transformer@0.4.1...@aws-amplify/graphql-auth-transformer@0.4.2) (2021-11-17)


### Bug Fixes

* append apiKey if global auth is enabled and its not default auth ([#8843](https://github.com/aws-amplify/amplify-cli/issues/8843)) ([3aadcde](https://github.com/aws-amplify/amplify-cli/commit/3aadcde2225f0ede5c5d94c2a4cd9d1afece5288))
* update error message for auth on non null fields ([#8863](https://github.com/aws-amplify/amplify-cli/issues/8863)) ([bffb4d2](https://github.com/aws-amplify/amplify-cli/commit/bffb4d290e33dfd4362733c4344dd1a7e584234c))





## [0.4.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-auth-transformer@0.2.0...@aws-amplify/graphql-auth-transformer@0.4.1) (2021-11-15)

**Note:** Version bump only for package @aws-amplify/graphql-auth-transformer





# 0.2.0 (2021-11-11)


### Bug Fixes

* [@auth](https://github.com/auth) fix relational auth, authv2 e2e with utils and fixes ([#8450](https://github.com/aws-amplify/amplify-cli/issues/8450)) ([aa320cd](https://github.com/aws-amplify/amplify-cli/commit/aa320cd2414665a484438f0764cf68fd78caa26a))
* [@function](https://github.com/function) vNext payload, remove unused code, and update common mapping tempalte function ([#8462](https://github.com/aws-amplify/amplify-cli/issues/8462)) ([24d0de9](https://github.com/aws-amplify/amplify-cli/commit/24d0de97a1bfacc3983e5b11a7582c9500759adc))
* add [@manytomany](https://github.com/manytomany) join table auth ([#8460](https://github.com/aws-amplify/amplify-cli/issues/8460)) ([424bbda](https://github.com/aws-amplify/amplify-cli/commit/424bbda410fbab100d475d37fa9ab291bfd05317))
* add field auth on aggregation queries ([#8508](https://github.com/aws-amplify/amplify-cli/issues/8508)) ([c0fa85a](https://github.com/aws-amplify/amplify-cli/commit/c0fa85a87230d631ffaf376f18f4fc3c4ec9a1f9))
* add schema directives for sync operation when conflict resolution is enabled ([#8521](https://github.com/aws-amplify/amplify-cli/issues/8521)) ([e3299e5](https://github.com/aws-amplify/amplify-cli/commit/e3299e5c09884218d486d4a488f343972674a417))
* allow duplicate auth rules when creating the join type ([#8680](https://github.com/aws-amplify/amplify-cli/issues/8680)) ([1a0636d](https://github.com/aws-amplify/amplify-cli/commit/1a0636d72d010b9d0ed18d511f853bcbffa9d421))
* auth on getting related model name and searchablevNext e2e ([#8455](https://github.com/aws-amplify/amplify-cli/issues/8455)) ([8536dd3](https://github.com/aws-amplify/amplify-cli/commit/8536dd3eb4cffc14602d80eea82b8b62b8227485))
* auth vnext validation fixes ([#8551](https://github.com/aws-amplify/amplify-cli/issues/8551)) ([2cfe6ce](https://github.com/aws-amplify/amplify-cli/commit/2cfe6ce15e9adb1e5824e3d011deb9e4d5cf5d4d))
* fix null check for implied owner check ([#8586](https://github.com/aws-amplify/amplify-cli/issues/8586)) ([4a0fda8](https://github.com/aws-amplify/amplify-cli/commit/4a0fda81472ec82d6731502bbe83a9ffd0b27198))
* **graphql-model-transformer:** override resource logical id to fix v1 to v2 transformer migration ([#8597](https://github.com/aws-amplify/amplify-cli/issues/8597)) ([e3a2afb](https://github.com/aws-amplify/amplify-cli/commit/e3a2afbbed6e97f143fc7c83064e2193f4c91bdd))
* searchable fix and migration e2e tests ([#8666](https://github.com/aws-amplify/amplify-cli/issues/8666)) ([d5f9397](https://github.com/aws-amplify/amplify-cli/commit/d5f9397fa860f32e748f6f880929b1e5856a68e2))
* update auth vnext validation to use private for oidc ([#8606](https://github.com/aws-amplify/amplify-cli/issues/8606)) ([8e659a1](https://github.com/aws-amplify/amplify-cli/commit/8e659a1357df63d5cae92b67f719ffeea9acacf0))


### Features

* add admin roles which have admin control over a graphql api ([#8601](https://github.com/aws-amplify/amplify-cli/issues/8601)) ([4d50df0](https://github.com/aws-amplify/amplify-cli/commit/4d50df000c6e11165d2da766c0eaa0097d88a0c2))
* allow optional idp arg into auth to allow provided auth role or authenticated identity ([#8609](https://github.com/aws-amplify/amplify-cli/issues/8609)) ([bf843b9](https://github.com/aws-amplify/amplify-cli/commit/bf843b90330d8ceb2ea90bc2761edd57e5d5123b))
