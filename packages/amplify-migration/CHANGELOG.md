# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.1.0-next-3.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/migrate@0.1.0-next-2.0...@aws-amplify/migrate@0.1.0-next-3.0) (2025-03-05)

**Note:** Version bump only for package @aws-amplify/migrate





# [0.1.0-next-2.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/migrate@0.1.0-next-1.0...@aws-amplify/migrate@0.1.0-next-2.0) (2025-02-26)


### Bug Fixes

* **migrate:** lint errors ([a3c75b3](https://github.com/aws-amplify/amplify-cli/commit/a3c75b3a98719970e11733043a405c7764350e53))
* **migrate:** lint errors ([98dced2](https://github.com/aws-amplify/amplify-cli/commit/98dced209aeea4c26aec86d3d5aba19830091b4a))
* **migrate:** remove unused import in test ([7b10b3b](https://github.com/aws-amplify/amplify-cli/commit/7b10b3ba880212b8abbbbbe2b67b92c883d9696b))
* **migrate:** run prettier ([74d87c9](https://github.com/aws-amplify/amplify-cli/commit/74d87c9c5d2ae515ed9c7b92d10cf70e7ebf373c))
* **migrate:** use latest cli-internal version ([b5b83b3](https://github.com/aws-amplify/amplify-cli/commit/b5b83b3b3d4e8024dc7d0b08c175db6f49610347))


### Features

* **migrate:** add revert, userpool group refactor ([38eed7e](https://github.com/aws-amplify/amplify-cli/commit/38eed7e57e785cece232ce967ddc9171390af312))





# [0.1.0-next-1.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/migrate@0.1.0-next.0...@aws-amplify/migrate@0.1.0-next-1.0) (2025-02-17)


### Bug Fixes

* **migrate:** remove migration dir if exists prior to rename ([b62b487](https://github.com/aws-amplify/amplify-cli/commit/b62b4874ffba3c3fce64cb3e723d02930104b81d))
* **migrate:** set CLI_ENV to production for usage metrics, emit error metrics when execute fails ([466e6c7](https://github.com/aws-amplify/amplify-cli/commit/466e6c7bebd2928ea76b513feb97db7b563a5037))





# [0.1.0-next.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/migrate@0.1.0-beta-latest.0...@aws-amplify/migrate@0.1.0-next.0) (2025-02-14)


### Bug Fixes

* added dynamic reference to the env name in backend.ts and fixed a few bugs ([59e6a01](https://github.com/aws-amplify/amplify-cli/commit/59e6a014a6aadc17c170e57e6278242bed054697))
* conditional data codegen, phone attribute ([0d5c59f](https://github.com/aws-amplify/amplify-cli/commit/0d5c59fae2849277bced4e4f0c0529d916c0e165))





# [0.1.0-beta-latest.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/migrate@0.1.0-alpha.1...@aws-amplify/migrate@0.1.0-beta-latest.0) (2025-02-12)


### Bug Fixes

* add progress bar for gen 2 codegen ([6b7bf79](https://github.com/aws-amplify/amplify-cli/commit/6b7bf79ec9fa7c65245956b179e261fa0604bb9b))
* add uncomment instructions in readme ([b1ca1b1](https://github.com/aws-amplify/amplify-cli/commit/b1ca1b1efe70425b97c9083f5ac47d71c32aaeb7))
* auth definition fetcher test ([dd75bfd](https://github.com/aws-amplify/amplify-cli/commit/dd75bfdd81a50104534f18f94ab10fc8c0641d72))
* check for absence of auth in gen2 codegen ([518a0f4](https://github.com/aws-amplify/amplify-cli/commit/518a0f41f0cc817a05932e4c5bb06d5c805c5cc7))
* choose current env, update gitignore for gen2, derive fn name from output key ([40b1730](https://github.com/aws-amplify/amplify-cli/commit/40b17308470d1946878c1e74afde61c67c211625))
* delete extraneous map file ([2699ee2](https://github.com/aws-amplify/amplify-cli/commit/2699ee2ee2ab7fa806675b66710a588ceb5e438b))
* function migration adapter category ([afb1136](https://github.com/aws-amplify/amplify-cli/commit/afb1136d5c1eb82e0aa7baf6c12784b06a72de17))
* lint & api md ([351d7b2](https://github.com/aws-amplify/amplify-cli/commit/351d7b22fb7308c974ceea965566431e6d296183))
* lint errros and warnings in amplify-migration ([8464c01](https://github.com/aws-amplify/amplify-cli/commit/8464c019b70cadbb786b281b9f0b02ca057c402e))
* lint in migrations package ([8380bb0](https://github.com/aws-amplify/amplify-cli/commit/8380bb0d2829884c02ab8e450c575d5f07f2ac4f))
* orphaned functions, import auth ([26fd22b](https://github.com/aws-amplify/amplify-cli/commit/26fd22be0232ba11e37d165135c0912deeb0c520))
* remove extraneous deps ([74c6647](https://github.com/aws-amplify/amplify-cli/commit/74c6647296512c50f9ace9021ea4e2c332e605ac))
* remove ora mock ([783f33f](https://github.com/aws-amplify/amplify-cli/commit/783f33f9a083679fed266bcb860962c1ed0d629f))
* use older version of ora to keep it consistent with other packages ([0b390a3](https://github.com/aws-amplify/amplify-cli/commit/0b390a3d19d07efac86699c0628954602ebdf862))


### Features

* add refactor operation to gen2 migration ([9f2752b](https://github.com/aws-amplify/amplify-cli/commit/9f2752b9b116b81267cb6ac5f7fd0877781c9e7f))
* include all envs in gen 2 data codegen ([#14087](https://github.com/aws-amplify/amplify-cli/issues/14087)) ([6a437e3](https://github.com/aws-amplify/amplify-cli/commit/6a437e3345489ce22d78621de18acc46f969d883))





# [0.1.0-alpha.1](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/migrate@0.1.0-alpha.0...@aws-amplify/migrate@0.1.0-alpha.1) (2024-12-05)


### Bug Fixes

* added user pool client codegen ([29a7b5e](https://github.com/aws-amplify/amplify-cli/commit/29a7b5eed227b1fa3e5df670cd527477fe5df321))
* **migrate:** rename generate-templates to execute command ([9e383cd](https://github.com/aws-amplify/amplify-cli/commit/9e383cd8bd9e14ea41322cb0ec5c4206d78d5a95))


### Features

* **migrate-template-gen:** retrieve oauth values for gen1 stack update ([3604b3e](https://github.com/aws-amplify/amplify-cli/commit/3604b3e86c01b300dd4d3480e900646875bba0f7))





# [0.1.0-alpha.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/migrate@0.1.0-gen2-migrations-alpha.0...@aws-amplify/migrate@0.1.0-alpha.0) (2024-11-21)


### Bug Fixes

* import auth validation condition ([a76b71b](https://github.com/aws-amplify/amplify-cli/commit/a76b71bdf8eca2bc10a42bd4d90cbea1971141ed))
* include only required userAttributes and generate identityPoolName in backend file ([76f1bf8](https://github.com/aws-amplify/amplify-cli/commit/76f1bf8bdbc9135bf0f9c983fd2f5448a169af42))
* invert isImported condition ([2739aec](https://github.com/aws-amplify/amplify-cli/commit/2739aec0dd923537d8bf704bb63944f4756cc2c9))
* remove duplicate code and .amplify dir ([822bc58](https://github.com/aws-amplify/amplify-cli/commit/822bc5844aa59f22068b4dcb6b09766a5de3ad52))
* updated storage codegen to include encryption and removal policy ([94299ce](https://github.com/aws-amplify/amplify-cli/commit/94299ced6bd550675ecd87d9087fbca190cce740))


### Features

* ref auth codegen ([d6b1f28](https://github.com/aws-amplify/amplify-cli/commit/d6b1f288299c03d8809ccb3bcf8b74129c850e56))





# [0.1.0-gen2-migrations-alpha.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/migrate@0.1.0-gen2-migration-test-alpha.0...@aws-amplify/migrate@0.1.0-gen2-migrations-alpha.0) (2024-10-10)


### Bug Fixes

* add usage data metrics for codegen ([ffc8041](https://github.com/aws-amplify/amplify-cli/commit/ffc8041041c6d1b66589c537e93f05a7453e5bc9))
* **migrate:** package and lock files ([efec79b](https://github.com/aws-amplify/amplify-cli/commit/efec79b285bbf5291d1223a1ff0efa448594dafc))
* **migrate:** rename index to command handler ([a479625](https://github.com/aws-amplify/amplify-cli/commit/a479625b705a9b26e30cb58aeca9cdc9c285642d))
* **migrate:** update api md for generate templates ([4b4ccaa](https://github.com/aws-amplify/amplify-cli/commit/4b4ccaa560b4e4af1c35115acfb21f1a5cab4b9a))


### Features

* **migrate-template-gen:** add readme generator ([ebd02ef](https://github.com/aws-amplify/amplify-cli/commit/ebd02efb22f187c163db694f4eabd584a43d9873))
* **migrate:** add generate templates command ([54b918b](https://github.com/aws-amplify/amplify-cli/commit/54b918b0c97da846baf9f1d715253299fe598930))





# [0.1.0-gen2-migration-test-alpha.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/migrate@0.1.0-gen2-migration-test.0...@aws-amplify/migrate@0.1.0-gen2-migration-test-alpha.0) (2024-09-26)


### Bug Fixes

* check for empty objects ([c3f3a58](https://github.com/aws-amplify/amplify-cli/commit/c3f3a58ec1095b7051e701aa4f9e94ce0e45513a))


### Features

* add error for unsupported categories ([a22772d](https://github.com/aws-amplify/amplify-cli/commit/a22772d54c65ff59dffd5721e17ec4501c16d759))
* unsupported categories codegen ([94552fd](https://github.com/aws-amplify/amplify-cli/commit/94552fdeaca3ffdede0182adbef9a37885bff621))
* unsupported categories codegen ([1e8d175](https://github.com/aws-amplify/amplify-cli/commit/1e8d17585157a460ae8cf1f53546b270893e2b99))





# [0.1.0-gen2-migration-test.0](https://github.com/aws-amplify/amplify-cli/compare/@aws-amplify/migrate@0.1.0-gen2-migrations-test.0...@aws-amplify/migrate@0.1.0-gen2-migration-test.0) (2024-09-23)


### Bug Fixes

* **migrate:** add README ([51b0d66](https://github.com/aws-amplify/amplify-cli/commit/51b0d666292ae766b7b36ec3f171cb0f281674fc))





# 0.1.0-gen2-migrations-test.0 (2024-09-23)


### Bug Fixes

* add attribute mapping for external providers ([4f4d9fd](https://github.com/aws-amplify/amplify-cli/commit/4f4d9fd261eefbaca6bd3a563b03e59573869e91))
* add relevant removed code due to incorrect merge ([fe1ab64](https://github.com/aws-amplify/amplify-cli/commit/fe1ab6430a668fb55e280552cb358ae97503d002))
* bugfixes for data codegen ([#13880](https://github.com/aws-amplify/amplify-cli/issues/13880)) ([263cd85](https://github.com/aws-amplify/amplify-cli/commit/263cd85da1acb689e647db42fe0bf176da036cb5))
* correct package versions; remove unused import ([32b3382](https://github.com/aws-amplify/amplify-cli/commit/32b338286bef118f139ba0d0d98a9d45f23920fb))
* correct package versions; remove unused import ([2855e28](https://github.com/aws-amplify/amplify-cli/commit/2855e28744bc0d319ff85d7a7a1a36d5fbdad253))
* data definition fetcher handle undefined data stack ([#13886](https://github.com/aws-amplify/amplify-cli/issues/13886)) ([3a2549c](https://github.com/aws-amplify/amplify-cli/commit/3a2549cae564fa1291f44d64145c46d9df733fc3))
* extract api ([6f4c58b](https://github.com/aws-amplify/amplify-cli/commit/6f4c58b947fa3be4c2c7c200484fa46b6823bb30))
* linting error fix ([4244c77](https://github.com/aws-amplify/amplify-cli/commit/4244c77eb2141a9837de26287a6739d53701b79d))
* make gen2 migration packages public ([a7832cb](https://github.com/aws-amplify/amplify-cli/commit/a7832cb622cabf3eec3f770393477256117ea47d))
* **migrate:** add test-ci cmd ([c765b5e](https://github.com/aws-amplify/amplify-cli/commit/c765b5e0cfa8d0f8ac9bdd77c4eb3a261e0a933d))
* **migrate:** convert to gen2 app ([abeb9c9](https://github.com/aws-amplify/amplify-cli/commit/abeb9c9863c6aa78dde0f5b10228537f1038c9b1))
* **migrate:** prettier changes ([0fc0324](https://github.com/aws-amplify/amplify-cli/commit/0fc03241cc0095a45b1dc59f9102cdf3989daca7))
* **migrate:** remove ci flag ([875f298](https://github.com/aws-amplify/amplify-cli/commit/875f298014e02d1d4feb544bb097a7ae2aa991d8))
* **migrate:** remove commented code ([adfa586](https://github.com/aws-amplify/amplify-cli/commit/adfa586a431b14253b2515ce404bb388879a814b))
* **migrate:** remove explicit js extension ([de079b9](https://github.com/aws-amplify/amplify-cli/commit/de079b9295484a9c944ade6ee9845b2c46fc1b5c))
* **migrate:** remove unused code ([154dc60](https://github.com/aws-amplify/amplify-cli/commit/154dc6081b79109fccd9b365dbff7d563f3a427d))
* **migrate:** update api doc ([9616366](https://github.com/aws-amplify/amplify-cli/commit/9616366930d2ffb9d7f8c08f491e9fdb5ec321fa))
* **migrate:** update command names ([ef72979](https://github.com/aws-amplify/amplify-cli/commit/ef7297949d697c9c53f330745558246538f1343c))
* **migrate:** use jest ([ee3063a](https://github.com/aws-amplify/amplify-cli/commit/ee3063ac3a9d4947851675e3c88bd7239031ed0e))
* remove unused vars ([ca3de21](https://github.com/aws-amplify/amplify-cli/commit/ca3de21413a7860939c9c07b022d361bf0f99de7))
* resolve failing test error ([c28e4f9](https://github.com/aws-amplify/amplify-cli/commit/c28e4f9418d6f6b9139b5c0907c2b76f723d7311))
* resolve incorrect mfaconifg option ([5f1dd79](https://github.com/aws-amplify/amplify-cli/commit/5f1dd79bbebab1616a5752524d2ecb0ec255fd1a))
* resolve test errors ([6e72ab4](https://github.com/aws-amplify/amplify-cli/commit/6e72ab4b3db6cfb52dc72fbea2651874402c81ba))
* resolve workflow errors ([b2e96ea](https://github.com/aws-amplify/amplify-cli/commit/b2e96ea522810edcd4acc69a0b1fe2dc203edba7))
* resolve workflow errors ([1d5be0a](https://github.com/aws-amplify/amplify-cli/commit/1d5be0a175f1053a6302dd2c1c7032fa75356f83))


### Features

* add comments to gen1 triggers ([#13866](https://github.com/aws-amplify/amplify-cli/issues/13866)) ([2ec9470](https://github.com/aws-amplify/amplify-cli/commit/2ec947084a89bb000f2b34cc2662121e8cf04fb6))
* added an assert statement for meta file ([1945b71](https://github.com/aws-amplify/amplify-cli/commit/1945b71cb9c8ddf2cb652b2a87260ed1f643067d))
* added functions auth ([acf5249](https://github.com/aws-amplify/amplify-cli/commit/acf52491cb3454d29b63d80e2038489ab2a82592))
* added functions codegen ([8d6afa4](https://github.com/aws-amplify/amplify-cli/commit/8d6afa487e560db04692b8b815680d00e26924f9))
* added functions codegen ([1bdabc7](https://github.com/aws-amplify/amplify-cli/commit/1bdabc76ad20206dd2711997c8059248c5877a9f))
* bucket versioning override codegen ([c14156d](https://github.com/aws-amplify/amplify-cli/commit/c14156d4fed0514b0bf7ed6f885bac0419f3dcb2))
* **cli:** initial migration merge ([f803827](https://github.com/aws-amplify/amplify-cli/commit/f8038278b95d321aef4ff75b1bd5a604815fc821))
* **cli:** initial migration merge ([#13856](https://github.com/aws-amplify/amplify-cli/issues/13856)) ([ebe5cd0](https://github.com/aws-amplify/amplify-cli/commit/ebe5cd046cfb18c38ffdce17610ed3a133cc9d44))
* functions codegeb ([ba3babf](https://github.com/aws-amplify/amplify-cli/commit/ba3babfb1403e8f740e1cfbf795707cdd085612f))
* functions codegen ([50e91e2](https://github.com/aws-amplify/amplify-cli/commit/50e91e22fc97d4c8cee80dae17ab4b6976cccd40))
* **migrate:** make as an independent executable ([0aeffb9](https://github.com/aws-amplify/amplify-cli/commit/0aeffb96b9fad75549d76d19778725eb522ad64e))
* oidc/saml external providers codegen ([f248955](https://github.com/aws-amplify/amplify-cli/commit/f2489550925e2f90a53a7d0f833d53571a546ae1))
* signup user attributes/groups auth codegen ([bacb17b](https://github.com/aws-amplify/amplify-cli/commit/bacb17b29f3bd55ac9d28b55903d4091a5786b15))
* social auth codegen ([96cc8d5](https://github.com/aws-amplify/amplify-cli/commit/96cc8d580b39ba80745fd235bd00f2b724962adc))
* storage codegen ([6ccb0ef](https://github.com/aws-amplify/amplify-cli/commit/6ccb0ef8db64b079f15ed7f943a8ac4b27a42211))
* storage codegen ([9e45af9](https://github.com/aws-amplify/amplify-cli/commit/9e45af9c881572ce67d5bad7e05e057609c80b00))
* storage triggers ([#13869](https://github.com/aws-amplify/amplify-cli/issues/13869)) ([3847399](https://github.com/aws-amplify/amplify-cli/commit/38473994e563cd90452ecc50639ea056bb8dd039))
* unauthenticated logins codegen ([2d0b700](https://github.com/aws-amplify/amplify-cli/commit/2d0b700f099ceb36b70ab0745a562bcdd5f5ce4b))
* update functions codegen ([411511d](https://github.com/aws-amplify/amplify-cli/commit/411511d463ba1cccabcf179319eddff06f535c51))
* update functions codegen ([1ef8938](https://github.com/aws-amplify/amplify-cli/commit/1ef89380028856e39cfcb2b55e8fd1bd7f6e41ed))
* updated functions codegen ([4ac9324](https://github.com/aws-amplify/amplify-cli/commit/4ac932478633274e87524aea9eb9f48d3640d36c))
* updated secret code ([f54457b](https://github.com/aws-amplify/amplify-cli/commit/f54457b8280e4736ea84786f5879206d7eeed571))
