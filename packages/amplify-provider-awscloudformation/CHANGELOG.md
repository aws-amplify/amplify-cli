# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
