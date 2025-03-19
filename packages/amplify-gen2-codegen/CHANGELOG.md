# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.1.0-next-5.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/amplify-gen2-codegen@0.1.0-next-4.0...@aws-amplify/amplify-gen2-codegen@0.1.0-next-5.0) (2025-03-19)


### Bug Fixes

* **amplify-gen2-codegen:** add node 20 and 22 version support for functions ([9fc8294](https://github.com/aws-amplify/amplify-cli/commit/9fc82944d962a56b0e0c9bde2ffb7b824f97bd15))
* **amplify-gen2-codegen:** skip setting runtime for unsupported runtimes in function ([91486f1](https://github.com/aws-amplify/amplify-cli/commit/91486f1e4761db29ba2296bc8f6acba752636b55))
* update data prop names ([#14139](https://github.com/aws-amplify/amplify-cli/issues/14139)) ([416d561](https://github.com/aws-amplify/amplify-cli/commit/416d5612f1b2e5faa2e736250cbf673476451aeb))





# [0.1.0-next-4.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/amplify-gen2-codegen@0.1.0-next.0...@aws-amplify/amplify-gen2-codegen@0.1.0-next-4.0) (2025-03-12)

**Note:** Version bump only for package @aws-amplify/amplify-gen2-codegen





# [0.1.0-next.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/amplify-gen2-codegen@0.1.0-beta-latest.0...@aws-amplify/amplify-gen2-codegen@0.1.0-next.0) (2025-02-14)


### Bug Fixes

* add tag to force deployment post refactor in gen2 codegen ([dc953af](https://github.com/aws-amplify/amplify-cli/commit/dc953afd376eb6d7f36729580c9b2cc0a1a09652))
* add tags only for auth or storage categories ([203425d](https://github.com/aws-amplify/amplify-cli/commit/203425d4c61c71cd974efaa22d3d12fc1c060193))
* added dynamic reference to the env name in backend.ts and fixed a few bugs ([59e6a01](https://github.com/aws-amplify/amplify-cli/commit/59e6a014a6aadc17c170e57e6278242bed054697))
* conditional data codegen, phone attribute ([0d5c59f](https://github.com/aws-amplify/amplify-cli/commit/0d5c59fae2849277bced4e4f0c0529d916c0e165))





# [0.1.0-beta-latest.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/amplify-gen2-codegen@0.1.0-alpha.1...@aws-amplify/amplify-gen2-codegen@0.1.0-beta-latest.0) (2025-02-12)


### Bug Fixes

* add check for client secret key presence in map ([89b420b](https://github.com/aws-amplify/amplify-cli/commit/89b420b0194143af4326c2b193210a0f29c4c5a2))
* add import for removal policy in gen2 codegen ([300d169](https://github.com/aws-amplify/amplify-cli/commit/300d1696968705d90788a2b6393884631f29873e))
* add uncomment instructions in readme ([b1ca1b1](https://github.com/aws-amplify/amplify-cli/commit/b1ca1b1efe70425b97c9083f5ac47d71c32aaeb7))
* dedupe lock, update api md ([7520e27](https://github.com/aws-amplify/amplify-cli/commit/7520e2760cc2fa0934f3c095f37aedc01b689161))
* gen2 data table mapping, userpoolclient provider casing ([ab5a244](https://github.com/aws-amplify/amplify-cli/commit/ab5a244da56022a67fa275f10e3f4a2fe53a0a78))
* lint errors in gen2 codegen ([566f887](https://github.com/aws-amplify/amplify-cli/commit/566f8878a314089aed9bf15ad9524cb620ded0d9))
* orphaned functions, import auth ([26fd22b](https://github.com/aws-amplify/amplify-cli/commit/26fd22be0232ba11e37d165135c0912deeb0c520))
* package json name and deps, always set generateSecrets prop ([731071c](https://github.com/aws-amplify/amplify-cli/commit/731071c8c12e64e33229b856d9d5decc680efc16))


### Features

* include all envs in gen 2 data codegen ([#14087](https://github.com/aws-amplify/amplify-cli/issues/14087)) ([6a437e3](https://github.com/aws-amplify/amplify-cli/commit/6a437e3345489ce22d78621de18acc46f969d883))





# [0.1.0-alpha.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/amplify-gen2-codegen@0.1.0-alpha.0...@aws-amplify/amplify-gen2-codegen@0.1.0-alpha.1) (2024-12-05)


### Bug Fixes

* added user pool client codegen ([29a7b5e](https://github.com/aws-amplify/amplify-cli/commit/29a7b5eed227b1fa3e5df670cd527477fe5df321))
* addressed comments ([9b4eaab](https://github.com/aws-amplify/amplify-cli/commit/9b4eaab12cc08e8e6c6bf7c45deb9961824243d4))
* addressed comments ([458c5e3](https://github.com/aws-amplify/amplify-cli/commit/458c5e3ee0d53ad7faaa770894b385acfdf00c96))
* fixed ESLint ([3d61929](https://github.com/aws-amplify/amplify-cli/commit/3d61929695d38c6642bcd9f6fb01677a7c86be4a))
* lint ([dc5f7b0](https://github.com/aws-amplify/amplify-cli/commit/dc5f7b03f3a46403f7e3b1cf1673c8f6cadf0865))





# [0.1.0-alpha.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/amplify-gen2-codegen@0.1.0-gen2-migrations-alpha.0...@aws-amplify/amplify-gen2-codegen@0.1.0-alpha.0) (2024-11-21)


### Bug Fixes

* api md export ([1f5d7ee](https://github.com/aws-amplify/amplify-cli/commit/1f5d7ee2c01bcd4dbf1741ead5bcc8c5089db717))
* delete codegen e2e package ([71cc41b](https://github.com/aws-amplify/amplify-cli/commit/71cc41bbfe62cbede225b31b5fd6ad37ce986b58))
* include only required userAttributes and generate identityPoolName in backend file ([76f1bf8](https://github.com/aws-amplify/amplify-cli/commit/76f1bf8bdbc9135bf0f9c983fd2f5448a169af42))
* prefer early return instead of else block with nesting ([72d178b](https://github.com/aws-amplify/amplify-cli/commit/72d178bcdf10b660ff53f90ca9bb3c24dd460344))
* ref auth - set group name prop as a string to accomodate hyphenated chars ([785ae3a](https://github.com/aws-amplify/amplify-cli/commit/785ae3aadf560c2b9adc4be7a465ecb42c5ab0ff))
* remove duplicate code and .amplify dir ([822bc58](https://github.com/aws-amplify/amplify-cli/commit/822bc5844aa59f22068b4dcb6b09766a5de3ad52))
* remove duplicate test ([3e445d5](https://github.com/aws-amplify/amplify-cli/commit/3e445d512ba1e299d319d13007d573c3e82a4a33))
* remove unused vars ([fdeb8dd](https://github.com/aws-amplify/amplify-cli/commit/fdeb8dd8395ab9fbfdb3d1946cf9470e4ca21153))
* resolve api extract errors ([1ee4481](https://github.com/aws-amplify/amplify-cli/commit/1ee4481b45ee1ce24b1f0c521459095888e0b59e))
* update API.md file for gen1-gen2 codegen ([2531475](https://github.com/aws-amplify/amplify-cli/commit/2531475bb5b65ab3d2a9cdf63b97f81a0916069b))
* updated storage codegen to include encryption and removal policy ([94299ce](https://github.com/aws-amplify/amplify-cli/commit/94299ced6bd550675ecd87d9087fbca190cce740))


### Features

* ref auth codegen ([d6b1f28](https://github.com/aws-amplify/amplify-cli/commit/d6b1f288299c03d8809ccb3bcf8b74129c850e56))





# [0.1.0-gen2-migrations-alpha.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/amplify-gen2-codegen@0.1.0-gen2-migration-test-alpha.0...@aws-amplify/amplify-gen2-codegen@0.1.0-gen2-migrations-alpha.0) (2024-10-10)


### Bug Fixes

* add usage data metrics for codegen ([ffc8041](https://github.com/aws-amplify/amplify-cli/commit/ffc8041041c6d1b66589c537e93f05a7453e5bc9))
* move importedModels key up to defineData ([#13943](https://github.com/aws-amplify/amplify-cli/issues/13943)) ([9bae7d4](https://github.com/aws-amplify/amplify-cli/commit/9bae7d460b70f3ab799d56531d2d3927a8a10f83))





# [0.1.0-gen2-migration-test-alpha.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/amplify-gen2-codegen@0.1.0-gen2-migrations-test.0...@aws-amplify/amplify-gen2-codegen@0.1.0-gen2-migration-test-alpha.0) (2024-09-26)


### Features

* add error for unsupported categories ([a22772d](https://github.com/aws-amplify/amplify-cli/commit/a22772d54c65ff59dffd5721e17ec4501c16d759))
* unsupported categories codegen ([1e8d175](https://github.com/aws-amplify/amplify-cli/commit/1e8d17585157a460ae8cf1f53546b270893e2b99))





# 0.1.0-gen2-migrations-test.0 (2024-09-23)


### Bug Fixes

* add attribute mapping for external providers ([4f4d9fd](https://github.com/aws-amplify/amplify-cli/commit/4f4d9fd261eefbaca6bd3a563b03e59573869e91))
* add relevant removed code due to incorrect merge ([fe1ab64](https://github.com/aws-amplify/amplify-cli/commit/fe1ab6430a668fb55e280552cb358ae97503d002))
* add test cases for source builder and synthesizer ([c7bb106](https://github.com/aws-amplify/amplify-cli/commit/c7bb10681a1cbdd1e92eebcc81357399cf681362))
* add test cases for source builder and synthesizer ([94e1a0e](https://github.com/aws-amplify/amplify-cli/commit/94e1a0e25ac33a42ebd960ae2bcaebea746bd4b7))
* bugfixes for data codegen ([#13880](https://github.com/aws-amplify/amplify-cli/issues/13880)) ([263cd85](https://github.com/aws-amplify/amplify-cli/commit/263cd85da1acb689e647db42fe0bf176da036cb5))
* correct package versions; remove unused import ([2855e28](https://github.com/aws-amplify/amplify-cli/commit/2855e28744bc0d319ff85d7a7a1a36d5fbdad253))
* extract api ([6f4c58b](https://github.com/aws-amplify/amplify-cli/commit/6f4c58b947fa3be4c2c7c200484fa46b6823bb30))
* fixed warnings in API.md ([49ed426](https://github.com/aws-amplify/amplify-cli/commit/49ed4269c77927dad85fa805174249ac6b1f2ac6))
* lint spellcheck and unexpected any error ([5b85e96](https://github.com/aws-amplify/amplify-cli/commit/5b85e96ae87ab3278313010a8b0837b61cac37d7))
* make gen2 migration packages public ([a7832cb](https://github.com/aws-amplify/amplify-cli/commit/a7832cb622cabf3eec3f770393477256117ea47d))
* **migrate:** convert to gen2 app ([abeb9c9](https://github.com/aws-amplify/amplify-cli/commit/abeb9c9863c6aa78dde0f5b10228537f1038c9b1))
* remove unnecessary log statement ([c3943b0](https://github.com/aws-amplify/amplify-cli/commit/c3943b0a8ad191af5a8b5f0c8928934641663cb9))
* resolve extract-api warnings and add saml to dict ([60d2ac9](https://github.com/aws-amplify/amplify-cli/commit/60d2ac94878b76ac7627ea01c51058cbc42324ef))
* resolve failing test error ([c28e4f9](https://github.com/aws-amplify/amplify-cli/commit/c28e4f9418d6f6b9139b5c0907c2b76f723d7311))
* resolve incorrect mfaconifg option ([5f1dd79](https://github.com/aws-amplify/amplify-cli/commit/5f1dd79bbebab1616a5752524d2ecb0ec255fd1a))
* resolve lint and extract-api errors ([e924e3f](https://github.com/aws-amplify/amplify-cli/commit/e924e3f871e1c58767c2088c0fa8b9dc1cbfb7ec))
* resolve test errors ([6e72ab4](https://github.com/aws-amplify/amplify-cli/commit/6e72ab4b3db6cfb52dc72fbea2651874402c81ba))
* resolve test errors ([a555585](https://github.com/aws-amplify/amplify-cli/commit/a555585455623fbc8fbd19cfb54eb47b14fa56ef))
* resolve workflow errors ([b2e96ea](https://github.com/aws-amplify/amplify-cli/commit/b2e96ea522810edcd4acc69a0b1fe2dc203edba7))
* resolve workflow errors ([aad8b48](https://github.com/aws-amplify/amplify-cli/commit/aad8b486809a49b38c39570047418aa4c808bf70))
* resolve workflow errors ([1d5be0a](https://github.com/aws-amplify/amplify-cli/commit/1d5be0a175f1053a6302dd2c1c7032fa75356f83))
* yarn extract-api changes ([e0a33e3](https://github.com/aws-amplify/amplify-cli/commit/e0a33e3f3db6f7d8426b481a081807e6c17391d7))


### Features

* add comments to gen1 triggers ([#13866](https://github.com/aws-amplify/amplify-cli/issues/13866)) ([2ec9470](https://github.com/aws-amplify/amplify-cli/commit/2ec947084a89bb000f2b34cc2662121e8cf04fb6))
* added custom attributes codegen ([0b44538](https://github.com/aws-amplify/amplify-cli/commit/0b445387e45faaa851df93d76cdcdddb6b55f8fe))
* added custom attributes codegen ([2be715c](https://github.com/aws-amplify/amplify-cli/commit/2be715c9acca312c760e4fd70b519fea14256ea9))
* added functions auth ([50dc7a2](https://github.com/aws-amplify/amplify-cli/commit/50dc7a20e43898b964df824a0a91d1d3b182a461))
* added functions auth ([46d8524](https://github.com/aws-amplify/amplify-cli/commit/46d8524f78d04de802e770276021ec0b2b25a73d))
* added functions auth ([263bc8a](https://github.com/aws-amplify/amplify-cli/commit/263bc8a46666fa845b2bee28d71f07d95f937002))
* added functions codegen ([80580ce](https://github.com/aws-amplify/amplify-cli/commit/80580ce9560273af0983b65c5a8134cadfc5a869))
* added functions codegen ([8b679a6](https://github.com/aws-amplify/amplify-cli/commit/8b679a64f20d30f7399302c17599538589381a4d))
* added functions codegen ([b9080ec](https://github.com/aws-amplify/amplify-cli/commit/b9080ecafae25390b05aaf37326fa38cb8640c6b))
* bucket versioning override codegen ([c14156d](https://github.com/aws-amplify/amplify-cli/commit/c14156d4fed0514b0bf7ed6f885bac0419f3dcb2))
* **cli:** initial migration merge ([f803827](https://github.com/aws-amplify/amplify-cli/commit/f8038278b95d321aef4ff75b1bd5a604815fc821))
* **cli:** initial migration merge ([#13856](https://github.com/aws-amplify/amplify-cli/issues/13856)) ([ebe5cd0](https://github.com/aws-amplify/amplify-cli/commit/ebe5cd046cfb18c38ffdce17610ed3a133cc9d44))
* configure username codegen ([f032b76](https://github.com/aws-amplify/amplify-cli/commit/f032b762c870b8d50729ab044eeae87be880606e))
* configure username codegen ([b06eb18](https://github.com/aws-amplify/amplify-cli/commit/b06eb1848ffe52d963448ae43a7c8d286edf4953))
* fixed failing test ([61dbbac](https://github.com/aws-amplify/amplify-cli/commit/61dbbac8ad39d7d288881a438a6881bf6cdf0e87))
* fixed lint and ran yarn extract-api ([b4f256c](https://github.com/aws-amplify/amplify-cli/commit/b4f256c3b433a38974f7a8612505d1c7c21befeb))
* friendly userpool name codegen ([b03e5b0](https://github.com/aws-amplify/amplify-cli/commit/b03e5b03ab7fc0a70ff3981b1232c61edc0fc3a3))
* friendly userpool name codegen ([3057f69](https://github.com/aws-amplify/amplify-cli/commit/3057f696f3aa000073c2a64a1e83e1ac985256c3))
* functions codegeb ([ba3babf](https://github.com/aws-amplify/amplify-cli/commit/ba3babfb1403e8f740e1cfbf795707cdd085612f))
* oauth flows codegen ([8858ef9](https://github.com/aws-amplify/amplify-cli/commit/8858ef92d2f005d6ebe5363e8bb8696a9a72e8ed))
* oauth flows codegen ([7e0d535](https://github.com/aws-amplify/amplify-cli/commit/7e0d53591d8acb78a05e23ffcb75545d8f08a84f))
* oauth scopes codegen ([a0edbc1](https://github.com/aws-amplify/amplify-cli/commit/a0edbc1af025ed6058ed9098da240a05f68384f2))
* oauth scopes codegen ([6ad8080](https://github.com/aws-amplify/amplify-cli/commit/6ad808008f74941644500bd71bcbefeebaf9afd9))
* oidc/saml external providers codegen ([f248955](https://github.com/aws-amplify/amplify-cli/commit/f2489550925e2f90a53a7d0f833d53571a546ae1))
* oidc/saml external providers codegen ([66df938](https://github.com/aws-amplify/amplify-cli/commit/66df938e01827a5c3ca96be9be9bd6fe42841b02))
* read/write permissions for attributes codegen ([36021a3](https://github.com/aws-amplify/amplify-cli/commit/36021a35ec554682c4aca0b32d5a82d85c04f749))
* read/write permissions for attributes codegen ([7a84af5](https://github.com/aws-amplify/amplify-cli/commit/7a84af5639af1a21dd9d90176d4dde5eb526bb9a))
* signup user attributes/groups auth codegen ([bacb17b](https://github.com/aws-amplify/amplify-cli/commit/bacb17b29f3bd55ac9d28b55903d4091a5786b15))
* signup user attributes/groups auth codegen ([772b3e6](https://github.com/aws-amplify/amplify-cli/commit/772b3e66cd4e1413daf33e3477feadce7f1a2da5))
* social auth codegen ([96cc8d5](https://github.com/aws-amplify/amplify-cli/commit/96cc8d580b39ba80745fd235bd00f2b724962adc))
* storage codegen ([da810f0](https://github.com/aws-amplify/amplify-cli/commit/da810f0168db87be03aab4ba409947c0214f2d42))
* storage codegen ([83da5fe](https://github.com/aws-amplify/amplify-cli/commit/83da5fea6a06d3c49678799c579ebb5103eb4cca))
* storage codegen ([a61100e](https://github.com/aws-amplify/amplify-cli/commit/a61100edf2357d18aec8a462a18e0448d659fdb8))
* storage codegen ([dade8f2](https://github.com/aws-amplify/amplify-cli/commit/dade8f2f9284a7f4f6dae949f1311cf31f100400))
* storage codegen ([9e45af9](https://github.com/aws-amplify/amplify-cli/commit/9e45af9c881572ce67d5bad7e05e057609c80b00))
* storage triggers ([#13869](https://github.com/aws-amplify/amplify-cli/issues/13869)) ([3847399](https://github.com/aws-amplify/amplify-cli/commit/38473994e563cd90452ecc50639ea056bb8dd039))
* unauthenticated logins codegen ([2d0b700](https://github.com/aws-amplify/amplify-cli/commit/2d0b700f099ceb36b70ab0745a562bcdd5f5ce4b))
* unauthenticated logins codegen ([6f83374](https://github.com/aws-amplify/amplify-cli/commit/6f8337453da7d9889784836452629a5f35d92e0e))
* update functions codegen ([dc027e9](https://github.com/aws-amplify/amplify-cli/commit/dc027e9030dfd9085451748bf8d9bde76753da44))
* update functions codegen ([411511d](https://github.com/aws-amplify/amplify-cli/commit/411511d463ba1cccabcf179319eddff06f535c51))
* update functions codegen ([bfd4be7](https://github.com/aws-amplify/amplify-cli/commit/bfd4be7787e465e02645d60d1caa403fbfa31961))
* update functions codegen ([47358bd](https://github.com/aws-amplify/amplify-cli/commit/47358bdaa35e807cde5487f236bd54ac992ad96d))
* update functions codegen ([1ef8938](https://github.com/aws-amplify/amplify-cli/commit/1ef89380028856e39cfcb2b55e8fd1bd7f6e41ed))
* updated functions codegen ([1e82262](https://github.com/aws-amplify/amplify-cli/commit/1e822625a7058a8e1f251ccab9f96e8661c2d838))
* updated functions codegen ([bc1acfa](https://github.com/aws-amplify/amplify-cli/commit/bc1acfa9ee8d78e31c3dcb0ec25d0672b0dab1c4))
* updated functions codegen ([c2c5969](https://github.com/aws-amplify/amplify-cli/commit/c2c5969f083abc4d3701c03403b9873e0fe4e717))
* updated functions codegen ([5a8819b](https://github.com/aws-amplify/amplify-cli/commit/5a8819bbb014dd482cac1af30d685d92c7fa5fea))
* updated functions codegen ([4ac9324](https://github.com/aws-amplify/amplify-cli/commit/4ac932478633274e87524aea9eb9f48d3640d36c))
* updated secret code ([f54457b](https://github.com/aws-amplify/amplify-cli/commit/f54457b8280e4736ea84786f5879206d7eeed571))
