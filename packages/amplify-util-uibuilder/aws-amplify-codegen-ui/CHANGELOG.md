# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.13.1](https://github.com/aws-amplify/amplify-codegen-ui/compare/v0.13.0...v0.13.1) (2021-11-26)

**Note:** Version bump only for package @aws-amplify/codegen-ui





# [0.13.0](https://github.com/aws-amplify/amplify-codegen-ui/compare/v0.12.0...v0.13.0) (2021-11-23)

**Note:** Version bump only for package @aws-amplify/codegen-ui





# [0.12.0](https://github.com/aws-amplify/amplify-codegen-ui/compare/v0.10.1...v0.12.0) (2021-11-22)


### Bug Fixes

* fixing typescript version to 4.4.x, since 4.5.2 breaks the imports ([b726682](https://github.com/aws-amplify/amplify-codegen-ui/commit/b726682e56129ade22616682a14f481176851f94))





## [0.11.1](https://github.com/aws-amplify/amplify-codegen-ui/compare/v0.10.1...v0.11.1) (2021-11-19)


### Bug Fixes

* fixing typescript version to 4.4.x, since 4.5.2 breaks the imports ([b726682](https://github.com/aws-amplify/amplify-codegen-ui/commit/b726682e56129ade22616682a14f481176851f94))





# [0.11.0](https://github.com/aws-amplify/amplify-codegen-ui/compare/v0.10.1...v0.11.0) (2021-11-18)


### Bug Fixes

* fixing typescript version to 4.4.x, since 4.5.2 breaks the imports ([25c2dc9](https://github.com/aws-amplify/amplify-codegen-ui/commit/25c2dc970fab06abf7554d7ff69de4b12f65abd0))





## [0.10.1](https://github.com/aws-amplify/amplify-codegen-ui/compare/v0.10.0...v0.10.1) (2021-11-17)


### Bug Fixes

* use static list iconset instead of dynamic from import ([3607d50](https://github.com/aws-amplify/amplify-codegen-ui/commit/3607d50e2436d4e24341e6e5a03e2358ca0ee93b))





# [0.10.0](https://github.com/aws-amplify/amplify-codegen-ui/compare/v0.9.0...v0.10.0) (2021-11-16)

**Note:** Version bump only for package @aws-amplify/codegen-ui





# 0.9.0 (2021-11-15)

### Bug Fixes

- add eslint ignore to address gh style warning ([8ee7c15](https://github.com/aws-amplify/amplify-codegen-ui/commit/8ee7c1502494171044b10efad6e1e536825d64f1))
- adding support for additional component types for string and text types ([53d5537](https://github.com/aws-amplify/amplify-codegen-ui/commit/53d5537f3fd0eca1313d0cd39277ecf297988551))
- collections with name items no longer redeclare the prop name ([#183](https://github.com/aws-amplify/amplify-codegen-ui/issues/183)) ([6ab4cdf](https://github.com/aws-amplify/amplify-codegen-ui/commit/6ab4cdf50b6e7b8962835422663f3152753e8aa3))
- fixing override indice bug, and adding e2e test ([c8500bf](https://github.com/aws-amplify/amplify-codegen-ui/commit/c8500bf06ff9be18715e834cd1f9f43942b9a0ea))
- moving @aws-amplify/ui-react to a devDependency ([1aaa55d](https://github.com/aws-amplify/amplify-codegen-ui/commit/1aaa55d3eee0cd9a272888eada1f283cfc2a93c5))
- only pass props to top level ([#63](https://github.com/aws-amplify/amplify-codegen-ui/issues/63)) ([5e59d9b](https://github.com/aws-amplify/amplify-codegen-ui/commit/5e59d9b861bff6b363a15fa3e6ee7f985ecc53dd)), closes [#58](https://github.com/aws-amplify/amplify-codegen-ui/issues/58)
- react render config ([#45](https://github.com/aws-amplify/amplify-codegen-ui/issues/45)) ([de74357](https://github.com/aws-amplify/amplify-codegen-ui/commit/de74357c2a323b11de1e464e7a47f43414d22409))
- setting license, author, homepage, and repo information ([e253a15](https://github.com/aws-amplify/amplify-codegen-ui/commit/e253a155f36c3451e7bc911225b8757b3dfd8b78))
- **codegen-ui-react:** include babel parser for prettier ([#83](https://github.com/aws-amplify/amplify-codegen-ui/issues/83)) ([e28551c](https://github.com/aws-amplify/amplify-codegen-ui/commit/e28551c96d0b22fd4f4135554291a94f5cfddea0))
- updating override paths to support child indices ([278b6f8](https://github.com/aws-amplify/amplify-codegen-ui/commit/278b6f8ac7486b2d6815d204cd59834238e12712))
- updating unit tests after merge failure, bumping package-locks back to v2 ([1c49ac0](https://github.com/aws-amplify/amplify-codegen-ui/commit/1c49ac0e7f6c73dc7190ebcd4270858b16bbe327))

### Features

- add base action binding support ([#124](https://github.com/aws-amplify/amplify-codegen-ui/issues/124)) ([e6e60c0](https://github.com/aws-amplify/amplify-codegen-ui/commit/e6e60c0394036065991920622bc30caac00dafed))
- add error handler to common entry points, and basic input validation ([84b28c3](https://github.com/aws-amplify/amplify-codegen-ui/commit/84b28c3e8b84caaf575873ef76c9c66779323ab3))
- add output configuration for studio codegen ([#32](https://github.com/aws-amplify/amplify-codegen-ui/issues/32)) ([8cb2de9](https://github.com/aws-amplify/amplify-codegen-ui/commit/8cb2de92fe397d4277ddec05422d4112e917cb78))
- add SliderField primitive ([#213](https://github.com/aws-amplify/amplify-codegen-ui/issues/213)) ([78209e2](https://github.com/aws-amplify/amplify-codegen-ui/commit/78209e25a0ca324e99a5eb14c5e05cfa28df6fd4))
- add support for most existing primitives ([#194](https://github.com/aws-amplify/amplify-codegen-ui/issues/194)) ([f1fe271](https://github.com/aws-amplify/amplify-codegen-ui/commit/f1fe271ff128a8683cd8f06da8aaa0c577a9d1fc))
- adding support for style variants in generated components ([bb41ac5](https://github.com/aws-amplify/amplify-codegen-ui/commit/bb41ac5a836f7b3bfb6aeb72308db362fdec127f))
- output theme file ([#97](https://github.com/aws-amplify/amplify-codegen-ui/issues/97)) ([02508c1](https://github.com/aws-amplify/amplify-codegen-ui/commit/02508c1e8733ccee6a17551fed3b885619d70aa7))
- remove console log ([#76](https://github.com/aws-amplify/amplify-codegen-ui/issues/76)) ([73fac18](https://github.com/aws-amplify/amplify-codegen-ui/commit/73fac1864494929571ca8ece684a9caf9aab9360))
- test-generate each case individually, add support for error cases as well ([46f65cc](https://github.com/aws-amplify/amplify-codegen-ui/commit/46f65ccef5cc748d7c86025c81573c64ed4afa3d))
- update model validator to throw on names and component types with whitespace ([760a826](https://github.com/aws-amplify/amplify-codegen-ui/commit/760a8269cee66252706efec08eb04fba1e0b72ec))

# 0.8.0 (2021-11-12)

### Bug Fixes

- add eslint ignore to address gh style warning ([8ee7c15](https://github.com/aws-amplify/amplify-codegen-ui/commit/8ee7c1502494171044b10efad6e1e536825d64f1))
- adding support for additional component types for string and text types ([53d5537](https://github.com/aws-amplify/amplify-codegen-ui/commit/53d5537f3fd0eca1313d0cd39277ecf297988551))
- collections with name items no longer redeclare the prop name ([#183](https://github.com/aws-amplify/amplify-codegen-ui/issues/183)) ([6ab4cdf](https://github.com/aws-amplify/amplify-codegen-ui/commit/6ab4cdf50b6e7b8962835422663f3152753e8aa3))
- fixing override indice bug, and adding e2e test ([c8500bf](https://github.com/aws-amplify/amplify-codegen-ui/commit/c8500bf06ff9be18715e834cd1f9f43942b9a0ea))
- moving @aws-amplify/ui-react to a devDependency ([1aaa55d](https://github.com/aws-amplify/amplify-codegen-ui/commit/1aaa55d3eee0cd9a272888eada1f283cfc2a93c5))
- only pass props to top level ([#63](https://github.com/aws-amplify/amplify-codegen-ui/issues/63)) ([5e59d9b](https://github.com/aws-amplify/amplify-codegen-ui/commit/5e59d9b861bff6b363a15fa3e6ee7f985ecc53dd)), closes [#58](https://github.com/aws-amplify/amplify-codegen-ui/issues/58)
- react render config ([#45](https://github.com/aws-amplify/amplify-codegen-ui/issues/45)) ([de74357](https://github.com/aws-amplify/amplify-codegen-ui/commit/de74357c2a323b11de1e464e7a47f43414d22409))
- setting license, author, homepage, and repo information ([e253a15](https://github.com/aws-amplify/amplify-codegen-ui/commit/e253a155f36c3451e7bc911225b8757b3dfd8b78))
- **codegen-ui-react:** include babel parser for prettier ([#83](https://github.com/aws-amplify/amplify-codegen-ui/issues/83)) ([e28551c](https://github.com/aws-amplify/amplify-codegen-ui/commit/e28551c96d0b22fd4f4135554291a94f5cfddea0))
- updating override paths to support child indices ([278b6f8](https://github.com/aws-amplify/amplify-codegen-ui/commit/278b6f8ac7486b2d6815d204cd59834238e12712))
- updating unit tests after merge failure, bumping package-locks back to v2 ([1c49ac0](https://github.com/aws-amplify/amplify-codegen-ui/commit/1c49ac0e7f6c73dc7190ebcd4270858b16bbe327))

### Features

- add base action binding support ([#124](https://github.com/aws-amplify/amplify-codegen-ui/issues/124)) ([e6e60c0](https://github.com/aws-amplify/amplify-codegen-ui/commit/e6e60c0394036065991920622bc30caac00dafed))
- add error handler to common entry points, and basic input validation ([84b28c3](https://github.com/aws-amplify/amplify-codegen-ui/commit/84b28c3e8b84caaf575873ef76c9c66779323ab3))
- add output configuration for studio codegen ([#32](https://github.com/aws-amplify/amplify-codegen-ui/issues/32)) ([8cb2de9](https://github.com/aws-amplify/amplify-codegen-ui/commit/8cb2de92fe397d4277ddec05422d4112e917cb78))
- add support for most existing primitives ([#194](https://github.com/aws-amplify/amplify-codegen-ui/issues/194)) ([f1fe271](https://github.com/aws-amplify/amplify-codegen-ui/commit/f1fe271ff128a8683cd8f06da8aaa0c577a9d1fc))
- adding support for style variants in generated components ([bb41ac5](https://github.com/aws-amplify/amplify-codegen-ui/commit/bb41ac5a836f7b3bfb6aeb72308db362fdec127f))
- output theme file ([#97](https://github.com/aws-amplify/amplify-codegen-ui/issues/97)) ([02508c1](https://github.com/aws-amplify/amplify-codegen-ui/commit/02508c1e8733ccee6a17551fed3b885619d70aa7))
- remove console log ([#76](https://github.com/aws-amplify/amplify-codegen-ui/issues/76)) ([73fac18](https://github.com/aws-amplify/amplify-codegen-ui/commit/73fac1864494929571ca8ece684a9caf9aab9360))
- test-generate each case individually, add support for error cases as well ([46f65cc](https://github.com/aws-amplify/amplify-codegen-ui/commit/46f65ccef5cc748d7c86025c81573c64ed4afa3d))
- update model validator to throw on names and component types with whitespace ([071a126](https://github.com/aws-amplify/amplify-codegen-ui/commit/071a1269e80f5c926602c0ef0a57524b6023bac3))

# 0.7.0 (2021-11-09)

### Bug Fixes

- adding support for additional component types for string and text types ([53d5537](https://github.com/aws-amplify/amplify-codegen-ui/commit/53d5537f3fd0eca1313d0cd39277ecf297988551))
- collections with name items no longer redeclare the prop name ([#183](https://github.com/aws-amplify/amplify-codegen-ui/issues/183)) ([6ab4cdf](https://github.com/aws-amplify/amplify-codegen-ui/commit/6ab4cdf50b6e7b8962835422663f3152753e8aa3))
- fixing override indice bug, and adding e2e test ([c8500bf](https://github.com/aws-amplify/amplify-codegen-ui/commit/c8500bf06ff9be18715e834cd1f9f43942b9a0ea))
- moving @aws-amplify/ui-react to a devDependency ([1aaa55d](https://github.com/aws-amplify/amplify-codegen-ui/commit/1aaa55d3eee0cd9a272888eada1f283cfc2a93c5))
- only pass props to top level ([#63](https://github.com/aws-amplify/amplify-codegen-ui/issues/63)) ([5e59d9b](https://github.com/aws-amplify/amplify-codegen-ui/commit/5e59d9b861bff6b363a15fa3e6ee7f985ecc53dd)), closes [#58](https://github.com/aws-amplify/amplify-codegen-ui/issues/58)
- react render config ([#45](https://github.com/aws-amplify/amplify-codegen-ui/issues/45)) ([de74357](https://github.com/aws-amplify/amplify-codegen-ui/commit/de74357c2a323b11de1e464e7a47f43414d22409))
- setting license, author, homepage, and repo information ([e253a15](https://github.com/aws-amplify/amplify-codegen-ui/commit/e253a155f36c3451e7bc911225b8757b3dfd8b78))
- **codegen-ui-react:** include babel parser for prettier ([#83](https://github.com/aws-amplify/amplify-codegen-ui/issues/83)) ([e28551c](https://github.com/aws-amplify/amplify-codegen-ui/commit/e28551c96d0b22fd4f4135554291a94f5cfddea0))
- updating override paths to support child indices ([278b6f8](https://github.com/aws-amplify/amplify-codegen-ui/commit/278b6f8ac7486b2d6815d204cd59834238e12712))
- updating unit tests after merge failure, bumping package-locks back to v2 ([1c49ac0](https://github.com/aws-amplify/amplify-codegen-ui/commit/1c49ac0e7f6c73dc7190ebcd4270858b16bbe327))

### Features

- add base action binding support ([#124](https://github.com/aws-amplify/amplify-codegen-ui/issues/124)) ([e6e60c0](https://github.com/aws-amplify/amplify-codegen-ui/commit/e6e60c0394036065991920622bc30caac00dafed))
- add output configuration for studio codegen ([#32](https://github.com/aws-amplify/amplify-codegen-ui/issues/32)) ([8cb2de9](https://github.com/aws-amplify/amplify-codegen-ui/commit/8cb2de92fe397d4277ddec05422d4112e917cb78))
- add support for most existing primitives ([#194](https://github.com/aws-amplify/amplify-codegen-ui/issues/194)) ([f1fe271](https://github.com/aws-amplify/amplify-codegen-ui/commit/f1fe271ff128a8683cd8f06da8aaa0c577a9d1fc))
- adding support for style variants in generated components ([bb41ac5](https://github.com/aws-amplify/amplify-codegen-ui/commit/bb41ac5a836f7b3bfb6aeb72308db362fdec127f))
- output theme file ([#97](https://github.com/aws-amplify/amplify-codegen-ui/issues/97)) ([02508c1](https://github.com/aws-amplify/amplify-codegen-ui/commit/02508c1e8733ccee6a17551fed3b885619d70aa7))
- remove console log ([#76](https://github.com/aws-amplify/amplify-codegen-ui/issues/76)) ([73fac18](https://github.com/aws-amplify/amplify-codegen-ui/commit/73fac1864494929571ca8ece684a9caf9aab9360))
- test-generate each case individually, add support for error cases as well ([46f65cc](https://github.com/aws-amplify/amplify-codegen-ui/commit/46f65ccef5cc748d7c86025c81573c64ed4afa3d))

# 0.6.0 (2021-11-04)

### Bug Fixes

- adding support for additional component types for string and text types ([53d5537](https://github.com/aws-amplify/amplify-codegen-ui/commit/53d5537f3fd0eca1313d0cd39277ecf297988551))
- collections with name items no longer redeclare the prop name ([#183](https://github.com/aws-amplify/amplify-codegen-ui/issues/183)) ([6ab4cdf](https://github.com/aws-amplify/amplify-codegen-ui/commit/6ab4cdf50b6e7b8962835422663f3152753e8aa3))
- fixing override indice bug, and adding e2e test ([c8500bf](https://github.com/aws-amplify/amplify-codegen-ui/commit/c8500bf06ff9be18715e834cd1f9f43942b9a0ea))
- moving @aws-amplify/ui-react to a devDependency ([1aaa55d](https://github.com/aws-amplify/amplify-codegen-ui/commit/1aaa55d3eee0cd9a272888eada1f283cfc2a93c5))
- only pass props to top level ([#63](https://github.com/aws-amplify/amplify-codegen-ui/issues/63)) ([5e59d9b](https://github.com/aws-amplify/amplify-codegen-ui/commit/5e59d9b861bff6b363a15fa3e6ee7f985ecc53dd)), closes [#58](https://github.com/aws-amplify/amplify-codegen-ui/issues/58)
- react render config ([#45](https://github.com/aws-amplify/amplify-codegen-ui/issues/45)) ([de74357](https://github.com/aws-amplify/amplify-codegen-ui/commit/de74357c2a323b11de1e464e7a47f43414d22409))
- setting license, author, homepage, and repo information ([e253a15](https://github.com/aws-amplify/amplify-codegen-ui/commit/e253a155f36c3451e7bc911225b8757b3dfd8b78))
- **codegen-ui-react:** include babel parser for prettier ([#83](https://github.com/aws-amplify/amplify-codegen-ui/issues/83)) ([e28551c](https://github.com/aws-amplify/amplify-codegen-ui/commit/e28551c96d0b22fd4f4135554291a94f5cfddea0))
- updating override paths to support child indices ([278b6f8](https://github.com/aws-amplify/amplify-codegen-ui/commit/278b6f8ac7486b2d6815d204cd59834238e12712))
- updating unit tests after merge failure, bumping package-locks back to v2 ([1c49ac0](https://github.com/aws-amplify/amplify-codegen-ui/commit/1c49ac0e7f6c73dc7190ebcd4270858b16bbe327))

### Features

- add base action binding support ([#124](https://github.com/aws-amplify/amplify-codegen-ui/issues/124)) ([e6e60c0](https://github.com/aws-amplify/amplify-codegen-ui/commit/e6e60c0394036065991920622bc30caac00dafed))
- add output configuration for studio codegen ([#32](https://github.com/aws-amplify/amplify-codegen-ui/issues/32)) ([8cb2de9](https://github.com/aws-amplify/amplify-codegen-ui/commit/8cb2de92fe397d4277ddec05422d4112e917cb78))
- adding support for style variants in generated components ([bb41ac5](https://github.com/aws-amplify/amplify-codegen-ui/commit/bb41ac5a836f7b3bfb6aeb72308db362fdec127f))
- output theme file ([#97](https://github.com/aws-amplify/amplify-codegen-ui/issues/97)) ([02508c1](https://github.com/aws-amplify/amplify-codegen-ui/commit/02508c1e8733ccee6a17551fed3b885619d70aa7))
- remove console log ([#76](https://github.com/aws-amplify/amplify-codegen-ui/issues/76)) ([73fac18](https://github.com/aws-amplify/amplify-codegen-ui/commit/73fac1864494929571ca8ece684a9caf9aab9360))

# 0.5.0 (2021-11-04)

### Bug Fixes

- adding support for additional component types for string and text types ([53d5537](https://github.com/aws-amplify/amplify-codegen-ui/commit/53d5537f3fd0eca1313d0cd39277ecf297988551))
- collections with name items no longer redeclare the prop name ([#183](https://github.com/aws-amplify/amplify-codegen-ui/issues/183)) ([6ab4cdf](https://github.com/aws-amplify/amplify-codegen-ui/commit/6ab4cdf50b6e7b8962835422663f3152753e8aa3))
- moving @aws-amplify/ui-react to a devDependency ([1aaa55d](https://github.com/aws-amplify/amplify-codegen-ui/commit/1aaa55d3eee0cd9a272888eada1f283cfc2a93c5))
- only pass props to top level ([#63](https://github.com/aws-amplify/amplify-codegen-ui/issues/63)) ([5e59d9b](https://github.com/aws-amplify/amplify-codegen-ui/commit/5e59d9b861bff6b363a15fa3e6ee7f985ecc53dd)), closes [#58](https://github.com/aws-amplify/amplify-codegen-ui/issues/58)
- react render config ([#45](https://github.com/aws-amplify/amplify-codegen-ui/issues/45)) ([de74357](https://github.com/aws-amplify/amplify-codegen-ui/commit/de74357c2a323b11de1e464e7a47f43414d22409))
- setting license, author, homepage, and repo information ([e253a15](https://github.com/aws-amplify/amplify-codegen-ui/commit/e253a155f36c3451e7bc911225b8757b3dfd8b78))
- **codegen-ui-react:** include babel parser for prettier ([#83](https://github.com/aws-amplify/amplify-codegen-ui/issues/83)) ([e28551c](https://github.com/aws-amplify/amplify-codegen-ui/commit/e28551c96d0b22fd4f4135554291a94f5cfddea0))
- updating override paths to support child indices ([278b6f8](https://github.com/aws-amplify/amplify-codegen-ui/commit/278b6f8ac7486b2d6815d204cd59834238e12712))
- updating unit tests after merge failure, bumping package-locks back to v2 ([1c49ac0](https://github.com/aws-amplify/amplify-codegen-ui/commit/1c49ac0e7f6c73dc7190ebcd4270858b16bbe327))

### Features

- add base action binding support ([#124](https://github.com/aws-amplify/amplify-codegen-ui/issues/124)) ([e6e60c0](https://github.com/aws-amplify/amplify-codegen-ui/commit/e6e60c0394036065991920622bc30caac00dafed))
- add output configuration for studio codegen ([#32](https://github.com/aws-amplify/amplify-codegen-ui/issues/32)) ([8cb2de9](https://github.com/aws-amplify/amplify-codegen-ui/commit/8cb2de92fe397d4277ddec05422d4112e917cb78))
- adding support for style variants in generated components ([bb41ac5](https://github.com/aws-amplify/amplify-codegen-ui/commit/bb41ac5a836f7b3bfb6aeb72308db362fdec127f))
- output theme file ([#97](https://github.com/aws-amplify/amplify-codegen-ui/issues/97)) ([02508c1](https://github.com/aws-amplify/amplify-codegen-ui/commit/02508c1e8733ccee6a17551fed3b885619d70aa7))
- remove console log ([#76](https://github.com/aws-amplify/amplify-codegen-ui/issues/76)) ([73fac18](https://github.com/aws-amplify/amplify-codegen-ui/commit/73fac1864494929571ca8ece684a9caf9aab9360))

## [0.2.1](https://github.com/aws-amplify/amplify-codegen-ui/compare/@amzn/codegen-ui@0.2.0...@amzn/codegen-ui@0.2.1) (2021-10-28)

**Note:** Version bump only for package @amzn/codegen-ui

# 0.2.0 (2021-10-27)

### Bug Fixes

- adding support for additional component types for string and text types ([53d5537](https://github.com/aws-amplify/amplify-codegen-ui/commit/53d5537f3fd0eca1313d0cd39277ecf297988551))
- moving @aws-amplify/ui-react to a devDependency ([1aaa55d](https://github.com/aws-amplify/amplify-codegen-ui/commit/1aaa55d3eee0cd9a272888eada1f283cfc2a93c5))
- only pass props to top level ([#63](https://github.com/aws-amplify/amplify-codegen-ui/issues/63)) ([5e59d9b](https://github.com/aws-amplify/amplify-codegen-ui/commit/5e59d9b861bff6b363a15fa3e6ee7f985ecc53dd)), closes [#58](https://github.com/aws-amplify/amplify-codegen-ui/issues/58)
- react render config ([#45](https://github.com/aws-amplify/amplify-codegen-ui/issues/45)) ([de74357](https://github.com/aws-amplify/amplify-codegen-ui/commit/de74357c2a323b11de1e464e7a47f43414d22409))
- setting license, author, homepage, and repo information ([e253a15](https://github.com/aws-amplify/amplify-codegen-ui/commit/e253a155f36c3451e7bc911225b8757b3dfd8b78))
- **codegen-ui-react:** include babel parser for prettier ([#83](https://github.com/aws-amplify/amplify-codegen-ui/issues/83)) ([e28551c](https://github.com/aws-amplify/amplify-codegen-ui/commit/e28551c96d0b22fd4f4135554291a94f5cfddea0))

### Features

- add base action binding support ([#124](https://github.com/aws-amplify/amplify-codegen-ui/issues/124)) ([e6e60c0](https://github.com/aws-amplify/amplify-codegen-ui/commit/e6e60c0394036065991920622bc30caac00dafed))
- add output configuration for studio codegen ([#32](https://github.com/aws-amplify/amplify-codegen-ui/issues/32)) ([8cb2de9](https://github.com/aws-amplify/amplify-codegen-ui/commit/8cb2de92fe397d4277ddec05422d4112e917cb78))
- adding support for style variants in generated components ([bb41ac5](https://github.com/aws-amplify/amplify-codegen-ui/commit/bb41ac5a836f7b3bfb6aeb72308db362fdec127f))
- output theme file ([#97](https://github.com/aws-amplify/amplify-codegen-ui/issues/97)) ([02508c1](https://github.com/aws-amplify/amplify-codegen-ui/commit/02508c1e8733ccee6a17551fed3b885619d70aa7))
- remove console log ([#76](https://github.com/aws-amplify/amplify-codegen-ui/issues/76)) ([73fac18](https://github.com/aws-amplify/amplify-codegen-ui/commit/73fac1864494929571ca8ece684a9caf9aab9360))

# 0.1.0 (2021-10-20)

### Bug Fixes

- moving @aws-amplify/ui-react to a devDependency ([1aaa55d](https://github.com/aws-amplify/amplify-codegen-ui/commit/1aaa55d3eee0cd9a272888eada1f283cfc2a93c5))
- only pass props to top level ([#63](https://github.com/aws-amplify/amplify-codegen-ui/issues/63)) ([5e59d9b](https://github.com/aws-amplify/amplify-codegen-ui/commit/5e59d9b861bff6b363a15fa3e6ee7f985ecc53dd)), closes [#58](https://github.com/aws-amplify/amplify-codegen-ui/issues/58)
- react render config ([#45](https://github.com/aws-amplify/amplify-codegen-ui/issues/45)) ([de74357](https://github.com/aws-amplify/amplify-codegen-ui/commit/de74357c2a323b11de1e464e7a47f43414d22409))
- setting license, author, homepage, and repo information ([e253a15](https://github.com/aws-amplify/amplify-codegen-ui/commit/e253a155f36c3451e7bc911225b8757b3dfd8b78))
- **codegen-ui-react:** include babel parser for prettier ([#83](https://github.com/aws-amplify/amplify-codegen-ui/issues/83)) ([e28551c](https://github.com/aws-amplify/amplify-codegen-ui/commit/e28551c96d0b22fd4f4135554291a94f5cfddea0))

### Features

- add base action binding support ([#124](https://github.com/aws-amplify/amplify-codegen-ui/issues/124)) ([e6e60c0](https://github.com/aws-amplify/amplify-codegen-ui/commit/e6e60c0394036065991920622bc30caac00dafed))
- add output configuration for studio codegen ([#32](https://github.com/aws-amplify/amplify-codegen-ui/issues/32)) ([8cb2de9](https://github.com/aws-amplify/amplify-codegen-ui/commit/8cb2de92fe397d4277ddec05422d4112e917cb78))
- adding support for style variants in generated components ([bb41ac5](https://github.com/aws-amplify/amplify-codegen-ui/commit/bb41ac5a836f7b3bfb6aeb72308db362fdec127f))
- output theme file ([#97](https://github.com/aws-amplify/amplify-codegen-ui/issues/97)) ([02508c1](https://github.com/aws-amplify/amplify-codegen-ui/commit/02508c1e8733ccee6a17551fed3b885619d70aa7))
- remove console log ([#76](https://github.com/aws-amplify/amplify-codegen-ui/issues/76)) ([73fac18](https://github.com/aws-amplify/amplify-codegen-ui/commit/73fac1864494929571ca8ece684a9caf9aab9360))
