# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.2.7](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-migrator@1.2.6...@aws-amplify/graphql-transformer-migrator@1.2.7) (2021-11-23)


### Bug Fixes

* api migrate command when rest apis are added ([#9054](https://github.com/aws-amplify/amplify-cli/issues/9054)) ([df4d7c6](https://github.com/aws-amplify/amplify-cli/commit/df4d7c66b2d8c337b1fc9fb3d426a99932c0e6dd))
* bail out of gql migration if [@auth](https://github.com/auth) uses queries/mutations ([#9004](https://github.com/aws-amplify/amplify-cli/issues/9004)) ([57a0bd5](https://github.com/aws-amplify/amplify-cli/commit/57a0bd5a64cbb6f889d5bc6d8ee7451ba3638de5))
* **graphql-transformer-migrator:** fixed belongs to type relationshio check ([#9003](https://github.com/aws-amplify/amplify-cli/issues/9003)) ([9ecb90c](https://github.com/aws-amplify/amplify-cli/commit/9ecb90c3be958cfbf81ba4c4be7e9ce6e6c0ee2e))





## [1.2.6](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-migrator@1.2.5...@aws-amplify/graphql-transformer-migrator@1.2.6) (2021-11-21)


### Bug Fixes

* fixed snapshot ([#8987](https://github.com/aws-amplify/amplify-cli/issues/8987)) ([5e889bf](https://github.com/aws-amplify/amplify-cli/commit/5e889bf9df50597aec2168a9d72e0cda076f3d6c))





## [1.2.5](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-migrator@1.2.4...@aws-amplify/graphql-transformer-migrator@1.2.5) (2021-11-20)



## 7.4.4 (2021-11-20)


### Bug Fixes

* **amplify-category-api:** update snapshot ([#8978](https://github.com/aws-amplify/amplify-cli/issues/8978)) ([c4ed3be](https://github.com/aws-amplify/amplify-cli/commit/c4ed3befed36bb97347a19f1decb42dba71aee92))
* **graphql-transformer-migrator:** fix protected rules that come from groups ([#8972](https://github.com/aws-amplify/amplify-cli/issues/8972)) ([dc567e9](https://github.com/aws-amplify/amplify-cli/commit/dc567e9afe8aab901a000162148099d1553d37c5))





## [1.2.4](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-migrator@1.2.2...@aws-amplify/graphql-transformer-migrator@1.2.4) (2021-11-19)


### Bug Fixes

* **graphql-transformer-migrator:** migrate owners and group based auth correctly ([#8940](https://github.com/aws-amplify/amplify-cli/issues/8940)) ([f276a42](https://github.com/aws-amplify/amplify-cli/commit/f276a42a0e8eafe1dbeaed0d2af4b915b132ae31))



## 7.4.2 (2021-11-19)


### Bug Fixes

* **graphql-transformer-migrator:** disables field level hoisting of auth ([#8946](https://github.com/aws-amplify/amplify-cli/issues/8946)) ([a21118a](https://github.com/aws-amplify/amplify-cli/commit/a21118ae7f45dd4938b6731d1e388f2c6107e7d7))
* passthrough group auth rule config ([#8928](https://github.com/aws-amplify/amplify-cli/issues/8928)) ([eb6a0f5](https://github.com/aws-amplify/amplify-cli/commit/eb6a0f52c3b499db8070dad7796a8ea4de099e09))





## [1.2.3](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-migrator@1.2.2...@aws-amplify/graphql-transformer-migrator@1.2.3) (2021-11-19)


### Bug Fixes

* passthrough group auth rule config ([#8928](https://github.com/aws-amplify/amplify-cli/issues/8928)) ([eb6a0f5](https://github.com/aws-amplify/amplify-cli/commit/eb6a0f52c3b499db8070dad7796a8ea4de099e09))





## [1.2.2](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-migrator@1.2.1...@aws-amplify/graphql-transformer-migrator@1.2.2) (2021-11-17)

**Note:** Version bump only for package @aws-amplify/graphql-transformer-migrator





## [1.2.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-migrator@0.2.0...@aws-amplify/graphql-transformer-migrator@1.2.1) (2021-11-15)

**Note:** Version bump only for package @aws-amplify/graphql-transformer-migrator





# [1.0.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/graphql-transformer-migrator@0.2.0...@aws-amplify/graphql-transformer-migrator@1.0.0) (2021-11-13)

**Note:** Version bump only for package @aws-amplify/graphql-transformer-migrator





# 0.2.0 (2021-11-11)


### Bug Fixes

* don't migrate AppSync auth related directives ([#8661](https://github.com/aws-amplify/amplify-cli/issues/8661)) ([903c7bf](https://github.com/aws-amplify/amplify-cli/commit/903c7bf85e0e96275267a28700364436dcaaa712))
* exit migration if improvePluralization is false ([#8670](https://github.com/aws-amplify/amplify-cli/issues/8670)) ([cead88d](https://github.com/aws-amplify/amplify-cli/commit/cead88db132a50827ade3e08fc01ca68b5f11282))
* gracefully exit on deprecated [@connection](https://github.com/connection) parameterization ([#8640](https://github.com/aws-amplify/amplify-cli/issues/8640)) ([4045f3a](https://github.com/aws-amplify/amplify-cli/commit/4045f3ab4aa1f3782c5a4ff5d7a1af7bd48fd00d))
* schema migrator utility as separate command ([#8720](https://github.com/aws-amplify/amplify-cli/issues/8720)) ([46e1ee6](https://github.com/aws-amplify/amplify-cli/commit/46e1ee6a49dd86bb682b182a37626bc3f2f966ea))


### Features

* Activate graphql migrator behind feature flag ([5a76b3a](https://github.com/aws-amplify/amplify-cli/commit/5a76b3a320012c09d2ff2f424283fafba74fa74d))
