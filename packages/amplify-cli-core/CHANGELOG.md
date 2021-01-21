# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.14.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.14.0...amplify-cli-core@1.14.1) (2021-01-08)


### Bug Fixes

* apply tags on create and push nested stack ([#6321](https://github.com/aws-amplify/amplify-cli/issues/6321)) ([4faa3e5](https://github.com/aws-amplify/amplify-cli/commit/4faa3e5ac38d311fe7901fb1b8a1b542cf19e598))
* better error message when angular.json is missing ([#6253](https://github.com/aws-amplify/amplify-cli/issues/6253)) ([0c8175e](https://github.com/aws-amplify/amplify-cli/commit/0c8175e6312fc6fcd5b9e1334cf2011d1e8d392a))
* remove process on next and await ([#6239](https://github.com/aws-amplify/amplify-cli/issues/6239)) ([59d4a0e](https://github.com/aws-amplify/amplify-cli/commit/59d4a0eb318d2b3ad97be34bda9dee756cf82d74))





# [1.14.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.13.1...amplify-cli-core@1.14.0) (2020-12-31)


### Features

* **cli:** generate REAMDE file in amplify dir ([#5808](https://github.com/aws-amplify/amplify-cli/issues/5808)) ([cf0629f](https://github.com/aws-amplify/amplify-cli/commit/cf0629f7385df77aad19fddd58e3587e40482de2))





## [1.13.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.13.0...amplify-cli-core@1.13.1) (2020-12-21)


### Bug Fixes

* **amplify-provider-awscloudformation:** load correct file ([#6212](https://github.com/aws-amplify/amplify-cli/issues/6212)) ([7876187](https://github.com/aws-amplify/amplify-cli/commit/787618736540231efeeee8c803c178325b2c70b4))





# [1.13.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.12.0...amplify-cli-core@1.13.0) (2020-12-16)


### Bug Fixes

* [#4175](https://github.com/aws-amplify/amplify-cli/issues/4175) ([#6065](https://github.com/aws-amplify/amplify-cli/issues/6065)) ([85b1ae3](https://github.com/aws-amplify/amplify-cli/commit/85b1ae31253d06718e13a2e2ff8cca3fc1931073))
* provide better error message when unknown feature flags are present ([#6114](https://github.com/aws-amplify/amplify-cli/issues/6114)) ([d452e83](https://github.com/aws-amplify/amplify-cli/commit/d452e83c19bc6c4002a851c68b3961fc135f3689))


### Features

* **amplify-frontend-ios:** xcode integration feature flag ([#6072](https://github.com/aws-amplify/amplify-cli/issues/6072)) ([d7327ca](https://github.com/aws-amplify/amplify-cli/commit/d7327ca50b163c6104e99a112b8f5c5201e0bbbf))





# [1.12.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.11.0...amplify-cli-core@1.12.0) (2020-12-11)


### Features

* container-based deployments([#5727](https://github.com/aws-amplify/amplify-cli/issues/5727)) ([fad6377](https://github.com/aws-amplify/amplify-cli/commit/fad6377bd384862ca4429cb1a83eee90efd62b58))





# [1.11.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.10.0...amplify-cli-core@1.11.0) (2020-12-07)


### Features

* add support for multiple [@key](https://github.com/key) changes in same [@model](https://github.com/model) ([#6044](https://github.com/aws-amplify/amplify-cli/issues/6044)) ([e574637](https://github.com/aws-amplify/amplify-cli/commit/e5746379ea1330c53dacb55e8f6a9de7b17b55ae))





# [1.10.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.9.0...amplify-cli-core@1.10.0) (2020-11-30)


### Features

* pre-deploy pull, new login mechanism and pkg cli updates ([#5941](https://github.com/aws-amplify/amplify-cli/issues/5941)) ([7274251](https://github.com/aws-amplify/amplify-cli/commit/7274251faadc1035acce5f44699b172e10e2e67d))





# [1.9.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.8.0...amplify-cli-core@1.9.0) (2020-11-27)


### Bug Fixes

* fix to ignore deployment secret if not found ([#5985](https://github.com/aws-amplify/amplify-cli/issues/5985)) ([c1df18d](https://github.com/aws-amplify/amplify-cli/commit/c1df18ded1610bdabc342471dc67a40100a325dc))


### Features

* **iOS:** execute `amplify-app` flow on `init ` and `codegen models` ([#5917](https://github.com/aws-amplify/amplify-cli/issues/5917)) ([c47c8f7](https://github.com/aws-amplify/amplify-cli/commit/c47c8f78b37806181354d3842a2094c35b1795d0))


### Reverts

* Revert "feat(iOS): execute `amplify-app` flow on `init ` and `codegen models` (#5917)" (#5960) ([cd7951a](https://github.com/aws-amplify/amplify-cli/commit/cd7951ab6d26f1206c2f0ff95225ba7b2a5a25eb)), closes [#5917](https://github.com/aws-amplify/amplify-cli/issues/5917) [#5960](https://github.com/aws-amplify/amplify-cli/issues/5960)





# [1.8.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.6.0...amplify-cli-core@1.8.0) (2020-11-22)


### Bug Fixes

* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))


### Features

* storage import ([#5893](https://github.com/aws-amplify/amplify-cli/issues/5893)) ([ad7b028](https://github.com/aws-amplify/amplify-cli/commit/ad7b028330bcee64d5124be7f27a8494dc8e9400))





# 1.7.0 (2020-11-22)


### Bug Fixes

* add compatibility to json parse for non-string values ([#5147](https://github.com/aws-amplify/amplify-cli/issues/5147)) ([3bc9306](https://github.com/aws-amplify/amplify-cli/commit/3bc9306c7b3d078d9b531f5950e8a304fc031d23))
* added exit code on remove ([#5427](https://github.com/aws-amplify/amplify-cli/issues/5427)) ([33132f7](https://github.com/aws-amplify/amplify-cli/commit/33132f764b290cafd345720409a5db8ea6088069))
* data inconsitency ([#5344](https://github.com/aws-amplify/amplify-cli/issues/5344)) ([bfe1903](https://github.com/aws-amplify/amplify-cli/commit/bfe19038b5b676056f45d7ffcc4c2460057936d8))
* move mobile hub flag to context directly ([#5459](https://github.com/aws-amplify/amplify-cli/issues/5459)) ([1828d21](https://github.com/aws-amplify/amplify-cli/commit/1828d214e3491a3633d72f571b7a8f1ab271f7a1))
* move post-install steps to plugin platform rather than post install script ([#5678](https://github.com/aws-amplify/amplify-cli/issues/5678)) ([f83bbab](https://github.com/aws-amplify/amplify-cli/commit/f83bbab378f6857202653cd57c607cead11cbe52))
* publish returns with exitcode 1 ([#5413](https://github.com/aws-amplify/amplify-cli/issues/5413)) ([2064830](https://github.com/aws-amplify/amplify-cli/commit/20648308fca4d4ae6dba84874c3f5508405ff701))
* refactor amplify.json file handling ([#5282](https://github.com/aws-amplify/amplify-cli/issues/5282)) ([a6269f3](https://github.com/aws-amplify/amplify-cli/commit/a6269f3177f3242df81e9d7dce0625295bb7a9fc))
* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))
* update default file permissions for credentials/config ([#5246](https://github.com/aws-amplify/amplify-cli/issues/5246)) ([b64f1bd](https://github.com/aws-amplify/amplify-cli/commit/b64f1bd784b0595f49241fdd89686c5f8a421ae3))


### Features

* changes for native packaging ([#5548](https://github.com/aws-amplify/amplify-cli/issues/5548)) ([7a06f6d](https://github.com/aws-amplify/amplify-cli/commit/7a06f6d96e42a5863e2192560890adbd741b0dc6))
* feature flag implementation ([#4891](https://github.com/aws-amplify/amplify-cli/issues/4891)) ([6d1c632](https://github.com/aws-amplify/amplify-cli/commit/6d1c632952a49cb56670c11c9cb0c3620d0eb332))
* ff to turn off schema reserve word validation ([#5745](https://github.com/aws-amplify/amplify-cli/issues/5745)) ([de79514](https://github.com/aws-amplify/amplify-cli/commit/de79514c18bea7236a05f0658513b95318501d16))
* resource Tagging Support ([#5178](https://github.com/aws-amplify/amplify-cli/issues/5178)) ([e34226d](https://github.com/aws-amplify/amplify-cli/commit/e34226dde30d7d345e3cc2e72e187b242a09c389))
* storage import ([#5893](https://github.com/aws-amplify/amplify-cli/issues/5893)) ([ad7b028](https://github.com/aws-amplify/amplify-cli/commit/ad7b028330bcee64d5124be7f27a8494dc8e9400))
* support importing of auth resources ([#5591](https://github.com/aws-amplify/amplify-cli/issues/5591)) ([7903246](https://github.com/aws-amplify/amplify-cli/commit/790324680544fe18481f91390001f9f07a144203))
* transformer redesign ([#5534](https://github.com/aws-amplify/amplify-cli/issues/5534)) ([a93c685](https://github.com/aws-amplify/amplify-cli/commit/a93c6852f6588898ebc52b0574f4fcc3d2e87948))
* update post-install to copy executable assets to .amplify ([#5595](https://github.com/aws-amplify/amplify-cli/issues/5595)) ([53a23a0](https://github.com/aws-amplify/amplify-cli/commit/53a23a07cbb9e09566c1f0f577ba2b7488bc2eae))





## [1.6.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.6.0...amplify-cli-core@1.6.3) (2020-11-20)


### Bug Fixes

* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))





## [1.6.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.6.0...amplify-cli-core@1.6.2) (2020-11-20)


### Bug Fixes

* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))





## [1.6.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.6.0...amplify-cli-core@1.6.1) (2020-11-19)


### Bug Fixes

* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))





# [1.6.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.5.1...amplify-cli-core@1.6.0) (2020-11-08)


### Features

* ff to turn off schema reserve word validation ([#5745](https://github.com/aws-amplify/amplify-cli/issues/5745)) ([de79514](https://github.com/aws-amplify/amplify-cli/commit/de79514c18bea7236a05f0658513b95318501d16))
* transformer redesign ([#5534](https://github.com/aws-amplify/amplify-cli/issues/5534)) ([a93c685](https://github.com/aws-amplify/amplify-cli/commit/a93c6852f6588898ebc52b0574f4fcc3d2e87948))





## [1.5.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.5.0...amplify-cli-core@1.5.1) (2020-10-27)


### Bug Fixes

* move post-install steps to plugin platform rather than post install script ([#5678](https://github.com/aws-amplify/amplify-cli/issues/5678)) ([f83bbab](https://github.com/aws-amplify/amplify-cli/commit/f83bbab378f6857202653cd57c607cead11cbe52))





# [1.5.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.4.0...amplify-cli-core@1.5.0) (2020-10-22)


### Features

* update post-install to copy executable assets to .amplify ([#5595](https://github.com/aws-amplify/amplify-cli/issues/5595)) ([53a23a0](https://github.com/aws-amplify/amplify-cli/commit/53a23a07cbb9e09566c1f0f577ba2b7488bc2eae))





# [1.4.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.3.4...amplify-cli-core@1.4.0) (2020-10-17)


### Features

* changes for native packaging ([#5548](https://github.com/aws-amplify/amplify-cli/issues/5548)) ([7a06f6d](https://github.com/aws-amplify/amplify-cli/commit/7a06f6d96e42a5863e2192560890adbd741b0dc6))
* support importing of auth resources ([#5591](https://github.com/aws-amplify/amplify-cli/issues/5591)) ([7903246](https://github.com/aws-amplify/amplify-cli/commit/790324680544fe18481f91390001f9f07a144203))





## [1.3.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.3.3...amplify-cli-core@1.3.4) (2020-10-01)


### Bug Fixes

* added exit code on remove ([#5427](https://github.com/aws-amplify/amplify-cli/issues/5427)) ([33132f7](https://github.com/aws-amplify/amplify-cli/commit/33132f764b290cafd345720409a5db8ea6088069))
* move mobile hub flag to context directly ([#5459](https://github.com/aws-amplify/amplify-cli/issues/5459)) ([1828d21](https://github.com/aws-amplify/amplify-cli/commit/1828d214e3491a3633d72f571b7a8f1ab271f7a1))
* publish returns with exitcode 1 ([#5413](https://github.com/aws-amplify/amplify-cli/issues/5413)) ([2064830](https://github.com/aws-amplify/amplify-cli/commit/20648308fca4d4ae6dba84874c3f5508405ff701))





## [1.3.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.3.2...amplify-cli-core@1.3.3) (2020-09-25)


### Bug Fixes

* data inconsitency ([#5344](https://github.com/aws-amplify/amplify-cli/issues/5344)) ([bfe1903](https://github.com/aws-amplify/amplify-cli/commit/bfe19038b5b676056f45d7ffcc4c2460057936d8))





## [1.3.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.3.1...amplify-cli-core@1.3.2) (2020-09-16)


### Bug Fixes

* refactor amplify.json file handling ([#5282](https://github.com/aws-amplify/amplify-cli/issues/5282)) ([a6269f3](https://github.com/aws-amplify/amplify-cli/commit/a6269f3177f3242df81e9d7dce0625295bb7a9fc))





## [1.3.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.3.0...amplify-cli-core@1.3.1) (2020-09-09)


### Bug Fixes

* update default file permissions for credentials/config ([#5246](https://github.com/aws-amplify/amplify-cli/issues/5246)) ([b64f1bd](https://github.com/aws-amplify/amplify-cli/commit/b64f1bd784b0595f49241fdd89686c5f8a421ae3))





# [1.3.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-cli-core@1.2.0...amplify-cli-core@1.3.0) (2020-08-31)


### Bug Fixes

* add compatibility to json parse for non-string values ([#5147](https://github.com/aws-amplify/amplify-cli/issues/5147)) ([3bc9306](https://github.com/aws-amplify/amplify-cli/commit/3bc9306c7b3d078d9b531f5950e8a304fc031d23))


### Features

* resource Tagging Support ([#5178](https://github.com/aws-amplify/amplify-cli/issues/5178)) ([e34226d](https://github.com/aws-amplify/amplify-cli/commit/e34226dde30d7d345e3cc2e72e187b242a09c389))





# 1.2.0 (2020-07-29)


### Features

* feature flag implementation ([#4891](https://github.com/aws-amplify/amplify-cli/issues/4891)) ([6d1c632](https://github.com/aws-amplify/amplify-cli/commit/6d1c632952a49cb56670c11c9cb0c3620d0eb332))





# 1.1.0 (2020-07-23)


### Features

* feature flag implementation ([#4891](https://github.com/aws-amplify/amplify-cli/issues/4891)) ([4639450](https://github.com/aws-amplify/amplify-cli/commit/463945029cfe861f74986d9a8b9af6b827d2063d))
