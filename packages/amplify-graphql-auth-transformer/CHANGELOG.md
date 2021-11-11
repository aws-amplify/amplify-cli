# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
