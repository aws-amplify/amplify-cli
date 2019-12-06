# 4.5.0 (2019-12-04)

## 4.4.1-beta.0 (2019-12-03)

### Bug Fixes

- **amplify-app:** support app without profile ([#2922](https://github.com/aws-amplify/amplify-cli/issues/2922)) ([b41be93](https://github.com/aws-amplify/amplify-cli/commit/b41be93205e0f89dd033bfae0c52be09549792f2))
- **amplify-codegen-appsync-model-plugin:** add additional scalars ([#2919](https://github.com/aws-amplify/amplify-cli/issues/2919)) ([4521f67](https://github.com/aws-amplify/amplify-cli/commit/4521f675ce735df1b5ce824e4cec9001ea414781))
- add datastoreSync option to config files ([#2920](https://github.com/aws-amplify/amplify-cli/issues/2920)) ([db20336](https://github.com/aws-amplify/amplify-cli/commit/db20336a410dafc0597941b98447faf32094cbcd))
- **amplify-codegen-appsync-model-plugin:** make id field as first field ([474ff97](https://github.com/aws-amplify/amplify-cli/commit/474ff97371be7432eb4c96b3ef3b53ab45356c90))
- **amplify-provider-awscloudformation:** transformer loading ([#2924](https://github.com/aws-amplify/amplify-cli/issues/2924)) ([e1256d9](https://github.com/aws-amplify/amplify-cli/commit/e1256d9a508ac0cf843f7e2a4d53a62bf79c17a8))

# 4.4.0 (2019-12-03)

## 4.3.1-beta.2 (2019-12-03)

### Bug Fixes

- **amplify-codegen-appsync-model-plugin:** revert lazy load ([3323a31](https://github.com/aws-amplify/amplify-cli/commit/3323a31f936dbe3c870244e1dee31291fcfbf6a4))

## 4.3.1-beta.1 (2019-12-03)

### Bug Fixes

- add resources in xcode helper ([#2901](https://github.com/aws-amplify/amplify-cli/issues/2901)) ([9ec8e61](https://github.com/aws-amplify/amplify-cli/commit/9ec8e616c8485beb614ab8c0d703e429e6e52ada))
- **amplify-codegen-appsync-model-plugin:** update swift protocol ([#2911](https://github.com/aws-amplify/amplify-cli/issues/2911)) ([38c4196](https://github.com/aws-amplify/amplify-cli/commit/38c41962ceaa6bc47c6fd97897b583d94c4adbe4))
- **amplify-codegen-appsync-model-plugin:** use LazyCollection (JS/TS) ([#2905](https://github.com/aws-amplify/amplify-cli/issues/2905)) ([4fa3a53](https://github.com/aws-amplify/amplify-cli/commit/4fa3a5339f3183dfea461f4ca61016be9f55381c)), closes [#2](https://github.com/aws-amplify/amplify-cli/issues/2)
- **cli:** print correct message if no provider plugins are active ([#2886](https://github.com/aws-amplify/amplify-cli/issues/2886)) ([37405b1](https://github.com/aws-amplify/amplify-cli/commit/37405b1ecc4c3818570b541d17e132bebaca5553))

### Reverts

- revert 37405b1ecc4c3818570b541d17e132bebaca5553 (#2902) ([374937f](https://github.com/aws-amplify/amplify-cli/commit/374937fe071a531ca506da42d37037e5c1aca010)), closes [#2902](https://github.com/aws-amplify/amplify-cli/issues/2902) [#2886](https://github.com/aws-amplify/amplify-cli/issues/2886)

## 4.3.1-beta.0 (2019-12-01)

### Bug Fixes

- **amplify-codegen-appsync-model-plugin:** add toString in hashCode ([5b74dfa](https://github.com/aws-amplify/amplify-cli/commit/5b74dfa0b0badc9a6f4d8eb8f1bbdc03e3819ecc))
- **amplify-codegen-appsync-model-plugin:** remove swift loader extension ([d7b1995](https://github.com/aws-amplify/amplify-cli/commit/d7b199594533a5f0d9fb798c5d76bd0d46c3db03))

# 4.3.0 (2019-12-01)

## 4.2.1-beta.0 (2019-11-30)

### Bug Fixes

- **amplify-appsync-simulator:** add js-string-escape to package.json ([#2864](https://github.com/aws-amplify/amplify-cli/issues/2864)) ([2da430b](https://github.com/aws-amplify/amplify-cli/commit/2da430b5c827b0f9f4af4fe5611528f8839703bb))
- **amplify-codegen-appsync-model-plugin:** add Amplify extension to ios ([4a97971](https://github.com/aws-amplify/amplify-cli/commit/4a97971b7cae61891998ce29a2558e2c8c1a647f))
- **amplify-codegen-appsync-model-plugin:** builder to exclude connection ([6b78f3d](https://github.com/aws-amplify/amplify-cli/commit/6b78f3d91545ef8933759b2e0ea44dc45571383e))
- **amplify-codegen-appsync-model-plugin:** fix connection keyname issue ([e3e52b3](https://github.com/aws-amplify/amplify-cli/commit/e3e52b3cddfc30961a486b43ee7e14f4b02c2e36))
- **amplify-codegen-appsync-model-plugin:** remove non connected models ([6422a63](https://github.com/aws-amplify/amplify-cli/commit/6422a634e54cb01d1cc9540992a913c694950972))
- **amplify-codegen-appsync-model-plugin:** remove targetName from model ([#2871](https://github.com/aws-amplify/amplify-cli/issues/2871)) ([f2ab7a3](https://github.com/aws-amplify/amplify-cli/commit/f2ab7a31fcab868bdc7038aa0b7285eb8f6b91c1))
- graphql e2e test deployment ([#2887](https://github.com/aws-amplify/amplify-cli/issues/2887)) ([7ba515a](https://github.com/aws-amplify/amplify-cli/commit/7ba515acb40009f783d899f23b9fe89392afcbdb))
- remaining e2e tests ([#2889](https://github.com/aws-amplify/amplify-cli/issues/2889)) ([b518061](https://github.com/aws-amplify/amplify-cli/commit/b518061154261b21faeee842579f355d175981ba))
- **amplify-codegen-appsync-model-plugin:** update QueryField name (java) ([#2884](https://github.com/aws-amplify/amplify-cli/issues/2884)) ([fb480fd](https://github.com/aws-amplify/amplify-cli/commit/fb480fd07fae9b2c10e09ba30038b254e7524c89))
- **amplify-provider-awscloudformation:** fix multi env creation bug ([#2872](https://github.com/aws-amplify/amplify-cli/issues/2872)) ([007a8d1](https://github.com/aws-amplify/amplify-cli/commit/007a8d12da802c822b20a4351cb074b49f01bd23)), closes [#2868](https://github.com/aws-amplify/amplify-cli/issues/2868)
- use managedpolicies and slice them ([#2883](https://github.com/aws-amplify/amplify-cli/issues/2883)) ([fa0f2ed](https://github.com/aws-amplify/amplify-cli/commit/fa0f2ed2fc725d964cbaf11a892b3850aaf42d84)), closes [#2084](https://github.com/aws-amplify/amplify-cli/issues/2084)

# 4.2.0 (2019-11-27)

## 4.1.2-beta.0 (2019-11-27)

### Bug Fixes

- **amplify-codegen-appsync-model-plugin:** add missing packages ([aaab38e](https://github.com/aws-amplify/amplify-cli/commit/aaab38e4456c15a00c61e0e00dc940ee7d7aea01))

## 4.1.1 (2019-11-26)

# 4.1.0 (2019-11-26)

### Bug Fixes

- **amplify-appsync-simulator:** add support for AppSync template version ([#2329](https://github.com/aws-amplify/amplify-cli/issues/2329)) ([88cd220](https://github.com/aws-amplify/amplify-cli/commit/88cd220cbb254a018b888ee587c9c35994010377)), closes [#2134](https://github.com/aws-amplify/amplify-cli/issues/2134) [#2211](https://github.com/aws-amplify/amplify-cli/issues/2211) [#2299](https://github.com/aws-amplify/amplify-cli/issues/2299)
- **amplify-appsync-simulator:** allow null returns in response template ([#2267](https://github.com/aws-amplify/amplify-cli/issues/2267)) ([7056250](https://github.com/aws-amplify/amplify-cli/commit/70562506d5aac737a92a8856b14a799f55f47490)), closes [#2248](https://github.com/aws-amplify/amplify-cli/issues/2248)
- **amplify-appsync-simulator:** fix none data source handler ([#2356](https://github.com/aws-amplify/amplify-cli/issues/2356)) ([157ecb1](https://github.com/aws-amplify/amplify-cli/commit/157ecb1222abc7becd71e96463b48b1637ec28e2))
- **amplify-appsync-simulator:** handle jwt decode error gracefully ([#2500](https://github.com/aws-amplify/amplify-cli/issues/2500)) ([9c931ed](https://github.com/aws-amplify/amplify-cli/commit/9c931ed7b5304f475f17db291526a16dcb305699)), closes [#2473](https://github.com/aws-amplify/amplify-cli/issues/2473)
- **amplify-appsync-simulator:** impl missing methods in velocity utils ([9970053](https://github.com/aws-amplify/amplify-cli/commit/99700532fc89ed79a9302fd3d719ff9eda17909d)), closes [#2300](https://github.com/aws-amplify/amplify-cli/issues/2300)
- **amplify-category-analytics:** Allow hyphens for pinpoint resources name ([#2516](https://github.com/aws-amplify/amplify-cli/issues/2516)) ([ecd87ee](https://github.com/aws-amplify/amplify-cli/commit/ecd87ee5b47b5d3e458feaa87b0949f5661a8901)), closes [#1877](https://github.com/aws-amplify/amplify-cli/issues/1877)
- **amplify-category-api:** Fix [#2498](https://github.com/aws-amplify/amplify-cli/issues/2498) ([#2503](https://github.com/aws-amplify/amplify-cli/issues/2503)) ([35aab06](https://github.com/aws-amplify/amplify-cli/commit/35aab06c1ac9d3081f4f2e06ae18c14ef212aa43))
- **amplify-category-api:** fix api add-graphql-datasource command ([#2320](https://github.com/aws-amplify/amplify-cli/issues/2320)) ([a9c829d](https://github.com/aws-amplify/amplify-cli/commit/a9c829d79e91246d2bb9a707ccfe886502ceebe2))
- **amplify-category-api:** safeguard prompt with empty options ([#2430](https://github.com/aws-amplify/amplify-cli/issues/2430)) ([cb8f6dd](https://github.com/aws-amplify/amplify-cli/commit/cb8f6dddefb7f7e7f8159988563fc076f470ee79)), closes [#2423](https://github.com/aws-amplify/amplify-cli/issues/2423)
- **amplify-category-api:** use standard json read ([#2581](https://github.com/aws-amplify/amplify-cli/issues/2581)) ([3adc395](https://github.com/aws-amplify/amplify-cli/commit/3adc395a5e4ccf3673735f8091db63923a46c501))
- **amplify-category-auth:** adds trigger flag to lambda response ([#2548](https://github.com/aws-amplify/amplify-cli/issues/2548)) ([270b4ac](https://github.com/aws-amplify/amplify-cli/commit/270b4ac8464ac1800235beceed158f58a9538488))
- **amplify-category-auth:** checks for google idp federation on native ([#2541](https://github.com/aws-amplify/amplify-cli/issues/2541)) ([e1de9ac](https://github.com/aws-amplify/amplify-cli/commit/e1de9acac96dc0f7f7630fe8e75a0c0b89d15986)), closes [#2284](https://github.com/aws-amplify/amplify-cli/issues/2284) [#2284](https://github.com/aws-amplify/amplify-cli/issues/2284)
- **amplify-category-auth:** removes deprecated props for external auth ([#2587](https://github.com/aws-amplify/amplify-cli/issues/2587)) ([08c0c70](https://github.com/aws-amplify/amplify-cli/commit/08c0c706bce7fd5996ce7c782512f694c1ff0455)), closes [#2309](https://github.com/aws-amplify/amplify-cli/issues/2309)
- **amplify-category-hosting:** fix hosting bug ([#2556](https://github.com/aws-amplify/amplify-cli/issues/2556)) ([75784fb](https://github.com/aws-amplify/amplify-cli/commit/75784fb27da321b5e1d1b1f11935425f602a3c4a))
- **amplify-category-notifications:** fix notifications env change issue ([#2669](https://github.com/aws-amplify/amplify-cli/issues/2669)) ([54d4d64](https://github.com/aws-amplify/amplify-cli/commit/54d4d64e03dc246e42ba3e2d19b1789d2dbeaddc)), closes [#2616](https://github.com/aws-amplify/amplify-cli/issues/2616)
- **amplify-category-storage:** use name for gsi index ([#2265](https://github.com/aws-amplify/amplify-cli/issues/2265)) ([89c9036](https://github.com/aws-amplify/amplify-cli/commit/89c9036cb697cd6015ad16381236af9942508b34))
- **amplify-category-storage:** validate max length of bucket name ([ace68a9](https://github.com/aws-amplify/amplify-cli/commit/ace68a9a41adf29e924a5eee2f7970d041c24feb))
- **amplify-codegen:** add framework only if javascript ([5709742](https://github.com/aws-amplify/amplify-cli/commit/5709742f33a20916c93869243f2bc699d40ddcce))
- **amplify-codegen:** add framework only if javascript ([#2342](https://github.com/aws-amplify/amplify-cli/issues/2342)) ([57c29c4](https://github.com/aws-amplify/amplify-cli/commit/57c29c450082c35dc6925be3d005422a2f5732bf))
- **amplify-codegen:** fix headless push with codegen ([#2743](https://github.com/aws-amplify/amplify-cli/issues/2743)) ([da248a4](https://github.com/aws-amplify/amplify-cli/commit/da248a456d96ed37533f964c066651ae22459166))
- **amplify-codegen:** support headless push for newly added api ([#2442](https://github.com/aws-amplify/amplify-cli/issues/2442)) ([84c08e7](https://github.com/aws-amplify/amplify-cli/commit/84c08e79623fdb68ba8d0f24acf33f342fc83bb5)), closes [#2365](https://github.com/aws-amplify/amplify-cli/issues/2365)
- **amplify-codegen:** support multi os team workflow in codegen ([#2212](https://github.com/aws-amplify/amplify-cli/issues/2212)) ([e4a0454](https://github.com/aws-amplify/amplify-cli/commit/e4a045468d761c9333a799d3b3dae6c6399dc179)), closes [#2147](https://github.com/aws-amplify/amplify-cli/issues/2147) [#2002](https://github.com/aws-amplify/amplify-cli/issues/2002)
- **amplify-codegen:** support nonarray includes/excludes in codegen conf ([#2271](https://github.com/aws-amplify/amplify-cli/issues/2271)) ([30904a0](https://github.com/aws-amplify/amplify-cli/commit/30904a0ac01b2ae6064d57109c998c9243b36d68)), closes [#2262](https://github.com/aws-amplify/amplify-cli/issues/2262)
- **amplify-codegen-appsync-model-plugin:** fix android models ([#2800](https://github.com/aws-amplify/amplify-cli/issues/2800)) ([cc96a05](https://github.com/aws-amplify/amplify-cli/commit/cc96a0557a385d89af9235148c56455f715a8731))
- **amplify-codegen-appsync-model-plugin:** include enums in JS exports ([#2805](https://github.com/aws-amplify/amplify-cli/issues/2805)) ([cac07aa](https://github.com/aws-amplify/amplify-cli/commit/cac07aa2b36a65b4f86bffb82ccfacf270ee7d49))
- **amplify-provider-awscloudformation:** amplify delete delete the stack ([#2470](https://github.com/aws-amplify/amplify-cli/issues/2470)) ([46bcab2](https://github.com/aws-amplify/amplify-cli/commit/46bcab20e2a9cebb6b68f2b3298f88cf9dd49e47))
- **amplify-provider-awscloudformation:** build api project w/ params ([#2003](https://github.com/aws-amplify/amplify-cli/issues/2003)) ([3692901](https://github.com/aws-amplify/amplify-cli/commit/3692901b3f82daf79475ec5b1c5cd90781917446)), closes [#1960](https://github.com/aws-amplify/amplify-cli/issues/1960)
- **amplify-provider-awscloudformation:** fix amplify configure ([#2344](https://github.com/aws-amplify/amplify-cli/issues/2344)) ([0fa9b2a](https://github.com/aws-amplify/amplify-cli/commit/0fa9b2a25b83928e6c1eb860805ade941f0111c4))
- **amplify-util-mock:** add support for custom resolver template name ([#2355](https://github.com/aws-amplify/amplify-cli/issues/2355)) ([c9829e2](https://github.com/aws-amplify/amplify-cli/commit/c9829e22aed7082798605f23aeff978ac1fa85f6)), closes [#2306](https://github.com/aws-amplify/amplify-cli/issues/2306)
- **amplify-util-mock:** safe access to LambdaConfiguration ([#2294](https://github.com/aws-amplify/amplify-cli/issues/2294)) ([0624739](https://github.com/aws-amplify/amplify-cli/commit/0624739fd3e44a14ae20122a2c29c77169b6bc0a))
- **amplify-util-mock:** use lambda fn name instead of resource name ([#2357](https://github.com/aws-amplify/amplify-cli/issues/2357)) ([4858921](https://github.com/aws-amplify/amplify-cli/commit/48589212b329e81122aab5adfb7589dd479934b7)), closes [#2280](https://github.com/aws-amplify/amplify-cli/issues/2280)
- **cli:** add cli core aliases, and two minor fixes ([#2394](https://github.com/aws-amplify/amplify-cli/issues/2394)) ([69c7ab3](https://github.com/aws-amplify/amplify-cli/commit/69c7ab36f5a78e875ca117cbbadfb80f44b288c8))
- **cli:** add console command in the help message ([#2494](https://github.com/aws-amplify/amplify-cli/issues/2494)) ([cf0eddd](https://github.com/aws-amplify/amplify-cli/commit/cf0eddd1ba27b1126b0745cc068f205b2c2c8343)), closes [#1607](https://github.com/aws-amplify/amplify-cli/issues/1607)
- **cli:** add context.print.fancy ([#2352](https://github.com/aws-amplify/amplify-cli/issues/2352)) ([099ca0d](https://github.com/aws-amplify/amplify-cli/commit/099ca0d7eabe58a75845e8f96caa6c4888be2915)), closes [#2351](https://github.com/aws-amplify/amplify-cli/issues/2351)
- **cli:** fix appsync api native config file for legacy metadata ([#2842](https://github.com/aws-amplify/amplify-cli/issues/2842)) ([a8e55b7](https://github.com/aws-amplify/amplify-cli/commit/a8e55b727fca53e9006f45da772a56e7953fc6db))
- **cli:** fix new plugin platform codegen related issue ([#2266](https://github.com/aws-amplify/amplify-cli/issues/2266)) ([c557182](https://github.com/aws-amplify/amplify-cli/commit/c557182b2d423bb1c2f8832ecd49076c806b05bb))
- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- **graphql-auth-transformer:** add support for ownerfield ([eaa3451](https://github.com/aws-amplify/amplify-cli/commit/eaa345158e83c0c169bd2c290601f0f3481dba04)), closes [#2361](https://github.com/aws-amplify/amplify-cli/issues/2361)
- **graphql-auth-transformer:** added helper function for static auth var ([24c8f6d](https://github.com/aws-amplify/amplify-cli/commit/24c8f6d37508fd98a55cd2f892e5d17414c5e9fe))
- **graphql-auth-transformer:** added staticgroupVar function ([#2433](https://github.com/aws-amplify/amplify-cli/issues/2433)) ([e168d1c](https://github.com/aws-amplify/amplify-cli/commit/e168d1cd1899bb9990ffca88d0a01b83b8e3f19f))
- **graphql-auth-transformer:** fixed per field delete logic ([#2333](https://github.com/aws-amplify/amplify-cli/issues/2333)) ([00db7c8](https://github.com/aws-amplify/amplify-cli/commit/00db7c89114263ca9b88d0b978a12a05e43ab9a1))
- **graphql-auth-transformer:** include ApiKeyConfig in additional providers ([#2744](https://github.com/aws-amplify/amplify-cli/issues/2744)) ([d1dc7ac](https://github.com/aws-amplify/amplify-cli/commit/d1dc7acbbf27a567df6c250ae4428943ca2f66d0)), closes [#2741](https://github.com/aws-amplify/amplify-cli/issues/2741)
- **graphql-auth-transformer:** remove enforce model check for field ([#2607](https://github.com/aws-amplify/amplify-cli/issues/2607)) ([b1d6d4b](https://github.com/aws-amplify/amplify-cli/commit/b1d6d4b1c933e552874b3bb016f611567df186d0)), closes [#2591](https://github.com/aws-amplify/amplify-cli/issues/2591) [#2591](https://github.com/aws-amplify/amplify-cli/issues/2591)
- **graphql-auth-transformer:** removed subs auth check for field ([9584254](https://github.com/aws-amplify/amplify-cli/commit/95842542d2c2cf6178f660faf3f20009fd848c60))
- **graphql-auth-transformer:** verify multiple static group auth rules ([289d575](https://github.com/aws-amplify/amplify-cli/commit/289d5758439e89c52a45c529c1e58b1f361ca83b)), closes [#2241](https://github.com/aws-amplify/amplify-cli/issues/2241)
- **graphql-dynamodb-transformer:** allow id for non model objects ([#2530](https://github.com/aws-amplify/amplify-cli/issues/2530)) ([0d3c849](https://github.com/aws-amplify/amplify-cli/commit/0d3c849002917016cbffcba7ac22de9538f83acc)), closes [#1984](https://github.com/aws-amplify/amplify-cli/issues/1984) [#1984](https://github.com/aws-amplify/amplify-cli/issues/1984)
- **graphql-dynamodb-transformer:** fix cloudformation error config ([#2772](https://github.com/aws-amplify/amplify-cli/issues/2772)) ([10ca188](https://github.com/aws-amplify/amplify-cli/commit/10ca188703c71262a90b687ab758323bd2ef7f88))
- **graphql-key-transformer:** fix merge errors ([#2762](https://github.com/aws-amplify/amplify-cli/issues/2762)) ([edf4c76](https://github.com/aws-amplify/amplify-cli/commit/edf4c76aae130f300f520787168db7cd2782c324))
- **graphql-key-transformer:** update deleteInput logic to hadle ID ([2856c9e](https://github.com/aws-amplify/amplify-cli/commit/2856c9e72be1e9ac8d5be33a44dc26e893f29ee0))
- **graphql-mapping-template:** handle missing arguments gracefully ([4950993](https://github.com/aws-amplify/amplify-cli/commit/4950993eb7a3b11bbecef5e82e1859e1f27d1453))
- **graphql-relational-schema-transformer:** fix input type casing ([#2249](https://github.com/aws-amplify/amplify-cli/issues/2249)) ([3a00d56](https://github.com/aws-amplify/amplify-cli/commit/3a00d56320f8c6a7de415e12ac9c6c4b5954d934)), closes [#2217](https://github.com/aws-amplify/amplify-cli/issues/2217)
- **graphql-relational-schema-transformer:** fix template for string keys ([#2205](https://github.com/aws-amplify/amplify-cli/issues/2205)) ([294fbc6](https://github.com/aws-amplify/amplify-cli/commit/294fbc67c7d8d806c4fe8100eb27b04571a4c811)), closes [#2133](https://github.com/aws-amplify/amplify-cli/issues/2133)
- [#2239](https://github.com/aws-amplify/amplify-cli/issues/2239) missing proper casing of input type argument ([#2246](https://github.com/aws-amplify/amplify-cli/issues/2246)) ([9d197f1](https://github.com/aws-amplify/amplify-cli/commit/9d197f1f67728935ddfb5c02c5fe53368b010b63))
- [#2260](https://github.com/aws-amplify/amplify-cli/issues/2260) - check for auth config on legacy projects ([#2261](https://github.com/aws-amplify/amplify-cli/issues/2261)) ([ba79d2a](https://github.com/aws-amplify/amplify-cli/commit/ba79d2a6c534cb1bcd4686991c80aa88ae4fbc8f))
- [#2272](https://github.com/aws-amplify/amplify-cli/issues/2272), [#2273](https://github.com/aws-amplify/amplify-cli/issues/2273) - create correct policies when IAM is the default auth ([#2276](https://github.com/aws-amplify/amplify-cli/issues/2276)) ([5ae0686](https://github.com/aws-amplify/amplify-cli/commit/5ae06868eb48f9cd8e5474af900bb5528d9740c4))
- [#2296](https://github.com/aws-amplify/amplify-cli/issues/2296) [#2304](https://github.com/aws-amplify/amplify-cli/issues/2304) [#2100](https://github.com/aws-amplify/amplify-cli/issues/2100) ([#2439](https://github.com/aws-amplify/amplify-cli/issues/2439)) ([82762d6](https://github.com/aws-amplify/amplify-cli/commit/82762d6187eb2102ebd134b181622188c5632d1d))
- [#2335](https://github.com/aws-amplify/amplify-cli/issues/2335) - change the transformer.conf.json version flag check logic ([b09cd37](https://github.com/aws-amplify/amplify-cli/commit/b09cd37a931c770a15b4397dd3d6631d468170a6))
- [#2347](https://github.com/aws-amplify/amplify-cli/issues/2347) - enum validation for key directive ([#2363](https://github.com/aws-amplify/amplify-cli/issues/2363)) ([1facade](https://github.com/aws-amplify/amplify-cli/commit/1facaded3095eaff5a015e76ca4d718b7bc3c938))
- [#2360](https://github.com/aws-amplify/amplify-cli/issues/2360) - meta json was written as object ([#2381](https://github.com/aws-amplify/amplify-cli/issues/2381)) ([7dd3c37](https://github.com/aws-amplify/amplify-cli/commit/7dd3c370552af31d63a4c2352c7b7453d6ab1fc0))
- [#2389](https://github.com/aws-amplify/amplify-cli/issues/2389) ([#2538](https://github.com/aws-amplify/amplify-cli/issues/2538)) ([fb92a9d](https://github.com/aws-amplify/amplify-cli/commit/fb92a9d7c6a1f807e49b7f899531de90cc1f4ee3))
- [#2727](https://github.com/aws-amplify/amplify-cli/issues/2727) ([#2754](https://github.com/aws-amplify/amplify-cli/issues/2754)) ([44a7b54](https://github.com/aws-amplify/amplify-cli/commit/44a7b549f84ff8d752fd0dc87d6d689a609a579d))
- add layer based on region ([#2399](https://github.com/aws-amplify/amplify-cli/issues/2399)) ([c6490c5](https://github.com/aws-amplify/amplify-cli/commit/c6490c537299e74c569a80fc06d1999cc92ae774)), closes [#2386](https://github.com/aws-amplify/amplify-cli/issues/2386)
- amplify e2e test deps,lint,cleanup,standardize ([#2850](https://github.com/aws-amplify/amplify-cli/issues/2850)) ([cf888f3](https://github.com/aws-amplify/amplify-cli/commit/cf888f3da1acde6be4d2bfcb40f15587005c62f9))
- api key creation/deletion logic ([#2678](https://github.com/aws-amplify/amplify-cli/issues/2678)) ([e1d111d](https://github.com/aws-amplify/amplify-cli/commit/e1d111d87cbe71f9c7a41a61e243f6d907905878))
- build break after recent merges ([#2758](https://github.com/aws-amplify/amplify-cli/issues/2758)) ([7155787](https://github.com/aws-amplify/amplify-cli/commit/7155787d74306e9708fe7115648ab6f702dc2093))
- build break, chore: typescript, lerna update ([#2640](https://github.com/aws-amplify/amplify-cli/issues/2640)) ([29fae36](https://github.com/aws-amplify/amplify-cli/commit/29fae366f4cab054feefa58c7dc733002d19570c))
- change default length for api key back to 7 days ([#2507](https://github.com/aws-amplify/amplify-cli/issues/2507)) ([6a7e61f](https://github.com/aws-amplify/amplify-cli/commit/6a7e61fc7315f5e732ad7b36b5c0ae88ea36b628))
- conn v2 e2e test update to multi-auth ([#2264](https://github.com/aws-amplify/amplify-cli/issues/2264)) ([ac3fd09](https://github.com/aws-amplify/amplify-cli/commit/ac3fd09ae29398c525c46b560a03ea85187b70b4))
- directive generation for groups auth ([#2305](https://github.com/aws-amplify/amplify-cli/issues/2305)) ([1ce074e](https://github.com/aws-amplify/amplify-cli/commit/1ce074e2ee3097ebb8e66c3603d3617cbf36f0d4))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- e2e tests, lint error ([#2846](https://github.com/aws-amplify/amplify-cli/issues/2846)) ([b581294](https://github.com/aws-amplify/amplify-cli/commit/b5812945f90d8a423698bbe7d5378a65452a27d3))
- ensure that transformer instances are not reused ([#2318](https://github.com/aws-amplify/amplify-cli/issues/2318)) ([24318ac](https://github.com/aws-amplify/amplify-cli/commit/24318ac65ed89e0845c9d36df365f4163d9298a6))
- export Typescript definitions and fix resulting type errors ([#2452](https://github.com/aws-amplify/amplify-cli/issues/2452)) ([7de3845](https://github.com/aws-amplify/amplify-cli/commit/7de384594d3b9cbf22cdaa85107fc8df26c141ec)), closes [#2451](https://github.com/aws-amplify/amplify-cli/issues/2451)
- fix load config withoutinit ([389e739](https://github.com/aws-amplify/amplify-cli/commit/389e73916946d16b46805ebd00f0672064539966))
- fix the amplify env checkout command ([#2339](https://github.com/aws-amplify/amplify-cli/issues/2339)) ([a96b42a](https://github.com/aws-amplify/amplify-cli/commit/a96b42a5e6d92e44018dc87cc4dbf51ff2107c09))
- fixed bug with per field auth on create ([#2327](https://github.com/aws-amplify/amplify-cli/issues/2327)) ([3206e45](https://github.com/aws-amplify/amplify-cli/commit/3206e45f401c7407acee0a248341930ede6a3dfb)), closes [#2316](https://github.com/aws-amplify/amplify-cli/issues/2316)
- fixed typo on serviceWorker for graphiql explorer package 🐜 ([fabae78](https://github.com/aws-amplify/amplify-cli/commit/fabae78b0188162271b3203222ae5a1754677df2))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))
- fixing no-gql-override param usage in amplify push command ([#2336](https://github.com/aws-amplify/amplify-cli/issues/2336)) ([198fac4](https://github.com/aws-amplify/amplify-cli/commit/198fac4507000dcaf623981867140b92f3e3c5c5))
- generate iam policies for auth role for public rules as well ([#2258](https://github.com/aws-amplify/amplify-cli/issues/2258)) ([6bbfce3](https://github.com/aws-amplify/amplify-cli/commit/6bbfce3addeb0228088a8094f680d4e82823a305))
- give ddb trigger different policy name from lambda execution ([#2801](https://github.com/aws-amplify/amplify-cli/issues/2801)) ([b97a7db](https://github.com/aws-amplify/amplify-cli/commit/b97a7db7e856d9bd6a5568b8b7a4ea7ef27c57f9))
- handle missing authConfig gracefully ([#2518](https://github.com/aws-amplify/amplify-cli/issues/2518)) ([06744f6](https://github.com/aws-amplify/amplify-cli/commit/06744f6c3abf0279a507caa9cf75d1ba9a85a479)), closes [#2480](https://github.com/aws-amplify/amplify-cli/issues/2480)
- include api build directory in cloud zip ([#2819](https://github.com/aws-amplify/amplify-cli/issues/2819)) ([f26fea4](https://github.com/aws-amplify/amplify-cli/commit/f26fea4138ec20847ae9e577f9315aa865d9679a))
- mitigate push failuer when graphql api backend is missing ([#2559](https://github.com/aws-amplify/amplify-cli/issues/2559)) ([acfdc83](https://github.com/aws-amplify/amplify-cli/commit/acfdc838db0f514c737aa3a726790716fa089c14))
- multiauth-e2e typo ([#2317](https://github.com/aws-amplify/amplify-cli/issues/2317)) ([5d019a6](https://github.com/aws-amplify/amplify-cli/commit/5d019a698039d13ca4a6a83ea95468f5b0658a7c))
- **graphql-transformer-core:** fix migration errors ([#2245](https://github.com/aws-amplify/amplify-cli/issues/2245)) ([fd811bb](https://github.com/aws-amplify/amplify-cli/commit/fd811bbe2e08f2ade7627c8cce44c9f1dce2d9ba)), closes [#2196](https://github.com/aws-amplify/amplify-cli/issues/2196)
- quickstart change and profile selection ([#2806](https://github.com/aws-amplify/amplify-cli/issues/2806)) ([d28a897](https://github.com/aws-amplify/amplify-cli/commit/d28a8975cdd79b853465200fb7138373a79587b6))
- randomize role-names and bucket-name for auth and storage category ([#2709](https://github.com/aws-amplify/amplify-cli/issues/2709)) ([fe0e979](https://github.com/aws-amplify/amplify-cli/commit/fe0e979812bd3142a56a62bf15444cbb3dbbb6bb))
- the KeyTransformer class name was incorrect ([#2346](https://github.com/aws-amplify/amplify-cli/issues/2346)) ([b54ef02](https://github.com/aws-amplify/amplify-cli/commit/b54ef02b18976b8457612225aa5e67cc2a805636))
- update transformer conf version to 5 ([#2812](https://github.com/aws-amplify/amplify-cli/issues/2812)) ([c8dd1c9](https://github.com/aws-amplify/amplify-cli/commit/c8dd1c968ebcda9bc1f96b4ed8af3304c5b94c22))
- **graphql-transformer-core:** try/catch on load config ([#2354](https://github.com/aws-amplify/amplify-cli/issues/2354)) ([8ed16a5](https://github.com/aws-amplify/amplify-cli/commit/8ed16a50dc953ebbc28d197d7e69904b18cf2452)), closes [pr#2348](https://github.com/pr/issues/2348)
- **graphql-transformers-e2e-tests:** added amplify next ([#2839](https://github.com/aws-amplify/amplify-cli/issues/2839)) ([800d5a2](https://github.com/aws-amplify/amplify-cli/commit/800d5a2f46b02bbd7d6b6dcf76d5cbb825fcdb46))
- **mock:** [#2606](https://github.com/aws-amplify/amplify-cli/issues/2606) - mocking does not start when there are LSIs in DynamoDB table ([#2667](https://github.com/aws-amplify/amplify-cli/issues/2667)) ([914470e](https://github.com/aws-amplify/amplify-cli/commit/914470e304391fbff756138d381754021aec6528))

### Features

- **amplify-category-auth:** allow more than one groupClaim ([f4397e0](https://github.com/aws-amplify/amplify-cli/commit/f4397e089513e16db5f363458c3c61b351acb5b9))
- User Pool Groups, Admin Auth Support, Custom Group Role Policies ([#2443](https://github.com/aws-amplify/amplify-cli/issues/2443)) ([09aecfd](https://github.com/aws-amplify/amplify-cli/commit/09aecfd0cb3dae2c17d1c512946cc733c4fe3d4c))
- **amplify-codegen-appsync-model-plugin:** add fromId method ([#2843](https://github.com/aws-amplify/amplify-cli/issues/2843)) ([2f422da](https://github.com/aws-amplify/amplify-cli/commit/2f422da89c28aaafec60e8464505d490665a2db7))
- **amplify-codegen-appsync-model-plugin:** modelgen connection support ([#2836](https://github.com/aws-amplify/amplify-cli/issues/2836)) ([353749c](https://github.com/aws-amplify/amplify-cli/commit/353749ce6643a07206a1f4c30d00beb775db169e))
- **amplify-codegen-appsync-model-plugin:** update java model generator ([#2785](https://github.com/aws-amplify/amplify-cli/issues/2785)) ([c66148c](https://github.com/aws-amplify/amplify-cli/commit/c66148cdd126b316f8d1cbe6d40e0d8bf8226ed9))
- **amplify-graphql-types-generator:** show error msg for missing query ([#2274](https://github.com/aws-amplify/amplify-cli/issues/2274)) ([d8a2722](https://github.com/aws-amplify/amplify-cli/commit/d8a2722e82908ed3b077d9f563300c90a8d0a5da)), closes [#2228](https://github.com/aws-amplify/amplify-cli/issues/2228) [#1434](https://github.com/aws-amplify/amplify-cli/issues/1434)
- **cli:** add amplifyconfiguration.json for native apps ([#2787](https://github.com/aws-amplify/amplify-cli/issues/2787)) ([0393535](https://github.com/aws-amplify/amplify-cli/commit/03935353596582bfac620ef7a0e68cf01ad376ee))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- add amplify prefix to every cfn stack provisioned via the CLI ([#2225](https://github.com/aws-amplify/amplify-cli/issues/2225)) ([4cbeeaa](https://github.com/aws-amplify/amplify-cli/commit/4cbeeaa6b99a1c0d1921301308c31df502491191))
- **cli:** new plugin platform ([#2254](https://github.com/aws-amplify/amplify-cli/issues/2254)) ([7ec29dd](https://github.com/aws-amplify/amplify-cli/commit/7ec29dd4f2da8c90727b36469eca646d289877b6))
- **cli:** support for samples with --app params in init command ([#2358](https://github.com/aws-amplify/amplify-cli/issues/2358)) ([7ba1a9d](https://github.com/aws-amplify/amplify-cli/commit/7ba1a9dc510caeafda74ce2ce04942fa157ea234))
- **cli:** update publish command to use the updated push command ([#2826](https://github.com/aws-amplify/amplify-cli/issues/2826)) ([9fead0e](https://github.com/aws-amplify/amplify-cli/commit/9fead0e8b981a4d32b46bcf0c90cff88d16c5e70))
- **graphql-connection-transformer:** limit ([#1953](https://github.com/aws-amplify/amplify-cli/issues/1953)) ([dcaf844](https://github.com/aws-amplify/amplify-cli/commit/dcaf84480974e7a697d1ea29782a4f5032a77942))
- **graphql-elasticsearch-transformer:** add total in es response ([#2602](https://github.com/aws-amplify/amplify-cli/issues/2602)) ([dbdb000](https://github.com/aws-amplify/amplify-cli/commit/dbdb0002b8e7cd33e37880d3166bc99c5faf1234)), closes [#2600](https://github.com/aws-amplify/amplify-cli/issues/2600)
- add amplify-app command ([#2761](https://github.com/aws-amplify/amplify-cli/issues/2761)) ([c46cdd4](https://github.com/aws-amplify/amplify-cli/commit/c46cdd421bce40d7995b3e75f0ea7f4f646d2308))
- add editorconfig to project ([c90bf48](https://github.com/aws-amplify/amplify-cli/commit/c90bf4802d62ec141ace01614235d32aed63938d))
- add the length support for strings in mock ([#2823](https://github.com/aws-amplify/amplify-cli/issues/2823)) ([c366246](https://github.com/aws-amplify/amplify-cli/commit/c3662463b97d387968cd2ad60c94e3e27b97ea7c))
- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- Merge GSI from a previous add when updating a storage ([#2571](https://github.com/aws-amplify/amplify-cli/issues/2571)) ([c8ae475](https://github.com/aws-amplify/amplify-cli/commit/c8ae475e25e5ad27aab602a05c29c9ca9cef8a4b))
- move away from mosca to forked mqtt server ([#2428](https://github.com/aws-amplify/amplify-cli/issues/2428)) ([6eb59d6](https://github.com/aws-amplify/amplify-cli/commit/6eb59d6a0fa616a65ad0489405cc89dfbec0f5a1))
- resolver changes ([#2760](https://github.com/aws-amplify/amplify-cli/issues/2760)) ([8ce0d12](https://github.com/aws-amplify/amplify-cli/commit/8ce0d12eb1d3bd6d0132baca39b6e9daff04c39a))
- updated version of [#2118](https://github.com/aws-amplify/amplify-cli/issues/2118) with addressed review comments ([#2230](https://github.com/aws-amplify/amplify-cli/issues/2230)) ([be3c499](https://github.com/aws-amplify/amplify-cli/commit/be3c499edcc6bec63b38e9241c5af7b83c930022))

# 4.0.0-beta.0 (2019-09-11)

# 4.0.0 (2019-11-25)

### Bug Fixes

- **amplify-appsync-simulator:** handle jwt decode error gracefully ([#2500](https://github.com/aws-amplify/amplify-cli/issues/2500)) ([9c931ed](https://github.com/aws-amplify/amplify-cli/commit/9c931ed7b5304f475f17db291526a16dcb305699)), closes [#2473](https://github.com/aws-amplify/amplify-cli/issues/2473)
- **amplify-appsync-simulator:** impl missing methods in velocity utils ([9970053](https://github.com/aws-amplify/amplify-cli/commit/99700532fc89ed79a9302fd3d719ff9eda17909d)), closes [#2300](https://github.com/aws-amplify/amplify-cli/issues/2300)
- **amplify-category-analytics:** Allow hyphens for pinpoint resources name ([#2516](https://github.com/aws-amplify/amplify-cli/issues/2516)) ([ecd87ee](https://github.com/aws-amplify/amplify-cli/commit/ecd87ee5b47b5d3e458feaa87b0949f5661a8901)), closes [#1877](https://github.com/aws-amplify/amplify-cli/issues/1877)
- **amplify-category-api:** Fix [#2498](https://github.com/aws-amplify/amplify-cli/issues/2498) ([#2503](https://github.com/aws-amplify/amplify-cli/issues/2503)) ([35aab06](https://github.com/aws-amplify/amplify-cli/commit/35aab06c1ac9d3081f4f2e06ae18c14ef212aa43))
- **amplify-category-api:** safeguard prompt with empty options ([#2430](https://github.com/aws-amplify/amplify-cli/issues/2430)) ([cb8f6dd](https://github.com/aws-amplify/amplify-cli/commit/cb8f6dddefb7f7e7f8159988563fc076f470ee79)), closes [#2423](https://github.com/aws-amplify/amplify-cli/issues/2423)
- **amplify-category-api:** use standard json read ([#2581](https://github.com/aws-amplify/amplify-cli/issues/2581)) ([3adc395](https://github.com/aws-amplify/amplify-cli/commit/3adc395a5e4ccf3673735f8091db63923a46c501))
- **amplify-category-auth:** adds trigger flag to lambda response ([#2548](https://github.com/aws-amplify/amplify-cli/issues/2548)) ([270b4ac](https://github.com/aws-amplify/amplify-cli/commit/270b4ac8464ac1800235beceed158f58a9538488))
- **amplify-category-auth:** checks for google idp federation on native ([#2541](https://github.com/aws-amplify/amplify-cli/issues/2541)) ([e1de9ac](https://github.com/aws-amplify/amplify-cli/commit/e1de9acac96dc0f7f7630fe8e75a0c0b89d15986)), closes [#2284](https://github.com/aws-amplify/amplify-cli/issues/2284) [#2284](https://github.com/aws-amplify/amplify-cli/issues/2284)
- **amplify-category-auth:** removes deprecated props for external auth ([#2587](https://github.com/aws-amplify/amplify-cli/issues/2587)) ([08c0c70](https://github.com/aws-amplify/amplify-cli/commit/08c0c706bce7fd5996ce7c782512f694c1ff0455)), closes [#2309](https://github.com/aws-amplify/amplify-cli/issues/2309)
- **amplify-category-hosting:** fix hosting bug ([#2556](https://github.com/aws-amplify/amplify-cli/issues/2556)) ([75784fb](https://github.com/aws-amplify/amplify-cli/commit/75784fb27da321b5e1d1b1f11935425f602a3c4a))
- **amplify-category-notifications:** fix notifications env change issue ([#2669](https://github.com/aws-amplify/amplify-cli/issues/2669)) ([54d4d64](https://github.com/aws-amplify/amplify-cli/commit/54d4d64e03dc246e42ba3e2d19b1789d2dbeaddc)), closes [#2616](https://github.com/aws-amplify/amplify-cli/issues/2616)
- **amplify-category-storage:** validate max length of bucket name ([ace68a9](https://github.com/aws-amplify/amplify-cli/commit/ace68a9a41adf29e924a5eee2f7970d041c24feb))
- **amplify-codegen:** fix headless push with codegen ([#2743](https://github.com/aws-amplify/amplify-cli/issues/2743)) ([da248a4](https://github.com/aws-amplify/amplify-cli/commit/da248a456d96ed37533f964c066651ae22459166))
- **amplify-codegen:** support headless push for newly added api ([#2442](https://github.com/aws-amplify/amplify-cli/issues/2442)) ([84c08e7](https://github.com/aws-amplify/amplify-cli/commit/84c08e79623fdb68ba8d0f24acf33f342fc83bb5)), closes [#2365](https://github.com/aws-amplify/amplify-cli/issues/2365)
- **amplify-codegen-appsync-model-plugin:** fix android models ([#2800](https://github.com/aws-amplify/amplify-cli/issues/2800)) ([cc96a05](https://github.com/aws-amplify/amplify-cli/commit/cc96a0557a385d89af9235148c56455f715a8731))
- **amplify-codegen-appsync-model-plugin:** include enums in JS exports ([#2805](https://github.com/aws-amplify/amplify-cli/issues/2805)) ([cac07aa](https://github.com/aws-amplify/amplify-cli/commit/cac07aa2b36a65b4f86bffb82ccfacf270ee7d49))
- **amplify-provider-awscloudformation:** amplify delete delete the stack ([#2470](https://github.com/aws-amplify/amplify-cli/issues/2470)) ([46bcab2](https://github.com/aws-amplify/amplify-cli/commit/46bcab20e2a9cebb6b68f2b3298f88cf9dd49e47))
- **amplify-provider-awscloudformation:** build api project w/ params ([#2003](https://github.com/aws-amplify/amplify-cli/issues/2003)) ([3692901](https://github.com/aws-amplify/amplify-cli/commit/3692901b3f82daf79475ec5b1c5cd90781917446)), closes [#1960](https://github.com/aws-amplify/amplify-cli/issues/1960)
- **cli:** add cli core aliases, and two minor fixes ([#2394](https://github.com/aws-amplify/amplify-cli/issues/2394)) ([69c7ab3](https://github.com/aws-amplify/amplify-cli/commit/69c7ab36f5a78e875ca117cbbadfb80f44b288c8))
- **cli:** add console command in the help message ([#2494](https://github.com/aws-amplify/amplify-cli/issues/2494)) ([cf0eddd](https://github.com/aws-amplify/amplify-cli/commit/cf0eddd1ba27b1126b0745cc068f205b2c2c8343)), closes [#1607](https://github.com/aws-amplify/amplify-cli/issues/1607)
- **cli:** remove extra prompt in the new push workflow ([#2824](https://github.com/aws-amplify/amplify-cli/issues/2824)) ([7609018](https://github.com/aws-amplify/amplify-cli/commit/760901856f78e92ffcf8705cb1794fb957b9e4ed))
- **graphql-auth-transformer:** add support for ownerfield ([eaa3451](https://github.com/aws-amplify/amplify-cli/commit/eaa345158e83c0c169bd2c290601f0f3481dba04)), closes [#2361](https://github.com/aws-amplify/amplify-cli/issues/2361)
- **graphql-auth-transformer:** added staticgroupVar function ([#2433](https://github.com/aws-amplify/amplify-cli/issues/2433)) ([e168d1c](https://github.com/aws-amplify/amplify-cli/commit/e168d1cd1899bb9990ffca88d0a01b83b8e3f19f))
- **graphql-auth-transformer:** include ApiKeyConfig in additional providers ([#2744](https://github.com/aws-amplify/amplify-cli/issues/2744)) ([d1dc7ac](https://github.com/aws-amplify/amplify-cli/commit/d1dc7acbbf27a567df6c250ae4428943ca2f66d0)), closes [#2741](https://github.com/aws-amplify/amplify-cli/issues/2741)
- **graphql-auth-transformer:** remove enforce model check for field ([#2607](https://github.com/aws-amplify/amplify-cli/issues/2607)) ([b1d6d4b](https://github.com/aws-amplify/amplify-cli/commit/b1d6d4b1c933e552874b3bb016f611567df186d0)), closes [#2591](https://github.com/aws-amplify/amplify-cli/issues/2591) [#2591](https://github.com/aws-amplify/amplify-cli/issues/2591)
- **graphql-auth-transformer:** removed subs auth check for field ([9584254](https://github.com/aws-amplify/amplify-cli/commit/95842542d2c2cf6178f660faf3f20009fd848c60))
- **graphql-dynamodb-transformer:** allow id for non model objects ([#2530](https://github.com/aws-amplify/amplify-cli/issues/2530)) ([0d3c849](https://github.com/aws-amplify/amplify-cli/commit/0d3c849002917016cbffcba7ac22de9538f83acc)), closes [#1984](https://github.com/aws-amplify/amplify-cli/issues/1984) [#1984](https://github.com/aws-amplify/amplify-cli/issues/1984)
- **graphql-dynamodb-transformer:** fix cloudformation error config ([#2772](https://github.com/aws-amplify/amplify-cli/issues/2772)) ([10ca188](https://github.com/aws-amplify/amplify-cli/commit/10ca188703c71262a90b687ab758323bd2ef7f88))
- **graphql-key-transformer:** fix merge errors ([#2762](https://github.com/aws-amplify/amplify-cli/issues/2762)) ([edf4c76](https://github.com/aws-amplify/amplify-cli/commit/edf4c76aae130f300f520787168db7cd2782c324))
- **graphql-key-transformer:** update deleteInput logic to hadle ID ([2856c9e](https://github.com/aws-amplify/amplify-cli/commit/2856c9e72be1e9ac8d5be33a44dc26e893f29ee0))
- **graphql-mapping-template:** handle missing arguments gracefully ([4950993](https://github.com/aws-amplify/amplify-cli/commit/4950993eb7a3b11bbecef5e82e1859e1f27d1453))
- [#2296](https://github.com/aws-amplify/amplify-cli/issues/2296) [#2304](https://github.com/aws-amplify/amplify-cli/issues/2304) [#2100](https://github.com/aws-amplify/amplify-cli/issues/2100) ([#2439](https://github.com/aws-amplify/amplify-cli/issues/2439)) ([82762d6](https://github.com/aws-amplify/amplify-cli/commit/82762d6187eb2102ebd134b181622188c5632d1d))
- [#2389](https://github.com/aws-amplify/amplify-cli/issues/2389) ([#2538](https://github.com/aws-amplify/amplify-cli/issues/2538)) ([fb92a9d](https://github.com/aws-amplify/amplify-cli/commit/fb92a9d7c6a1f807e49b7f899531de90cc1f4ee3))
- [#2727](https://github.com/aws-amplify/amplify-cli/issues/2727) ([#2754](https://github.com/aws-amplify/amplify-cli/issues/2754)) ([44a7b54](https://github.com/aws-amplify/amplify-cli/commit/44a7b549f84ff8d752fd0dc87d6d689a609a579d))
- api key creation/deletion logic ([#2678](https://github.com/aws-amplify/amplify-cli/issues/2678)) ([e1d111d](https://github.com/aws-amplify/amplify-cli/commit/e1d111d87cbe71f9c7a41a61e243f6d907905878))
- build break after recent merges ([#2758](https://github.com/aws-amplify/amplify-cli/issues/2758)) ([7155787](https://github.com/aws-amplify/amplify-cli/commit/7155787d74306e9708fe7115648ab6f702dc2093))
- build break, chore: typescript, lerna update ([#2640](https://github.com/aws-amplify/amplify-cli/issues/2640)) ([29fae36](https://github.com/aws-amplify/amplify-cli/commit/29fae366f4cab054feefa58c7dc733002d19570c))
- change default length for api key back to 7 days ([#2507](https://github.com/aws-amplify/amplify-cli/issues/2507)) ([6a7e61f](https://github.com/aws-amplify/amplify-cli/commit/6a7e61fc7315f5e732ad7b36b5c0ae88ea36b628))
- e2e test failures with node env ([#2831](https://github.com/aws-amplify/amplify-cli/issues/2831)) ([377dfa7](https://github.com/aws-amplify/amplify-cli/commit/377dfa7c78d97408d53ba3611045d19d477c163d))
- export Typescript definitions and fix resulting type errors ([#2452](https://github.com/aws-amplify/amplify-cli/issues/2452)) ([7de3845](https://github.com/aws-amplify/amplify-cli/commit/7de384594d3b9cbf22cdaa85107fc8df26c141ec)), closes [#2451](https://github.com/aws-amplify/amplify-cli/issues/2451)
- fixed typo on serviceWorker for graphiql explorer package 🐜 ([fabae78](https://github.com/aws-amplify/amplify-cli/commit/fabae78b0188162271b3203222ae5a1754677df2))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([3dabb5f](https://github.com/aws-amplify/amplify-cli/commit/3dabb5f7e6216cf2b1dc943b09c8487c693a037c))
- **mock:** [#2606](https://github.com/aws-amplify/amplify-cli/issues/2606) - mocking does not start when there are LSIs in DynamoDB table ([#2667](https://github.com/aws-amplify/amplify-cli/issues/2667)) ([914470e](https://github.com/aws-amplify/amplify-cli/commit/914470e304391fbff756138d381754021aec6528))
- give ddb trigger different policy name from lambda execution ([#2801](https://github.com/aws-amplify/amplify-cli/issues/2801)) ([b97a7db](https://github.com/aws-amplify/amplify-cli/commit/b97a7db7e856d9bd6a5568b8b7a4ea7ef27c57f9))
- handle missing authConfig gracefully ([#2518](https://github.com/aws-amplify/amplify-cli/issues/2518)) ([06744f6](https://github.com/aws-amplify/amplify-cli/commit/06744f6c3abf0279a507caa9cf75d1ba9a85a479)), closes [#2480](https://github.com/aws-amplify/amplify-cli/issues/2480)
- include api build directory in cloud zip ([#2819](https://github.com/aws-amplify/amplify-cli/issues/2819)) ([f26fea4](https://github.com/aws-amplify/amplify-cli/commit/f26fea4138ec20847ae9e577f9315aa865d9679a))
- mitigate push failuer when graphql api backend is missing ([#2559](https://github.com/aws-amplify/amplify-cli/issues/2559)) ([acfdc83](https://github.com/aws-amplify/amplify-cli/commit/acfdc838db0f514c737aa3a726790716fa089c14))
- randomize role-names and bucket-name for auth and storage category ([#2709](https://github.com/aws-amplify/amplify-cli/issues/2709)) ([fe0e979](https://github.com/aws-amplify/amplify-cli/commit/fe0e979812bd3142a56a62bf15444cbb3dbbb6bb))
- update transformer conf version to 5 ([#2812](https://github.com/aws-amplify/amplify-cli/issues/2812)) ([c8dd1c9](https://github.com/aws-amplify/amplify-cli/commit/c8dd1c968ebcda9bc1f96b4ed8af3304c5b94c22))

### Features

- User Pool Groups, Admin Auth Support, Custom Group Role Policies ([#2443](https://github.com/aws-amplify/amplify-cli/issues/2443)) ([09aecfd](https://github.com/aws-amplify/amplify-cli/commit/09aecfd0cb3dae2c17d1c512946cc733c4fe3d4c))
- **amplify-category-auth:** allow more than one groupClaim ([f4397e0](https://github.com/aws-amplify/amplify-cli/commit/f4397e089513e16db5f363458c3c61b351acb5b9))
- **amplify-codegen-appsync-model-plugin:** update java model generator ([#2785](https://github.com/aws-amplify/amplify-cli/issues/2785)) ([c66148c](https://github.com/aws-amplify/amplify-cli/commit/c66148cdd126b316f8d1cbe6d40e0d8bf8226ed9))
- **cli:** add amplifyconfiguration.json for native apps ([#2787](https://github.com/aws-amplify/amplify-cli/issues/2787)) ([0393535](https://github.com/aws-amplify/amplify-cli/commit/03935353596582bfac620ef7a0e68cf01ad376ee))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
- **cli:** support for samples with --app params in init command ([#2358](https://github.com/aws-amplify/amplify-cli/issues/2358)) ([7ba1a9d](https://github.com/aws-amplify/amplify-cli/commit/7ba1a9dc510caeafda74ce2ce04942fa157ea234))
- **cli:** update publish command to use the updated push command ([#2826](https://github.com/aws-amplify/amplify-cli/issues/2826)) ([9fead0e](https://github.com/aws-amplify/amplify-cli/commit/9fead0e8b981a4d32b46bcf0c90cff88d16c5e70))
- **graphql-connection-transformer:** limit ([#1953](https://github.com/aws-amplify/amplify-cli/issues/1953)) ([dcaf844](https://github.com/aws-amplify/amplify-cli/commit/dcaf84480974e7a697d1ea29782a4f5032a77942))
- **graphql-elasticsearch-transformer:** add total in es response ([#2602](https://github.com/aws-amplify/amplify-cli/issues/2602)) ([dbdb000](https://github.com/aws-amplify/amplify-cli/commit/dbdb0002b8e7cd33e37880d3166bc99c5faf1234)), closes [#2600](https://github.com/aws-amplify/amplify-cli/issues/2600)
- add amplify prefix to every cfn stack provisioned via the CLI ([#2225](https://github.com/aws-amplify/amplify-cli/issues/2225)) ([4cbeeaa](https://github.com/aws-amplify/amplify-cli/commit/4cbeeaa6b99a1c0d1921301308c31df502491191))
- add amplify-app command ([#2761](https://github.com/aws-amplify/amplify-cli/issues/2761)) ([c46cdd4](https://github.com/aws-amplify/amplify-cli/commit/c46cdd421bce40d7995b3e75f0ea7f4f646d2308))
- add editorconfig to project ([c90bf48](https://github.com/aws-amplify/amplify-cli/commit/c90bf4802d62ec141ace01614235d32aed63938d))
- conditions update ([#2789](https://github.com/aws-amplify/amplify-cli/issues/2789)) ([3fae391](https://github.com/aws-amplify/amplify-cli/commit/3fae391340d5fd151e1c43286c90142b5ab0eab0))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- Merge GSI from a previous add when updating a storage ([#2571](https://github.com/aws-amplify/amplify-cli/issues/2571)) ([c8ae475](https://github.com/aws-amplify/amplify-cli/commit/c8ae475e25e5ad27aab602a05c29c9ca9cef8a4b))
- move away from mosca to forked mqtt server ([#2428](https://github.com/aws-amplify/amplify-cli/issues/2428)) ([6eb59d6](https://github.com/aws-amplify/amplify-cli/commit/6eb59d6a0fa616a65ad0489405cc89dfbec0f5a1))
- resolver changes ([#2760](https://github.com/aws-amplify/amplify-cli/issues/2760)) ([8ce0d12](https://github.com/aws-amplify/amplify-cli/commit/8ce0d12eb1d3bd6d0132baca39b6e9daff04c39a))

## 3.9.1-beta.0 (2019-09-25)

### Bug Fixes

- [#2335](https://github.com/aws-amplify/amplify-cli/issues/2335) - change the transformer.conf.json version flag check logic ([b09cd37](https://github.com/aws-amplify/amplify-cli/commit/b09cd37a931c770a15b4397dd3d6631d468170a6))
- **amplify-appsync-simulator:** fix none data source handler ([#2356](https://github.com/aws-amplify/amplify-cli/issues/2356)) ([157ecb1](https://github.com/aws-amplify/amplify-cli/commit/157ecb1222abc7becd71e96463b48b1637ec28e2))
- **amplify-util-mock:** add support for custom resolver template name ([#2355](https://github.com/aws-amplify/amplify-cli/issues/2355)) ([c9829e2](https://github.com/aws-amplify/amplify-cli/commit/c9829e22aed7082798605f23aeff978ac1fa85f6)), closes [#2306](https://github.com/aws-amplify/amplify-cli/issues/2306)
- [#2347](https://github.com/aws-amplify/amplify-cli/issues/2347) - enum validation for key directive ([#2363](https://github.com/aws-amplify/amplify-cli/issues/2363)) ([1facade](https://github.com/aws-amplify/amplify-cli/commit/1facaded3095eaff5a015e76ca4d718b7bc3c938))
- **amplify-util-mock:** use lambda fn name instead of resource name ([#2357](https://github.com/aws-amplify/amplify-cli/issues/2357)) ([4858921](https://github.com/aws-amplify/amplify-cli/commit/48589212b329e81122aab5adfb7589dd479934b7)), closes [#2280](https://github.com/aws-amplify/amplify-cli/issues/2280)
- **graphql-transformer-core:** try/catch on load config ([#2354](https://github.com/aws-amplify/amplify-cli/issues/2354)) ([8ed16a5](https://github.com/aws-amplify/amplify-cli/commit/8ed16a50dc953ebbc28d197d7e69904b18cf2452)), closes [pr#2348](https://github.com/pr/issues/2348)
- [#2360](https://github.com/aws-amplify/amplify-cli/issues/2360) - meta json was written as object ([#2381](https://github.com/aws-amplify/amplify-cli/issues/2381)) ([7dd3c37](https://github.com/aws-amplify/amplify-cli/commit/7dd3c370552af31d63a4c2352c7b7453d6ab1fc0))
- add layer based on region ([#2399](https://github.com/aws-amplify/amplify-cli/issues/2399)) ([c6490c5](https://github.com/aws-amplify/amplify-cli/commit/c6490c537299e74c569a80fc06d1999cc92ae774)), closes [#2386](https://github.com/aws-amplify/amplify-cli/issues/2386)

# 3.9.0 (2019-09-19)

## 3.8.1-beta.0 (2019-09-19)

### Bug Fixes

- the KeyTransformer class name was incorrect ([#2346](https://github.com/aws-amplify/amplify-cli/issues/2346)) ([b54ef02](https://github.com/aws-amplify/amplify-cli/commit/b54ef02b18976b8457612225aa5e67cc2a805636))
- **amplify-appsync-simulator:** add support for AppSync template version ([#2329](https://github.com/aws-amplify/amplify-cli/issues/2329)) ([88cd220](https://github.com/aws-amplify/amplify-cli/commit/88cd220cbb254a018b888ee587c9c35994010377)), closes [#2134](https://github.com/aws-amplify/amplify-cli/issues/2134) [#2211](https://github.com/aws-amplify/amplify-cli/issues/2211) [#2299](https://github.com/aws-amplify/amplify-cli/issues/2299)
- **amplify-codegen:** add framework only if javascript ([5709742](https://github.com/aws-amplify/amplify-cli/commit/5709742f33a20916c93869243f2bc699d40ddcce))
- **amplify-provider-awscloudformation:** fix amplify configure ([#2344](https://github.com/aws-amplify/amplify-cli/issues/2344)) ([0fa9b2a](https://github.com/aws-amplify/amplify-cli/commit/0fa9b2a25b83928e6c1eb860805ade941f0111c4))
- **cli:** add context.print.fancy ([#2352](https://github.com/aws-amplify/amplify-cli/issues/2352)) ([099ca0d](https://github.com/aws-amplify/amplify-cli/commit/099ca0d7eabe58a75845e8f96caa6c4888be2915)), closes [#2351](https://github.com/aws-amplify/amplify-cli/issues/2351)

# 3.8.0 (2019-09-18)

### Bug Fixes

- **amplify-codegen:** add framework only if javascript ([#2342](https://github.com/aws-amplify/amplify-cli/issues/2342)) ([57c29c4](https://github.com/aws-amplify/amplify-cli/commit/57c29c450082c35dc6925be3d005422a2f5732bf))

## 3.7.1-beta.0 (2019-09-18)

### Bug Fixes

- **graphql-auth-transformer:** fixed per field delete logic ([#2333](https://github.com/aws-amplify/amplify-cli/issues/2333)) ([00db7c8](https://github.com/aws-amplify/amplify-cli/commit/00db7c89114263ca9b88d0b978a12a05e43ab9a1))
- fix load config withoutinit ([389e739](https://github.com/aws-amplify/amplify-cli/commit/389e73916946d16b46805ebd00f0672064539966))
- fix the amplify env checkout command ([#2339](https://github.com/aws-amplify/amplify-cli/issues/2339)) ([a96b42a](https://github.com/aws-amplify/amplify-cli/commit/a96b42a5e6d92e44018dc87cc4dbf51ff2107c09))
- fixing no-gql-override param usage in amplify push command ([#2336](https://github.com/aws-amplify/amplify-cli/issues/2336)) ([198fac4](https://github.com/aws-amplify/amplify-cli/commit/198fac4507000dcaf623981867140b92f3e3c5c5))

# 3.7.0 (2019-09-17)

### Reverts

- beta circle ci config ([bcccee6](https://github.com/aws-amplify/amplify-cli/commit/bcccee6a2ffa05af94e93ebd1c94d73a8545a1da))

# 3.5.0 (2019-09-17)

### Bug Fixes

- fixed bug with per field auth on create ([#2327](https://github.com/aws-amplify/amplify-cli/issues/2327)) ([3206e45](https://github.com/aws-amplify/amplify-cli/commit/3206e45f401c7407acee0a248341930ede6a3dfb)), closes [#2316](https://github.com/aws-amplify/amplify-cli/issues/2316)

# 3.4.0 (2019-09-17)

# 3.3.0 (2019-09-17)

### Bug Fixes

- directive generation for groups auth ([#2305](https://github.com/aws-amplify/amplify-cli/issues/2305)) ([1ce074e](https://github.com/aws-amplify/amplify-cli/commit/1ce074e2ee3097ebb8e66c3603d3617cbf36f0d4))
- **amplify-category-api:** fix api add-graphql-datasource command ([#2320](https://github.com/aws-amplify/amplify-cli/issues/2320)) ([a9c829d](https://github.com/aws-amplify/amplify-cli/commit/a9c829d79e91246d2bb9a707ccfe886502ceebe2))
- **amplify-util-mock:** safe access to LambdaConfiguration ([#2294](https://github.com/aws-amplify/amplify-cli/issues/2294)) ([0624739](https://github.com/aws-amplify/amplify-cli/commit/0624739fd3e44a14ae20122a2c29c77169b6bc0a))
- **graphql-auth-transformer:** added helper function for static auth var ([24c8f6d](https://github.com/aws-amplify/amplify-cli/commit/24c8f6d37508fd98a55cd2f892e5d17414c5e9fe))
- **graphql-auth-transformer:** verify multiple static group auth rules ([289d575](https://github.com/aws-amplify/amplify-cli/commit/289d5758439e89c52a45c529c1e58b1f361ca83b)), closes [#2241](https://github.com/aws-amplify/amplify-cli/issues/2241)
- ensure that transformer instances are not reused ([#2318](https://github.com/aws-amplify/amplify-cli/issues/2318)) ([24318ac](https://github.com/aws-amplify/amplify-cli/commit/24318ac65ed89e0845c9d36df365f4163d9298a6))
- multiauth-e2e typo ([#2317](https://github.com/aws-amplify/amplify-cli/issues/2317)) ([5d019a6](https://github.com/aws-amplify/amplify-cli/commit/5d019a698039d13ca4a6a83ea95468f5b0658a7c))

## 3.2.1-plugin.3 (2019-09-13)

## 3.2.1-plugin.0 (2019-09-13)

### Bug Fixes

- **amplify-appsync-simulator:** allow null returns in response template ([#2267](https://github.com/aws-amplify/amplify-cli/issues/2267)) ([7056250](https://github.com/aws-amplify/amplify-cli/commit/70562506d5aac737a92a8856b14a799f55f47490)), closes [#2248](https://github.com/aws-amplify/amplify-cli/issues/2248)
- **amplify-category-storage:** use name for gsi index ([#2265](https://github.com/aws-amplify/amplify-cli/issues/2265)) ([89c9036](https://github.com/aws-amplify/amplify-cli/commit/89c9036cb697cd6015ad16381236af9942508b34))
- **amplify-codegen:** support multi os team workflow in codegen ([#2212](https://github.com/aws-amplify/amplify-cli/issues/2212)) ([e4a0454](https://github.com/aws-amplify/amplify-cli/commit/e4a045468d761c9333a799d3b3dae6c6399dc179)), closes [#2147](https://github.com/aws-amplify/amplify-cli/issues/2147) [#2002](https://github.com/aws-amplify/amplify-cli/issues/2002)
- **amplify-codegen:** support nonarray includes/excludes in codegen conf ([#2271](https://github.com/aws-amplify/amplify-cli/issues/2271)) ([30904a0](https://github.com/aws-amplify/amplify-cli/commit/30904a0ac01b2ae6064d57109c998c9243b36d68)), closes [#2262](https://github.com/aws-amplify/amplify-cli/issues/2262)
- **cli:** fix new plugin platform codegen related issue ([#2266](https://github.com/aws-amplify/amplify-cli/issues/2266)) ([c557182](https://github.com/aws-amplify/amplify-cli/commit/c557182b2d423bb1c2f8832ecd49076c806b05bb))
- **graphql-relational-schema-transformer:** fix input type casing ([#2249](https://github.com/aws-amplify/amplify-cli/issues/2249)) ([3a00d56](https://github.com/aws-amplify/amplify-cli/commit/3a00d56320f8c6a7de415e12ac9c6c4b5954d934)), closes [#2217](https://github.com/aws-amplify/amplify-cli/issues/2217)
- conn v2 e2e test update to multi-auth ([#2264](https://github.com/aws-amplify/amplify-cli/issues/2264)) ([ac3fd09](https://github.com/aws-amplify/amplify-cli/commit/ac3fd09ae29398c525c46b560a03ea85187b70b4))
- **graphql-relational-schema-transformer:** fix template for string keys ([#2205](https://github.com/aws-amplify/amplify-cli/issues/2205)) ([294fbc6](https://github.com/aws-amplify/amplify-cli/commit/294fbc67c7d8d806c4fe8100eb27b04571a4c811)), closes [#2133](https://github.com/aws-amplify/amplify-cli/issues/2133)
- **graphql-transformer-core:** fix migration errors ([#2245](https://github.com/aws-amplify/amplify-cli/issues/2245)) ([fd811bb](https://github.com/aws-amplify/amplify-cli/commit/fd811bbe2e08f2ade7627c8cce44c9f1dce2d9ba)), closes [#2196](https://github.com/aws-amplify/amplify-cli/issues/2196)
- [#2239](https://github.com/aws-amplify/amplify-cli/issues/2239) missing proper casing of input type argument ([#2246](https://github.com/aws-amplify/amplify-cli/issues/2246)) ([9d197f1](https://github.com/aws-amplify/amplify-cli/commit/9d197f1f67728935ddfb5c02c5fe53368b010b63))
- [#2260](https://github.com/aws-amplify/amplify-cli/issues/2260) - check for auth config on legacy projects ([#2261](https://github.com/aws-amplify/amplify-cli/issues/2261)) ([ba79d2a](https://github.com/aws-amplify/amplify-cli/commit/ba79d2a6c534cb1bcd4686991c80aa88ae4fbc8f))
- [#2272](https://github.com/aws-amplify/amplify-cli/issues/2272), [#2273](https://github.com/aws-amplify/amplify-cli/issues/2273) - create correct policies when IAM is the default auth ([#2276](https://github.com/aws-amplify/amplify-cli/issues/2276)) ([5ae0686](https://github.com/aws-amplify/amplify-cli/commit/5ae06868eb48f9cd8e5474af900bb5528d9740c4))
- generate iam policies for auth role for public rules as well ([#2258](https://github.com/aws-amplify/amplify-cli/issues/2258)) ([6bbfce3](https://github.com/aws-amplify/amplify-cli/commit/6bbfce3addeb0228088a8094f680d4e82823a305))

### Features

- updated version of [#2118](https://github.com/aws-amplify/amplify-cli/issues/2118) with addressed review comments ([#2230](https://github.com/aws-amplify/amplify-cli/issues/2230)) ([be3c499](https://github.com/aws-amplify/amplify-cli/commit/be3c499edcc6bec63b38e9241c5af7b83c930022))
- **amplify-graphql-types-generator:** show error msg for missing query ([#2274](https://github.com/aws-amplify/amplify-cli/issues/2274)) ([d8a2722](https://github.com/aws-amplify/amplify-cli/commit/d8a2722e82908ed3b077d9f563300c90a8d0a5da)), closes [#2228](https://github.com/aws-amplify/amplify-cli/issues/2228) [#1434](https://github.com/aws-amplify/amplify-cli/issues/1434)
- **cli:** new plugin platform ([#2254](https://github.com/aws-amplify/amplify-cli/issues/2254)) ([7ec29dd](https://github.com/aws-amplify/amplify-cli/commit/7ec29dd4f2da8c90727b36469eca646d289877b6))

# 3.2.0 (2019-09-11)

## 3.17.2-gelato.0 (2019-11-13)

### Bug Fixes

- add xcode to package.json ([6d5bc20](https://github.com/aws-amplify/amplify-cli/commit/6d5bc20a1b3128b5a972d5941ffac011eb9b66ca))
- **mock:** [#2606](https://github.com/aws-amplify/amplify-cli/issues/2606) - mocking does not start when there are LSIs in DynamoDB table ([#2667](https://github.com/aws-amplify/amplify-cli/issues/2667)) ([a777b24](https://github.com/aws-amplify/amplify-cli/commit/a777b24efa23124c7e94e459573c29943f8807f6))
- check for existence of models in transform.conf ([feb94e1](https://github.com/aws-amplify/amplify-cli/commit/feb94e1dbe4e8e45b37363e926602151b83ffeee))
- fixing add api flow for conflict resolution and change lww to optimistic concurrency ([a07e9ca](https://github.com/aws-amplify/amplify-cli/commit/a07e9cadf3dc9dafe05d64724662fb54c79c9cbb))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([b335346](https://github.com/aws-amplify/amplify-cli/commit/b3353464d3230213188f4a0c45b27f56e7b3fdc6))
- move xcode helpers inside amplify-app ([5e1adb2](https://github.com/aws-amplify/amplify-cli/commit/5e1adb281461b0ffd2a1e2d2ff755adb634a6a81))
- randomize role-names and bucket-name for auth and storage category ([#2709](https://github.com/aws-amplify/amplify-cli/issues/2709)) ([390b43a](https://github.com/aws-amplify/amplify-cli/commit/390b43a37711281aff5a6b3fb6cf61f8ed1b7593))

### Features

- add deployed e2e tests, fix bug for delete in [@key](https://github.com/key) transformer ([69abcce](https://github.com/aws-amplify/amplify-cli/commit/69abcce79c97f2cb73517c2d3c2c56131c35a526))
- add support for generation of models in codegen ([0467f91](https://github.com/aws-amplify/amplify-cli/commit/0467f915d61efa3d3f265bd7e1f737ccdf0d0dfb))
- add update, delete userPool e2e, fix auth userPools resolver bug ([cac8547](https://github.com/aws-amplify/amplify-cli/commit/cac8547e36ad3ee10e4cfe1955cfdd82ecb14a3b))
- appsync local flow from api ([3b7e6fc](https://github.com/aws-amplify/amplify-cli/commit/3b7e6fcf4e0dbbc81e95a9970685cd441cc4df2c))
- condition support for mutations (wip) ([1121765](https://github.com/aws-amplify/amplify-cli/commit/112176594b06a3a0e0a68cf0a2e4f94714d11885))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([6d5c9ca](https://github.com/aws-amplify/amplify-cli/commit/6d5c9ca220489b383a6e8cb09d2393571eeae957))
- introduce create-amplify-app command ([2a9ed35](https://github.com/aws-amplify/amplify-cli/commit/2a9ed353272a505e3578bb9f8c63d78d57d433a6))
- refactor conditions to separate transformers, add local e2e tests ([b543211](https://github.com/aws-amplify/amplify-cli/commit/b5432118a74b82a98e02fa60226483ea855263d4))
- work on field removal ([691fae6](https://github.com/aws-amplify/amplify-cli/commit/691fae66c98a6d3c148908786bf4139a6f52fdce))

## 3.17.1-gelato.0 (2019-11-13)

### Bug Fixes

- add amplify dir too xcode project ([5a8650a](https://github.com/aws-amplify/amplify-cli/commit/5a8650a3771ae87b38846b2dd3408b9d828af4a3))
- add default envName amplify ([7b784a3](https://github.com/aws-amplify/amplify-cli/commit/7b784a3a7870c5065c846f8278e7bbd6c9149f68))
- add model gen to podspec ([010213a](https://github.com/aws-amplify/amplify-cli/commit/010213a12ec744b069cc89a3dd430b0d422e67df))
- add run script to amplify-modelgen ([a527922](https://github.com/aws-amplify/amplify-cli/commit/a527922f9a8d77323d992302f1204f27f78410e8))
- change create-amplify-app to amplify-app ([fdc5f74](https://github.com/aws-amplify/amplify-cli/commit/fdc5f74ad256d7668183a45c6a82b58333c02df9))
- change name of bin file ([878e241](https://github.com/aws-amplify/amplify-cli/commit/878e241148ecdec1d4650ee98c6faa5e96ca9774))
- change stackID to stackName in auth CFN stack ([2152a31](https://github.com/aws-amplify/amplify-cli/commit/2152a3100a41d3022e8a9609b776c8f9d099d6bf))
- changes to build.gradle ([73a5077](https://github.com/aws-amplify/amplify-cli/commit/73a5077dbfd0e255fc249670104436dab0c1ea46))
- check for existence of models in transform.conf ([dccbbf3](https://github.com/aws-amplify/amplify-cli/commit/dccbbf30c84e9ab4ef15c997c3a17b3a544e23a1))
- check if amplify already exists ([956fd9b](https://github.com/aws-amplify/amplify-cli/commit/956fd9bbb3631ec866c17b4ebd93437ffee75cf1))
- default modelgen to false ([5330682](https://github.com/aws-amplify/amplify-cli/commit/5330682f6e3df3615cc63b830ecef582dfb09036))
- fixing add api flow for conflict resolution and change lww to optimistic concurrency ([5cf1adf](https://github.com/aws-amplify/amplify-cli/commit/5cf1adf9863ed3541faa83233867db4808d97b69))
- fixing delete all when no resources present ([#2685](https://github.com/aws-amplify/amplify-cli/issues/2685)) ([4038d20](https://github.com/aws-amplify/amplify-cli/commit/4038d200ac6ce93f6596747462ec77b47082c2a1))
- fixing eslint error for the scripts ([c5ff386](https://github.com/aws-amplify/amplify-cli/commit/c5ff38616f192b836370805a8a4a762d0810959b))
- getConfig immediately after createAmplifyApp ([ce16090](https://github.com/aws-amplify/amplify-cli/commit/ce1609021ea33f63b35d2e2cd8b32a3d61bbd2b0))
- move amplify outside of pod dir ([85798a3](https://github.com/aws-amplify/amplify-cli/commit/85798a32939cc737b48353fd0663517a52fb646d))
- randomize role-names and bucket-name for auth and storage category ([#2709](https://github.com/aws-amplify/amplify-cli/issues/2709)) ([caf09e1](https://github.com/aws-amplify/amplify-cli/commit/caf09e1aeb02f1fe45fa0d08d99366cd475f2655))
- remove ios/android zip files, remove xcode helper call ([2c7581c](https://github.com/aws-amplify/amplify-cli/commit/2c7581c3d09c39a74e30f64b295d88af40238d45))
- **mock:** [#2606](https://github.com/aws-amplify/amplify-cli/issues/2606) - mocking does not start when there are LSIs in DynamoDB table ([#2667](https://github.com/aws-amplify/amplify-cli/issues/2667)) ([642b4f7](https://github.com/aws-amplify/amplify-cli/commit/642b4f79b47bb738d4601dcc8fbe0153cdd81903))
- remove unneeded ordering of tasks ([5209f98](https://github.com/aws-amplify/amplify-cli/commit/5209f98a2253355ec83e9bec26203add0685ad18))
- return frontend regardless of whether skeleton exists ([096a315](https://github.com/aws-amplify/amplify-cli/commit/096a3153f5ba77b17dea78205088d3a90155048e))
- update build.gradle for publishing ([e5af381](https://github.com/aws-amplify/amplify-cli/commit/e5af381996a4c2d576908fdf29b16ec6de1309aa))

### Features

- add --platform and --framework flag for create-amplify-app ([d5544ea](https://github.com/aws-amplify/amplify-cli/commit/d5544ea484becbf6697d8233c1e435c78472ec1d))
- add deployed e2e tests, fix bug for delete in [@key](https://github.com/key) transformer ([242c41a](https://github.com/aws-amplify/amplify-cli/commit/242c41a3bbc076fa602bdd55589ad93ccbc5d48a))
- add meaningful symbols and messages for create-amplify-app ([48eecf5](https://github.com/aws-amplify/amplify-cli/commit/48eecf54738fd4e64506180e00dc440f3cb8d484))
- add support for generation of models in codegen ([3a10b25](https://github.com/aws-amplify/amplify-cli/commit/3a10b256fe9454dc4db4f86f404e873da9a3da35))
- add update, delete userPool e2e, fix auth userPools resolver bug ([0b10bd3](https://github.com/aws-amplify/amplify-cli/commit/0b10bd39ca0f931b1e7e966877d953eaf2ce28f0))
- appsync local flow from api ([a964524](https://github.com/aws-amplify/amplify-cli/commit/a9645240bdb92bbfab86e74615528107414661af))
- condition support for mutations (wip) ([2c99608](https://github.com/aws-amplify/amplify-cli/commit/2c99608389c5b35533f9b78ff0e3265dc9f611ed))
- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([456c6df](https://github.com/aws-amplify/amplify-cli/commit/456c6dfa91d6d0c74428f9e1ed4f2b7e577e5fb4))
- introduce create-amplify-app command ([9011145](https://github.com/aws-amplify/amplify-cli/commit/90111454c97809551a77ff3c3b6628d5f24106a4))
- introduce create-amplify-app command ([597be18](https://github.com/aws-amplify/amplify-cli/commit/597be182bf931e99321d9d50066d5871b4d2dd3d))
- ios podspec for gelato flow ([0c5f959](https://github.com/aws-amplify/amplify-cli/commit/0c5f95931527399a18c2801d5378840fa8e76c29))
- modify samples to add gelato enables apis ([b3bbdc5](https://github.com/aws-amplify/amplify-cli/commit/b3bbdc577c9f4fe01288b83b4836cb15c31ba828))
- only create-amplify-app if no config ([04faae7](https://github.com/aws-amplify/amplify-cli/commit/04faae7468f8b05e1ee541d6fe8854d7c1373603))
- refactor conditions to separate transformers, add local e2e tests ([e65e29a](https://github.com/aws-amplify/amplify-cli/commit/e65e29aaf86165e43d7f59a96876c9fbd930bfac))
- work on field removal ([97fa347](https://github.com/aws-amplify/amplify-cli/commit/97fa3474933c7f5346653889f4cb6c6b8c831a78))

## 3.17.1-console-integration.2 (2019-11-05)

## 3.17.1-console-integration.1 (2019-11-05)

## 3.17.1-console-integration.0 (2019-11-05)

### Bug Fixes

- **mock:** [#2606](https://github.com/aws-amplify/amplify-cli/issues/2606) - mocking does not start when there are LSIs in DynamoDB table ([#2667](https://github.com/aws-amplify/amplify-cli/issues/2667)) ([914470e](https://github.com/aws-amplify/amplify-cli/commit/914470e304391fbff756138d381754021aec6528))

### Features

- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))

# 3.17.0 (2019-10-30)

## 3.16.1-beta.0 (2019-10-30)

### Bug Fixes

- **amplify-category-auth:** adds trigger flag to lambda response ([#2548](https://github.com/aws-amplify/amplify-cli/issues/2548)) ([270b4ac](https://github.com/aws-amplify/amplify-cli/commit/270b4ac8464ac1800235beceed158f58a9538488))
- **graphql-auth-transformer:** remove enforce model check for field ([#2607](https://github.com/aws-amplify/amplify-cli/issues/2607)) ([b1d6d4b](https://github.com/aws-amplify/amplify-cli/commit/b1d6d4b1c933e552874b3bb016f611567df186d0)), closes [#2591](https://github.com/aws-amplify/amplify-cli/issues/2591) [#2591](https://github.com/aws-amplify/amplify-cli/issues/2591)
- [#2389](https://github.com/aws-amplify/amplify-cli/issues/2389) ([#2538](https://github.com/aws-amplify/amplify-cli/issues/2538)) ([fb92a9d](https://github.com/aws-amplify/amplify-cli/commit/fb92a9d7c6a1f807e49b7f899531de90cc1f4ee3))
- build break, chore: typescript, lerna update ([#2640](https://github.com/aws-amplify/amplify-cli/issues/2640)) ([29fae36](https://github.com/aws-amplify/amplify-cli/commit/29fae366f4cab054feefa58c7dc733002d19570c))

### Features

- User Pool Groups, Admin Auth Support, Custom Group Role Policies ([#2443](https://github.com/aws-amplify/amplify-cli/issues/2443)) ([09aecfd](https://github.com/aws-amplify/amplify-cli/commit/09aecfd0cb3dae2c17d1c512946cc733c4fe3d4c))

# 3.16.0 (2019-10-24)

## 3.15.1-beta.0 (2019-10-24)

### Bug Fixes

- **amplify-category-auth:** removes deprecated props for external auth ([#2587](https://github.com/aws-amplify/amplify-cli/issues/2587)) ([08c0c70](https://github.com/aws-amplify/amplify-cli/commit/08c0c706bce7fd5996ce7c782512f694c1ff0455)), closes [#2309](https://github.com/aws-amplify/amplify-cli/issues/2309)

### Features

- add amplify prefix to every cfn stack provisioned via the CLI ([#2225](https://github.com/aws-amplify/amplify-cli/issues/2225)) ([4cbeeaa](https://github.com/aws-amplify/amplify-cli/commit/4cbeeaa6b99a1c0d1921301308c31df502491191))
- Merge GSI from a previous add when updating a storage ([#2571](https://github.com/aws-amplify/amplify-cli/issues/2571)) ([c8ae475](https://github.com/aws-amplify/amplify-cli/commit/c8ae475e25e5ad27aab602a05c29c9ca9cef8a4b))
- **graphql-elasticsearch-transformer:** add total in es response ([#2602](https://github.com/aws-amplify/amplify-cli/issues/2602)) ([dbdb000](https://github.com/aws-amplify/amplify-cli/commit/dbdb0002b8e7cd33e37880d3166bc99c5faf1234)), closes [#2600](https://github.com/aws-amplify/amplify-cli/issues/2600)

# 3.15.0 (2019-10-15)

## 3.14.1-beta.0 (2019-10-14)

### Bug Fixes

- **amplify-category-api:** use standard json read ([#2581](https://github.com/aws-amplify/amplify-cli/issues/2581)) ([3adc395](https://github.com/aws-amplify/amplify-cli/commit/3adc395a5e4ccf3673735f8091db63923a46c501))

# 3.14.0 (2019-10-11)

## 3.13.1-beta.0 (2019-10-11)

### Bug Fixes

- **graphql-dynamodb-transformer:** allow id for non model objects ([#2530](https://github.com/aws-amplify/amplify-cli/issues/2530)) ([0d3c849](https://github.com/aws-amplify/amplify-cli/commit/0d3c849002917016cbffcba7ac22de9538f83acc)), closes [#1984](https://github.com/aws-amplify/amplify-cli/issues/1984) [#1984](https://github.com/aws-amplify/amplify-cli/issues/1984)

# 3.13.0 (2019-10-11)

## 3.12.1-safe-perm-fix.0 (2019-10-11)

### Bug Fixes

- **graphql-dynamodb-transformer:** allow id for non model objects ([#2530](https://github.com/aws-amplify/amplify-cli/issues/2530)) ([0d3c849](https://github.com/aws-amplify/amplify-cli/commit/0d3c849002917016cbffcba7ac22de9538f83acc)), closes [#1984](https://github.com/aws-amplify/amplify-cli/issues/1984) [#1984](https://github.com/aws-amplify/amplify-cli/issues/1984)

## 3.12.1-beta.0 (2019-10-10)

### Bug Fixes

- **amplify-category-auth:** checks for google idp federation on native ([#2541](https://github.com/aws-amplify/amplify-cli/issues/2541)) ([e1de9ac](https://github.com/aws-amplify/amplify-cli/commit/e1de9acac96dc0f7f7630fe8e75a0c0b89d15986)), closes [#2284](https://github.com/aws-amplify/amplify-cli/issues/2284) [#2284](https://github.com/aws-amplify/amplify-cli/issues/2284)
- fixed typo on serviceWorker for graphiql explorer package 🐜 ([fabae78](https://github.com/aws-amplify/amplify-cli/commit/fabae78b0188162271b3203222ae5a1754677df2))
- mitigate push failuer when graphql api backend is missing ([#2559](https://github.com/aws-amplify/amplify-cli/issues/2559)) ([acfdc83](https://github.com/aws-amplify/amplify-cli/commit/acfdc838db0f514c737aa3a726790716fa089c14))
- **amplify-category-hosting:** fix hosting bug ([#2556](https://github.com/aws-amplify/amplify-cli/issues/2556)) ([75784fb](https://github.com/aws-amplify/amplify-cli/commit/75784fb27da321b5e1d1b1f11935425f602a3c4a))

# 3.12.0 (2019-10-09)

## 3.11.1-beta.0 (2019-10-09)

### Bug Fixes

- **amplify-appsync-simulator:** handle jwt decode error gracefully ([#2500](https://github.com/aws-amplify/amplify-cli/issues/2500)) ([9c931ed](https://github.com/aws-amplify/amplify-cli/commit/9c931ed7b5304f475f17db291526a16dcb305699)), closes [#2473](https://github.com/aws-amplify/amplify-cli/issues/2473)
- **amplify-category-analytics:** Allow hyphens for pinpoint resources name ([#2516](https://github.com/aws-amplify/amplify-cli/issues/2516)) ([ecd87ee](https://github.com/aws-amplify/amplify-cli/commit/ecd87ee5b47b5d3e458feaa87b0949f5661a8901)), closes [#1877](https://github.com/aws-amplify/amplify-cli/issues/1877)
- **amplify-category-api:** Fix [#2498](https://github.com/aws-amplify/amplify-cli/issues/2498) ([#2503](https://github.com/aws-amplify/amplify-cli/issues/2503)) ([35aab06](https://github.com/aws-amplify/amplify-cli/commit/35aab06c1ac9d3081f4f2e06ae18c14ef212aa43))
- **amplify-codegen:** support headless push for newly added api ([#2442](https://github.com/aws-amplify/amplify-cli/issues/2442)) ([84c08e7](https://github.com/aws-amplify/amplify-cli/commit/84c08e79623fdb68ba8d0f24acf33f342fc83bb5)), closes [#2365](https://github.com/aws-amplify/amplify-cli/issues/2365)
- **amplify-provider-awscloudformation:** amplify delete delete the stack ([#2470](https://github.com/aws-amplify/amplify-cli/issues/2470)) ([46bcab2](https://github.com/aws-amplify/amplify-cli/commit/46bcab20e2a9cebb6b68f2b3298f88cf9dd49e47))
- **amplify-provider-awscloudformation:** build api project w/ params ([#2003](https://github.com/aws-amplify/amplify-cli/issues/2003)) ([3692901](https://github.com/aws-amplify/amplify-cli/commit/3692901b3f82daf79475ec5b1c5cd90781917446)), closes [#1960](https://github.com/aws-amplify/amplify-cli/issues/1960)
- **cli:** add cli core aliases, and two minor fixes ([#2394](https://github.com/aws-amplify/amplify-cli/issues/2394)) ([69c7ab3](https://github.com/aws-amplify/amplify-cli/commit/69c7ab36f5a78e875ca117cbbadfb80f44b288c8))
- **cli:** add console command in the help message ([#2494](https://github.com/aws-amplify/amplify-cli/issues/2494)) ([cf0eddd](https://github.com/aws-amplify/amplify-cli/commit/cf0eddd1ba27b1126b0745cc068f205b2c2c8343)), closes [#1607](https://github.com/aws-amplify/amplify-cli/issues/1607)
- [#2296](https://github.com/aws-amplify/amplify-cli/issues/2296) [#2304](https://github.com/aws-amplify/amplify-cli/issues/2304) [#2100](https://github.com/aws-amplify/amplify-cli/issues/2100) ([#2439](https://github.com/aws-amplify/amplify-cli/issues/2439)) ([82762d6](https://github.com/aws-amplify/amplify-cli/commit/82762d6187eb2102ebd134b181622188c5632d1d))
- change default length for api key back to 7 days ([#2507](https://github.com/aws-amplify/amplify-cli/issues/2507)) ([6a7e61f](https://github.com/aws-amplify/amplify-cli/commit/6a7e61fc7315f5e732ad7b36b5c0ae88ea36b628))
- export Typescript definitions and fix resulting type errors ([#2452](https://github.com/aws-amplify/amplify-cli/issues/2452)) ([7de3845](https://github.com/aws-amplify/amplify-cli/commit/7de384594d3b9cbf22cdaa85107fc8df26c141ec)), closes [#2451](https://github.com/aws-amplify/amplify-cli/issues/2451)
- handle missing authConfig gracefully ([#2518](https://github.com/aws-amplify/amplify-cli/issues/2518)) ([06744f6](https://github.com/aws-amplify/amplify-cli/commit/06744f6c3abf0279a507caa9cf75d1ba9a85a479)), closes [#2480](https://github.com/aws-amplify/amplify-cli/issues/2480)

### Features

- **graphql-connection-transformer:** limit ([#1953](https://github.com/aws-amplify/amplify-cli/issues/1953)) ([dcaf844](https://github.com/aws-amplify/amplify-cli/commit/dcaf84480974e7a697d1ea29782a4f5032a77942))
- add editorconfig to project ([c90bf48](https://github.com/aws-amplify/amplify-cli/commit/c90bf4802d62ec141ace01614235d32aed63938d))
- move away from mosca to forked mqtt server ([#2428](https://github.com/aws-amplify/amplify-cli/issues/2428)) ([6eb59d6](https://github.com/aws-amplify/amplify-cli/commit/6eb59d6a0fa616a65ad0489405cc89dfbec0f5a1))

# 3.11.0 (2019-10-01)

## 3.10.1-beta.0 (2019-10-01)

### Bug Fixes

- **amplify-appsync-simulator:** impl missing methods in velocity utils ([9970053](https://github.com/aws-amplify/amplify-cli/commit/99700532fc89ed79a9302fd3d719ff9eda17909d)), closes [#2300](https://github.com/aws-amplify/amplify-cli/issues/2300)
- **amplify-category-api:** safeguard prompt with empty options ([#2430](https://github.com/aws-amplify/amplify-cli/issues/2430)) ([cb8f6dd](https://github.com/aws-amplify/amplify-cli/commit/cb8f6dddefb7f7e7f8159988563fc076f470ee79)), closes [#2423](https://github.com/aws-amplify/amplify-cli/issues/2423)
- **graphql-auth-transformer:** add support for ownerfield ([eaa3451](https://github.com/aws-amplify/amplify-cli/commit/eaa345158e83c0c169bd2c290601f0f3481dba04)), closes [#2361](https://github.com/aws-amplify/amplify-cli/issues/2361)
- **graphql-auth-transformer:** added staticgroupVar function ([#2433](https://github.com/aws-amplify/amplify-cli/issues/2433)) ([e168d1c](https://github.com/aws-amplify/amplify-cli/commit/e168d1cd1899bb9990ffca88d0a01b83b8e3f19f))
- **graphql-auth-transformer:** removed subs auth check for field ([9584254](https://github.com/aws-amplify/amplify-cli/commit/95842542d2c2cf6178f660faf3f20009fd848c60))

### Features

- **amplify-category-auth:** allow more than one groupClaim ([f4397e0](https://github.com/aws-amplify/amplify-cli/commit/f4397e089513e16db5f363458c3c61b351acb5b9))
- **cli:** support for samples with --app params in init command ([#2358](https://github.com/aws-amplify/amplify-cli/issues/2358)) ([7ba1a9d](https://github.com/aws-amplify/amplify-cli/commit/7ba1a9dc510caeafda74ce2ce04942fa157ea234))

# 3.10.0 (2019-09-25)

### Bug Fixes

- **amplify-appsync-simulator:** add support for AppSync template version ([#2329](https://github.com/aws-amplify/amplify-cli/issues/2329)) ([88cd220](https://github.com/aws-amplify/amplify-cli/commit/88cd220cbb254a018b888ee587c9c35994010377)), closes [#2134](https://github.com/aws-amplify/amplify-cli/issues/2134) [#2211](https://github.com/aws-amplify/amplify-cli/issues/2211) [#2299](https://github.com/aws-amplify/amplify-cli/issues/2299)
- **amplify-appsync-simulator:** allow null returns in response template ([#2267](https://github.com/aws-amplify/amplify-cli/issues/2267)) ([7056250](https://github.com/aws-amplify/amplify-cli/commit/70562506d5aac737a92a8856b14a799f55f47490)), closes [#2248](https://github.com/aws-amplify/amplify-cli/issues/2248)
- **amplify-appsync-simulator:** fix none data source handler ([#2356](https://github.com/aws-amplify/amplify-cli/issues/2356)) ([157ecb1](https://github.com/aws-amplify/amplify-cli/commit/157ecb1222abc7becd71e96463b48b1637ec28e2))
- **amplify-category-api:** fix api add-graphql-datasource command ([#2320](https://github.com/aws-amplify/amplify-cli/issues/2320)) ([a9c829d](https://github.com/aws-amplify/amplify-cli/commit/a9c829d79e91246d2bb9a707ccfe886502ceebe2))
- **amplify-category-storage:** use name for gsi index ([#2265](https://github.com/aws-amplify/amplify-cli/issues/2265)) ([89c9036](https://github.com/aws-amplify/amplify-cli/commit/89c9036cb697cd6015ad16381236af9942508b34))
- **amplify-codegen:** add framework only if javascript ([5709742](https://github.com/aws-amplify/amplify-cli/commit/5709742f33a20916c93869243f2bc699d40ddcce))
- **amplify-codegen:** add framework only if javascript ([#2342](https://github.com/aws-amplify/amplify-cli/issues/2342)) ([57c29c4](https://github.com/aws-amplify/amplify-cli/commit/57c29c450082c35dc6925be3d005422a2f5732bf))
- **amplify-codegen:** support multi os team workflow in codegen ([#2212](https://github.com/aws-amplify/amplify-cli/issues/2212)) ([e4a0454](https://github.com/aws-amplify/amplify-cli/commit/e4a045468d761c9333a799d3b3dae6c6399dc179)), closes [#2147](https://github.com/aws-amplify/amplify-cli/issues/2147) [#2002](https://github.com/aws-amplify/amplify-cli/issues/2002)
- **amplify-codegen:** support nonarray includes/excludes in codegen conf ([#2271](https://github.com/aws-amplify/amplify-cli/issues/2271)) ([30904a0](https://github.com/aws-amplify/amplify-cli/commit/30904a0ac01b2ae6064d57109c998c9243b36d68)), closes [#2262](https://github.com/aws-amplify/amplify-cli/issues/2262)
- **amplify-provider-awscloudformation:** fix amplify configure ([#2344](https://github.com/aws-amplify/amplify-cli/issues/2344)) ([0fa9b2a](https://github.com/aws-amplify/amplify-cli/commit/0fa9b2a25b83928e6c1eb860805ade941f0111c4))
- **amplify-util-mock:** add support for custom resolver template name ([#2355](https://github.com/aws-amplify/amplify-cli/issues/2355)) ([c9829e2](https://github.com/aws-amplify/amplify-cli/commit/c9829e22aed7082798605f23aeff978ac1fa85f6)), closes [#2306](https://github.com/aws-amplify/amplify-cli/issues/2306)
- **amplify-util-mock:** safe access to LambdaConfiguration ([#2294](https://github.com/aws-amplify/amplify-cli/issues/2294)) ([0624739](https://github.com/aws-amplify/amplify-cli/commit/0624739fd3e44a14ae20122a2c29c77169b6bc0a))
- **amplify-util-mock:** use lambda fn name instead of resource name ([#2357](https://github.com/aws-amplify/amplify-cli/issues/2357)) ([4858921](https://github.com/aws-amplify/amplify-cli/commit/48589212b329e81122aab5adfb7589dd479934b7)), closes [#2280](https://github.com/aws-amplify/amplify-cli/issues/2280)
- **cli:** add context.print.fancy ([#2352](https://github.com/aws-amplify/amplify-cli/issues/2352)) ([099ca0d](https://github.com/aws-amplify/amplify-cli/commit/099ca0d7eabe58a75845e8f96caa6c4888be2915)), closes [#2351](https://github.com/aws-amplify/amplify-cli/issues/2351)
- **cli:** fix new plugin platform codegen related issue ([#2266](https://github.com/aws-amplify/amplify-cli/issues/2266)) ([c557182](https://github.com/aws-amplify/amplify-cli/commit/c557182b2d423bb1c2f8832ecd49076c806b05bb))
- ensure that transformer instances are not reused ([#2318](https://github.com/aws-amplify/amplify-cli/issues/2318)) ([24318ac](https://github.com/aws-amplify/amplify-cli/commit/24318ac65ed89e0845c9d36df365f4163d9298a6))
- **graphql-auth-transformer:** added helper function for static auth var ([24c8f6d](https://github.com/aws-amplify/amplify-cli/commit/24c8f6d37508fd98a55cd2f892e5d17414c5e9fe))
- **graphql-auth-transformer:** fixed per field delete logic ([#2333](https://github.com/aws-amplify/amplify-cli/issues/2333)) ([00db7c8](https://github.com/aws-amplify/amplify-cli/commit/00db7c89114263ca9b88d0b978a12a05e43ab9a1))
- **graphql-auth-transformer:** verify multiple static group auth rules ([289d575](https://github.com/aws-amplify/amplify-cli/commit/289d5758439e89c52a45c529c1e58b1f361ca83b)), closes [#2241](https://github.com/aws-amplify/amplify-cli/issues/2241)
- **graphql-relational-schema-transformer:** fix input type casing ([#2249](https://github.com/aws-amplify/amplify-cli/issues/2249)) ([3a00d56](https://github.com/aws-amplify/amplify-cli/commit/3a00d56320f8c6a7de415e12ac9c6c4b5954d934)), closes [#2217](https://github.com/aws-amplify/amplify-cli/issues/2217)
- **graphql-relational-schema-transformer:** fix template for string keys ([#2205](https://github.com/aws-amplify/amplify-cli/issues/2205)) ([294fbc6](https://github.com/aws-amplify/amplify-cli/commit/294fbc67c7d8d806c4fe8100eb27b04571a4c811)), closes [#2133](https://github.com/aws-amplify/amplify-cli/issues/2133)
- [#2239](https://github.com/aws-amplify/amplify-cli/issues/2239) missing proper casing of input type argument ([#2246](https://github.com/aws-amplify/amplify-cli/issues/2246)) ([9d197f1](https://github.com/aws-amplify/amplify-cli/commit/9d197f1f67728935ddfb5c02c5fe53368b010b63))
- [#2260](https://github.com/aws-amplify/amplify-cli/issues/2260) - check for auth config on legacy projects ([#2261](https://github.com/aws-amplify/amplify-cli/issues/2261)) ([ba79d2a](https://github.com/aws-amplify/amplify-cli/commit/ba79d2a6c534cb1bcd4686991c80aa88ae4fbc8f))
- [#2272](https://github.com/aws-amplify/amplify-cli/issues/2272), [#2273](https://github.com/aws-amplify/amplify-cli/issues/2273) - create correct policies when IAM is the default auth ([#2276](https://github.com/aws-amplify/amplify-cli/issues/2276)) ([5ae0686](https://github.com/aws-amplify/amplify-cli/commit/5ae06868eb48f9cd8e5474af900bb5528d9740c4))
- [#2335](https://github.com/aws-amplify/amplify-cli/issues/2335) - change the transformer.conf.json version flag check logic ([b09cd37](https://github.com/aws-amplify/amplify-cli/commit/b09cd37a931c770a15b4397dd3d6631d468170a6))
- [#2347](https://github.com/aws-amplify/amplify-cli/issues/2347) - enum validation for key directive ([#2363](https://github.com/aws-amplify/amplify-cli/issues/2363)) ([1facade](https://github.com/aws-amplify/amplify-cli/commit/1facaded3095eaff5a015e76ca4d718b7bc3c938))
- [#2360](https://github.com/aws-amplify/amplify-cli/issues/2360) - meta json was written as object ([#2381](https://github.com/aws-amplify/amplify-cli/issues/2381)) ([7dd3c37](https://github.com/aws-amplify/amplify-cli/commit/7dd3c370552af31d63a4c2352c7b7453d6ab1fc0))
- **graphql-transformer-core:** try/catch on load config ([#2354](https://github.com/aws-amplify/amplify-cli/issues/2354)) ([8ed16a5](https://github.com/aws-amplify/amplify-cli/commit/8ed16a50dc953ebbc28d197d7e69904b18cf2452)), closes [pr#2348](https://github.com/pr/issues/2348)
- add layer based on region ([#2399](https://github.com/aws-amplify/amplify-cli/issues/2399)) ([c6490c5](https://github.com/aws-amplify/amplify-cli/commit/c6490c537299e74c569a80fc06d1999cc92ae774)), closes [#2386](https://github.com/aws-amplify/amplify-cli/issues/2386)
- **graphql-transformer-core:** fix migration errors ([#2245](https://github.com/aws-amplify/amplify-cli/issues/2245)) ([fd811bb](https://github.com/aws-amplify/amplify-cli/commit/fd811bbe2e08f2ade7627c8cce44c9f1dce2d9ba)), closes [#2196](https://github.com/aws-amplify/amplify-cli/issues/2196)
- conn v2 e2e test update to multi-auth ([#2264](https://github.com/aws-amplify/amplify-cli/issues/2264)) ([ac3fd09](https://github.com/aws-amplify/amplify-cli/commit/ac3fd09ae29398c525c46b560a03ea85187b70b4))
- directive generation for groups auth ([#2305](https://github.com/aws-amplify/amplify-cli/issues/2305)) ([1ce074e](https://github.com/aws-amplify/amplify-cli/commit/1ce074e2ee3097ebb8e66c3603d3617cbf36f0d4))
- fix load config withoutinit ([389e739](https://github.com/aws-amplify/amplify-cli/commit/389e73916946d16b46805ebd00f0672064539966))
- fix the amplify env checkout command ([#2339](https://github.com/aws-amplify/amplify-cli/issues/2339)) ([a96b42a](https://github.com/aws-amplify/amplify-cli/commit/a96b42a5e6d92e44018dc87cc4dbf51ff2107c09))
- fixed bug with per field auth on create ([#2327](https://github.com/aws-amplify/amplify-cli/issues/2327)) ([3206e45](https://github.com/aws-amplify/amplify-cli/commit/3206e45f401c7407acee0a248341930ede6a3dfb)), closes [#2316](https://github.com/aws-amplify/amplify-cli/issues/2316)
- fixing no-gql-override param usage in amplify push command ([#2336](https://github.com/aws-amplify/amplify-cli/issues/2336)) ([198fac4](https://github.com/aws-amplify/amplify-cli/commit/198fac4507000dcaf623981867140b92f3e3c5c5))
- generate iam policies for auth role for public rules as well ([#2258](https://github.com/aws-amplify/amplify-cli/issues/2258)) ([6bbfce3](https://github.com/aws-amplify/amplify-cli/commit/6bbfce3addeb0228088a8094f680d4e82823a305))
- multiauth-e2e typo ([#2317](https://github.com/aws-amplify/amplify-cli/issues/2317)) ([5d019a6](https://github.com/aws-amplify/amplify-cli/commit/5d019a698039d13ca4a6a83ea95468f5b0658a7c))
- the KeyTransformer class name was incorrect ([#2346](https://github.com/aws-amplify/amplify-cli/issues/2346)) ([b54ef02](https://github.com/aws-amplify/amplify-cli/commit/b54ef02b18976b8457612225aa5e67cc2a805636))

### Features

- updated version of [#2118](https://github.com/aws-amplify/amplify-cli/issues/2118) with addressed review comments ([#2230](https://github.com/aws-amplify/amplify-cli/issues/2230)) ([be3c499](https://github.com/aws-amplify/amplify-cli/commit/be3c499edcc6bec63b38e9241c5af7b83c930022))
- **amplify-graphql-types-generator:** show error msg for missing query ([#2274](https://github.com/aws-amplify/amplify-cli/issues/2274)) ([d8a2722](https://github.com/aws-amplify/amplify-cli/commit/d8a2722e82908ed3b077d9f563300c90a8d0a5da)), closes [#2228](https://github.com/aws-amplify/amplify-cli/issues/2228) [#1434](https://github.com/aws-amplify/amplify-cli/issues/1434)
- **cli:** new plugin platform ([#2254](https://github.com/aws-amplify/amplify-cli/issues/2254)) ([7ec29dd](https://github.com/aws-amplify/amplify-cli/commit/7ec29dd4f2da8c90727b36469eca646d289877b6))

# 3.1.0 (2019-09-11)

### Bug Fixes

- change text from queries to operations ([a8b0259](https://github.com/aws-amplify/amplify-cli/commit/a8b02597d7a45c71aa5da483785361c08f36f4a7))
- **amplify-category-api:** include userpool id in parameter.json ([#2238](https://github.com/aws-amplify/amplify-cli/issues/2238)) ([143b847](https://github.com/aws-amplify/amplify-cli/commit/143b84739d754f09f29f73678fd5a60674fd9304))
- **amplify-category-auth:** fix add to group cognito trigger bug [#2216](https://github.com/aws-amplify/amplify-cli/issues/2216) ([9471576](https://github.com/aws-amplify/amplify-cli/commit/9471576dbf802d2212997c616eff4c1104a4cfc0)), closes [#2214](https://github.com/aws-amplify/amplify-cli/issues/2214)
- **amplify-frontend-javascript:** fix implicit grant oauth bug ([#2213](https://github.com/aws-amplify/amplify-cli/issues/2213)) ([16c71d7](https://github.com/aws-amplify/amplify-cli/commit/16c71d7da38c1b13555fedcdadd8ff170abc3d14))
- **cli:** fix cli crash when opening editor ([#2172](https://github.com/aws-amplify/amplify-cli/issues/2172)) ([d29f14f](https://github.com/aws-amplify/amplify-cli/commit/d29f14fd47f9d6d1e49512b2b3add23ba1460644))
- **graphql-transformer-core:** dont incl in custom stacks stack mapping ([#2176](https://github.com/aws-amplify/amplify-cli/issues/2176)) ([c3bdc36](https://github.com/aws-amplify/amplify-cli/commit/c3bdc36d73ce47f01627918da57cf7a8590db89a)), closes [#2167](https://github.com/aws-amplify/amplify-cli/issues/2167)
- **graphql-transformer-core:** handle stack mapping on a new project ([#2218](https://github.com/aws-amplify/amplify-cli/issues/2218)) ([4ef6148](https://github.com/aws-amplify/amplify-cli/commit/4ef614880a5bfc4ca4520e903fcd7c85ccfca055))
- e2e test failures after merge ([#2240](https://github.com/aws-amplify/amplify-cli/issues/2240)) ([d828c6c](https://github.com/aws-amplify/amplify-cli/commit/d828c6c182e7417367a3aea4f11d257aef8888d8))
- fixing broken ios and js e2e tests ([#2237](https://github.com/aws-amplify/amplify-cli/issues/2237)) ([7436f2a](https://github.com/aws-amplify/amplify-cli/commit/7436f2a758b2a6ed6f7b32396e29aa9c5ef6c22c))
- multiauth e2e test fix ([#2244](https://github.com/aws-amplify/amplify-cli/issues/2244)) ([a721e0a](https://github.com/aws-amplify/amplify-cli/commit/a721e0aefb8ef5c48d261de1ed80f168fffccfba))

### Features

- add support for multiauth in mock server ([#2109](https://github.com/aws-amplify/amplify-cli/issues/2109)) ([fe8ee8c](https://github.com/aws-amplify/amplify-cli/commit/fe8ee8cff355a826fa9ccddcf0fad8a200a081af))
- CLI + JS and iOS sample app integration tests ([#2178](https://github.com/aws-amplify/amplify-cli/issues/2178)) ([a5e2450](https://github.com/aws-amplify/amplify-cli/commit/a5e2450c09fac2984b72e8c7c0d92084ea2c5fd6))
- implement multi-auth functionality ([#1916](https://github.com/aws-amplify/amplify-cli/issues/1916)) ([b99f58e](https://github.com/aws-amplify/amplify-cli/commit/b99f58e4a2b85cbe9f430838554ae3c277440132))
- improve error message when graphql.parse fails ([06bf940](https://github.com/aws-amplify/amplify-cli/commit/06bf94002a47b77f3e034575694683dc9776de32))

# 3.0.0-beta.0 (2019-08-29)

# 3.0.0 (2019-08-30)

### Bug Fixes

- change text from queries to operations ([a8b0259](https://github.com/aws-amplify/amplify-cli/commit/a8b02597d7a45c71aa5da483785361c08f36f4a7))
- **amplify-codegen:** await statement generation before generating types ([#2168](https://github.com/aws-amplify/amplify-cli/issues/2168)) ([4c3aad0](https://github.com/aws-amplify/amplify-cli/commit/4c3aad032924a821497eaef7cc303dfcaa09dee2)), closes [#2129](https://github.com/aws-amplify/amplify-cli/issues/2129)
- **cli:** fix cli crash when opening editor ([#2172](https://github.com/aws-amplify/amplify-cli/issues/2172)) ([d29f14f](https://github.com/aws-amplify/amplify-cli/commit/d29f14fd47f9d6d1e49512b2b3add23ba1460644))
- **graphql-elasticsearch-transformer:** changed nonKeyword types ([#2090](https://github.com/aws-amplify/amplify-cli/issues/2090)) ([c2f71eb](https://github.com/aws-amplify/amplify-cli/commit/c2f71eb8614a3d7b3f619da40f681e1397103f60)), closes [#2080](https://github.com/aws-amplify/amplify-cli/issues/2080) [#800](https://github.com/aws-amplify/amplify-cli/issues/800) [#2080](https://github.com/aws-amplify/amplify-cli/issues/2080) [re#800](https://github.com/re/issues/800)

### Features

- improve error message when graphql.parse fails ([06bf940](https://github.com/aws-amplify/amplify-cli/commit/06bf94002a47b77f3e034575694683dc9776de32))

## 2.0.1-connectionsv2.0 (2019-08-29)

### Bug Fixes

- **amplify-util-mock:** built after rebase ([841d3ac](https://github.com/aws-amplify/amplify-cli/commit/841d3ac00c9276c7c8b66e810de395010c2d8974))
- **graphql-connection-transformer:** changes based on cr ([d5ff660](https://github.com/aws-amplify/amplify-cli/commit/d5ff660e83bad8db3fc738dacf5510218442522a))
- **graphql-relational-schema-transformer:** fixed failing test ([98a7beb](https://github.com/aws-amplify/amplify-cli/commit/98a7bebd92dd72df2e01ec955def6e8df42df89a))

### Features

- **graphql-relation-transformer:** added get item and style changes ([6e01583](https://github.com/aws-amplify/amplify-cli/commit/6e01583f62fe72f1860eace65dceb260b511c65d))
- **graphql-relation-transformer:** added queries by sort key ([2a447a7](https://github.com/aws-amplify/amplify-cli/commit/2a447a770e703cbfcfbda8c7990445be35d4a09f))
- **graphql-relation-transformer:** added query functionality ([059ae8b](https://github.com/aws-amplify/amplify-cli/commit/059ae8ba35e1862f94f79be31a17ee73ff2680fe))
- **graphql-relation-transformer:** added shell for relation directive ([c3ad68b](https://github.com/aws-amplify/amplify-cli/commit/c3ad68b6c0c68d029163b81b1b651b29acf353ef))

## 2.0.1-beta.0 (2019-08-30)

### Bug Fixes

- change text from queries to operations ([a8b0259](https://github.com/aws-amplify/amplify-cli/commit/a8b02597d7a45c71aa5da483785361c08f36f4a7))
- **amplify-category-predictions:** cfn template fix ([#2159](https://github.com/aws-amplify/amplify-cli/issues/2159)) ([5b550b5](https://github.com/aws-amplify/amplify-cli/commit/5b550b5ba458557f2f9c849a29e8462dd6c86317))
- **amplify-codegen:** await statement generation before generating types ([#2168](https://github.com/aws-amplify/amplify-cli/issues/2168)) ([4c3aad0](https://github.com/aws-amplify/amplify-cli/commit/4c3aad032924a821497eaef7cc303dfcaa09dee2)), closes [#2129](https://github.com/aws-amplify/amplify-cli/issues/2129)
- **cli:** fix cli crash when opening editor ([#2172](https://github.com/aws-amplify/amplify-cli/issues/2172)) ([d29f14f](https://github.com/aws-amplify/amplify-cli/commit/d29f14fd47f9d6d1e49512b2b3add23ba1460644))
- **cli:** prevent cli crash when default editor is missing ([#2163](https://github.com/aws-amplify/amplify-cli/issues/2163)) ([67769fb](https://github.com/aws-amplify/amplify-cli/commit/67769fb628978fffbf6f58a1048e0fb09893d524))
- **cli:** update inquirer validation function to return msg ([#2166](https://github.com/aws-amplify/amplify-cli/issues/2166)) ([b3b8c21](https://github.com/aws-amplify/amplify-cli/commit/b3b8c212a371027320eca97aad1c4edb95eace71)), closes [#2164](https://github.com/aws-amplify/amplify-cli/issues/2164)
- **graphql-elasticsearch-transformer:** changed nonKeyword types ([#2090](https://github.com/aws-amplify/amplify-cli/issues/2090)) ([c2f71eb](https://github.com/aws-amplify/amplify-cli/commit/c2f71eb8614a3d7b3f619da40f681e1397103f60)), closes [#2080](https://github.com/aws-amplify/amplify-cli/issues/2080) [#800](https://github.com/aws-amplify/amplify-cli/issues/800) [#2080](https://github.com/aws-amplify/amplify-cli/issues/2080) [re#800](https://github.com/re/issues/800)

### Features

- improve error message when graphql.parse fails ([06bf940](https://github.com/aws-amplify/amplify-cli/commit/06bf94002a47b77f3e034575694683dc9776de32))

# 2.0.0-beta.0 (2019-08-27)

# 2.0.0 (2019-08-27)

### Bug Fixes

- **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad863ad4febde47e56209d6026cddb344044))
- **amplify-category-predictions:** changing the predictions lambda trigger time out to 15 mins ([#1956](https://github.com/aws-amplify/amplify-cli/issues/1956)) ([a05f634](https://github.com/aws-amplify/amplify-cli/commit/a05f634c3c0130c7e16f83605153828375f8b7f6))
- **amplify-dynamodb-simulator:** update simulator to work in docker ([#2061](https://github.com/aws-amplify/amplify-cli/issues/2061)) ([90a423c](https://github.com/aws-amplify/amplify-cli/commit/90a423cc1ecaff3dc8ebb9b5e526e1256d36d835)), closes [#2037](https://github.com/aws-amplify/amplify-cli/issues/2037)
- **amplify-e2e-tests:** fixing predictions e2e tests ([#1969](https://github.com/aws-amplify/amplify-cli/issues/1969)) ([6c6bbb2](https://github.com/aws-amplify/amplify-cli/commit/6c6bbb26589a12aefc2f77ad059cbc65d6589a24))
- **amplify-graphql-types-generator:** generate valid swift code ([2f25bf7](https://github.com/aws-amplify/amplify-cli/commit/2f25bf779af0cd92b9bbc3b834f8410af4d2c3a4)), closes [#1903](https://github.com/aws-amplify/amplify-cli/issues/1903)
- **amplify-provider-awscloudformation:** apigw unauth access ([#1906](https://github.com/aws-amplify/amplify-cli/issues/1906)) ([bcd0d02](https://github.com/aws-amplify/amplify-cli/commit/bcd0d02a229d3dab2e5babc40b68ac9090aa5f15))
- **amplify-util-mock:** handle unsupported data source gracefully ([#1999](https://github.com/aws-amplify/amplify-cli/issues/1999)) ([f7cfe3e](https://github.com/aws-amplify/amplify-cli/commit/f7cfe3e01be7a3abe45a1129419f2306924b4ebe)), closes [#1997](https://github.com/aws-amplify/amplify-cli/issues/1997)
- **amplify-util-mock:** include custom resolver templates ([#2119](https://github.com/aws-amplify/amplify-cli/issues/2119)) ([f7174a7](https://github.com/aws-amplify/amplify-cli/commit/f7174a7b0bf09023e620cb4e2f4b0c7ccc154eea)), closes [#2049](https://github.com/aws-amplify/amplify-cli/issues/2049) [#2004](https://github.com/aws-amplify/amplify-cli/issues/2004)
- **amplify-util-mock:** prevent resolver file overwrite in windows ([#2007](https://github.com/aws-amplify/amplify-cli/issues/2007)) ([5b78d25](https://github.com/aws-amplify/amplify-cli/commit/5b78d25519228085c5a0010ef90ac01cf161ccff)), closes [#2006](https://github.com/aws-amplify/amplify-cli/issues/2006)
- **amplify-util-mock:** support large response from lambda ([#2060](https://github.com/aws-amplify/amplify-cli/issues/2060)) ([60efd28](https://github.com/aws-amplify/amplify-cli/commit/60efd2889bf59f533efe9aed9a39886eca296d1e))
- **graphql-connection-transformer:** fix self connection bug ([#1944](https://github.com/aws-amplify/amplify-cli/issues/1944)) ([1a6affc](https://github.com/aws-amplify/amplify-cli/commit/1a6affc7cc5ba0d59c908b6f6a58852013d22343)), closes [#1799](https://github.com/aws-amplify/amplify-cli/issues/1799)
- **graphql-dynamodb-transformer:** added scan index forward ([72cda1e](https://github.com/aws-amplify/amplify-cli/commit/72cda1e178b2fd87e42b200efbc5c87e49c964b1)), closes [#1676](https://github.com/aws-amplify/amplify-cli/issues/1676)
- [#1056](https://github.com/aws-amplify/amplify-cli/issues/1056), dedup environment file reading ([#2088](https://github.com/aws-amplify/amplify-cli/issues/2088)) ([940deaa](https://github.com/aws-amplify/amplify-cli/commit/940deaa6bbe7370e40e61946d0f1073623ba6e90))
- **graphql-elasticsearch-transformer:** fixed es req template ([311f57d](https://github.com/aws-amplify/amplify-cli/commit/311f57d9938aa78c83c7c695ddd39457b89c8afc))
- [#1715](https://github.com/aws-amplify/amplify-cli/issues/1715) - Fix stack enumeration so transform.conf.json will be generated ([#2114](https://github.com/aws-amplify/amplify-cli/issues/2114)) ([d1b266b](https://github.com/aws-amplify/amplify-cli/commit/d1b266bb11dfb47e7b125d50235ce65b3e98319e))
- [#1720](https://github.com/aws-amplify/amplify-cli/issues/1720) - fix GraphQL name generation for [@key](https://github.com/key) ([#2093](https://github.com/aws-amplify/amplify-cli/issues/2093)) ([51716f3](https://github.com/aws-amplify/amplify-cli/commit/51716f340e820358087d68fd9e926084c10565eb))
- [#1978](https://github.com/aws-amplify/amplify-cli/issues/1978), adding update command to function category command list ([#2031](https://github.com/aws-amplify/amplify-cli/issues/2031)) ([8195152](https://github.com/aws-amplify/amplify-cli/commit/819515221314e247cfa2a498d6a90994e93462b6))
- [#2013](https://github.com/aws-amplify/amplify-cli/issues/2013) - Dynamic group auth when groups field is null ([#2097](https://github.com/aws-amplify/amplify-cli/issues/2097)) ([4ad3d5c](https://github.com/aws-amplify/amplify-cli/commit/4ad3d5cf34f689867ce3929f8fa84e751985fbfe))
- [#2032](https://github.com/aws-amplify/amplify-cli/issues/2032) - add AWSTimestamp and AWSIPAddress types to mock ([#2116](https://github.com/aws-amplify/amplify-cli/issues/2116)) ([77e2e69](https://github.com/aws-amplify/amplify-cli/commit/77e2e69af6065b014818a9ef4324027f566acca2))
- [#2033](https://github.com/aws-amplify/amplify-cli/issues/2033) - Make sure key field order is preserved ([#2117](https://github.com/aws-amplify/amplify-cli/issues/2117)) ([58f8f76](https://github.com/aws-amplify/amplify-cli/commit/58f8f76ec2738d65f65568e5f4157d5ada0976c5))
- [#223](https://github.com/aws-amplify/amplify-cli/issues/223) - Generate table name instead of resource name in CRUD Lambda ([#2107](https://github.com/aws-amplify/amplify-cli/issues/2107)) ([ad7c257](https://github.com/aws-amplify/amplify-cli/commit/ad7c25798b007954fb6b56c73d24a0fe9f163d6c))
- [#429](https://github.com/aws-amplify/amplify-cli/issues/429) - Editor hanging bug ([#2086](https://github.com/aws-amplify/amplify-cli/issues/2086)) ([6767445](https://github.com/aws-amplify/amplify-cli/commit/676744549f903fa3a4804d814eb325301ed462ba))
- fix [#1205](https://github.com/aws-amplify/amplify-cli/issues/1205) ([#1961](https://github.com/aws-amplify/amplify-cli/issues/1961)) ([e8d8b97](https://github.com/aws-amplify/amplify-cli/commit/e8d8b97cf337d86417e1be1dc52dff2740253d9e))
- fix metric agent for tracking CLI usage ([#2024](https://github.com/aws-amplify/amplify-cli/issues/2024)) ([a2742a6](https://github.com/aws-amplify/amplify-cli/commit/a2742a68b8a26000765ad22ed0a8fc28ef0d32fc))
- Fix package.json exists check for functions ([#2030](https://github.com/aws-amplify/amplify-cli/issues/2030)) ([a5283b7](https://github.com/aws-amplify/amplify-cli/commit/a5283b72c780a065c735ef3cd6baaae35476a7f8))
- **graphql-key-transformer:** added sort direction ([a0f9f30](https://github.com/aws-amplify/amplify-cli/commit/a0f9f30d4141f3574f34cd5d7183471044b12935)), closes [#1676](https://github.com/aws-amplify/amplify-cli/issues/1676)
- **graphql-key-transformer:** key req resolver edit ([c4a9da5](https://github.com/aws-amplify/amplify-cli/commit/c4a9da51b2db2d411fcb016934ffdd8e8425313c)), closes [#1676](https://github.com/aws-amplify/amplify-cli/issues/1676) [#1990](https://github.com/aws-amplify/amplify-cli/issues/1990) [#1629](https://github.com/aws-amplify/amplify-cli/issues/1629)
- local mock fix ([#1982](https://github.com/aws-amplify/amplify-cli/issues/1982)) ([8ee9029](https://github.com/aws-amplify/amplify-cli/commit/8ee90298189f4d3140ab84fe2d40d16bcb95485f))
- move test package dependencies to devDependencies ([#2034](https://github.com/aws-amplify/amplify-cli/issues/2034)) ([f5623d0](https://github.com/aws-amplify/amplify-cli/commit/f5623d04a43e685901f4f1cd96e2a227164c71ee))
- regression for e2e tests because of nexpect reference ([#2120](https://github.com/aws-amplify/amplify-cli/issues/2120)) ([7659500](https://github.com/aws-amplify/amplify-cli/commit/7659500225091d4bf3b84c9ac7fee1931716dce9))

### Features

- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e5346ee1f27a2e9bee25fbbdcb19417f5230f))
- **amplify-provider-awscloudformation:** hooks ([#1951](https://github.com/aws-amplify/amplify-cli/issues/1951)) ([caba157](https://github.com/aws-amplify/amplify-cli/commit/caba1579812f6e5c93007bec7c8b3c8cdf005eb2))
- narrow-down idp roles scope ([#1974](https://github.com/aws-amplify/amplify-cli/issues/1974)) ([ccfd508](https://github.com/aws-amplify/amplify-cli/commit/ccfd5085dc8fdbaf90d3a3646e8c10e26a5f583d))
- **amplify-util-mock:** add support for S3 triggers in local mocking ([#2101](https://github.com/aws-amplify/amplify-cli/issues/2101)) ([ac9a134](https://github.com/aws-amplify/amplify-cli/commit/ac9a13469704f9c3cfa584760087e389380add3d))

* Adding Auth on Subscriptions (#2068) ([81c630d](https://github.com/aws-amplify/amplify-cli/commit/81c630d782a6be720e513677a34b7a7dacbdc629)), closes [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068) [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068)

### BREAKING CHANGES

- If an owner is used in the auth directive it will either be a requirement if it's
  the only rule or an optional input if used with other rules
- If an owner is included in the auth directive it will either be a requirement if
  it's the only rule or an optional input if used with other rules
- the subscription operations will require an argument if owner is the only auth rule
- Subscriptions will require an argument if an owner is only rule set - If owner &
  group rules are owner will be an optional arg

## 1.9.1-beta.0 (2019-08-01)

### Bug Fixes

- fixing force push on init of new env ([#1949](https://github.com/aws-amplify/amplify-cli/issues/1949)) ([d4d0c97](https://github.com/aws-amplify/amplify-cli/commit/d4d0c97d6445630ed49d669531cebb1bcd9e0218)), closes [#1945](https://github.com/aws-amplify/amplify-cli/issues/1945)
- **amplify-category-storage:** remove unnecessary comma ([#1755](https://github.com/aws-amplify/amplify-cli/issues/1755)) ([854c4c6](https://github.com/aws-amplify/amplify-cli/commit/854c4c692a572c2068f855d4552deda3eca9e234))

# 1.9.0 (2019-07-31)

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c1927da10f8c54f38a523021187361131c))

## 1.8.7-predictions.0 (2019-07-31)

### Features

- adding amplify cli predictions category ([6d6ac10](https://github.com/aws-amplify/amplify-cli/commit/6d6ac10bb720228eaff57b468b47b1292bfe02ff))

## 1.8.7-beta.0 (2019-07-31)

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c1927da10f8c54f38a523021187361131c))
- sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe8925a4e73358b03ba927267a2df328b78))

## 1.8.6 (2019-07-30)

### Bug Fixes

- **amplify-category-auth:** remove check on dependsOn length ([c8a26f1](https://github.com/aws-amplify/amplify-cli/commit/c8a26f1351b42b43e973e19820dfef69b8819b81))
- **amplify-category-auth:** setting dependsOn in meta ([7a33f02](https://github.com/aws-amplify/amplify-cli/commit/7a33f026b5b01f93df449fbb755f3ce03fe8f40c))

## 1.8.5-beta.0 (2019-07-24)

## 1.8.5 (2019-07-24)

## 1.8.4-beta.0 (2019-07-23)

## 1.8.4 (2019-07-23)

## 1.8.3-beta.0 (2019-07-23)

## 1.8.3 (2019-07-23)

### Bug Fixes

- **amplify-category-auth:** adding PreAuthentication trigger ([42ee201](https://github.com/aws-amplify/amplify-cli/commit/42ee201051c3e4079837ebcc14bdba43fce45f8d)), closes [#1838](https://github.com/aws-amplify/amplify-cli/issues/1838)
- **amplify-category-storage:** consider env in S3TriggerBucketPolicy ([#1853](https://github.com/aws-amplify/amplify-cli/issues/1853)) ([73dbe84](https://github.com/aws-amplify/amplify-cli/commit/73dbe84262c94203dfbd8b54298905cba5f317fd)), closes [#1852](https://github.com/aws-amplify/amplify-cli/issues/1852)
- **amplify-codegen:** fix cross os issue ([#1741](https://github.com/aws-amplify/amplify-cli/issues/1741)) ([ae20d0d](https://github.com/aws-amplify/amplify-cli/commit/ae20d0dff97e08dbbea462fd6c12da550b70e799)), closes [#1522](https://github.com/aws-amplify/amplify-cli/issues/1522)
- **amplify-provider-awscloudformation:** fix MFA prompt during init ([#1858](https://github.com/aws-amplify/amplify-cli/issues/1858)) ([2de3185](https://github.com/aws-amplify/amplify-cli/commit/2de31854252e1d2ca994266d5442d8d5190f7754)), closes [#1807](https://github.com/aws-amplify/amplify-cli/issues/1807)
- remove grunt-lambda dependency for local function testing ([#1872](https://github.com/aws-amplify/amplify-cli/issues/1872)) ([bbe55bf](https://github.com/aws-amplify/amplify-cli/commit/bbe55bf6cdc626270ba738fdd5f2fbc33277525b))

## 1.8.2-beta.0 (2019-07-16)

## 1.8.2 (2019-07-16)

### Bug Fixes

- **amplify-category-function:** fixing headless params ([#1828](https://github.com/aws-amplify/amplify-cli/issues/1828)) ([816e526](https://github.com/aws-amplify/amplify-cli/commit/816e52664df85ed8009a3e9ee6bd493d238591ee)), closes [#1826](https://github.com/aws-amplify/amplify-cli/issues/1826) [#1826](https://github.com/aws-amplify/amplify-cli/issues/1826)

## 1.8.1-beta.0 (2019-07-10)

## 1.8.1 (2019-07-10)

### Bug Fixes

- check that function-parameters.json exists before trying to read it ([#1808](https://github.com/aws-amplify/amplify-cli/issues/1808)) ([574218d](https://github.com/aws-amplify/amplify-cli/commit/574218d732fc0d357f7c72a0a59e0c968cddeff5))

# 1.8.0 (2019-07-09)

## 1.7.9-beta.1 (2019-07-09)

### Bug Fixes

- replacing rel paths with plugin func ([71f553f](https://github.com/aws-amplify/amplify-cli/commit/71f553fd21a85da9ac6a54f9fbe070ea4a3debf1))

## 1.7.9-beta.0 (2019-07-09)

### Bug Fixes

- **amplify-category-function:** enable SAM templates for functions ([#1763](https://github.com/aws-amplify/amplify-cli/issues/1763)) ([9fc3854](https://github.com/aws-amplify/amplify-cli/commit/9fc3854857e61f7d1349c1fad0db1bb2d7cbaa17)), closes [#1740](https://github.com/aws-amplify/amplify-cli/issues/1740)
- **amplify-category-function:** open Editor fix for displayname ([#1798](https://github.com/aws-amplify/amplify-cli/issues/1798)) ([e62aba6](https://github.com/aws-amplify/amplify-cli/commit/e62aba69b268e50d806f45630cc666262f5337c6))

### Features

- cognito + s3 + dyanmodb lambda trigger support ([#1783](https://github.com/aws-amplify/amplify-cli/issues/1783)) ([c6fc838](https://github.com/aws-amplify/amplify-cli/commit/c6fc83834ae70f3e0f5e1c8810a56de76ba36d41))

## 1.7.8-beta.0 (2019-06-30)

## 1.7.8 (2019-06-30)

## 1.7.7-beta.0 (2019-06-29)

### Bug Fixes

- fixing function build issue + e2e tests ([#1750](https://github.com/aws-amplify/amplify-cli/issues/1750)) ([c11c0bc](https://github.com/aws-amplify/amplify-cli/commit/c11c0bcadde3281836de0fd4ab79e17f30b2d127)), closes [#1747](https://github.com/aws-amplify/amplify-cli/issues/1747)

## 1.7.6-beta.0 (2019-06-25)

## 1.7.6 (2019-06-26)

### Bug Fixes

- **amplify-category-api:** fix init env bug ([#1715](https://github.com/aws-amplify/amplify-cli/issues/1715)) ([1e21371](https://github.com/aws-amplify/amplify-cli/commit/1e21371900c315ca9fcbb9bcb1f4c8ec9800ee86)), closes [#1713](https://github.com/aws-amplify/amplify-cli/issues/1713)
- **amplify-category-function:** add policy for GSI ([#1618](https://github.com/aws-amplify/amplify-cli/issues/1618)) ([cc2f1b6](https://github.com/aws-amplify/amplify-cli/commit/cc2f1b66963b91e34169455e6dcdb04bb1cc9f87)), closes [#791](https://github.com/aws-amplify/amplify-cli/issues/791)
- **amplify-provider-awscloudformation:** generate consistent S3 keys ([#1668](https://github.com/aws-amplify/amplify-cli/issues/1668)) ([e393d3a](https://github.com/aws-amplify/amplify-cli/commit/e393d3af95b9f59caeede867bd33e8f7a8d590b5)), closes [#1666](https://github.com/aws-amplify/amplify-cli/issues/1666)
- **graphql-key-transformer:** Fix type resolve for 2 field [@key](https://github.com/key) when second field is an Enum ([#1619](https://github.com/aws-amplify/amplify-cli/issues/1619)) ([bbd82b0](https://github.com/aws-amplify/amplify-cli/commit/bbd82b067a140320a399128bb9c3a5c995358c40)), closes [#1572](https://github.com/aws-amplify/amplify-cli/issues/1572)

### Features

- **amplify-category-function:** provide evntName arg to lambda_invoke ([#1624](https://github.com/aws-amplify/amplify-cli/issues/1624)) ([a61237f](https://github.com/aws-amplify/amplify-cli/commit/a61237ff51a26fbf93ee423b43a34d89c06acf57))
- **amplify-provider-awscloudformation:** update fn build file name ([#1702](https://github.com/aws-amplify/amplify-cli/issues/1702)) ([0658d75](https://github.com/aws-amplify/amplify-cli/commit/0658d7559dfd6e857aeb9e4a6dd96ce5d013e610))

## 1.7.5-beta.0 (2019-06-20)

## 1.7.5 (2019-06-20)

### Bug Fixes

- **cli:** fix inquirer version ([#1690](https://github.com/aws-amplify/amplify-cli/issues/1690)) ([9246032](https://github.com/aws-amplify/amplify-cli/commit/9246032603db49022c444e41faa5881592ce5dc9)), closes [#1688](https://github.com/aws-amplify/amplify-cli/issues/1688)

## 1.7.4-beta.0 (2019-06-18)

## 1.7.4 (2019-06-18)

### Bug Fixes

- **amplify-category-function:** fixed openEditor ([#1664](https://github.com/aws-amplify/amplify-cli/issues/1664)) ([0b9cf28](https://github.com/aws-amplify/amplify-cli/commit/0b9cf281c258f4e031d606431938244f6ec4d0c1))
- **amplify-provider-awscloudformation:** prevent abrupt closing of CLI ([#1655](https://github.com/aws-amplify/amplify-cli/issues/1655)) ([cf755df](https://github.com/aws-amplify/amplify-cli/commit/cf755df4e9268614c1c2210199750098e86b9b85))

## 1.7.3-beta.1 (2019-06-12)

### Bug Fixes

- **amplify-category-interactions:** call updateMetaAfterAdd only once ([#1653](https://github.com/aws-amplify/amplify-cli/issues/1653)) ([dc28758](https://github.com/aws-amplify/amplify-cli/commit/dc28758c647ea6d5381d25a02d84cce8a548c87d)), closes [#1621](https://github.com/aws-amplify/amplify-cli/issues/1621)

## 1.7.3-beta.0 (2019-06-11)

## 1.7.3 (2019-06-12)

### Bug Fixes

- **amplify-category-interactions:** call updateMetaAfterAdd only once ([#1653](https://github.com/aws-amplify/amplify-cli/issues/1653)) ([dc28758](https://github.com/aws-amplify/amplify-cli/commit/dc28758c647ea6d5381d25a02d84cce8a548c87d)), closes [#1621](https://github.com/aws-amplify/amplify-cli/issues/1621)
- **cli:** add default value for options in updateAmplifyMeta ([#1648](https://github.com/aws-amplify/amplify-cli/issues/1648)) ([f9c87bb](https://github.com/aws-amplify/amplify-cli/commit/f9c87bb4364c18da42e526c886c9941ff5266254)), closes [#1621](https://github.com/aws-amplify/amplify-cli/issues/1621)

## 1.7.2-beta.0 (2019-06-11)

## 1.7.2 (2019-06-11)

### Bug Fixes

- **amplify-category-auth:** provide correct arn in permission policies ([#1610](https://github.com/aws-amplify/amplify-cli/issues/1610)) ([27fd157](https://github.com/aws-amplify/amplify-cli/commit/27fd157f8fd6d226772e164477748e1b28a4819f))
- **amplify-category-notifications:** remove env name ([#1440](https://github.com/aws-amplify/amplify-cli/issues/1440)) ([19ff63c](https://github.com/aws-amplify/amplify-cli/commit/19ff63cce2865e3f50b1ef24693a5611ed5547d4)), closes [#1372](https://github.com/aws-amplify/amplify-cli/issues/1372)
- **amplify-cli:** return valid JSON when using amplify env get --json ([#1622](https://github.com/aws-amplify/amplify-cli/issues/1622)) ([49f4339](https://github.com/aws-amplify/amplify-cli/commit/49f4339303bb3f06c32ce0a41d3979007de92343)), closes [#1616](https://github.com/aws-amplify/amplify-cli/issues/1616)
- fixing the IAM policies for AppSync API ([#1634](https://github.com/aws-amplify/amplify-cli/issues/1634)) ([9fb2fa9](https://github.com/aws-amplify/amplify-cli/commit/9fb2fa956d9d86b07c837a547766000fe88d3011))
- typo in CONTRIBUTING.md ([#1631](https://github.com/aws-amplify/amplify-cli/issues/1631)) ([dfad5fc](https://github.com/aws-amplify/amplify-cli/commit/dfad5fc06afbd056d8a8cce5af29808235092bdd))
- **cli:** support es6 import/export ([#1635](https://github.com/aws-amplify/amplify-cli/issues/1635)) ([18d5409](https://github.com/aws-amplify/amplify-cli/commit/18d5409e80c13d2a1d700be846af3f0af5c67dc2)), closes [#1623](https://github.com/aws-amplify/amplify-cli/issues/1623)
- **graphql-key-transformer:** 1587 bug fix ([3a04e19](https://github.com/aws-amplify/amplify-cli/commit/3a04e19c89d133af281f943062a65b090872d868)), closes [#1587](https://github.com/aws-amplify/amplify-cli/issues/1587)

### Features

- add graphQLEndpoint as an env var to lambda functions ([#1641](https://github.com/aws-amplify/amplify-cli/issues/1641)) ([ae825a6](https://github.com/aws-amplify/amplify-cli/commit/ae825a61514f7e173da012326a2f5de0de0626e4)), closes [#1620](https://github.com/aws-amplify/amplify-cli/issues/1620)

## 1.7.1-beta.0 (2019-06-06)

## 1.7.1 (2019-06-06)

### Bug Fixes

- **amplify-category-auth:** fix domain reserved words ([#1544](https://github.com/aws-amplify/amplify-cli/issues/1544)) ([31d4a89](https://github.com/aws-amplify/amplify-cli/commit/31d4a89173a1cc068160c13cdaaa68f4b7e4f64f)), closes [#1513](https://github.com/aws-amplify/amplify-cli/issues/1513)
- **amplify-category-hosting:** fix CloudFront invalidation bug ([#1553](https://github.com/aws-amplify/amplify-cli/issues/1553)) ([2a5ef17](https://github.com/aws-amplify/amplify-cli/commit/2a5ef17a2197809140fd0733fe6053ced9fc67b1)), closes [#1550](https://github.com/aws-amplify/amplify-cli/issues/1550)
- **amplify-provider-awscloudformation:** filter by template extensions ([#1596](https://github.com/aws-amplify/amplify-cli/issues/1596)) ([adbf95a](https://github.com/aws-amplify/amplify-cli/commit/adbf95ac532492f5104f9d699f8cd508e0c68f4a))
- fixing auth update flow ([#1579](https://github.com/aws-amplify/amplify-cli/issues/1579)) ([65783b5](https://github.com/aws-amplify/amplify-cli/commit/65783b57ff85e2059d018eff8a977840077b120b))
- **amplify-provider-awscloudformation:** fix general configeLevel init ([#1602](https://github.com/aws-amplify/amplify-cli/issues/1602)) ([426acbf](https://github.com/aws-amplify/amplify-cli/commit/426acbf121e1d6ba5e62f15dc1c295c6b7c79fa9)), closes [#1388](https://github.com/aws-amplify/amplify-cli/issues/1388)
- **amplify-provider-awscloudformation:** fix http proxy ([#1604](https://github.com/aws-amplify/amplify-cli/issues/1604)) ([16dc4b4](https://github.com/aws-amplify/amplify-cli/commit/16dc4b4cc19b9474dad147391a46738241763e57)), closes [#495](https://github.com/aws-amplify/amplify-cli/issues/495)
- **graphql-key-transformer:** update filter to emit JSON for filter expression([#1580](https://github.com/aws-amplify/amplify-cli/issues/1580)) ([8c9a3cd](https://github.com/aws-amplify/amplify-cli/commit/8c9a3cdec157242e104dd4c38f7f60ffd458371e)), closes [#1554](https://github.com/aws-amplify/amplify-cli/issues/1554)
- fixing ref name values in function cfn templates ([#1605](https://github.com/aws-amplify/amplify-cli/issues/1605)) ([3bda285](https://github.com/aws-amplify/amplify-cli/commit/3bda2852ef0433e80f8e415d8ca34a340d25588b)), closes [#1574](https://github.com/aws-amplify/amplify-cli/issues/1574)
- spelling mistakes in cli output ([#1588](https://github.com/aws-amplify/amplify-cli/issues/1588)) ([787ac57](https://github.com/aws-amplify/amplify-cli/commit/787ac57e2d34090173f6913df84e7e9b6199f8e5))

# 1.7.0 (2019-05-29)

### Bug Fixes

- **amplify-category-auth:** add policy name char length limit ([#1492](https://github.com/aws-amplify/amplify-cli/issues/1492)) ([d6a8785](https://github.com/aws-amplify/amplify-cli/commit/d6a87859e527bf94bff10382f7fea78b8f94cdf1)), closes [#1199](https://github.com/aws-amplify/amplify-cli/issues/1199)
- **amplify-category-auth:** match cognito token expiration date range ([eb4c9ee](https://github.com/aws-amplify/amplify-cli/commit/eb4c9eecc92ba1cdb9959f173e806f71c601f750)), closes [#1385](https://github.com/aws-amplify/amplify-cli/issues/1385)
- **amplify-codegen:** auto detect S3Object in swift codegen ([#1482](https://github.com/aws-amplify/amplify-cli/issues/1482)) ([ea2de2d](https://github.com/aws-amplify/amplify-cli/commit/ea2de2d710a62446e6a8fbbdc946e7f575a770d3)), closes [#1468](https://github.com/aws-amplify/amplify-cli/issues/1468)
- **amplify-graphql-types-generator:** set AWSTimestamp to number type ([#1483](https://github.com/aws-amplify/amplify-cli/issues/1483)) ([86fb2f1](https://github.com/aws-amplify/amplify-cli/commit/86fb2f19b40a4f6fc081454871d64c7ad2caeaf9)), closes [#1348](https://github.com/aws-amplify/amplify-cli/issues/1348)
- **graphql-dynamodb-transformer:** backward compatibility ([de3e47c](https://github.com/aws-amplify/amplify-cli/commit/de3e47c0e2cfec57cff5183797770635c507d5fe))
- **graphql-elasticsearch-transformer:** use Fn::GetAtt for StreamArn ([#1494](https://github.com/aws-amplify/amplify-cli/issues/1494)) ([8c80462](https://github.com/aws-amplify/amplify-cli/commit/8c8046214d1abbfd2f3752fec8ff6c1d3dd104ce)), closes [/github.com/aws-amplify/amplify-cli/commit/df1712b00427792bcce34adf7027698afd8e6841#diff-22e2a5351fb3f897025bc1e45811acb5R168](https://github.com//github.com/aws-amplify/amplify-cli/commit/df1712b00427792bcce34adf7027698afd8e6841/issues/diff-22e2a5351fb3f897025bc1e45811acb5R168)
- **graphql-function-transformer:** handle NONE env in [@function](https://github.com/function) ([#1491](https://github.com/aws-amplify/amplify-cli/issues/1491)) ([c742d7d](https://github.com/aws-amplify/amplify-cli/commit/c742d7dff987f6e97856dba261a98581390cd6f0))
- **graphql-relational-schema-transformer:** add additional RDS Policies ([#1508](https://github.com/aws-amplify/amplify-cli/issues/1508)) ([b1dcd08](https://github.com/aws-amplify/amplify-cli/commit/b1dcd08318538fa55e3631a10f61d26120d1d913))
- **graphql-relational-schema-transformer:** support \_ in table name ([17e9a04](https://github.com/aws-amplify/amplify-cli/commit/17e9a0433568b16dc5579c391f3d13c2282b4962)), closes [#1504](https://github.com/aws-amplify/amplify-cli/issues/1504)
- stringify region in function Cloudformation file ([#1536](https://github.com/aws-amplify/amplify-cli/issues/1536)) ([cb6f438](https://github.com/aws-amplify/amplify-cli/commit/cb6f438b22332d14b994ca866aa74d55c974a60f))

### Features

- **amplify-provider-awscloudformation:** add http default transformer ([#1410](https://github.com/aws-amplify/amplify-cli/issues/1410)) ([41cd9d0](https://github.com/aws-amplify/amplify-cli/commit/41cd9d0bbfbb0c7cbf1eb853e469262fffb8ee41))
- **graphql-dynamodb-transformer:** add more specific mapping ([5dc2d3b](https://github.com/aws-amplify/amplify-cli/commit/5dc2d3bc85c5b89d300c30cc20928b175592c9d9))
- **graphql-dynamodb-transformer:** always output stream arn ([df1712b](https://github.com/aws-amplify/amplify-cli/commit/df1712b00427792bcce34adf7027698afd8e6841)), closes [#980](https://github.com/aws-amplify/amplify-cli/issues/980)
- feature/[@key](https://github.com/key) ([#1463](https://github.com/aws-amplify/amplify-cli/issues/1463)) ([00ed819](https://github.com/aws-amplify/amplify-cli/commit/00ed819419a4959a6d62da2fc5477621c046eff0))
- flow to add policies to access amplify resources from Lambda ([#1462](https://github.com/aws-amplify/amplify-cli/issues/1462)) ([fee247c](https://github.com/aws-amplify/amplify-cli/commit/fee247c74f54b050f7b7a6ea0733fbd08976f232))

## 1.6.9-beta.0 (2019-05-16)

## 1.6.9 (2019-05-16)

### Bug Fixes

- **amplify-category-storage:** pass context to DDB migration helper ([#1392](https://github.com/aws-amplify/amplify-cli/issues/1392)) ([dbec705](https://github.com/aws-amplify/amplify-cli/commit/dbec7053eb669c290d27142ef5e23a78a1a697bd)), closes [#1384](https://github.com/aws-amplify/amplify-cli/issues/1384)
- **amplify-provider-awscloudformation:** check creds before setting ([#1438](https://github.com/aws-amplify/amplify-cli/issues/1438)) ([0c2e2d1](https://github.com/aws-amplify/amplify-cli/commit/0c2e2d18748b31ccb3e98a1b6cbbde41d653314d)), closes [#1424](https://github.com/aws-amplify/amplify-cli/issues/1424)
- **amplify-provider-awscloudformation:** ensure build directory exist ([#1435](https://github.com/aws-amplify/amplify-cli/issues/1435)) ([a82fa99](https://github.com/aws-amplify/amplify-cli/commit/a82fa991b61bdf511d4b749c4d67fde897af3282)), closes [#1430](https://github.com/aws-amplify/amplify-cli/issues/1430) [#1430](https://github.com/aws-amplify/amplify-cli/issues/1430)
- **graphql-dynamodb-transformer:** always output datasource name ([#1182](https://github.com/aws-amplify/amplify-cli/issues/1182)) ([a58e1ac](https://github.com/aws-amplify/amplify-cli/commit/a58e1ac51faa2cf558c2eed81d27c619c3a40e92))
- conditionally generation of oAuth config for iOS and Android [#1472](https://github.com/aws-amplify/amplify-cli/issues/1472) ([3767192](https://github.com/aws-amplify/amplify-cli/commit/37671920ee33d0115ab28284aa31ebfb0dd036e5)), closes [#1470](https://github.com/aws-amplify/amplify-cli/issues/1470)
- fixes [#1471](https://github.com/aws-amplify/amplify-cli/issues/1471) ([52b26cb](https://github.com/aws-amplify/amplify-cli/commit/52b26cbc9446d373edc09179866f9c5e9766a1bc))

## 1.6.8-beta.0 (2019-05-07)

## 1.6.8 (2019-05-07)

### Features

- bump aws-sdk ver to support mixed auth ([#1414](https://github.com/aws-amplify/amplify-cli/issues/1414)) ([b2ed52b](https://github.com/aws-amplify/amplify-cli/commit/b2ed52bfe927981552c7bcbe1caad4ccde715313))

## 1.6.7-beta.0 (2019-05-06)

## 1.6.7 (2019-05-06)

### Bug Fixes

- **1342:** api push error on CI/CD platforms. ([#1383](https://github.com/aws-amplify/amplify-cli/issues/1383)) ([e0eff65](https://github.com/aws-amplify/amplify-cli/commit/e0eff6513a9a8f33970d21a03442118001178ba6)), closes [#1342](https://github.com/aws-amplify/amplify-cli/issues/1342) [#1342](https://github.com/aws-amplify/amplify-cli/issues/1342)
- **amplify-provider-awscloudformation:** support multiprofile delete ([#1353](https://github.com/aws-amplify/amplify-cli/issues/1353)) ([404f1c3](https://github.com/aws-amplify/amplify-cli/commit/404f1c31b210c0a17a87fd088506198fef015bf7)), closes [#978](https://github.com/aws-amplify/amplify-cli/issues/978)

### Features

- **graphql-dynamodb-transformer:** output table name ([#1215](https://github.com/aws-amplify/amplify-cli/issues/1215)) ([038b876](https://github.com/aws-amplify/amplify-cli/commit/038b876eaa7a3671b4798cd53cd3d58d8b4aaf52)), closes [#1145](https://github.com/aws-amplify/amplify-cli/issues/1145) [#1145](https://github.com/aws-amplify/amplify-cli/issues/1145)
- add ClientDatabasePrefi to support mixed auth ([#1382](https://github.com/aws-amplify/amplify-cli/issues/1382)) ([8f03a37](https://github.com/aws-amplify/amplify-cli/commit/8f03a3788980b7651b88eeb6376f3d80e7213191))

## 1.6.6-beta.0 (2019-04-30)

## 1.6.6 (2019-04-30)

### Bug Fixes

- **amplify-codegen:** make codegen multienv aware ([b146c77](https://github.com/aws-amplify/amplify-cli/commit/b146c77956d2e3470c8ac5964ec9f6ff368624a8)), closes [#1243](https://github.com/aws-amplify/amplify-cli/issues/1243)
- **amplify-graphql-types-generator:** add inflection black list ([c09f183](https://github.com/aws-amplify/amplify-cli/commit/c09f183eb21241e3967d662aa5f02157bb2c3b11)), closes [#1328](https://github.com/aws-amplify/amplify-cli/issues/1328)
- update CLI to handle UTF8 BOM ([#1357](https://github.com/aws-amplify/amplify-cli/issues/1357)) ([b0afa07](https://github.com/aws-amplify/amplify-cli/commit/b0afa07ab22d50409ff93c41350995cd7d2a1084)), closes [#1355](https://github.com/aws-amplify/amplify-cli/issues/1355) [#1122](https://github.com/aws-amplify/amplify-cli/issues/1122)

### Features

- **amplify-provider-awscloudformation:** append env name ([8d8e522](https://github.com/aws-amplify/amplify-cli/commit/8d8e522467dfacf6bf882536aaf73371c8233050)), closes [#1340](https://github.com/aws-amplify/amplify-cli/issues/1340)
- Multiauth external api add ([#1329](https://github.com/aws-amplify/amplify-cli/issues/1329)) ([13d9fc3](https://github.com/aws-amplify/amplify-cli/commit/13d9fc3fa32be5fc6be454fe91e0de0bb7226bef))

## 1.6.5-beta.0 (2019-04-25)

## 1.6.5 (2019-04-25)

### Bug Fixes

- **amplify-category-auth:** uses public_profile for FB scopes ([c9af7b7](https://github.com/aws-amplify/amplify-cli/commit/c9af7b7d559641118cb3aab07ee10ad047e4d2b1)), closes [#1335](https://github.com/aws-amplify/amplify-cli/issues/1335)

## 1.6.4-beta.0 (2019-04-23)

## 1.6.4 (2019-04-23)

### Bug Fixes

- **cli:** check BOM in json read ([#1293](https://github.com/aws-amplify/amplify-cli/issues/1293)) ([adf7ab7](https://github.com/aws-amplify/amplify-cli/commit/adf7ab7de01786535e734c3916e4d149ff1b2bf9)), closes [#1280](https://github.com/aws-amplify/amplify-cli/issues/1280)
- use JSON parse instead of require in xr ([#1312](https://github.com/aws-amplify/amplify-cli/issues/1312)) ([5f0a4e9](https://github.com/aws-amplify/amplify-cli/commit/5f0a4e9ebfae571d4ccc5568a83f1c6be19d021e))

## 1.6.3-beta.0 (2019-04-16)

## 1.6.3 (2019-04-16)

## 1.6.2-beta.0 (2019-04-15)

## 1.6.2 (2019-04-16)

## 1.6.12-beta.0 (2019-05-29)

### Bug Fixes

- **amplify-category-auth:** match cognito token expiration date range ([eb4c9ee](https://github.com/aws-amplify/amplify-cli/commit/eb4c9eecc92ba1cdb9959f173e806f71c601f750)), closes [#1385](https://github.com/aws-amplify/amplify-cli/issues/1385)
- stringify region in function Cloudformation file ([#1536](https://github.com/aws-amplify/amplify-cli/issues/1536)) ([cb6f438](https://github.com/aws-amplify/amplify-cli/commit/cb6f438b22332d14b994ca866aa74d55c974a60f))

### Features

- feature/[@key](https://github.com/key) ([#1463](https://github.com/aws-amplify/amplify-cli/issues/1463)) ([00ed819](https://github.com/aws-amplify/amplify-cli/commit/00ed819419a4959a6d62da2fc5477621c046eff0))
- flow to add policies to access amplify resources from Lambda ([#1462](https://github.com/aws-amplify/amplify-cli/issues/1462)) ([fee247c](https://github.com/aws-amplify/amplify-cli/commit/fee247c74f54b050f7b7a6ea0733fbd08976f232))

## 1.6.11-beta.0 (2019-05-23)

## 1.6.11 (2019-05-23)

### Bug Fixes

- **graphql-relational-schema-transformer:** add additional RDS Policies ([#1508](https://github.com/aws-amplify/amplify-cli/issues/1508)) ([b1dcd08](https://github.com/aws-amplify/amplify-cli/commit/b1dcd08318538fa55e3631a10f61d26120d1d913))
- **graphql-relational-schema-transformer:** support \_ in table name ([17e9a04](https://github.com/aws-amplify/amplify-cli/commit/17e9a0433568b16dc5579c391f3d13c2282b4962)), closes [#1504](https://github.com/aws-amplify/amplify-cli/issues/1504)

## 1.6.10-beta.0 (2019-05-21)

## 1.6.10 (2019-05-21)

### Bug Fixes

- conditionally generation of oAuth config for iOS and Android [#1472](https://github.com/aws-amplify/amplify-cli/issues/1472) ([3767192](https://github.com/aws-amplify/amplify-cli/commit/37671920ee33d0115ab28284aa31ebfb0dd036e5)), closes [#1470](https://github.com/aws-amplify/amplify-cli/issues/1470)
- fix [#1254](https://github.com/aws-amplify/amplify-cli/issues/1254) ([0962650](https://github.com/aws-amplify/amplify-cli/commit/09626505aae3730e830e819bf627354c359b1fec))
- fix [#1264](https://github.com/aws-amplify/amplify-cli/issues/1264) ([d901daf](https://github.com/aws-amplify/amplify-cli/commit/d901daf825ef1857c57da85b559d813ec57ae212))
- fixes [#1471](https://github.com/aws-amplify/amplify-cli/issues/1471) ([52b26cb](https://github.com/aws-amplify/amplify-cli/commit/52b26cbc9446d373edc09179866f9c5e9766a1bc))
- update CLI to handle UTF8 BOM ([#1357](https://github.com/aws-amplify/amplify-cli/issues/1357)) ([b0afa07](https://github.com/aws-amplify/amplify-cli/commit/b0afa07ab22d50409ff93c41350995cd7d2a1084)), closes [#1355](https://github.com/aws-amplify/amplify-cli/issues/1355) [#1122](https://github.com/aws-amplify/amplify-cli/issues/1122)
- **1342:** api push error on CI/CD platforms. ([#1383](https://github.com/aws-amplify/amplify-cli/issues/1383)) ([e0eff65](https://github.com/aws-amplify/amplify-cli/commit/e0eff6513a9a8f33970d21a03442118001178ba6)), closes [#1342](https://github.com/aws-amplify/amplify-cli/issues/1342) [#1342](https://github.com/aws-amplify/amplify-cli/issues/1342)
- **amplify-category-auth:** add policy name char length limit ([#1492](https://github.com/aws-amplify/amplify-cli/issues/1492)) ([d6a8785](https://github.com/aws-amplify/amplify-cli/commit/d6a87859e527bf94bff10382f7fea78b8f94cdf1)), closes [#1199](https://github.com/aws-amplify/amplify-cli/issues/1199)
- **amplify-category-auth:** fixes cloudformation template ([706de43](https://github.com/aws-amplify/amplify-cli/commit/706de438d542b825840b9142bcc93310902cdd29)), closes [#1247](https://github.com/aws-amplify/amplify-cli/issues/1247)
- **amplify-category-auth:** fixes cloudformation template ([f28d0cf](https://github.com/aws-amplify/amplify-cli/commit/f28d0cf2c2de5be290b542911128249fb6d64fab)), closes [#1247](https://github.com/aws-amplify/amplify-cli/issues/1247)
- **amplify-category-auth:** uses public_profile for FB scopes ([c9af7b7](https://github.com/aws-amplify/amplify-cli/commit/c9af7b7d559641118cb3aab07ee10ad047e4d2b1)), closes [#1335](https://github.com/aws-amplify/amplify-cli/issues/1335)
- **amplify-category-function:** add error status code ([a3aaaad](https://github.com/aws-amplify/amplify-cli/commit/a3aaaad281552f2d4d1d81685296385fa097916e)), closes [#1003](https://github.com/aws-amplify/amplify-cli/issues/1003)
- **amplify-category-storage:** pass context to DDB migration helper ([#1392](https://github.com/aws-amplify/amplify-cli/issues/1392)) ([dbec705](https://github.com/aws-amplify/amplify-cli/commit/dbec7053eb669c290d27142ef5e23a78a1a697bd)), closes [#1384](https://github.com/aws-amplify/amplify-cli/issues/1384)
- **amplify-codegen:** auto detect S3Object in swift codegen ([#1482](https://github.com/aws-amplify/amplify-cli/issues/1482)) ([ea2de2d](https://github.com/aws-amplify/amplify-cli/commit/ea2de2d710a62446e6a8fbbdc946e7f575a770d3)), closes [#1468](https://github.com/aws-amplify/amplify-cli/issues/1468)
- **amplify-codegen:** make codegen multienv aware ([b146c77](https://github.com/aws-amplify/amplify-cli/commit/b146c77956d2e3470c8ac5964ec9f6ff368624a8)), closes [#1243](https://github.com/aws-amplify/amplify-cli/issues/1243)
- **amplify-graphql-types-generator:** add inflection black list ([c09f183](https://github.com/aws-amplify/amplify-cli/commit/c09f183eb21241e3967d662aa5f02157bb2c3b11)), closes [#1328](https://github.com/aws-amplify/amplify-cli/issues/1328)
- **amplify-graphql-types-generator:** angular service gen scalar support ([0299cf5](https://github.com/aws-amplify/amplify-cli/commit/0299cf561a2ce0a4252687bc00f846044536cd84)), closes [#1121](https://github.com/aws-amplify/amplify-cli/issues/1121)
- **amplify-graphql-types-generator:** set AWSTimestamp to number type ([#1483](https://github.com/aws-amplify/amplify-cli/issues/1483)) ([86fb2f1](https://github.com/aws-amplify/amplify-cli/commit/86fb2f19b40a4f6fc081454871d64c7ad2caeaf9)), closes [#1348](https://github.com/aws-amplify/amplify-cli/issues/1348)
- **amplify-provider-awscloudformation:** check creds before setting ([#1438](https://github.com/aws-amplify/amplify-cli/issues/1438)) ([0c2e2d1](https://github.com/aws-amplify/amplify-cli/commit/0c2e2d18748b31ccb3e98a1b6cbbde41d653314d)), closes [#1424](https://github.com/aws-amplify/amplify-cli/issues/1424)
- **amplify-provider-awscloudformation:** ensure build directory exist ([#1435](https://github.com/aws-amplify/amplify-cli/issues/1435)) ([a82fa99](https://github.com/aws-amplify/amplify-cli/commit/a82fa991b61bdf511d4b749c4d67fde897af3282)), closes [#1430](https://github.com/aws-amplify/amplify-cli/issues/1430) [#1430](https://github.com/aws-amplify/amplify-cli/issues/1430)
- **amplify-provider-awscloudformation:** ignore dot files ([#1256](https://github.com/aws-amplify/amplify-cli/issues/1256)) ([845298a](https://github.com/aws-amplify/amplify-cli/commit/845298adaf776d95a6a388cd47965c4959bb8e69)), closes [#1135](https://github.com/aws-amplify/amplify-cli/issues/1135)
- **amplify-provider-awscloudformation:** support multiprofile delete ([#1353](https://github.com/aws-amplify/amplify-cli/issues/1353)) ([404f1c3](https://github.com/aws-amplify/amplify-cli/commit/404f1c31b210c0a17a87fd088506198fef015bf7)), closes [#978](https://github.com/aws-amplify/amplify-cli/issues/978)
- **cli:** check BOM in json read ([#1293](https://github.com/aws-amplify/amplify-cli/issues/1293)) ([adf7ab7](https://github.com/aws-amplify/amplify-cli/commit/adf7ab7de01786535e734c3916e4d149ff1b2bf9)), closes [#1280](https://github.com/aws-amplify/amplify-cli/issues/1280)
- **cli:** publish check user response ([f88e9b2](https://github.com/aws-amplify/amplify-cli/commit/f88e9b2c447b9b2101fc16629abfcd3c4d2ffe1a)), closes [#965](https://github.com/aws-amplify/amplify-cli/issues/965)
- **graphql-dynamodb-transformer:** always output datasource name ([#1182](https://github.com/aws-amplify/amplify-cli/issues/1182)) ([a58e1ac](https://github.com/aws-amplify/amplify-cli/commit/a58e1ac51faa2cf558c2eed81d27c619c3a40e92))
- **graphql-dynamodb-transformer:** backward compatibility ([de3e47c](https://github.com/aws-amplify/amplify-cli/commit/de3e47c0e2cfec57cff5183797770635c507d5fe))
- **graphql-elasticsearch-transformer:** use Fn::GetAtt for StreamArn ([#1494](https://github.com/aws-amplify/amplify-cli/issues/1494)) ([8c80462](https://github.com/aws-amplify/amplify-cli/commit/8c8046214d1abbfd2f3752fec8ff6c1d3dd104ce)), closes [/github.com/aws-amplify/amplify-cli/commit/df1712b00427792bcce34adf7027698afd8e6841#diff-22e2a5351fb3f897025bc1e45811acb5R168](https://github.com//github.com/aws-amplify/amplify-cli/commit/df1712b00427792bcce34adf7027698afd8e6841/issues/diff-22e2a5351fb3f897025bc1e45811acb5R168)
- **graphql-function-transformer:** handle NONE env in [@function](https://github.com/function) ([#1491](https://github.com/aws-amplify/amplify-cli/issues/1491)) ([c742d7d](https://github.com/aws-amplify/amplify-cli/commit/c742d7dff987f6e97856dba261a98581390cd6f0))
- use JSON parse instead of require in xr ([#1312](https://github.com/aws-amplify/amplify-cli/issues/1312)) ([5f0a4e9](https://github.com/aws-amplify/amplify-cli/commit/5f0a4e9ebfae571d4ccc5568a83f1c6be19d021e))

### Features

- add ClientDatabasePrefi to support mixed auth ([#1382](https://github.com/aws-amplify/amplify-cli/issues/1382)) ([8f03a37](https://github.com/aws-amplify/amplify-cli/commit/8f03a3788980b7651b88eeb6376f3d80e7213191))
- add support for ap-northeast-2 ([a263afc](https://github.com/aws-amplify/amplify-cli/commit/a263afc1ef3c58bea6596b04e5664e2a628458c7))
- bump aws-sdk ver to support mixed auth ([#1414](https://github.com/aws-amplify/amplify-cli/issues/1414)) ([b2ed52b](https://github.com/aws-amplify/amplify-cli/commit/b2ed52bfe927981552c7bcbe1caad4ccde715313))
- Multiauth external api add ([#1329](https://github.com/aws-amplify/amplify-cli/issues/1329)) ([13d9fc3](https://github.com/aws-amplify/amplify-cli/commit/13d9fc3fa32be5fc6be454fe91e0de0bb7226bef))
- **amplify-provider-awscloudformation:** add http default transformer ([#1410](https://github.com/aws-amplify/amplify-cli/issues/1410)) ([41cd9d0](https://github.com/aws-amplify/amplify-cli/commit/41cd9d0bbfbb0c7cbf1eb853e469262fffb8ee41))
- **amplify-provider-awscloudformation:** append env name ([8d8e522](https://github.com/aws-amplify/amplify-cli/commit/8d8e522467dfacf6bf882536aaf73371c8233050)), closes [#1340](https://github.com/aws-amplify/amplify-cli/issues/1340)
- **field-level-auth:** Add field level auth support via the [@auth](https://github.com/auth) directive ([#1262](https://github.com/aws-amplify/amplify-cli/issues/1262)) ([3b1c600](https://github.com/aws-amplify/amplify-cli/commit/3b1c6006f174c414485bd3520774bbcb8ed5c4d7)), closes [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-dynamodb-transformer:** add more specific mapping ([5dc2d3b](https://github.com/aws-amplify/amplify-cli/commit/5dc2d3bc85c5b89d300c30cc20928b175592c9d9))
- **graphql-dynamodb-transformer:** always output stream arn ([df1712b](https://github.com/aws-amplify/amplify-cli/commit/df1712b00427792bcce34adf7027698afd8e6841)), closes [#980](https://github.com/aws-amplify/amplify-cli/issues/980)
- **graphql-dynamodb-transformer:** output table name ([#1215](https://github.com/aws-amplify/amplify-cli/issues/1215)) ([038b876](https://github.com/aws-amplify/amplify-cli/commit/038b876eaa7a3671b4798cd53cd3d58d8b4aaf52)), closes [#1145](https://github.com/aws-amplify/amplify-cli/issues/1145) [#1145](https://github.com/aws-amplify/amplify-cli/issues/1145)

## 1.6.1-beta.0 (2019-04-09)

## 1.6.1 (2019-04-09)

### Reverts

- Revert "build: avoid removing package-lock files in production-build command" ([ae394e9](https://github.com/aws-amplify/amplify-cli/commit/ae394e961c696990f1263e47beb564cc614cdc60))
- Revert "build: add package-lock.json file to amplify-cli package" ([cf83a3e](https://github.com/aws-amplify/amplify-cli/commit/cf83a3e6aa4edf114f40f0de4ef2b5b9a93967e7))

## 1.5.3 (2019-04-04)

## 1.5.2-beta.0 (2019-04-09)

### Reverts

- Revert "build: avoid removing package-lock files in production-build command" ([ae394e9](https://github.com/aws-amplify/amplify-cli/commit/ae394e961c696990f1263e47beb564cc614cdc60))
- Revert "build: add package-lock.json file to amplify-cli package" ([cf83a3e](https://github.com/aws-amplify/amplify-cli/commit/cf83a3e6aa4edf114f40f0de4ef2b5b9a93967e7))

## 1.5.1-beta.0 (2019-04-03)

## 1.5.1 (2019-04-03)

### Bug Fixes

- fix [#1201](https://github.com/aws-amplify/amplify-cli/issues/1201) ([0dfdda5](https://github.com/aws-amplify/amplify-cli/commit/0dfdda53c6991b1502efd05d287121c7f924d6fa))

# 1.5.0 (2019-04-02)

## 1.4.1-beta.0 (2019-04-02)

### Bug Fixes

- **graphql-auth-transformer:** conditional group expression ([#1186](https://github.com/aws-amplify/amplify-cli/issues/1186)) ([83ef244](https://github.com/aws-amplify/amplify-cli/commit/83ef2440b27211d6d89b8fe875c40b602d4f5cda)), closes [#360](https://github.com/aws-amplify/amplify-cli/issues/360)
- fixes update of aws exports when switching envs ([55a14bf](https://github.com/aws-amplify/amplify-cli/commit/55a14bf73c8f9e36519819900134047b4e740819))

# 1.4.0 (2019-04-02)

## 1.3.1-beta.0 (2019-04-02)

# 1.2.0 (2019-04-02)

## 1.12.1-ddb-local-install-script.0 (2019-08-15)

### Bug Fixes

- **amplify-dynamodb-simulator:** update install script ([0c979f4](https://github.com/aws-amplify/amplify-cli/commit/0c979f44bf73e703101882605ea9a85ff0bf23ea)), closes [fix#1996](https://github.com/fix/issues/1996)

## 1.12.1-authSubRelease.9 (2019-08-26)

### Features

- **graphql-auth-transformer:** pr changes ([2a32e8b](https://github.com/aws-amplify/amplify-cli/commit/2a32e8b7cc350bb98c67e55f7c0ee487b463c601)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-auth-transformer:** protect mutations ([710b71b](https://github.com/aws-amplify/amplify-cli/commit/710b71bf85bd8f89b0e417e42d6d7bd8ee7f1044)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-auth-transformer:** protecting subscriptions ([c9d1f60](https://github.com/aws-amplify/amplify-cli/commit/c9d1f60c3235b783d17ce334640ac6606bf0a947)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)

### BREAKING CHANGES

- **graphql-auth-transformer:** the subscription operations will require an argument if owner is the only auth rule
- **graphql-auth-transformer:** If an owner is included in the auth directive it will either be a requirement if
  it's the only rule or an optional input if used with other rules
- **graphql-auth-transformer:** If an owner is used in the auth directive it will either be a requirement if it's
  the only rule or an optional input if used with other rules

## 1.12.1-authSubRelease.8 (2019-08-26)

### Bug Fixes

- [#2033](https://github.com/aws-amplify/amplify-cli/issues/2033) - Make sure key field order is preserved ([#2117](https://github.com/aws-amplify/amplify-cli/issues/2117)) ([58f8f76](https://github.com/aws-amplify/amplify-cli/commit/58f8f76ec2738d65f65568e5f4157d5ada0976c5))

### Features

- **graphql-auth-transformer:** pr changes ([281d235](https://github.com/aws-amplify/amplify-cli/commit/281d235516c55293f9c694427ded05f5ba8baf47)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-auth-transformer:** protect mutations ([e9c2dc3](https://github.com/aws-amplify/amplify-cli/commit/e9c2dc3fe992f53505983caa969e6f38d42c5ac3)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-auth-transformer:** protecting subscriptions ([b5c655f](https://github.com/aws-amplify/amplify-cli/commit/b5c655f7875556079f7992d256ba64684113fe4d)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)

### BREAKING CHANGES

- **graphql-auth-transformer:** the subscription operations will require an argument if owner is the only auth rule
- **graphql-auth-transformer:** If an owner is included in the auth directive it will either be a requirement if
  it's the only rule or an optional input if used with other rules
- **graphql-auth-transformer:** If an owner is used in the auth directive it will either be a requirement if it's
  the only rule or an optional input if used with other rules

## 1.12.1-authSubRelease.6 (2019-08-25)

### Bug Fixes

- regression for e2e tests because of nexpect reference ([#2120](https://github.com/aws-amplify/amplify-cli/issues/2120)) ([7659500](https://github.com/aws-amplify/amplify-cli/commit/7659500225091d4bf3b84c9ac7fee1931716dce9))

### Features

- subscription feedback changes ([46725f0](https://github.com/aws-amplify/amplify-cli/commit/46725f041fff73a9193ee576ca11cd9b6edfb514)), closes [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068)
- **graphql-auth-transformer:** pr changes ([b3a7e8d](https://github.com/aws-amplify/amplify-cli/commit/b3a7e8d8bbe87ca4622a76b9094b75b1754b4442)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-auth-transformer:** protect mutations ([9b9e392](https://github.com/aws-amplify/amplify-cli/commit/9b9e39256723f70db5e1c38d8d06dd7c95999a91)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-auth-transformer:** protecting subscriptions ([d6ba3d3](https://github.com/aws-amplify/amplify-cli/commit/d6ba3d3cd25ada437343bc8bcc229b667088bae8)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)

### BREAKING CHANGES

- **graphql-auth-transformer:** the subscription operations will require an argument if owner is the only auth rule
- **graphql-auth-transformer:** If an owner is included in the auth directive it will either be a requirement if
  it's the only rule or an optional input if used with other rules
- **graphql-auth-transformer:** If an owner is used in the auth directive it will either be a requirement if it's
  the only rule or an optional input if used with other rules

## 1.12.1-authSubRelease.5 (2019-08-25)

### Bug Fixes

- regression for e2e tests because of nexpect reference ([#2120](https://github.com/aws-amplify/amplify-cli/issues/2120)) ([389a6b6](https://github.com/aws-amplify/amplify-cli/commit/389a6b6b2a193163c5e14c8768a1e8556d65127e))

### Features

- pr review changes ([ee1f106](https://github.com/aws-amplify/amplify-cli/commit/ee1f106854c65d839d60000a76a08b371200dcdc)), closes [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068)
- **graphql-auth-transformer:** pr changes ([428038b](https://github.com/aws-amplify/amplify-cli/commit/428038b5f50e0af491c29568570df9d029ae259c)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-auth-transformer:** pr changes ([8e09847](https://github.com/aws-amplify/amplify-cli/commit/8e098472c16d3015b140029224c5dc9bfc42ef0c)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-auth-transformer:** protect mutations ([d7ea987](https://github.com/aws-amplify/amplify-cli/commit/d7ea98714f7b7f8c59e0cdf51f605137e73f5d57)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-auth-transformer:** protect mutations ([20236b5](https://github.com/aws-amplify/amplify-cli/commit/20236b5ffcade22e7539862b7db5b1fb70573d9d)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-auth-transformer:** protecting subscriptions ([8b6e89c](https://github.com/aws-amplify/amplify-cli/commit/8b6e89c4383ae4a7224a2fcb0e7b1999379f8730)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-auth-transformer:** protecting subscriptions ([a70351d](https://github.com/aws-amplify/amplify-cli/commit/a70351dd6eb2dd433f2568885d09ce2065d0d16d)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-dynamodb-transformer:** auth check ([2456bb1](https://github.com/aws-amplify/amplify-cli/commit/2456bb1b355a0dc19b7b9ae95d7f3dc80e49cb2b)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-transformer-core:** added getfieldarguments ([601c6e0](https://github.com/aws-amplify/amplify-cli/commit/601c6e052b3337f5f4c443e114aa9c9e9b5c9c45)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)

### BREAKING CHANGES

- **graphql-auth-transformer:** the subscription operations will require an argument if owner is the only auth rule
- **graphql-auth-transformer:** If an owner is included in the auth directive it will either be a requirement if
  it's the only rule or an optional input if used with other rules
- **graphql-auth-transformer:** If an owner is used in the auth directive it will either be a requirement if it's
  the only rule or an optional input if used with other rules
- Subscriptions will require an argument if an owner is only rule set - If owner &
  group rules are owner will be an optional arg
- **graphql-auth-transformer:** the subscription operations will require an argument if owner is the only auth rule
- **graphql-auth-transformer:** If an owner is included in the auth directive it will either be a requirement if
  it's the only rule or an optional input if used with other rules
- **graphql-auth-transformer:** If an owner is used in the auth directive it will either be a requirement if it's
  the only rule or an optional input if used with other rules

## 1.12.1-authSubRelease.3 (2019-08-23)

### Features

- **graphql-auth-transformer:** pr changes ([313baa9](https://github.com/aws-amplify/amplify-cli/commit/313baa9ada6557e203364ff2f60c4e8772a54514)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-auth-transformer:** protect mutations ([42f6373](https://github.com/aws-amplify/amplify-cli/commit/42f63739c53581c84eb7db6c51f21a4e1570e6a8)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-auth-transformer:** protecting subscriptions ([2e7b24e](https://github.com/aws-amplify/amplify-cli/commit/2e7b24e4207b5c789af687aa078c79381a34ddc4)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-dynamodb-transformer:** auth check ([16a10c7](https://github.com/aws-amplify/amplify-cli/commit/16a10c732a08276760d02c903dfeec72fd4deac6)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-transformer-core:** added getfieldarguments ([7fb883b](https://github.com/aws-amplify/amplify-cli/commit/7fb883bee2ddd34b39f3bba62ae50a3ff6df26d3)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)

### BREAKING CHANGES

- **graphql-auth-transformer:** the subscription operations will require an argument if owner is the only auth rule
- **graphql-auth-transformer:** If an owner is included in the auth directive it will either be a requirement if
  it's the only rule or an optional input if used with other rules
- **graphql-auth-transformer:** If an owner is used in the auth directive it will either be a requirement if it's
  the only rule or an optional input if used with other rules

## 1.12.1-authSubRelease.14 (2019-08-27)

### Bug Fixes

- **amplify-util-mock:** include custom resolver templates ([#2119](https://github.com/aws-amplify/amplify-cli/issues/2119)) ([f7174a7](https://github.com/aws-amplify/amplify-cli/commit/f7174a7b0bf09023e620cb4e2f4b0c7ccc154eea)), closes [#2049](https://github.com/aws-amplify/amplify-cli/issues/2049) [#2004](https://github.com/aws-amplify/amplify-cli/issues/2004)

### Features

- **graphql-auth-transformer:** protect mutations ([24eee7f](https://github.com/aws-amplify/amplify-cli/commit/24eee7fa52861c1e7ef85cd4508576d04eee6247)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-auth-transformer:** protecting subscriptions ([7d575ce](https://github.com/aws-amplify/amplify-cli/commit/7d575cecc9b71f5a1c691762bdeb10218ed846d7)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-auth-transformer:** subscriptions obj logic change ([ba98ee6](https://github.com/aws-amplify/amplify-cli/commit/ba98ee6822397aa3492bc8ed73169f5e172df5c2)), closes [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068)

### BREAKING CHANGES

- **graphql-auth-transformer:** the subscription operations will require an argument if owner is the only auth rule
- **graphql-auth-transformer:** If an owner is used in the auth directive it will either be a requirement if it's
  the only rule or an optional input if used with other rules

## 1.12.1-authSubRelease.13 (2019-08-27)

### Features

- **graphql-auth-transformer:** change add owner logic ([2cd3aa5](https://github.com/aws-amplify/amplify-cli/commit/2cd3aa55d93d59fa6bdc5133f6ff103514e381ab)), closes [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068)
- **graphql-auth-transformer:** pr changes ([22607f0](https://github.com/aws-amplify/amplify-cli/commit/22607f064829f833a9a707dd3bb2b421078a0335)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-auth-transformer:** protect mutations ([7039b5e](https://github.com/aws-amplify/amplify-cli/commit/7039b5e558bc88b911de605fdbc36d98383ebdc1)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-auth-transformer:** protecting subscriptions ([735298f](https://github.com/aws-amplify/amplify-cli/commit/735298fc013844135631baa69ea369d24185565b)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)

### BREAKING CHANGES

- **graphql-auth-transformer:** the subscription operations will require an argument if owner is the only auth rule
- **graphql-auth-transformer:** If an owner is included in the auth directive it will either be a requirement if
  it's the only rule or an optional input if used with other rules
- **graphql-auth-transformer:** If an owner is used in the auth directive it will either be a requirement if it's
  the only rule or an optional input if used with other rules

## 1.12.1-authSubRelease.12 (2019-08-26)

### Features

- **graphql-auth-transformer:** pr changes ([2614760](https://github.com/aws-amplify/amplify-cli/commit/26147608c5a496c1d5fdc3c75a88927648ead8ff)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-auth-transformer:** protect mutations ([fe42385](https://github.com/aws-amplify/amplify-cli/commit/fe42385ca189639e927ee51ae86e6428ddfdb45d)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-auth-transformer:** protecting subscriptions ([2036610](https://github.com/aws-amplify/amplify-cli/commit/20366109b5a022f5fa8c2ea99c794a311bc623e5)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-auth-transformer:** subscription resolver logic change ([1a68733](https://github.com/aws-amplify/amplify-cli/commit/1a6873382836fcd4798fc2b315bedb11664a02d9))

### BREAKING CHANGES

- **graphql-auth-transformer:** the subscription operations will require an argument if owner is the only auth rule
- **graphql-auth-transformer:** If an owner is included in the auth directive it will either be a requirement if
  it's the only rule or an optional input if used with other rules
- **graphql-auth-transformer:** If an owner is used in the auth directive it will either be a requirement if it's
  the only rule or an optional input if used with other rules

## 1.12.1-authSubRelease.11 (2019-08-26)

### Bug Fixes

- **amplify-dynamodb-simulator:** update simulator to work in docker ([#2061](https://github.com/aws-amplify/amplify-cli/issues/2061)) ([90a423c](https://github.com/aws-amplify/amplify-cli/commit/90a423cc1ecaff3dc8ebb9b5e526e1256d36d835)), closes [#2037](https://github.com/aws-amplify/amplify-cli/issues/2037)
- [#1056](https://github.com/aws-amplify/amplify-cli/issues/1056), dedup environment file reading ([#2088](https://github.com/aws-amplify/amplify-cli/issues/2088)) ([940deaa](https://github.com/aws-amplify/amplify-cli/commit/940deaa6bbe7370e40e61946d0f1073623ba6e90))
- [#1715](https://github.com/aws-amplify/amplify-cli/issues/1715) - Fix stack enumeration so transform.conf.json will be generated ([#2114](https://github.com/aws-amplify/amplify-cli/issues/2114)) ([d1b266b](https://github.com/aws-amplify/amplify-cli/commit/d1b266bb11dfb47e7b125d50235ce65b3e98319e))
- [#1720](https://github.com/aws-amplify/amplify-cli/issues/1720) - fix GraphQL name generation for [@key](https://github.com/key) ([#2093](https://github.com/aws-amplify/amplify-cli/issues/2093)) ([51716f3](https://github.com/aws-amplify/amplify-cli/commit/51716f340e820358087d68fd9e926084c10565eb))
- [#2013](https://github.com/aws-amplify/amplify-cli/issues/2013) - Dynamic group auth when groups field is null ([#2097](https://github.com/aws-amplify/amplify-cli/issues/2097)) ([4ad3d5c](https://github.com/aws-amplify/amplify-cli/commit/4ad3d5cf34f689867ce3929f8fa84e751985fbfe))
- [#2032](https://github.com/aws-amplify/amplify-cli/issues/2032) - add AWSTimestamp and AWSIPAddress types to mock ([#2116](https://github.com/aws-amplify/amplify-cli/issues/2116)) ([77e2e69](https://github.com/aws-amplify/amplify-cli/commit/77e2e69af6065b014818a9ef4324027f566acca2))
- [#2033](https://github.com/aws-amplify/amplify-cli/issues/2033) - Make sure key field order is preserved ([#2117](https://github.com/aws-amplify/amplify-cli/issues/2117)) ([58f8f76](https://github.com/aws-amplify/amplify-cli/commit/58f8f76ec2738d65f65568e5f4157d5ada0976c5))
- [#223](https://github.com/aws-amplify/amplify-cli/issues/223) - Generate table name instead of resource name in CRUD Lambda ([#2107](https://github.com/aws-amplify/amplify-cli/issues/2107)) ([ad7c257](https://github.com/aws-amplify/amplify-cli/commit/ad7c25798b007954fb6b56c73d24a0fe9f163d6c))
- [#429](https://github.com/aws-amplify/amplify-cli/issues/429) - Editor hanging bug ([#2086](https://github.com/aws-amplify/amplify-cli/issues/2086)) ([6767445](https://github.com/aws-amplify/amplify-cli/commit/676744549f903fa3a4804d814eb325301ed462ba))
- regression for e2e tests because of nexpect reference ([#2120](https://github.com/aws-amplify/amplify-cli/issues/2120)) ([7659500](https://github.com/aws-amplify/amplify-cli/commit/7659500225091d4bf3b84c9ac7fee1931716dce9))

### Features

- **amplify-util-mock:** add support for S3 triggers in local mocking ([#2101](https://github.com/aws-amplify/amplify-cli/issues/2101)) ([ac9a134](https://github.com/aws-amplify/amplify-cli/commit/ac9a13469704f9c3cfa584760087e389380add3d))
- pr review changes ([ee1f106](https://github.com/aws-amplify/amplify-cli/commit/ee1f106854c65d839d60000a76a08b371200dcdc)), closes [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068)
- subscription feedback changes ([46725f0](https://github.com/aws-amplify/amplify-cli/commit/46725f041fff73a9193ee576ca11cd9b6edfb514)), closes [#2068](https://github.com/aws-amplify/amplify-cli/issues/2068)
- **graphql-auth-transformer:** pr changes ([de6041e](https://github.com/aws-amplify/amplify-cli/commit/de6041ecd53eb0d32b500ddda0946902dee378f5)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-auth-transformer:** protect mutations ([657883b](https://github.com/aws-amplify/amplify-cli/commit/657883b50cc299fa02b2bb5e2f5ba218a7f97b57)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-auth-transformer:** protect mutations ([20236b5](https://github.com/aws-amplify/amplify-cli/commit/20236b5ffcade22e7539862b7db5b1fb70573d9d)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-auth-transformer:** protecting subscriptions ([1d225be](https://github.com/aws-amplify/amplify-cli/commit/1d225bea42b5b65b2ac59787c7232b712091a075)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-dynamodb-transformer:** auth check ([2456bb1](https://github.com/aws-amplify/amplify-cli/commit/2456bb1b355a0dc19b7b9ae95d7f3dc80e49cb2b)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-transformer-core:** added getfieldarguments ([601c6e0](https://github.com/aws-amplify/amplify-cli/commit/601c6e052b3337f5f4c443e114aa9c9e9b5c9c45)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)

### BREAKING CHANGES

- **graphql-auth-transformer:** the subscription operations will require an argument if owner is the only auth rule
- **graphql-auth-transformer:** If an owner is included in the auth directive it will either be a requirement if
  it's the only rule or an optional input if used with other rules
- **graphql-auth-transformer:** If an owner is used in the auth directive it will either be a requirement if it's
  the only rule or an optional input if used with other rules
- Subscriptions will require an argument if an owner is only rule set - If owner &
  group rules are owner will be an optional arg
- **graphql-auth-transformer:** the subscription operations will require an argument if owner is the only auth rule

## 1.12.1-authSubRelease.0 (2019-08-16)

### Bug Fixes

- [#1978](https://github.com/aws-amplify/amplify-cli/issues/1978), adding update command to function category command list ([#2031](https://github.com/aws-amplify/amplify-cli/issues/2031)) ([8195152](https://github.com/aws-amplify/amplify-cli/commit/819515221314e247cfa2a498d6a90994e93462b6))
- move test package dependencies to devDependencies ([#2034](https://github.com/aws-amplify/amplify-cli/issues/2034)) ([f5623d0](https://github.com/aws-amplify/amplify-cli/commit/f5623d04a43e685901f4f1cd96e2a227164c71ee))
- **amplify-util-mock:** support large response from lambda ([#2060](https://github.com/aws-amplify/amplify-cli/issues/2060)) ([60efd28](https://github.com/aws-amplify/amplify-cli/commit/60efd2889bf59f533efe9aed9a39886eca296d1e))

### Features

- **graphql-auth-transformer:** pr changes ([8e09847](https://github.com/aws-amplify/amplify-cli/commit/8e098472c16d3015b140029224c5dc9bfc42ef0c)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-auth-transformer:** protecting subscriptions ([a70351d](https://github.com/aws-amplify/amplify-cli/commit/a70351dd6eb2dd433f2568885d09ce2065d0d16d)), closes [#1766](https://github.com/aws-amplify/amplify-cli/issues/1766) [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)

### BREAKING CHANGES

- **graphql-auth-transformer:** If an owner is included in the auth directive it will either be a requirement if
  it's the only rule or an optional input if used with other rules
- **graphql-auth-transformer:** If an owner is used in the auth directive it will either be a requirement if it's
  the only rule or an optional input if used with other rules

# 1.12.0 (2019-08-13)

## 1.11.1-beta.0 (2019-08-13)

### Bug Fixes

- **amplify-graphql-types-generator:** generate valid swift code ([2f25bf7](https://github.com/aws-amplify/amplify-cli/commit/2f25bf779af0cd92b9bbc3b834f8410af4d2c3a4)), closes [#1903](https://github.com/aws-amplify/amplify-cli/issues/1903)
- **amplify-provider-awscloudformation:** apigw unauth access ([#1906](https://github.com/aws-amplify/amplify-cli/issues/1906)) ([bcd0d02](https://github.com/aws-amplify/amplify-cli/commit/bcd0d02a229d3dab2e5babc40b68ac9090aa5f15))
- **amplify-util-mock:** handle unsupported data source gracefully ([#1999](https://github.com/aws-amplify/amplify-cli/issues/1999)) ([f7cfe3e](https://github.com/aws-amplify/amplify-cli/commit/f7cfe3e01be7a3abe45a1129419f2306924b4ebe)), closes [#1997](https://github.com/aws-amplify/amplify-cli/issues/1997)
- **amplify-util-mock:** prevent resolver file overwrite in windows ([#2007](https://github.com/aws-amplify/amplify-cli/issues/2007)) ([5b78d25](https://github.com/aws-amplify/amplify-cli/commit/5b78d25519228085c5a0010ef90ac01cf161ccff)), closes [#2006](https://github.com/aws-amplify/amplify-cli/issues/2006)
- **graphql-connection-transformer:** fix self connection bug ([#1944](https://github.com/aws-amplify/amplify-cli/issues/1944)) ([1a6affc](https://github.com/aws-amplify/amplify-cli/commit/1a6affc7cc5ba0d59c908b6f6a58852013d22343)), closes [#1799](https://github.com/aws-amplify/amplify-cli/issues/1799)
- **graphql-dynamodb-transformer:** added scan index forward ([72cda1e](https://github.com/aws-amplify/amplify-cli/commit/72cda1e178b2fd87e42b200efbc5c87e49c964b1)), closes [#1676](https://github.com/aws-amplify/amplify-cli/issues/1676)
- **graphql-elasticsearch-transformer:** fixed es req template ([311f57d](https://github.com/aws-amplify/amplify-cli/commit/311f57d9938aa78c83c7c695ddd39457b89c8afc))
- **graphql-key-transformer:** added sort direction ([a0f9f30](https://github.com/aws-amplify/amplify-cli/commit/a0f9f30d4141f3574f34cd5d7183471044b12935)), closes [#1676](https://github.com/aws-amplify/amplify-cli/issues/1676)
- fix metric agent for tracking CLI usage ([#2024](https://github.com/aws-amplify/amplify-cli/issues/2024)) ([a2742a6](https://github.com/aws-amplify/amplify-cli/commit/a2742a68b8a26000765ad22ed0a8fc28ef0d32fc))
- Fix package.json exists check for functions ([#2030](https://github.com/aws-amplify/amplify-cli/issues/2030)) ([a5283b7](https://github.com/aws-amplify/amplify-cli/commit/a5283b72c780a065c735ef3cd6baaae35476a7f8))
- **graphql-key-transformer:** key req resolver edit ([c4a9da5](https://github.com/aws-amplify/amplify-cli/commit/c4a9da51b2db2d411fcb016934ffdd8e8425313c)), closes [#1676](https://github.com/aws-amplify/amplify-cli/issues/1676) [#1990](https://github.com/aws-amplify/amplify-cli/issues/1990) [#1629](https://github.com/aws-amplify/amplify-cli/issues/1629)

### Features

- **amplify-provider-awscloudformation:** hooks ([#1951](https://github.com/aws-amplify/amplify-cli/issues/1951)) ([caba157](https://github.com/aws-amplify/amplify-cli/commit/caba1579812f6e5c93007bec7c8b3c8cdf005eb2))
- narrow-down idp roles scope ([#1974](https://github.com/aws-amplify/amplify-cli/issues/1974)) ([ccfd508](https://github.com/aws-amplify/amplify-cli/commit/ccfd5085dc8fdbaf90d3a3646e8c10e26a5f583d))

# 1.11.0 (2019-08-07)

## 1.10.2-beta.0 (2019-08-07)

## 1.10.1-mock-post-inst.0 (2019-08-07)

### Bug Fixes

- local mock fix ([#1982](https://github.com/aws-amplify/amplify-cli/issues/1982)) ([8ee9029](https://github.com/aws-amplify/amplify-cli/commit/8ee90298189f4d3140ab84fe2d40d16bcb95485f))

## 1.10.1-local-mock.0 (2019-08-06)

## 1.10.1-deps-issue-fix.0 (2019-08-06)

## 1.10.1-beta.1 (2019-08-07)

## 1.10.1-beta.0 (2019-08-06)

### Bug Fixes

- fix [#1205](https://github.com/aws-amplify/amplify-cli/issues/1205) ([#1961](https://github.com/aws-amplify/amplify-cli/issues/1961)) ([e8d8b97](https://github.com/aws-amplify/amplify-cli/commit/e8d8b97cf337d86417e1be1dc52dff2740253d9e))
- **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad863ad4febde47e56209d6026cddb344044))
- **amplify-category-predictions:** changing the predictions lambda trigger time out to 15 mins ([#1956](https://github.com/aws-amplify/amplify-cli/issues/1956)) ([a05f634](https://github.com/aws-amplify/amplify-cli/commit/a05f634c3c0130c7e16f83605153828375f8b7f6))
- **amplify-e2e-tests:** fixing predictions e2e tests ([#1969](https://github.com/aws-amplify/amplify-cli/issues/1969)) ([6c6bbb2](https://github.com/aws-amplify/amplify-cli/commit/6c6bbb26589a12aefc2f77ad059cbc65d6589a24))
- local mock fix ([#1982](https://github.com/aws-amplify/amplify-cli/issues/1982)) ([8ee9029](https://github.com/aws-amplify/amplify-cli/commit/8ee90298189f4d3140ab84fe2d40d16bcb95485f))

### Features

- mock support for API, function and storage ([#1893](https://github.com/aws-amplify/amplify-cli/issues/1893)) ([372e534](https://github.com/aws-amplify/amplify-cli/commit/372e5346ee1f27a2e9bee25fbbdcb19417f5230f))

# 1.10.0 (2019-08-01)

### Bug Fixes

- allow absolute path for scene config ([faba5ea](https://github.com/aws-amplify/amplify-cli/commit/faba5ea11917495b8585b2f333b81cc68d20f55f))
- check that function-parameters.json exists before trying to read it ([#1808](https://github.com/aws-amplify/amplify-cli/issues/1808)) ([574218d](https://github.com/aws-amplify/amplify-cli/commit/574218d732fc0d357f7c72a0a59e0c968cddeff5))
- conditionally generation of oAuth config for iOS and Android [#1472](https://github.com/aws-amplify/amplify-cli/issues/1472) ([3767192](https://github.com/aws-amplify/amplify-cli/commit/37671920ee33d0115ab28284aa31ebfb0dd036e5)), closes [#1470](https://github.com/aws-amplify/amplify-cli/issues/1470)
- fix [#1201](https://github.com/aws-amplify/amplify-cli/issues/1201) ([0dfdda5](https://github.com/aws-amplify/amplify-cli/commit/0dfdda53c6991b1502efd05d287121c7f924d6fa))
- fix [#1254](https://github.com/aws-amplify/amplify-cli/issues/1254) ([0962650](https://github.com/aws-amplify/amplify-cli/commit/09626505aae3730e830e819bf627354c359b1fec))
- fix [#1264](https://github.com/aws-amplify/amplify-cli/issues/1264) ([d901daf](https://github.com/aws-amplify/amplify-cli/commit/d901daf825ef1857c57da85b559d813ec57ae212))
- fix redirect URI regex ([eaec6c2](https://github.com/aws-amplify/amplify-cli/commit/eaec6c2dac5972d1c979458147960b65e265fa2f))
- fixes [#1471](https://github.com/aws-amplify/amplify-cli/issues/1471) ([52b26cb](https://github.com/aws-amplify/amplify-cli/commit/52b26cbc9446d373edc09179866f9c5e9766a1bc))
- fixes update of aws exports when switching envs ([55a14bf](https://github.com/aws-amplify/amplify-cli/commit/55a14bf73c8f9e36519819900134047b4e740819))
- fixing auth update flow ([#1579](https://github.com/aws-amplify/amplify-cli/issues/1579)) ([65783b5](https://github.com/aws-amplify/amplify-cli/commit/65783b57ff85e2059d018eff8a977840077b120b))
- fixing force push on init of new env ([#1949](https://github.com/aws-amplify/amplify-cli/issues/1949)) ([d4d0c97](https://github.com/aws-amplify/amplify-cli/commit/d4d0c97d6445630ed49d669531cebb1bcd9e0218)), closes [#1945](https://github.com/aws-amplify/amplify-cli/issues/1945)
- fixing function build issue + e2e tests ([#1750](https://github.com/aws-amplify/amplify-cli/issues/1750)) ([c11c0bc](https://github.com/aws-amplify/amplify-cli/commit/c11c0bcadde3281836de0fd4ab79e17f30b2d127)), closes [#1747](https://github.com/aws-amplify/amplify-cli/issues/1747)
- fixing ref name values in function cfn templates ([#1605](https://github.com/aws-amplify/amplify-cli/issues/1605)) ([3bda285](https://github.com/aws-amplify/amplify-cli/commit/3bda2852ef0433e80f8e415d8ca34a340d25588b)), closes [#1574](https://github.com/aws-amplify/amplify-cli/issues/1574)
- fixing the IAM policies for AppSync API ([#1634](https://github.com/aws-amplify/amplify-cli/issues/1634)) ([9fb2fa9](https://github.com/aws-amplify/amplify-cli/commit/9fb2fa956d9d86b07c837a547766000fe88d3011))
- lint error ([abc176c](https://github.com/aws-amplify/amplify-cli/commit/abc176c008ecfd7cafd8d1410633983348b2e78a))
- pin lerna version number to fix publishing ([7e9c960](https://github.com/aws-amplify/amplify-cli/commit/7e9c960c4d2c971e0e90d3f5e4ac072779eb36e8))
- remove grunt-lambda dependency for local function testing ([#1872](https://github.com/aws-amplify/amplify-cli/issues/1872)) ([bbe55bf](https://github.com/aws-amplify/amplify-cli/commit/bbe55bf6cdc626270ba738fdd5f2fbc33277525b))
- replacing rel paths with plugin func ([71f553f](https://github.com/aws-amplify/amplify-cli/commit/71f553fd21a85da9ac6a54f9fbe070ea4a3debf1))
- spelling mistakes in cli output ([#1588](https://github.com/aws-amplify/amplify-cli/issues/1588)) ([787ac57](https://github.com/aws-amplify/amplify-cli/commit/787ac57e2d34090173f6913df84e7e9b6199f8e5))
- stringify region in function Cloudformation file ([#1536](https://github.com/aws-amplify/amplify-cli/issues/1536)) ([cb6f438](https://github.com/aws-amplify/amplify-cli/commit/cb6f438b22332d14b994ca866aa74d55c974a60f))
- **1342:** api push error on CI/CD platforms. ([#1383](https://github.com/aws-amplify/amplify-cli/issues/1383)) ([e0eff65](https://github.com/aws-amplify/amplify-cli/commit/e0eff6513a9a8f33970d21a03442118001178ba6)), closes [#1342](https://github.com/aws-amplify/amplify-cli/issues/1342) [#1342](https://github.com/aws-amplify/amplify-cli/issues/1342)
- **amplify-category-api:** fix init env bug ([#1715](https://github.com/aws-amplify/amplify-cli/issues/1715)) ([1e21371](https://github.com/aws-amplify/amplify-cli/commit/1e21371900c315ca9fcbb9bcb1f4c8ec9800ee86)), closes [#1713](https://github.com/aws-amplify/amplify-cli/issues/1713)
- **amplify-category-auth:** add policy name char length limit ([#1492](https://github.com/aws-amplify/amplify-cli/issues/1492)) ([d6a8785](https://github.com/aws-amplify/amplify-cli/commit/d6a87859e527bf94bff10382f7fea78b8f94cdf1)), closes [#1199](https://github.com/aws-amplify/amplify-cli/issues/1199)
- **amplify-category-auth:** adding PreAuthentication trigger ([42ee201](https://github.com/aws-amplify/amplify-cli/commit/42ee201051c3e4079837ebcc14bdba43fce45f8d)), closes [#1838](https://github.com/aws-amplify/amplify-cli/issues/1838)
- **amplify-category-auth:** fix domain reserved words ([#1544](https://github.com/aws-amplify/amplify-cli/issues/1544)) ([31d4a89](https://github.com/aws-amplify/amplify-cli/commit/31d4a89173a1cc068160c13cdaaa68f4b7e4f64f)), closes [#1513](https://github.com/aws-amplify/amplify-cli/issues/1513)
- **amplify-category-auth:** fixes cloudformation template ([f28d0cf](https://github.com/aws-amplify/amplify-cli/commit/f28d0cf2c2de5be290b542911128249fb6d64fab)), closes [#1247](https://github.com/aws-amplify/amplify-cli/issues/1247)
- **amplify-category-auth:** fixes cloudformation template ([706de43](https://github.com/aws-amplify/amplify-cli/commit/706de438d542b825840b9142bcc93310902cdd29)), closes [#1247](https://github.com/aws-amplify/amplify-cli/issues/1247)
- **amplify-category-auth:** match cognito token expiration date range ([eb4c9ee](https://github.com/aws-amplify/amplify-cli/commit/eb4c9eecc92ba1cdb9959f173e806f71c601f750)), closes [#1385](https://github.com/aws-amplify/amplify-cli/issues/1385)
- **amplify-category-auth:** provide correct arn in permission policies ([#1610](https://github.com/aws-amplify/amplify-cli/issues/1610)) ([27fd157](https://github.com/aws-amplify/amplify-cli/commit/27fd157f8fd6d226772e164477748e1b28a4819f))
- **amplify-category-auth:** uses public_profile for FB scopes ([c9af7b7](https://github.com/aws-amplify/amplify-cli/commit/c9af7b7d559641118cb3aab07ee10ad047e4d2b1)), closes [#1335](https://github.com/aws-amplify/amplify-cli/issues/1335)
- **amplify-category-function:** add error status code ([a3aaaad](https://github.com/aws-amplify/amplify-cli/commit/a3aaaad281552f2d4d1d81685296385fa097916e)), closes [#1003](https://github.com/aws-amplify/amplify-cli/issues/1003)
- **amplify-category-function:** add policy for GSI ([#1618](https://github.com/aws-amplify/amplify-cli/issues/1618)) ([cc2f1b6](https://github.com/aws-amplify/amplify-cli/commit/cc2f1b66963b91e34169455e6dcdb04bb1cc9f87)), closes [#791](https://github.com/aws-amplify/amplify-cli/issues/791)
- **amplify-category-function:** enable SAM templates for functions ([#1763](https://github.com/aws-amplify/amplify-cli/issues/1763)) ([9fc3854](https://github.com/aws-amplify/amplify-cli/commit/9fc3854857e61f7d1349c1fad0db1bb2d7cbaa17)), closes [#1740](https://github.com/aws-amplify/amplify-cli/issues/1740)
- **amplify-category-function:** fixed openEditor ([#1664](https://github.com/aws-amplify/amplify-cli/issues/1664)) ([0b9cf28](https://github.com/aws-amplify/amplify-cli/commit/0b9cf281c258f4e031d606431938244f6ec4d0c1))
- **amplify-category-function:** fixing headless params ([#1828](https://github.com/aws-amplify/amplify-cli/issues/1828)) ([816e526](https://github.com/aws-amplify/amplify-cli/commit/816e52664df85ed8009a3e9ee6bd493d238591ee)), closes [#1826](https://github.com/aws-amplify/amplify-cli/issues/1826) [#1826](https://github.com/aws-amplify/amplify-cli/issues/1826)
- **amplify-category-function:** open Editor fix for displayname ([#1798](https://github.com/aws-amplify/amplify-cli/issues/1798)) ([e62aba6](https://github.com/aws-amplify/amplify-cli/commit/e62aba69b268e50d806f45630cc666262f5337c6))
- **amplify-category-hosting:** fix CloudFront invalidation bug ([#1553](https://github.com/aws-amplify/amplify-cli/issues/1553)) ([2a5ef17](https://github.com/aws-amplify/amplify-cli/commit/2a5ef17a2197809140fd0733fe6053ced9fc67b1)), closes [#1550](https://github.com/aws-amplify/amplify-cli/issues/1550)
- **amplify-category-interactions:** call updateMetaAfterAdd only once ([#1653](https://github.com/aws-amplify/amplify-cli/issues/1653)) ([dc28758](https://github.com/aws-amplify/amplify-cli/commit/dc28758c647ea6d5381d25a02d84cce8a548c87d)), closes [#1621](https://github.com/aws-amplify/amplify-cli/issues/1621)
- **amplify-category-notifications:** remove env name ([#1440](https://github.com/aws-amplify/amplify-cli/issues/1440)) ([19ff63c](https://github.com/aws-amplify/amplify-cli/commit/19ff63cce2865e3f50b1ef24693a5611ed5547d4)), closes [#1372](https://github.com/aws-amplify/amplify-cli/issues/1372)
- **amplify-category-storage:** consider env in S3TriggerBucketPolicy ([#1853](https://github.com/aws-amplify/amplify-cli/issues/1853)) ([73dbe84](https://github.com/aws-amplify/amplify-cli/commit/73dbe84262c94203dfbd8b54298905cba5f317fd)), closes [#1852](https://github.com/aws-amplify/amplify-cli/issues/1852)
- **amplify-category-storage:** pass context to DDB migration helper ([#1392](https://github.com/aws-amplify/amplify-cli/issues/1392)) ([dbec705](https://github.com/aws-amplify/amplify-cli/commit/dbec7053eb669c290d27142ef5e23a78a1a697bd)), closes [#1384](https://github.com/aws-amplify/amplify-cli/issues/1384)
- **amplify-category-storage:** remove unnecessary comma ([#1755](https://github.com/aws-amplify/amplify-cli/issues/1755)) ([854c4c6](https://github.com/aws-amplify/amplify-cli/commit/854c4c692a572c2068f855d4552deda3eca9e234))
- **amplify-cli:** return valid JSON when using amplify env get --json ([#1622](https://github.com/aws-amplify/amplify-cli/issues/1622)) ([49f4339](https://github.com/aws-amplify/amplify-cli/commit/49f4339303bb3f06c32ce0a41d3979007de92343)), closes [#1616](https://github.com/aws-amplify/amplify-cli/issues/1616)
- **amplify-codegen:** auto detect S3Object in swift codegen ([#1482](https://github.com/aws-amplify/amplify-cli/issues/1482)) ([ea2de2d](https://github.com/aws-amplify/amplify-cli/commit/ea2de2d710a62446e6a8fbbdc946e7f575a770d3)), closes [#1468](https://github.com/aws-amplify/amplify-cli/issues/1468)
- **amplify-codegen:** fix cross os issue ([#1741](https://github.com/aws-amplify/amplify-cli/issues/1741)) ([ae20d0d](https://github.com/aws-amplify/amplify-cli/commit/ae20d0dff97e08dbbea462fd6c12da550b70e799)), closes [#1522](https://github.com/aws-amplify/amplify-cli/issues/1522)
- **amplify-codegen:** make codegen multienv aware ([b146c77](https://github.com/aws-amplify/amplify-cli/commit/b146c77956d2e3470c8ac5964ec9f6ff368624a8)), closes [#1243](https://github.com/aws-amplify/amplify-cli/issues/1243)
- **amplify-graphql-types-generator:** add inflection black list ([c09f183](https://github.com/aws-amplify/amplify-cli/commit/c09f183eb21241e3967d662aa5f02157bb2c3b11)), closes [#1328](https://github.com/aws-amplify/amplify-cli/issues/1328)
- **amplify-graphql-types-generator:** angular service gen scalar support ([0299cf5](https://github.com/aws-amplify/amplify-cli/commit/0299cf561a2ce0a4252687bc00f846044536cd84)), closes [#1121](https://github.com/aws-amplify/amplify-cli/issues/1121)
- **amplify-graphql-types-generator:** set AWSTimestamp to number type ([#1483](https://github.com/aws-amplify/amplify-cli/issues/1483)) ([86fb2f1](https://github.com/aws-amplify/amplify-cli/commit/86fb2f19b40a4f6fc081454871d64c7ad2caeaf9)), closes [#1348](https://github.com/aws-amplify/amplify-cli/issues/1348)
- **amplify-provider-awscloudformation:** check creds before setting ([#1438](https://github.com/aws-amplify/amplify-cli/issues/1438)) ([0c2e2d1](https://github.com/aws-amplify/amplify-cli/commit/0c2e2d18748b31ccb3e98a1b6cbbde41d653314d)), closes [#1424](https://github.com/aws-amplify/amplify-cli/issues/1424)
- **amplify-provider-awscloudformation:** ensure build directory exist ([#1435](https://github.com/aws-amplify/amplify-cli/issues/1435)) ([a82fa99](https://github.com/aws-amplify/amplify-cli/commit/a82fa991b61bdf511d4b749c4d67fde897af3282)), closes [#1430](https://github.com/aws-amplify/amplify-cli/issues/1430) [#1430](https://github.com/aws-amplify/amplify-cli/issues/1430)
- **amplify-provider-awscloudformation:** filter by template extensions ([#1596](https://github.com/aws-amplify/amplify-cli/issues/1596)) ([adbf95a](https://github.com/aws-amplify/amplify-cli/commit/adbf95ac532492f5104f9d699f8cd508e0c68f4a))
- **amplify-provider-awscloudformation:** fix general configeLevel init ([#1602](https://github.com/aws-amplify/amplify-cli/issues/1602)) ([426acbf](https://github.com/aws-amplify/amplify-cli/commit/426acbf121e1d6ba5e62f15dc1c295c6b7c79fa9)), closes [#1388](https://github.com/aws-amplify/amplify-cli/issues/1388)
- **amplify-provider-awscloudformation:** fix http proxy ([#1604](https://github.com/aws-amplify/amplify-cli/issues/1604)) ([16dc4b4](https://github.com/aws-amplify/amplify-cli/commit/16dc4b4cc19b9474dad147391a46738241763e57)), closes [#495](https://github.com/aws-amplify/amplify-cli/issues/495)
- **amplify-provider-awscloudformation:** fix MFA prompt during init ([#1858](https://github.com/aws-amplify/amplify-cli/issues/1858)) ([2de3185](https://github.com/aws-amplify/amplify-cli/commit/2de31854252e1d2ca994266d5442d8d5190f7754)), closes [#1807](https://github.com/aws-amplify/amplify-cli/issues/1807)
- **amplify-provider-awscloudformation:** generate consistent S3 keys ([#1668](https://github.com/aws-amplify/amplify-cli/issues/1668)) ([e393d3a](https://github.com/aws-amplify/amplify-cli/commit/e393d3af95b9f59caeede867bd33e8f7a8d590b5)), closes [#1666](https://github.com/aws-amplify/amplify-cli/issues/1666)
- **amplify-provider-awscloudformation:** ignore dot files ([#1256](https://github.com/aws-amplify/amplify-cli/issues/1256)) ([845298a](https://github.com/aws-amplify/amplify-cli/commit/845298adaf776d95a6a388cd47965c4959bb8e69)), closes [#1135](https://github.com/aws-amplify/amplify-cli/issues/1135)
- **amplify-provider-awscloudformation:** prevent abrupt closing of CLI ([#1655](https://github.com/aws-amplify/amplify-cli/issues/1655)) ([cf755df](https://github.com/aws-amplify/amplify-cli/commit/cf755df4e9268614c1c2210199750098e86b9b85))
- **amplify-provider-awscloudformation:** support multiprofile delete ([#1353](https://github.com/aws-amplify/amplify-cli/issues/1353)) ([404f1c3](https://github.com/aws-amplify/amplify-cli/commit/404f1c31b210c0a17a87fd088506198fef015bf7)), closes [#978](https://github.com/aws-amplify/amplify-cli/issues/978)
- **cli:** add default value for options in updateAmplifyMeta ([#1648](https://github.com/aws-amplify/amplify-cli/issues/1648)) ([f9c87bb](https://github.com/aws-amplify/amplify-cli/commit/f9c87bb4364c18da42e526c886c9941ff5266254)), closes [#1621](https://github.com/aws-amplify/amplify-cli/issues/1621)
- **cli:** check BOM in json read ([#1293](https://github.com/aws-amplify/amplify-cli/issues/1293)) ([adf7ab7](https://github.com/aws-amplify/amplify-cli/commit/adf7ab7de01786535e734c3916e4d149ff1b2bf9)), closes [#1280](https://github.com/aws-amplify/amplify-cli/issues/1280)
- **cli:** fix inquirer version ([#1690](https://github.com/aws-amplify/amplify-cli/issues/1690)) ([9246032](https://github.com/aws-amplify/amplify-cli/commit/9246032603db49022c444e41faa5881592ce5dc9)), closes [#1688](https://github.com/aws-amplify/amplify-cli/issues/1688)
- **cli:** publish check user response ([f88e9b2](https://github.com/aws-amplify/amplify-cli/commit/f88e9b2c447b9b2101fc16629abfcd3c4d2ffe1a)), closes [#965](https://github.com/aws-amplify/amplify-cli/issues/965)
- **cli:** support es6 import/export ([#1635](https://github.com/aws-amplify/amplify-cli/issues/1635)) ([18d5409](https://github.com/aws-amplify/amplify-cli/commit/18d5409e80c13d2a1d700be846af3f0af5c67dc2)), closes [#1623](https://github.com/aws-amplify/amplify-cli/issues/1623)
- **graphql-auth-transformer:** conditional group expression ([#1186](https://github.com/aws-amplify/amplify-cli/issues/1186)) ([83ef244](https://github.com/aws-amplify/amplify-cli/commit/83ef2440b27211d6d89b8fe875c40b602d4f5cda)), closes [#360](https://github.com/aws-amplify/amplify-cli/issues/360)
- **graphql-dynamodb-transformer:** always output datasource name ([#1182](https://github.com/aws-amplify/amplify-cli/issues/1182)) ([a58e1ac](https://github.com/aws-amplify/amplify-cli/commit/a58e1ac51faa2cf558c2eed81d27c619c3a40e92))
- **graphql-dynamodb-transformer:** backward compatibility ([de3e47c](https://github.com/aws-amplify/amplify-cli/commit/de3e47c0e2cfec57cff5183797770635c507d5fe))
- **graphql-elasticsearch-transformer:** use Fn::GetAtt for StreamArn ([#1494](https://github.com/aws-amplify/amplify-cli/issues/1494)) ([8c80462](https://github.com/aws-amplify/amplify-cli/commit/8c8046214d1abbfd2f3752fec8ff6c1d3dd104ce)), closes [/github.com/aws-amplify/amplify-cli/commit/df1712b00427792bcce34adf7027698afd8e6841#diff-22e2a5351fb3f897025bc1e45811acb5R168](https://github.com//github.com/aws-amplify/amplify-cli/commit/df1712b00427792bcce34adf7027698afd8e6841/issues/diff-22e2a5351fb3f897025bc1e45811acb5R168)
- **graphql-function-transformer:** handle NONE env in [@function](https://github.com/function) ([#1491](https://github.com/aws-amplify/amplify-cli/issues/1491)) ([c742d7d](https://github.com/aws-amplify/amplify-cli/commit/c742d7dff987f6e97856dba261a98581390cd6f0))
- **graphql-key-transformer:** 1587 bug fix ([3a04e19](https://github.com/aws-amplify/amplify-cli/commit/3a04e19c89d133af281f943062a65b090872d868)), closes [#1587](https://github.com/aws-amplify/amplify-cli/issues/1587)
- **graphql-key-transformer:** Fix type resolve for 2 field [@key](https://github.com/key) when second field is an Enum ([#1619](https://github.com/aws-amplify/amplify-cli/issues/1619)) ([bbd82b0](https://github.com/aws-amplify/amplify-cli/commit/bbd82b067a140320a399128bb9c3a5c995358c40)), closes [#1572](https://github.com/aws-amplify/amplify-cli/issues/1572)
- **graphql-key-transformer:** update filter to emit JSON for filter expression([#1580](https://github.com/aws-amplify/amplify-cli/issues/1580)) ([8c9a3cd](https://github.com/aws-amplify/amplify-cli/commit/8c9a3cdec157242e104dd4c38f7f60ffd458371e)), closes [#1554](https://github.com/aws-amplify/amplify-cli/issues/1554)
- **graphql-relational-schema-transformer:** add additional RDS Policies ([#1508](https://github.com/aws-amplify/amplify-cli/issues/1508)) ([b1dcd08](https://github.com/aws-amplify/amplify-cli/commit/b1dcd08318538fa55e3631a10f61d26120d1d913))
- **graphql-relational-schema-transformer:** support \_ in table name ([17e9a04](https://github.com/aws-amplify/amplify-cli/commit/17e9a0433568b16dc5579c391f3d13c2282b4962)), closes [#1504](https://github.com/aws-amplify/amplify-cli/issues/1504)
- typo in CONTRIBUTING.md ([#1631](https://github.com/aws-amplify/amplify-cli/issues/1631)) ([dfad5fc](https://github.com/aws-amplify/amplify-cli/commit/dfad5fc06afbd056d8a8cce5af29808235092bdd))
- update CLI to handle UTF8 BOM ([#1357](https://github.com/aws-amplify/amplify-cli/issues/1357)) ([b0afa07](https://github.com/aws-amplify/amplify-cli/commit/b0afa07ab22d50409ff93c41350995cd7d2a1084)), closes [#1355](https://github.com/aws-amplify/amplify-cli/issues/1355) [#1122](https://github.com/aws-amplify/amplify-cli/issues/1122)
- use JSON parse instead of require in xr ([#1312](https://github.com/aws-amplify/amplify-cli/issues/1312)) ([5f0a4e9](https://github.com/aws-amplify/amplify-cli/commit/5f0a4e9ebfae571d4ccc5568a83f1c6be19d021e))

### Features

- add ClientDatabasePrefi to support mixed auth ([#1382](https://github.com/aws-amplify/amplify-cli/issues/1382)) ([8f03a37](https://github.com/aws-amplify/amplify-cli/commit/8f03a3788980b7651b88eeb6376f3d80e7213191))
- add graphQLEndpoint as an env var to lambda functions ([#1641](https://github.com/aws-amplify/amplify-cli/issues/1641)) ([ae825a6](https://github.com/aws-amplify/amplify-cli/commit/ae825a61514f7e173da012326a2f5de0de0626e4)), closes [#1620](https://github.com/aws-amplify/amplify-cli/issues/1620)
- **graphql-dynamodb-transformer:** add more specific mapping ([5dc2d3b](https://github.com/aws-amplify/amplify-cli/commit/5dc2d3bc85c5b89d300c30cc20928b175592c9d9))
- add support for ap-northeast-2 ([a263afc](https://github.com/aws-amplify/amplify-cli/commit/a263afc1ef3c58bea6596b04e5664e2a628458c7))
- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c1927da10f8c54f38a523021187361131c))
- bump aws-sdk ver to support mixed auth ([#1414](https://github.com/aws-amplify/amplify-cli/issues/1414)) ([b2ed52b](https://github.com/aws-amplify/amplify-cli/commit/b2ed52bfe927981552c7bcbe1caad4ccde715313))
- cognito + s3 + dyanmodb lambda trigger support ([#1783](https://github.com/aws-amplify/amplify-cli/issues/1783)) ([c6fc838](https://github.com/aws-amplify/amplify-cli/commit/c6fc83834ae70f3e0f5e1c8810a56de76ba36d41))
- **amplify-category-function:** provide evntName arg to lambda_invoke ([#1624](https://github.com/aws-amplify/amplify-cli/issues/1624)) ([a61237f](https://github.com/aws-amplify/amplify-cli/commit/a61237ff51a26fbf93ee423b43a34d89c06acf57))
- feature/[@key](https://github.com/key) ([#1463](https://github.com/aws-amplify/amplify-cli/issues/1463)) ([00ed819](https://github.com/aws-amplify/amplify-cli/commit/00ed819419a4959a6d62da2fc5477621c046eff0))
- flow to add policies to access amplify resources from Lambda ([#1462](https://github.com/aws-amplify/amplify-cli/issues/1462)) ([fee247c](https://github.com/aws-amplify/amplify-cli/commit/fee247c74f54b050f7b7a6ea0733fbd08976f232))
- Multiauth external api add ([#1329](https://github.com/aws-amplify/amplify-cli/issues/1329)) ([13d9fc3](https://github.com/aws-amplify/amplify-cli/commit/13d9fc3fa32be5fc6be454fe91e0de0bb7226bef))
- sanity check ([#1815](https://github.com/aws-amplify/amplify-cli/issues/1815)) ([54a8dbe](https://github.com/aws-amplify/amplify-cli/commit/54a8dbe8925a4e73358b03ba927267a2df328b78))
- **amplify-provider-awscloudformation:** add http default transformer ([#1410](https://github.com/aws-amplify/amplify-cli/issues/1410)) ([41cd9d0](https://github.com/aws-amplify/amplify-cli/commit/41cd9d0bbfbb0c7cbf1eb853e469262fffb8ee41))
- **amplify-provider-awscloudformation:** append env name ([8d8e522](https://github.com/aws-amplify/amplify-cli/commit/8d8e522467dfacf6bf882536aaf73371c8233050)), closes [#1340](https://github.com/aws-amplify/amplify-cli/issues/1340)
- **amplify-provider-awscloudformation:** update fn build file name ([#1702](https://github.com/aws-amplify/amplify-cli/issues/1702)) ([0658d75](https://github.com/aws-amplify/amplify-cli/commit/0658d7559dfd6e857aeb9e4a6dd96ce5d013e610))
- **field-level-auth:** Add field level auth support via the [@auth](https://github.com/auth) directive ([#1262](https://github.com/aws-amplify/amplify-cli/issues/1262)) ([3b1c600](https://github.com/aws-amplify/amplify-cli/commit/3b1c6006f174c414485bd3520774bbcb8ed5c4d7)), closes [#1043](https://github.com/aws-amplify/amplify-cli/issues/1043)
- **graphql-dynamodb-transformer:** always output stream arn ([df1712b](https://github.com/aws-amplify/amplify-cli/commit/df1712b00427792bcce34adf7027698afd8e6841)), closes [#980](https://github.com/aws-amplify/amplify-cli/issues/980)
- **graphql-dynamodb-transformer:** output table name ([#1215](https://github.com/aws-amplify/amplify-cli/issues/1215)) ([038b876](https://github.com/aws-amplify/amplify-cli/commit/038b876eaa7a3671b4798cd53cd3d58d8b4aaf52)), closes [#1145](https://github.com/aws-amplify/amplify-cli/issues/1145) [#1145](https://github.com/aws-amplify/amplify-cli/issues/1145)

### Reverts

- Revert "build: avoid removing package-lock files in production-build command" ([ae394e9](https://github.com/aws-amplify/amplify-cli/commit/ae394e961c696990f1263e47beb564cc614cdc60))
- Revert "build: add package-lock.json file to amplify-cli package" ([cf83a3e](https://github.com/aws-amplify/amplify-cli/commit/cf83a3e6aa4edf114f40f0de4ef2b5b9a93967e7))
- Revert "refactor: add fuzzy matching CX improvement to scene config input" ([967a303](https://github.com/aws-amplify/amplify-cli/commit/967a303aed3e2f7da49a7ab951844f6b02704353))

## 1.1.9-beta.0 (2019-04-01)

## 1.1.9 (2019-04-02)

### Bug Fixes

- add env to cloudformation parameters ([d9eac81](https://github.com/aws-amplify/amplify-cli/commit/d9eac81f022ebfe3ffd84c3dc813b952283ec7bc))
- add scene name validation to prevent cloudformation errors ([f8cb167](https://github.com/aws-amplify/amplify-cli/commit/f8cb167caa7be38f1297419734baeeacaf8fb0d0))
- allow absolute path for scene config ([faba5ea](https://github.com/aws-amplify/amplify-cli/commit/faba5ea11917495b8585b2f333b81cc68d20f55f))
- fix redirect URI regex ([eaec6c2](https://github.com/aws-amplify/amplify-cli/commit/eaec6c2dac5972d1c979458147960b65e265fa2f))
- lint error ([abc176c](https://github.com/aws-amplify/amplify-cli/commit/abc176c008ecfd7cafd8d1410633983348b2e78a))
- lint errors ([0360a1a](https://github.com/aws-amplify/amplify-cli/commit/0360a1aba07df33427da406cfceff5fdc7009a85))
- lint errors ([4cb6e57](https://github.com/aws-amplify/amplify-cli/commit/4cb6e570814b95e1f21fbec024a5068f212b7c66))
- lint errors ([2159ca3](https://github.com/aws-amplify/amplify-cli/commit/2159ca3a8a47ae72ef91c894ede0ec32d19ca0a4))
- pin lerna version number to fix publishing ([7e9c960](https://github.com/aws-amplify/amplify-cli/commit/7e9c960c4d2c971e0e90d3f5e4ac072779eb36e8))
- remove await unit tests ([70270d0](https://github.com/aws-amplify/amplify-cli/commit/70270d06bd9545fbe298c5b67a3f63b83f2e79a4))
- remove unneeded log statement ([7910031](https://github.com/aws-amplify/amplify-cli/commit/7910031f8a73d6be95c4d684be7235306dfe8460))
- **amplify-cli:** promise not resolving in lts/dubnium ([#1028](https://github.com/aws-amplify/amplify-cli/issues/1028)) ([8a966be](https://github.com/aws-amplify/amplify-cli/commit/8a966beeed5a6fb57874ba084e6b42a23aded20a))
- update scene URI parsing with projectName URI decoding ([e0ce793](https://github.com/aws-amplify/amplify-cli/commit/e0ce793efe080374937f291619d1ee9f15e0e771))
- update xr sumerian config generation and bump versions ([4f02f1d](https://github.com/aws-amplify/amplify-cli/commit/4f02f1d98cd863df9ec604dd5af736ec2d64f915))
- use helper functions for adding metadata ([50f8d76](https://github.com/aws-amplify/amplify-cli/commit/50f8d76fe6bca913cc57f1223825ef895a96da7a))

### Features

- **graphql-elasticsearch-transformer:** export domain arn and endpoint ([97b8cad](https://github.com/aws-amplify/amplify-cli/commit/97b8cadf1d28a92f4f233cd10e7e16b351f27763)), closes [#1047](https://github.com/aws-amplify/amplify-cli/issues/1047)
- **graphql-elasticsearch-transformer:** map output to stack ([b7a8f6d](https://github.com/aws-amplify/amplify-cli/commit/b7a8f6dfc6291a27fd16d425e664b981975a3a2e)), closes [#1047](https://github.com/aws-amplify/amplify-cli/issues/1047)
- **graphql-elasticsearch-transformer:** output endpoint with https ([a5e7b73](https://github.com/aws-amplify/amplify-cli/commit/a5e7b73644bcc251ed1094e35ee3fef8b331e7a7)), closes [#1047](https://github.com/aws-amplify/amplify-cli/issues/1047)
- **graphql-elasticsearch-transformer:** test output to stack map ([cf8b0be](https://github.com/aws-amplify/amplify-cli/commit/cf8b0befe9c668738b52d653d96777ce7b7efe73)), closes [#1047](https://github.com/aws-amplify/amplify-cli/issues/1047)
- support for provisioning Cognito Hosted UI and support CRUD operations in Storage and API categories ([729b0de](https://github.com/aws-amplify/amplify-cli/commit/729b0de411e5a576271f270d765cc31e4ee1424d))
- use cloudformation to update meta ([d4ae437](https://github.com/aws-amplify/amplify-cli/commit/d4ae43733e5686724e4665329751f9208669adef))

### Reverts

- Revert "refactor: add fuzzy matching CX improvement to scene config input" ([967a303](https://github.com/aws-amplify/amplify-cli/commit/967a303aed3e2f7da49a7ab951844f6b02704353))

## 1.1.8-beta.0 (2019-03-21)

## 1.1.8 (2019-03-21)

### Bug Fixes

- **amplify-category-auth:** use right response signal of cfn-response ([572ca45](https://github.com/aws-amplify/amplify-cli/commit/572ca4503f774a4f006082c5205127b67cad8067))
- **cli:** allow update value to be other types ([c3832b6](https://github.com/aws-amplify/amplify-cli/commit/c3832b6a6630dcf701a6da2a990752953b68f644))

### Features

- added EU-WEST-2(London) support ([1e551df](https://github.com/aws-amplify/amplify-cli/commit/1e551df096ae7171dca21c4625d920ab9bb418a3)), closes [#415](https://github.com/aws-amplify/amplify-cli/issues/415)
- **graphql-dynamodb-transformer:** add DyanmoDB point in time recovery ([#989](https://github.com/aws-amplify/amplify-cli/issues/989)) ([0665508](https://github.com/aws-amplify/amplify-cli/commit/0665508833fbedc0e1a787a90d8b72435fd71696))

## 1.1.7-beta.0 (2019-03-04)

## 1.1.7 (2019-03-04)

### Bug Fixes

- **amplify-codegen:** use path relative to project root for codegen ([#951](https://github.com/aws-amplify/amplify-cli/issues/951)) ([7b52efb](https://github.com/aws-amplify/amplify-cli/commit/7b52efb1c3a558731aa70359be937ff6f6fc81fd)), closes [#886](https://github.com/aws-amplify/amplify-cli/issues/886)
- **amplify-graphql-docs-generator:** render enums like scalar fields ([4e4de94](https://github.com/aws-amplify/amplify-cli/commit/4e4de9450f932c1c1fc014f83d8a0c3ed400d8e4)), closes [#623](https://github.com/aws-amplify/amplify-cli/issues/623)
- ignore file starting with a dot when compiling configs ([#905](https://github.com/aws-amplify/amplify-cli/issues/905)) ([f094160](https://github.com/aws-amplify/amplify-cli/commit/f094160d7fab36becc6ac551dd9e2a77c83ee25d))
- mispelling with amplify delete instructions ([1bca2cd](https://github.com/aws-amplify/amplify-cli/commit/1bca2cd72f82dca4eb70905fe19018d341aea96d))
- remove env command instructions ([6207dc2](https://github.com/aws-amplify/amplify-cli/commit/6207dc20991d467088f69b631753ebc61be34d4f))
- **amplify-graphql-types-generator:** cannot redefine property: flatMap ([06b86b7](https://github.com/aws-amplify/amplify-cli/commit/06b86b7a9d63d877775b3460d78ad82136ac4fad))
- **amplify-graphql-types-generator:** generate consistent \_\_typename ([#966](https://github.com/aws-amplify/amplify-cli/issues/966)) ([8f532b8](https://github.com/aws-amplify/amplify-cli/commit/8f532b8d8ca051cec53ad4eb78341366f56bbc3d)), closes [#953](https://github.com/aws-amplify/amplify-cli/issues/953)
- **cli:** added global windows npm path to plugin import ([6c1a2e7](https://github.com/aws-amplify/amplify-cli/commit/6c1a2e7cf33a854eae0e99621f4c828787c9a43e))

### Features

- **amplify-provider-awscloudformation:** transition to private bucket ([45b92ee](https://github.com/aws-amplify/amplify-cli/commit/45b92eec8d84e82dd2743be6f096ce61eb87f3a4))

### Performance Improvements

- speed up push ([#963](https://github.com/aws-amplify/amplify-cli/issues/963)) ([eb8b852](https://github.com/aws-amplify/amplify-cli/commit/eb8b8523b569bdcaacff19ab7377990a5ed90e57)), closes [#914](https://github.com/aws-amplify/amplify-cli/issues/914)

## 1.1.6-beta.0 (2019-02-25)

## 1.1.6 (2019-02-25)

### Bug Fixes

- **@aws-amplify/cli:** change get-when fn to use updated proj config ([b1ef085](https://github.com/aws-amplify/amplify-cli/commit/b1ef085af7993f4d2e2183e973d7cfd3364fb4d8))
- **amplify-category-auth:** update auth cfn template to quote string ([1ff9e16](https://github.com/aws-amplify/amplify-cli/commit/1ff9e16ab4584e4943022dbe9498d512d2108287)), closes [#882](https://github.com/aws-amplify/amplify-cli/issues/882)

## 1.1.5-beta.1 (2019-02-24)

### Reverts

- Revert "ci:use team account's NPM_TOKEN (#929)" ([924bc60](https://github.com/aws-amplify/amplify-cli/commit/924bc606c996bba3bb3f4c6ac47d8a8d5cb4b94b)), closes [#929](https://github.com/aws-amplify/amplify-cli/issues/929)

## 1.1.5-beta.0 (2019-02-24)

## 1.1.5 (2019-02-24)

### Bug Fixes

- typo on `amplify env` help text ([4837ec9](https://github.com/aws-amplify/amplify-cli/commit/4837ec92d0148f3897cbf7f2ef7881ad4d75ea63))
- **amplify-provider-awscloudformation:** fix [#931](https://github.com/aws-amplify/amplify-cli/issues/931) ([bc724c9](https://github.com/aws-amplify/amplify-cli/commit/bc724c9dc444f1da7b76ec7a15b2eb1a3dcf116c))

### Features

- **amplify-provider-awscloudformation:** show CFN error when push fail ([#917](https://github.com/aws-amplify/amplify-cli/issues/917)) ([4502e4f](https://github.com/aws-amplify/amplify-cli/commit/4502e4f010bb92906c79a1890eb5f8c8fc51a2a1))

### Reverts

- Revert "ci:use team account's NPM_TOKEN (#929)" ([924bc60](https://github.com/aws-amplify/amplify-cli/commit/924bc606c996bba3bb3f4c6ac47d8a8d5cb4b94b)), closes [#929](https://github.com/aws-amplify/amplify-cli/issues/929)

## 1.1.4-beta.0 (2019-02-21)

## 1.1.4 (2019-02-21)

### Bug Fixes

- **amplify-category-api:** add check for provider during migration ([3207e41](https://github.com/aws-amplify/amplify-cli/commit/3207e4153e5a9f8a41dad5757d1ec83b7fc8185a)), closes [#918](https://github.com/aws-amplify/amplify-cli/issues/918)
- **amplify-category-notifications:** fix lint issues ([b2f4dfe](https://github.com/aws-amplify/amplify-cli/commit/b2f4dfed39e6aecfc5ccc7d14c00f185642391ae))
- **amplify-provider-awscloudformation:** fix pinpoint console url ([#912](https://github.com/aws-amplify/amplify-cli/issues/912)) ([77e3af6](https://github.com/aws-amplify/amplify-cli/commit/77e3af632e84a2ade3c97305dc20bef5989c9b46)), closes [#910](https://github.com/aws-amplify/amplify-cli/issues/910)

### Features

- **amplify-category-storage:** add s3 multipart upload to cfn ([0736eba](https://github.com/aws-amplify/amplify-cli/commit/0736eba333924ddba62385b2db79de863535f98c))

## 1.1.3-beta.0 (2019-02-19)

## 1.1.3 (2019-02-19)

### Bug Fixes

- **amplify-graphql-docs-generator:** update prettier version ([#901](https://github.com/aws-amplify/amplify-cli/issues/901)) ([da2632d](https://github.com/aws-amplify/amplify-cli/commit/da2632d4b6f58fe43675eb0b099dcad847eb2af2))
- **graphql-dynamodb-transformer:** generate filters for connection ([#889](https://github.com/aws-amplify/amplify-cli/issues/889)) ([166d12c](https://github.com/aws-amplify/amplify-cli/commit/166d12c2920d515fa413469cdb9c18d61816e867)), closes [#865](https://github.com/aws-amplify/amplify-cli/issues/865)

## 1.1.2-beta.0 (2019-02-14)

## 1.1.2 (2019-02-14)

### Bug Fixes

- **amplify-graphql-types-generator:** underscore support in swift ([#877](https://github.com/aws-amplify/amplify-cli/issues/877)) ([50588d2](https://github.com/aws-amplify/amplify-cli/commit/50588d26540c35ae1305413d2d3e2e9ab7a5d0c6)), closes [#643](https://github.com/aws-amplify/amplify-cli/issues/643)
- copy providerMetadata to amplify-meta during env init ([#880](https://github.com/aws-amplify/amplify-cli/issues/880)) ([b9c5f67](https://github.com/aws-amplify/amplify-cli/commit/b9c5f672382bb7c6aa114c01645a3a2f8359b0f1))

## 1.1.1-beta.0 (2019-02-14)

## 1.1.1 (2019-02-14)

### Bug Fixes

- add check for presence of s3template when forming nested cfn stack ([cc90080](https://github.com/aws-amplify/amplify-cli/commit/cc9008028c47dff2a9c462df0bdbfbd3168fe586))
- remove console statement ([055967e](https://github.com/aws-amplify/amplify-cli/commit/055967ea0cc5048da44d19e9a1f4025313aee10f))
- remove warning about beta version of the CLI ([5029f4a](https://github.com/aws-amplify/amplify-cli/commit/5029f4a66c837af0def7935673cb733daa385bde))

# 1.1.0 (2019-02-11)

## 1.0.6-beta.0 (2019-02-11)

### Bug Fixes

- cloudform/type versions ([ec6f99f](https://github.com/aws-amplify/amplify-cli/commit/ec6f99f2be2f248489bf976a9eacfab1b3851a5a))
- **amplify-graphql-types-generator:** fix types/node package version ([51c5a54](https://github.com/aws-amplify/amplify-cli/commit/51c5a54e621159d74478b1939b72ff480d836394))

### Features

- add warning message when migrating for manually modified CFN files ([c175102](https://github.com/aws-amplify/amplify-cli/commit/c1751021ce85670dbf0b01d8c797f60499678533))

## 1.0.5 (2019-02-11)

## 1.0.4-beta.1 (2019-02-11)

## 1.0.4-beta.0 (2019-02-11)

## 1.0.3-beta.1 (2019-02-11)

## 1.0.3-beta.0 (2019-02-11)

## 1.0.3 (2019-02-11)

## 1.0.2 (2019-02-11)

### Bug Fixes

- fix cloudform dependency issue in graphql-transformer-core ([17cbe02](https://github.com/aws-amplify/amplify-cli/commit/17cbe02e2c584cb801e945c85164543901feff2d))

## 1.0.1-beta.0 (2019-02-11)

## 1.0.1 (2019-02-11)

### Bug Fixes

- fix cloudform dependency issue in graphql-transformer-core ([17cbe02](https://github.com/aws-amplify/amplify-cli/commit/17cbe02e2c584cb801e945c85164543901feff2d))
