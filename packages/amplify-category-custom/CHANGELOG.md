# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.3.2-apiext1.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/amplify-category-custom@2.3.1...@aws-amplify/amplify-category-custom@2.3.2-apiext1.0) (2021-11-19)

**Note:** Version bump only for package @aws-amplify/amplify-category-custom





## [2.3.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/amplify-category-custom@2.3.0...@aws-amplify/amplify-category-custom@2.3.1) (2021-11-17)

**Note:** Version bump only for package @aws-amplify/amplify-category-custom





# 2.3.0 (2021-11-15)



# 7.3.0 (2021-11-15)


### Bug Fixes

* add alphanumeric validation on custom resource-name ([#8798](https://github.com/aws-amplify/amplify-cli/issues/8798)) ([77e05e2](https://github.com/aws-amplify/amplify-cli/commit/77e05e273805e5f23376ce886d21ac268af760d2))
* add npmignore to custom resource package and update archiver ([#8596](https://github.com/aws-amplify/amplify-cli/issues/8596)) ([a2c32fd](https://github.com/aws-amplify/amplify-cli/commit/a2c32fd92a72bdd4e14926f98e6a88ca195de59e))
* build resources on pull even with no override flag passed + update skeleton package.json ([#8771](https://github.com/aws-amplify/amplify-cli/issues/8771)) ([d13b83e](https://github.com/aws-amplify/amplify-cli/commit/d13b83ee8531724ae417548927043bfa970e71d4))
* ensure FF on stack transform, revert revert ([#8810](https://github.com/aws-amplify/amplify-cli/issues/8810)) ([868952f](https://github.com/aws-amplify/amplify-cli/commit/868952f9552f09aeb2b0b8e036c59954ee3391e0)), closes [#8796](https://github.com/aws-amplify/amplify-cli/issues/8796) [#8799](https://github.com/aws-amplify/amplify-cli/issues/8799)
* generate dynamic amplify resource types before building cdk code ([#8778](https://github.com/aws-amplify/amplify-cli/issues/8778)) ([9b9f624](https://github.com/aws-amplify/amplify-cli/commit/9b9f624f9bb65e7b9ceafb93767424abf2cd387f))
* glob fix for auth trigger template ([#8819](https://github.com/aws-amplify/amplify-cli/issues/8819)) ([26a1085](https://github.com/aws-amplify/amplify-cli/commit/26a10852b69ac50a6faafb0ad7ab74012d57e315))
* modify update custom flow + update cdk skeleton sample ([#8859](https://github.com/aws-amplify/amplify-cli/issues/8859)) ([87811fc](https://github.com/aws-amplify/amplify-cli/commit/87811fc8b1914d4bf58669d541fbea8c457a71a5))
* remove depending on conditional output variables from stacks ([#8719](https://github.com/aws-amplify/amplify-cli/issues/8719)) ([ac63a64](https://github.com/aws-amplify/amplify-cli/commit/ac63a6431582999ebf32de3440eb995974e8703e))
* update custom cdk seleton templates + format override skeleton file ([#8752](https://github.com/aws-amplify/amplify-cli/issues/8752)) ([bef17fb](https://github.com/aws-amplify/amplify-cli/commit/bef17fb349110a693e0310506b706dfda2a3580b))


### Features

* consolidate dependent resource types in backend/ ([#8709](https://github.com/aws-amplify/amplify-cli/issues/8709)) ([3d556d7](https://github.com/aws-amplify/amplify-cli/commit/3d556d7b6fea9700f98f42629cb1de2dec5e9ba5))
* define custom resources with CDK or CFN ([#8590](https://github.com/aws-amplify/amplify-cli/issues/8590)) ([e835584](https://github.com/aws-amplify/amplify-cli/commit/e835584ee8d21a2e4b2480264581de22371cbdba))
* exclude amplify/backend/awscloudformation from gitignore path ([#8794](https://github.com/aws-amplify/amplify-cli/issues/8794)) ([18d202f](https://github.com/aws-amplify/amplify-cli/commit/18d202f504b76cca2854293984bdd9fb5743efaa))





# 2.0.0 (2021-11-13)


### Bug Fixes

* add alphanumeric validation on custom resource-name ([#8798](https://github.com/aws-amplify/amplify-cli/issues/8798)) ([77e05e2](https://github.com/aws-amplify/amplify-cli/commit/77e05e273805e5f23376ce886d21ac268af760d2))
* add npmignore to custom resource package and update archiver ([#8596](https://github.com/aws-amplify/amplify-cli/issues/8596)) ([a2c32fd](https://github.com/aws-amplify/amplify-cli/commit/a2c32fd92a72bdd4e14926f98e6a88ca195de59e))
* build resources on pull even with no override flag passed + update skeleton package.json ([#8771](https://github.com/aws-amplify/amplify-cli/issues/8771)) ([d13b83e](https://github.com/aws-amplify/amplify-cli/commit/d13b83ee8531724ae417548927043bfa970e71d4))
* ensure FF on stack transform, revert revert ([#8810](https://github.com/aws-amplify/amplify-cli/issues/8810)) ([868952f](https://github.com/aws-amplify/amplify-cli/commit/868952f9552f09aeb2b0b8e036c59954ee3391e0)), closes [#8796](https://github.com/aws-amplify/amplify-cli/issues/8796) [#8799](https://github.com/aws-amplify/amplify-cli/issues/8799)
* generate dynamic amplify resource types before building cdk code ([#8778](https://github.com/aws-amplify/amplify-cli/issues/8778)) ([9b9f624](https://github.com/aws-amplify/amplify-cli/commit/9b9f624f9bb65e7b9ceafb93767424abf2cd387f))
* glob fix for auth trigger template ([#8819](https://github.com/aws-amplify/amplify-cli/issues/8819)) ([26a1085](https://github.com/aws-amplify/amplify-cli/commit/26a10852b69ac50a6faafb0ad7ab74012d57e315))
* remove depending on conditional output variables from stacks ([#8719](https://github.com/aws-amplify/amplify-cli/issues/8719)) ([ac63a64](https://github.com/aws-amplify/amplify-cli/commit/ac63a6431582999ebf32de3440eb995974e8703e))
* update custom cdk seleton templates + format override skeleton file ([#8752](https://github.com/aws-amplify/amplify-cli/issues/8752)) ([bef17fb](https://github.com/aws-amplify/amplify-cli/commit/bef17fb349110a693e0310506b706dfda2a3580b))


### Features

* consolidate dependent resource types in backend/ ([#8709](https://github.com/aws-amplify/amplify-cli/issues/8709)) ([3d556d7](https://github.com/aws-amplify/amplify-cli/commit/3d556d7b6fea9700f98f42629cb1de2dec5e9ba5))
* define custom resources with CDK or CFN ([#8590](https://github.com/aws-amplify/amplify-cli/issues/8590)) ([e835584](https://github.com/aws-amplify/amplify-cli/commit/e835584ee8d21a2e4b2480264581de22371cbdba))
* exclude amplify/backend/awscloudformation from gitignore path ([#8794](https://github.com/aws-amplify/amplify-cli/issues/8794)) ([18d202f](https://github.com/aws-amplify/amplify-cli/commit/18d202f504b76cca2854293984bdd9fb5743efaa))
