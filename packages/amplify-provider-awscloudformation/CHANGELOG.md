# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [6.4.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@6.4.0...amplify-provider-awscloudformation@6.4.1) (2022-06-15)



## 8.5.1 (2022-06-14)


### Reverts

* Revert "feat: allow login via admin ui on safari (#10407)" (#10602) ([16104ea](https://github.com/aws-amplify/amplify-cli/commit/16104ea72313382cea2c5c5a16231a22c5cba344)), closes [#10407](https://github.com/aws-amplify/amplify-cli/issues/10407) [#10602](https://github.com/aws-amplify/amplify-cli/issues/10602)
* Revert "chore: block insecure traffic to deployment bucket (#10533)" (#10591) ([8d7b710](https://github.com/aws-amplify/amplify-cli/commit/8d7b710dba29d8678c6e44264f3fce7a0be634af)), closes [#10533](https://github.com/aws-amplify/amplify-cli/issues/10533) [#10591](https://github.com/aws-amplify/amplify-cli/issues/10591)
* Revert "Revert "chore: block insecure traffic to deployment bucket (#10533)" (#10584)" (#10588) ([9418956](https://github.com/aws-amplify/amplify-cli/commit/941895688473458415154c76ff52c70dd2c85fe3)), closes [#10533](https://github.com/aws-amplify/amplify-cli/issues/10533) [#10584](https://github.com/aws-amplify/amplify-cli/issues/10584) [#10588](https://github.com/aws-amplify/amplify-cli/issues/10588)
* Revert "chore: block insecure traffic to deployment bucket (#10533)" (#10584) ([ef44565](https://github.com/aws-amplify/amplify-cli/commit/ef44565695293bff78593b8dff3d158cde66bb78)), closes [#10533](https://github.com/aws-amplify/amplify-cli/issues/10533) [#10584](https://github.com/aws-amplify/amplify-cli/issues/10584)





# [6.4.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@6.3.0...amplify-provider-awscloudformation@6.4.0) (2022-06-13)



# 8.5.0 (2022-06-10)


### Features

* allow login via admin ui on safari ([#10407](https://github.com/aws-amplify/amplify-cli/issues/10407)) ([f6f563c](https://github.com/aws-amplify/amplify-cli/commit/f6f563ceb32a17db8307d1fb7d4f31f115ed2761))
* implemented push normalization ([#10469](https://github.com/aws-amplify/amplify-cli/issues/10469)) ([e70d6c9](https://github.com/aws-amplify/amplify-cli/commit/e70d6c95cd9826a9d2785607341e8e1432306a30))





# [6.3.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@6.2.1...amplify-provider-awscloudformation@6.3.0) (2022-06-03)


### Features

* allow 3rd-party plugins to CDK override ([#9601](https://github.com/aws-amplify/amplify-cli/issues/9601)) ([60498c5](https://github.com/aws-amplify/amplify-cli/commit/60498c5fb54dcf15e2fb5b87528540fdcffc0cd1))
* diagnose ([#10383](https://github.com/aws-amplify/amplify-cli/issues/10383)) ([6a29bd9](https://github.com/aws-amplify/amplify-cli/commit/6a29bd99886172baf420a95a0d6a7987c9ebd6bd))





## [6.2.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@6.2.0...amplify-provider-awscloudformation@6.2.1) (2022-05-27)



## 8.3.1 (2022-05-27)


### Bug Fixes

* fixes oauth e2e ([#10482](https://github.com/aws-amplify/amplify-cli/issues/10482)) ([085a7aa](https://github.com/aws-amplify/amplify-cli/commit/085a7aab25b7f9d6b503eb1f6f8a9b64ed0e6e9a))


### Reverts

* oauth parameter store change ([#10485](https://github.com/aws-amplify/amplify-cli/issues/10485)) ([896b518](https://github.com/aws-amplify/amplify-cli/commit/896b51833e30daf9997d38c9229ca237ab7deda1))





# [6.2.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@6.1.4...amplify-provider-awscloudformation@6.2.0) (2022-05-24)


### Features

* move oauth secrets to parameter store ([#10413](https://github.com/aws-amplify/amplify-cli/issues/10413)) ([16db2ce](https://github.com/aws-amplify/amplify-cli/commit/16db2ceb5da4e02e90e6b0bc1bb27412fd765b50))


### Reverts

* Revert "Revert "chore: wrap getTransformerFactory behind a single API (#10373)" (#10390)" (#10391) ([2612585](https://github.com/aws-amplify/amplify-cli/commit/2612585b1f84cd39ec81f54917d93b06c9d129d5)), closes [#10373](https://github.com/aws-amplify/amplify-cli/issues/10373) [#10390](https://github.com/aws-amplify/amplify-cli/issues/10390) [#10391](https://github.com/aws-amplify/amplify-cli/issues/10391)





## [6.1.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@6.1.3...amplify-provider-awscloudformation@6.1.4) (2022-05-10)



# 8.2.0 (2022-05-10)


### Bug Fixes

* **amplify-provider-awscloudformation:** use the right profile with SSO and credential_process ([#9095](https://github.com/aws-amplify/amplify-cli/issues/9095)) ([811f257](https://github.com/aws-amplify/amplify-cli/commit/811f2571c69e67c91fe998a2e141f6fa5fc73a16)), closes [#4488](https://github.com/aws-amplify/amplify-cli/issues/4488)
* root path handling for REST APIs ([#9842](https://github.com/aws-amplify/amplify-cli/issues/9842)) ([08fb69f](https://github.com/aws-amplify/amplify-cli/commit/08fb69f6237a8e0a98ffdf6d73cb0b030ace583e))


### Reverts

* Revert "chore: wrap getTransformerFactory behind a single API (#10373)" (#10390) ([c2629f6](https://github.com/aws-amplify/amplify-cli/commit/c2629f6ac6aba05d205e6a3622a8cfa9f8c2d0bf)), closes [#10373](https://github.com/aws-amplify/amplify-cli/issues/10373) [#10390](https://github.com/aws-amplify/amplify-cli/issues/10390)





## [6.1.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@6.1.2...amplify-provider-awscloudformation@6.1.3) (2022-04-29)


### Bug Fixes

* remove exclusion of build directory on appsync upload ([#10248](https://github.com/aws-amplify/amplify-cli/issues/10248)) ([8ac54a2](https://github.com/aws-amplify/amplify-cli/commit/8ac54a2913c80efd0d42cf7b2c61ae4bd911485b))





## [6.1.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@6.1.1...amplify-provider-awscloudformation@6.1.2) (2022-04-27)


### Bug Fixes

* remove unsupported cfn-lint ([#10270](https://github.com/aws-amplify/amplify-cli/issues/10270)) ([9541aa5](https://github.com/aws-amplify/amplify-cli/commit/9541aa5a965206a3d281bd032f06506d5d1e0f15))
* show mfa prompt ([#9954](https://github.com/aws-amplify/amplify-cli/issues/9954)) ([5176dba](https://github.com/aws-amplify/amplify-cli/commit/5176dba3c41e66471f440e772006b62536b34090))
* update s3 bucket policies to adhere to best practices ([#10272](https://github.com/aws-amplify/amplify-cli/issues/10272)) ([b156327](https://github.com/aws-amplify/amplify-cli/commit/b156327f3b38a5244530f706612c5368a4ec12f9))


### Reverts

* Revert "fix: update s3 bucket policies to adhere to best practices (#10272)" (#10282) ([0909769](https://github.com/aws-amplify/amplify-cli/commit/0909769dc64c83bcb5e91e79156db2f6ec60ac85)), closes [#10272](https://github.com/aws-amplify/amplify-cli/issues/10272) [#10282](https://github.com/aws-amplify/amplify-cli/issues/10282)





## [6.1.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@6.1.0...amplify-provider-awscloudformation@6.1.1) (2022-04-18)



## 8.0.2 (2022-04-15)


### Bug Fixes

* accidental changes to meta file reading and resource status filter ([#10227](https://github.com/aws-amplify/amplify-cli/issues/10227)) ([17b5df0](https://github.com/aws-amplify/amplify-cli/commit/17b5df0f91ac17593578b6ff16f0a9b6b8ac1602))
* amplify meta file resolution, update yarn.lock ([#10225](https://github.com/aws-amplify/amplify-cli/issues/10225)) ([a253c70](https://github.com/aws-amplify/amplify-cli/commit/a253c706aa62539f42114ad3bd92494c7018f39b))





# [6.1.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@6.0.0...amplify-provider-awscloudformation@6.1.0) (2022-04-11)


### Bug Fixes

* api sets auth dependency correctly in meta files ([#10072](https://github.com/aws-amplify/amplify-cli/issues/10072)) ([42edc57](https://github.com/aws-amplify/amplify-cli/commit/42edc572ab21064da16ede94d16884fda5a9a54f))
* build resource when adding new env ([#10058](https://github.com/aws-amplify/amplify-cli/issues/10058)) ([4a08ff5](https://github.com/aws-amplify/amplify-cli/commit/4a08ff58e86f53c1dc758b0b772765daf9169201)), closes [#10003](https://github.com/aws-amplify/amplify-cli/issues/10003) [#10037](https://github.com/aws-amplify/amplify-cli/issues/10037)
* deploy only function when doing amplify push function ([#10035](https://github.com/aws-amplify/amplify-cli/issues/10035)) ([93eddc5](https://github.com/aws-amplify/amplify-cli/commit/93eddc5915c61461f8ee99819fae9d9b738acfa7))


### Features

* **amplify-category-geo:** add geo category workflows for maps and search ([1663c8d](https://github.com/aws-amplify/amplify-cli/commit/1663c8d57699b28e0e7cc16b7ef9f3085a0e38b6)), closes [#7566](https://github.com/aws-amplify/amplify-cli/issues/7566) [#7858](https://github.com/aws-amplify/amplify-cli/issues/7858) [#7891](https://github.com/aws-amplify/amplify-cli/issues/7891) [#8031](https://github.com/aws-amplify/amplify-cli/issues/8031) [#8122](https://github.com/aws-amplify/amplify-cli/issues/8122) [#8155](https://github.com/aws-amplify/amplify-cli/issues/8155) [#8182](https://github.com/aws-amplify/amplify-cli/issues/8182) [#8237](https://github.com/aws-amplify/amplify-cli/issues/8237) [#8890](https://github.com/aws-amplify/amplify-cli/issues/8890) [#8822](https://github.com/aws-amplify/amplify-cli/issues/8822) [#9281](https://github.com/aws-amplify/amplify-cli/issues/9281) [#9399](https://github.com/aws-amplify/amplify-cli/issues/9399) [#9453](https://github.com/aws-amplify/amplify-cli/issues/9453) [#9594](https://github.com/aws-amplify/amplify-cli/issues/9594) [#10038](https://github.com/aws-amplify/amplify-cli/issues/10038)





# [6.0.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.9.12...amplify-provider-awscloudformation@6.0.0) (2022-04-07)


### Bug Fixes

* **graphql:** correct searchable instance types ([#9973](https://github.com/aws-amplify/amplify-cli/issues/9973)) ([dfcfa52](https://github.com/aws-amplify/amplify-cli/commit/dfcfa5237d538088331e8a7c7d51a9932c879429))
* use prompter and handle deletions ([#10122](https://github.com/aws-amplify/amplify-cli/issues/10122)) ([5c0e290](https://github.com/aws-amplify/amplify-cli/commit/5c0e2904e5ac65824642281e732aae4f02904fd0))


### Features

* add latency metrics to usage data payload ([#10016](https://github.com/aws-amplify/amplify-cli/issues/10016)) ([9fe0405](https://github.com/aws-amplify/amplify-cli/commit/9fe04057537dc40dc8f4b428ed43ffcf4490202e))


### BREAKING CHANGES

* package name update requires version bump in order to keep in sync with lerna.





## [5.9.12](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.9.11...amplify-provider-awscloudformation@5.9.12) (2022-03-23)


### Bug Fixes

* build resource when adding new env ([#10003](https://github.com/aws-amplify/amplify-cli/issues/10003)) ([f53596d](https://github.com/aws-amplify/amplify-cli/commit/f53596d3346a015708610c3af686d887ac978df7))
* make amplify prompts dependency explicit, lint errors ([#10007](https://github.com/aws-amplify/amplify-cli/issues/10007)) ([66cdc06](https://github.com/aws-amplify/amplify-cli/commit/66cdc06df5f4cba106345af6f6e196b3c3e39445))


### Reverts

* Revert "fix: build resource when adding new env (#10003)" (#10037) ([37253b2](https://github.com/aws-amplify/amplify-cli/commit/37253b2de60a98540dd11a2ebe37500166ea7b00)), closes [#10003](https://github.com/aws-amplify/amplify-cli/issues/10003) [#10037](https://github.com/aws-amplify/amplify-cli/issues/10037)





## [5.9.11](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.9.10...amplify-provider-awscloudformation@5.9.11) (2022-03-17)



## 7.6.25 (2022-03-16)


### Bug Fixes

* allow init with auth role name overrides (ref [#9643](https://github.com/aws-amplify/amplify-cli/issues/9643)) ([#9688](https://github.com/aws-amplify/amplify-cli/issues/9688))  ([dbf9cf5](https://github.com/aws-amplify/amplify-cli/commit/dbf9cf52f19c824d868b30ff50b4c309be58ff86))
* use lib paths instead of src to reference submodule imports across data-cli split ([#9984](https://github.com/aws-amplify/amplify-cli/issues/9984)) ([7130212](https://github.com/aws-amplify/amplify-cli/commit/7130212c8342d8ecb6b35bc2072ec5034780343f))





## [5.9.10](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.9.9...amplify-provider-awscloudformation@5.9.10) (2022-03-14)



## 7.6.24 (2022-03-10)


### Bug Fixes

* build resource when adding new env ([#9847](https://github.com/aws-amplify/amplify-cli/issues/9847)) ([7264e27](https://github.com/aws-amplify/amplify-cli/commit/7264e275306500f9b0e203dcaab3432db06d3cd4))
* **cli:** spinner hiding prompt ([#9875](https://github.com/aws-amplify/amplify-cli/issues/9875)) ([c7e7b90](https://github.com/aws-amplify/amplify-cli/commit/c7e7b90e615da54dd1849435d63068cbe095b55a))
* split policies for both legacy and migrated REST APIs ([#9572](https://github.com/aws-amplify/amplify-cli/issues/9572)) ([436d53f](https://github.com/aws-amplify/amplify-cli/commit/436d53f348954dab02364d1bed528c3b4121ede3))


### Reverts

* Revert "fix: build resource when adding new env (#9847)" (#9957) ([3df3af0](https://github.com/aws-amplify/amplify-cli/commit/3df3af0729a05b60d805dc5311d1626d643d06a5)), closes [#9847](https://github.com/aws-amplify/amplify-cli/issues/9847) [#9957](https://github.com/aws-amplify/amplify-cli/issues/9957)





## [5.9.9](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.9.8...amplify-provider-awscloudformation@5.9.9) (2022-03-07)


### Bug Fixes

* use existing rather than deleted models ([#9769](https://github.com/aws-amplify/amplify-cli/issues/9769)) ([c4b7487](https://github.com/aws-amplify/amplify-cli/commit/c4b74879feda53bd73746158f4285d3b683981d2))


### Reverts

* Revert "fix: use existing rather than deleted models (#9769)" (#9884) ([94547e0](https://github.com/aws-amplify/amplify-cli/commit/94547e0c2efca702b53929d852274aa07c663206)), closes [#9769](https://github.com/aws-amplify/amplify-cli/issues/9769) [#9884](https://github.com/aws-amplify/amplify-cli/issues/9884)





## [5.9.8](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.9.7...amplify-provider-awscloudformation@5.9.8) (2022-02-25)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [5.9.7](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.9.6...amplify-provider-awscloudformation@5.9.7) (2022-02-18)


### Bug Fixes

* **graphql:** handle sandbox pull with no environment info ([#9776](https://github.com/aws-amplify/amplify-cli/issues/9776)) ([0c6508b](https://github.com/aws-amplify/amplify-cli/commit/0c6508b1ce1f25218d8ce99cf59142b207774fa1))





## [5.9.6](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.9.5...amplify-provider-awscloudformation@5.9.6) (2022-02-15)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [5.9.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.9.1...amplify-provider-awscloudformation@5.9.5) (2022-02-10)



## 7.6.19 (2022-02-08)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [5.9.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.9.0...amplify-provider-awscloudformation@5.9.1) (2022-02-03)

**Note:** Version bump only for package amplify-provider-awscloudformation





# [5.9.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.8.12...amplify-provider-awscloudformation@5.9.0) (2022-01-31)



## 7.6.14 (2022-01-28)


### Features

* `[@maps](https://github.com/maps)To` directive to enable renaming models while retaining data ([#9340](https://github.com/aws-amplify/amplify-cli/issues/9340)) ([aedf45d](https://github.com/aws-amplify/amplify-cli/commit/aedf45d9237812d71bb8b56164efe0222ad3d534))





## [5.8.12](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.8.11...amplify-provider-awscloudformation@5.8.12) (2022-01-27)


### Bug Fixes

* apply cfn pre-push transformer to nested api stacks ([#9595](https://github.com/aws-amplify/amplify-cli/issues/9595)) ([3f20329](https://github.com/aws-amplify/amplify-cli/commit/3f203299bfd6d06726892f759bc50da2069cadf1))
* rest api override CloudFormation parameters ([#9325](https://github.com/aws-amplify/amplify-cli/issues/9325)) ([3338cfa](https://github.com/aws-amplify/amplify-cli/commit/3338cfaee199f83d2e270f12bb41983c067f42fe)), closes [#9221](https://github.com/aws-amplify/amplify-cli/issues/9221)





## [5.8.11](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.8.10...amplify-provider-awscloudformation@5.8.11) (2022-01-23)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [5.8.10](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.8.9...amplify-provider-awscloudformation@5.8.10) (2022-01-20)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [5.8.9](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.8.8...amplify-provider-awscloudformation@5.8.9) (2022-01-20)


### Reverts

* Revert "chore: codegen version bump (#9512)" (#9524) ([b653441](https://github.com/aws-amplify/amplify-cli/commit/b65344134a20785afc96abf1798af89eec93fd84)), closes [#9512](https://github.com/aws-amplify/amplify-cli/issues/9512) [#9524](https://github.com/aws-amplify/amplify-cli/issues/9524)





## [5.8.8](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.8.7...amplify-provider-awscloudformation@5.8.8) (2022-01-13)


### Bug Fixes

* GraphQL V2 fix for codegen ([#9489](https://github.com/aws-amplify/amplify-cli/issues/9489)) ([d8b82b9](https://github.com/aws-amplify/amplify-cli/commit/d8b82b9bf3182efef3c57f02f76b6963bd4d2839))
* update amplify configure to use AdministratorAccess-Amplify ([#9355](https://github.com/aws-amplify/amplify-cli/issues/9355)) ([2d2a8aa](https://github.com/aws-amplify/amplify-cli/commit/2d2a8aaec1a47297126b4bc680625a932c6edcc6))





## [5.8.7](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.8.5...amplify-provider-awscloudformation@5.8.7) (2022-01-10)



## 7.6.7 (2022-01-10)


### Bug Fixes

* add gql transformer version to status output ([#9202](https://github.com/aws-amplify/amplify-cli/issues/9202)) ([f6e0eb0](https://github.com/aws-amplify/amplify-cli/commit/f6e0eb044a3c24ec4e82df506864b4c0de3e5f52))
* remove next template from destructive iterative update ([#9198](https://github.com/aws-amplify/amplify-cli/issues/9198)) ([16bc38a](https://github.com/aws-amplify/amplify-cli/commit/16bc38a43df7e2850cb182cc3947c190f498f042))
* update dep and use node test environment ([#9434](https://github.com/aws-amplify/amplify-cli/issues/9434)) ([1691327](https://github.com/aws-amplify/amplify-cli/commit/1691327740ea40d0ebb974e6aeabc64c62b288ef))





## [5.8.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.8.4...amplify-provider-awscloudformation@5.8.5) (2021-12-21)


### Bug Fixes

* **amplify-provider-awscloudformation:** validate IDP roles on import (ref [#9286](https://github.com/aws-amplify/amplify-cli/issues/9286)) ([#9294](https://github.com/aws-amplify/amplify-cli/issues/9294)) ([3ecd842](https://github.com/aws-amplify/amplify-cli/commit/3ecd842dfc50d81c5c89c80c3400d05159ddf885))





## [5.8.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.8.3...amplify-provider-awscloudformation@5.8.4) (2021-12-17)


### Bug Fixes

* update gql v2 custom transformer loading logic ([#9252](https://github.com/aws-amplify/amplify-cli/issues/9252)) ([f728b4b](https://github.com/aws-amplify/amplify-cli/commit/f728b4bb835674afd32dab7243dd3d826601d333))





## [5.8.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.8.2...amplify-provider-awscloudformation@5.8.3) (2021-12-09)



## 7.6.3 (2021-12-07)


### Bug Fixes

* **amplify-provider-awscloudformation:** use in memory meta for export ([#9208](https://github.com/aws-amplify/amplify-cli/issues/9208)) ([b3ca83b](https://github.com/aws-amplify/amplify-cli/commit/b3ca83b9bec986f0fd525d46738b277eb93e4384))
* incorrect logic from PR [#9144](https://github.com/aws-amplify/amplify-cli/issues/9144), fixes issue [#9197](https://github.com/aws-amplify/amplify-cli/issues/9197) ([#9215](https://github.com/aws-amplify/amplify-cli/issues/9215)) ([98e2cfd](https://github.com/aws-amplify/amplify-cli/commit/98e2cfd1f72aec2c06c7f2d5833bc4fb21e2a498))





## [5.8.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.8.1...amplify-provider-awscloudformation@5.8.2) (2021-12-03)


### Bug Fixes

* incorrect function parameters in invokePluginMethod call ([#9182](https://github.com/aws-amplify/amplify-cli/issues/9182)) ([1be5b27](https://github.com/aws-amplify/amplify-cli/commit/1be5b2735fe009de2631194b07dbda8acd062387))





## [5.8.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.8.0...amplify-provider-awscloudformation@5.8.1) (2021-12-02)



## 7.6.1 (2021-12-02)

**Note:** Version bump only for package amplify-provider-awscloudformation





# [5.8.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.7.3...amplify-provider-awscloudformation@5.8.0) (2021-12-02)



# 7.6.0 (2021-12-02)


### Features

* add uibuilder plugin ([#9178](https://github.com/aws-amplify/amplify-cli/issues/9178)) ([0e95dd8](https://github.com/aws-amplify/amplify-cli/commit/0e95dd8dc2b9cdcc54dcd7a7b896891e17b37f1d))





## [5.7.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.7.2...amplify-provider-awscloudformation@5.7.3) (2021-12-02)



## 7.5.6 (2021-12-01)


### Bug Fixes

* call the correct migration function for Admin Queries ([#9174](https://github.com/aws-amplify/amplify-cli/issues/9174)) ([1ab2e66](https://github.com/aws-amplify/amplify-cli/commit/1ab2e66e1b54d09d68def7186b85644cb6d91653))
* function parameters not being properly added to root stack ([#9144](https://github.com/aws-amplify/amplify-cli/issues/9144)) ([2e600ca](https://github.com/aws-amplify/amplify-cli/commit/2e600ca5f3558e4eb40fe151fb6aba859b82f9d2))





## [5.7.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.7.1...amplify-provider-awscloudformation@5.7.2) (2021-12-01)


### Bug Fixes

* migrate rest apis with protected routes on push ([#9068](https://github.com/aws-amplify/amplify-cli/issues/9068)) ([62b4436](https://github.com/aws-amplify/amplify-cli/commit/62b44365108ba3410c9023623394aa98a52db84e))





## [5.7.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.7.0...amplify-provider-awscloudformation@5.7.1) (2021-11-29)


### Bug Fixes

* don't use path.join() for s3 upload path ([#9096](https://github.com/aws-amplify/amplify-cli/issues/9096)) ([c1787fb](https://github.com/aws-amplify/amplify-cli/commit/c1787fbbe029b5e53a7910877ec7b4a49822602e))





# [5.7.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.6.2...amplify-provider-awscloudformation@5.7.0) (2021-11-26)



## 7.5.3 (2021-11-26)


### Bug Fixes

* console override build issue ([#9078](https://github.com/aws-amplify/amplify-cli/issues/9078)) ([5c9bc5c](https://github.com/aws-amplify/amplify-cli/commit/5c9bc5c4003dd21c2897dc3c4faef9a9c19c1d99))
* transformer version ([#9092](https://github.com/aws-amplify/amplify-cli/issues/9092)) ([acfa82c](https://github.com/aws-amplify/amplify-cli/commit/acfa82c9b275df0a7347ae0700a919dd8c03a4de))


### Features

* make modifying root stack async ([#9080](https://github.com/aws-amplify/amplify-cli/issues/9080)) ([5859e93](https://github.com/aws-amplify/amplify-cli/commit/5859e9399e838824047947347d5253ebaadb629b))





## [5.6.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.6.1...amplify-provider-awscloudformation@5.6.2) (2021-11-25)



## 7.5.2 (2021-11-24)


### Bug Fixes

* aggreagate paginated results in cfn.listStackResources call ([#9073](https://github.com/aws-amplify/amplify-cli/issues/9073)) ([807a0be](https://github.com/aws-amplify/amplify-cli/commit/807a0bef149b0c241024654553b6cc589f08f034))





## [5.6.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.6.0...amplify-provider-awscloudformation@5.6.1) (2021-11-24)


### Bug Fixes

* change describeStackResources() call to listStackResources() ([#9060](https://github.com/aws-amplify/amplify-cli/issues/9060)) ([181ed31](https://github.com/aws-amplify/amplify-cli/commit/181ed31d4561b197764eb17c98392794b43fc26c))





# [5.6.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.5.1...amplify-provider-awscloudformation@5.6.0) (2021-11-23)


### Bug Fixes

* allow custom admin roles to be passed into gql transformer ([#9041](https://github.com/aws-amplify/amplify-cli/issues/9041)) ([02b3d59](https://github.com/aws-amplify/amplify-cli/commit/02b3d59c013889a0c77c99d751896c4e1265d8f4))
* **amplify-provider-awscloudformation:** fixed path as file name ([#9045](https://github.com/aws-amplify/amplify-cli/issues/9045)) ([46fdba3](https://github.com/aws-amplify/amplify-cli/commit/46fdba35f9cced62d146afc45fc1864d4c32d6b9))


### Features

* override support for api category ([#9013](https://github.com/aws-amplify/amplify-cli/issues/9013)) ([ae7b001](https://github.com/aws-amplify/amplify-cli/commit/ae7b001f274f327a29c99c67fe851272c6208e84)), closes [#9001](https://github.com/aws-amplify/amplify-cli/issues/9001) [#8954](https://github.com/aws-amplify/amplify-cli/issues/8954) [#8958](https://github.com/aws-amplify/amplify-cli/issues/8958) [#8960](https://github.com/aws-amplify/amplify-cli/issues/8960) [#8967](https://github.com/aws-amplify/amplify-cli/issues/8967) [#8971](https://github.com/aws-amplify/amplify-cli/issues/8971) [#8976](https://github.com/aws-amplify/amplify-cli/issues/8976) [#8975](https://github.com/aws-amplify/amplify-cli/issues/8975) [#8981](https://github.com/aws-amplify/amplify-cli/issues/8981) [#8983](https://github.com/aws-amplify/amplify-cli/issues/8983) [#8992](https://github.com/aws-amplify/amplify-cli/issues/8992) [#9000](https://github.com/aws-amplify/amplify-cli/issues/9000) [#9002](https://github.com/aws-amplify/amplify-cli/issues/9002) [#9005](https://github.com/aws-amplify/amplify-cli/issues/9005) [#9006](https://github.com/aws-amplify/amplify-cli/issues/9006) [#9007](https://github.com/aws-amplify/amplify-cli/issues/9007) [#9008](https://github.com/aws-amplify/amplify-cli/issues/9008) [#9010](https://github.com/aws-amplify/amplify-cli/issues/9010) [#9011](https://github.com/aws-amplify/amplify-cli/issues/9011) [#9012](https://github.com/aws-amplify/amplify-cli/issues/9012) [#9014](https://github.com/aws-amplify/amplify-cli/issues/9014) [#9015](https://github.com/aws-amplify/amplify-cli/issues/9015) [#9017](https://github.com/aws-amplify/amplify-cli/issues/9017) [#9020](https://github.com/aws-amplify/amplify-cli/issues/9020) [#9024](https://github.com/aws-amplify/amplify-cli/issues/9024) [#9027](https://github.com/aws-amplify/amplify-cli/issues/9027) [#9028](https://github.com/aws-amplify/amplify-cli/issues/9028) [#9029](https://github.com/aws-amplify/amplify-cli/issues/9029) [#9032](https://github.com/aws-amplify/amplify-cli/issues/9032) [#9031](https://github.com/aws-amplify/amplify-cli/issues/9031) [#9035](https://github.com/aws-amplify/amplify-cli/issues/9035) [#9038](https://github.com/aws-amplify/amplify-cli/issues/9038) [#9039](https://github.com/aws-amplify/amplify-cli/issues/9039)





## [5.5.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.5.0...amplify-provider-awscloudformation@5.5.1) (2021-11-21)


### Bug Fixes

* group response and request resolvers by slot ([#8980](https://github.com/aws-amplify/amplify-cli/issues/8980)) ([74cbcc3](https://github.com/aws-amplify/amplify-cli/commit/74cbcc3799201eea4b68c26f4e44ad6bee6704ad))





# [5.5.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.4.3...amplify-provider-awscloudformation@5.5.0) (2021-11-20)


### Bug Fixes

* remove await from sync read cfn calls ([#8977](https://github.com/aws-amplify/amplify-cli/issues/8977)) ([7ef6fb7](https://github.com/aws-amplify/amplify-cli/commit/7ef6fb72739d4618d02dba689a927831b53cb098))


### Features

* added updated stack descriptions ([#8965](https://github.com/aws-amplify/amplify-cli/issues/8965)) ([a1829e0](https://github.com/aws-amplify/amplify-cli/commit/a1829e06089e50a2fed25a606d6617c3debb6bcf))





## [5.4.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.4.1...amplify-provider-awscloudformation@5.4.3) (2021-11-19)


### Bug Fixes

* **amplify-provider-awscloudformation:** fixed the consolidateapigwpolicies for apigw ([#8952](https://github.com/aws-amplify/amplify-cli/issues/8952)) ([74ecd02](https://github.com/aws-amplify/amplify-cli/commit/74ecd02899c288e9f36f21197bc624badaeb15ef))
* exclude admin queries from consolidation ([#8957](https://github.com/aws-amplify/amplify-cli/issues/8957)) ([64bd12f](https://github.com/aws-amplify/amplify-cli/commit/64bd12f42bda0179bb2ed34e6adf8b5a38ba1d5b))





## [5.4.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.4.1...amplify-provider-awscloudformation@5.4.2) (2021-11-19)


### Bug Fixes

* **amplify-provider-awscloudformation:** fixed the consolidateapigwpolicies for apigw ([#8952](https://github.com/aws-amplify/amplify-cli/issues/8952)) ([74ecd02](https://github.com/aws-amplify/amplify-cli/commit/74ecd02899c288e9f36f21197bc624badaeb15ef))





## [5.4.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.4.0...amplify-provider-awscloudformation@5.4.1) (2021-11-18)

**Note:** Version bump only for package amplify-provider-awscloudformation





# [5.4.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.3.3...amplify-provider-awscloudformation@5.4.0) (2021-11-17)



## 7.3.6 (2021-11-17)


### Bug Fixes

* build overrides for headless push with new env init scneario ([#8913](https://github.com/aws-amplify/amplify-cli/issues/8913)) ([489d784](https://github.com/aws-amplify/amplify-cli/commit/489d7840038a775e2a1ebd3dbfb7330fef4f75cf))
* **graphql:** detect resource update on graphql api auth mode change ([#8782](https://github.com/aws-amplify/amplify-cli/issues/8782)) ([714a122](https://github.com/aws-amplify/amplify-cli/commit/714a1221ec1ce72c88ba732172be6b8feab56a09))


### Features

* **graphql-transformer-core:** add support for user defined slots ([#8758](https://github.com/aws-amplify/amplify-cli/issues/8758)) ([87b532d](https://github.com/aws-amplify/amplify-cli/commit/87b532da226c4a3cab619fee115e8b7fd0476d71))





## [5.3.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.3.2...amplify-provider-awscloudformation@5.3.3) (2021-11-16)



## 7.3.3 (2021-11-16)


### Bug Fixes

* stop auto-migration of storage during api gql-compile/push ([#8891](https://github.com/aws-amplify/amplify-cli/issues/8891)) ([fdeacfe](https://github.com/aws-amplify/amplify-cli/commit/fdeacfe785dab3d3549d54cdbddea2f6dd7c9ada))





## [5.3.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.3.1...amplify-provider-awscloudformation@5.3.2) (2021-11-16)


### Bug Fixes

* trigger when break circular dependency  FF is off ([#8879](https://github.com/aws-amplify/amplify-cli/issues/8879)) ([d90d01f](https://github.com/aws-amplify/amplify-cli/commit/d90d01f8f9d7cacfb6279c1e1aff0bcc0cfeb193))





## [5.3.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@5.3.0...amplify-provider-awscloudformation@5.3.1) (2021-11-15)



## 7.3.1 (2021-11-15)


### Bug Fixes

* fixing  deadlock issue when updating/overriding auth or unauth role names  ([#8869](https://github.com/aws-amplify/amplify-cli/issues/8869)) ([fdb9dbc](https://github.com/aws-amplify/amplify-cli/commit/fdb9dbc0f26c5bcaa7d6162203de332cb33ea104))





# [5.3.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.65.0...amplify-provider-awscloudformation@5.3.0) (2021-11-15)



# 7.3.0 (2021-11-15)


### Bug Fixes

* add a check for spinner undefined and error logging ([#8795](https://github.com/aws-amplify/amplify-cli/issues/8795)) ([f0b4331](https://github.com/aws-amplify/amplify-cli/commit/f0b43313227c01d8d4272981f9a41a1e5c34e057))
* add npmignore to custom resource package and update archiver ([#8596](https://github.com/aws-amplify/amplify-cli/issues/8596)) ([a2c32fd](https://github.com/aws-amplify/amplify-cli/commit/a2c32fd92a72bdd4e14926f98e6a88ca195de59e))
* **amplify-provider-awscloudformation:** don't apply preprocessor if no resources ([#8823](https://github.com/aws-amplify/amplify-cli/issues/8823)) ([94de940](https://github.com/aws-amplify/amplify-cli/commit/94de940814fff3d8a7b3ec14626ec909649d9a26))
* auth e2e fixes ([3d1d3fb](https://github.com/aws-amplify/amplify-cli/commit/3d1d3fb88da568efbea0e3c57277c71dedd9d0f7))
* build resources on pull even with no override flag passed + update skeleton package.json ([#8771](https://github.com/aws-amplify/amplify-cli/issues/8771)) ([d13b83e](https://github.com/aws-amplify/amplify-cli/commit/d13b83ee8531724ae417548927043bfa970e71d4))
* enable scoped packages in plugin platform ([#8492](https://github.com/aws-amplify/amplify-cli/issues/8492)) ([f7bd346](https://github.com/aws-amplify/amplify-cli/commit/f7bd346746474be34ad02fc99b9663f5ed7dca56))
* ensure FF on stack transform, revert revert ([#8810](https://github.com/aws-amplify/amplify-cli/issues/8810)) ([868952f](https://github.com/aws-amplify/amplify-cli/commit/868952f9552f09aeb2b0b8e036c59954ee3391e0)), closes [#8796](https://github.com/aws-amplify/amplify-cli/issues/8796) [#8799](https://github.com/aws-amplify/amplify-cli/issues/8799)
* exit auth migration gracefully, add file exists checks ([#8833](https://github.com/aws-amplify/amplify-cli/issues/8833)) ([d6eb740](https://github.com/aws-amplify/amplify-cli/commit/d6eb740048c9c6ea8d5061ec22fce772a4c37a92))
* ext overrides2 storage-headless and predictions ([#8622](https://github.com/aws-amplify/amplify-cli/issues/8622)) ([59e7118](https://github.com/aws-amplify/amplify-cli/commit/59e71184e966ec735724ba501b5b318c1dbd2735))
* fix configure project and custom policies api containers ([#8703](https://github.com/aws-amplify/amplify-cli/issues/8703)) ([a5c8775](https://github.com/aws-amplify/amplify-cli/commit/a5c8775968b3883c4dff1cd7da63f0d8fd4b2426))
* glob fix for auth trigger template ([#8819](https://github.com/aws-amplify/amplify-cli/issues/8819)) ([26a1085](https://github.com/aws-amplify/amplify-cli/commit/26a10852b69ac50a6faafb0ad7ab74012d57e315))
* hooks + hosting e2e ([#8743](https://github.com/aws-amplify/amplify-cli/issues/8743)) ([c995d0b](https://github.com/aws-amplify/amplify-cli/commit/c995d0b4b993b66ec6ba2a6a2376a3ea5de097f9))
* init override test fix ([#8768](https://github.com/aws-amplify/amplify-cli/issues/8768)) ([9674a4e](https://github.com/aws-amplify/amplify-cli/commit/9674a4e344651df0a756513d034c73b822da899e))
* maked the export path relative to export folder ([#8840](https://github.com/aws-amplify/amplify-cli/issues/8840)) ([a8ad1a2](https://github.com/aws-amplify/amplify-cli/commit/a8ad1a224911e1031ea1841ee96f0524069a181a))
* parameters file path and updates cloud backend with build ([#8564](https://github.com/aws-amplify/amplify-cli/issues/8564)) ([f9497fb](https://github.com/aws-amplify/amplify-cli/commit/f9497fb4cd28984d8c3ed9d089e507315e1a3a78))
* rebuild api bad merge ([#8818](https://github.com/aws-amplify/amplify-cli/issues/8818)) ([0e82015](https://github.com/aws-amplify/amplify-cli/commit/0e820159d56172cdba4e92a3f55cccbb471bf9a1))
* remove no-override check for category transformations ([#8765](https://github.com/aws-amplify/amplify-cli/issues/8765)) ([4b557f5](https://github.com/aws-amplify/amplify-cli/commit/4b557f5b276de3c0fa07a9eb81b75d5de03a821b))
* root stack status ([#8856](https://github.com/aws-amplify/amplify-cli/issues/8856)) ([ebc553c](https://github.com/aws-amplify/amplify-cli/commit/ebc553c2a7808d211bdecd52e129faa1c2c5bddc))
* suppress deployment bucket type and root stack fixes ([#8861](https://github.com/aws-amplify/amplify-cli/issues/8861)) ([944f444](https://github.com/aws-amplify/amplify-cli/commit/944f4441e3fc1bc873d9a372597fda6663a27105))
* test fixes ([#8647](https://github.com/aws-amplify/amplify-cli/issues/8647)) ([d746510](https://github.com/aws-amplify/amplify-cli/commit/d746510125b88c4a113adbe2a59beb45427cdb76))
* update custom cdk seleton templates + format override skeleton file ([#8752](https://github.com/aws-amplify/amplify-cli/issues/8752)) ([bef17fb](https://github.com/aws-amplify/amplify-cli/commit/bef17fb349110a693e0310506b706dfda2a3580b))
* update migration msg, ddb import e2e, lgtm errors ([#8796](https://github.com/aws-amplify/amplify-cli/issues/8796)) ([a2d87ec](https://github.com/aws-amplify/amplify-cli/commit/a2d87eca889ed8b23cfe3cf145c0372b655d4ed9))
* updated resource update logic ([#8831](https://github.com/aws-amplify/amplify-cli/issues/8831)) ([c4835c4](https://github.com/aws-amplify/amplify-cli/commit/c4835c409f8f9b22feca30d2f87b866382c38e4f))


### Features

* add default descriptions to cfn templates for metrics tracking ([#8702](https://github.com/aws-amplify/amplify-cli/issues/8702)) ([f6b4cca](https://github.com/aws-amplify/amplify-cli/commit/f6b4cca4bf46e820c61bcebc65461d72c1a064be))
* adding rootstack types to overrides helper package ([#8298](https://github.com/aws-amplify/amplify-cli/issues/8298)) ([3f026f5](https://github.com/aws-amplify/amplify-cli/commit/3f026f5fca11e4e79f0e8347869689c3c683ee06))
* amplify export ([fd28279](https://github.com/aws-amplify/amplify-cli/commit/fd282791167177d72a42784b5de4f2fd461d590a)), closes [#8547](https://github.com/aws-amplify/amplify-cli/issues/8547) [#8488](https://github.com/aws-amplify/amplify-cli/issues/8488) [#8486](https://github.com/aws-amplify/amplify-cli/issues/8486) [#8547](https://github.com/aws-amplify/amplify-cli/issues/8547) [#8488](https://github.com/aws-amplify/amplify-cli/issues/8488) [#8486](https://github.com/aws-amplify/amplify-cli/issues/8486)
* Asana blocker fixes ([#8805](https://github.com/aws-amplify/amplify-cli/issues/8805)) ([c4fbd4b](https://github.com/aws-amplify/amplify-cli/commit/c4fbd4b3e74740239dff15fc2fbad11cbdb3db55))
* Auth refactor to  use cdk, eliminate EJS, overrides functionality ([#8355](https://github.com/aws-amplify/amplify-cli/issues/8355)) ([66d885f](https://github.com/aws-amplify/amplify-cli/commit/66d885f8125f11c0ea3c23f67fec51b553445d42))
* change override.ts file to override.ts.sample in resources/ for pkg CLI to work ([#8716](https://github.com/aws-amplify/amplify-cli/issues/8716)) ([1804b11](https://github.com/aws-amplify/amplify-cli/commit/1804b1162aaad67635ce5b669a5d8819ce88de0e))
* define custom resources with CDK or CFN ([#8590](https://github.com/aws-amplify/amplify-cli/issues/8590)) ([e835584](https://github.com/aws-amplify/amplify-cli/commit/e835584ee8d21a2e4b2480264581de22371cbdba))
* exclude amplify/backend/awscloudformation from gitignore path ([#8794](https://github.com/aws-amplify/amplify-cli/issues/8794)) ([18d202f](https://github.com/aws-amplify/amplify-cli/commit/18d202f504b76cca2854293984bdd9fb5743efaa))
* FF for override stacks ([#8228](https://github.com/aws-amplify/amplify-cli/issues/8228)) ([5a9c68c](https://github.com/aws-amplify/amplify-cli/commit/5a9c68c68ea073ac10577045385f49268a6cdfe5))
* overrides uniformity accross all the categories ([#8695](https://github.com/aws-amplify/amplify-cli/issues/8695)) ([2f6f0eb](https://github.com/aws-amplify/amplify-cli/commit/2f6f0eba6922a345cc549455245a712957e2f352))
* root stack override ([#8276](https://github.com/aws-amplify/amplify-cli/issues/8276)) ([887f617](https://github.com/aws-amplify/amplify-cli/commit/887f617a83d99da1cf93850dc96ff0eebda0fe5a))


### Reverts

* Revert "fix: update migration msg, ddb import e2e, lgtm errors (#8796)" (#8799) ([394a32f](https://github.com/aws-amplify/amplify-cli/commit/394a32f7a801bcf845a180bfdaa7d1d95c5962e7)), closes [#8796](https://github.com/aws-amplify/amplify-cli/issues/8796) [#8799](https://github.com/aws-amplify/amplify-cli/issues/8799)





# [5.0.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.64.0...amplify-provider-awscloudformation@5.0.0) (2021-11-13)


### Bug Fixes

* add [@manytomany](https://github.com/manytomany) join table auth ([#8460](https://github.com/aws-amplify/amplify-cli/issues/8460)) ([424bbda](https://github.com/aws-amplify/amplify-cli/commit/424bbda410fbab100d475d37fa9ab291bfd05317))
* add a check for spinner undefined and error logging ([#8795](https://github.com/aws-amplify/amplify-cli/issues/8795)) ([f0b4331](https://github.com/aws-amplify/amplify-cli/commit/f0b43313227c01d8d4272981f9a41a1e5c34e057))
* add a check if the idp id exists ([#8649](https://github.com/aws-amplify/amplify-cli/issues/8649)) ([a6142b8](https://github.com/aws-amplify/amplify-cli/commit/a6142b857e546de8ba3f6d7c25bc737510eb5212))
* add a validation check for aws environment variables ([#7933](https://github.com/aws-amplify/amplify-cli/issues/7933)) ([8991e78](https://github.com/aws-amplify/amplify-cli/commit/8991e78c8591445ff231adbd0c976579d1d5c7e7))
* add destructuring to require() ([#8544](https://github.com/aws-amplify/amplify-cli/issues/8544)) ([1c00c9f](https://github.com/aws-amplify/amplify-cli/commit/1c00c9fe4866bb01b5e694cf78767b923d2a6208))
* add npmignore to custom resource package and update archiver ([#8596](https://github.com/aws-amplify/amplify-cli/issues/8596)) ([a2c32fd](https://github.com/aws-amplify/amplify-cli/commit/a2c32fd92a72bdd4e14926f98e6a88ca195de59e))
* **amplify-category-api:** change auth directive type and fix codegen bug ([#8639](https://github.com/aws-amplify/amplify-cli/issues/8639)) ([b8d838d](https://github.com/aws-amplify/amplify-cli/commit/b8d838ddfd332c0f6fb36ef52ab76da24b5d26ca))
* **amplify-provider-awscloudformation:** add if/else for warning message in sandbox mode ([#8545](https://github.com/aws-amplify/amplify-cli/issues/8545)) ([1da86c2](https://github.com/aws-amplify/amplify-cli/commit/1da86c2f58e40c1c754c42eefb850bd98e26a2d3))
* **amplify-provider-awscloudformation:** don't apply preprocessor if no resources ([#8823](https://github.com/aws-amplify/amplify-cli/issues/8823)) ([94de940](https://github.com/aws-amplify/amplify-cli/commit/94de940814fff3d8a7b3ec14626ec909649d9a26))
* **amplify-provider-awscloudformation:** use amplify prompts for warnings ([#8731](https://github.com/aws-amplify/amplify-cli/issues/8731)) ([98840ec](https://github.com/aws-amplify/amplify-cli/commit/98840ec1b61e2e424c9884f055227d11c5463c26))
* auth e2e fixes ([3d1d3fb](https://github.com/aws-amplify/amplify-cli/commit/3d1d3fb88da568efbea0e3c57277c71dedd9d0f7))
* broken docs link in error message ([#8436](https://github.com/aws-amplify/amplify-cli/issues/8436)) ([59117c2](https://github.com/aws-amplify/amplify-cli/commit/59117c2b5100441337dd619f5f38f9c86914dfd0))
* build resources on pull even with no override flag passed + update skeleton package.json ([#8771](https://github.com/aws-amplify/amplify-cli/issues/8771)) ([d13b83e](https://github.com/aws-amplify/amplify-cli/commit/d13b83ee8531724ae417548927043bfa970e71d4))
* check in custom policies for api and function ([#8568](https://github.com/aws-amplify/amplify-cli/issues/8568)) ([d932f7b](https://github.com/aws-amplify/amplify-cli/commit/d932f7b1f663369d2a02bf62280172e7c8832dad))
* Custom policies works with `amplify status -v` ([#8531](https://github.com/aws-amplify/amplify-cli/issues/8531)) ([01f18e4](https://github.com/aws-amplify/amplify-cli/commit/01f18e4a8893f0a2f8833680ffae0f74ccdbdcd4))
* e2e test for generating custom policies ([#8580](https://github.com/aws-amplify/amplify-cli/issues/8580)) ([b0a17a2](https://github.com/aws-amplify/amplify-cli/commit/b0a17a24f3ef9d1ced20a6df28272d29fd6cc32f))
* enable scoped packages in plugin platform ([#8492](https://github.com/aws-amplify/amplify-cli/issues/8492)) ([f7bd346](https://github.com/aws-amplify/amplify-cli/commit/f7bd346746474be34ad02fc99b9663f5ed7dca56))
* ensure FF on stack transform, revert revert ([#8810](https://github.com/aws-amplify/amplify-cli/issues/8810)) ([868952f](https://github.com/aws-amplify/amplify-cli/commit/868952f9552f09aeb2b0b8e036c59954ee3391e0)), closes [#8796](https://github.com/aws-amplify/amplify-cli/issues/8796) [#8799](https://github.com/aws-amplify/amplify-cli/issues/8799)
* exit auth migration gracefully, add file exists checks ([#8833](https://github.com/aws-amplify/amplify-cli/issues/8833)) ([d6eb740](https://github.com/aws-amplify/amplify-cli/commit/d6eb740048c9c6ea8d5061ec22fce772a4c37a92))
* ext overrides2 storage-headless and predictions ([#8622](https://github.com/aws-amplify/amplify-cli/issues/8622)) ([59e7118](https://github.com/aws-amplify/amplify-cli/commit/59e71184e966ec735724ba501b5b318c1dbd2735))
* fix configure project and custom policies api containers ([#8703](https://github.com/aws-amplify/amplify-cli/issues/8703)) ([a5c8775](https://github.com/aws-amplify/amplify-cli/commit/a5c8775968b3883c4dff1cd7da63f0d8fd4b2426))
* function dep fix and auth transformer e2e fix ([#8615](https://github.com/aws-amplify/amplify-cli/issues/8615)) ([14921fe](https://github.com/aws-amplify/amplify-cli/commit/14921fe4de8607f2177d92f75060be64cc556c1c))
* glob fix for auth trigger template ([#8819](https://github.com/aws-amplify/amplify-cli/issues/8819)) ([26a1085](https://github.com/aws-amplify/amplify-cli/commit/26a10852b69ac50a6faafb0ad7ab74012d57e315))
* **graphql-model-transformer:** fixed schema template options check for transformer version ([#8449](https://github.com/aws-amplify/amplify-cli/issues/8449)) ([aedcae3](https://github.com/aws-amplify/amplify-cli/commit/aedcae36f445c6e990bd94fd29d1b012e1b13787))
* **graphql-model-transformer:** subscription resolver logical id fix ([#8712](https://github.com/aws-amplify/amplify-cli/issues/8712)) ([f562f37](https://github.com/aws-amplify/amplify-cli/commit/f562f3714b83903c71217c5901c02c9fc71ff365))
* **graphql:** add defensive check on getTablesRequiringReplacement ([#8528](https://github.com/aws-amplify/amplify-cli/issues/8528)) ([26efb7a](https://github.com/aws-amplify/amplify-cli/commit/26efb7a9fa71868cba670c28ac01ec217e5cf4ee))
* hooks + hosting e2e ([#8743](https://github.com/aws-amplify/amplify-cli/issues/8743)) ([c995d0b](https://github.com/aws-amplify/amplify-cli/commit/c995d0b4b993b66ec6ba2a6a2376a3ea5de097f9))
* init override test fix ([#8768](https://github.com/aws-amplify/amplify-cli/issues/8768)) ([9674a4e](https://github.com/aws-amplify/amplify-cli/commit/9674a4e344651df0a756513d034c73b822da899e))
* maked the export path relative to export folder ([#8840](https://github.com/aws-amplify/amplify-cli/issues/8840)) ([a8ad1a2](https://github.com/aws-amplify/amplify-cli/commit/a8ad1a224911e1031ea1841ee96f0524069a181a))
* parameters file path and updates cloud backend with build ([#8564](https://github.com/aws-amplify/amplify-cli/issues/8564)) ([f9497fb](https://github.com/aws-amplify/amplify-cli/commit/f9497fb4cd28984d8c3ed9d089e507315e1a3a78))
* pinpoint feature flag read ([#8496](https://github.com/aws-amplify/amplify-cli/issues/8496)) ([f078323](https://github.com/aws-amplify/amplify-cli/commit/f0783231d58e14766c58180cc314698ded26ef18))
* port sanity check to transformer V2 ([#8563](https://github.com/aws-amplify/amplify-cli/issues/8563)) ([840ce0f](https://github.com/aws-amplify/amplify-cli/commit/840ce0fe1d8194d1d02cf7b443665e31c02c841b))
* rebuild api bad merge ([#8818](https://github.com/aws-amplify/amplify-cli/issues/8818)) ([0e82015](https://github.com/aws-amplify/amplify-cli/commit/0e820159d56172cdba4e92a3f55cccbb471bf9a1))
* reload feature flags after gql v2 flag migration ([#8677](https://github.com/aws-amplify/amplify-cli/issues/8677)) ([cb7bca2](https://github.com/aws-amplify/amplify-cli/commit/cb7bca2cf472216bfe12699f6e529938e30155d7))
* remove duplicate entry from admin ui backend mapping ([#8638](https://github.com/aws-amplify/amplify-cli/issues/8638)) ([0ab3745](https://github.com/aws-amplify/amplify-cli/commit/0ab3745a423c820ced4226ed438c081d825b48ac))
* remove no-override check for category transformations ([#8765](https://github.com/aws-amplify/amplify-cli/issues/8765)) ([4b557f5](https://github.com/aws-amplify/amplify-cli/commit/4b557f5b276de3c0fa07a9eb81b75d5de03a821b))
* safety check for undefined curr cloud backend path ([#8584](https://github.com/aws-amplify/amplify-cli/issues/8584)) ([f72e59b](https://github.com/aws-amplify/amplify-cli/commit/f72e59ba66b74ab59225f1876f88bc60791f8cd7))
* schema migrator utility as separate command ([#8720](https://github.com/aws-amplify/amplify-cli/issues/8720)) ([46e1ee6](https://github.com/aws-amplify/amplify-cli/commit/46e1ee6a49dd86bb682b182a37626bc3f2f966ea))
* test fixes ([#8647](https://github.com/aws-amplify/amplify-cli/issues/8647)) ([d746510](https://github.com/aws-amplify/amplify-cli/commit/d746510125b88c4a113adbe2a59beb45427cdb76))
* update custom cdk seleton templates + format override skeleton file ([#8752](https://github.com/aws-amplify/amplify-cli/issues/8752)) ([bef17fb](https://github.com/aws-amplify/amplify-cli/commit/bef17fb349110a693e0310506b706dfda2a3580b))
* update endpoints to use custom domains in admin-helpers.ts ([#8495](https://github.com/aws-amplify/amplify-cli/issues/8495)) ([2cb2f4d](https://github.com/aws-amplify/amplify-cli/commit/2cb2f4d855d696e63392f2c356d2b3913d0537a7))
* update logic for identifying primary key changes ([#8583](https://github.com/aws-amplify/amplify-cli/issues/8583)) ([c3eb68b](https://github.com/aws-amplify/amplify-cli/commit/c3eb68bf8e2c7d2b303ebae69793d1978b08fc79))
* update migration msg, ddb import e2e, lgtm errors ([#8796](https://github.com/aws-amplify/amplify-cli/issues/8796)) ([a2d87ec](https://github.com/aws-amplify/amplify-cli/commit/a2d87eca889ed8b23cfe3cf145c0372b655d4ed9))
* updated resource update logic ([#8831](https://github.com/aws-amplify/amplify-cli/issues/8831)) ([c4835c4](https://github.com/aws-amplify/amplify-cli/commit/c4835c409f8f9b22feca30d2f87b866382c38e4f))
* use userpoolid as indicator for addAwsIamAuthInOutputSchema ([#8570](https://github.com/aws-amplify/amplify-cli/issues/8570)) ([9c86958](https://github.com/aws-amplify/amplify-cli/commit/9c869589e9cb8d0e61769b40633ba2fd3d9d06fc))


### Features

* Activate graphql migrator behind feature flag ([5a76b3a](https://github.com/aws-amplify/amplify-cli/commit/5a76b3a320012c09d2ff2f424283fafba74fa74d))
* add admin roles which have admin control over a graphql api ([#8601](https://github.com/aws-amplify/amplify-cli/issues/8601)) ([4d50df0](https://github.com/aws-amplify/amplify-cli/commit/4d50df000c6e11165d2da766c0eaa0097d88a0c2))
* add default descriptions to cfn templates for metrics tracking ([#8702](https://github.com/aws-amplify/amplify-cli/issues/8702)) ([f6b4cca](https://github.com/aws-amplify/amplify-cli/commit/f6b4cca4bf46e820c61bcebc65461d72c1a064be))
* adding rootstack types to overrides helper package ([#8298](https://github.com/aws-amplify/amplify-cli/issues/8298)) ([3f026f5](https://github.com/aws-amplify/amplify-cli/commit/3f026f5fca11e4e79f0e8347869689c3c683ee06))
* allow optional idp arg into auth to allow provided auth role or authenticated identity ([#8609](https://github.com/aws-amplify/amplify-cli/issues/8609)) ([bf843b9](https://github.com/aws-amplify/amplify-cli/commit/bf843b90330d8ceb2ea90bc2761edd57e5d5123b))
* amplify export ([fd28279](https://github.com/aws-amplify/amplify-cli/commit/fd282791167177d72a42784b5de4f2fd461d590a)), closes [#8547](https://github.com/aws-amplify/amplify-cli/issues/8547) [#8488](https://github.com/aws-amplify/amplify-cli/issues/8488) [#8486](https://github.com/aws-amplify/amplify-cli/issues/8486) [#8547](https://github.com/aws-amplify/amplify-cli/issues/8547) [#8488](https://github.com/aws-amplify/amplify-cli/issues/8488) [#8486](https://github.com/aws-amplify/amplify-cli/issues/8486)
* **amplify-provider-awscloudformation:** change global_auth_rule to globalAuthRule for global auth ([#8674](https://github.com/aws-amplify/amplify-cli/issues/8674)) ([7a06216](https://github.com/aws-amplify/amplify-cli/commit/7a06216c0a56d9ab886ebb16b2179394fc5e76d2))
* **amplify-provider-awscloudformation:** change sandbox mode syntax in schema ([#8592](https://github.com/aws-amplify/amplify-cli/issues/8592)) ([a3bdd44](https://github.com/aws-amplify/amplify-cli/commit/a3bdd44fddd3414a39d561510092084a1b8e6e61))
* **amplify-provider-awscloudformation:** enable custom resolvers for v2 transformer ([#8454](https://github.com/aws-amplify/amplify-cli/issues/8454)) ([934ad64](https://github.com/aws-amplify/amplify-cli/commit/934ad648e392050075f21413f8269ffe432e59dd))
* **amplify-provider-awscloudformation:** merge user config with transform generated resolvers ([#8447](https://github.com/aws-amplify/amplify-cli/issues/8447)) ([4d553e5](https://github.com/aws-amplify/amplify-cli/commit/4d553e5602a84729e517a3716338f2235567ea82))
* Asana blocker fixes ([#8805](https://github.com/aws-amplify/amplify-cli/issues/8805)) ([c4fbd4b](https://github.com/aws-amplify/amplify-cli/commit/c4fbd4b3e74740239dff15fc2fbad11cbdb3db55))
* Auth refactor to  use cdk, eliminate EJS, overrides functionality ([#8355](https://github.com/aws-amplify/amplify-cli/issues/8355)) ([66d885f](https://github.com/aws-amplify/amplify-cli/commit/66d885f8125f11c0ea3c23f67fec51b553445d42))
* change override.ts file to override.ts.sample in resources/ for pkg CLI to work ([#8716](https://github.com/aws-amplify/amplify-cli/issues/8716)) ([1804b11](https://github.com/aws-amplify/amplify-cli/commit/1804b1162aaad67635ce5b669a5d8819ce88de0e))
* define custom resources with CDK or CFN ([#8590](https://github.com/aws-amplify/amplify-cli/issues/8590)) ([e835584](https://github.com/aws-amplify/amplify-cli/commit/e835584ee8d21a2e4b2480264581de22371cbdba))
* exclude amplify/backend/awscloudformation from gitignore path ([#8794](https://github.com/aws-amplify/amplify-cli/issues/8794)) ([18d202f](https://github.com/aws-amplify/amplify-cli/commit/18d202f504b76cca2854293984bdd9fb5743efaa))
* FF for override stacks ([#8228](https://github.com/aws-amplify/amplify-cli/issues/8228)) ([5a9c68c](https://github.com/aws-amplify/amplify-cli/commit/5a9c68c68ea073ac10577045385f49268a6cdfe5))
* flag to allow destructive schema changes ([#8273](https://github.com/aws-amplify/amplify-cli/issues/8273)) ([18de856](https://github.com/aws-amplify/amplify-cli/commit/18de856fb61bf2df8f73375e4e55a58c6159a232))
* **graphql-model-transformer:** added transformer version feature flag ([#8328](https://github.com/aws-amplify/amplify-cli/issues/8328)) ([922bf61](https://github.com/aws-amplify/amplify-cli/commit/922bf6198b88826a72d2c1c47fbd31148e2b1250))
* overrides uniformity accross all the categories ([#8695](https://github.com/aws-amplify/amplify-cli/issues/8695)) ([2f6f0eb](https://github.com/aws-amplify/amplify-cli/commit/2f6f0eba6922a345cc549455245a712957e2f352))
* root stack override ([#8276](https://github.com/aws-amplify/amplify-cli/issues/8276)) ([887f617](https://github.com/aws-amplify/amplify-cli/commit/887f617a83d99da1cf93850dc96ff0eebda0fe5a))
* version blocking for CLI ([#8512](https://github.com/aws-amplify/amplify-cli/issues/8512)) ([52edf2b](https://github.com/aws-amplify/amplify-cli/commit/52edf2b58508c96e78184aba1f77c06c021cc9b1))
* version blocking for CLI ([#8737](https://github.com/aws-amplify/amplify-cli/issues/8737)) ([b92cd32](https://github.com/aws-amplify/amplify-cli/commit/b92cd32afc3afb75b3fd7ddcc93a5d510b4fac2e))


### Reverts

* Revert "fix: update migration msg, ddb import e2e, lgtm errors (#8796)" (#8799) ([394a32f](https://github.com/aws-amplify/amplify-cli/commit/394a32f7a801bcf845a180bfdaa7d1d95c5962e7)), closes [#8796](https://github.com/aws-amplify/amplify-cli/issues/8796) [#8799](https://github.com/aws-amplify/amplify-cli/issues/8799)
* Revert "feat: version blocking for CLI (#8737)" (#8747) ([2d5110c](https://github.com/aws-amplify/amplify-cli/commit/2d5110c22412a56027417bc691030aa1ea18121e)), closes [#8737](https://github.com/aws-amplify/amplify-cli/issues/8737) [#8747](https://github.com/aws-amplify/amplify-cli/issues/8747)
* Revert "feat: version blocking for CLI (#8512)" (#8522) ([c48453b](https://github.com/aws-amplify/amplify-cli/commit/c48453bc261d3f424e15179d40d6a21f5b15002a)), closes [#8512](https://github.com/aws-amplify/amplify-cli/issues/8512) [#8522](https://github.com/aws-amplify/amplify-cli/issues/8522)





# [4.65.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.64.0...amplify-provider-awscloudformation@4.65.0) (2021-11-11)


### Bug Fixes

* add [@manytomany](https://github.com/manytomany) join table auth ([#8460](https://github.com/aws-amplify/amplify-cli/issues/8460)) ([424bbda](https://github.com/aws-amplify/amplify-cli/commit/424bbda410fbab100d475d37fa9ab291bfd05317))
* add a check if the idp id exists ([#8649](https://github.com/aws-amplify/amplify-cli/issues/8649)) ([a6142b8](https://github.com/aws-amplify/amplify-cli/commit/a6142b857e546de8ba3f6d7c25bc737510eb5212))
* add a validation check for aws environment variables ([#7933](https://github.com/aws-amplify/amplify-cli/issues/7933)) ([8991e78](https://github.com/aws-amplify/amplify-cli/commit/8991e78c8591445ff231adbd0c976579d1d5c7e7))
* add destructuring to require() ([#8544](https://github.com/aws-amplify/amplify-cli/issues/8544)) ([1c00c9f](https://github.com/aws-amplify/amplify-cli/commit/1c00c9fe4866bb01b5e694cf78767b923d2a6208))
* **amplify-category-api:** change auth directive type and fix codegen bug ([#8639](https://github.com/aws-amplify/amplify-cli/issues/8639)) ([b8d838d](https://github.com/aws-amplify/amplify-cli/commit/b8d838ddfd332c0f6fb36ef52ab76da24b5d26ca))
* **amplify-provider-awscloudformation:** add if/else for warning message in sandbox mode ([#8545](https://github.com/aws-amplify/amplify-cli/issues/8545)) ([1da86c2](https://github.com/aws-amplify/amplify-cli/commit/1da86c2f58e40c1c754c42eefb850bd98e26a2d3))
* **amplify-provider-awscloudformation:** use amplify prompts for warnings ([#8731](https://github.com/aws-amplify/amplify-cli/issues/8731)) ([98840ec](https://github.com/aws-amplify/amplify-cli/commit/98840ec1b61e2e424c9884f055227d11c5463c26))
* broken docs link in error message ([#8436](https://github.com/aws-amplify/amplify-cli/issues/8436)) ([59117c2](https://github.com/aws-amplify/amplify-cli/commit/59117c2b5100441337dd619f5f38f9c86914dfd0))
* check in custom policies for api and function ([#8568](https://github.com/aws-amplify/amplify-cli/issues/8568)) ([d932f7b](https://github.com/aws-amplify/amplify-cli/commit/d932f7b1f663369d2a02bf62280172e7c8832dad))
* Custom policies works with `amplify status -v` ([#8531](https://github.com/aws-amplify/amplify-cli/issues/8531)) ([01f18e4](https://github.com/aws-amplify/amplify-cli/commit/01f18e4a8893f0a2f8833680ffae0f74ccdbdcd4))
* e2e test for generating custom policies ([#8580](https://github.com/aws-amplify/amplify-cli/issues/8580)) ([b0a17a2](https://github.com/aws-amplify/amplify-cli/commit/b0a17a24f3ef9d1ced20a6df28272d29fd6cc32f))
* function dep fix and auth transformer e2e fix ([#8615](https://github.com/aws-amplify/amplify-cli/issues/8615)) ([14921fe](https://github.com/aws-amplify/amplify-cli/commit/14921fe4de8607f2177d92f75060be64cc556c1c))
* **graphql-model-transformer:** fixed schema template options check for transformer version ([#8449](https://github.com/aws-amplify/amplify-cli/issues/8449)) ([aedcae3](https://github.com/aws-amplify/amplify-cli/commit/aedcae36f445c6e990bd94fd29d1b012e1b13787))
* **graphql-model-transformer:** subscription resolver logical id fix ([#8712](https://github.com/aws-amplify/amplify-cli/issues/8712)) ([f562f37](https://github.com/aws-amplify/amplify-cli/commit/f562f3714b83903c71217c5901c02c9fc71ff365))
* **graphql:** add defensive check on getTablesRequiringReplacement ([#8528](https://github.com/aws-amplify/amplify-cli/issues/8528)) ([26efb7a](https://github.com/aws-amplify/amplify-cli/commit/26efb7a9fa71868cba670c28ac01ec217e5cf4ee))
* pinpoint feature flag read ([#8496](https://github.com/aws-amplify/amplify-cli/issues/8496)) ([f078323](https://github.com/aws-amplify/amplify-cli/commit/f0783231d58e14766c58180cc314698ded26ef18))
* port sanity check to transformer V2 ([#8563](https://github.com/aws-amplify/amplify-cli/issues/8563)) ([840ce0f](https://github.com/aws-amplify/amplify-cli/commit/840ce0fe1d8194d1d02cf7b443665e31c02c841b))
* reload feature flags after gql v2 flag migration ([#8677](https://github.com/aws-amplify/amplify-cli/issues/8677)) ([cb7bca2](https://github.com/aws-amplify/amplify-cli/commit/cb7bca2cf472216bfe12699f6e529938e30155d7))
* remove duplicate entry from admin ui backend mapping ([#8638](https://github.com/aws-amplify/amplify-cli/issues/8638)) ([0ab3745](https://github.com/aws-amplify/amplify-cli/commit/0ab3745a423c820ced4226ed438c081d825b48ac))
* safety check for undefined curr cloud backend path ([#8584](https://github.com/aws-amplify/amplify-cli/issues/8584)) ([f72e59b](https://github.com/aws-amplify/amplify-cli/commit/f72e59ba66b74ab59225f1876f88bc60791f8cd7))
* schema migrator utility as separate command ([#8720](https://github.com/aws-amplify/amplify-cli/issues/8720)) ([46e1ee6](https://github.com/aws-amplify/amplify-cli/commit/46e1ee6a49dd86bb682b182a37626bc3f2f966ea))
* update endpoints to use custom domains in admin-helpers.ts ([#8495](https://github.com/aws-amplify/amplify-cli/issues/8495)) ([2cb2f4d](https://github.com/aws-amplify/amplify-cli/commit/2cb2f4d855d696e63392f2c356d2b3913d0537a7))
* update logic for identifying primary key changes ([#8583](https://github.com/aws-amplify/amplify-cli/issues/8583)) ([c3eb68b](https://github.com/aws-amplify/amplify-cli/commit/c3eb68bf8e2c7d2b303ebae69793d1978b08fc79))
* use userpoolid as indicator for addAwsIamAuthInOutputSchema ([#8570](https://github.com/aws-amplify/amplify-cli/issues/8570)) ([9c86958](https://github.com/aws-amplify/amplify-cli/commit/9c869589e9cb8d0e61769b40633ba2fd3d9d06fc))


### Features

* Activate graphql migrator behind feature flag ([5a76b3a](https://github.com/aws-amplify/amplify-cli/commit/5a76b3a320012c09d2ff2f424283fafba74fa74d))
* add admin roles which have admin control over a graphql api ([#8601](https://github.com/aws-amplify/amplify-cli/issues/8601)) ([4d50df0](https://github.com/aws-amplify/amplify-cli/commit/4d50df000c6e11165d2da766c0eaa0097d88a0c2))
* allow optional idp arg into auth to allow provided auth role or authenticated identity ([#8609](https://github.com/aws-amplify/amplify-cli/issues/8609)) ([bf843b9](https://github.com/aws-amplify/amplify-cli/commit/bf843b90330d8ceb2ea90bc2761edd57e5d5123b))
* **amplify-provider-awscloudformation:** change global_auth_rule to globalAuthRule for global auth ([#8674](https://github.com/aws-amplify/amplify-cli/issues/8674)) ([7a06216](https://github.com/aws-amplify/amplify-cli/commit/7a06216c0a56d9ab886ebb16b2179394fc5e76d2))
* **amplify-provider-awscloudformation:** change sandbox mode syntax in schema ([#8592](https://github.com/aws-amplify/amplify-cli/issues/8592)) ([a3bdd44](https://github.com/aws-amplify/amplify-cli/commit/a3bdd44fddd3414a39d561510092084a1b8e6e61))
* **amplify-provider-awscloudformation:** enable custom resolvers for v2 transformer ([#8454](https://github.com/aws-amplify/amplify-cli/issues/8454)) ([934ad64](https://github.com/aws-amplify/amplify-cli/commit/934ad648e392050075f21413f8269ffe432e59dd))
* **amplify-provider-awscloudformation:** merge user config with transform generated resolvers ([#8447](https://github.com/aws-amplify/amplify-cli/issues/8447)) ([4d553e5](https://github.com/aws-amplify/amplify-cli/commit/4d553e5602a84729e517a3716338f2235567ea82))
* flag to allow destructive schema changes ([#8273](https://github.com/aws-amplify/amplify-cli/issues/8273)) ([18de856](https://github.com/aws-amplify/amplify-cli/commit/18de856fb61bf2df8f73375e4e55a58c6159a232))
* **graphql-model-transformer:** added transformer version feature flag ([#8328](https://github.com/aws-amplify/amplify-cli/issues/8328)) ([922bf61](https://github.com/aws-amplify/amplify-cli/commit/922bf6198b88826a72d2c1c47fbd31148e2b1250))
* version blocking for CLI ([#8512](https://github.com/aws-amplify/amplify-cli/issues/8512)) ([52edf2b](https://github.com/aws-amplify/amplify-cli/commit/52edf2b58508c96e78184aba1f77c06c021cc9b1))
* version blocking for CLI ([#8737](https://github.com/aws-amplify/amplify-cli/issues/8737)) ([b92cd32](https://github.com/aws-amplify/amplify-cli/commit/b92cd32afc3afb75b3fd7ddcc93a5d510b4fac2e))


### Reverts

* Revert "feat: version blocking for CLI (#8737)" (#8747) ([2d5110c](https://github.com/aws-amplify/amplify-cli/commit/2d5110c22412a56027417bc691030aa1ea18121e)), closes [#8737](https://github.com/aws-amplify/amplify-cli/issues/8737) [#8747](https://github.com/aws-amplify/amplify-cli/issues/8747)
* Revert "feat: version blocking for CLI (#8512)" (#8522) ([c48453b](https://github.com/aws-amplify/amplify-cli/commit/c48453bc261d3f424e15179d40d6a21f5b15002a)), closes [#8512](https://github.com/aws-amplify/amplify-cli/issues/8512) [#8522](https://github.com/aws-amplify/amplify-cli/issues/8522)





# [4.64.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.63.0...amplify-provider-awscloudformation@4.64.0) (2021-10-13)


### Features

* Geo category plugin - support for additional regions ([#8373](https://github.com/aws-amplify/amplify-cli/issues/8373)) ([3a0c29f](https://github.com/aws-amplify/amplify-cli/commit/3a0c29fc1cb07fb1f16ac9546148c564eee97989))





# [4.63.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.62.1...amplify-provider-awscloudformation@4.63.0) (2021-10-10)


### Bug Fixes

* **amplify-category-api:** fixed api to reference stack name and deployment bucket ([#8145](https://github.com/aws-amplify/amplify-cli/issues/8145)) ([4c7493a](https://github.com/aws-amplify/amplify-cli/commit/4c7493ac34fa89cab0c80e5c674bbeb102891a64))


### Features

* **amplify-provider-awscloudformation:** enable custom resolvers for v2 transformer ([#8332](https://github.com/aws-amplify/amplify-cli/issues/8332)) ([1c73042](https://github.com/aws-amplify/amplify-cli/commit/1c730423085b09b4ba681193f020c30bc2a5e3cc))
* **amplify-provider-awscloudformation:** merge user config with transform generated resolvers ([#8262](https://github.com/aws-amplify/amplify-cli/issues/8262)) ([f25abbf](https://github.com/aws-amplify/amplify-cli/commit/f25abbf68f1e268f6e3dcb362685e7fe9ec760c8))
* **graphql-default-value-transformer:** implemented default value directive ([#8291](https://github.com/aws-amplify/amplify-cli/issues/8291)) ([130aba1](https://github.com/aws-amplify/amplify-cli/commit/130aba1dda122b3289270d1a711da6e0326ecf90))


### Reverts

* Revert custom override resolvers (#8409) ([efbd048](https://github.com/aws-amplify/amplify-cli/commit/efbd04873815be2f0268d2ba072a022c8e699a52)), closes [#8409](https://github.com/aws-amplify/amplify-cli/issues/8409) [#8332](https://github.com/aws-amplify/amplify-cli/issues/8332) [#8262](https://github.com/aws-amplify/amplify-cli/issues/8262)





## [4.62.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.62.0...amplify-provider-awscloudformation@4.62.1) (2021-10-08)


### Bug Fixes

* **amplify-category-api:** custom policies attached to TaskRoleArn ([#8376](https://github.com/aws-amplify/amplify-cli/issues/8376)) ([6d92c8b](https://github.com/aws-amplify/amplify-cli/commit/6d92c8b31541381e16507f0be2f608db30164139))
* opensearch warning, add optional chaining to get api category ([#8371](https://github.com/aws-amplify/amplify-cli/issues/8371)) ([2bdae3a](https://github.com/aws-amplify/amplify-cli/commit/2bdae3ac09c0fd065fb03115cfbdc4d29c3577fe))





# [4.62.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.61.1...amplify-provider-awscloudformation@4.62.0) (2021-10-06)



# 6.2.0 (2021-10-05)


### Bug Fixes

* **graphql-model-transformer:** fix open search instance check for v1 and v2 transformers ([#8354](https://github.com/aws-amplify/amplify-cli/issues/8354)) ([d7d9476](https://github.com/aws-amplify/amplify-cli/commit/d7d9476ff0d3e5f49b02d2de86f87b2f247e7a8d))


### Features

* Custom policies IAM Policies for Lambda and Containers ([#8068](https://github.com/aws-amplify/amplify-cli/issues/8068)) ([3e1ce0d](https://github.com/aws-amplify/amplify-cli/commit/3e1ce0de4d25ab239adcdcef778cc82f30b17a94))





## [4.61.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.61.0...amplify-provider-awscloudformation@4.61.1) (2021-10-01)


### Bug Fixes

* logic to display searchable instance warning ([#8297](https://github.com/aws-amplify/amplify-cli/issues/8297)) ([1fc7a9a](https://github.com/aws-amplify/amplify-cli/commit/1fc7a9ae0a585b1abf9f94ad982e5573ead22391))





# [4.61.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.60.1...amplify-provider-awscloudformation@4.61.0) (2021-09-27)


### Bug Fixes

* add pull check for missing s3 objects, ref [#8233](https://github.com/aws-amplify/amplify-cli/issues/8233) ([#8250](https://github.com/aws-amplify/amplify-cli/issues/8250)) ([d17309d](https://github.com/aws-amplify/amplify-cli/commit/d17309d36679f7b0c2fee858f38c44618e885370))
* **amplify-cli-core:** add service mapping FFs ([#7024](https://github.com/aws-amplify/amplify-cli/issues/7024)) ([36fe24d](https://github.com/aws-amplify/amplify-cli/commit/36fe24db9f37a8a12d50f1e20ea44562eb44d04a))
* **graphql-model-transformer:** [@model](https://github.com/model) conflict resolution ([#8035](https://github.com/aws-amplify/amplify-cli/issues/8035)) ([f3bdc4a](https://github.com/aws-amplify/amplify-cli/commit/f3bdc4ac1fcf596f634d9d2e968785e76f7b138c))
* **graphql-model-transformer:** provide correct directive definitions based on transformer version ([#8208](https://github.com/aws-amplify/amplify-cli/issues/8208)) ([5583cd4](https://github.com/aws-amplify/amplify-cli/commit/5583cd47e620992ea9df1f02d812577dc90391eb))


### Features

* add [@many](https://github.com/many)ToMany directive ([#8195](https://github.com/aws-amplify/amplify-cli/issues/8195)) ([cc644eb](https://github.com/aws-amplify/amplify-cli/commit/cc644ebc4968f29ad6b3f0b42013d7ee6a142f7e))
* Flag to allow schema changes that require table replacement ([#8144](https://github.com/aws-amplify/amplify-cli/issues/8144)) ([2d4e65a](https://github.com/aws-amplify/amplify-cli/commit/2d4e65acfd034d33c6fa8ac1f5f8582e7e3bc399))


### Reverts

* Revert "feat: Flag to allow schema changes that require table replacement (#8144)" (#8268) ([422dd04](https://github.com/aws-amplify/amplify-cli/commit/422dd04425c72aa7276e086d38ce4d5f4681f9f3)), closes [#8144](https://github.com/aws-amplify/amplify-cli/issues/8144) [#8268](https://github.com/aws-amplify/amplify-cli/issues/8268)





## [4.60.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.60.0...amplify-provider-awscloudformation@4.60.1) (2021-09-18)

**Note:** Version bump only for package amplify-provider-awscloudformation





# [4.60.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.59.0...amplify-provider-awscloudformation@4.60.0) (2021-09-14)



# 5.6.0 (2021-09-14)


### Features

* support five new regions in CLI ([#8094](https://github.com/aws-amplify/amplify-cli/issues/8094)) ([98e6c56](https://github.com/aws-amplify/amplify-cli/commit/98e6c56b21cc9a7e1145ab658c3d8611474d5c44))
* version blocking for CLI ([#7834](https://github.com/aws-amplify/amplify-cli/issues/7834)) ([045ef3b](https://github.com/aws-amplify/amplify-cli/commit/045ef3b83598c287b7e34bb5d1487bbe026026af))


### Reverts

* Revert "feat: version blocking for CLI (#7834)" (#8170) ([f5a92e3](https://github.com/aws-amplify/amplify-cli/commit/f5a92e3fcd288ba8f5eb48db62ccf02f6bb7d03d)), closes [#7834](https://github.com/aws-amplify/amplify-cli/issues/7834) [#8170](https://github.com/aws-amplify/amplify-cli/issues/8170)





# [4.59.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.58.0...amplify-provider-awscloudformation@4.59.0) (2021-09-09)


### Features

* Amplify Command Hooks ([#7633](https://github.com/aws-amplify/amplify-cli/issues/7633)) ([4cacaad](https://github.com/aws-amplify/amplify-cli/commit/4cacaadcb87d377a37890b0092bf66c6e7b65b0b))





# [4.58.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.57.0...amplify-provider-awscloudformation@4.58.0) (2021-09-02)


### Bug Fixes

* **amplify-provider-awscloudformation:** display mfa prompt ([#7866](https://github.com/aws-amplify/amplify-cli/issues/7866)) ([8947b18](https://github.com/aws-amplify/amplify-cli/commit/8947b187bf7a7ff6c998488a9931839ca3169d02))


### Features

* add new relational modeling directives ([#7997](https://github.com/aws-amplify/amplify-cli/issues/7997)) ([e9cdb7a](https://github.com/aws-amplify/amplify-cli/commit/e9cdb7a1a45b8f16546952a469ab2d45f82e855c))


### Reverts

* Revert "fix(amplify-provider-awscloudformation): display mfa prompt (#7866)" (#8054) ([7b5de7b](https://github.com/aws-amplify/amplify-cli/commit/7b5de7b553e189a47c88e2902a0f21744a16dc10)), closes [#7866](https://github.com/aws-amplify/amplify-cli/issues/7866) [#8054](https://github.com/aws-amplify/amplify-cli/issues/8054)





# [4.57.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.56.1...amplify-provider-awscloudformation@4.57.0) (2021-08-24)


### Bug Fixes

* remove side effect from getConfigForEnv ([#7990](https://github.com/aws-amplify/amplify-cli/issues/7990)) ([02b6f84](https://github.com/aws-amplify/amplify-cli/commit/02b6f84b1312b1859626d4f29853b4a11de41c57))
* specify default auth role name on import auth ([#7921](https://github.com/aws-amplify/amplify-cli/issues/7921)) ([148c994](https://github.com/aws-amplify/amplify-cli/commit/148c9947b010ae21d426f71f7d89d5ebe278dd19))


### Features

* add [@index](https://github.com/index) directive ([#7887](https://github.com/aws-amplify/amplify-cli/issues/7887)) ([e011555](https://github.com/aws-amplify/amplify-cli/commit/e0115557aad893b3286226e92ce8fecbd5636c1a))





## [4.56.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.56.0...amplify-provider-awscloudformation@4.56.1) (2021-08-06)

**Note:** Version bump only for package amplify-provider-awscloudformation





# [4.56.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.55.2...amplify-provider-awscloudformation@4.56.0) (2021-07-30)


### Bug Fixes

* lambda timeout should be an integer type ([#7699](https://github.com/aws-amplify/amplify-cli/issues/7699)) ([cbacf4d](https://github.com/aws-amplify/amplify-cli/commit/cbacf4d3e497421855c09825970e025550aacfd7))


### Features

* add [@primary](https://github.com/primary)Key directive to Transformer v2 ([#7797](https://github.com/aws-amplify/amplify-cli/issues/7797)) ([c11b7dd](https://github.com/aws-amplify/amplify-cli/commit/c11b7dd33152eced2ba23089ef08f5696c73b5f2))





## [4.55.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.55.1...amplify-provider-awscloudformation@4.55.2) (2021-07-27)


### Bug Fixes

* **cli:** prevent re-prompt of info on `amplify pull` ([#7730](https://github.com/aws-amplify/amplify-cli/issues/7730)) ([1919558](https://github.com/aws-amplify/amplify-cli/commit/19195589ab2d8b7382cac100c888bdbb62b9ba59))


### Reverts

* Revert "Revert "ci: add support for e2e token rotation (#7665)" (#7759)" (#7762) ([9ea4c8e](https://github.com/aws-amplify/amplify-cli/commit/9ea4c8e115ae62d7c348c3f0d82c89d795eebf46)), closes [#7665](https://github.com/aws-amplify/amplify-cli/issues/7665) [#7759](https://github.com/aws-amplify/amplify-cli/issues/7759) [#7762](https://github.com/aws-amplify/amplify-cli/issues/7762)
* Revert "ci: add support for e2e token rotation (#7665)" (#7759) ([aadc915](https://github.com/aws-amplify/amplify-cli/commit/aadc9155f5c25478c7f317aec77f51290c6b9cfe)), closes [#7665](https://github.com/aws-amplify/amplify-cli/issues/7665) [#7759](https://github.com/aws-amplify/amplify-cli/issues/7759)





## [4.55.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.55.0...amplify-provider-awscloudformation@4.55.1) (2021-07-16)


### Bug Fixes

* [#7441](https://github.com/aws-amplify/amplify-cli/issues/7441) - init from git prompts for credentials twice ([#7682](https://github.com/aws-amplify/amplify-cli/issues/7682)) ([7471c5f](https://github.com/aws-amplify/amplify-cli/commit/7471c5fcc86af0e17a967066a388f67891f93355))
* **amplify-provider-awscloudformation:** rebase code and fixed yaml template load ([#7518](https://github.com/aws-amplify/amplify-cli/issues/7518)) ([8dfb71c](https://github.com/aws-amplify/amplify-cli/commit/8dfb71cb78fafc108a3d9d67505d46c208607026))





# [4.55.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.54.0...amplify-provider-awscloudformation@4.55.0) (2021-07-12)


### Features

* port [@predictions](https://github.com/predictions) to GraphQL Transformer v2 ([#7387](https://github.com/aws-amplify/amplify-cli/issues/7387)) ([3f2e647](https://github.com/aws-amplify/amplify-cli/commit/3f2e647b9dfe14aa5919b46f53342937dd0c7fa9))





# [4.54.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.53.0...amplify-provider-awscloudformation@4.54.0) (2021-06-30)


### Bug Fixes

* [#7561](https://github.com/aws-amplify/amplify-cli/issues/7561) - auth trigger usage with user groups ([#7592](https://github.com/aws-amplify/amplify-cli/issues/7592)) ([d1d372e](https://github.com/aws-amplify/amplify-cli/commit/d1d372ee55d2fb1c15022642837c1f6fb6994ac8))
* correct featuer typo in gql transformer v2 ([#7584](https://github.com/aws-amplify/amplify-cli/issues/7584)) ([81659ee](https://github.com/aws-amplify/amplify-cli/commit/81659ee2399025307cc1aa05252a712623a95818))


### Features

* configure env vars and secrets for lambda functions ([#7529](https://github.com/aws-amplify/amplify-cli/issues/7529)) ([fac354e](https://github.com/aws-amplify/amplify-cli/commit/fac354e5e26846e8b1499d3a4718b15983e0110f))





# [4.53.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.52.1...amplify-provider-awscloudformation@4.53.0) (2021-06-24)


### Bug Fixes

* includes getAtt to maintain dependency in root stack ([#7392](https://github.com/aws-amplify/amplify-cli/issues/7392)) ([d24b44a](https://github.com/aws-amplify/amplify-cli/commit/d24b44a4731e407fac0391817e851314f1bb13f8))
* Move credential validation to the top function call ([#7401](https://github.com/aws-amplify/amplify-cli/issues/7401)) ([97ed227](https://github.com/aws-amplify/amplify-cli/commit/97ed2275572f89ab2dd231ec15e3ac8602f7987e))
* **graphql-transformer-common:** improve generated graphql pluralization ([#7258](https://github.com/aws-amplify/amplify-cli/issues/7258)) ([fc3ad0d](https://github.com/aws-amplify/amplify-cli/commit/fc3ad0dd5a12a7912c59ae12024f593b4cdf7f2d)), closes [#4224](https://github.com/aws-amplify/amplify-cli/issues/4224)


### Features

* **import-auth:** add headless support ([#7266](https://github.com/aws-amplify/amplify-cli/issues/7266)) ([7fa478b](https://github.com/aws-amplify/amplify-cli/commit/7fa478bbfebbbe70e286eb19d436d772c32c4fd2))





## [4.52.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.52.0...amplify-provider-awscloudformation@4.52.1) (2021-06-19)



## 5.0.1 (2021-06-18)


### Bug Fixes

* catch no updates CFN error and fix CFN poller hang ([#7548](https://github.com/aws-amplify/amplify-cli/issues/7548)) ([312eec3](https://github.com/aws-amplify/amplify-cli/commit/312eec3b5cd9019b500cf1984919af1dee5ef2e0))
* ensure REST API CFN outputs the API ID ([#7538](https://github.com/aws-amplify/amplify-cli/issues/7538)) ([c3f4128](https://github.com/aws-amplify/amplify-cli/commit/c3f41284f86a48427f6a8084e8ffbcd10812b81d))





# [4.52.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.51.0...amplify-provider-awscloudformation@4.52.0) (2021-06-15)


### Bug Fixes

* type mismatch after merge ([#7490](https://github.com/aws-amplify/amplify-cli/issues/7490)) ([b4266a5](https://github.com/aws-amplify/amplify-cli/commit/b4266a5cd3b01070c1022f27c27e2338b038255e))


### Features

* add support for defining IAM Permissions Boundary for Project ([#7144](https://github.com/aws-amplify/amplify-cli/issues/7144)) ([acf031b](https://github.com/aws-amplify/amplify-cli/commit/acf031b29d4e554d647da39ffb8293010cf1d8ad))
* Define IAM Permissions Boundary for Project ([#7502](https://github.com/aws-amplify/amplify-cli/issues/7502)) (ref [#4618](https://github.com/aws-amplify/amplify-cli/issues/4618)) ([08f7a3c](https://github.com/aws-amplify/amplify-cli/commit/08f7a3c45b2e98535ef325eb0a97c5bc4d3008c6)), closes [#7053](https://github.com/aws-amplify/amplify-cli/issues/7053)
* lambda layers rework ([#7375](https://github.com/aws-amplify/amplify-cli/issues/7375)) ([a3b7d3e](https://github.com/aws-amplify/amplify-cli/commit/a3b7d3e427e16bac2b2ea27699fe53b48cf47656))


### Reverts

* Revert "feat: add support for defining IAM Permissions Boundary for Project (#7144)" (#7453) ([08704f0](https://github.com/aws-amplify/amplify-cli/commit/08704f0271f6f5d0e0e98ad7002f4b35c3890924)), closes [#7144](https://github.com/aws-amplify/amplify-cli/issues/7144) [#7453](https://github.com/aws-amplify/amplify-cli/issues/7453)





# [4.51.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.50.2...amplify-provider-awscloudformation@4.51.0) (2021-06-02)



# 4.52.0 (2021-06-01)


### Features

* add support for SMS Sandbox ([#7436](https://github.com/aws-amplify/amplify-cli/issues/7436)) ([cdcb626](https://github.com/aws-amplify/amplify-cli/commit/cdcb6260c11bbedef5b056fdcd730612d8bb3230))





## [4.50.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.50.1...amplify-provider-awscloudformation@4.50.2) (2021-05-29)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [4.50.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.50.0...amplify-provider-awscloudformation@4.50.1) (2021-05-26)



## 4.51.3 (2021-05-25)

**Note:** Version bump only for package amplify-provider-awscloudformation





# [4.50.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.49.0...amplify-provider-awscloudformation@4.50.0) (2021-05-22)



## 4.51.2 (2021-05-20)


### Features

* prep work for Cognito SMS Sandbox [#2](https://github.com/aws-amplify/amplify-cli/issues/2) ([#7338](https://github.com/aws-amplify/amplify-cli/issues/7338)) ([3dbb3bf](https://github.com/aws-amplify/amplify-cli/commit/3dbb3bfc199fdd7faac68cdee236d2625d6fb1ea))





# [4.49.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.48.0...amplify-provider-awscloudformation@4.49.0) (2021-05-18)


### Features

* port [@searchable](https://github.com/searchable) to GraphQL Transformer v2 ([#7291](https://github.com/aws-amplify/amplify-cli/issues/7291)) ([37a2df2](https://github.com/aws-amplify/amplify-cli/commit/37a2df2365fe4bf0eddf285a159221e34f695fe2))





# [4.48.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.47.0...amplify-provider-awscloudformation@4.48.0) (2021-05-14)



# 4.51.0 (2021-05-13)


### Bug Fixes

* handle legacy string permissions ([#7305](https://github.com/aws-amplify/amplify-cli/issues/7305)) ([a6b6ad7](https://github.com/aws-amplify/amplify-cli/commit/a6b6ad74fa7118ca1aae4f61e2e604688c0354e3))
* **amplify-provider-awscloudformation:** add logger to iterative deploys ([#7278](https://github.com/aws-amplify/amplify-cli/issues/7278)) ([4671717](https://github.com/aws-amplify/amplify-cli/commit/4671717ccd79031592bde12c550428b0aa11d750))
* conditionally rebuild container apis on push ([#7175](https://github.com/aws-amplify/amplify-cli/issues/7175)) ([a27a033](https://github.com/aws-amplify/amplify-cli/commit/a27a033af0fe6a9db8becd15b713113c64e70eb3))
* e2e failed tests for auth Triggers PR ([#7262](https://github.com/aws-amplify/amplify-cli/issues/7262)) ([fedb6c4](https://github.com/aws-amplify/amplify-cli/commit/fedb6c49cf0695e21f59929e7d0554b59290f2f1))
* show error message when project initalization fail ([98682ac](https://github.com/aws-amplify/amplify-cli/commit/98682ac4c6fcce4b7ac4d8c69e646d3b8712d325))


### Features

* defer root stack creation to first `amplify push` ([#7174](https://github.com/aws-amplify/amplify-cli/issues/7174)) ([d28dd1c](https://github.com/aws-amplify/amplify-cli/commit/d28dd1caca86b19a858dab0e7aa907d1cc74c86a))
* prep work for SMS Sandbox support ([#7302](https://github.com/aws-amplify/amplify-cli/issues/7302)) ([d1f85d2](https://github.com/aws-amplify/amplify-cli/commit/d1f85d2e0a9c367b71defefe6d9e00737f681ca4))


### Reverts

* Revert "feat: defer root stack creation to first `amplify push` (#7174)" (#7306) ([78854eb](https://github.com/aws-amplify/amplify-cli/commit/78854ebd4a3d41d34d68736d6556045302101265)), closes [#7174](https://github.com/aws-amplify/amplify-cli/issues/7174) [#7306](https://github.com/aws-amplify/amplify-cli/issues/7306)





# [4.47.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.45.0...amplify-provider-awscloudformation@4.47.0) (2021-05-03)



## 4.50.1 (2021-05-03)


### Bug Fixes

* ensure policy resource name when pushing REST APIs ([#7192](https://github.com/aws-amplify/amplify-cli/issues/7192)) ([fc77006](https://github.com/aws-amplify/amplify-cli/commit/fc77006d8f41301604fc4047edf794c23da6c552))
* skip credential validation when config has credential_process ([#7194](https://github.com/aws-amplify/amplify-cli/issues/7194)) ([8f36c94](https://github.com/aws-amplify/amplify-cli/commit/8f36c9446e7128831d878daf225c4b15b67606db))


### Features

* port [@http](https://github.com/http) to GraphQL Transformer v2 ([#7139](https://github.com/aws-amplify/amplify-cli/issues/7139)) ([2803605](https://github.com/aws-amplify/amplify-cli/commit/28036059229666c70ab8d8f7ff6b4d966f6acae8))
* **graphql-function-transformer:** port [@function](https://github.com/function) to v2 ([#7055](https://github.com/aws-amplify/amplify-cli/issues/7055)) ([463e975](https://github.com/aws-amplify/amplify-cli/commit/463e97593d5486d1f9d10bcabde26d3e36dee7f2))





# [4.46.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.45.0...amplify-provider-awscloudformation@4.46.0) (2021-05-03)


### Bug Fixes

* ensure policy resource name when pushing REST APIs ([#7192](https://github.com/aws-amplify/amplify-cli/issues/7192)) ([fc77006](https://github.com/aws-amplify/amplify-cli/commit/fc77006d8f41301604fc4047edf794c23da6c552))
* skip credential validation when config has credential_process ([#7194](https://github.com/aws-amplify/amplify-cli/issues/7194)) ([8f36c94](https://github.com/aws-amplify/amplify-cli/commit/8f36c9446e7128831d878daf225c4b15b67606db))


### Features

* port [@http](https://github.com/http) to GraphQL Transformer v2 ([#7139](https://github.com/aws-amplify/amplify-cli/issues/7139)) ([2803605](https://github.com/aws-amplify/amplify-cli/commit/28036059229666c70ab8d8f7ff6b4d966f6acae8))
* **graphql-function-transformer:** port [@function](https://github.com/function) to v2 ([#7055](https://github.com/aws-amplify/amplify-cli/issues/7055)) ([463e975](https://github.com/aws-amplify/amplify-cli/commit/463e97593d5486d1f9d10bcabde26d3e36dee7f2))





# [4.45.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.44.0...amplify-provider-awscloudformation@4.45.0) (2021-04-27)



# 4.50.0 (2021-04-23)


### Bug Fixes

* consolidate REST API IAM policies ([#6904](https://github.com/aws-amplify/amplify-cli/issues/6904)) (ref [#2084](https://github.com/aws-amplify/amplify-cli/issues/2084)) ([5cfff17](https://github.com/aws-amplify/amplify-cli/commit/5cfff173d57ec9ab68984faf2d0f6474eccdcaae))
* profile validation to include source_profile and role_arn ([#7173](https://github.com/aws-amplify/amplify-cli/issues/7173)) ([70a980f](https://github.com/aws-amplify/amplify-cli/commit/70a980f757cfe6a177818bb2295ff85e06f387b1))
* return rejected promise in getStackEvents() ([#7121](https://github.com/aws-amplify/amplify-cli/issues/7121)) (ref [#7004](https://github.com/aws-amplify/amplify-cli/issues/7004)) ([f259e5a](https://github.com/aws-amplify/amplify-cli/commit/f259e5a1d087103d5a77ad59714684a7621eeaef))
* skip admin queries when consolidating REST APIs ([#7142](https://github.com/aws-amplify/amplify-cli/issues/7142)) ([c8069bd](https://github.com/aws-amplify/amplify-cli/commit/c8069bd1a69dd7bf4d31dd94743c0e4c7c140d85))


### Features

* S3 SSE by default ([#7039](https://github.com/aws-amplify/amplify-cli/issues/7039)) (ref [#5708](https://github.com/aws-amplify/amplify-cli/issues/5708)) ([c1369ed](https://github.com/aws-amplify/amplify-cli/commit/c1369ed6f9c204c89ee2d4c805314a40d6eeaf92))





# [4.44.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.43.0...amplify-provider-awscloudformation@4.44.0) (2021-04-19)


### Bug Fixes

* amplify configure project not updating access keys correctly ([0f064ac](https://github.com/aws-amplify/amplify-cli/commit/0f064ac7624cb0daba9f15a8cbf50842120250b8))
* configure project not updating access keys if profiles present ([116fb30](https://github.com/aws-amplify/amplify-cli/commit/116fb308947ec9db69fd3b820c60467ee46a10d8))
* fix iterative delete for all objects and delete directory ([#7093](https://github.com/aws-amplify/amplify-cli/issues/7093)) ([189a826](https://github.com/aws-amplify/amplify-cli/commit/189a8260b25363caed3ab1f48b1fd9b7f4e4f829))
* render spinner in stateChange update e2e to wait on spinner text ([#7116](https://github.com/aws-amplify/amplify-cli/issues/7116)) ([a46f2a3](https://github.com/aws-amplify/amplify-cli/commit/a46f2a32ec9bf9e75684bc93a2e7089ac3fb894d))


### Features

* **amplify-provider-awscloudformation:** add iterativeRollback ([c4e0593](https://github.com/aws-amplify/amplify-cli/commit/c4e05930a966d83a9e487188f8e56dd35eeb68d1))





# [4.43.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.42.0...amplify-provider-awscloudformation@4.43.0) (2021-04-14)


### Bug Fixes

* **amplify-e2e-core:** update source of truth for supported regions ([#6988](https://github.com/aws-amplify/amplify-cli/issues/6988)) ([bb8f8e6](https://github.com/aws-amplify/amplify-cli/commit/bb8f8e6c03baa99748d1b594fea4d18a947cac5c))
* **amplify-provider-awscloudformation:** fix tests failing due to system-config-manager.js ([#7053](https://github.com/aws-amplify/amplify-cli/issues/7053)) ([07525b3](https://github.com/aws-amplify/amplify-cli/commit/07525b3b4361f5af673687bc265e97ceba359a13))
* **amplify-provider-awscloudformation:** throw helpful error if profile is missing keys ([#7017](https://github.com/aws-amplify/amplify-cli/issues/7017)) ([ebdaa59](https://github.com/aws-amplify/amplify-cli/commit/ebdaa5981004b86e2f84b94d25fc84b25325ee18))


### Features

* added new fields to usage data ([#6911](https://github.com/aws-amplify/amplify-cli/issues/6911)) ([dc1d256](https://github.com/aws-amplify/amplify-cli/commit/dc1d256edecec2009ca6649da0995be571886b03))
* differ metric agent for admin generated stacks ([#6978](https://github.com/aws-amplify/amplify-cli/issues/6978)) ([56907eb](https://github.com/aws-amplify/amplify-cli/commit/56907eb09a5c3ac464545ac437c2b738a4c004b4))





# [4.42.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.40.3...amplify-provider-awscloudformation@4.42.0) (2021-04-09)


### Bug Fixes

* **amplify-provider-awscloudformation:** add slow down on index check ([#7012](https://github.com/aws-amplify/amplify-cli/issues/7012)) ([f70855c](https://github.com/aws-amplify/amplify-cli/commit/f70855cc51523a9446dbaa79b771eac488b64a77))
* **amplify-provider-awscloudformation:** fix http path for s3 url ([#6981](https://github.com/aws-amplify/amplify-cli/issues/6981)) ([24457ed](https://github.com/aws-amplify/amplify-cli/commit/24457eda4bff45cdb5354733db26af27171dee1b))
* **amplify-provider-awscloudformation:** fix state dir creation when there are no template state changes ([#7010](https://github.com/aws-amplify/amplify-cli/issues/7010)) ([f5cbdcb](https://github.com/aws-amplify/amplify-cli/commit/f5cbdcbdf9b4bea84b48c668e8016524574b3afe))
* **amplify-provider-awscloudformation:** fix test ([#6955](https://github.com/aws-amplify/amplify-cli/issues/6955)) ([27030ea](https://github.com/aws-amplify/amplify-cli/commit/27030eaae7ad83b32af18aa448743a994eb23d9d))
* **amplify-provider-awscloudformation:** overriding credentials for env ([#6941](https://github.com/aws-amplify/amplify-cli/issues/6941)) ([d647827](https://github.com/aws-amplify/amplify-cli/commit/d647827ed0792d3c764de88d874d917231c055f5)), closes [#4952](https://github.com/aws-amplify/amplify-cli/issues/4952)


### Features

* **amplify-provider-awscloudformation:** add CFN logging ([#6161](https://github.com/aws-amplify/amplify-cli/issues/6161)) ([f51b6af](https://github.com/aws-amplify/amplify-cli/commit/f51b6aff928862594ed30bcab15d827ef6ca24da)), closes [#6119](https://github.com/aws-amplify/amplify-cli/issues/6119)


### Reverts

* Revert "Init and Configure DX changes (#6745)" ([9078b69](https://github.com/aws-amplify/amplify-cli/commit/9078b69b5842c99f0624797a5e897353bacb65d0)), closes [#6745](https://github.com/aws-amplify/amplify-cli/issues/6745)





## [4.40.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.40.2...amplify-provider-awscloudformation@4.40.3) (2021-03-23)


### Bug Fixes

* detect changes in dockerfile ([#6495](https://github.com/aws-amplify/amplify-cli/issues/6495)) ([2333dec](https://github.com/aws-amplify/amplify-cli/commit/2333decdd61c2a5421a7030723f20d05f3c00269)), closes [#6359](https://github.com/aws-amplify/amplify-cli/issues/6359)
* do not attempt to modify a file when reading it ([#5783](https://github.com/aws-amplify/amplify-cli/issues/5783)) ([2cfa2b5](https://github.com/aws-amplify/amplify-cli/commit/2cfa2b58d0469dce8a5644b3280480196d995ea4))
* **amplify-provider-awscloudformation:** Fix amplify configure opening wrong IAM User Creation URL in Windows & WSL ([#6908](https://github.com/aws-amplify/amplify-cli/issues/6908)) ([a5ad84d](https://github.com/aws-amplify/amplify-cli/commit/a5ad84d28aaa2daddd9ddb6df7bee93e5d2bef73))
* **amplify-provider-awscloudformation:** reverse asc events ([#6803](https://github.com/aws-amplify/amplify-cli/issues/6803)) ([ae02803](https://github.com/aws-amplify/amplify-cli/commit/ae0280302f7a6632f74f1184a4b928319965df55)), closes [#6578](https://github.com/aws-amplify/amplify-cli/issues/6578)
* stop sanity check when resource is in create status ([#6349](https://github.com/aws-amplify/amplify-cli/issues/6349)) ([45e0246](https://github.com/aws-amplify/amplify-cli/commit/45e0246306136e513c735899b030f94bb004a330))





## [4.40.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.40.1...amplify-provider-awscloudformation@4.40.2) (2021-03-12)



## 4.45.2 (2021-03-12)


### Bug Fixes

* bump codegen versions ([#6871](https://github.com/aws-amplify/amplify-cli/issues/6871)) ([e53175d](https://github.com/aws-amplify/amplify-cli/commit/e53175d96136fba57662b1a035d3cea4a65a7601))





## [4.40.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.40.0...amplify-provider-awscloudformation@4.40.1) (2021-03-11)


### Bug Fixes

* **amplify-provider-awscloudformation:** handle throttling ([8ceb271](https://github.com/aws-amplify/amplify-cli/commit/8ceb27167e41d8c329b35fdc0f380e9e810fb5c0))





# [4.40.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.39.2...amplify-provider-awscloudformation@4.40.0) (2021-03-05)


### Bug Fixes

* **amplify-codegen:** update dependency on amplify-codegen to latest ([#6796](https://github.com/aws-amplify/amplify-cli/issues/6796)) ([33f4c15](https://github.com/aws-amplify/amplify-cli/commit/33f4c156153ef6398659dd5c24a7de8b0d9b13f2))
* **amplify-provider-awscloudformation:** specify 127.0.0.1 as hostname ([#6780](https://github.com/aws-amplify/amplify-cli/issues/6780)) ([db8b557](https://github.com/aws-amplify/amplify-cli/commit/db8b5575a7c04a46c59a06db6753b55d5f9e4e19))
* add check for undefined attributes during push ([#6687](https://github.com/aws-amplify/amplify-cli/issues/6687)) ([08da6b2](https://github.com/aws-amplify/amplify-cli/commit/08da6b2783385168f01ab70300980d61548d7402))


### Features

* generate datastore models for Admin CMS to consume post-deployment from CLI ([#6771](https://github.com/aws-amplify/amplify-cli/issues/6771)) ([0e74b65](https://github.com/aws-amplify/amplify-cli/commit/0e74b657491e53eb04376bb727eb442b59b2cf4c))
* remove OAuth prompt from pull and new env ([#6739](https://github.com/aws-amplify/amplify-cli/issues/6739)) ([8ff15a6](https://github.com/aws-amplify/amplify-cli/commit/8ff15a6ea2c3c687f0344fb4e17547097cd575ea))
* **amplify-codegen:** Migrate codegen ([#6730](https://github.com/aws-amplify/amplify-cli/issues/6730)) ([9c7a69a](https://github.com/aws-amplify/amplify-cli/commit/9c7a69a7d72e31c42572f3ebf2131c6053f96abd))





## [4.39.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.39.1...amplify-provider-awscloudformation@4.39.2) (2021-02-26)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [4.39.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.39.0...amplify-provider-awscloudformation@4.39.1) (2021-02-24)



## 4.44.1 (2021-02-24)


### Bug Fixes

* insert hostedUIProviderCreds empty array on hostedUI ([#6485](https://github.com/aws-amplify/amplify-cli/issues/6485)) ([5ebee51](https://github.com/aws-amplify/amplify-cli/commit/5ebee516373c0544f1400f054eb382bb5b887253))
* **amplify-provider-awscloudformation:** Amplify Admin authentication token refresh ([#6721](https://github.com/aws-amplify/amplify-cli/issues/6721)) ([bda37b4](https://github.com/aws-amplify/amplify-cli/commit/bda37b45939266c700fc8cab6b17807ea12a2c32))
* **amplify-provider-awscloudformation:** use right creds when waiting for ddb table ([#6646](https://github.com/aws-amplify/amplify-cli/issues/6646)) ([e746d2a](https://github.com/aws-amplify/amplify-cli/commit/e746d2a215a596603aa5fe0d5b38e1bae6d14c08))


### Reverts

* Revert "fix: insert hostedUIProviderCreds empty array on hostedUI (#6485)" (#6682) ([4185595](https://github.com/aws-amplify/amplify-cli/commit/41855953b074fe4179a68a4acaf9796515e12688)), closes [#6485](https://github.com/aws-amplify/amplify-cli/issues/6485) [#6682](https://github.com/aws-amplify/amplify-cli/issues/6682)





# [4.39.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.38.0...amplify-provider-awscloudformation@4.39.0) (2021-02-17)



# 4.44.0 (2021-02-16)


### Bug Fixes

* mock bug fixes and e2e test updates ([#6626](https://github.com/aws-amplify/amplify-cli/issues/6626)) ([af76446](https://github.com/aws-amplify/amplify-cli/commit/af76446d18bf626ca5f91c3ad41081175c959807))
* **amplify-provider-awscloudformation:** admin token refresh, configure project ([#6629](https://github.com/aws-amplify/amplify-cli/issues/6629)) ([38dab98](https://github.com/aws-amplify/amplify-cli/commit/38dab980fd7a80962d028fe54abcfb6cbaea8de3))


### Features

* fully populate mock function environment variables ([#6551](https://github.com/aws-amplify/amplify-cli/issues/6551)) ([dceb13a](https://github.com/aws-amplify/amplify-cli/commit/dceb13a76a85a05940078868a3e2e1ca85656938))
* Separate prod and dev lambda function builds ([#6494](https://github.com/aws-amplify/amplify-cli/issues/6494)) ([2977c6a](https://github.com/aws-amplify/amplify-cli/commit/2977c6a886b33a38ef46f898a2adc1ffdb6d228b))





# [4.38.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.37.0...amplify-provider-awscloudformation@4.38.0) (2021-02-11)


### Features

* dont open urls when CLI is running in CI ([#6503](https://github.com/aws-amplify/amplify-cli/issues/6503)) ([27546a7](https://github.com/aws-amplify/amplify-cli/commit/27546a78159ea95c636dbbd094fe6a4f7fb8f8f4)), closes [#5973](https://github.com/aws-amplify/amplify-cli/issues/5973)





# [4.37.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.36.1...amplify-provider-awscloudformation@4.37.0) (2021-02-10)


### Bug Fixes

* **amplify-category-function:** use ref for S3Bucket and S3Key in CFN ([#6358](https://github.com/aws-amplify/amplify-cli/issues/6358)) ([84a141a](https://github.com/aws-amplify/amplify-cli/commit/84a141ac4812d95c27b14c8d9f81e4a5c8fadef8))
* add missing check for undefined ([#6543](https://github.com/aws-amplify/amplify-cli/issues/6543)) ([31b980d](https://github.com/aws-amplify/amplify-cli/commit/31b980dcc079d8b9d045ecd3962797588dcab729))
* check --yes flag instead of CI env vars, clean up test imports ([#6541](https://github.com/aws-amplify/amplify-cli/issues/6541)) ([989624e](https://github.com/aws-amplify/amplify-cli/commit/989624e8cba524d989982a7389cd43eb8dcd8760))
* support choosing AWS authentication flow when admin UI is enabled ([#6433](https://github.com/aws-amplify/amplify-cli/issues/6433)) ([3bf56a8](https://github.com/aws-amplify/amplify-cli/commit/3bf56a8e2e5be67dd861a55807ecc94bd561b4a2))
* **amplify-provider-awscloudformation:** ask auth flow type for new envs ([#6569](https://github.com/aws-amplify/amplify-cli/issues/6569)) ([71e8062](https://github.com/aws-amplify/amplify-cli/commit/71e80627f9c999dc6cd46390f82d83142fe434c8))
* **amplify-provider-awscloudformation:** check proj config b4 env vars ([#6565](https://github.com/aws-amplify/amplify-cli/issues/6565)) ([a66bd14](https://github.com/aws-amplify/amplify-cli/commit/a66bd14ee001e0bd20976ccf6141f17e9b43fe8e))
* **amplify-provider-awscloudformation:** don't overwrite team-provider params ([#6479](https://github.com/aws-amplify/amplify-cli/issues/6479)) ([7f36c27](https://github.com/aws-amplify/amplify-cli/commit/7f36c273bacb880adda544ce45fb40d8757f3bb1))
* **amplify-provider-awscloudformation:** fix hosting output ([#6041](https://github.com/aws-amplify/amplify-cli/issues/6041)) ([a2c1577](https://github.com/aws-amplify/amplify-cli/commit/a2c15774762c0f07b44ca9c91c57ef4eb3752f2b)), closes [#402](https://github.com/aws-amplify/amplify-cli/issues/402)
* **amplify-provider-awscloudformation:** use prev deployment vars ([#6486](https://github.com/aws-amplify/amplify-cli/issues/6486)) ([39dfd27](https://github.com/aws-amplify/amplify-cli/commit/39dfd271bcf86b0ec424bb89c0bb38c0544d8d80))


### Features

* provide tags on create app ([#6381](https://github.com/aws-amplify/amplify-cli/issues/6381)) ([0530d1a](https://github.com/aws-amplify/amplify-cli/commit/0530d1af0e1c46bac45da2c0185d213058a28849))
* **graphql-key-transformer:** change default to add GSIs when using [@key](https://github.com/key) ([#5648](https://github.com/aws-amplify/amplify-cli/issues/5648)) ([4287c63](https://github.com/aws-amplify/amplify-cli/commit/4287c630295c304c7ff8343922926b4830b75cd4))


### Reverts

* Revert "feat: provide tags on create app (#6381)" (#6456) ([5789b26](https://github.com/aws-amplify/amplify-cli/commit/5789b26036c4e93f569669e25c3cf2637b4abdb8)), closes [#6381](https://github.com/aws-amplify/amplify-cli/issues/6381) [#6456](https://github.com/aws-amplify/amplify-cli/issues/6456)





## [4.36.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.36.0...amplify-provider-awscloudformation@4.36.1) (2021-01-08)


### Bug Fixes

* **amplify-provider-awscloudformation:** pass assumeRoleRequest ([#6264](https://github.com/aws-amplify/amplify-cli/issues/6264)) ([08820b2](https://github.com/aws-amplify/amplify-cli/commit/08820b28f5efdf957bdad8f64aa1dd57dfc4af9b))
* apply tags on create and push nested stack ([#6321](https://github.com/aws-amplify/amplify-cli/issues/6321)) ([4faa3e5](https://github.com/aws-amplify/amplify-cli/commit/4faa3e5ac38d311fe7901fb1b8a1b542cf19e598))
* change to new docs url in some messages ([#6281](https://github.com/aws-amplify/amplify-cli/issues/6281)) ([9d1a682](https://github.com/aws-amplify/amplify-cli/commit/9d1a682cf5c49cc6ba87a00fbefec7fbc10af47b))
* container based deployments on native projects ([#6201](https://github.com/aws-amplify/amplify-cli/issues/6201)) ([5ebcae8](https://github.com/aws-amplify/amplify-cli/commit/5ebcae83625d4626daf4391240b19fb7bd475759))
* remove process on next and await ([#6239](https://github.com/aws-amplify/amplify-cli/issues/6239)) ([59d4a0e](https://github.com/aws-amplify/amplify-cli/commit/59d4a0eb318d2b3ad97be34bda9dee756cf82d74))





# [4.36.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.35.2...amplify-provider-awscloudformation@4.36.0) (2020-12-31)


### Bug Fixes

* print warnings for CFN lint ([#6236](https://github.com/aws-amplify/amplify-cli/issues/6236)) ([847b8ac](https://github.com/aws-amplify/amplify-cli/commit/847b8ac7ba02aaeb8477add41e64795e3a68a9ce))


### Features

* added tests and logging coverage for system config ([#6209](https://github.com/aws-amplify/amplify-cli/issues/6209)) ([b943d7c](https://github.com/aws-amplify/amplify-cli/commit/b943d7c0304d75f9eabf4fd5f5fbf108a1c83309))





## [4.35.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.35.1...amplify-provider-awscloudformation@4.35.2) (2020-12-21)



## 4.40.1 (2020-12-18)


### Bug Fixes

* **amplify-provider-awscloudformation:** fixes rest client generation ([#6180](https://github.com/aws-amplify/amplify-cli/issues/6180)) ([af54abe](https://github.com/aws-amplify/amplify-cli/commit/af54abe7087676d2d74a8beb04196760ee70c481))
* [#6168](https://github.com/aws-amplify/amplify-cli/issues/6168), update error messages, yarn.lock ([#6207](https://github.com/aws-amplify/amplify-cli/issues/6207)) ([450eb0e](https://github.com/aws-amplify/amplify-cli/commit/450eb0e618c66ed34719f65a5a799a193d6a8a94))
* **amplify-provider-awscloudformation:** load correct file ([#6212](https://github.com/aws-amplify/amplify-cli/issues/6212)) ([7876187](https://github.com/aws-amplify/amplify-cli/commit/787618736540231efeeee8c803c178325b2c70b4))
* rejects on error ([#6216](https://github.com/aws-amplify/amplify-cli/issues/6216)) ([473bea5](https://github.com/aws-amplify/amplify-cli/commit/473bea5c7260e3c7a70291e513d8b718cd82f601))





## [4.35.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.35.0...amplify-provider-awscloudformation@4.35.1) (2020-12-16)



# 4.40.0 (2020-12-15)


### Bug Fixes

* [#6097](https://github.com/aws-amplify/amplify-cli/issues/6097) - check for root stack when loading projects for sanity check ([#6121](https://github.com/aws-amplify/amplify-cli/issues/6121)) ([6ebe735](https://github.com/aws-amplify/amplify-cli/commit/6ebe735fddca83532b2e327cb2008729a8103d55))
* [#6097](https://github.com/aws-amplify/amplify-cli/issues/6097) - don't create build folder during dryrun ([#6133](https://github.com/aws-amplify/amplify-cli/issues/6133)) ([b22e491](https://github.com/aws-amplify/amplify-cli/commit/b22e49173deb1654b97efa7967261caf7098a58b))
* **amplify-provider-awscloudformation:** infinite loop on stack failure ([#6134](https://github.com/aws-amplify/amplify-cli/issues/6134)) ([af0ced4](https://github.com/aws-amplify/amplify-cli/commit/af0ced4b0b9ba153b83e5b35c0f11e57d62e9e82))
* throw error on failed push ([#6186](https://github.com/aws-amplify/amplify-cli/issues/6186)) ([acb2089](https://github.com/aws-amplify/amplify-cli/commit/acb208900dafe09949c1201cdb351c9d94bc0b58))
* undefined appId destructuring ([#6092](https://github.com/aws-amplify/amplify-cli/issues/6092)) ([b817664](https://github.com/aws-amplify/amplify-cli/commit/b817664e10c5c7469bf99058e1879e969ec92619))





# [4.35.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.34.1...amplify-provider-awscloudformation@4.35.0) (2020-12-11)


### Bug Fixes

* version bucket conditional ([#6131](https://github.com/aws-amplify/amplify-cli/issues/6131)) ([9c4281f](https://github.com/aws-amplify/amplify-cli/commit/9c4281ff62241c00c5a93700f23ee7613b18ac39))


### Features

* container-based deployments([#5727](https://github.com/aws-amplify/amplify-cli/issues/5727)) ([fad6377](https://github.com/aws-amplify/amplify-cli/commit/fad6377bd384862ca4429cb1a83eee90efd62b58))





## [4.34.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.34.0...amplify-provider-awscloudformation@4.34.1) (2020-12-09)



## 4.38.2 (2020-12-09)


### Reverts

* **amplify-provider-awscloudformation:** removed cfn logging ([#6119](https://github.com/aws-amplify/amplify-cli/issues/6119)) ([a7f7f26](https://github.com/aws-amplify/amplify-cli/commit/a7f7f26676076dc2209b10f75dc8b5d992057f4a))





# [4.34.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.33.1...amplify-provider-awscloudformation@4.34.0) (2020-12-07)


### Bug Fixes

* fixed requires referencing 'src' ([#6058](https://github.com/aws-amplify/amplify-cli/issues/6058)) ([820e733](https://github.com/aws-amplify/amplify-cli/commit/820e733cced0360c965edaf75cb6dd09d30af2ab))
* incorrect params and return value ([#6070](https://github.com/aws-amplify/amplify-cli/issues/6070)) ([1ffdd27](https://github.com/aws-amplify/amplify-cli/commit/1ffdd27b8393f15912f016163de65d1e3821c23a))


### Features

* add support for multiple [@key](https://github.com/key) changes in same [@model](https://github.com/model) ([#6044](https://github.com/aws-amplify/amplify-cli/issues/6044)) ([e574637](https://github.com/aws-amplify/amplify-cli/commit/e5746379ea1330c53dacb55e8f6a9de7b17b55ae))





## [4.33.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.33.0...amplify-provider-awscloudformation@4.33.1) (2020-12-03)

**Note:** Version bump only for package amplify-provider-awscloudformation





# [4.33.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.32.2...amplify-provider-awscloudformation@4.33.0) (2020-11-30)


### Features

* pre-deploy pull, new login mechanism and pkg cli updates ([#5941](https://github.com/aws-amplify/amplify-cli/issues/5941)) ([7274251](https://github.com/aws-amplify/amplify-cli/commit/7274251faadc1035acce5f44699b172e10e2e67d))





## [4.32.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.32.1...amplify-provider-awscloudformation@4.32.2) (2020-11-27)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [4.32.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.32.0...amplify-provider-awscloudformation@4.32.1) (2020-11-26)

**Note:** Version bump only for package amplify-provider-awscloudformation





# [4.32.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.31.0...amplify-provider-awscloudformation@4.32.0) (2020-11-24)


### Bug Fixes

* imported s3 bucket us-east-1 not getting region assigned ([#5938](https://github.com/aws-amplify/amplify-cli/issues/5938)) ([200405f](https://github.com/aws-amplify/amplify-cli/commit/200405fad98f68e3b8218206996fe1079d3c2563))


### Features

* add root stack description to the root stack in the initializer ([#5927](https://github.com/aws-amplify/amplify-cli/issues/5927)) ([af06e42](https://github.com/aws-amplify/amplify-cli/commit/af06e42e5f8385c6507d05b9075deddf0c274b02))





# [4.31.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.29.0...amplify-provider-awscloudformation@4.31.0) (2020-11-22)



## 4.32.4 (2020-11-21)


### Bug Fixes

* explicitly remove storage bucket after stack delete ([#5924](https://github.com/aws-amplify/amplify-cli/issues/5924)) ([8dc2380](https://github.com/aws-amplify/amplify-cli/commit/8dc238083c74e4eac6c3e96c31490f071cd1cb28))
* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))


### Features

* root-stack description change for console generated stacks ([#5900](https://github.com/aws-amplify/amplify-cli/issues/5900)) ([8ae6015](https://github.com/aws-amplify/amplify-cli/commit/8ae60157a1d443baffa6fd505cdb8358a0fc3142))
* storage import ([#5893](https://github.com/aws-amplify/amplify-cli/issues/5893)) ([ad7b028](https://github.com/aws-amplify/amplify-cli/commit/ad7b028330bcee64d5124be7f27a8494dc8e9400))





# [4.30.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.13.2...amplify-provider-awscloudformation@4.30.0) (2020-11-22)


### Bug Fixes

* explicitly remove storage bucket after stack delete ([#5924](https://github.com/aws-amplify/amplify-cli/issues/5924)) ([8dc2380](https://github.com/aws-amplify/amplify-cli/commit/8dc238083c74e4eac6c3e96c31490f071cd1cb28))
* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))
* **amplify-provider-awscloudformation:** add new error message ([#4976](https://github.com/aws-amplify/amplify-cli/issues/4976)) ([8560096](https://github.com/aws-amplify/amplify-cli/commit/856009670e72aee2782f480991bc1e959857f65e))
* **amplify-provider-awscloudformation:** apigw resource download ([#5564](https://github.com/aws-amplify/amplify-cli/issues/5564)) ([43eb3e8](https://github.com/aws-amplify/amplify-cli/commit/43eb3e8a307bb320648c5cce87cb21ec10e54b7a)), closes [#5557](https://github.com/aws-amplify/amplify-cli/issues/5557)
* **amplify-provider-awscloudformation:** fix unhandled promise rejection ([#5746](https://github.com/aws-amplify/amplify-cli/issues/5746)) ([dcb056c](https://github.com/aws-amplify/amplify-cli/commit/dcb056cf86cdf43d76d4d410a49e884e30dac4ac)), closes [#4880](https://github.com/aws-amplify/amplify-cli/issues/4880)
* [#3096](https://github.com/aws-amplify/amplify-cli/issues/3096) - glob *template*.+(yaml|yml|json) files only as cfn template ([#4478](https://github.com/aws-amplify/amplify-cli/issues/4478)) ([957fe05](https://github.com/aws-amplify/amplify-cli/commit/957fe05fc4556f0dd48a805ba1884e47ea3b98ec))
* add support for mobile hub migrated resources ([#5407](https://github.com/aws-amplify/amplify-cli/issues/5407)) ([5dfe287](https://github.com/aws-amplify/amplify-cli/commit/5dfe2872c153047ebdc56bc4f671fd57c12379d9))
* added exit code on remove ([#5427](https://github.com/aws-amplify/amplify-cli/issues/5427)) ([33132f7](https://github.com/aws-amplify/amplify-cli/commit/33132f764b290cafd345720409a5db8ea6088069))
* check for unavailable bucket ([#3972](https://github.com/aws-amplify/amplify-cli/issues/3972)) ([de9c4c4](https://github.com/aws-amplify/amplify-cli/commit/de9c4c461351352694d81d9e7b2f9044b1a9a2c4))
* cli.json update on pull, E2E enhancements ([#5516](https://github.com/aws-amplify/amplify-cli/issues/5516)) ([952a92e](https://github.com/aws-amplify/amplify-cli/commit/952a92ef1926d86798efef2bbc27fe1c49d8e75f))
* data inconsitency ([#5344](https://github.com/aws-amplify/amplify-cli/issues/5344)) ([bfe1903](https://github.com/aws-amplify/amplify-cli/commit/bfe19038b5b676056f45d7ffcc4c2460057936d8))
* filter our providers when processing meta ([#5460](https://github.com/aws-amplify/amplify-cli/issues/5460)) ([e1e07b2](https://github.com/aws-amplify/amplify-cli/commit/e1e07b245db0963c4655e646c53e7615febe2930))
* occurred spelling mistake ([#4595](https://github.com/aws-amplify/amplify-cli/issues/4595)) ([a461487](https://github.com/aws-amplify/amplify-cli/commit/a461487072dbf422892ca24c436581b49c568429))
* refactor amplify.json file handling ([#5282](https://github.com/aws-amplify/amplify-cli/issues/5282)) ([a6269f3](https://github.com/aws-amplify/amplify-cli/commit/a6269f3177f3242df81e9d7dce0625295bb7a9fc))
* refactor mobile hub migration checks ([#5632](https://github.com/aws-amplify/amplify-cli/issues/5632)) ([b796eb8](https://github.com/aws-amplify/amplify-cli/commit/b796eb8303bb903f5f531506254441a63eba2962))
* select us-east-2 in integ tests ([#3992](https://github.com/aws-amplify/amplify-cli/issues/3992)) ([ed48cf5](https://github.com/aws-amplify/amplify-cli/commit/ed48cf59a2e60cc25a78f83641ca8f3bc63bc68f))
* show app id when listing console apps ([#5670](https://github.com/aws-amplify/amplify-cli/issues/5670)) ([1b7b5ec](https://github.com/aws-amplify/amplify-cli/commit/1b7b5ece57c482f8293b423465c5c24814815399))
* update current-cloud backend-config on resource removal ([#5658](https://github.com/aws-amplify/amplify-cli/issues/5658)) ([592f694](https://github.com/aws-amplify/amplify-cli/commit/592f694530dd61302ff790fbcf5b3ea135812c47))
* **amplify-category-interactions:** make category region aware ([#4047](https://github.com/aws-amplify/amplify-cli/issues/4047)) ([a40a772](https://github.com/aws-amplify/amplify-cli/commit/a40a77299d66c3791f65cf5389dac9f2db41696b))
* **amplify-provider-awscloudformation:** add missing require ([#4647](https://github.com/aws-amplify/amplify-cli/issues/4647)) ([ed12a04](https://github.com/aws-amplify/amplify-cli/commit/ed12a04d1f0fa8deec262a4b7d6f8a3074bad83c)), closes [#4398](https://github.com/aws-amplify/amplify-cli/issues/4398)
* **amplify-provider-awscloudformation:** check before fetching backend ([#3848](https://github.com/aws-amplify/amplify-cli/issues/3848)) ([39be355](https://github.com/aws-amplify/amplify-cli/commit/39be3552f7f408dad02c2701a01f170be9badbb7))
* **amplify-provider-awscloudformation:** custom transformer imports ([#3236](https://github.com/aws-amplify/amplify-cli/issues/3236)) ([7794d73](https://github.com/aws-amplify/amplify-cli/commit/7794d73ab28d74bc8f5a13f8b4296cbb00f0ac13))
* **amplify-provider-awscloudformation:** fix a bug in headless pull ([#3309](https://github.com/aws-amplify/amplify-cli/issues/3309)) ([af90f56](https://github.com/aws-amplify/amplify-cli/commit/af90f564ee73f9ba821cfadc469049d41c2fc3c1)), closes [#3292](https://github.com/aws-amplify/amplify-cli/issues/3292)
* **amplify-provider-awscloudformation:** fix bug for no credential file ([#4310](https://github.com/aws-amplify/amplify-cli/issues/4310)) ([2b941e0](https://github.com/aws-amplify/amplify-cli/commit/2b941e03e24a9589a332d3aa6b2897626a17ca1d)), closes [#4284](https://github.com/aws-amplify/amplify-cli/issues/4284)
* **amplify-provider-awscloudformation:** fix redundant upload message  ([#5429](https://github.com/aws-amplify/amplify-cli/issues/5429)) ([3076b05](https://github.com/aws-amplify/amplify-cli/commit/3076b0565ba993ff9bf46721903f011f05ee851c)), closes [#5393](https://github.com/aws-amplify/amplify-cli/issues/5393)
* **amplify-provider-awscloudformation:** fixed deletion for large bucket ([#3656](https://github.com/aws-amplify/amplify-cli/issues/3656)) ([32038da](https://github.com/aws-amplify/amplify-cli/commit/32038dad6f1bd0b9cf55e055d6a4545a222a1149)), closes [#3447](https://github.com/aws-amplify/amplify-cli/issues/3447) [#3451](https://github.com/aws-amplify/amplify-cli/issues/3451)
* **amplify-provider-awscloudformation:** fixing unhandled promise ([#4599](https://github.com/aws-amplify/amplify-cli/issues/4599)) ([ced99f8](https://github.com/aws-amplify/amplify-cli/commit/ced99f88bbbabfd276e7466904eba428c3adbfd8))
* **amplify-provider-awscloudformation:** hide IAM secrets on entry ([#3970](https://github.com/aws-amplify/amplify-cli/issues/3970)) ([60559c5](https://github.com/aws-amplify/amplify-cli/commit/60559c58b3c24d433a9b13efeb886918e8bcad47))
* **amplify-provider-awscloudformation:** include region configure url ([#5196](https://github.com/aws-amplify/amplify-cli/issues/5196)) ([44fdf95](https://github.com/aws-amplify/amplify-cli/commit/44fdf9583185463873b4ce67bee77f7b00e8cfdf)), closes [#4735](https://github.com/aws-amplify/amplify-cli/issues/4735)
* **amplify-provider-awscloudformation:** push failing from mock ([#3805](https://github.com/aws-amplify/amplify-cli/issues/3805)) ([c6ea964](https://github.com/aws-amplify/amplify-cli/commit/c6ea964712d1fc127466822638a076c7492260ab)), closes [#3793](https://github.com/aws-amplify/amplify-cli/issues/3793)
* **amplify-provider-awscloudformation:** response type fix on grant ([#3955](https://github.com/aws-amplify/amplify-cli/issues/3955)) ([503b675](https://github.com/aws-amplify/amplify-cli/commit/503b6756ab6a06e8c10b21aafac987473639147c)), closes [#3428](https://github.com/aws-amplify/amplify-cli/issues/3428)
* **amplify-provider-awscloudformation:** set credentials file permission ([#5194](https://github.com/aws-amplify/amplify-cli/issues/5194)) ([50d5e6e](https://github.com/aws-amplify/amplify-cli/commit/50d5e6ec377347362b9659ddf5f9fdbd0f65ca21))
* **amplify-provider-awscloudformation:** Stack delete condition ([#4465](https://github.com/aws-amplify/amplify-cli/issues/4465)) ([018bbab](https://github.com/aws-amplify/amplify-cli/commit/018bbabab02389f28b9c8e2ea83faacce47c5eb4))
* **amplify-provider-awscloudformation:** timeout error ([#5158](https://github.com/aws-amplify/amplify-cli/issues/5158)) ([a88e30a](https://github.com/aws-amplify/amplify-cli/commit/a88e30a56dd748c5af6daa3b118c72e603c25997))
* **amplify-provider-awscloudformation:** validate config input ([#5307](https://github.com/aws-amplify/amplify-cli/issues/5307)) ([5a324b2](https://github.com/aws-amplify/amplify-cli/commit/5a324b2ab015c0be8fe83d937325a38470c46c2d)), closes [#4998](https://github.com/aws-amplify/amplify-cli/issues/4998)
* fixing searchable migration document link in the cli flow ([#3735](https://github.com/aws-amplify/amplify-cli/issues/3735)) ([fed2f5d](https://github.com/aws-amplify/amplify-cli/commit/fed2f5dac6443dab60c522fa2cced1f2a7adc6c9))
* replaced v1 docs references with v2 docs references ([#4169](https://github.com/aws-amplify/amplify-cli/issues/4169)) ([b578c2d](https://github.com/aws-amplify/amplify-cli/commit/b578c2dcd10038367c653ede2f6da42e7644b41b))
* update default file permissions for credentials/config ([#5246](https://github.com/aws-amplify/amplify-cli/issues/5246)) ([b64f1bd](https://github.com/aws-amplify/amplify-cli/commit/b64f1bd784b0595f49241fdd89686c5f8a421ae3))
* **graphql-elasticsearch-transformer:** fix duplicate records in es lambda ([#3712](https://github.com/aws-amplify/amplify-cli/issues/3712)) ([dd9f7e0](https://github.com/aws-amplify/amplify-cli/commit/dd9f7e0031a0dc68a9027de02f60bbe69d315c3d)), closes [#3602](https://github.com/aws-amplify/amplify-cli/issues/3602) [#3705](https://github.com/aws-amplify/amplify-cli/issues/3705)
* enable only-userpool flow without idp and addition of groups without roles tied to idp ([#3662](https://github.com/aws-amplify/amplify-cli/issues/3662)) ([67e0401](https://github.com/aws-amplify/amplify-cli/commit/67e04018d758e617374c4b8ba2298872e728d01e))
* fixing name of nodej function provider plugin name ([7e27785](https://github.com/aws-amplify/amplify-cli/commit/7e27785e9d4208d8e0d0674f1f1644e670139a86))
* **amplify-category-analytics:** delete pinpoint project in delete ([#3165](https://github.com/aws-amplify/amplify-cli/issues/3165)) ([acc0240](https://github.com/aws-amplify/amplify-cli/commit/acc0240c02630b4b9424370732706955ea447057)), closes [#2974](https://github.com/aws-amplify/amplify-cli/issues/2974)
* **amplify-category-notifications:** fix notifications env change issue ([#2669](https://github.com/aws-amplify/amplify-cli/issues/2669)) ([54d4d64](https://github.com/aws-amplify/amplify-cli/commit/54d4d64e03dc246e42ba3e2d19b1789d2dbeaddc)), closes [#2616](https://github.com/aws-amplify/amplify-cli/issues/2616)
* **amplify-provider-awscloudformation:** add condition for migration ([#3196](https://github.com/aws-amplify/amplify-cli/issues/3196)) ([6a35a5c](https://github.com/aws-amplify/amplify-cli/commit/6a35a5c8fadc4dbc5c38b82d007cd0cc240afe00))
* **amplify-provider-awscloudformation:** fix add env learn more bug ([#3164](https://github.com/aws-amplify/amplify-cli/issues/3164)) ([4fb2649](https://github.com/aws-amplify/amplify-cli/commit/4fb26498c6eb266ffe11bdb276f5e91a46f1f65d)), closes [#3158](https://github.com/aws-amplify/amplify-cli/issues/3158)
* **amplify-provider-awscloudformation:** fixed deletion for large buckets ([#3512](https://github.com/aws-amplify/amplify-cli/issues/3512)) ([21951c1](https://github.com/aws-amplify/amplify-cli/commit/21951c135dc0228fe58191dda2cabd0e5d296aa1)), closes [#3447](https://github.com/aws-amplify/amplify-cli/issues/3447) [#3451](https://github.com/aws-amplify/amplify-cli/issues/3451)
* api key creation/deletion logic ([#2678](https://github.com/aws-amplify/amplify-cli/issues/2678)) ([e1d111d](https://github.com/aws-amplify/amplify-cli/commit/e1d111d87cbe71f9c7a41a61e243f6d907905878))
* fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))
* include api build directory in cloud zip ([#2819](https://github.com/aws-amplify/amplify-cli/issues/2819)) ([f26fea4](https://github.com/aws-amplify/amplify-cli/commit/f26fea4138ec20847ae9e577f9315aa865d9679a))
* mitigate push failuer when graphql api backend is missing ([#2559](https://github.com/aws-amplify/amplify-cli/issues/2559)) ([acfdc83](https://github.com/aws-amplify/amplify-cli/commit/acfdc838db0f514c737aa3a726790716fa089c14))
* remove extra curly brace in CLI output ([#3194](https://github.com/aws-amplify/amplify-cli/issues/3194)) ([e15d994](https://github.com/aws-amplify/amplify-cli/commit/e15d994fcd2e7c136932845a9e772a9546d48b73))
* scoping down user pool group IAM roles and adding --force to amplify push command ([#3609](https://github.com/aws-amplify/amplify-cli/issues/3609)) ([2e10a2f](https://github.com/aws-amplify/amplify-cli/commit/2e10a2ff62b61f57b2d513a7cfd0e4478f429f1f))
* **amplify-provider-awscloudformation:** add retry logic ([#3020](https://github.com/aws-amplify/amplify-cli/issues/3020)) ([5f2a5be](https://github.com/aws-amplify/amplify-cli/commit/5f2a5bedc3fcb627a954a41620b012be6f60bab2)), closes [#3019](https://github.com/aws-amplify/amplify-cli/issues/3019) [#3027](https://github.com/aws-amplify/amplify-cli/issues/3027)
* **amplify-provider-awscloudformation:** amplify delete delete the stack ([#2470](https://github.com/aws-amplify/amplify-cli/issues/2470)) ([46bcab2](https://github.com/aws-amplify/amplify-cli/commit/46bcab20e2a9cebb6b68f2b3298f88cf9dd49e47))
* **amplify-provider-awscloudformation:** build api project w/ params ([#2003](https://github.com/aws-amplify/amplify-cli/issues/2003)) ([3692901](https://github.com/aws-amplify/amplify-cli/commit/3692901b3f82daf79475ec5b1c5cd90781917446)), closes [#1960](https://github.com/aws-amplify/amplify-cli/issues/1960)
* **amplify-provider-awscloudformation:** fix amplify configure ([#2344](https://github.com/aws-amplify/amplify-cli/issues/2344)) ([0fa9b2a](https://github.com/aws-amplify/amplify-cli/commit/0fa9b2a25b83928e6c1eb860805ade941f0111c4))
* **amplify-provider-awscloudformation:** fix multi env creation bug ([#2872](https://github.com/aws-amplify/amplify-cli/issues/2872)) ([007a8d1](https://github.com/aws-amplify/amplify-cli/commit/007a8d12da802c822b20a4351cb074b49f01bd23)), closes [#2868](https://github.com/aws-amplify/amplify-cli/issues/2868)
* **amplify-provider-awscloudformation:** fix template not found ([#3406](https://github.com/aws-amplify/amplify-cli/issues/3406)) ([93fefe9](https://github.com/aws-amplify/amplify-cli/commit/93fefe900781fe5266fcbb7cc95f30f85399b30b))
* **amplify-provider-awscloudformation:** hand general config ([#3054](https://github.com/aws-amplify/amplify-cli/issues/3054)) ([0a5989d](https://github.com/aws-amplify/amplify-cli/commit/0a5989d977aefaab689f0a1fa8c21510257ac3d7))
* **amplify-provider-awscloudformation:** prevent console build error ([#3078](https://github.com/aws-amplify/amplify-cli/issues/3078)) ([0bb4019](https://github.com/aws-amplify/amplify-cli/commit/0bb40199f905aca6c92515c2dfac187965b6d87e))
* **cli:** fix console issue 342 and 350 ([#3189](https://github.com/aws-amplify/amplify-cli/issues/3189)) ([cbe26e0](https://github.com/aws-amplify/amplify-cli/commit/cbe26e01c657031e73b77fe408e53430029cab17)), closes [#350](https://github.com/aws-amplify/amplify-cli/issues/350)
* [#1056](https://github.com/aws-amplify/amplify-cli/issues/1056), dedup environment file reading ([#2088](https://github.com/aws-amplify/amplify-cli/issues/2088)) ([940deaa](https://github.com/aws-amplify/amplify-cli/commit/940deaa6bbe7370e40e61946d0f1073623ba6e90))
* [#2260](https://github.com/aws-amplify/amplify-cli/issues/2260) - check for auth config on legacy projects ([#2261](https://github.com/aws-amplify/amplify-cli/issues/2261)) ([ba79d2a](https://github.com/aws-amplify/amplify-cli/commit/ba79d2a6c534cb1bcd4686991c80aa88ae4fbc8f))
* [#429](https://github.com/aws-amplify/amplify-cli/issues/429) - Editor hanging bug ([#2086](https://github.com/aws-amplify/amplify-cli/issues/2086)) ([6767445](https://github.com/aws-amplify/amplify-cli/commit/676744549f903fa3a4804d814eb325301ed462ba))
* delete hangs for a bit before exiting ([#2979](https://github.com/aws-amplify/amplify-cli/issues/2979)) ([fc45778](https://github.com/aws-amplify/amplify-cli/commit/fc4577874579ad12a12e9b693e62a2bd88144335)), closes [#2615](https://github.com/aws-amplify/amplify-cli/issues/2615) [#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)
* fix metric agent for tracking CLI usage ([#2024](https://github.com/aws-amplify/amplify-cli/issues/2024)) ([a2742a6](https://github.com/aws-amplify/amplify-cli/commit/a2742a68b8a26000765ad22ed0a8fc28ef0d32fc))
* pass appsync specific directives to model gen ([#3211](https://github.com/aws-amplify/amplify-cli/issues/3211)) ([c9a6ada](https://github.com/aws-amplify/amplify-cli/commit/c9a6ada683a32f2a82ef9fdc4b0cb37ea70ccb11))
* **amplify-provider-awscloudformation:** transformer loading ([#2924](https://github.com/aws-amplify/amplify-cli/issues/2924)) ([e1256d9](https://github.com/aws-amplify/amplify-cli/commit/e1256d9a508ac0cf843f7e2a4d53a62bf79c17a8))
* **cli:** add cli core aliases, and two minor fixes ([#2394](https://github.com/aws-amplify/amplify-cli/issues/2394)) ([69c7ab3](https://github.com/aws-amplify/amplify-cli/commit/69c7ab36f5a78e875ca117cbbadfb80f44b288c8))
* **cli:** add console command in the help message ([#2494](https://github.com/aws-amplify/amplify-cli/issues/2494)) ([cf0eddd](https://github.com/aws-amplify/amplify-cli/commit/cf0eddd1ba27b1126b0745cc068f205b2c2c8343)), closes [#1607](https://github.com/aws-amplify/amplify-cli/issues/1607)
* [#2335](https://github.com/aws-amplify/amplify-cli/issues/2335) - change the transformer.conf.json version flag check logic ([b09cd37](https://github.com/aws-amplify/amplify-cli/commit/b09cd37a931c770a15b4397dd3d6631d468170a6))
* ensure that transformer instances are not reused ([#2318](https://github.com/aws-amplify/amplify-cli/issues/2318)) ([24318ac](https://github.com/aws-amplify/amplify-cli/commit/24318ac65ed89e0845c9d36df365f4163d9298a6))
* Fix package.json exists check for functions ([#2030](https://github.com/aws-amplify/amplify-cli/issues/2030)) ([a5283b7](https://github.com/aws-amplify/amplify-cli/commit/a5283b72c780a065c735ef3cd6baaae35476a7f8))
* fixing no-gql-override param usage in amplify push command ([#2336](https://github.com/aws-amplify/amplify-cli/issues/2336)) ([198fac4](https://github.com/aws-amplify/amplify-cli/commit/198fac4507000dcaf623981867140b92f3e3c5c5))
* move test package dependencies to devDependencies ([#2034](https://github.com/aws-amplify/amplify-cli/issues/2034)) ([f5623d0](https://github.com/aws-amplify/amplify-cli/commit/f5623d04a43e685901f4f1cd96e2a227164c71ee))


### Features

* ability to add custom EventSource and lambda triggers via amplify add function, kinesis support in analytics category ([#2463](https://github.com/aws-amplify/amplify-cli/issues/2463)) ([b25cfd0](https://github.com/aws-amplify/amplify-cli/commit/b25cfd00b21416a82ecefda1f6498206ef71531b))
* add amplify prefix to every cfn stack provisioned via the CLI ([#2225](https://github.com/aws-amplify/amplify-cli/issues/2225)) ([4cbeeaa](https://github.com/aws-amplify/amplify-cli/commit/4cbeeaa6b99a1c0d1921301308c31df502491191))
* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c1927da10f8c54f38a523021187361131c))
* Cloudformation logging ([#5195](https://github.com/aws-amplify/amplify-cli/issues/5195)) ([19b2165](https://github.com/aws-amplify/amplify-cli/commit/19b21651375848c0858328952852201da47b17bb))
* conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
* Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
* feature flag implementation ([#4891](https://github.com/aws-amplify/amplify-cli/issues/4891)) ([6d1c632](https://github.com/aws-amplify/amplify-cli/commit/6d1c632952a49cb56670c11c9cb0c3620d0eb332))
* implement multi-auth functionality ([#1916](https://github.com/aws-amplify/amplify-cli/issues/1916)) ([b99f58e](https://github.com/aws-amplify/amplify-cli/commit/b99f58e4a2b85cbe9f430838554ae3c277440132))
* Lambda layers ([#4697](https://github.com/aws-amplify/amplify-cli/issues/4697)) ([4e97400](https://github.com/aws-amplify/amplify-cli/commit/4e974007d95c894ab4108a2dff8d5996e7e3ce25))
* mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e5346ee1f27a2e9bee25fbbdcb19417f5230f))
* Multienv support for Lambda layers ([#5081](https://github.com/aws-amplify/amplify-cli/issues/5081)) ([4af1363](https://github.com/aws-amplify/amplify-cli/commit/4af13634bcdd58511712249e6774fc9f287c9ef5))
* narrow-down idp roles scope ([#1974](https://github.com/aws-amplify/amplify-cli/issues/1974)) ([ccfd508](https://github.com/aws-amplify/amplify-cli/commit/ccfd5085dc8fdbaf90d3a3646e8c10e26a5f583d))
* resource Tagging Support ([#5178](https://github.com/aws-amplify/amplify-cli/issues/5178)) ([e34226d](https://github.com/aws-amplify/amplify-cli/commit/e34226dde30d7d345e3cc2e72e187b242a09c389))
* root-stack description change for console generated stacks ([#5900](https://github.com/aws-amplify/amplify-cli/issues/5900)) ([8ae6015](https://github.com/aws-amplify/amplify-cli/commit/8ae60157a1d443baffa6fd505cdb8358a0fc3142))
* sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe8925a4e73358b03ba927267a2df328b78))
* show rest api url on amplify status ([#4547](https://github.com/aws-amplify/amplify-cli/issues/4547)) ([514da4a](https://github.com/aws-amplify/amplify-cli/commit/514da4a0f19cba720363bb103984fa7eac50befb))
* storage import ([#5893](https://github.com/aws-amplify/amplify-cli/issues/5893)) ([ad7b028](https://github.com/aws-amplify/amplify-cli/commit/ad7b028330bcee64d5124be7f27a8494dc8e9400))
* support for overriding pipeline function templates in transformer ([#4196](https://github.com/aws-amplify/amplify-cli/issues/4196)) ([e1830ae](https://github.com/aws-amplify/amplify-cli/commit/e1830aeb31fef8f035cb0a992a150d37f78e07bb)), closes [#4192](https://github.com/aws-amplify/amplify-cli/issues/4192)
* support importing of auth resources ([#5591](https://github.com/aws-amplify/amplify-cli/issues/5591)) ([7903246](https://github.com/aws-amplify/amplify-cli/commit/790324680544fe18481f91390001f9f07a144203))
* transformer redesign ([#5534](https://github.com/aws-amplify/amplify-cli/issues/5534)) ([a93c685](https://github.com/aws-amplify/amplify-cli/commit/a93c6852f6588898ebc52b0574f4fcc3d2e87948))
* **amplify-category-api:** allow minified CF stack templates ([#3520](https://github.com/aws-amplify/amplify-cli/issues/3520)) ([6da2a63](https://github.com/aws-amplify/amplify-cli/commit/6da2a634548fdf48deb4b1144c67d1e1515abb80)), closes [#2914](https://github.com/aws-amplify/amplify-cli/issues/2914)
* **amplify-category-function:** Refactor invoke to call runtime plugins ([#3768](https://github.com/aws-amplify/amplify-cli/issues/3768)) ([92293fa](https://github.com/aws-amplify/amplify-cli/commit/92293fa83190bd18aacdc2f46a22938f94b89609))
* **amplify-category-function:** refactor to support build and package interface of runtime plugins ([8c4ec55](https://github.com/aws-amplify/amplify-cli/commit/8c4ec55e46ed8a153eee306c23f9665d58d3c5f4))
* **amplify-category-function:** refactor to support runtime and template plugins ([#3517](https://github.com/aws-amplify/amplify-cli/issues/3517)) ([607ae21](https://github.com/aws-amplify/amplify-cli/commit/607ae21287941805f44ea8a9b78dd12d16d71f85))
* **amplify-provider-awscloudformation:** hooks ([#1951](https://github.com/aws-amplify/amplify-cli/issues/1951)) ([caba157](https://github.com/aws-amplify/amplify-cli/commit/caba1579812f6e5c93007bec7c8b3c8cdf005eb2))
* **amplify-python-runtime-provider:** implement python runtime provider ([#3710](https://github.com/aws-amplify/amplify-cli/issues/3710)) ([cddb5a7](https://github.com/aws-amplify/amplify-cli/commit/cddb5a7b47abacae11205776cb56d68a56286f45))
* **amplify-python-runtime-provider:** implement python runtime provider ([#3787](https://github.com/aws-amplify/amplify-cli/issues/3787)) ([8996cb1](https://github.com/aws-amplify/amplify-cli/commit/8996cb11015873f1236340680694188fd17c0f2e))
* **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
* **cli:** migrate projects that don't have Amplify AppId ([#2987](https://github.com/aws-amplify/amplify-cli/issues/2987)) ([80a8733](https://github.com/aws-amplify/amplify-cli/commit/80a8733c3ca4c273ce89b0e571d9bbd8c0b0fd3f))
* updated version of [#2118](https://github.com/aws-amplify/amplify-cli/issues/2118) with addressed review comments ([#2230](https://github.com/aws-amplify/amplify-cli/issues/2230)) ([be3c499](https://github.com/aws-amplify/amplify-cli/commit/be3c499edcc6bec63b38e9241c5af7b83c930022))
* User Pool Groups, Admin Auth Support, Custom Group Role Policies ([#2443](https://github.com/aws-amplify/amplify-cli/issues/2443)) ([09aecfd](https://github.com/aws-amplify/amplify-cli/commit/09aecfd0cb3dae2c17d1c512946cc733c4fe3d4c))
* **cli:** new plugin platform ([#2254](https://github.com/aws-amplify/amplify-cli/issues/2254)) ([7ec29dd](https://github.com/aws-amplify/amplify-cli/commit/7ec29dd4f2da8c90727b36469eca646d289877b6))


### Performance Improvements

* optimize appsync file upload and bucket exist check ([#4533](https://github.com/aws-amplify/amplify-cli/issues/4533)) ([173996f](https://github.com/aws-amplify/amplify-cli/commit/173996f57e0d2e6b245e094e70cf4596099e782d))


### Reverts

* Revert "enhance(amplify-provider-awscloudformation): support multiple Lambdas in a function resource (#5032)" (#5725) ([3f496ab](https://github.com/aws-amplify/amplify-cli/commit/3f496ab726ecc50a7c5ebb830ea9543cd3f28a66)), closes [#5032](https://github.com/aws-amplify/amplify-cli/issues/5032) [#5725](https://github.com/aws-amplify/amplify-cli/issues/5725)
* Revert "fix(amplify-provider-awscloudformation): check before fetching backend (#3848)" (#3968) ([4abd582](https://github.com/aws-amplify/amplify-cli/commit/4abd5828bb5138944b116476d8b9491597aecc88)), closes [#3848](https://github.com/aws-amplify/amplify-cli/issues/3848) [#3968](https://github.com/aws-amplify/amplify-cli/issues/3968)
* Revert "feat(amplify-python-runtime-provider): implement python runtime provider (#3710)" (#3719) ([e20ed97](https://github.com/aws-amplify/amplify-cli/commit/e20ed975ea46f124e736b4dfc940e1be1a781f87)), closes [#3710](https://github.com/aws-amplify/amplify-cli/issues/3710) [#3719](https://github.com/aws-amplify/amplify-cli/issues/3719)
* Revert "fix(amplify-provider-awscloudformation): fixed deletion for large buckets (#3512)" (#3649) ([4694834](https://github.com/aws-amplify/amplify-cli/commit/469483482f182d24ffe22af12a9f40e5cc484b2e)), closes [#3512](https://github.com/aws-amplify/amplify-cli/issues/3512) [#3649](https://github.com/aws-amplify/amplify-cli/issues/3649)


* Adding Auth on Subscriptions (#2068) ([81c630d](https://github.com/aws-amplify/amplify-cli/commit/81c630d782a6be720e513677a34b7a7dacbdc629)), closes [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068)


### BREAKING CHANGES

* If an owner is used in the auth directive it will either be a requirement if it's
the only rule or an optional input if used with other rules
* If an owner is included in the auth directive it will either be a requirement if
it's the only rule or an optional input if used with other rules
* the subscription operations will require an argument if owner is the only auth rule
* Subscriptions will require an argument if an owner is only rule set - If owner &
group rules are owner will be an optional arg





## [4.29.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.29.0...amplify-provider-awscloudformation@4.29.3) (2020-11-20)



# 4.33.0 (2020-11-18)


### Bug Fixes

* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))


### Features

* root-stack description change for console generated stacks ([#5900](https://github.com/aws-amplify/amplify-cli/issues/5900)) ([8ae6015](https://github.com/aws-amplify/amplify-cli/commit/8ae60157a1d443baffa6fd505cdb8358a0fc3142))





## [4.29.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.29.0...amplify-provider-awscloudformation@4.29.2) (2020-11-20)



# 4.33.0 (2020-11-18)


### Bug Fixes

* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))


### Features

* root-stack description change for console generated stacks ([#5900](https://github.com/aws-amplify/amplify-cli/issues/5900)) ([8ae6015](https://github.com/aws-amplify/amplify-cli/commit/8ae60157a1d443baffa6fd505cdb8358a0fc3142))





## [4.29.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.29.0...amplify-provider-awscloudformation@4.29.1) (2020-11-19)



# 4.33.0 (2020-11-18)


### Bug Fixes

* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))


### Features

* root-stack description change for console generated stacks ([#5900](https://github.com/aws-amplify/amplify-cli/issues/5900)) ([8ae6015](https://github.com/aws-amplify/amplify-cli/commit/8ae60157a1d443baffa6fd505cdb8358a0fc3142))





# [4.29.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.28.2...amplify-provider-awscloudformation@4.29.0) (2020-11-08)


### Bug Fixes

* **amplify-provider-awscloudformation:** fix unhandled promise rejection ([#5746](https://github.com/aws-amplify/amplify-cli/issues/5746)) ([dcb056c](https://github.com/aws-amplify/amplify-cli/commit/dcb056cf86cdf43d76d4d410a49e884e30dac4ac)), closes [#4880](https://github.com/aws-amplify/amplify-cli/issues/4880)


### Features

* transformer redesign ([#5534](https://github.com/aws-amplify/amplify-cli/issues/5534)) ([a93c685](https://github.com/aws-amplify/amplify-cli/commit/a93c6852f6588898ebc52b0574f4fcc3d2e87948))





## [4.28.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.28.1...amplify-provider-awscloudformation@4.28.2) (2020-10-30)


### Bug Fixes

* **amplify-provider-awscloudformation:** add new error message ([#4976](https://github.com/aws-amplify/amplify-cli/issues/4976)) ([8560096](https://github.com/aws-amplify/amplify-cli/commit/856009670e72aee2782f480991bc1e959857f65e))


### Reverts

* Revert "enhance(amplify-provider-awscloudformation): support multiple Lambdas in a function resource (#5032)" (#5725) ([3f496ab](https://github.com/aws-amplify/amplify-cli/commit/3f496ab726ecc50a7c5ebb830ea9543cd3f28a66)), closes [#5032](https://github.com/aws-amplify/amplify-cli/issues/5032) [#5725](https://github.com/aws-amplify/amplify-cli/issues/5725)





## [4.28.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.28.0...amplify-provider-awscloudformation@4.28.1) (2020-10-27)

**Note:** Version bump only for package amplify-provider-awscloudformation





# [4.28.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.27.0...amplify-provider-awscloudformation@4.28.0) (2020-10-22)


### Bug Fixes

* refactor mobile hub migration checks ([#5632](https://github.com/aws-amplify/amplify-cli/issues/5632)) ([b796eb8](https://github.com/aws-amplify/amplify-cli/commit/b796eb8303bb903f5f531506254441a63eba2962))
* show app id when listing console apps ([#5670](https://github.com/aws-amplify/amplify-cli/issues/5670)) ([1b7b5ec](https://github.com/aws-amplify/amplify-cli/commit/1b7b5ece57c482f8293b423465c5c24814815399))
* update current-cloud backend-config on resource removal ([#5658](https://github.com/aws-amplify/amplify-cli/issues/5658)) ([592f694](https://github.com/aws-amplify/amplify-cli/commit/592f694530dd61302ff790fbcf5b3ea135812c47))


### Features

* Cloudformation logging ([#5195](https://github.com/aws-amplify/amplify-cli/issues/5195)) ([19b2165](https://github.com/aws-amplify/amplify-cli/commit/19b21651375848c0858328952852201da47b17bb))





# [4.27.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.26.7...amplify-provider-awscloudformation@4.27.0) (2020-10-17)


### Features

* support importing of auth resources ([#5591](https://github.com/aws-amplify/amplify-cli/issues/5591)) ([7903246](https://github.com/aws-amplify/amplify-cli/commit/790324680544fe18481f91390001f9f07a144203))





## [4.26.7](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.26.6...amplify-provider-awscloudformation@4.26.7) (2020-10-13)


### Bug Fixes

* **amplify-provider-awscloudformation:** apigw resource download ([#5564](https://github.com/aws-amplify/amplify-cli/issues/5564)) ([43eb3e8](https://github.com/aws-amplify/amplify-cli/commit/43eb3e8a307bb320648c5cce87cb21ec10e54b7a)), closes [#5557](https://github.com/aws-amplify/amplify-cli/issues/5557)





## [4.26.6](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.26.5...amplify-provider-awscloudformation@4.26.6) (2020-10-09)


### Bug Fixes

* cli.json update on pull, E2E enhancements ([#5516](https://github.com/aws-amplify/amplify-cli/issues/5516)) ([952a92e](https://github.com/aws-amplify/amplify-cli/commit/952a92ef1926d86798efef2bbc27fe1c49d8e75f))





## [4.26.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.26.4...amplify-provider-awscloudformation@4.26.5) (2020-10-07)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [4.26.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.26.3...amplify-provider-awscloudformation@4.26.4) (2020-10-01)


### Bug Fixes

* **amplify-provider-awscloudformation:** fix redundant upload message  ([#5429](https://github.com/aws-amplify/amplify-cli/issues/5429)) ([3076b05](https://github.com/aws-amplify/amplify-cli/commit/3076b0565ba993ff9bf46721903f011f05ee851c)), closes [#5393](https://github.com/aws-amplify/amplify-cli/issues/5393)
* add support for mobile hub migrated resources ([#5407](https://github.com/aws-amplify/amplify-cli/issues/5407)) ([5dfe287](https://github.com/aws-amplify/amplify-cli/commit/5dfe2872c153047ebdc56bc4f671fd57c12379d9))
* added exit code on remove ([#5427](https://github.com/aws-amplify/amplify-cli/issues/5427)) ([33132f7](https://github.com/aws-amplify/amplify-cli/commit/33132f764b290cafd345720409a5db8ea6088069))
* filter our providers when processing meta ([#5460](https://github.com/aws-amplify/amplify-cli/issues/5460)) ([e1e07b2](https://github.com/aws-amplify/amplify-cli/commit/e1e07b245db0963c4655e646c53e7615febe2930))





## [4.26.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.26.2...amplify-provider-awscloudformation@4.26.3) (2020-09-25)


### Bug Fixes

* data inconsitency ([#5344](https://github.com/aws-amplify/amplify-cli/issues/5344)) ([bfe1903](https://github.com/aws-amplify/amplify-cli/commit/bfe19038b5b676056f45d7ffcc4c2460057936d8))





## [4.26.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.26.1...amplify-provider-awscloudformation@4.26.2) (2020-09-16)


### Bug Fixes

* **amplify-provider-awscloudformation:** validate config input ([#5307](https://github.com/aws-amplify/amplify-cli/issues/5307)) ([5a324b2](https://github.com/aws-amplify/amplify-cli/commit/5a324b2ab015c0be8fe83d937325a38470c46c2d)), closes [#4998](https://github.com/aws-amplify/amplify-cli/issues/4998)
* refactor amplify.json file handling ([#5282](https://github.com/aws-amplify/amplify-cli/issues/5282)) ([a6269f3](https://github.com/aws-amplify/amplify-cli/commit/a6269f3177f3242df81e9d7dce0625295bb7a9fc))





## [4.26.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.26.0...amplify-provider-awscloudformation@4.26.1) (2020-09-09)


### Bug Fixes

* update default file permissions for credentials/config ([#5246](https://github.com/aws-amplify/amplify-cli/issues/5246)) ([b64f1bd](https://github.com/aws-amplify/amplify-cli/commit/b64f1bd784b0595f49241fdd89686c5f8a421ae3))





# [4.26.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.25.2...amplify-provider-awscloudformation@4.26.0) (2020-09-03)


### Features

* Multienv support for Lambda layers ([#5081](https://github.com/aws-amplify/amplify-cli/issues/5081)) ([4af1363](https://github.com/aws-amplify/amplify-cli/commit/4af13634bcdd58511712249e6774fc9f287c9ef5))





## [4.25.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.25.1...amplify-provider-awscloudformation@4.25.2) (2020-09-03)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [4.25.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.25.0...amplify-provider-awscloudformation@4.25.1) (2020-09-02)


### Bug Fixes

* **amplify-provider-awscloudformation:** include region configure url ([#5196](https://github.com/aws-amplify/amplify-cli/issues/5196)) ([44fdf95](https://github.com/aws-amplify/amplify-cli/commit/44fdf9583185463873b4ce67bee77f7b00e8cfdf)), closes [#4735](https://github.com/aws-amplify/amplify-cli/issues/4735)





# [4.25.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.24.4...amplify-provider-awscloudformation@4.25.0) (2020-08-31)


### Bug Fixes

* **amplify-provider-awscloudformation:** set credentials file permission ([#5194](https://github.com/aws-amplify/amplify-cli/issues/5194)) ([50d5e6e](https://github.com/aws-amplify/amplify-cli/commit/50d5e6ec377347362b9659ddf5f9fdbd0f65ca21))
* **amplify-provider-awscloudformation:** timeout error ([#5158](https://github.com/aws-amplify/amplify-cli/issues/5158)) ([a88e30a](https://github.com/aws-amplify/amplify-cli/commit/a88e30a56dd748c5af6daa3b118c72e603c25997))


### Features

* resource Tagging Support ([#5178](https://github.com/aws-amplify/amplify-cli/issues/5178)) ([e34226d](https://github.com/aws-amplify/amplify-cli/commit/e34226dde30d7d345e3cc2e72e187b242a09c389))





## [4.24.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.24.3...amplify-provider-awscloudformation@4.24.4) (2020-08-20)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [4.24.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.24.2...amplify-provider-awscloudformation@4.24.3) (2020-08-14)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [4.24.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.24.1...amplify-provider-awscloudformation@4.24.2) (2020-08-11)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [4.24.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.24.0...amplify-provider-awscloudformation@4.24.1) (2020-08-06)

**Note:** Version bump only for package amplify-provider-awscloudformation





# [4.24.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.22.5...amplify-provider-awscloudformation@4.24.0) (2020-07-29)


### Bug Fixes

* **amplify-provider-awscloudformation:** Stack delete condition ([#4465](https://github.com/aws-amplify/amplify-cli/issues/4465)) ([018bbab](https://github.com/aws-amplify/amplify-cli/commit/018bbabab02389f28b9c8e2ea83faacce47c5eb4))


### Features

* feature flag implementation ([#4891](https://github.com/aws-amplify/amplify-cli/issues/4891)) ([6d1c632](https://github.com/aws-amplify/amplify-cli/commit/6d1c632952a49cb56670c11c9cb0c3620d0eb332))





# [4.23.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.22.5...amplify-provider-awscloudformation@4.23.0) (2020-07-23)


### Bug Fixes

* **amplify-provider-awscloudformation:** Stack delete condition ([#4465](https://github.com/aws-amplify/amplify-cli/issues/4465)) ([aa04e88](https://github.com/aws-amplify/amplify-cli/commit/aa04e88d6efeb826e9820230e1a19d5db5024bad))


### Features

* feature flag implementation ([#4891](https://github.com/aws-amplify/amplify-cli/issues/4891)) ([4639450](https://github.com/aws-amplify/amplify-cli/commit/463945029cfe861f74986d9a8b9af6b827d2063d))





## [4.22.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.22.4...amplify-provider-awscloudformation@4.22.5) (2020-07-18)


### Bug Fixes

* **amplify-provider-awscloudformation:** fix bug for no credential file ([#4310](https://github.com/aws-amplify/amplify-cli/issues/4310)) ([183e201](https://github.com/aws-amplify/amplify-cli/commit/183e20133eb938b596039ea63bd08e1c9b4c84e4)), closes [#4284](https://github.com/aws-amplify/amplify-cli/issues/4284)





## [4.22.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.22.3...amplify-provider-awscloudformation@4.22.4) (2020-07-15)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [4.22.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.22.2...amplify-provider-awscloudformation@4.22.3) (2020-07-14)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [4.22.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.22.1...amplify-provider-awscloudformation@4.22.2) (2020-07-11)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [4.22.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.22.0...amplify-provider-awscloudformation@4.22.1) (2020-07-09)

**Note:** Version bump only for package amplify-provider-awscloudformation





# [4.22.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.21.1...amplify-provider-awscloudformation@4.22.0) (2020-07-07)


### Features

* Lambda layers ([#4697](https://github.com/aws-amplify/amplify-cli/issues/4697)) ([c55b2e0](https://github.com/aws-amplify/amplify-cli/commit/c55b2e0c3377127aaf887591d7bc20d7240ef11d))





## [4.21.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.21.0...amplify-provider-awscloudformation@4.21.1) (2020-06-25)


### Bug Fixes

* **amplify-provider-awscloudformation:** add missing require ([#4647](https://github.com/aws-amplify/amplify-cli/issues/4647)) ([17d70f1](https://github.com/aws-amplify/amplify-cli/commit/17d70f1c998c30c1fe0b61722c7e59b5e48b1041)), closes [#4398](https://github.com/aws-amplify/amplify-cli/issues/4398)


### Reverts

* Revert "fix: change scope of hashed files for AppSync (#4602)" ([73aaab1](https://github.com/aws-amplify/amplify-cli/commit/73aaab1a7b1f8b2de5fa22fa1ef9aeea7de35cb4)), closes [#4602](https://github.com/aws-amplify/amplify-cli/issues/4602)





# [4.21.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.20.4...amplify-provider-awscloudformation@4.21.0) (2020-06-18)


### Bug Fixes

* **amplify-provider-awscloudformation:** fixing unhandled promise ([#4599](https://github.com/aws-amplify/amplify-cli/issues/4599)) ([65fecc2](https://github.com/aws-amplify/amplify-cli/commit/65fecc2fd0f13abc1657978880313dbf3143867d))
* change scope of hashed files for AppSync ([#4602](https://github.com/aws-amplify/amplify-cli/issues/4602)) ([10fa9da](https://github.com/aws-amplify/amplify-cli/commit/10fa9da646f4de755e2dc92cd4bb2a6319425d72)), closes [#4458](https://github.com/aws-amplify/amplify-cli/issues/4458)
* occurred spelling mistake ([#4595](https://github.com/aws-amplify/amplify-cli/issues/4595)) ([eaf08e0](https://github.com/aws-amplify/amplify-cli/commit/eaf08e00841830e9654fea61ce901f2cb478eebe))


### Features

* show rest api url on amplify status ([#4547](https://github.com/aws-amplify/amplify-cli/issues/4547)) ([92983c4](https://github.com/aws-amplify/amplify-cli/commit/92983c4798ab4bcaf244e637686156f23e469eb7))


### Performance Improvements

* optimize appsync file upload and bucket exist check ([#4533](https://github.com/aws-amplify/amplify-cli/issues/4533)) ([f45d32b](https://github.com/aws-amplify/amplify-cli/commit/f45d32bc0805f498a6171b2fd3455445863d9c04))





## [4.20.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.20.3...amplify-provider-awscloudformation@4.20.4) (2020-06-11)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [4.20.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.20.2...amplify-provider-awscloudformation@4.20.3) (2020-06-10)


### Bug Fixes

* [#3096](https://github.com/aws-amplify/amplify-cli/issues/3096) - glob *template*.+(yaml|yml|json) files only as cfn template ([#4478](https://github.com/aws-amplify/amplify-cli/issues/4478)) ([8f4bab6](https://github.com/aws-amplify/amplify-cli/commit/8f4bab62bce68029a04b8d15c19746e4562f7596))





## [4.20.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.20.1...amplify-provider-awscloudformation@4.20.2) (2020-06-02)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [4.20.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.20.0...amplify-provider-awscloudformation@4.20.1) (2020-05-26)

**Note:** Version bump only for package amplify-provider-awscloudformation





# [4.20.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.19.1...amplify-provider-awscloudformation@4.20.0) (2020-05-15)


### Features

* support for overriding pipeline function templates in transformer ([#4196](https://github.com/aws-amplify/amplify-cli/issues/4196)) ([e1830ae](https://github.com/aws-amplify/amplify-cli/commit/e1830aeb31fef8f035cb0a992a150d37f78e07bb)), closes [#4192](https://github.com/aws-amplify/amplify-cli/issues/4192)





## [4.19.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.19.0...amplify-provider-awscloudformation@4.19.1) (2020-05-08)


### Bug Fixes

* replaced v1 docs references with v2 docs references ([#4169](https://github.com/aws-amplify/amplify-cli/issues/4169)) ([b578c2d](https://github.com/aws-amplify/amplify-cli/commit/b578c2dcd10038367c653ede2f6da42e7644b41b))
* **amplify-provider-awscloudformation:** custom transformer imports ([#3236](https://github.com/aws-amplify/amplify-cli/issues/3236)) ([7794d73](https://github.com/aws-amplify/amplify-cli/commit/7794d73ab28d74bc8f5a13f8b4296cbb00f0ac13))





# [4.19.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.18.0...amplify-provider-awscloudformation@4.19.0) (2020-04-23)


### Bug Fixes

* check for unavailable bucket ([#3972](https://github.com/aws-amplify/amplify-cli/issues/3972)) ([de9c4c4](https://github.com/aws-amplify/amplify-cli/commit/de9c4c461351352694d81d9e7b2f9044b1a9a2c4))
* select us-east-2 in integ tests ([#3992](https://github.com/aws-amplify/amplify-cli/issues/3992)) ([ed48cf5](https://github.com/aws-amplify/amplify-cli/commit/ed48cf59a2e60cc25a78f83641ca8f3bc63bc68f))
* **amplify-category-interactions:** make category region aware ([#4047](https://github.com/aws-amplify/amplify-cli/issues/4047)) ([a40a772](https://github.com/aws-amplify/amplify-cli/commit/a40a77299d66c3791f65cf5389dac9f2db41696b))
* **amplify-provider-awscloudformation:** check before fetching backend ([#3848](https://github.com/aws-amplify/amplify-cli/issues/3848)) ([39be355](https://github.com/aws-amplify/amplify-cli/commit/39be3552f7f408dad02c2701a01f170be9badbb7))
* **amplify-provider-awscloudformation:** hide IAM secrets on entry ([#3970](https://github.com/aws-amplify/amplify-cli/issues/3970)) ([60559c5](https://github.com/aws-amplify/amplify-cli/commit/60559c58b3c24d433a9b13efeb886918e8bcad47))
* **amplify-provider-awscloudformation:** response type fix on grant ([#3955](https://github.com/aws-amplify/amplify-cli/issues/3955)) ([503b675](https://github.com/aws-amplify/amplify-cli/commit/503b6756ab6a06e8c10b21aafac987473639147c)), closes [#3428](https://github.com/aws-amplify/amplify-cli/issues/3428)


### Features

* **amplify-category-api:** allow minified CF stack templates ([#3520](https://github.com/aws-amplify/amplify-cli/issues/3520)) ([6da2a63](https://github.com/aws-amplify/amplify-cli/commit/6da2a634548fdf48deb4b1144c67d1e1515abb80)), closes [#2914](https://github.com/aws-amplify/amplify-cli/issues/2914)


### Reverts

* Revert "fix(amplify-provider-awscloudformation): check before fetching backend (#3848)" (#3968) ([4abd582](https://github.com/aws-amplify/amplify-cli/commit/4abd5828bb5138944b116476d8b9491597aecc88)), closes [#3848](https://github.com/aws-amplify/amplify-cli/issues/3848) [#3968](https://github.com/aws-amplify/amplify-cli/issues/3968)





# [4.18.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.17.1...amplify-provider-awscloudformation@4.18.0) (2020-04-06)


### Bug Fixes

* **amplify-provider-awscloudformation:** fix a bug in headless pull ([#3309](https://github.com/aws-amplify/amplify-cli/issues/3309)) ([af90f56](https://github.com/aws-amplify/amplify-cli/commit/af90f564ee73f9ba821cfadc469049d41c2fc3c1)), closes [#3292](https://github.com/aws-amplify/amplify-cli/issues/3292)
* **amplify-provider-awscloudformation:** fixed deletion for large bucket ([#3656](https://github.com/aws-amplify/amplify-cli/issues/3656)) ([32038da](https://github.com/aws-amplify/amplify-cli/commit/32038dad6f1bd0b9cf55e055d6a4545a222a1149)), closes [#3447](https://github.com/aws-amplify/amplify-cli/issues/3447) [#3451](https://github.com/aws-amplify/amplify-cli/issues/3451)
* **amplify-provider-awscloudformation:** push failing from mock ([#3805](https://github.com/aws-amplify/amplify-cli/issues/3805)) ([c6ea964](https://github.com/aws-amplify/amplify-cli/commit/c6ea964712d1fc127466822638a076c7492260ab)), closes [#3793](https://github.com/aws-amplify/amplify-cli/issues/3793)


### Features

* **amplify-category-function:** Refactor invoke to call runtime plugins ([#3768](https://github.com/aws-amplify/amplify-cli/issues/3768)) ([92293fa](https://github.com/aws-amplify/amplify-cli/commit/92293fa83190bd18aacdc2f46a22938f94b89609))
* **amplify-python-runtime-provider:** implement python runtime provider ([#3787](https://github.com/aws-amplify/amplify-cli/issues/3787)) ([8996cb1](https://github.com/aws-amplify/amplify-cli/commit/8996cb11015873f1236340680694188fd17c0f2e))





## [4.17.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.17.0...amplify-provider-awscloudformation@4.17.1) (2020-03-26)

**Note:** Version bump only for package amplify-provider-awscloudformation





# [4.17.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.16.1...amplify-provider-awscloudformation@4.17.0) (2020-03-22)


### Bug Fixes

* **amplify-provider-awscloudformation:** fixed deletion for large buckets ([#3512](https://github.com/aws-amplify/amplify-cli/issues/3512)) ([21951c1](https://github.com/aws-amplify/amplify-cli/commit/21951c135dc0228fe58191dda2cabd0e5d296aa1)), closes [#3447](https://github.com/aws-amplify/amplify-cli/issues/3447) [#3451](https://github.com/aws-amplify/amplify-cli/issues/3451)
* enable only-userpool flow without idp and addition of groups without roles tied to idp ([#3662](https://github.com/aws-amplify/amplify-cli/issues/3662)) ([67e0401](https://github.com/aws-amplify/amplify-cli/commit/67e04018d758e617374c4b8ba2298872e728d01e))
* fixing name of nodej function provider plugin name ([7e27785](https://github.com/aws-amplify/amplify-cli/commit/7e27785e9d4208d8e0d0674f1f1644e670139a86))
* **graphql-elasticsearch-transformer:** fix duplicate records in es lambda ([#3712](https://github.com/aws-amplify/amplify-cli/issues/3712)) ([dd9f7e0](https://github.com/aws-amplify/amplify-cli/commit/dd9f7e0031a0dc68a9027de02f60bbe69d315c3d)), closes [#3602](https://github.com/aws-amplify/amplify-cli/issues/3602) [#3705](https://github.com/aws-amplify/amplify-cli/issues/3705)
* fixing searchable migration document link in the cli flow ([#3735](https://github.com/aws-amplify/amplify-cli/issues/3735)) ([fed2f5d](https://github.com/aws-amplify/amplify-cli/commit/fed2f5dac6443dab60c522fa2cced1f2a7adc6c9))


### Features

* **amplify-category-function:** refactor to support build and package interface of runtime plugins ([8c4ec55](https://github.com/aws-amplify/amplify-cli/commit/8c4ec55e46ed8a153eee306c23f9665d58d3c5f4))
* **amplify-category-function:** refactor to support runtime and template plugins ([#3517](https://github.com/aws-amplify/amplify-cli/issues/3517)) ([607ae21](https://github.com/aws-amplify/amplify-cli/commit/607ae21287941805f44ea8a9b78dd12d16d71f85))
* **amplify-python-runtime-provider:** implement python runtime provider ([#3710](https://github.com/aws-amplify/amplify-cli/issues/3710)) ([cddb5a7](https://github.com/aws-amplify/amplify-cli/commit/cddb5a7b47abacae11205776cb56d68a56286f45))


### Reverts

* Revert "feat(amplify-python-runtime-provider): implement python runtime provider (#3710)" (#3719) ([e20ed97](https://github.com/aws-amplify/amplify-cli/commit/e20ed975ea46f124e736b4dfc940e1be1a781f87)), closes [#3710](https://github.com/aws-amplify/amplify-cli/issues/3710) [#3719](https://github.com/aws-amplify/amplify-cli/issues/3719)
* Revert "fix(amplify-provider-awscloudformation): fixed deletion for large buckets (#3512)" (#3649) ([4694834](https://github.com/aws-amplify/amplify-cli/commit/469483482f182d24ffe22af12a9f40e5cc484b2e)), closes [#3512](https://github.com/aws-amplify/amplify-cli/issues/3512) [#3649](https://github.com/aws-amplify/amplify-cli/issues/3649)





## [4.16.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.16.0...amplify-provider-awscloudformation@4.16.1) (2020-03-10)


### Bug Fixes

* **amplify-category-analytics:** delete pinpoint project in delete ([#3165](https://github.com/aws-amplify/amplify-cli/issues/3165)) ([acc0240](https://github.com/aws-amplify/amplify-cli/commit/acc0240c02630b4b9424370732706955ea447057)), closes [#2974](https://github.com/aws-amplify/amplify-cli/issues/2974)





# [4.16.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.13.4...amplify-provider-awscloudformation@4.16.0) (2020-03-07)


### Bug Fixes

* **amplify-provider-awscloudformation:** fix template not found ([#3406](https://github.com/aws-amplify/amplify-cli/issues/3406)) ([93fefe9](https://github.com/aws-amplify/amplify-cli/commit/93fefe900781fe5266fcbb7cc95f30f85399b30b))
* scoping down user pool group IAM roles and adding --force to amplify push command ([#3609](https://github.com/aws-amplify/amplify-cli/issues/3609)) ([2e10a2f](https://github.com/aws-amplify/amplify-cli/commit/2e10a2ff62b61f57b2d513a7cfd0e4478f429f1f))


### Features

* ability to add custom EventSource and lambda triggers via amplify add function, kinesis support in analytics category ([#2463](https://github.com/aws-amplify/amplify-cli/issues/2463)) ([b25cfd0](https://github.com/aws-amplify/amplify-cli/commit/b25cfd00b21416a82ecefda1f6498206ef71531b))





## [4.14.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.13.6-beta.0...amplify-provider-awscloudformation@4.14.1) (2020-03-05)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [4.13.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.13.3...amplify-provider-awscloudformation@4.13.4) (2020-02-18)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [4.13.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.13.2...amplify-provider-awscloudformation@4.13.3) (2020-02-13)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [4.13.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.13.1...amplify-provider-awscloudformation@4.13.2) (2020-02-07)

**Note:** Version bump only for package amplify-provider-awscloudformation





## [4.13.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@4.13.0...amplify-provider-awscloudformation@4.13.1) (2020-01-24)

**Note:** Version bump only for package amplify-provider-awscloudformation





# [4.13.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@3.17.0...amplify-provider-awscloudformation@4.13.0) (2020-01-23)

### Bug Fixes

- api key creation/deletion logic ([#2678](https://github.com/aws-amplify/amplify-cli/issues/2678)) ([e1d111d](https://github.com/aws-amplify/amplify-cli/commit/e1d111d87cbe71f9c7a41a61e243f6d907905878))
- delete hangs for a bit before exiting ([#2979](https://github.com/aws-amplify/amplify-cli/issues/2979)) ([fc45778](https://github.com/aws-amplify/amplify-cli/commit/fc4577874579ad12a12e9b693e62a2bd88144335)), closes [#2615](https://github.com/aws-amplify/amplify-cli/issues/2615) [#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)
- **amplify-provider-awscloudformation:** prevent console build error ([#3078](https://github.com/aws-amplify/amplify-cli/issues/3078)) ([0bb4019](https://github.com/aws-amplify/amplify-cli/commit/0bb40199f905aca6c92515c2dfac187965b6d87e))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))
- include api build directory in cloud zip ([#2819](https://github.com/aws-amplify/amplify-cli/issues/2819)) ([f26fea4](https://github.com/aws-amplify/amplify-cli/commit/f26fea4138ec20847ae9e577f9315aa865d9679a))
- pass appsync specific directives to model gen ([#3211](https://github.com/aws-amplify/amplify-cli/issues/3211)) ([c9a6ada](https://github.com/aws-amplify/amplify-cli/commit/c9a6ada683a32f2a82ef9fdc4b0cb37ea70ccb11))
- **amplify-provider-awscloudformation:** transformer loading ([#2924](https://github.com/aws-amplify/amplify-cli/issues/2924)) ([e1256d9](https://github.com/aws-amplify/amplify-cli/commit/e1256d9a508ac0cf843f7e2a4d53a62bf79c17a8))
- remove extra curly brace in CLI output ([#3194](https://github.com/aws-amplify/amplify-cli/issues/3194)) ([e15d994](https://github.com/aws-amplify/amplify-cli/commit/e15d994fcd2e7c136932845a9e772a9546d48b73))
- **amplify-category-notifications:** fix notifications env change issue ([#2669](https://github.com/aws-amplify/amplify-cli/issues/2669)) ([54d4d64](https://github.com/aws-amplify/amplify-cli/commit/54d4d64e03dc246e42ba3e2d19b1789d2dbeaddc)), closes [#2616](https://github.com/aws-amplify/amplify-cli/issues/2616)
- **amplify-provider-awscloudformation:** add condition for migration ([#3196](https://github.com/aws-amplify/amplify-cli/issues/3196)) ([6a35a5c](https://github.com/aws-amplify/amplify-cli/commit/6a35a5c8fadc4dbc5c38b82d007cd0cc240afe00))
- **amplify-provider-awscloudformation:** add retry logic ([#3020](https://github.com/aws-amplify/amplify-cli/issues/3020)) ([5f2a5be](https://github.com/aws-amplify/amplify-cli/commit/5f2a5bedc3fcb627a954a41620b012be6f60bab2)), closes [#3019](https://github.com/aws-amplify/amplify-cli/issues/3019) [#3027](https://github.com/aws-amplify/amplify-cli/issues/3027)
- **amplify-provider-awscloudformation:** fix add env learn more bug ([#3164](https://github.com/aws-amplify/amplify-cli/issues/3164)) ([4fb2649](https://github.com/aws-amplify/amplify-cli/commit/4fb26498c6eb266ffe11bdb276f5e91a46f1f65d)), closes [#3158](https://github.com/aws-amplify/amplify-cli/issues/3158)
- **amplify-provider-awscloudformation:** fix multi env creation bug ([#2872](https://github.com/aws-amplify/amplify-cli/issues/2872)) ([007a8d1](https://github.com/aws-amplify/amplify-cli/commit/007a8d12da802c822b20a4351cb074b49f01bd23)), closes [#2868](https://github.com/aws-amplify/amplify-cli/issues/2868)
- **amplify-provider-awscloudformation:** hand general config ([#3054](https://github.com/aws-amplify/amplify-cli/issues/3054)) ([0a5989d](https://github.com/aws-amplify/amplify-cli/commit/0a5989d977aefaab689f0a1fa8c21510257ac3d7))
- **cli:** fix console issue 342 and 350 ([#3189](https://github.com/aws-amplify/amplify-cli/issues/3189)) ([cbe26e0](https://github.com/aws-amplify/amplify-cli/commit/cbe26e01c657031e73b77fe408e53430029cab17)), closes [#350](https://github.com/aws-amplify/amplify-cli/issues/350)

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- **cli:** migrate projects that don't have Amplify AppId ([#2987](https://github.com/aws-amplify/amplify-cli/issues/2987)) ([80a8733](https://github.com/aws-amplify/amplify-cli/commit/80a8733c3ca4c273ce89b0e571d9bbd8c0b0fd3f))

# [4.12.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@3.17.0...amplify-provider-awscloudformation@4.12.0) (2020-01-09)

### Bug Fixes

- api key creation/deletion logic ([#2678](https://github.com/aws-amplify/amplify-cli/issues/2678)) ([e1d111d](https://github.com/aws-amplify/amplify-cli/commit/e1d111d87cbe71f9c7a41a61e243f6d907905878))
- **amplify-category-notifications:** fix notifications env change issue ([#2669](https://github.com/aws-amplify/amplify-cli/issues/2669)) ([54d4d64](https://github.com/aws-amplify/amplify-cli/commit/54d4d64e03dc246e42ba3e2d19b1789d2dbeaddc)), closes [#2616](https://github.com/aws-amplify/amplify-cli/issues/2616)
- **amplify-provider-awscloudformation:** add retry logic ([#3020](https://github.com/aws-amplify/amplify-cli/issues/3020)) ([5f2a5be](https://github.com/aws-amplify/amplify-cli/commit/5f2a5bedc3fcb627a954a41620b012be6f60bab2)), closes [#3019](https://github.com/aws-amplify/amplify-cli/issues/3019) [#3027](https://github.com/aws-amplify/amplify-cli/issues/3027)
- **amplify-provider-awscloudformation:** fix multi env creation bug ([#2872](https://github.com/aws-amplify/amplify-cli/issues/2872)) ([007a8d1](https://github.com/aws-amplify/amplify-cli/commit/007a8d12da802c822b20a4351cb074b49f01bd23)), closes [#2868](https://github.com/aws-amplify/amplify-cli/issues/2868)
- **amplify-provider-awscloudformation:** hand general config ([#3054](https://github.com/aws-amplify/amplify-cli/issues/3054)) ([0a5989d](https://github.com/aws-amplify/amplify-cli/commit/0a5989d977aefaab689f0a1fa8c21510257ac3d7))
- **amplify-provider-awscloudformation:** prevent console build error ([#3078](https://github.com/aws-amplify/amplify-cli/issues/3078)) ([0bb4019](https://github.com/aws-amplify/amplify-cli/commit/0bb40199f905aca6c92515c2dfac187965b6d87e))
- **amplify-provider-awscloudformation:** transformer loading ([#2924](https://github.com/aws-amplify/amplify-cli/issues/2924)) ([e1256d9](https://github.com/aws-amplify/amplify-cli/commit/e1256d9a508ac0cf843f7e2a4d53a62bf79c17a8))
- delete hangs for a bit before exiting ([#2979](https://github.com/aws-amplify/amplify-cli/issues/2979)) ([fc45778](https://github.com/aws-amplify/amplify-cli/commit/fc4577874579ad12a12e9b693e62a2bd88144335)), closes [#2615](https://github.com/aws-amplify/amplify-cli/issues/2615) [#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))
- include api build directory in cloud zip ([#2819](https://github.com/aws-amplify/amplify-cli/issues/2819)) ([f26fea4](https://github.com/aws-amplify/amplify-cli/commit/f26fea4138ec20847ae9e577f9315aa865d9679a))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- **cli:** migrate projects that don't have Amplify AppId ([#2987](https://github.com/aws-amplify/amplify-cli/issues/2987)) ([80a8733](https://github.com/aws-amplify/amplify-cli/commit/80a8733c3ca4c273ce89b0e571d9bbd8c0b0fd3f))

# [4.11.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@3.17.0...amplify-provider-awscloudformation@4.11.0) (2019-12-31)

### Bug Fixes

- api key creation/deletion logic ([#2678](https://github.com/aws-amplify/amplify-cli/issues/2678)) ([e1d111d](https://github.com/aws-amplify/amplify-cli/commit/e1d111d87cbe71f9c7a41a61e243f6d907905878))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))
- include api build directory in cloud zip ([#2819](https://github.com/aws-amplify/amplify-cli/issues/2819)) ([f26fea4](https://github.com/aws-amplify/amplify-cli/commit/f26fea4138ec20847ae9e577f9315aa865d9679a))
- **amplify-category-notifications:** fix notifications env change issue ([#2669](https://github.com/aws-amplify/amplify-cli/issues/2669)) ([54d4d64](https://github.com/aws-amplify/amplify-cli/commit/54d4d64e03dc246e42ba3e2d19b1789d2dbeaddc)), closes [#2616](https://github.com/aws-amplify/amplify-cli/issues/2616)
- **amplify-provider-awscloudformation:** add retry logic ([#3020](https://github.com/aws-amplify/amplify-cli/issues/3020)) ([5f2a5be](https://github.com/aws-amplify/amplify-cli/commit/5f2a5bedc3fcb627a954a41620b012be6f60bab2)), closes [#3019](https://github.com/aws-amplify/amplify-cli/issues/3019) [#3027](https://github.com/aws-amplify/amplify-cli/issues/3027)
- **amplify-provider-awscloudformation:** fix multi env creation bug ([#2872](https://github.com/aws-amplify/amplify-cli/issues/2872)) ([007a8d1](https://github.com/aws-amplify/amplify-cli/commit/007a8d12da802c822b20a4351cb074b49f01bd23)), closes [#2868](https://github.com/aws-amplify/amplify-cli/issues/2868)
- **amplify-provider-awscloudformation:** prevent console build error ([#3078](https://github.com/aws-amplify/amplify-cli/issues/3078)) ([0bb4019](https://github.com/aws-amplify/amplify-cli/commit/0bb40199f905aca6c92515c2dfac187965b6d87e))
- **amplify-provider-awscloudformation:** transformer loading ([#2924](https://github.com/aws-amplify/amplify-cli/issues/2924)) ([e1256d9](https://github.com/aws-amplify/amplify-cli/commit/e1256d9a508ac0cf843f7e2a4d53a62bf79c17a8))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- **cli:** migrate projects that don't have Amplify AppId ([#2987](https://github.com/aws-amplify/amplify-cli/issues/2987)) ([80a8733](https://github.com/aws-amplify/amplify-cli/commit/80a8733c3ca4c273ce89b0e571d9bbd8c0b0fd3f))

# [4.10.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@3.17.0...amplify-provider-awscloudformation@4.10.0) (2019-12-28)

### Bug Fixes

- api key creation/deletion logic ([#2678](https://github.com/aws-amplify/amplify-cli/issues/2678)) ([e1d111d](https://github.com/aws-amplify/amplify-cli/commit/e1d111d87cbe71f9c7a41a61e243f6d907905878))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))
- include api build directory in cloud zip ([#2819](https://github.com/aws-amplify/amplify-cli/issues/2819)) ([f26fea4](https://github.com/aws-amplify/amplify-cli/commit/f26fea4138ec20847ae9e577f9315aa865d9679a))
- **amplify-category-notifications:** fix notifications env change issue ([#2669](https://github.com/aws-amplify/amplify-cli/issues/2669)) ([54d4d64](https://github.com/aws-amplify/amplify-cli/commit/54d4d64e03dc246e42ba3e2d19b1789d2dbeaddc)), closes [#2616](https://github.com/aws-amplify/amplify-cli/issues/2616)
- **amplify-provider-awscloudformation:** add retry logic ([#3020](https://github.com/aws-amplify/amplify-cli/issues/3020)) ([5f2a5be](https://github.com/aws-amplify/amplify-cli/commit/5f2a5bedc3fcb627a954a41620b012be6f60bab2)), closes [#3019](https://github.com/aws-amplify/amplify-cli/issues/3019) [#3027](https://github.com/aws-amplify/amplify-cli/issues/3027)
- **amplify-provider-awscloudformation:** fix multi env creation bug ([#2872](https://github.com/aws-amplify/amplify-cli/issues/2872)) ([007a8d1](https://github.com/aws-amplify/amplify-cli/commit/007a8d12da802c822b20a4351cb074b49f01bd23)), closes [#2868](https://github.com/aws-amplify/amplify-cli/issues/2868)
- **amplify-provider-awscloudformation:** prevent console build error ([#3078](https://github.com/aws-amplify/amplify-cli/issues/3078)) ([0bb4019](https://github.com/aws-amplify/amplify-cli/commit/0bb40199f905aca6c92515c2dfac187965b6d87e))
- **amplify-provider-awscloudformation:** transformer loading ([#2924](https://github.com/aws-amplify/amplify-cli/issues/2924)) ([e1256d9](https://github.com/aws-amplify/amplify-cli/commit/e1256d9a508ac0cf843f7e2a4d53a62bf79c17a8))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- **cli:** migrate projects that don't have Amplify AppId ([#2987](https://github.com/aws-amplify/amplify-cli/issues/2987)) ([80a8733](https://github.com/aws-amplify/amplify-cli/commit/80a8733c3ca4c273ce89b0e571d9bbd8c0b0fd3f))

# [4.9.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@3.17.0...amplify-provider-awscloudformation@4.9.0) (2019-12-26)

### Bug Fixes

- api key creation/deletion logic ([#2678](https://github.com/aws-amplify/amplify-cli/issues/2678)) ([e1d111d](https://github.com/aws-amplify/amplify-cli/commit/e1d111d87cbe71f9c7a41a61e243f6d907905878))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))
- include api build directory in cloud zip ([#2819](https://github.com/aws-amplify/amplify-cli/issues/2819)) ([f26fea4](https://github.com/aws-amplify/amplify-cli/commit/f26fea4138ec20847ae9e577f9315aa865d9679a))
- **amplify-category-notifications:** fix notifications env change issue ([#2669](https://github.com/aws-amplify/amplify-cli/issues/2669)) ([54d4d64](https://github.com/aws-amplify/amplify-cli/commit/54d4d64e03dc246e42ba3e2d19b1789d2dbeaddc)), closes [#2616](https://github.com/aws-amplify/amplify-cli/issues/2616)
- **amplify-provider-awscloudformation:** add retry logic ([#3020](https://github.com/aws-amplify/amplify-cli/issues/3020)) ([5f2a5be](https://github.com/aws-amplify/amplify-cli/commit/5f2a5bedc3fcb627a954a41620b012be6f60bab2)), closes [#3019](https://github.com/aws-amplify/amplify-cli/issues/3019) [#3027](https://github.com/aws-amplify/amplify-cli/issues/3027)
- **amplify-provider-awscloudformation:** fix multi env creation bug ([#2872](https://github.com/aws-amplify/amplify-cli/issues/2872)) ([007a8d1](https://github.com/aws-amplify/amplify-cli/commit/007a8d12da802c822b20a4351cb074b49f01bd23)), closes [#2868](https://github.com/aws-amplify/amplify-cli/issues/2868)
- **amplify-provider-awscloudformation:** prevent console build error ([#3078](https://github.com/aws-amplify/amplify-cli/issues/3078)) ([0bb4019](https://github.com/aws-amplify/amplify-cli/commit/0bb40199f905aca6c92515c2dfac187965b6d87e))
- **amplify-provider-awscloudformation:** transformer loading ([#2924](https://github.com/aws-amplify/amplify-cli/issues/2924)) ([e1256d9](https://github.com/aws-amplify/amplify-cli/commit/e1256d9a508ac0cf843f7e2a4d53a62bf79c17a8))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- **cli:** migrate projects that don't have Amplify AppId ([#2987](https://github.com/aws-amplify/amplify-cli/issues/2987)) ([80a8733](https://github.com/aws-amplify/amplify-cli/commit/80a8733c3ca4c273ce89b0e571d9bbd8c0b0fd3f))

# [4.8.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@3.17.0...amplify-provider-awscloudformation@4.8.0) (2019-12-25)

### Bug Fixes

- api key creation/deletion logic ([#2678](https://github.com/aws-amplify/amplify-cli/issues/2678)) ([e1d111d](https://github.com/aws-amplify/amplify-cli/commit/e1d111d87cbe71f9c7a41a61e243f6d907905878))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))
- include api build directory in cloud zip ([#2819](https://github.com/aws-amplify/amplify-cli/issues/2819)) ([f26fea4](https://github.com/aws-amplify/amplify-cli/commit/f26fea4138ec20847ae9e577f9315aa865d9679a))
- **amplify-category-notifications:** fix notifications env change issue ([#2669](https://github.com/aws-amplify/amplify-cli/issues/2669)) ([54d4d64](https://github.com/aws-amplify/amplify-cli/commit/54d4d64e03dc246e42ba3e2d19b1789d2dbeaddc)), closes [#2616](https://github.com/aws-amplify/amplify-cli/issues/2616)
- **amplify-provider-awscloudformation:** add retry logic ([#3020](https://github.com/aws-amplify/amplify-cli/issues/3020)) ([5f2a5be](https://github.com/aws-amplify/amplify-cli/commit/5f2a5bedc3fcb627a954a41620b012be6f60bab2)), closes [#3019](https://github.com/aws-amplify/amplify-cli/issues/3019) [#3027](https://github.com/aws-amplify/amplify-cli/issues/3027)
- **amplify-provider-awscloudformation:** fix multi env creation bug ([#2872](https://github.com/aws-amplify/amplify-cli/issues/2872)) ([007a8d1](https://github.com/aws-amplify/amplify-cli/commit/007a8d12da802c822b20a4351cb074b49f01bd23)), closes [#2868](https://github.com/aws-amplify/amplify-cli/issues/2868)
- **amplify-provider-awscloudformation:** transformer loading ([#2924](https://github.com/aws-amplify/amplify-cli/issues/2924)) ([e1256d9](https://github.com/aws-amplify/amplify-cli/commit/e1256d9a508ac0cf843f7e2a4d53a62bf79c17a8))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- **cli:** migrate projects that don't have Amplify AppId ([#2987](https://github.com/aws-amplify/amplify-cli/issues/2987)) ([80a8733](https://github.com/aws-amplify/amplify-cli/commit/80a8733c3ca4c273ce89b0e571d9bbd8c0b0fd3f))

# [4.7.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@3.17.0...amplify-provider-awscloudformation@4.7.0) (2019-12-20)

### Bug Fixes

- api key creation/deletion logic ([#2678](https://github.com/aws-amplify/amplify-cli/issues/2678)) ([e1d111d](https://github.com/aws-amplify/amplify-cli/commit/e1d111d87cbe71f9c7a41a61e243f6d907905878))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))
- include api build directory in cloud zip ([#2819](https://github.com/aws-amplify/amplify-cli/issues/2819)) ([f26fea4](https://github.com/aws-amplify/amplify-cli/commit/f26fea4138ec20847ae9e577f9315aa865d9679a))
- **amplify-category-notifications:** fix notifications env change issue ([#2669](https://github.com/aws-amplify/amplify-cli/issues/2669)) ([54d4d64](https://github.com/aws-amplify/amplify-cli/commit/54d4d64e03dc246e42ba3e2d19b1789d2dbeaddc)), closes [#2616](https://github.com/aws-amplify/amplify-cli/issues/2616)
- **amplify-provider-awscloudformation:** add retry logic ([#3020](https://github.com/aws-amplify/amplify-cli/issues/3020)) ([5f2a5be](https://github.com/aws-amplify/amplify-cli/commit/5f2a5bedc3fcb627a954a41620b012be6f60bab2)), closes [#3019](https://github.com/aws-amplify/amplify-cli/issues/3019) [#3027](https://github.com/aws-amplify/amplify-cli/issues/3027)
- **amplify-provider-awscloudformation:** fix multi env creation bug ([#2872](https://github.com/aws-amplify/amplify-cli/issues/2872)) ([007a8d1](https://github.com/aws-amplify/amplify-cli/commit/007a8d12da802c822b20a4351cb074b49f01bd23)), closes [#2868](https://github.com/aws-amplify/amplify-cli/issues/2868)
- **amplify-provider-awscloudformation:** transformer loading ([#2924](https://github.com/aws-amplify/amplify-cli/issues/2924)) ([e1256d9](https://github.com/aws-amplify/amplify-cli/commit/e1256d9a508ac0cf843f7e2a4d53a62bf79c17a8))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [4.6.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@3.17.0...amplify-provider-awscloudformation@4.6.0) (2019-12-10)

### Bug Fixes

- api key creation/deletion logic ([#2678](https://github.com/aws-amplify/amplify-cli/issues/2678)) ([e1d111d](https://github.com/aws-amplify/amplify-cli/commit/e1d111d87cbe71f9c7a41a61e243f6d907905878))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))
- include api build directory in cloud zip ([#2819](https://github.com/aws-amplify/amplify-cli/issues/2819)) ([f26fea4](https://github.com/aws-amplify/amplify-cli/commit/f26fea4138ec20847ae9e577f9315aa865d9679a))
- **amplify-category-notifications:** fix notifications env change issue ([#2669](https://github.com/aws-amplify/amplify-cli/issues/2669)) ([54d4d64](https://github.com/aws-amplify/amplify-cli/commit/54d4d64e03dc246e42ba3e2d19b1789d2dbeaddc)), closes [#2616](https://github.com/aws-amplify/amplify-cli/issues/2616)
- **amplify-provider-awscloudformation:** fix multi env creation bug ([#2872](https://github.com/aws-amplify/amplify-cli/issues/2872)) ([007a8d1](https://github.com/aws-amplify/amplify-cli/commit/007a8d12da802c822b20a4351cb074b49f01bd23)), closes [#2868](https://github.com/aws-amplify/amplify-cli/issues/2868)
- **amplify-provider-awscloudformation:** transformer loading ([#2924](https://github.com/aws-amplify/amplify-cli/issues/2924)) ([e1256d9](https://github.com/aws-amplify/amplify-cli/commit/e1256d9a508ac0cf843f7e2a4d53a62bf79c17a8))

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [4.4.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@3.17.0...amplify-provider-awscloudformation@4.4.0) (2019-12-03)

### Bug Fixes

- api key creation/deletion logic ([#2678](https://github.com/aws-amplify/amplify-cli/issues/2678)) ([e1d111d](https://github.com/aws-amplify/amplify-cli/commit/e1d111d87cbe71f9c7a41a61e243f6d907905878))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))
- include api build directory in cloud zip ([#2819](https://github.com/aws-amplify/amplify-cli/issues/2819)) ([f26fea4](https://github.com/aws-amplify/amplify-cli/commit/f26fea4138ec20847ae9e577f9315aa865d9679a))
- **amplify-category-notifications:** fix notifications env change issue ([#2669](https://github.com/aws-amplify/amplify-cli/issues/2669)) ([54d4d64](https://github.com/aws-amplify/amplify-cli/commit/54d4d64e03dc246e42ba3e2d19b1789d2dbeaddc)), closes [#2616](https://github.com/aws-amplify/amplify-cli/issues/2616)
- **amplify-provider-awscloudformation:** fix multi env creation bug ([#2872](https://github.com/aws-amplify/amplify-cli/issues/2872)) ([007a8d1](https://github.com/aws-amplify/amplify-cli/commit/007a8d12da802c822b20a4351cb074b49f01bd23)), closes [#2868](https://github.com/aws-amplify/amplify-cli/issues/2868)

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [4.3.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@3.17.0...amplify-provider-awscloudformation@4.3.0) (2019-12-01)

### Bug Fixes

- api key creation/deletion logic ([#2678](https://github.com/aws-amplify/amplify-cli/issues/2678)) ([e1d111d](https://github.com/aws-amplify/amplify-cli/commit/e1d111d87cbe71f9c7a41a61e243f6d907905878))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))
- include api build directory in cloud zip ([#2819](https://github.com/aws-amplify/amplify-cli/issues/2819)) ([f26fea4](https://github.com/aws-amplify/amplify-cli/commit/f26fea4138ec20847ae9e577f9315aa865d9679a))
- **amplify-category-notifications:** fix notifications env change issue ([#2669](https://github.com/aws-amplify/amplify-cli/issues/2669)) ([54d4d64](https://github.com/aws-amplify/amplify-cli/commit/54d4d64e03dc246e42ba3e2d19b1789d2dbeaddc)), closes [#2616](https://github.com/aws-amplify/amplify-cli/issues/2616)
- **amplify-provider-awscloudformation:** fix multi env creation bug ([#2872](https://github.com/aws-amplify/amplify-cli/issues/2872)) ([007a8d1](https://github.com/aws-amplify/amplify-cli/commit/007a8d12da802c822b20a4351cb074b49f01bd23)), closes [#2868](https://github.com/aws-amplify/amplify-cli/issues/2868)

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [4.2.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@3.17.0...amplify-provider-awscloudformation@4.2.0) (2019-11-27)

### Bug Fixes

- api key creation/deletion logic ([#2678](https://github.com/aws-amplify/amplify-cli/issues/2678)) ([e1d111d](https://github.com/aws-amplify/amplify-cli/commit/e1d111d87cbe71f9c7a41a61e243f6d907905878))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))
- include api build directory in cloud zip ([#2819](https://github.com/aws-amplify/amplify-cli/issues/2819)) ([f26fea4](https://github.com/aws-amplify/amplify-cli/commit/f26fea4138ec20847ae9e577f9315aa865d9679a))
- **amplify-category-notifications:** fix notifications env change issue ([#2669](https://github.com/aws-amplify/amplify-cli/issues/2669)) ([54d4d64](https://github.com/aws-amplify/amplify-cli/commit/54d4d64e03dc246e42ba3e2d19b1789d2dbeaddc)), closes [#2616](https://github.com/aws-amplify/amplify-cli/issues/2616)

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [4.1.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@3.17.0...amplify-provider-awscloudformation@4.1.0) (2019-11-27)

### Bug Fixes

- api key creation/deletion logic ([#2678](https://github.com/aws-amplify/amplify-cli/issues/2678)) ([e1d111d](https://github.com/aws-amplify/amplify-cli/commit/e1d111d87cbe71f9c7a41a61e243f6d907905878))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))
- include api build directory in cloud zip ([#2819](https://github.com/aws-amplify/amplify-cli/issues/2819)) ([f26fea4](https://github.com/aws-amplify/amplify-cli/commit/f26fea4138ec20847ae9e577f9315aa865d9679a))
- **amplify-category-notifications:** fix notifications env change issue ([#2669](https://github.com/aws-amplify/amplify-cli/issues/2669)) ([54d4d64](https://github.com/aws-amplify/amplify-cli/commit/54d4d64e03dc246e42ba3e2d19b1789d2dbeaddc)), closes [#2616](https://github.com/aws-amplify/amplify-cli/issues/2616)

### Features

- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [3.0.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.13.2...amplify-provider-awscloudformation@3.0.0) (2019-08-30)

### Bug Fixes

- [#1056](https://github.com/aws-amplify/amplify-cli/issues/1056), dedup environment file reading ([#2088](https://github.com/aws-amplify/amplify-cli/issues/2088)) ([940deaa](https://github.com/aws-amplify/amplify-cli/commit/940deaa))
- [#429](https://github.com/aws-amplify/amplify-cli/issues/429) - Editor hanging bug ([#2086](https://github.com/aws-amplify/amplify-cli/issues/2086)) ([6767445](https://github.com/aws-amplify/amplify-cli/commit/6767445))
- fix metric agent for tracking CLI usage ([#2024](https://github.com/aws-amplify/amplify-cli/issues/2024)) ([a2742a6](https://github.com/aws-amplify/amplify-cli/commit/a2742a6))
- Fix package.json exists check for functions ([#2030](https://github.com/aws-amplify/amplify-cli/issues/2030)) ([a5283b7](https://github.com/aws-amplify/amplify-cli/commit/a5283b7))
- move test package dependencies to devDependencies ([#2034](https://github.com/aws-amplify/amplify-cli/issues/2034)) ([f5623d0](https://github.com/aws-amplify/amplify-cli/commit/f5623d0))

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
- **amplify-provider-awscloudformation:** hooks ([#1951](https://github.com/aws-amplify/amplify-cli/issues/1951)) ([caba157](https://github.com/aws-amplify/amplify-cli/commit/caba157))
- narrow-down idp roles scope ([#1974](https://github.com/aws-amplify/amplify-cli/issues/1974)) ([ccfd508](https://github.com/aws-amplify/amplify-cli/commit/ccfd508))
- sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))

* Adding Auth on Subscriptions (#2068) ([81c630d](https://github.com/aws-amplify/amplify-cli/commit/81c630d)), closes [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068)

### BREAKING CHANGES

- If an owner is used in the auth directive it will either be a requirement if it's
  the only rule or an optional input if used with other rules
- If an owner is included in the auth directive it will either be a requirement if
  it's the only rule or an optional input if used with other rules
- the subscription operations will require an argument if owner is the only auth rule
- Subscriptions will require an argument if an owner is only rule set - If owner &
  group rules are owner will be an optional arg

# [2.0.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.13.2...amplify-provider-awscloudformation@2.0.0) (2019-08-28)

### Bug Fixes

- [#1056](https://github.com/aws-amplify/amplify-cli/issues/1056), dedup environment file reading ([#2088](https://github.com/aws-amplify/amplify-cli/issues/2088)) ([940deaa](https://github.com/aws-amplify/amplify-cli/commit/940deaa))
- [#429](https://github.com/aws-amplify/amplify-cli/issues/429) - Editor hanging bug ([#2086](https://github.com/aws-amplify/amplify-cli/issues/2086)) ([6767445](https://github.com/aws-amplify/amplify-cli/commit/6767445))
- fix metric agent for tracking CLI usage ([#2024](https://github.com/aws-amplify/amplify-cli/issues/2024)) ([a2742a6](https://github.com/aws-amplify/amplify-cli/commit/a2742a6))
- Fix package.json exists check for functions ([#2030](https://github.com/aws-amplify/amplify-cli/issues/2030)) ([a5283b7](https://github.com/aws-amplify/amplify-cli/commit/a5283b7))
- move test package dependencies to devDependencies ([#2034](https://github.com/aws-amplify/amplify-cli/issues/2034)) ([f5623d0](https://github.com/aws-amplify/amplify-cli/commit/f5623d0))

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
- **amplify-provider-awscloudformation:** hooks ([#1951](https://github.com/aws-amplify/amplify-cli/issues/1951)) ([caba157](https://github.com/aws-amplify/amplify-cli/commit/caba157))
- narrow-down idp roles scope ([#1974](https://github.com/aws-amplify/amplify-cli/issues/1974)) ([ccfd508](https://github.com/aws-amplify/amplify-cli/commit/ccfd508))
- sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))

* Adding Auth on Subscriptions (#2068) ([81c630d](https://github.com/aws-amplify/amplify-cli/commit/81c630d)), closes [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068)

### BREAKING CHANGES

- If an owner is used in the auth directive it will either be a requirement if it's
  the only rule or an optional input if used with other rules
- If an owner is included in the auth directive it will either be a requirement if
  it's the only rule or an optional input if used with other rules
- the subscription operations will require an argument if owner is the only auth rule
- Subscriptions will require an argument if an owner is only rule set - If owner &
  group rules are owner will be an optional arg

# [1.17.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.13.2...amplify-provider-awscloudformation@1.17.0) (2019-08-13)

### Bug Fixes

- fix metric agent for tracking CLI usage ([#2024](https://github.com/aws-amplify/amplify-cli/issues/2024)) ([a2742a6](https://github.com/aws-amplify/amplify-cli/commit/a2742a6))
- Fix package.json exists check for functions ([#2030](https://github.com/aws-amplify/amplify-cli/issues/2030)) ([a5283b7](https://github.com/aws-amplify/amplify-cli/commit/a5283b7))

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
- **amplify-provider-awscloudformation:** hooks ([#1951](https://github.com/aws-amplify/amplify-cli/issues/1951)) ([caba157](https://github.com/aws-amplify/amplify-cli/commit/caba157))
- narrow-down idp roles scope ([#1974](https://github.com/aws-amplify/amplify-cli/issues/1974)) ([ccfd508](https://github.com/aws-amplify/amplify-cli/commit/ccfd508))
- sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))

# [1.16.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.13.2...amplify-provider-awscloudformation@1.16.0) (2019-08-07)

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e534))
- sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))

# [1.15.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.13.2...amplify-provider-awscloudformation@1.15.0) (2019-08-02)

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))

# [1.14.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.13.2...amplify-provider-awscloudformation@1.14.0) (2019-07-31)

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))
- sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe))

## [1.13.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.13.1...amplify-provider-awscloudformation@1.13.2) (2019-07-24)

**Note:** Version bump only for package amplify-provider-awscloudformation

## [1.13.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.13.0...amplify-provider-awscloudformation@1.13.1) (2019-07-23)

### Bug Fixes

- **amplify-provider-awscloudformation:** fix MFA prompt during init ([#1858](https://github.com/aws-amplify/amplify-cli/issues/1858)) ([2de3185](https://github.com/aws-amplify/amplify-cli/commit/2de3185)), closes [#1807](https://github.com/aws-amplify/amplify-cli/issues/1807)

# [1.13.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.12.2...amplify-provider-awscloudformation@1.13.0) (2019-07-09)

### Bug Fixes

- **amplify-category-function:** enable SAM templates for functions ([#1763](https://github.com/aws-amplify/amplify-cli/issues/1763)) ([9fc3854](https://github.com/aws-amplify/amplify-cli/commit/9fc3854)), closes [#1740](https://github.com/aws-amplify/amplify-cli/issues/1740)

### Features

- cognito + s3 + dyanmodb lambda trigger support ([#1783](https://github.com/aws-amplify/amplify-cli/issues/1783)) ([c6fc838](https://github.com/aws-amplify/amplify-cli/commit/c6fc838))

## [1.12.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.12.0...amplify-provider-awscloudformation@1.12.2) (2019-06-30)

### Bug Fixes

- fixing function build issue + e2e tests ([#1750](https://github.com/aws-amplify/amplify-cli/issues/1750)) ([c11c0bc](https://github.com/aws-amplify/amplify-cli/commit/c11c0bc)), closes [#1747](https://github.com/aws-amplify/amplify-cli/issues/1747)

# [1.12.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.11.5...amplify-provider-awscloudformation@1.12.0) (2019-06-26)

### Bug Fixes

- **amplify-provider-awscloudformation:** generate consistent S3 keys ([#1668](https://github.com/aws-amplify/amplify-cli/issues/1668)) ([e393d3a](https://github.com/aws-amplify/amplify-cli/commit/e393d3a)), closes [#1666](https://github.com/aws-amplify/amplify-cli/issues/1666)

### Features

- **amplify-provider-awscloudformation:** update fn build file name ([#1702](https://github.com/aws-amplify/amplify-cli/issues/1702)) ([0658d75](https://github.com/aws-amplify/amplify-cli/commit/0658d75))

## [1.11.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.11.4...amplify-provider-awscloudformation@1.11.5) (2019-06-20)

### Bug Fixes

- **cli:** fix inquirer version ([#1690](https://github.com/aws-amplify/amplify-cli/issues/1690)) ([9246032](https://github.com/aws-amplify/amplify-cli/commit/9246032)), closes [#1688](https://github.com/aws-amplify/amplify-cli/issues/1688)

## [1.11.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.11.3...amplify-provider-awscloudformation@1.11.4) (2019-06-18)

### Bug Fixes

- **amplify-provider-awscloudformation:** prevent abrupt closing of CLI ([#1655](https://github.com/aws-amplify/amplify-cli/issues/1655)) ([cf755df](https://github.com/aws-amplify/amplify-cli/commit/cf755df))

## [1.11.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.11.2...amplify-provider-awscloudformation@1.11.3) (2019-06-12)

**Note:** Version bump only for package amplify-provider-awscloudformation

## [1.11.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.11.1...amplify-provider-awscloudformation@1.11.2) (2019-06-11)

**Note:** Version bump only for package amplify-provider-awscloudformation

## [1.11.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.11.0...amplify-provider-awscloudformation@1.11.1) (2019-06-06)

### Bug Fixes

- **amplify-provider-awscloudformation:** filter by template extensions ([#1596](https://github.com/aws-amplify/amplify-cli/issues/1596)) ([adbf95a](https://github.com/aws-amplify/amplify-cli/commit/adbf95a))
- **amplify-provider-awscloudformation:** fix general configeLevel init ([#1602](https://github.com/aws-amplify/amplify-cli/issues/1602)) ([426acbf](https://github.com/aws-amplify/amplify-cli/commit/426acbf)), closes [#1388](https://github.com/aws-amplify/amplify-cli/issues/1388)
- **amplify-provider-awscloudformation:** fix http proxy ([#1604](https://github.com/aws-amplify/amplify-cli/issues/1604)) ([16dc4b4](https://github.com/aws-amplify/amplify-cli/commit/16dc4b4)), closes [#495](https://github.com/aws-amplify/amplify-cli/issues/495)

# [1.11.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.10.0...amplify-provider-awscloudformation@1.11.0) (2019-05-29)

### Features

- feature/[@key](https://github.com/key) ([#1463](https://github.com/aws-amplify/amplify-cli/issues/1463)) ([00ed819](https://github.com/aws-amplify/amplify-cli/commit/00ed819))

# [1.10.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.9.1...amplify-provider-awscloudformation@1.10.0) (2019-05-21)

### Features

- **amplify-provider-awscloudformation:** add http default transformer ([#1410](https://github.com/aws-amplify/amplify-cli/issues/1410)) ([41cd9d0](https://github.com/aws-amplify/amplify-cli/commit/41cd9d0))

## [1.9.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.9.0...amplify-provider-awscloudformation@1.9.1) (2019-05-17)

### Bug Fixes

- **amplify-provider-awscloudformation:** check creds before setting ([#1438](https://github.com/aws-amplify/amplify-cli/issues/1438)) ([0c2e2d1](https://github.com/aws-amplify/amplify-cli/commit/0c2e2d1)), closes [#1424](https://github.com/aws-amplify/amplify-cli/issues/1424)
- **amplify-provider-awscloudformation:** ensure build directory exist ([#1435](https://github.com/aws-amplify/amplify-cli/issues/1435)) ([a82fa99](https://github.com/aws-amplify/amplify-cli/commit/a82fa99)), closes [#1430](https://github.com/aws-amplify/amplify-cli/issues/1430) [#1430](https://github.com/aws-amplify/amplify-cli/issues/1430)

# [1.9.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.8.0...amplify-provider-awscloudformation@1.9.0) (2019-05-07)

### Bug Fixes

- **1342:** api push error on CI/CD platforms. ([#1383](https://github.com/aws-amplify/amplify-cli/issues/1383)) ([e0eff65](https://github.com/aws-amplify/amplify-cli/commit/e0eff65)), closes [#1342](https://github.com/aws-amplify/amplify-cli/issues/1342) [#1342](https://github.com/aws-amplify/amplify-cli/issues/1342)
- **amplify-provider-awscloudformation:** support multiprofile delete ([#1353](https://github.com/aws-amplify/amplify-cli/issues/1353)) ([404f1c3](https://github.com/aws-amplify/amplify-cli/commit/404f1c3)), closes [#978](https://github.com/aws-amplify/amplify-cli/issues/978)

### Features

- bump aws-sdk ver to support mixed auth ([#1414](https://github.com/aws-amplify/amplify-cli/issues/1414)) ([b2ed52b](https://github.com/aws-amplify/amplify-cli/commit/b2ed52b))

## [1.8.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.8.0...amplify-provider-awscloudformation@1.8.1) (2019-05-06)

### Bug Fixes

- **1342:** api push error on CI/CD platforms. ([#1383](https://github.com/aws-amplify/amplify-cli/issues/1383)) ([e0eff65](https://github.com/aws-amplify/amplify-cli/commit/e0eff65)), closes [#1342](https://github.com/aws-amplify/amplify-cli/issues/1342) [#1342](https://github.com/aws-amplify/amplify-cli/issues/1342)
- **amplify-provider-awscloudformation:** support multiprofile delete ([#1353](https://github.com/aws-amplify/amplify-cli/issues/1353)) ([404f1c3](https://github.com/aws-amplify/amplify-cli/commit/404f1c3)), closes [#978](https://github.com/aws-amplify/amplify-cli/issues/978)

# [1.8.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.7.1...amplify-provider-awscloudformation@1.8.0) (2019-04-30)

### Bug Fixes

- update CLI to handle UTF8 BOM ([#1357](https://github.com/aws-amplify/amplify-cli/issues/1357)) ([b0afa07](https://github.com/aws-amplify/amplify-cli/commit/b0afa07)), closes [#1355](https://github.com/aws-amplify/amplify-cli/issues/1355) [#1122](https://github.com/aws-amplify/amplify-cli/issues/1122)

### Features

- **amplify-provider-awscloudformation:** append env name ([8d8e522](https://github.com/aws-amplify/amplify-cli/commit/8d8e522)), closes [#1340](https://github.com/aws-amplify/amplify-cli/issues/1340)

## [1.7.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.7.0...amplify-provider-awscloudformation@1.7.1) (2019-04-25)

**Note:** Version bump only for package amplify-provider-awscloudformation

# [1.7.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.6.1...amplify-provider-awscloudformation@1.7.0) (2019-04-16)

### Bug Fixes

- **amplify-provider-awscloudformation:** ignore dot files ([#1256](https://github.com/aws-amplify/amplify-cli/issues/1256)) ([845298a](https://github.com/aws-amplify/amplify-cli/commit/845298a)), closes [#1135](https://github.com/aws-amplify/amplify-cli/issues/1135)

### Features

- add support for ap-northeast-2 ([a263afc](https://github.com/aws-amplify/amplify-cli/commit/a263afc))
- **field-level-auth:** Add field level auth support via the [@auth](https://github.com/auth) directive ([#1262](https://github.com/aws-amplify/amplify-cli/issues/1262)) ([3b1c600](https://github.com/aws-amplify/amplify-cli/commit/3b1c600)), closes [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)

## [1.6.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.5.0...amplify-provider-awscloudformation@1.6.1) (2019-04-09)

**Note:** Version bump only for package amplify-provider-awscloudformation

# [1.5.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.1.3...amplify-provider-awscloudformation@1.5.0) (2019-04-03)

### Features

- support for provisioning Cognito Hosted UI and support CRUD operations in Storage and API categories ([729b0de](https://github.com/aws-amplify/amplify-cli/commit/729b0de))

## [1.1.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.1.2...amplify-provider-awscloudformation@1.1.3) (2019-03-22)

**Note:** Version bump only for package amplify-provider-awscloudformation

## [1.1.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.1.1...amplify-provider-awscloudformation@1.1.2) (2019-03-05)

### Bug Fixes

- ignore file starting with a dot when compiling configs ([#905](https://github.com/aws-amplify/amplify-cli/issues/905)) ([f094160](https://github.com/aws-amplify/amplify-cli/commit/f094160))

### Performance Improvements

- speed up push ([#963](https://github.com/aws-amplify/amplify-cli/issues/963)) ([eb8b852](https://github.com/aws-amplify/amplify-cli/commit/eb8b852)), closes [#914](https://github.com/aws-amplify/amplify-cli/issues/914)

## [1.1.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.1.0...amplify-provider-awscloudformation@1.1.1) (2019-02-26)

**Note:** Version bump only for package amplify-provider-awscloudformation

# [1.1.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.0.10...amplify-provider-awscloudformation@1.1.0) (2019-02-25)

### Bug Fixes

- **amplify-provider-awscloudformation:** fix [#931](https://github.com/aws-amplify/amplify-cli/issues/931) ([bc724c9](https://github.com/aws-amplify/amplify-cli/commit/bc724c9))

### Features

- **amplify-provider-awscloudformation:** show CFN error when push fail ([#917](https://github.com/aws-amplify/amplify-cli/issues/917)) ([4502e4f](https://github.com/aws-amplify/amplify-cli/commit/4502e4f))

## [1.0.10](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.0.9...amplify-provider-awscloudformation@1.0.10) (2019-02-22)

### Bug Fixes

- **amplify-provider-awscloudformation:** fix pinpoint console url ([#912](https://github.com/aws-amplify/amplify-cli/issues/912)) ([77e3af6](https://github.com/aws-amplify/amplify-cli/commit/77e3af6)), closes [#910](https://github.com/aws-amplify/amplify-cli/issues/910)

## [1.0.9](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.0.8...amplify-provider-awscloudformation@1.0.9) (2019-02-20)

**Note:** Version bump only for package amplify-provider-awscloudformation

## [1.0.8](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.0.6...amplify-provider-awscloudformation@1.0.8) (2019-02-15)

### Bug Fixes

- add check for presence of s3template when forming nested cfn stack ([cc90080](https://github.com/aws-amplify/amplify-cli/commit/cc90080))
- copy providerMetadata to amplify-meta during env init ([#880](https://github.com/aws-amplify/amplify-cli/issues/880)) ([b9c5f67](https://github.com/aws-amplify/amplify-cli/commit/b9c5f67))
- remove console statement ([055967e](https://github.com/aws-amplify/amplify-cli/commit/055967e))

## [1.0.7](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.0.6...amplify-provider-awscloudformation@1.0.7) (2019-02-14)

### Bug Fixes

- add check for presence of s3template when forming nested cfn stack ([cc90080](https://github.com/aws-amplify/amplify-cli/commit/cc90080))
- remove console statement ([055967e](https://github.com/aws-amplify/amplify-cli/commit/055967e))

## [1.0.6](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.0.5...amplify-provider-awscloudformation@1.0.6) (2019-02-12)

**Note:** Version bump only for package amplify-provider-awscloudformation

## [1.0.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.0.3-beta.0...amplify-provider-awscloudformation@1.0.5) (2019-02-11)

**Note:** Version bump only for package amplify-provider-awscloudformation

## [1.0.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.0.3-beta.0...amplify-provider-awscloudformation@1.0.3) (2019-02-11)

**Note:** Version bump only for package amplify-provider-awscloudformation

## [1.0.3-beta.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@1.0.2...amplify-provider-awscloudformation@1.0.3-beta.0) (2019-02-11)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.30"></a>

## [0.2.1-multienv.30](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.29...amplify-provider-awscloudformation@0.2.1-multienv.30) (2019-01-30)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.29"></a>

## [0.2.1-multienv.29](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.28...amplify-provider-awscloudformation@0.2.1-multienv.29) (2019-01-29)

### Bug Fixes

- **amplify-provider-awscloudformation:** delete project without profile ([#788](https://github.com/aws-amplify/amplify-cli/issues/788)) ([a943adf](https://github.com/aws-amplify/amplify-cli/commit/a943adf))

<a name="0.2.1-multienv.28"></a>

## [0.2.1-multienv.28](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.27...amplify-provider-awscloudformation@0.2.1-multienv.28) (2019-01-25)

### Bug Fixes

- **amplify-provider-awscloudformation:** fix amplify delete error ([#771](https://github.com/aws-amplify/amplify-cli/issues/771)) ([13bc475](https://github.com/aws-amplify/amplify-cli/commit/13bc475))

<a name="0.2.1-multienv.27"></a>

## [0.2.1-multienv.27](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.26...amplify-provider-awscloudformation@0.2.1-multienv.27) (2019-01-25)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.26"></a>

## [0.2.1-multienv.26](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.25...amplify-provider-awscloudformation@0.2.1-multienv.26) (2019-01-24)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.25"></a>

## [0.2.1-multienv.25](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.24...amplify-provider-awscloudformation@0.2.1-multienv.25) (2019-01-22)

### Bug Fixes

- [#677](https://github.com/aws-amplify/amplify-cli/issues/677) ([#749](https://github.com/aws-amplify/amplify-cli/issues/749)) ([822060c](https://github.com/aws-amplify/amplify-cli/commit/822060c))

<a name="0.2.1-multienv.24"></a>

## [0.2.1-multienv.24](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.23...amplify-provider-awscloudformation@0.2.1-multienv.24) (2019-01-22)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.23"></a>

## [0.2.1-multienv.23](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.22...amplify-provider-awscloudformation@0.2.1-multienv.23) (2019-01-22)

### Bug Fixes

- **amplify-provider-awscloudformation:** batch cfn status polling ([#723](https://github.com/aws-amplify/amplify-cli/issues/723)) ([732fda1](https://github.com/aws-amplify/amplify-cli/commit/732fda1))

<a name="0.2.1-multienv.22"></a>

## [0.2.1-multienv.22](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.21...amplify-provider-awscloudformation@0.2.1-multienv.22) (2019-01-19)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.21"></a>

## [0.2.1-multienv.21](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.20...amplify-provider-awscloudformation@0.2.1-multienv.21) (2019-01-16)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.20"></a>

## [0.2.1-multienv.20](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.19...amplify-provider-awscloudformation@0.2.1-multienv.20) (2019-01-14)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.19"></a>

## [0.2.1-multienv.19](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.18...amplify-provider-awscloudformation@0.2.1-multienv.19) (2019-01-14)

### Features

- **amplify-provider-awscloudformation:** add pinpoint eu-central-1 region ([da6d3fb](https://github.com/aws-amplify/amplify-cli/commit/da6d3fb))

<a name="0.2.1-multienv.18"></a>

## [0.2.1-multienv.18](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.17...amplify-provider-awscloudformation@0.2.1-multienv.18) (2019-01-10)

### Bug Fixes

- **amplify-provider-awscloudformation:** fix profile loading ([#688](https://github.com/aws-amplify/amplify-cli/issues/688)) ([e96694b](https://github.com/aws-amplify/amplify-cli/commit/e96694b))

<a name="0.2.1-multienv.17"></a>

## [0.2.1-multienv.17](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.16...amplify-provider-awscloudformation@0.2.1-multienv.17) (2019-01-08)

### Features

- **amplify-provider-awscloudformation:** assume role ([#669](https://github.com/aws-amplify/amplify-cli/issues/669)) ([c3204bc](https://github.com/aws-amplify/amplify-cli/commit/c3204bc))

<a name="0.2.1-multienv.16"></a>

## [0.2.1-multienv.16](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.15...amplify-provider-awscloudformation@0.2.1-multienv.16) (2019-01-08)

### Bug Fixes

- **amplify-provider-awscloudformation:** fix region missing error ([#676](https://github.com/aws-amplify/amplify-cli/issues/676)) ([107ceac](https://github.com/aws-amplify/amplify-cli/commit/107ceac)), closes [#559](https://github.com/aws-amplify/amplify-cli/issues/559) [#559](https://github.com/aws-amplify/amplify-cli/issues/559)

<a name="0.2.1-multienv.15"></a>

## [0.2.1-multienv.15](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.14...amplify-provider-awscloudformation@0.2.1-multienv.15) (2018-12-31)

### Bug Fixes

- update grahql transformer package versions for multienv ([8b4b2bd](https://github.com/aws-amplify/amplify-cli/commit/8b4b2bd))

<a name="0.2.1-multienv.14"></a>

## [0.2.1-multienv.14](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.13...amplify-provider-awscloudformation@0.2.1-multienv.14) (2018-12-28)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.13"></a>

## [0.2.1-multienv.13](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.12...amplify-provider-awscloudformation@0.2.1-multienv.13) (2018-12-27)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.12"></a>

## [0.2.1-multienv.12](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.11...amplify-provider-awscloudformation@0.2.1-multienv.12) (2018-12-27)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.11"></a>

## [0.2.1-multienv.11](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.10...amplify-provider-awscloudformation@0.2.1-multienv.11) (2018-12-21)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.10"></a>

## [0.2.1-multienv.10](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.9...amplify-provider-awscloudformation@0.2.1-multienv.10) (2018-12-19)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.9"></a>

## [0.2.1-multienv.9](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.8...amplify-provider-awscloudformation@0.2.1-multienv.9) (2018-12-10)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.8"></a>

## [0.2.1-multienv.8](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.7...amplify-provider-awscloudformation@0.2.1-multienv.8) (2018-12-10)

### Bug Fixes

- **amplify-provider-awscloudformation:** fix: [#559](https://github.com/aws-amplify/amplify-cli/issues/559) ([#563](https://github.com/aws-amplify/amplify-cli/issues/563)) ([69d74be](https://github.com/aws-amplify/amplify-cli/commit/69d74be))

<a name="0.2.1-multienv.7"></a>

## [0.2.1-multienv.7](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.5...amplify-provider-awscloudformation@0.2.1-multienv.7) (2018-12-07)

### Bug Fixes

- **cli:** remove calls to gluegun's prompt.confirm ([#546](https://github.com/aws-amplify/amplify-cli/issues/546)) ([0080ddb](https://github.com/aws-amplify/amplify-cli/commit/0080ddb))

<a name="0.2.1-multienv.6"></a>

## [0.2.1-multienv.6](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.5...amplify-provider-awscloudformation@0.2.1-multienv.6) (2018-12-05)

### Bug Fixes

- **cli:** remove calls to gluegun's prompt.confirm ([#546](https://github.com/aws-amplify/amplify-cli/issues/546)) ([0080ddb](https://github.com/aws-amplify/amplify-cli/commit/0080ddb))

<a name="0.2.1-multienv.5"></a>

## [0.2.1-multienv.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.4...amplify-provider-awscloudformation@0.2.1-multienv.5) (2018-12-04)

### Bug Fixes

- **amplify-provider-awscloudformation:** trim profile name ([904f639](https://github.com/aws-amplify/amplify-cli/commit/904f639)), closes [#542](https://github.com/aws-amplify/amplify-cli/issues/542)

<a name="0.2.1-multienv.4"></a>

## [0.2.1-multienv.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.3...amplify-provider-awscloudformation@0.2.1-multienv.4) (2018-12-04)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.3"></a>

## [0.2.1-multienv.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.2...amplify-provider-awscloudformation@0.2.1-multienv.3) (2018-12-04)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.2"></a>

## [0.2.1-multienv.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.1...amplify-provider-awscloudformation@0.2.1-multienv.2) (2018-11-30)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.2.1-multienv.1"></a>

## [0.2.1-multienv.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.2.1-multienv.0...amplify-provider-awscloudformation@0.2.1-multienv.1) (2018-11-28)

### Features

- Multienv auth migrate ([#498](https://github.com/aws-amplify/amplify-cli/issues/498)) ([ef3e3b3](https://github.com/aws-amplify/amplify-cli/commit/ef3e3b3))

<a name="0.2.1-multienv.0"></a>

## [0.2.1-multienv.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.35-multienv.3...amplify-provider-awscloudformation@0.2.1-multienv.0) (2018-11-21)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.35-multienv.3"></a>

## [0.1.35-multienv.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.35-multienv.2...amplify-provider-awscloudformation@0.1.35-multienv.3) (2018-11-20)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.35-multienv.2"></a>

## [0.1.35-multienv.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.35-multienv.1...amplify-provider-awscloudformation@0.1.35-multienv.2) (2018-11-19)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.35-multienv.1"></a>

## [0.1.35-multienv.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.35-multienv.0...amplify-provider-awscloudformation@0.1.35-multienv.1) (2018-11-19)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.35-multienv.0"></a>

## [0.1.35-multienv.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.34...amplify-provider-awscloudformation@0.1.35-multienv.0) (2018-11-16)

### Bug Fixes

- fix projectPath references in ios and codegen packages & fix for correct AWS profile pickup in the cloudformation provider ([a73656e](https://github.com/aws-amplify/amplify-cli/commit/a73656e))

### Features

- added amplify env sync and amplify env checkout command & added help commands for env ([#430](https://github.com/aws-amplify/amplify-cli/issues/430)) ([de72729](https://github.com/aws-amplify/amplify-cli/commit/de72729))
- amplify env remove and ampify delete command for multi envs ([#458](https://github.com/aws-amplify/amplify-cli/issues/458)) ([ddca3bc](https://github.com/aws-amplify/amplify-cli/commit/ddca3bc))
- headless Init and configure ([#371](https://github.com/aws-amplify/amplify-cli/issues/371)) ([acd14a8](https://github.com/aws-amplify/amplify-cli/commit/acd14a8))
- multiple evironment support for analytics and s3 storage ([0400f26](https://github.com/aws-amplify/amplify-cli/commit/0400f26))

<a name="0.1.34"></a>

## [0.1.34](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.34-beta.0...amplify-provider-awscloudformation@0.1.34) (2018-11-13)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.34-beta.0"></a>

## [0.1.34-beta.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.33...amplify-provider-awscloudformation@0.1.34-beta.0) (2018-11-13)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.33"></a>

## [0.1.33](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.33-beta.0...amplify-provider-awscloudformation@0.1.33) (2018-11-09)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.33-beta.0"></a>

## [0.1.33-beta.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.12...amplify-provider-awscloudformation@0.1.33-beta.0) (2018-11-09)

### Bug Fixes

- **amplify-provider-awscloudformation:** Fixes lambda function src files changes detection ([b0f216f](https://github.com/aws-amplify/amplify-cli/commit/b0f216f))

<a name="0.1.32"></a>

## [0.1.32](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.32-beta.0...amplify-provider-awscloudformation@0.1.32) (2018-11-05)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.32-beta.0"></a>

## [0.1.32-beta.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.12...amplify-provider-awscloudformation@0.1.32-beta.0) (2018-11-05)

### Bug Fixes

- **amplify-provider-awscloudformation:** Fixes lambda function src files changes detection ([b0f216f](https://github.com/aws-amplify/amplify-cli/commit/b0f216f))

<a name="0.1.31"></a>

## [0.1.31](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.12...amplify-provider-awscloudformation@0.1.31) (2018-11-02)

### Bug Fixes

- **amplify-provider-awscloudformation:** Fixes lambda function src files changes detection ([b0f216f](https://github.com/aws-amplify/amplify-cli/commit/b0f216f))

<a name="0.1.30"></a>

## [0.1.30](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.30-beta.0...amplify-provider-awscloudformation@0.1.30) (2018-11-02)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.30-beta.0"></a>

## [0.1.30-beta.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.12...amplify-provider-awscloudformation@0.1.30-beta.0) (2018-11-02)

### Bug Fixes

- **amplify-provider-awscloudformation:** Fixes lambda function src files changes detection ([b0f216f](https://github.com/aws-amplify/amplify-cli/commit/b0f216f))

<a name="0.1.29"></a>

## [0.1.29](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.29-beta.0...amplify-provider-awscloudformation@0.1.29) (2018-10-23)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.29-beta.0"></a>

## [0.1.29-beta.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.12...amplify-provider-awscloudformation@0.1.29-beta.0) (2018-10-23)

### Bug Fixes

- **amplify-provider-awscloudformation:** Fixes lambda function src files changes detection ([b0f216f](https://github.com/aws-amplify/amplify-cli/commit/b0f216f))

<a name="0.1.28"></a>

## [0.1.28](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.28-beta.0...amplify-provider-awscloudformation@0.1.28) (2018-10-18)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.28-beta.0"></a>

## [0.1.28-beta.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.12...amplify-provider-awscloudformation@0.1.28-beta.0) (2018-10-12)

### Bug Fixes

- **amplify-provider-awscloudformation:** Fixes lambda function src files changes detection ([b0f216f](https://github.com/aws-amplify/amplify-cli/commit/b0f216f))

<a name="0.1.12"></a>

## [0.1.12](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.11...amplify-provider-awscloudformation@0.1.12) (2018-08-23)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.11"></a>

## [0.1.11](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.10...amplify-provider-awscloudformation@0.1.11) (2018-08-23)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.10"></a>

## [0.1.10](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.9...amplify-provider-awscloudformation@0.1.10) (2018-08-23)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.9"></a>

## [0.1.9](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.8...amplify-provider-awscloudformation@0.1.9) (2018-08-23)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.8"></a>

## [0.1.8](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.7...amplify-provider-awscloudformation@0.1.8) (2018-08-23)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.7"></a>

## [0.1.7](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.6...amplify-provider-awscloudformation@0.1.7) (2018-08-23)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.6"></a>

## [0.1.6](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.5...amplify-provider-awscloudformation@0.1.6) (2018-08-23)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.5"></a>

## [0.1.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-provider-awscloudformation@0.1.4...amplify-provider-awscloudformation@0.1.5) (2018-08-23)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.4"></a>

## 0.1.4 (2018-08-23)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.3"></a>

## 0.1.3 (2018-08-23)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.2"></a>

## 0.1.2 (2018-08-23)

**Note:** Version bump only for package amplify-provider-awscloudformation

<a name="0.1.1"></a>

## 0.1.1 (2018-08-23)

**Note:** Version bump only for package amplify-provider-awscloudformation
