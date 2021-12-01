# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.13.1](https://github.com/aws-amplify/amplify-codegen-ui/compare/v0.13.0...v0.13.1) (2021-11-26)

**Note:** Version bump only for package @aws-amplify/codegen-ui-react





# [0.13.0](https://github.com/aws-amplify/amplify-codegen-ui/compare/v0.12.0...v0.13.0) (2021-11-23)


### Bug Fixes

* convert built-in iconset names to pascal case ([#253](https://github.com/aws-amplify/amplify-codegen-ui/issues/253)) ([0c12c7b](https://github.com/aws-amplify/amplify-codegen-ui/commit/0c12c7bcf9a5d5a06ed7238ffe508c1e13a529dd))
* use double-equal instead of triple for conditional comparisons ([ff57822](https://github.com/aws-amplify/amplify-codegen-ui/commit/ff57822b5046bcbf2387b9fe8980c6aad956bc5a))


### Features

* add datastore object id as key to collections if not set ([63ffb89](https://github.com/aws-amplify/amplify-codegen-ui/commit/63ffb891e2d67dd63951a4cc4a103d8986cdfef0))





# [0.12.0](https://github.com/aws-amplify/amplify-codegen-ui/compare/v0.10.1...v0.12.0) (2021-11-22)


### Bug Fixes

* deep merge variants and overrides rather than overwrite with spread ([a779553](https://github.com/aws-amplify/amplify-codegen-ui/commit/a779553f373c45406aa1631f9ff60eeb33775843))
* fixing typescript version to 4.4.x, since 4.5.2 breaks the imports ([b726682](https://github.com/aws-amplify/amplify-codegen-ui/commit/b726682e56129ade22616682a14f481176851f94))
* remove unnecessary types file from generated index ([f7565a0](https://github.com/aws-amplify/amplify-codegen-ui/commit/f7565a0ccf2626d3801839acef656e1b54e9f046))
* removing label override for checkbox field, and removing label, which is not in primitives ([c819478](https://github.com/aws-amplify/amplify-codegen-ui/commit/c819478525f20dcd1be5664cb0563ab3a7dd9875))


### Features

* update internal hook import paths to use internal ui-react path ([74f4614](https://github.com/aws-amplify/amplify-codegen-ui/commit/74f4614409e361d7c423572c0ef2ef473bd07b1d))





## [0.11.1](https://github.com/aws-amplify/amplify-codegen-ui/compare/v0.10.1...v0.11.1) (2021-11-19)


### Bug Fixes

* deep merge variants and overrides rather than overwrite with spread ([a779553](https://github.com/aws-amplify/amplify-codegen-ui/commit/a779553f373c45406aa1631f9ff60eeb33775843))
* fixing typescript version to 4.4.x, since 4.5.2 breaks the imports ([b726682](https://github.com/aws-amplify/amplify-codegen-ui/commit/b726682e56129ade22616682a14f481176851f94))
* removing label override for checkbox field, and removing label, which is not in primitives ([c819478](https://github.com/aws-amplify/amplify-codegen-ui/commit/c819478525f20dcd1be5664cb0563ab3a7dd9875))





# [0.11.0](https://github.com/aws-amplify/amplify-codegen-ui/compare/v0.10.1...v0.11.0) (2021-11-18)


### Bug Fixes

* fixing typescript version to 4.4.x, since 4.5.2 breaks the imports ([25c2dc9](https://github.com/aws-amplify/amplify-codegen-ui/commit/25c2dc970fab06abf7554d7ff69de4b12f65abd0))





## [0.10.1](https://github.com/aws-amplify/amplify-codegen-ui/compare/v0.10.0...v0.10.1) (2021-11-17)


### Bug Fixes

* use static list iconset instead of dynamic from import ([3607d50](https://github.com/aws-amplify/amplify-codegen-ui/commit/3607d50e2436d4e24341e6e5a03e2358ca0ee93b))





# [0.10.0](https://github.com/aws-amplify/amplify-codegen-ui/compare/v0.9.0...v0.10.0) (2021-11-16)

**Note:** Version bump only for package @aws-amplify/codegen-ui-react





# 0.9.0 (2021-11-15)

### Bug Fixes

- add children prop to all custom components ([#198](https://github.com/aws-amplify/amplify-codegen-ui/issues/198)) ([cbd96c9](https://github.com/aws-amplify/amplify-codegen-ui/commit/cbd96c908e03155521d37c20a81464e3ccb1274c))
- add data binding model imports ([#49](https://github.com/aws-amplify/amplify-codegen-ui/issues/49)) ([11e5c47](https://github.com/aws-amplify/amplify-codegen-ui/commit/11e5c473e28a7e23e9768f4d695c9b0bdc6fd5fd))
- adding support for additional component types for string and text types ([53d5537](https://github.com/aws-amplify/amplify-codegen-ui/commit/53d5537f3fd0eca1313d0cd39277ecf297988551))
- collection binding with no predicate ([#98](https://github.com/aws-amplify/amplify-codegen-ui/issues/98)) ([3e38fcc](https://github.com/aws-amplify/amplify-codegen-ui/commit/3e38fccf4c456d34f15b7ca050be6041ccb80417))
- collections with name items no longer redeclare the prop name ([#183](https://github.com/aws-amplify/amplify-codegen-ui/issues/183)) ([6ab4cdf](https://github.com/aws-amplify/amplify-codegen-ui/commit/6ab4cdf50b6e7b8962835422663f3152753e8aa3))
- createDatastorePredicate call was added ([#166](https://github.com/aws-amplify/amplify-codegen-ui/issues/166)) ([fbee20c](https://github.com/aws-amplify/amplify-codegen-ui/commit/fbee20c9aae661571653a1b0ee3801e67d02e123))
- dont pass all props to top level component ([ee9e1b4](https://github.com/aws-amplify/amplify-codegen-ui/commit/ee9e1b4a3ea9e9ddfc224e217edba4722365bb9a))
- enable esModuleInterop ([#85](https://github.com/aws-amplify/amplify-codegen-ui/issues/85)) ([32eac19](https://github.com/aws-amplify/amplify-codegen-ui/commit/32eac194dc4ba4fbb5571926698e5560a1a6b14d)), closes [#77](https://github.com/aws-amplify/amplify-codegen-ui/issues/77)
- ensuring we properly escape object keys with non-alpha characters ([5216eca](https://github.com/aws-amplify/amplify-codegen-ui/commit/5216ecad6c6f7c84dd8a25cfedbe9214b01dca76))
- fixing override indice bug, and adding e2e test ([c8500bf](https://github.com/aws-amplify/amplify-codegen-ui/commit/c8500bf06ff9be18715e834cd1f9f43942b9a0ea))
- getting cypress tests to run ([2a40055](https://github.com/aws-amplify/amplify-codegen-ui/commit/2a400557c416daab1ec2bd49d4800b6260648175))
- import custom component from local directory ([#182](https://github.com/aws-amplify/amplify-codegen-ui/issues/182)) ([5cd1076](https://github.com/aws-amplify/amplify-codegen-ui/commit/5cd1076a4cd7a0710c8be70cfcb70a5571979e6a))
- include typescript parser plugin ([8b4e765](https://github.com/aws-amplify/amplify-codegen-ui/commit/8b4e7655f244d08286e7ac15551221fe6bf06589))
- moving @aws-amplify/ui-react to a devDependency ([1aaa55d](https://github.com/aws-amplify/amplify-codegen-ui/commit/1aaa55d3eee0cd9a272888eada1f283cfc2a93c5))
- only import props type for top-level component ([c850b8c](https://github.com/aws-amplify/amplify-codegen-ui/commit/c850b8c5ad110421d2ad68898452e8fef5321cd8))
- only pass props to top level ([#63](https://github.com/aws-amplify/amplify-codegen-ui/issues/63)) ([5e59d9b](https://github.com/aws-amplify/amplify-codegen-ui/commit/5e59d9b861bff6b363a15fa3e6ee7f985ecc53dd)), closes [#58](https://github.com/aws-amplify/amplify-codegen-ui/issues/58)
- only use useDataStoreBinding when predicate is set ([#86](https://github.com/aws-amplify/amplify-codegen-ui/issues/86)) ([ec079f1](https://github.com/aws-amplify/amplify-codegen-ui/commit/ec079f14a50ec6e1132669761e6b924638e1c9ce)), closes [#84](https://github.com/aws-amplify/amplify-codegen-ui/issues/84)
- react render config ([#45](https://github.com/aws-amplify/amplify-codegen-ui/issues/45)) ([de74357](https://github.com/aws-amplify/amplify-codegen-ui/commit/de74357c2a323b11de1e464e7a47f43414d22409))
- remove Box to View mapping ([#144](https://github.com/aws-amplify/amplify-codegen-ui/issues/144)) ([74f860c](https://github.com/aws-amplify/amplify-codegen-ui/commit/74f860c18a7f8ee037753035002ecb8a051bb165))
- remove export modifier for renderComponentOnly ([#66](https://github.com/aws-amplify/amplify-codegen-ui/issues/66)) ([6e3d097](https://github.com/aws-amplify/amplify-codegen-ui/commit/6e3d097f217ecbdfb5165888e47eb0e6a16da8c4))
- remove extra component directories ([#71](https://github.com/aws-amplify/amplify-codegen-ui/issues/71)) ([e68d92b](https://github.com/aws-amplify/amplify-codegen-ui/commit/e68d92bdfa4d2f5d34f9cdf0ee70376cec5ce43b))
- remove text value from props and render bound property ([#70](https://github.com/aws-amplify/amplify-codegen-ui/issues/70)) ([aabed87](https://github.com/aws-amplify/amplify-codegen-ui/commit/aabed87e8091a5f875d6edd417744b058a769b4e)), closes [#67](https://github.com/aws-amplify/amplify-codegen-ui/issues/67)
- set correct import location for code sample ([#203](https://github.com/aws-amplify/amplify-codegen-ui/issues/203)) ([aabb39f](https://github.com/aws-amplify/amplify-codegen-ui/commit/aabb39f483d264fb26fc35b8405caed1bb25733c))
- setting license, author, homepage, and repo information ([e253a15](https://github.com/aws-amplify/amplify-codegen-ui/commit/e253a155f36c3451e7bc911225b8757b3dfd8b78))
- simple property binding default value ([#168](https://github.com/aws-amplify/amplify-codegen-ui/issues/168)) ([de84261](https://github.com/aws-amplify/amplify-codegen-ui/commit/de84261aebab5d9b570210c19cfb7a3d0214e1fe))
- **codegen-ui-react:** collection items props takes precedent ([#96](https://github.com/aws-amplify/amplify-codegen-ui/issues/96)) ([0149ca2](https://github.com/aws-amplify/amplify-codegen-ui/commit/0149ca28741969aae5c3c5442985c10ad065501c)), closes [#90](https://github.com/aws-amplify/amplify-codegen-ui/issues/90)
- **codegen-ui-react:** include all imports used in generated components ([#40](https://github.com/aws-amplify/amplify-codegen-ui/issues/40)) ([04f86bb](https://github.com/aws-amplify/amplify-codegen-ui/commit/04f86bb6a3146d578420b7e0bc3c525fa6572b6b))
- **codegen-ui-react:** include babel parser for prettier ([#83](https://github.com/aws-amplify/amplify-codegen-ui/issues/83)) ([e28551c](https://github.com/aws-amplify/amplify-codegen-ui/commit/e28551c96d0b22fd4f4135554291a94f5cfddea0))
- top level bindingProperties should be optional ([#61](https://github.com/aws-amplify/amplify-codegen-ui/issues/61)) ([b97d6fd](https://github.com/aws-amplify/amplify-codegen-ui/commit/b97d6fdeba5f2525e9a8ced50e5fdb0dfaff3f51))
- top level prop available as variables ([#62](https://github.com/aws-amplify/amplify-codegen-ui/issues/62)) ([788802e](https://github.com/aws-amplify/amplify-codegen-ui/commit/788802e7c0d2426a1c22460bf3bc240e94cbb0c7))
- update theme generation for new schema ([#142](https://github.com/aws-amplify/amplify-codegen-ui/issues/142)) ([a780893](https://github.com/aws-amplify/amplify-codegen-ui/commit/a7808934e3bb293068687526915a27a3ec8e7637))
- update theming to support ui@next ([92e9555](https://github.com/aws-amplify/amplify-codegen-ui/commit/92e95552603cde3c27512504aceb01b96031c97d))
- update unit tests per change from React.Element to React.ReactElement ([d1b782f](https://github.com/aws-amplify/amplify-codegen-ui/commit/d1b782fc4220976bfaa40a9693ed8a4a0109684b))
- updates to get concat and conditional working, and adding tests ([ef4600f](https://github.com/aws-amplify/amplify-codegen-ui/commit/ef4600f78934b031830f450566b476c2d98caeba))
- updating generated theme to work in test app ([113a594](https://github.com/aws-amplify/amplify-codegen-ui/commit/113a5941800263223571e56c5f3c80c7b8ab093a))
- updating override paths to support child indices ([278b6f8](https://github.com/aws-amplify/amplify-codegen-ui/commit/278b6f8ac7486b2d6815d204cd59834238e12712))
- updating sample code snippets to accurately reflect current usage ([2de5561](https://github.com/aws-amplify/amplify-codegen-ui/commit/2de5561c36eab5c86c7a4b62d148706424836360))
- updating unit tests after merge failure, bumping package-locks back to v2 ([1c49ac0](https://github.com/aws-amplify/amplify-codegen-ui/commit/1c49ac0e7f6c73dc7190ebcd4270858b16bbe327))
- use correct identifier when using useDataStoreBinding ([#104](https://github.com/aws-amplify/amplify-codegen-ui/issues/104)) ([ef93e45](https://github.com/aws-amplify/amplify-codegen-ui/commit/ef93e4583b68a6fe28d50663bd2c49d9889b8029))
- use temp package that does not break browser ([#136](https://github.com/aws-amplify/amplify-codegen-ui/issues/136)) ([12c9efb](https://github.com/aws-amplify/amplify-codegen-ui/commit/12c9efb673b186abe55dd643bae531d06ec8e368))

### Features

- add base action binding support ([#124](https://github.com/aws-amplify/amplify-codegen-ui/issues/124)) ([e6e60c0](https://github.com/aws-amplify/amplify-codegen-ui/commit/e6e60c0394036065991920622bc30caac00dafed))
- add conditional binding ([#102](https://github.com/aws-amplify/amplify-codegen-ui/issues/102)) ([8c66425](https://github.com/aws-amplify/amplify-codegen-ui/commit/8c664250058cf4703d4b2970bd72c9c269421901))
- add data binding predicate ([#57](https://github.com/aws-amplify/amplify-codegen-ui/issues/57)) ([d9e0216](https://github.com/aws-amplify/amplify-codegen-ui/commit/d9e0216c10f092ecda5fc1888f23bcbae60fe428))
- add error handler to common entry points, and basic input validation ([84b28c3](https://github.com/aws-amplify/amplify-codegen-ui/commit/84b28c3e8b84caaf575873ef76c9c66779323ab3))
- add index file renderer, and update sample imports to reference ([361bed2](https://github.com/aws-amplify/amplify-codegen-ui/commit/361bed24af1501a710c3fffa5341a14613c46da1))
- add notice to top of generated files ([#56](https://github.com/aws-amplify/amplify-codegen-ui/issues/56)) ([4f492cd](https://github.com/aws-amplify/amplify-codegen-ui/commit/4f492cdcd08757c7e23f3be86e7264b29e4e3a0d)), closes [#55](https://github.com/aws-amplify/amplify-codegen-ui/issues/55)
- add output configuration for studio codegen ([#32](https://github.com/aws-amplify/amplify-codegen-ui/issues/32)) ([8cb2de9](https://github.com/aws-amplify/amplify-codegen-ui/commit/8cb2de92fe397d4277ddec05422d4112e917cb78))
- add react attr generation for collectionBindingProperties ([#53](https://github.com/aws-amplify/amplify-codegen-ui/issues/53)) ([33390ed](https://github.com/aws-amplify/amplify-codegen-ui/commit/33390ed150c33a51de3808663b9fc3c46c998de5))
- add single record binding generation ([#51](https://github.com/aws-amplify/amplify-codegen-ui/issues/51)) ([454d754](https://github.com/aws-amplify/amplify-codegen-ui/commit/454d7541b5a699a0598f5fb160639050f104fc73))
- add SliderField primitive ([#213](https://github.com/aws-amplify/amplify-codegen-ui/issues/213)) ([78209e2](https://github.com/aws-amplify/amplify-codegen-ui/commit/78209e25a0ca324e99a5eb14c5e05cfa28df6fd4))
- add support for most existing primitives ([#194](https://github.com/aws-amplify/amplify-codegen-ui/issues/194)) ([f1fe271](https://github.com/aws-amplify/amplify-codegen-ui/commit/f1fe271ff128a8683cd8f06da8aaa0c577a9d1fc))
- add temp label synthetic prop to CheckboxField ([#217](https://github.com/aws-amplify/amplify-codegen-ui/issues/217)) ([b386451](https://github.com/aws-amplify/amplify-codegen-ui/commit/b386451f68a2597959e569d564abd34620906cf5))
- add TextField primitive ([#211](https://github.com/aws-amplify/amplify-codegen-ui/issues/211)) ([bc7de0f](https://github.com/aws-amplify/amplify-codegen-ui/commit/bc7de0fd38f0dd16f93eee84d870fb606ad4cd13))
- add type information to variants, and add e2e tests for variant rendering ([6ce2ac9](https://github.com/aws-amplify/amplify-codegen-ui/commit/6ce2ac9c0dadad4e25918712edf616e3c68732b3))
- add user specific attrs ([#107](https://github.com/aws-amplify/amplify-codegen-ui/issues/107)) ([67f34ac](https://github.com/aws-amplify/amplify-codegen-ui/commit/67f34acc6d13f1f9ebd283e20454480db393343f))
- adding gh workflow to test rendered goldens ([17e0ca0](https://github.com/aws-amplify/amplify-codegen-ui/commit/17e0ca09efdb27e7256b5d497956d11d969a9420))
- adding support for style variants in generated components ([bb41ac5](https://github.com/aws-amplify/amplify-codegen-ui/commit/bb41ac5a836f7b3bfb6aeb72308db362fdec127f))
- concatenation binding implementation ([#99](https://github.com/aws-amplify/amplify-codegen-ui/issues/99)) ([1bfd428](https://github.com/aws-amplify/amplify-codegen-ui/commit/1bfd4287acf7b2d5f410f045e17658929cb60eb3))
- extend base action binding types with navigation types and add test ([dbccfbd](https://github.com/aws-amplify/amplify-codegen-ui/commit/dbccfbd0466186c8cc09d71419504b0ee3abc4ff))
- output theme file ([#97](https://github.com/aws-amplify/amplify-codegen-ui/issues/97)) ([02508c1](https://github.com/aws-amplify/amplify-codegen-ui/commit/02508c1e8733ccee6a17551fed3b885619d70aa7))
- output type declaration ([#118](https://github.com/aws-amplify/amplify-codegen-ui/issues/118)) ([9db8bdc](https://github.com/aws-amplify/amplify-codegen-ui/commit/9db8bdc80f66567b3d4d9d94d4b4a6bb386af28d))
- parse string wrapped fixed values ([#155](https://github.com/aws-amplify/amplify-codegen-ui/issues/155)) ([3827f7c](https://github.com/aws-amplify/amplify-codegen-ui/commit/3827f7c612f782a36d2563c4203c20437e75bfdd))
- primitive children prop mapping ([#191](https://github.com/aws-amplify/amplify-codegen-ui/issues/191)) ([d6cf178](https://github.com/aws-amplify/amplify-codegen-ui/commit/d6cf17856b7efe6ae5c0eb448c690a54628d3f89))
- remove console log ([#76](https://github.com/aws-amplify/amplify-codegen-ui/issues/76)) ([73fac18](https://github.com/aws-amplify/amplify-codegen-ui/commit/73fac1864494929571ca8ece684a9caf9aab9360))
- remove FieldGroup, FieldGroupIcon, and FieldGroupIconButton primitives ([#207](https://github.com/aws-amplify/amplify-codegen-ui/issues/207)) ([baa8e64](https://github.com/aws-amplify/amplify-codegen-ui/commit/baa8e64182789234849833fd9934d50790305cab))
- remove input primitive ([#212](https://github.com/aws-amplify/amplify-codegen-ui/issues/212)) ([fc92841](https://github.com/aws-amplify/amplify-codegen-ui/commit/fc928413374ab11176011007dfb609462506e8c8))
- remove string component type ([#193](https://github.com/aws-amplify/amplify-codegen-ui/issues/193)) ([986fc5f](https://github.com/aws-amplify/amplify-codegen-ui/commit/986fc5ffe4ea68e38c3cf028228a9ce85a5fcd28))
- replacing dependency on helper for collections sort with inline sort function ([0d0df62](https://github.com/aws-amplify/amplify-codegen-ui/commit/0d0df626fe5b2b0bf028a569adf0faad1aa3f0aa))
- test-generate each case individually, add support for error cases as well ([46f65cc](https://github.com/aws-amplify/amplify-codegen-ui/commit/46f65ccef5cc748d7c86025c81573c64ed4afa3d))
- throw error on invalid script kind ([#133](https://github.com/aws-amplify/amplify-codegen-ui/issues/133)) ([ee3e79f](https://github.com/aws-amplify/amplify-codegen-ui/commit/ee3e79f351cf0d5151bf9bbaa048f05897bcb9b0))

# 0.8.0 (2021-11-12)

### Bug Fixes

- add children prop to all custom components ([#198](https://github.com/aws-amplify/amplify-codegen-ui/issues/198)) ([cbd96c9](https://github.com/aws-amplify/amplify-codegen-ui/commit/cbd96c908e03155521d37c20a81464e3ccb1274c))
- add data binding model imports ([#49](https://github.com/aws-amplify/amplify-codegen-ui/issues/49)) ([11e5c47](https://github.com/aws-amplify/amplify-codegen-ui/commit/11e5c473e28a7e23e9768f4d695c9b0bdc6fd5fd))
- adding support for additional component types for string and text types ([53d5537](https://github.com/aws-amplify/amplify-codegen-ui/commit/53d5537f3fd0eca1313d0cd39277ecf297988551))
- collection binding with no predicate ([#98](https://github.com/aws-amplify/amplify-codegen-ui/issues/98)) ([3e38fcc](https://github.com/aws-amplify/amplify-codegen-ui/commit/3e38fccf4c456d34f15b7ca050be6041ccb80417))
- collections with name items no longer redeclare the prop name ([#183](https://github.com/aws-amplify/amplify-codegen-ui/issues/183)) ([6ab4cdf](https://github.com/aws-amplify/amplify-codegen-ui/commit/6ab4cdf50b6e7b8962835422663f3152753e8aa3))
- createDatastorePredicate call was added ([#166](https://github.com/aws-amplify/amplify-codegen-ui/issues/166)) ([fbee20c](https://github.com/aws-amplify/amplify-codegen-ui/commit/fbee20c9aae661571653a1b0ee3801e67d02e123))
- dont pass all props to top level component ([ee9e1b4](https://github.com/aws-amplify/amplify-codegen-ui/commit/ee9e1b4a3ea9e9ddfc224e217edba4722365bb9a))
- enable esModuleInterop ([#85](https://github.com/aws-amplify/amplify-codegen-ui/issues/85)) ([32eac19](https://github.com/aws-amplify/amplify-codegen-ui/commit/32eac194dc4ba4fbb5571926698e5560a1a6b14d)), closes [#77](https://github.com/aws-amplify/amplify-codegen-ui/issues/77)
- ensuring we properly escape object keys with non-alpha characters ([5216eca](https://github.com/aws-amplify/amplify-codegen-ui/commit/5216ecad6c6f7c84dd8a25cfedbe9214b01dca76))
- fixing override indice bug, and adding e2e test ([c8500bf](https://github.com/aws-amplify/amplify-codegen-ui/commit/c8500bf06ff9be18715e834cd1f9f43942b9a0ea))
- getting cypress tests to run ([2a40055](https://github.com/aws-amplify/amplify-codegen-ui/commit/2a400557c416daab1ec2bd49d4800b6260648175))
- import custom component from local directory ([#182](https://github.com/aws-amplify/amplify-codegen-ui/issues/182)) ([5cd1076](https://github.com/aws-amplify/amplify-codegen-ui/commit/5cd1076a4cd7a0710c8be70cfcb70a5571979e6a))
- include typescript parser plugin ([8b4e765](https://github.com/aws-amplify/amplify-codegen-ui/commit/8b4e7655f244d08286e7ac15551221fe6bf06589))
- moving @aws-amplify/ui-react to a devDependency ([1aaa55d](https://github.com/aws-amplify/amplify-codegen-ui/commit/1aaa55d3eee0cd9a272888eada1f283cfc2a93c5))
- only import props type for top-level component ([c850b8c](https://github.com/aws-amplify/amplify-codegen-ui/commit/c850b8c5ad110421d2ad68898452e8fef5321cd8))
- only pass props to top level ([#63](https://github.com/aws-amplify/amplify-codegen-ui/issues/63)) ([5e59d9b](https://github.com/aws-amplify/amplify-codegen-ui/commit/5e59d9b861bff6b363a15fa3e6ee7f985ecc53dd)), closes [#58](https://github.com/aws-amplify/amplify-codegen-ui/issues/58)
- only use useDataStoreBinding when predicate is set ([#86](https://github.com/aws-amplify/amplify-codegen-ui/issues/86)) ([ec079f1](https://github.com/aws-amplify/amplify-codegen-ui/commit/ec079f14a50ec6e1132669761e6b924638e1c9ce)), closes [#84](https://github.com/aws-amplify/amplify-codegen-ui/issues/84)
- react render config ([#45](https://github.com/aws-amplify/amplify-codegen-ui/issues/45)) ([de74357](https://github.com/aws-amplify/amplify-codegen-ui/commit/de74357c2a323b11de1e464e7a47f43414d22409))
- remove Box to View mapping ([#144](https://github.com/aws-amplify/amplify-codegen-ui/issues/144)) ([74f860c](https://github.com/aws-amplify/amplify-codegen-ui/commit/74f860c18a7f8ee037753035002ecb8a051bb165))
- remove export modifier for renderComponentOnly ([#66](https://github.com/aws-amplify/amplify-codegen-ui/issues/66)) ([6e3d097](https://github.com/aws-amplify/amplify-codegen-ui/commit/6e3d097f217ecbdfb5165888e47eb0e6a16da8c4))
- remove extra component directories ([#71](https://github.com/aws-amplify/amplify-codegen-ui/issues/71)) ([e68d92b](https://github.com/aws-amplify/amplify-codegen-ui/commit/e68d92bdfa4d2f5d34f9cdf0ee70376cec5ce43b))
- remove text value from props and render bound property ([#70](https://github.com/aws-amplify/amplify-codegen-ui/issues/70)) ([aabed87](https://github.com/aws-amplify/amplify-codegen-ui/commit/aabed87e8091a5f875d6edd417744b058a769b4e)), closes [#67](https://github.com/aws-amplify/amplify-codegen-ui/issues/67)
- set correct import location for code sample ([#203](https://github.com/aws-amplify/amplify-codegen-ui/issues/203)) ([aabb39f](https://github.com/aws-amplify/amplify-codegen-ui/commit/aabb39f483d264fb26fc35b8405caed1bb25733c))
- setting license, author, homepage, and repo information ([e253a15](https://github.com/aws-amplify/amplify-codegen-ui/commit/e253a155f36c3451e7bc911225b8757b3dfd8b78))
- simple property binding default value ([#168](https://github.com/aws-amplify/amplify-codegen-ui/issues/168)) ([de84261](https://github.com/aws-amplify/amplify-codegen-ui/commit/de84261aebab5d9b570210c19cfb7a3d0214e1fe))
- **codegen-ui-react:** collection items props takes precedent ([#96](https://github.com/aws-amplify/amplify-codegen-ui/issues/96)) ([0149ca2](https://github.com/aws-amplify/amplify-codegen-ui/commit/0149ca28741969aae5c3c5442985c10ad065501c)), closes [#90](https://github.com/aws-amplify/amplify-codegen-ui/issues/90)
- **codegen-ui-react:** include all imports used in generated components ([#40](https://github.com/aws-amplify/amplify-codegen-ui/issues/40)) ([04f86bb](https://github.com/aws-amplify/amplify-codegen-ui/commit/04f86bb6a3146d578420b7e0bc3c525fa6572b6b))
- **codegen-ui-react:** include babel parser for prettier ([#83](https://github.com/aws-amplify/amplify-codegen-ui/issues/83)) ([e28551c](https://github.com/aws-amplify/amplify-codegen-ui/commit/e28551c96d0b22fd4f4135554291a94f5cfddea0))
- top level bindingProperties should be optional ([#61](https://github.com/aws-amplify/amplify-codegen-ui/issues/61)) ([b97d6fd](https://github.com/aws-amplify/amplify-codegen-ui/commit/b97d6fdeba5f2525e9a8ced50e5fdb0dfaff3f51))
- top level prop available as variables ([#62](https://github.com/aws-amplify/amplify-codegen-ui/issues/62)) ([788802e](https://github.com/aws-amplify/amplify-codegen-ui/commit/788802e7c0d2426a1c22460bf3bc240e94cbb0c7))
- update theme generation for new schema ([#142](https://github.com/aws-amplify/amplify-codegen-ui/issues/142)) ([a780893](https://github.com/aws-amplify/amplify-codegen-ui/commit/a7808934e3bb293068687526915a27a3ec8e7637))
- update theming to support ui@next ([92e9555](https://github.com/aws-amplify/amplify-codegen-ui/commit/92e95552603cde3c27512504aceb01b96031c97d))
- update unit tests per change from React.Element to React.ReactElement ([d1b782f](https://github.com/aws-amplify/amplify-codegen-ui/commit/d1b782fc4220976bfaa40a9693ed8a4a0109684b))
- updates to get concat and conditional working, and adding tests ([ef4600f](https://github.com/aws-amplify/amplify-codegen-ui/commit/ef4600f78934b031830f450566b476c2d98caeba))
- updating generated theme to work in test app ([113a594](https://github.com/aws-amplify/amplify-codegen-ui/commit/113a5941800263223571e56c5f3c80c7b8ab093a))
- updating override paths to support child indices ([278b6f8](https://github.com/aws-amplify/amplify-codegen-ui/commit/278b6f8ac7486b2d6815d204cd59834238e12712))
- updating sample code snippets to accurately reflect current usage ([2de5561](https://github.com/aws-amplify/amplify-codegen-ui/commit/2de5561c36eab5c86c7a4b62d148706424836360))
- updating unit tests after merge failure, bumping package-locks back to v2 ([1c49ac0](https://github.com/aws-amplify/amplify-codegen-ui/commit/1c49ac0e7f6c73dc7190ebcd4270858b16bbe327))
- use correct identifier when using useDataStoreBinding ([#104](https://github.com/aws-amplify/amplify-codegen-ui/issues/104)) ([ef93e45](https://github.com/aws-amplify/amplify-codegen-ui/commit/ef93e4583b68a6fe28d50663bd2c49d9889b8029))
- use temp package that does not break browser ([#136](https://github.com/aws-amplify/amplify-codegen-ui/issues/136)) ([12c9efb](https://github.com/aws-amplify/amplify-codegen-ui/commit/12c9efb673b186abe55dd643bae531d06ec8e368))

### Features

- add base action binding support ([#124](https://github.com/aws-amplify/amplify-codegen-ui/issues/124)) ([e6e60c0](https://github.com/aws-amplify/amplify-codegen-ui/commit/e6e60c0394036065991920622bc30caac00dafed))
- add conditional binding ([#102](https://github.com/aws-amplify/amplify-codegen-ui/issues/102)) ([8c66425](https://github.com/aws-amplify/amplify-codegen-ui/commit/8c664250058cf4703d4b2970bd72c9c269421901))
- add data binding predicate ([#57](https://github.com/aws-amplify/amplify-codegen-ui/issues/57)) ([d9e0216](https://github.com/aws-amplify/amplify-codegen-ui/commit/d9e0216c10f092ecda5fc1888f23bcbae60fe428))
- add error handler to common entry points, and basic input validation ([84b28c3](https://github.com/aws-amplify/amplify-codegen-ui/commit/84b28c3e8b84caaf575873ef76c9c66779323ab3))
- add notice to top of generated files ([#56](https://github.com/aws-amplify/amplify-codegen-ui/issues/56)) ([4f492cd](https://github.com/aws-amplify/amplify-codegen-ui/commit/4f492cdcd08757c7e23f3be86e7264b29e4e3a0d)), closes [#55](https://github.com/aws-amplify/amplify-codegen-ui/issues/55)
- add output configuration for studio codegen ([#32](https://github.com/aws-amplify/amplify-codegen-ui/issues/32)) ([8cb2de9](https://github.com/aws-amplify/amplify-codegen-ui/commit/8cb2de92fe397d4277ddec05422d4112e917cb78))
- add react attr generation for collectionBindingProperties ([#53](https://github.com/aws-amplify/amplify-codegen-ui/issues/53)) ([33390ed](https://github.com/aws-amplify/amplify-codegen-ui/commit/33390ed150c33a51de3808663b9fc3c46c998de5))
- add single record binding generation ([#51](https://github.com/aws-amplify/amplify-codegen-ui/issues/51)) ([454d754](https://github.com/aws-amplify/amplify-codegen-ui/commit/454d7541b5a699a0598f5fb160639050f104fc73))
- add support for most existing primitives ([#194](https://github.com/aws-amplify/amplify-codegen-ui/issues/194)) ([f1fe271](https://github.com/aws-amplify/amplify-codegen-ui/commit/f1fe271ff128a8683cd8f06da8aaa0c577a9d1fc))
- add temp label synthetic prop to CheckboxField ([#217](https://github.com/aws-amplify/amplify-codegen-ui/issues/217)) ([b386451](https://github.com/aws-amplify/amplify-codegen-ui/commit/b386451f68a2597959e569d564abd34620906cf5))
- add TextField primitive ([#211](https://github.com/aws-amplify/amplify-codegen-ui/issues/211)) ([bc7de0f](https://github.com/aws-amplify/amplify-codegen-ui/commit/bc7de0fd38f0dd16f93eee84d870fb606ad4cd13))
- add type information to variants, and add e2e tests for variant rendering ([6ce2ac9](https://github.com/aws-amplify/amplify-codegen-ui/commit/6ce2ac9c0dadad4e25918712edf616e3c68732b3))
- add user specific attrs ([#107](https://github.com/aws-amplify/amplify-codegen-ui/issues/107)) ([67f34ac](https://github.com/aws-amplify/amplify-codegen-ui/commit/67f34acc6d13f1f9ebd283e20454480db393343f))
- adding gh workflow to test rendered goldens ([17e0ca0](https://github.com/aws-amplify/amplify-codegen-ui/commit/17e0ca09efdb27e7256b5d497956d11d969a9420))
- adding support for style variants in generated components ([bb41ac5](https://github.com/aws-amplify/amplify-codegen-ui/commit/bb41ac5a836f7b3bfb6aeb72308db362fdec127f))
- concatenation binding implementation ([#99](https://github.com/aws-amplify/amplify-codegen-ui/issues/99)) ([1bfd428](https://github.com/aws-amplify/amplify-codegen-ui/commit/1bfd4287acf7b2d5f410f045e17658929cb60eb3))
- extend base action binding types with navigation types and add test ([dbccfbd](https://github.com/aws-amplify/amplify-codegen-ui/commit/dbccfbd0466186c8cc09d71419504b0ee3abc4ff))
- output theme file ([#97](https://github.com/aws-amplify/amplify-codegen-ui/issues/97)) ([02508c1](https://github.com/aws-amplify/amplify-codegen-ui/commit/02508c1e8733ccee6a17551fed3b885619d70aa7))
- output type declaration ([#118](https://github.com/aws-amplify/amplify-codegen-ui/issues/118)) ([9db8bdc](https://github.com/aws-amplify/amplify-codegen-ui/commit/9db8bdc80f66567b3d4d9d94d4b4a6bb386af28d))
- parse string wrapped fixed values ([#155](https://github.com/aws-amplify/amplify-codegen-ui/issues/155)) ([3827f7c](https://github.com/aws-amplify/amplify-codegen-ui/commit/3827f7c612f782a36d2563c4203c20437e75bfdd))
- primitive children prop mapping ([#191](https://github.com/aws-amplify/amplify-codegen-ui/issues/191)) ([d6cf178](https://github.com/aws-amplify/amplify-codegen-ui/commit/d6cf17856b7efe6ae5c0eb448c690a54628d3f89))
- remove console log ([#76](https://github.com/aws-amplify/amplify-codegen-ui/issues/76)) ([73fac18](https://github.com/aws-amplify/amplify-codegen-ui/commit/73fac1864494929571ca8ece684a9caf9aab9360))
- remove FieldGroup, FieldGroupIcon, and FieldGroupIconButton primitives ([#207](https://github.com/aws-amplify/amplify-codegen-ui/issues/207)) ([baa8e64](https://github.com/aws-amplify/amplify-codegen-ui/commit/baa8e64182789234849833fd9934d50790305cab))
- remove input primitive ([#212](https://github.com/aws-amplify/amplify-codegen-ui/issues/212)) ([fc92841](https://github.com/aws-amplify/amplify-codegen-ui/commit/fc928413374ab11176011007dfb609462506e8c8))
- remove string component type ([#193](https://github.com/aws-amplify/amplify-codegen-ui/issues/193)) ([986fc5f](https://github.com/aws-amplify/amplify-codegen-ui/commit/986fc5ffe4ea68e38c3cf028228a9ce85a5fcd28))
- replacing dependency on helper for collections sort with inline sort function ([0d0df62](https://github.com/aws-amplify/amplify-codegen-ui/commit/0d0df626fe5b2b0bf028a569adf0faad1aa3f0aa))
- test-generate each case individually, add support for error cases as well ([46f65cc](https://github.com/aws-amplify/amplify-codegen-ui/commit/46f65ccef5cc748d7c86025c81573c64ed4afa3d))
- throw error on invalid script kind ([#133](https://github.com/aws-amplify/amplify-codegen-ui/issues/133)) ([ee3e79f](https://github.com/aws-amplify/amplify-codegen-ui/commit/ee3e79f351cf0d5151bf9bbaa048f05897bcb9b0))

# 0.7.0 (2021-11-09)

### Bug Fixes

- add children prop to all custom components ([#198](https://github.com/aws-amplify/amplify-codegen-ui/issues/198)) ([cbd96c9](https://github.com/aws-amplify/amplify-codegen-ui/commit/cbd96c908e03155521d37c20a81464e3ccb1274c))
- add data binding model imports ([#49](https://github.com/aws-amplify/amplify-codegen-ui/issues/49)) ([11e5c47](https://github.com/aws-amplify/amplify-codegen-ui/commit/11e5c473e28a7e23e9768f4d695c9b0bdc6fd5fd))
- adding support for additional component types for string and text types ([53d5537](https://github.com/aws-amplify/amplify-codegen-ui/commit/53d5537f3fd0eca1313d0cd39277ecf297988551))
- collection binding with no predicate ([#98](https://github.com/aws-amplify/amplify-codegen-ui/issues/98)) ([3e38fcc](https://github.com/aws-amplify/amplify-codegen-ui/commit/3e38fccf4c456d34f15b7ca050be6041ccb80417))
- collections with name items no longer redeclare the prop name ([#183](https://github.com/aws-amplify/amplify-codegen-ui/issues/183)) ([6ab4cdf](https://github.com/aws-amplify/amplify-codegen-ui/commit/6ab4cdf50b6e7b8962835422663f3152753e8aa3))
- createDatastorePredicate call was added ([#166](https://github.com/aws-amplify/amplify-codegen-ui/issues/166)) ([fbee20c](https://github.com/aws-amplify/amplify-codegen-ui/commit/fbee20c9aae661571653a1b0ee3801e67d02e123))
- dont pass all props to top level component ([ee9e1b4](https://github.com/aws-amplify/amplify-codegen-ui/commit/ee9e1b4a3ea9e9ddfc224e217edba4722365bb9a))
- enable esModuleInterop ([#85](https://github.com/aws-amplify/amplify-codegen-ui/issues/85)) ([32eac19](https://github.com/aws-amplify/amplify-codegen-ui/commit/32eac194dc4ba4fbb5571926698e5560a1a6b14d)), closes [#77](https://github.com/aws-amplify/amplify-codegen-ui/issues/77)
- ensuring we properly escape object keys with non-alpha characters ([5216eca](https://github.com/aws-amplify/amplify-codegen-ui/commit/5216ecad6c6f7c84dd8a25cfedbe9214b01dca76))
- fixing override indice bug, and adding e2e test ([c8500bf](https://github.com/aws-amplify/amplify-codegen-ui/commit/c8500bf06ff9be18715e834cd1f9f43942b9a0ea))
- getting cypress tests to run ([2a40055](https://github.com/aws-amplify/amplify-codegen-ui/commit/2a400557c416daab1ec2bd49d4800b6260648175))
- import custom component from local directory ([#182](https://github.com/aws-amplify/amplify-codegen-ui/issues/182)) ([5cd1076](https://github.com/aws-amplify/amplify-codegen-ui/commit/5cd1076a4cd7a0710c8be70cfcb70a5571979e6a))
- include typescript parser plugin ([8b4e765](https://github.com/aws-amplify/amplify-codegen-ui/commit/8b4e7655f244d08286e7ac15551221fe6bf06589))
- moving @aws-amplify/ui-react to a devDependency ([1aaa55d](https://github.com/aws-amplify/amplify-codegen-ui/commit/1aaa55d3eee0cd9a272888eada1f283cfc2a93c5))
- only import props type for top-level component ([c850b8c](https://github.com/aws-amplify/amplify-codegen-ui/commit/c850b8c5ad110421d2ad68898452e8fef5321cd8))
- only pass props to top level ([#63](https://github.com/aws-amplify/amplify-codegen-ui/issues/63)) ([5e59d9b](https://github.com/aws-amplify/amplify-codegen-ui/commit/5e59d9b861bff6b363a15fa3e6ee7f985ecc53dd)), closes [#58](https://github.com/aws-amplify/amplify-codegen-ui/issues/58)
- only use useDataStoreBinding when predicate is set ([#86](https://github.com/aws-amplify/amplify-codegen-ui/issues/86)) ([ec079f1](https://github.com/aws-amplify/amplify-codegen-ui/commit/ec079f14a50ec6e1132669761e6b924638e1c9ce)), closes [#84](https://github.com/aws-amplify/amplify-codegen-ui/issues/84)
- react render config ([#45](https://github.com/aws-amplify/amplify-codegen-ui/issues/45)) ([de74357](https://github.com/aws-amplify/amplify-codegen-ui/commit/de74357c2a323b11de1e464e7a47f43414d22409))
- remove Box to View mapping ([#144](https://github.com/aws-amplify/amplify-codegen-ui/issues/144)) ([74f860c](https://github.com/aws-amplify/amplify-codegen-ui/commit/74f860c18a7f8ee037753035002ecb8a051bb165))
- remove export modifier for renderComponentOnly ([#66](https://github.com/aws-amplify/amplify-codegen-ui/issues/66)) ([6e3d097](https://github.com/aws-amplify/amplify-codegen-ui/commit/6e3d097f217ecbdfb5165888e47eb0e6a16da8c4))
- remove extra component directories ([#71](https://github.com/aws-amplify/amplify-codegen-ui/issues/71)) ([e68d92b](https://github.com/aws-amplify/amplify-codegen-ui/commit/e68d92bdfa4d2f5d34f9cdf0ee70376cec5ce43b))
- remove text value from props and render bound property ([#70](https://github.com/aws-amplify/amplify-codegen-ui/issues/70)) ([aabed87](https://github.com/aws-amplify/amplify-codegen-ui/commit/aabed87e8091a5f875d6edd417744b058a769b4e)), closes [#67](https://github.com/aws-amplify/amplify-codegen-ui/issues/67)
- set correct import location for code sample ([#203](https://github.com/aws-amplify/amplify-codegen-ui/issues/203)) ([aabb39f](https://github.com/aws-amplify/amplify-codegen-ui/commit/aabb39f483d264fb26fc35b8405caed1bb25733c))
- setting license, author, homepage, and repo information ([e253a15](https://github.com/aws-amplify/amplify-codegen-ui/commit/e253a155f36c3451e7bc911225b8757b3dfd8b78))
- simple property binding default value ([#168](https://github.com/aws-amplify/amplify-codegen-ui/issues/168)) ([de84261](https://github.com/aws-amplify/amplify-codegen-ui/commit/de84261aebab5d9b570210c19cfb7a3d0214e1fe))
- **codegen-ui-react:** collection items props takes precedent ([#96](https://github.com/aws-amplify/amplify-codegen-ui/issues/96)) ([0149ca2](https://github.com/aws-amplify/amplify-codegen-ui/commit/0149ca28741969aae5c3c5442985c10ad065501c)), closes [#90](https://github.com/aws-amplify/amplify-codegen-ui/issues/90)
- **codegen-ui-react:** include all imports used in generated components ([#40](https://github.com/aws-amplify/amplify-codegen-ui/issues/40)) ([04f86bb](https://github.com/aws-amplify/amplify-codegen-ui/commit/04f86bb6a3146d578420b7e0bc3c525fa6572b6b))
- **codegen-ui-react:** include babel parser for prettier ([#83](https://github.com/aws-amplify/amplify-codegen-ui/issues/83)) ([e28551c](https://github.com/aws-amplify/amplify-codegen-ui/commit/e28551c96d0b22fd4f4135554291a94f5cfddea0))
- top level bindingProperties should be optional ([#61](https://github.com/aws-amplify/amplify-codegen-ui/issues/61)) ([b97d6fd](https://github.com/aws-amplify/amplify-codegen-ui/commit/b97d6fdeba5f2525e9a8ced50e5fdb0dfaff3f51))
- top level prop available as variables ([#62](https://github.com/aws-amplify/amplify-codegen-ui/issues/62)) ([788802e](https://github.com/aws-amplify/amplify-codegen-ui/commit/788802e7c0d2426a1c22460bf3bc240e94cbb0c7))
- update theme generation for new schema ([#142](https://github.com/aws-amplify/amplify-codegen-ui/issues/142)) ([a780893](https://github.com/aws-amplify/amplify-codegen-ui/commit/a7808934e3bb293068687526915a27a3ec8e7637))
- update theming to support ui@next ([92e9555](https://github.com/aws-amplify/amplify-codegen-ui/commit/92e95552603cde3c27512504aceb01b96031c97d))
- update unit tests per change from React.Element to React.ReactElement ([d1b782f](https://github.com/aws-amplify/amplify-codegen-ui/commit/d1b782fc4220976bfaa40a9693ed8a4a0109684b))
- updates to get concat and conditional working, and adding tests ([ef4600f](https://github.com/aws-amplify/amplify-codegen-ui/commit/ef4600f78934b031830f450566b476c2d98caeba))
- updating generated theme to work in test app ([113a594](https://github.com/aws-amplify/amplify-codegen-ui/commit/113a5941800263223571e56c5f3c80c7b8ab093a))
- updating override paths to support child indices ([278b6f8](https://github.com/aws-amplify/amplify-codegen-ui/commit/278b6f8ac7486b2d6815d204cd59834238e12712))
- updating unit tests after merge failure, bumping package-locks back to v2 ([1c49ac0](https://github.com/aws-amplify/amplify-codegen-ui/commit/1c49ac0e7f6c73dc7190ebcd4270858b16bbe327))
- use correct identifier when using useDataStoreBinding ([#104](https://github.com/aws-amplify/amplify-codegen-ui/issues/104)) ([ef93e45](https://github.com/aws-amplify/amplify-codegen-ui/commit/ef93e4583b68a6fe28d50663bd2c49d9889b8029))
- use temp package that does not break browser ([#136](https://github.com/aws-amplify/amplify-codegen-ui/issues/136)) ([12c9efb](https://github.com/aws-amplify/amplify-codegen-ui/commit/12c9efb673b186abe55dd643bae531d06ec8e368))

### Features

- add base action binding support ([#124](https://github.com/aws-amplify/amplify-codegen-ui/issues/124)) ([e6e60c0](https://github.com/aws-amplify/amplify-codegen-ui/commit/e6e60c0394036065991920622bc30caac00dafed))
- add conditional binding ([#102](https://github.com/aws-amplify/amplify-codegen-ui/issues/102)) ([8c66425](https://github.com/aws-amplify/amplify-codegen-ui/commit/8c664250058cf4703d4b2970bd72c9c269421901))
- add data binding predicate ([#57](https://github.com/aws-amplify/amplify-codegen-ui/issues/57)) ([d9e0216](https://github.com/aws-amplify/amplify-codegen-ui/commit/d9e0216c10f092ecda5fc1888f23bcbae60fe428))
- add notice to top of generated files ([#56](https://github.com/aws-amplify/amplify-codegen-ui/issues/56)) ([4f492cd](https://github.com/aws-amplify/amplify-codegen-ui/commit/4f492cdcd08757c7e23f3be86e7264b29e4e3a0d)), closes [#55](https://github.com/aws-amplify/amplify-codegen-ui/issues/55)
- add output configuration for studio codegen ([#32](https://github.com/aws-amplify/amplify-codegen-ui/issues/32)) ([8cb2de9](https://github.com/aws-amplify/amplify-codegen-ui/commit/8cb2de92fe397d4277ddec05422d4112e917cb78))
- add react attr generation for collectionBindingProperties ([#53](https://github.com/aws-amplify/amplify-codegen-ui/issues/53)) ([33390ed](https://github.com/aws-amplify/amplify-codegen-ui/commit/33390ed150c33a51de3808663b9fc3c46c998de5))
- add single record binding generation ([#51](https://github.com/aws-amplify/amplify-codegen-ui/issues/51)) ([454d754](https://github.com/aws-amplify/amplify-codegen-ui/commit/454d7541b5a699a0598f5fb160639050f104fc73))
- add support for most existing primitives ([#194](https://github.com/aws-amplify/amplify-codegen-ui/issues/194)) ([f1fe271](https://github.com/aws-amplify/amplify-codegen-ui/commit/f1fe271ff128a8683cd8f06da8aaa0c577a9d1fc))
- add type information to variants, and add e2e tests for variant rendering ([6ce2ac9](https://github.com/aws-amplify/amplify-codegen-ui/commit/6ce2ac9c0dadad4e25918712edf616e3c68732b3))
- add user specific attrs ([#107](https://github.com/aws-amplify/amplify-codegen-ui/issues/107)) ([67f34ac](https://github.com/aws-amplify/amplify-codegen-ui/commit/67f34acc6d13f1f9ebd283e20454480db393343f))
- adding gh workflow to test rendered goldens ([17e0ca0](https://github.com/aws-amplify/amplify-codegen-ui/commit/17e0ca09efdb27e7256b5d497956d11d969a9420))
- adding support for style variants in generated components ([bb41ac5](https://github.com/aws-amplify/amplify-codegen-ui/commit/bb41ac5a836f7b3bfb6aeb72308db362fdec127f))
- concatenation binding implementation ([#99](https://github.com/aws-amplify/amplify-codegen-ui/issues/99)) ([1bfd428](https://github.com/aws-amplify/amplify-codegen-ui/commit/1bfd4287acf7b2d5f410f045e17658929cb60eb3))
- extend base action binding types with navigation types and add test ([dbccfbd](https://github.com/aws-amplify/amplify-codegen-ui/commit/dbccfbd0466186c8cc09d71419504b0ee3abc4ff))
- output theme file ([#97](https://github.com/aws-amplify/amplify-codegen-ui/issues/97)) ([02508c1](https://github.com/aws-amplify/amplify-codegen-ui/commit/02508c1e8733ccee6a17551fed3b885619d70aa7))
- output type declaration ([#118](https://github.com/aws-amplify/amplify-codegen-ui/issues/118)) ([9db8bdc](https://github.com/aws-amplify/amplify-codegen-ui/commit/9db8bdc80f66567b3d4d9d94d4b4a6bb386af28d))
- parse string wrapped fixed values ([#155](https://github.com/aws-amplify/amplify-codegen-ui/issues/155)) ([3827f7c](https://github.com/aws-amplify/amplify-codegen-ui/commit/3827f7c612f782a36d2563c4203c20437e75bfdd))
- primitive children prop mapping ([#191](https://github.com/aws-amplify/amplify-codegen-ui/issues/191)) ([d6cf178](https://github.com/aws-amplify/amplify-codegen-ui/commit/d6cf17856b7efe6ae5c0eb448c690a54628d3f89))
- remove console log ([#76](https://github.com/aws-amplify/amplify-codegen-ui/issues/76)) ([73fac18](https://github.com/aws-amplify/amplify-codegen-ui/commit/73fac1864494929571ca8ece684a9caf9aab9360))
- remove string component type ([#193](https://github.com/aws-amplify/amplify-codegen-ui/issues/193)) ([986fc5f](https://github.com/aws-amplify/amplify-codegen-ui/commit/986fc5ffe4ea68e38c3cf028228a9ce85a5fcd28))
- replacing dependency on helper for collections sort with inline sort function ([0d0df62](https://github.com/aws-amplify/amplify-codegen-ui/commit/0d0df626fe5b2b0bf028a569adf0faad1aa3f0aa))
- test-generate each case individually, add support for error cases as well ([46f65cc](https://github.com/aws-amplify/amplify-codegen-ui/commit/46f65ccef5cc748d7c86025c81573c64ed4afa3d))
- throw error on invalid script kind ([#133](https://github.com/aws-amplify/amplify-codegen-ui/issues/133)) ([ee3e79f](https://github.com/aws-amplify/amplify-codegen-ui/commit/ee3e79f351cf0d5151bf9bbaa048f05897bcb9b0))

# 0.6.0 (2021-11-04)

### Bug Fixes

- add children prop to all custom components ([#198](https://github.com/aws-amplify/amplify-codegen-ui/issues/198)) ([cbd96c9](https://github.com/aws-amplify/amplify-codegen-ui/commit/cbd96c908e03155521d37c20a81464e3ccb1274c))
- add data binding model imports ([#49](https://github.com/aws-amplify/amplify-codegen-ui/issues/49)) ([11e5c47](https://github.com/aws-amplify/amplify-codegen-ui/commit/11e5c473e28a7e23e9768f4d695c9b0bdc6fd5fd))
- adding support for additional component types for string and text types ([53d5537](https://github.com/aws-amplify/amplify-codegen-ui/commit/53d5537f3fd0eca1313d0cd39277ecf297988551))
- collection binding with no predicate ([#98](https://github.com/aws-amplify/amplify-codegen-ui/issues/98)) ([3e38fcc](https://github.com/aws-amplify/amplify-codegen-ui/commit/3e38fccf4c456d34f15b7ca050be6041ccb80417))
- collections with name items no longer redeclare the prop name ([#183](https://github.com/aws-amplify/amplify-codegen-ui/issues/183)) ([6ab4cdf](https://github.com/aws-amplify/amplify-codegen-ui/commit/6ab4cdf50b6e7b8962835422663f3152753e8aa3))
- createDatastorePredicate call was added ([#166](https://github.com/aws-amplify/amplify-codegen-ui/issues/166)) ([fbee20c](https://github.com/aws-amplify/amplify-codegen-ui/commit/fbee20c9aae661571653a1b0ee3801e67d02e123))
- dont pass all props to top level component ([ee9e1b4](https://github.com/aws-amplify/amplify-codegen-ui/commit/ee9e1b4a3ea9e9ddfc224e217edba4722365bb9a))
- enable esModuleInterop ([#85](https://github.com/aws-amplify/amplify-codegen-ui/issues/85)) ([32eac19](https://github.com/aws-amplify/amplify-codegen-ui/commit/32eac194dc4ba4fbb5571926698e5560a1a6b14d)), closes [#77](https://github.com/aws-amplify/amplify-codegen-ui/issues/77)
- ensuring we properly escape object keys with non-alpha characters ([5216eca](https://github.com/aws-amplify/amplify-codegen-ui/commit/5216ecad6c6f7c84dd8a25cfedbe9214b01dca76))
- fixing override indice bug, and adding e2e test ([c8500bf](https://github.com/aws-amplify/amplify-codegen-ui/commit/c8500bf06ff9be18715e834cd1f9f43942b9a0ea))
- getting cypress tests to run ([2a40055](https://github.com/aws-amplify/amplify-codegen-ui/commit/2a400557c416daab1ec2bd49d4800b6260648175))
- import custom component from local directory ([#182](https://github.com/aws-amplify/amplify-codegen-ui/issues/182)) ([5cd1076](https://github.com/aws-amplify/amplify-codegen-ui/commit/5cd1076a4cd7a0710c8be70cfcb70a5571979e6a))
- include typescript parser plugin ([8b4e765](https://github.com/aws-amplify/amplify-codegen-ui/commit/8b4e7655f244d08286e7ac15551221fe6bf06589))
- moving @aws-amplify/ui-react to a devDependency ([1aaa55d](https://github.com/aws-amplify/amplify-codegen-ui/commit/1aaa55d3eee0cd9a272888eada1f283cfc2a93c5))
- only import props type for top-level component ([c850b8c](https://github.com/aws-amplify/amplify-codegen-ui/commit/c850b8c5ad110421d2ad68898452e8fef5321cd8))
- only pass props to top level ([#63](https://github.com/aws-amplify/amplify-codegen-ui/issues/63)) ([5e59d9b](https://github.com/aws-amplify/amplify-codegen-ui/commit/5e59d9b861bff6b363a15fa3e6ee7f985ecc53dd)), closes [#58](https://github.com/aws-amplify/amplify-codegen-ui/issues/58)
- only use useDataStoreBinding when predicate is set ([#86](https://github.com/aws-amplify/amplify-codegen-ui/issues/86)) ([ec079f1](https://github.com/aws-amplify/amplify-codegen-ui/commit/ec079f14a50ec6e1132669761e6b924638e1c9ce)), closes [#84](https://github.com/aws-amplify/amplify-codegen-ui/issues/84)
- react render config ([#45](https://github.com/aws-amplify/amplify-codegen-ui/issues/45)) ([de74357](https://github.com/aws-amplify/amplify-codegen-ui/commit/de74357c2a323b11de1e464e7a47f43414d22409))
- remove Box to View mapping ([#144](https://github.com/aws-amplify/amplify-codegen-ui/issues/144)) ([74f860c](https://github.com/aws-amplify/amplify-codegen-ui/commit/74f860c18a7f8ee037753035002ecb8a051bb165))
- remove export modifier for renderComponentOnly ([#66](https://github.com/aws-amplify/amplify-codegen-ui/issues/66)) ([6e3d097](https://github.com/aws-amplify/amplify-codegen-ui/commit/6e3d097f217ecbdfb5165888e47eb0e6a16da8c4))
- remove extra component directories ([#71](https://github.com/aws-amplify/amplify-codegen-ui/issues/71)) ([e68d92b](https://github.com/aws-amplify/amplify-codegen-ui/commit/e68d92bdfa4d2f5d34f9cdf0ee70376cec5ce43b))
- remove text value from props and render bound property ([#70](https://github.com/aws-amplify/amplify-codegen-ui/issues/70)) ([aabed87](https://github.com/aws-amplify/amplify-codegen-ui/commit/aabed87e8091a5f875d6edd417744b058a769b4e)), closes [#67](https://github.com/aws-amplify/amplify-codegen-ui/issues/67)
- setting license, author, homepage, and repo information ([e253a15](https://github.com/aws-amplify/amplify-codegen-ui/commit/e253a155f36c3451e7bc911225b8757b3dfd8b78))
- simple property binding default value ([#168](https://github.com/aws-amplify/amplify-codegen-ui/issues/168)) ([de84261](https://github.com/aws-amplify/amplify-codegen-ui/commit/de84261aebab5d9b570210c19cfb7a3d0214e1fe))
- **codegen-ui-react:** collection items props takes precedent ([#96](https://github.com/aws-amplify/amplify-codegen-ui/issues/96)) ([0149ca2](https://github.com/aws-amplify/amplify-codegen-ui/commit/0149ca28741969aae5c3c5442985c10ad065501c)), closes [#90](https://github.com/aws-amplify/amplify-codegen-ui/issues/90)
- **codegen-ui-react:** include all imports used in generated components ([#40](https://github.com/aws-amplify/amplify-codegen-ui/issues/40)) ([04f86bb](https://github.com/aws-amplify/amplify-codegen-ui/commit/04f86bb6a3146d578420b7e0bc3c525fa6572b6b))
- **codegen-ui-react:** include babel parser for prettier ([#83](https://github.com/aws-amplify/amplify-codegen-ui/issues/83)) ([e28551c](https://github.com/aws-amplify/amplify-codegen-ui/commit/e28551c96d0b22fd4f4135554291a94f5cfddea0))
- top level bindingProperties should be optional ([#61](https://github.com/aws-amplify/amplify-codegen-ui/issues/61)) ([b97d6fd](https://github.com/aws-amplify/amplify-codegen-ui/commit/b97d6fdeba5f2525e9a8ced50e5fdb0dfaff3f51))
- top level prop available as variables ([#62](https://github.com/aws-amplify/amplify-codegen-ui/issues/62)) ([788802e](https://github.com/aws-amplify/amplify-codegen-ui/commit/788802e7c0d2426a1c22460bf3bc240e94cbb0c7))
- update theme generation for new schema ([#142](https://github.com/aws-amplify/amplify-codegen-ui/issues/142)) ([a780893](https://github.com/aws-amplify/amplify-codegen-ui/commit/a7808934e3bb293068687526915a27a3ec8e7637))
- update theming to support ui@next ([92e9555](https://github.com/aws-amplify/amplify-codegen-ui/commit/92e95552603cde3c27512504aceb01b96031c97d))
- update unit tests per change from React.Element to React.ReactElement ([d1b782f](https://github.com/aws-amplify/amplify-codegen-ui/commit/d1b782fc4220976bfaa40a9693ed8a4a0109684b))
- updates to get concat and conditional working, and adding tests ([ef4600f](https://github.com/aws-amplify/amplify-codegen-ui/commit/ef4600f78934b031830f450566b476c2d98caeba))
- updating generated theme to work in test app ([113a594](https://github.com/aws-amplify/amplify-codegen-ui/commit/113a5941800263223571e56c5f3c80c7b8ab093a))
- updating override paths to support child indices ([278b6f8](https://github.com/aws-amplify/amplify-codegen-ui/commit/278b6f8ac7486b2d6815d204cd59834238e12712))
- updating unit tests after merge failure, bumping package-locks back to v2 ([1c49ac0](https://github.com/aws-amplify/amplify-codegen-ui/commit/1c49ac0e7f6c73dc7190ebcd4270858b16bbe327))
- use correct identifier when using useDataStoreBinding ([#104](https://github.com/aws-amplify/amplify-codegen-ui/issues/104)) ([ef93e45](https://github.com/aws-amplify/amplify-codegen-ui/commit/ef93e4583b68a6fe28d50663bd2c49d9889b8029))
- use temp package that does not break browser ([#136](https://github.com/aws-amplify/amplify-codegen-ui/issues/136)) ([12c9efb](https://github.com/aws-amplify/amplify-codegen-ui/commit/12c9efb673b186abe55dd643bae531d06ec8e368))

### Features

- add base action binding support ([#124](https://github.com/aws-amplify/amplify-codegen-ui/issues/124)) ([e6e60c0](https://github.com/aws-amplify/amplify-codegen-ui/commit/e6e60c0394036065991920622bc30caac00dafed))
- add conditional binding ([#102](https://github.com/aws-amplify/amplify-codegen-ui/issues/102)) ([8c66425](https://github.com/aws-amplify/amplify-codegen-ui/commit/8c664250058cf4703d4b2970bd72c9c269421901))
- add data binding predicate ([#57](https://github.com/aws-amplify/amplify-codegen-ui/issues/57)) ([d9e0216](https://github.com/aws-amplify/amplify-codegen-ui/commit/d9e0216c10f092ecda5fc1888f23bcbae60fe428))
- add notice to top of generated files ([#56](https://github.com/aws-amplify/amplify-codegen-ui/issues/56)) ([4f492cd](https://github.com/aws-amplify/amplify-codegen-ui/commit/4f492cdcd08757c7e23f3be86e7264b29e4e3a0d)), closes [#55](https://github.com/aws-amplify/amplify-codegen-ui/issues/55)
- add output configuration for studio codegen ([#32](https://github.com/aws-amplify/amplify-codegen-ui/issues/32)) ([8cb2de9](https://github.com/aws-amplify/amplify-codegen-ui/commit/8cb2de92fe397d4277ddec05422d4112e917cb78))
- add react attr generation for collectionBindingProperties ([#53](https://github.com/aws-amplify/amplify-codegen-ui/issues/53)) ([33390ed](https://github.com/aws-amplify/amplify-codegen-ui/commit/33390ed150c33a51de3808663b9fc3c46c998de5))
- add single record binding generation ([#51](https://github.com/aws-amplify/amplify-codegen-ui/issues/51)) ([454d754](https://github.com/aws-amplify/amplify-codegen-ui/commit/454d7541b5a699a0598f5fb160639050f104fc73))
- add type information to variants, and add e2e tests for variant rendering ([6ce2ac9](https://github.com/aws-amplify/amplify-codegen-ui/commit/6ce2ac9c0dadad4e25918712edf616e3c68732b3))
- add user specific attrs ([#107](https://github.com/aws-amplify/amplify-codegen-ui/issues/107)) ([67f34ac](https://github.com/aws-amplify/amplify-codegen-ui/commit/67f34acc6d13f1f9ebd283e20454480db393343f))
- adding gh workflow to test rendered goldens ([17e0ca0](https://github.com/aws-amplify/amplify-codegen-ui/commit/17e0ca09efdb27e7256b5d497956d11d969a9420))
- adding support for style variants in generated components ([bb41ac5](https://github.com/aws-amplify/amplify-codegen-ui/commit/bb41ac5a836f7b3bfb6aeb72308db362fdec127f))
- concatenation binding implementation ([#99](https://github.com/aws-amplify/amplify-codegen-ui/issues/99)) ([1bfd428](https://github.com/aws-amplify/amplify-codegen-ui/commit/1bfd4287acf7b2d5f410f045e17658929cb60eb3))
- extend base action binding types with navigation types and add test ([dbccfbd](https://github.com/aws-amplify/amplify-codegen-ui/commit/dbccfbd0466186c8cc09d71419504b0ee3abc4ff))
- output theme file ([#97](https://github.com/aws-amplify/amplify-codegen-ui/issues/97)) ([02508c1](https://github.com/aws-amplify/amplify-codegen-ui/commit/02508c1e8733ccee6a17551fed3b885619d70aa7))
- output type declaration ([#118](https://github.com/aws-amplify/amplify-codegen-ui/issues/118)) ([9db8bdc](https://github.com/aws-amplify/amplify-codegen-ui/commit/9db8bdc80f66567b3d4d9d94d4b4a6bb386af28d))
- parse string wrapped fixed values ([#155](https://github.com/aws-amplify/amplify-codegen-ui/issues/155)) ([3827f7c](https://github.com/aws-amplify/amplify-codegen-ui/commit/3827f7c612f782a36d2563c4203c20437e75bfdd))
- remove console log ([#76](https://github.com/aws-amplify/amplify-codegen-ui/issues/76)) ([73fac18](https://github.com/aws-amplify/amplify-codegen-ui/commit/73fac1864494929571ca8ece684a9caf9aab9360))
- replacing dependency on helper for collections sort with inline sort function ([0d0df62](https://github.com/aws-amplify/amplify-codegen-ui/commit/0d0df626fe5b2b0bf028a569adf0faad1aa3f0aa))
- throw error on invalid script kind ([#133](https://github.com/aws-amplify/amplify-codegen-ui/issues/133)) ([ee3e79f](https://github.com/aws-amplify/amplify-codegen-ui/commit/ee3e79f351cf0d5151bf9bbaa048f05897bcb9b0))

# 0.5.0 (2021-11-04)

### Bug Fixes

- add data binding model imports ([#49](https://github.com/aws-amplify/amplify-codegen-ui/issues/49)) ([11e5c47](https://github.com/aws-amplify/amplify-codegen-ui/commit/11e5c473e28a7e23e9768f4d695c9b0bdc6fd5fd))
- adding support for additional component types for string and text types ([53d5537](https://github.com/aws-amplify/amplify-codegen-ui/commit/53d5537f3fd0eca1313d0cd39277ecf297988551))
- collection binding with no predicate ([#98](https://github.com/aws-amplify/amplify-codegen-ui/issues/98)) ([3e38fcc](https://github.com/aws-amplify/amplify-codegen-ui/commit/3e38fccf4c456d34f15b7ca050be6041ccb80417))
- collections with name items no longer redeclare the prop name ([#183](https://github.com/aws-amplify/amplify-codegen-ui/issues/183)) ([6ab4cdf](https://github.com/aws-amplify/amplify-codegen-ui/commit/6ab4cdf50b6e7b8962835422663f3152753e8aa3))
- createDatastorePredicate call was added ([#166](https://github.com/aws-amplify/amplify-codegen-ui/issues/166)) ([fbee20c](https://github.com/aws-amplify/amplify-codegen-ui/commit/fbee20c9aae661571653a1b0ee3801e67d02e123))
- dont pass all props to top level component ([ee9e1b4](https://github.com/aws-amplify/amplify-codegen-ui/commit/ee9e1b4a3ea9e9ddfc224e217edba4722365bb9a))
- enable esModuleInterop ([#85](https://github.com/aws-amplify/amplify-codegen-ui/issues/85)) ([32eac19](https://github.com/aws-amplify/amplify-codegen-ui/commit/32eac194dc4ba4fbb5571926698e5560a1a6b14d)), closes [#77](https://github.com/aws-amplify/amplify-codegen-ui/issues/77)
- ensuring we properly escape object keys with non-alpha characters ([5216eca](https://github.com/aws-amplify/amplify-codegen-ui/commit/5216ecad6c6f7c84dd8a25cfedbe9214b01dca76))
- getting cypress tests to run ([2a40055](https://github.com/aws-amplify/amplify-codegen-ui/commit/2a400557c416daab1ec2bd49d4800b6260648175))
- import custom component from local directory ([#182](https://github.com/aws-amplify/amplify-codegen-ui/issues/182)) ([5cd1076](https://github.com/aws-amplify/amplify-codegen-ui/commit/5cd1076a4cd7a0710c8be70cfcb70a5571979e6a))
- include typescript parser plugin ([8b4e765](https://github.com/aws-amplify/amplify-codegen-ui/commit/8b4e7655f244d08286e7ac15551221fe6bf06589))
- moving @aws-amplify/ui-react to a devDependency ([1aaa55d](https://github.com/aws-amplify/amplify-codegen-ui/commit/1aaa55d3eee0cd9a272888eada1f283cfc2a93c5))
- only import props type for top-level component ([c850b8c](https://github.com/aws-amplify/amplify-codegen-ui/commit/c850b8c5ad110421d2ad68898452e8fef5321cd8))
- only pass props to top level ([#63](https://github.com/aws-amplify/amplify-codegen-ui/issues/63)) ([5e59d9b](https://github.com/aws-amplify/amplify-codegen-ui/commit/5e59d9b861bff6b363a15fa3e6ee7f985ecc53dd)), closes [#58](https://github.com/aws-amplify/amplify-codegen-ui/issues/58)
- only use useDataStoreBinding when predicate is set ([#86](https://github.com/aws-amplify/amplify-codegen-ui/issues/86)) ([ec079f1](https://github.com/aws-amplify/amplify-codegen-ui/commit/ec079f14a50ec6e1132669761e6b924638e1c9ce)), closes [#84](https://github.com/aws-amplify/amplify-codegen-ui/issues/84)
- react render config ([#45](https://github.com/aws-amplify/amplify-codegen-ui/issues/45)) ([de74357](https://github.com/aws-amplify/amplify-codegen-ui/commit/de74357c2a323b11de1e464e7a47f43414d22409))
- remove Box to View mapping ([#144](https://github.com/aws-amplify/amplify-codegen-ui/issues/144)) ([74f860c](https://github.com/aws-amplify/amplify-codegen-ui/commit/74f860c18a7f8ee037753035002ecb8a051bb165))
- remove export modifier for renderComponentOnly ([#66](https://github.com/aws-amplify/amplify-codegen-ui/issues/66)) ([6e3d097](https://github.com/aws-amplify/amplify-codegen-ui/commit/6e3d097f217ecbdfb5165888e47eb0e6a16da8c4))
- remove extra component directories ([#71](https://github.com/aws-amplify/amplify-codegen-ui/issues/71)) ([e68d92b](https://github.com/aws-amplify/amplify-codegen-ui/commit/e68d92bdfa4d2f5d34f9cdf0ee70376cec5ce43b))
- remove text value from props and render bound property ([#70](https://github.com/aws-amplify/amplify-codegen-ui/issues/70)) ([aabed87](https://github.com/aws-amplify/amplify-codegen-ui/commit/aabed87e8091a5f875d6edd417744b058a769b4e)), closes [#67](https://github.com/aws-amplify/amplify-codegen-ui/issues/67)
- setting license, author, homepage, and repo information ([e253a15](https://github.com/aws-amplify/amplify-codegen-ui/commit/e253a155f36c3451e7bc911225b8757b3dfd8b78))
- simple property binding default value ([#168](https://github.com/aws-amplify/amplify-codegen-ui/issues/168)) ([de84261](https://github.com/aws-amplify/amplify-codegen-ui/commit/de84261aebab5d9b570210c19cfb7a3d0214e1fe))
- **codegen-ui-react:** collection items props takes precedent ([#96](https://github.com/aws-amplify/amplify-codegen-ui/issues/96)) ([0149ca2](https://github.com/aws-amplify/amplify-codegen-ui/commit/0149ca28741969aae5c3c5442985c10ad065501c)), closes [#90](https://github.com/aws-amplify/amplify-codegen-ui/issues/90)
- **codegen-ui-react:** include all imports used in generated components ([#40](https://github.com/aws-amplify/amplify-codegen-ui/issues/40)) ([04f86bb](https://github.com/aws-amplify/amplify-codegen-ui/commit/04f86bb6a3146d578420b7e0bc3c525fa6572b6b))
- **codegen-ui-react:** include babel parser for prettier ([#83](https://github.com/aws-amplify/amplify-codegen-ui/issues/83)) ([e28551c](https://github.com/aws-amplify/amplify-codegen-ui/commit/e28551c96d0b22fd4f4135554291a94f5cfddea0))
- top level bindingProperties should be optional ([#61](https://github.com/aws-amplify/amplify-codegen-ui/issues/61)) ([b97d6fd](https://github.com/aws-amplify/amplify-codegen-ui/commit/b97d6fdeba5f2525e9a8ced50e5fdb0dfaff3f51))
- top level prop available as variables ([#62](https://github.com/aws-amplify/amplify-codegen-ui/issues/62)) ([788802e](https://github.com/aws-amplify/amplify-codegen-ui/commit/788802e7c0d2426a1c22460bf3bc240e94cbb0c7))
- update theme generation for new schema ([#142](https://github.com/aws-amplify/amplify-codegen-ui/issues/142)) ([a780893](https://github.com/aws-amplify/amplify-codegen-ui/commit/a7808934e3bb293068687526915a27a3ec8e7637))
- update theming to support ui@next ([92e9555](https://github.com/aws-amplify/amplify-codegen-ui/commit/92e95552603cde3c27512504aceb01b96031c97d))
- update unit tests per change from React.Element to React.ReactElement ([d1b782f](https://github.com/aws-amplify/amplify-codegen-ui/commit/d1b782fc4220976bfaa40a9693ed8a4a0109684b))
- updates to get concat and conditional working, and adding tests ([ef4600f](https://github.com/aws-amplify/amplify-codegen-ui/commit/ef4600f78934b031830f450566b476c2d98caeba))
- updating generated theme to work in test app ([113a594](https://github.com/aws-amplify/amplify-codegen-ui/commit/113a5941800263223571e56c5f3c80c7b8ab093a))
- updating override paths to support child indices ([278b6f8](https://github.com/aws-amplify/amplify-codegen-ui/commit/278b6f8ac7486b2d6815d204cd59834238e12712))
- updating unit tests after merge failure, bumping package-locks back to v2 ([1c49ac0](https://github.com/aws-amplify/amplify-codegen-ui/commit/1c49ac0e7f6c73dc7190ebcd4270858b16bbe327))
- use correct identifier when using useDataStoreBinding ([#104](https://github.com/aws-amplify/amplify-codegen-ui/issues/104)) ([ef93e45](https://github.com/aws-amplify/amplify-codegen-ui/commit/ef93e4583b68a6fe28d50663bd2c49d9889b8029))
- use temp package that does not break browser ([#136](https://github.com/aws-amplify/amplify-codegen-ui/issues/136)) ([12c9efb](https://github.com/aws-amplify/amplify-codegen-ui/commit/12c9efb673b186abe55dd643bae531d06ec8e368))

### Features

- add base action binding support ([#124](https://github.com/aws-amplify/amplify-codegen-ui/issues/124)) ([e6e60c0](https://github.com/aws-amplify/amplify-codegen-ui/commit/e6e60c0394036065991920622bc30caac00dafed))
- add conditional binding ([#102](https://github.com/aws-amplify/amplify-codegen-ui/issues/102)) ([8c66425](https://github.com/aws-amplify/amplify-codegen-ui/commit/8c664250058cf4703d4b2970bd72c9c269421901))
- add data binding predicate ([#57](https://github.com/aws-amplify/amplify-codegen-ui/issues/57)) ([d9e0216](https://github.com/aws-amplify/amplify-codegen-ui/commit/d9e0216c10f092ecda5fc1888f23bcbae60fe428))
- add notice to top of generated files ([#56](https://github.com/aws-amplify/amplify-codegen-ui/issues/56)) ([4f492cd](https://github.com/aws-amplify/amplify-codegen-ui/commit/4f492cdcd08757c7e23f3be86e7264b29e4e3a0d)), closes [#55](https://github.com/aws-amplify/amplify-codegen-ui/issues/55)
- add output configuration for studio codegen ([#32](https://github.com/aws-amplify/amplify-codegen-ui/issues/32)) ([8cb2de9](https://github.com/aws-amplify/amplify-codegen-ui/commit/8cb2de92fe397d4277ddec05422d4112e917cb78))
- add react attr generation for collectionBindingProperties ([#53](https://github.com/aws-amplify/amplify-codegen-ui/issues/53)) ([33390ed](https://github.com/aws-amplify/amplify-codegen-ui/commit/33390ed150c33a51de3808663b9fc3c46c998de5))
- add single record binding generation ([#51](https://github.com/aws-amplify/amplify-codegen-ui/issues/51)) ([454d754](https://github.com/aws-amplify/amplify-codegen-ui/commit/454d7541b5a699a0598f5fb160639050f104fc73))
- add type information to variants, and add e2e tests for variant rendering ([6ce2ac9](https://github.com/aws-amplify/amplify-codegen-ui/commit/6ce2ac9c0dadad4e25918712edf616e3c68732b3))
- add user specific attrs ([#107](https://github.com/aws-amplify/amplify-codegen-ui/issues/107)) ([67f34ac](https://github.com/aws-amplify/amplify-codegen-ui/commit/67f34acc6d13f1f9ebd283e20454480db393343f))
- adding gh workflow to test rendered goldens ([17e0ca0](https://github.com/aws-amplify/amplify-codegen-ui/commit/17e0ca09efdb27e7256b5d497956d11d969a9420))
- adding support for style variants in generated components ([bb41ac5](https://github.com/aws-amplify/amplify-codegen-ui/commit/bb41ac5a836f7b3bfb6aeb72308db362fdec127f))
- concatenation binding implementation ([#99](https://github.com/aws-amplify/amplify-codegen-ui/issues/99)) ([1bfd428](https://github.com/aws-amplify/amplify-codegen-ui/commit/1bfd4287acf7b2d5f410f045e17658929cb60eb3))
- extend base action binding types with navigation types and add test ([dbccfbd](https://github.com/aws-amplify/amplify-codegen-ui/commit/dbccfbd0466186c8cc09d71419504b0ee3abc4ff))
- output theme file ([#97](https://github.com/aws-amplify/amplify-codegen-ui/issues/97)) ([02508c1](https://github.com/aws-amplify/amplify-codegen-ui/commit/02508c1e8733ccee6a17551fed3b885619d70aa7))
- output type declaration ([#118](https://github.com/aws-amplify/amplify-codegen-ui/issues/118)) ([9db8bdc](https://github.com/aws-amplify/amplify-codegen-ui/commit/9db8bdc80f66567b3d4d9d94d4b4a6bb386af28d))
- parse string wrapped fixed values ([#155](https://github.com/aws-amplify/amplify-codegen-ui/issues/155)) ([3827f7c](https://github.com/aws-amplify/amplify-codegen-ui/commit/3827f7c612f782a36d2563c4203c20437e75bfdd))
- remove console log ([#76](https://github.com/aws-amplify/amplify-codegen-ui/issues/76)) ([73fac18](https://github.com/aws-amplify/amplify-codegen-ui/commit/73fac1864494929571ca8ece684a9caf9aab9360))
- replacing dependency on helper for collections sort with inline sort function ([0d0df62](https://github.com/aws-amplify/amplify-codegen-ui/commit/0d0df626fe5b2b0bf028a569adf0faad1aa3f0aa))
- throw error on invalid script kind ([#133](https://github.com/aws-amplify/amplify-codegen-ui/issues/133)) ([ee3e79f](https://github.com/aws-amplify/amplify-codegen-ui/commit/ee3e79f351cf0d5151bf9bbaa048f05897bcb9b0))

## [0.2.1](https://github.com/aws-amplify/amplify-codegen-ui/compare/@amzn/codegen-ui-react@0.2.0...@amzn/codegen-ui-react@0.2.1) (2021-10-28)

### Bug Fixes

- createDatastorePredicate call was added ([#166](https://github.com/aws-amplify/amplify-codegen-ui/issues/166)) ([fbee20c](https://github.com/aws-amplify/amplify-codegen-ui/commit/fbee20c9aae661571653a1b0ee3801e67d02e123))
- simple property binding default value ([#168](https://github.com/aws-amplify/amplify-codegen-ui/issues/168)) ([de84261](https://github.com/aws-amplify/amplify-codegen-ui/commit/de84261aebab5d9b570210c19cfb7a3d0214e1fe))

# 0.2.0 (2021-10-27)

### Bug Fixes

- add data binding model imports ([#49](https://github.com/aws-amplify/amplify-codegen-ui/issues/49)) ([11e5c47](https://github.com/aws-amplify/amplify-codegen-ui/commit/11e5c473e28a7e23e9768f4d695c9b0bdc6fd5fd))
- adding support for additional component types for string and text types ([53d5537](https://github.com/aws-amplify/amplify-codegen-ui/commit/53d5537f3fd0eca1313d0cd39277ecf297988551))
- collection binding with no predicate ([#98](https://github.com/aws-amplify/amplify-codegen-ui/issues/98)) ([3e38fcc](https://github.com/aws-amplify/amplify-codegen-ui/commit/3e38fccf4c456d34f15b7ca050be6041ccb80417))
- dont pass all props to top level component ([ee9e1b4](https://github.com/aws-amplify/amplify-codegen-ui/commit/ee9e1b4a3ea9e9ddfc224e217edba4722365bb9a))
- enable esModuleInterop ([#85](https://github.com/aws-amplify/amplify-codegen-ui/issues/85)) ([32eac19](https://github.com/aws-amplify/amplify-codegen-ui/commit/32eac194dc4ba4fbb5571926698e5560a1a6b14d)), closes [#77](https://github.com/aws-amplify/amplify-codegen-ui/issues/77)
- getting cypress tests to run ([2a40055](https://github.com/aws-amplify/amplify-codegen-ui/commit/2a400557c416daab1ec2bd49d4800b6260648175))
- include typescript parser plugin ([8b4e765](https://github.com/aws-amplify/amplify-codegen-ui/commit/8b4e7655f244d08286e7ac15551221fe6bf06589))
- moving @aws-amplify/ui-react to a devDependency ([1aaa55d](https://github.com/aws-amplify/amplify-codegen-ui/commit/1aaa55d3eee0cd9a272888eada1f283cfc2a93c5))
- only pass props to top level ([#63](https://github.com/aws-amplify/amplify-codegen-ui/issues/63)) ([5e59d9b](https://github.com/aws-amplify/amplify-codegen-ui/commit/5e59d9b861bff6b363a15fa3e6ee7f985ecc53dd)), closes [#58](https://github.com/aws-amplify/amplify-codegen-ui/issues/58)
- only use useDataStoreBinding when predicate is set ([#86](https://github.com/aws-amplify/amplify-codegen-ui/issues/86)) ([ec079f1](https://github.com/aws-amplify/amplify-codegen-ui/commit/ec079f14a50ec6e1132669761e6b924638e1c9ce)), closes [#84](https://github.com/aws-amplify/amplify-codegen-ui/issues/84)
- react render config ([#45](https://github.com/aws-amplify/amplify-codegen-ui/issues/45)) ([de74357](https://github.com/aws-amplify/amplify-codegen-ui/commit/de74357c2a323b11de1e464e7a47f43414d22409))
- remove Box to View mapping ([#144](https://github.com/aws-amplify/amplify-codegen-ui/issues/144)) ([74f860c](https://github.com/aws-amplify/amplify-codegen-ui/commit/74f860c18a7f8ee037753035002ecb8a051bb165))
- remove export modifier for renderComponentOnly ([#66](https://github.com/aws-amplify/amplify-codegen-ui/issues/66)) ([6e3d097](https://github.com/aws-amplify/amplify-codegen-ui/commit/6e3d097f217ecbdfb5165888e47eb0e6a16da8c4))
- remove extra component directories ([#71](https://github.com/aws-amplify/amplify-codegen-ui/issues/71)) ([e68d92b](https://github.com/aws-amplify/amplify-codegen-ui/commit/e68d92bdfa4d2f5d34f9cdf0ee70376cec5ce43b))
- remove text value from props and render bound property ([#70](https://github.com/aws-amplify/amplify-codegen-ui/issues/70)) ([aabed87](https://github.com/aws-amplify/amplify-codegen-ui/commit/aabed87e8091a5f875d6edd417744b058a769b4e)), closes [#67](https://github.com/aws-amplify/amplify-codegen-ui/issues/67)
- setting license, author, homepage, and repo information ([e253a15](https://github.com/aws-amplify/amplify-codegen-ui/commit/e253a155f36c3451e7bc911225b8757b3dfd8b78))
- **codegen-ui-react:** collection items props takes precedent ([#96](https://github.com/aws-amplify/amplify-codegen-ui/issues/96)) ([0149ca2](https://github.com/aws-amplify/amplify-codegen-ui/commit/0149ca28741969aae5c3c5442985c10ad065501c)), closes [#90](https://github.com/aws-amplify/amplify-codegen-ui/issues/90)
- **codegen-ui-react:** include all imports used in generated components ([#40](https://github.com/aws-amplify/amplify-codegen-ui/issues/40)) ([04f86bb](https://github.com/aws-amplify/amplify-codegen-ui/commit/04f86bb6a3146d578420b7e0bc3c525fa6572b6b))
- **codegen-ui-react:** include babel parser for prettier ([#83](https://github.com/aws-amplify/amplify-codegen-ui/issues/83)) ([e28551c](https://github.com/aws-amplify/amplify-codegen-ui/commit/e28551c96d0b22fd4f4135554291a94f5cfddea0))
- top level bindingProperties should be optional ([#61](https://github.com/aws-amplify/amplify-codegen-ui/issues/61)) ([b97d6fd](https://github.com/aws-amplify/amplify-codegen-ui/commit/b97d6fdeba5f2525e9a8ced50e5fdb0dfaff3f51))
- top level prop available as variables ([#62](https://github.com/aws-amplify/amplify-codegen-ui/issues/62)) ([788802e](https://github.com/aws-amplify/amplify-codegen-ui/commit/788802e7c0d2426a1c22460bf3bc240e94cbb0c7))
- update theme generation for new schema ([#142](https://github.com/aws-amplify/amplify-codegen-ui/issues/142)) ([a780893](https://github.com/aws-amplify/amplify-codegen-ui/commit/a7808934e3bb293068687526915a27a3ec8e7637))
- update theming to support ui@next ([92e9555](https://github.com/aws-amplify/amplify-codegen-ui/commit/92e95552603cde3c27512504aceb01b96031c97d))
- update unit tests per change from React.Element to React.ReactElement ([d1b782f](https://github.com/aws-amplify/amplify-codegen-ui/commit/d1b782fc4220976bfaa40a9693ed8a4a0109684b))
- updates to get concat and conditional working, and adding tests ([ef4600f](https://github.com/aws-amplify/amplify-codegen-ui/commit/ef4600f78934b031830f450566b476c2d98caeba))
- updating generated theme to work in test app ([113a594](https://github.com/aws-amplify/amplify-codegen-ui/commit/113a5941800263223571e56c5f3c80c7b8ab093a))
- use correct identifier when using useDataStoreBinding ([#104](https://github.com/aws-amplify/amplify-codegen-ui/issues/104)) ([ef93e45](https://github.com/aws-amplify/amplify-codegen-ui/commit/ef93e4583b68a6fe28d50663bd2c49d9889b8029))
- use temp package that does not break browser ([#136](https://github.com/aws-amplify/amplify-codegen-ui/issues/136)) ([12c9efb](https://github.com/aws-amplify/amplify-codegen-ui/commit/12c9efb673b186abe55dd643bae531d06ec8e368))

### Features

- add base action binding support ([#124](https://github.com/aws-amplify/amplify-codegen-ui/issues/124)) ([e6e60c0](https://github.com/aws-amplify/amplify-codegen-ui/commit/e6e60c0394036065991920622bc30caac00dafed))
- add conditional binding ([#102](https://github.com/aws-amplify/amplify-codegen-ui/issues/102)) ([8c66425](https://github.com/aws-amplify/amplify-codegen-ui/commit/8c664250058cf4703d4b2970bd72c9c269421901))
- add data binding predicate ([#57](https://github.com/aws-amplify/amplify-codegen-ui/issues/57)) ([d9e0216](https://github.com/aws-amplify/amplify-codegen-ui/commit/d9e0216c10f092ecda5fc1888f23bcbae60fe428))
- add notice to top of generated files ([#56](https://github.com/aws-amplify/amplify-codegen-ui/issues/56)) ([4f492cd](https://github.com/aws-amplify/amplify-codegen-ui/commit/4f492cdcd08757c7e23f3be86e7264b29e4e3a0d)), closes [#55](https://github.com/aws-amplify/amplify-codegen-ui/issues/55)
- add output configuration for studio codegen ([#32](https://github.com/aws-amplify/amplify-codegen-ui/issues/32)) ([8cb2de9](https://github.com/aws-amplify/amplify-codegen-ui/commit/8cb2de92fe397d4277ddec05422d4112e917cb78))
- add react attr generation for collectionBindingProperties ([#53](https://github.com/aws-amplify/amplify-codegen-ui/issues/53)) ([33390ed](https://github.com/aws-amplify/amplify-codegen-ui/commit/33390ed150c33a51de3808663b9fc3c46c998de5))
- add single record binding generation ([#51](https://github.com/aws-amplify/amplify-codegen-ui/issues/51)) ([454d754](https://github.com/aws-amplify/amplify-codegen-ui/commit/454d7541b5a699a0598f5fb160639050f104fc73))
- add type information to variants, and add e2e tests for variant rendering ([6ce2ac9](https://github.com/aws-amplify/amplify-codegen-ui/commit/6ce2ac9c0dadad4e25918712edf616e3c68732b3))
- add user specific attrs ([#107](https://github.com/aws-amplify/amplify-codegen-ui/issues/107)) ([67f34ac](https://github.com/aws-amplify/amplify-codegen-ui/commit/67f34acc6d13f1f9ebd283e20454480db393343f))
- adding gh workflow to test rendered goldens ([17e0ca0](https://github.com/aws-amplify/amplify-codegen-ui/commit/17e0ca09efdb27e7256b5d497956d11d969a9420))
- adding support for style variants in generated components ([bb41ac5](https://github.com/aws-amplify/amplify-codegen-ui/commit/bb41ac5a836f7b3bfb6aeb72308db362fdec127f))
- concatenation binding implementation ([#99](https://github.com/aws-amplify/amplify-codegen-ui/issues/99)) ([1bfd428](https://github.com/aws-amplify/amplify-codegen-ui/commit/1bfd4287acf7b2d5f410f045e17658929cb60eb3))
- extend base action binding types with navigation types and add test ([dbccfbd](https://github.com/aws-amplify/amplify-codegen-ui/commit/dbccfbd0466186c8cc09d71419504b0ee3abc4ff))
- output theme file ([#97](https://github.com/aws-amplify/amplify-codegen-ui/issues/97)) ([02508c1](https://github.com/aws-amplify/amplify-codegen-ui/commit/02508c1e8733ccee6a17551fed3b885619d70aa7))
- output type declaration ([#118](https://github.com/aws-amplify/amplify-codegen-ui/issues/118)) ([9db8bdc](https://github.com/aws-amplify/amplify-codegen-ui/commit/9db8bdc80f66567b3d4d9d94d4b4a6bb386af28d))
- remove console log ([#76](https://github.com/aws-amplify/amplify-codegen-ui/issues/76)) ([73fac18](https://github.com/aws-amplify/amplify-codegen-ui/commit/73fac1864494929571ca8ece684a9caf9aab9360))
- replacing dependency on helper for collections sort with inline sort function ([0d0df62](https://github.com/aws-amplify/amplify-codegen-ui/commit/0d0df626fe5b2b0bf028a569adf0faad1aa3f0aa))
- throw error on invalid script kind ([#133](https://github.com/aws-amplify/amplify-codegen-ui/issues/133)) ([ee3e79f](https://github.com/aws-amplify/amplify-codegen-ui/commit/ee3e79f351cf0d5151bf9bbaa048f05897bcb9b0))

# 0.1.0 (2021-10-20)

### Bug Fixes

- add data binding model imports ([#49](https://github.com/aws-amplify/amplify-codegen-ui/issues/49)) ([11e5c47](https://github.com/aws-amplify/amplify-codegen-ui/commit/11e5c473e28a7e23e9768f4d695c9b0bdc6fd5fd))
- collection binding with no predicate ([#98](https://github.com/aws-amplify/amplify-codegen-ui/issues/98)) ([3e38fcc](https://github.com/aws-amplify/amplify-codegen-ui/commit/3e38fccf4c456d34f15b7ca050be6041ccb80417))
- enable esModuleInterop ([#85](https://github.com/aws-amplify/amplify-codegen-ui/issues/85)) ([32eac19](https://github.com/aws-amplify/amplify-codegen-ui/commit/32eac194dc4ba4fbb5571926698e5560a1a6b14d)), closes [#77](https://github.com/aws-amplify/amplify-codegen-ui/issues/77)
- getting cypress tests to run ([2a40055](https://github.com/aws-amplify/amplify-codegen-ui/commit/2a400557c416daab1ec2bd49d4800b6260648175))
- include typescript parser plugin ([8b4e765](https://github.com/aws-amplify/amplify-codegen-ui/commit/8b4e7655f244d08286e7ac15551221fe6bf06589))
- moving @aws-amplify/ui-react to a devDependency ([1aaa55d](https://github.com/aws-amplify/amplify-codegen-ui/commit/1aaa55d3eee0cd9a272888eada1f283cfc2a93c5))
- only pass props to top level ([#63](https://github.com/aws-amplify/amplify-codegen-ui/issues/63)) ([5e59d9b](https://github.com/aws-amplify/amplify-codegen-ui/commit/5e59d9b861bff6b363a15fa3e6ee7f985ecc53dd)), closes [#58](https://github.com/aws-amplify/amplify-codegen-ui/issues/58)
- only use useDataStoreBinding when predicate is set ([#86](https://github.com/aws-amplify/amplify-codegen-ui/issues/86)) ([ec079f1](https://github.com/aws-amplify/amplify-codegen-ui/commit/ec079f14a50ec6e1132669761e6b924638e1c9ce)), closes [#84](https://github.com/aws-amplify/amplify-codegen-ui/issues/84)
- react render config ([#45](https://github.com/aws-amplify/amplify-codegen-ui/issues/45)) ([de74357](https://github.com/aws-amplify/amplify-codegen-ui/commit/de74357c2a323b11de1e464e7a47f43414d22409))
- remove Box to View mapping ([#144](https://github.com/aws-amplify/amplify-codegen-ui/issues/144)) ([74f860c](https://github.com/aws-amplify/amplify-codegen-ui/commit/74f860c18a7f8ee037753035002ecb8a051bb165))
- remove export modifier for renderComponentOnly ([#66](https://github.com/aws-amplify/amplify-codegen-ui/issues/66)) ([6e3d097](https://github.com/aws-amplify/amplify-codegen-ui/commit/6e3d097f217ecbdfb5165888e47eb0e6a16da8c4))
- remove extra component directories ([#71](https://github.com/aws-amplify/amplify-codegen-ui/issues/71)) ([e68d92b](https://github.com/aws-amplify/amplify-codegen-ui/commit/e68d92bdfa4d2f5d34f9cdf0ee70376cec5ce43b))
- remove text value from props and render bound property ([#70](https://github.com/aws-amplify/amplify-codegen-ui/issues/70)) ([aabed87](https://github.com/aws-amplify/amplify-codegen-ui/commit/aabed87e8091a5f875d6edd417744b058a769b4e)), closes [#67](https://github.com/aws-amplify/amplify-codegen-ui/issues/67)
- setting license, author, homepage, and repo information ([e253a15](https://github.com/aws-amplify/amplify-codegen-ui/commit/e253a155f36c3451e7bc911225b8757b3dfd8b78))
- **codegen-ui-react:** collection items props takes precedent ([#96](https://github.com/aws-amplify/amplify-codegen-ui/issues/96)) ([0149ca2](https://github.com/aws-amplify/amplify-codegen-ui/commit/0149ca28741969aae5c3c5442985c10ad065501c)), closes [#90](https://github.com/aws-amplify/amplify-codegen-ui/issues/90)
- **codegen-ui-react:** include all imports used in generated components ([#40](https://github.com/aws-amplify/amplify-codegen-ui/issues/40)) ([04f86bb](https://github.com/aws-amplify/amplify-codegen-ui/commit/04f86bb6a3146d578420b7e0bc3c525fa6572b6b))
- **codegen-ui-react:** include babel parser for prettier ([#83](https://github.com/aws-amplify/amplify-codegen-ui/issues/83)) ([e28551c](https://github.com/aws-amplify/amplify-codegen-ui/commit/e28551c96d0b22fd4f4135554291a94f5cfddea0))
- top level bindingProperties should be optional ([#61](https://github.com/aws-amplify/amplify-codegen-ui/issues/61)) ([b97d6fd](https://github.com/aws-amplify/amplify-codegen-ui/commit/b97d6fdeba5f2525e9a8ced50e5fdb0dfaff3f51))
- top level prop available as variables ([#62](https://github.com/aws-amplify/amplify-codegen-ui/issues/62)) ([788802e](https://github.com/aws-amplify/amplify-codegen-ui/commit/788802e7c0d2426a1c22460bf3bc240e94cbb0c7))
- update unit tests per change from React.Element to React.ReactElement ([d1b782f](https://github.com/aws-amplify/amplify-codegen-ui/commit/d1b782fc4220976bfaa40a9693ed8a4a0109684b))
- updates to get concat and conditional working, and adding tests ([ef4600f](https://github.com/aws-amplify/amplify-codegen-ui/commit/ef4600f78934b031830f450566b476c2d98caeba))
- updating generated theme to work in test app ([113a594](https://github.com/aws-amplify/amplify-codegen-ui/commit/113a5941800263223571e56c5f3c80c7b8ab093a))
- use correct identifier when using useDataStoreBinding ([#104](https://github.com/aws-amplify/amplify-codegen-ui/issues/104)) ([ef93e45](https://github.com/aws-amplify/amplify-codegen-ui/commit/ef93e4583b68a6fe28d50663bd2c49d9889b8029))
- use temp package that does not break browser ([#136](https://github.com/aws-amplify/amplify-codegen-ui/issues/136)) ([12c9efb](https://github.com/aws-amplify/amplify-codegen-ui/commit/12c9efb673b186abe55dd643bae531d06ec8e368))

### Features

- add base action binding support ([#124](https://github.com/aws-amplify/amplify-codegen-ui/issues/124)) ([e6e60c0](https://github.com/aws-amplify/amplify-codegen-ui/commit/e6e60c0394036065991920622bc30caac00dafed))
- add conditional binding ([#102](https://github.com/aws-amplify/amplify-codegen-ui/issues/102)) ([8c66425](https://github.com/aws-amplify/amplify-codegen-ui/commit/8c664250058cf4703d4b2970bd72c9c269421901))
- add data binding predicate ([#57](https://github.com/aws-amplify/amplify-codegen-ui/issues/57)) ([d9e0216](https://github.com/aws-amplify/amplify-codegen-ui/commit/d9e0216c10f092ecda5fc1888f23bcbae60fe428))
- add notice to top of generated files ([#56](https://github.com/aws-amplify/amplify-codegen-ui/issues/56)) ([4f492cd](https://github.com/aws-amplify/amplify-codegen-ui/commit/4f492cdcd08757c7e23f3be86e7264b29e4e3a0d)), closes [#55](https://github.com/aws-amplify/amplify-codegen-ui/issues/55)
- add output configuration for studio codegen ([#32](https://github.com/aws-amplify/amplify-codegen-ui/issues/32)) ([8cb2de9](https://github.com/aws-amplify/amplify-codegen-ui/commit/8cb2de92fe397d4277ddec05422d4112e917cb78))
- add react attr generation for collectionBindingProperties ([#53](https://github.com/aws-amplify/amplify-codegen-ui/issues/53)) ([33390ed](https://github.com/aws-amplify/amplify-codegen-ui/commit/33390ed150c33a51de3808663b9fc3c46c998de5))
- add single record binding generation ([#51](https://github.com/aws-amplify/amplify-codegen-ui/issues/51)) ([454d754](https://github.com/aws-amplify/amplify-codegen-ui/commit/454d7541b5a699a0598f5fb160639050f104fc73))
- add user specific attrs ([#107](https://github.com/aws-amplify/amplify-codegen-ui/issues/107)) ([67f34ac](https://github.com/aws-amplify/amplify-codegen-ui/commit/67f34acc6d13f1f9ebd283e20454480db393343f))
- adding gh workflow to test rendered goldens ([17e0ca0](https://github.com/aws-amplify/amplify-codegen-ui/commit/17e0ca09efdb27e7256b5d497956d11d969a9420))
- adding support for style variants in generated components ([bb41ac5](https://github.com/aws-amplify/amplify-codegen-ui/commit/bb41ac5a836f7b3bfb6aeb72308db362fdec127f))
- concatenation binding implementation ([#99](https://github.com/aws-amplify/amplify-codegen-ui/issues/99)) ([1bfd428](https://github.com/aws-amplify/amplify-codegen-ui/commit/1bfd4287acf7b2d5f410f045e17658929cb60eb3))
- extend base action binding types with navigation types and add test ([dbccfbd](https://github.com/aws-amplify/amplify-codegen-ui/commit/dbccfbd0466186c8cc09d71419504b0ee3abc4ff))
- output theme file ([#97](https://github.com/aws-amplify/amplify-codegen-ui/issues/97)) ([02508c1](https://github.com/aws-amplify/amplify-codegen-ui/commit/02508c1e8733ccee6a17551fed3b885619d70aa7))
- output type declaration ([#118](https://github.com/aws-amplify/amplify-codegen-ui/issues/118)) ([9db8bdc](https://github.com/aws-amplify/amplify-codegen-ui/commit/9db8bdc80f66567b3d4d9d94d4b4a6bb386af28d))
- remove console log ([#76](https://github.com/aws-amplify/amplify-codegen-ui/issues/76)) ([73fac18](https://github.com/aws-amplify/amplify-codegen-ui/commit/73fac1864494929571ca8ece684a9caf9aab9360))
- replacing dependency on helper for collections sort with inline sort function ([0d0df62](https://github.com/aws-amplify/amplify-codegen-ui/commit/0d0df626fe5b2b0bf028a569adf0faad1aa3f0aa))
- throw error on invalid script kind ([#133](https://github.com/aws-amplify/amplify-codegen-ui/issues/133)) ([ee3e79f](https://github.com/aws-amplify/amplify-codegen-ui/commit/ee3e79f351cf0d5151bf9bbaa048f05897bcb9b0))
