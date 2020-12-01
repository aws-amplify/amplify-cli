# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.25.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.24.4...amplify-category-auth@2.25.0) (2020-11-30)


### Bug Fixes

* add check for undefined appId ([#6009](https://github.com/aws-amplify/amplify-cli/issues/6009)) ([db9bf58](https://github.com/aws-amplify/amplify-cli/commit/db9bf58c5c721be1125aca6972ce76a9ef222cd9))
* appId is only required for admin ([#6007](https://github.com/aws-amplify/amplify-cli/issues/6007)) ([6eee2a2](https://github.com/aws-amplify/amplify-cli/commit/6eee2a245d2deae9d6faf81c84bbcd551561cd5c))


### Features

* pre-deploy pull, new login mechanism and pkg cli updates ([#5941](https://github.com/aws-amplify/amplify-cli/issues/5941)) ([7274251](https://github.com/aws-amplify/amplify-cli/commit/7274251faadc1035acce5f44699b172e10e2e67d))





## [2.24.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.24.3...amplify-category-auth@2.24.4) (2020-11-28)


### Reverts

* "fix: remove app client secret as best practice" ([#5992](https://github.com/aws-amplify/amplify-cli/issues/5992)) ([d7d7fcf](https://github.com/aws-amplify/amplify-cli/commit/d7d7fcf65fb2928f5d97c2ada9fac8ebf3522ee0)), closes [#5731](https://github.com/aws-amplify/amplify-cli/issues/5731) [#5829](https://github.com/aws-amplify/amplify-cli/issues/5829)





## [2.24.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.24.2...amplify-category-auth@2.24.3) (2020-11-27)

**Note:** Version bump only for package amplify-category-auth





## [2.24.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.24.1...amplify-category-auth@2.24.2) (2020-11-26)


### Bug Fixes

* check hostedUI flag ([#5958](https://github.com/aws-amplify/amplify-cli/issues/5958)) ([ed310da](https://github.com/aws-amplify/amplify-cli/commit/ed310da1923b62242bf019f840deaa620aed32d1))





## [2.24.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.24.0...amplify-category-auth@2.24.1) (2020-11-24)



# 4.35.0 (2020-11-24)


### Bug Fixes

* headless auth remove oauth when empty config specified ([#5930](https://github.com/aws-amplify/amplify-cli/issues/5930)) ([bb0d028](https://github.com/aws-amplify/amplify-cli/commit/bb0d028704f6508402794d5357c7501b366c9099))
* **amplify-category-auth:** external auth enabled bugfix ([#5916](https://github.com/aws-amplify/amplify-cli/issues/5916)) ([a782103](https://github.com/aws-amplify/amplify-cli/commit/a78210316aac2692b4fe6d1e75ccb12b97682792))
* new auth triggers overwrite previous selections ([#5945](https://github.com/aws-amplify/amplify-cli/issues/5945)) ([419b6d3](https://github.com/aws-amplify/amplify-cli/commit/419b6d3997df25f0de4b55e5716a8dcbe2f042d9))





# [2.24.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.22.1...amplify-category-auth@2.24.0) (2020-11-22)


### Bug Fixes

* remove app client secret as best practice ([#5731](https://github.com/aws-amplify/amplify-cli/issues/5731)) ([8bc0dd2](https://github.com/aws-amplify/amplify-cli/commit/8bc0dd2434b93c9a2cb1ff3bfad9cedd2d356c30))
* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))


### Features

* storage import ([#5893](https://github.com/aws-amplify/amplify-cli/issues/5893)) ([ad7b028](https://github.com/aws-amplify/amplify-cli/commit/ad7b028330bcee64d5124be7f27a8494dc8e9400))





# [2.23.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.7.3...amplify-category-auth@2.23.0) (2020-11-22)


### Bug Fixes

* [#1056](https://github.com/aws-amplify/amplify-cli/issues/1056), dedup environment file reading ([#2088](https://github.com/aws-amplify/amplify-cli/issues/2088)) ([940deaa](https://github.com/aws-amplify/amplify-cli/commit/940deaa6bbe7370e40e61946d0f1073623ba6e90))
* [#429](https://github.com/aws-amplify/amplify-cli/issues/429) - Editor hanging bug ([#2086](https://github.com/aws-amplify/amplify-cli/issues/2086)) ([6767445](https://github.com/aws-amplify/amplify-cli/commit/676744549f903fa3a4804d814eb325301ed462ba))
* add support for mobile hub migrated resources ([#5407](https://github.com/aws-amplify/amplify-cli/issues/5407)) ([5dfe287](https://github.com/aws-amplify/amplify-cli/commit/5dfe2872c153047ebdc56bc4f671fd57c12379d9))
* Added check to stop prompts for cognito triggers while using env commands ([#5039](https://github.com/aws-amplify/amplify-cli/issues/5039)) ([744dbc4](https://github.com/aws-amplify/amplify-cli/commit/744dbc42e847e273160caf3672365391f055191b))
* added exit code on remove ([#5427](https://github.com/aws-amplify/amplify-cli/issues/5427)) ([33132f7](https://github.com/aws-amplify/amplify-cli/commit/33132f764b290cafd345720409a5db8ea6088069))
* admin queries typo ([#5038](https://github.com/aws-amplify/amplify-cli/issues/5038)) ([1f37437](https://github.com/aws-amplify/amplify-cli/commit/1f374373061fff59b97e0f7ab3b3b84d1412416e))
* change auth method copy [#4184](https://github.com/aws-amplify/amplify-cli/issues/4184) ([#4198](https://github.com/aws-amplify/amplify-cli/issues/4198)) ([8097671](https://github.com/aws-amplify/amplify-cli/commit/809767143ebf7dd6868279407461d0657e83073a))
* change trigger assets path ([#5223](https://github.com/aws-amplify/amplify-cli/issues/5223)) ([f3eb615](https://github.com/aws-amplify/amplify-cli/commit/f3eb615a40bdb279938f9722d32468833d20f7b0))
* data inconsitency ([#5344](https://github.com/aws-amplify/amplify-cli/issues/5344)) ([bfe1903](https://github.com/aws-amplify/amplify-cli/commit/bfe19038b5b676056f45d7ffcc4c2460057936d8))
* deleted extra carriageReturn calls, fixed grammar in Auth dx ([#4237](https://github.com/aws-amplify/amplify-cli/issues/4237)) ([e6ccdab](https://github.com/aws-amplify/amplify-cli/commit/e6ccdab3f213e5b68999c18dd4ed2d1b7f60f0de))
* enable only-userpool flow without idp and addition of groups without roles tied to idp ([#3662](https://github.com/aws-amplify/amplify-cli/issues/3662)) ([67e0401](https://github.com/aws-amplify/amplify-cli/commit/67e04018d758e617374c4b8ba2298872e728d01e))
* Fix string literal to be a `Ref` in the cloud formation template ([#3630](https://github.com/aws-amplify/amplify-cli/issues/3630)) ([61e4ac9](https://github.com/aws-amplify/amplify-cli/commit/61e4ac95acc728c46440927c79c158b35abe0e39))
* headless auth required attributes must be an array ([#5467](https://github.com/aws-amplify/amplify-cli/issues/5467)) ([dbde67c](https://github.com/aws-amplify/amplify-cli/commit/dbde67c3c39ecb14b32da82546927cee14405a0b))
* imports and addResource return val ([#5279](https://github.com/aws-amplify/amplify-cli/issues/5279)) ([963b47c](https://github.com/aws-amplify/amplify-cli/commit/963b47c476113a7ba50646f01d7e57add11ad920))
* internal add auth entry point ([#5281](https://github.com/aws-amplify/amplify-cli/issues/5281)) ([59734ac](https://github.com/aws-amplify/amplify-cli/commit/59734ac41f120771abdb31a1f6f796c852fe23b7))
* move test package dependencies to devDependencies ([#2034](https://github.com/aws-amplify/amplify-cli/issues/2034)) ([f5623d0](https://github.com/aws-amplify/amplify-cli/commit/f5623d04a43e685901f4f1cd96e2a227164c71ee))
* occurred spelling mistake ([#4595](https://github.com/aws-amplify/amplify-cli/issues/4595)) ([a461487](https://github.com/aws-amplify/amplify-cli/commit/a461487072dbf422892ca24c436581b49c568429))
* prevent naming conflicts with new env names ([#3875](https://github.com/aws-amplify/amplify-cli/issues/3875)) ([a7734ae](https://github.com/aws-amplify/amplify-cli/commit/a7734aedb8e846620874ae69e5c38da393dbbe30)), closes [#3854](https://github.com/aws-amplify/amplify-cli/issues/3854)
* randomize role-names and bucket-name for auth and storage category ([#2709](https://github.com/aws-amplify/amplify-cli/issues/2709)) ([fe0e979](https://github.com/aws-amplify/amplify-cli/commit/fe0e979812bd3142a56a62bf15444cbb3dbbb6bb))
* refactor mobile hub migration checks ([#5632](https://github.com/aws-amplify/amplify-cli/issues/5632)) ([b796eb8](https://github.com/aws-amplify/amplify-cli/commit/b796eb8303bb903f5f531506254441a63eba2962))
* remove app client secret as best practice ([#5731](https://github.com/aws-amplify/amplify-cli/issues/5731)) ([8bc0dd2](https://github.com/aws-amplify/amplify-cli/commit/8bc0dd2434b93c9a2cb1ff3bfad9cedd2d356c30))
* scoping down user pool group IAM roles and adding --force to amplify push command ([#3609](https://github.com/aws-amplify/amplify-cli/issues/3609)) ([2e10a2f](https://github.com/aws-amplify/amplify-cli/commit/2e10a2ff62b61f57b2d513a7cfd0e4478f429f1f))
* store oauthMetadata properly on headless update ([#5597](https://github.com/aws-amplify/amplify-cli/issues/5597)) ([bdadafc](https://github.com/aws-amplify/amplify-cli/commit/bdadafca991bf9227046dba22cb196ac66e26cc6))
* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))
* translate include oAuthMetadata and fix hostedUI meta ([#5304](https://github.com/aws-amplify/amplify-cli/issues/5304)) ([3c44c11](https://github.com/aws-amplify/amplify-cli/commit/3c44c110964907be203c4c70ee4e80122956fe85))
* update auth supported services path ([#5184](https://github.com/aws-amplify/amplify-cli/issues/5184)) ([f8ff81d](https://github.com/aws-amplify/amplify-cli/commit/f8ff81da52f7a5376b5a36bdfed20d973b301f0f))
* update current-cloud backend-config on resource removal ([#5658](https://github.com/aws-amplify/amplify-cli/issues/5658)) ([592f694](https://github.com/aws-amplify/amplify-cli/commit/592f694530dd61302ff790fbcf5b3ea135812c47))
* username is default signin, doesn't need to be specified ([#5474](https://github.com/aws-amplify/amplify-cli/issues/5474)) ([4c42ad5](https://github.com/aws-amplify/amplify-cli/commit/4c42ad59db93144e131193c41c5f3d4aa4db1b92))
* **amplify-category-api:** fix api add-graphql-datasource command ([#2320](https://github.com/aws-amplify/amplify-cli/issues/2320)) ([a9c829d](https://github.com/aws-amplify/amplify-cli/commit/a9c829d79e91246d2bb9a707ccfe886502ceebe2))
* **amplify-category-auth:** checks for google idp federation on native ([#2541](https://github.com/aws-amplify/amplify-cli/issues/2541)) ([e1de9ac](https://github.com/aws-amplify/amplify-cli/commit/e1de9acac96dc0f7f7630fe8e75a0c0b89d15986)), closes [#2284](https://github.com/aws-amplify/amplify-cli/issues/2284) [#2284](https://github.com/aws-amplify/amplify-cli/issues/2284)
* **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad863ad4febde47e56209d6026cddb344044))
* **amplify-category-auth:** fix add to group cognito trigger bug [#2216](https://github.com/aws-amplify/amplify-cli/issues/2216) ([9471576](https://github.com/aws-amplify/amplify-cli/commit/9471576dbf802d2212997c616eff4c1104a4cfc0)), closes [#2214](https://github.com/aws-amplify/amplify-cli/issues/2214)
* **amplify-category-auth:** fix auth console ([#5408](https://github.com/aws-amplify/amplify-cli/issues/5408)) ([afbe065](https://github.com/aws-amplify/amplify-cli/commit/afbe065757ce488c1769848d0db3d03465a9b6c9)), closes [#5364](https://github.com/aws-amplify/amplify-cli/issues/5364)
* warning added for identity pool deletion ([#4731](https://github.com/aws-amplify/amplify-cli/issues/4731)) ([fb21a1c](https://github.com/aws-amplify/amplify-cli/commit/fb21a1cbb5d8b6254cca0ace6631c0a4e4820bba))
* **amplify-category-auth:** adding unique Id to Role name ([#4231](https://github.com/aws-amplify/amplify-cli/issues/4231)) ([21de1af](https://github.com/aws-amplify/amplify-cli/commit/21de1affd89142598a1f8022c387b3c04994b1e0))
* **amplify-category-auth:** adds trigger flag to lambda response ([#2548](https://github.com/aws-amplify/amplify-cli/issues/2548)) ([270b4ac](https://github.com/aws-amplify/amplify-cli/commit/270b4ac8464ac1800235beceed158f58a9538488))
* **amplify-category-auth:** fixed issue with updating urls in auth ([#3791](https://github.com/aws-amplify/amplify-cli/issues/3791)) ([236cd7a](https://github.com/aws-amplify/amplify-cli/commit/236cd7aecbdc2cbbb0dc9c565aae4e79ff40ebae))
* **amplify-category-auth:** removes deprecated props for external auth ([#2587](https://github.com/aws-amplify/amplify-cli/issues/2587)) ([08c0c70](https://github.com/aws-amplify/amplify-cli/commit/08c0c706bce7fd5996ce7c782512f694c1ff0455)), closes [#2309](https://github.com/aws-amplify/amplify-cli/issues/2309)
* **amplify-cli:** updating path in trigger indexes for node10 ([c4b1082](https://github.com/aws-amplify/amplify-cli/commit/c4b10820232e614a2951d840a6307031df73aebd)), closes [#3083](https://github.com/aws-amplify/amplify-cli/issues/3083)
* **cli:** add console command in the help message ([#2494](https://github.com/aws-amplify/amplify-cli/issues/2494)) ([cf0eddd](https://github.com/aws-amplify/amplify-cli/commit/cf0eddd1ba27b1126b0745cc068f205b2c2c8343)), closes [#1607](https://github.com/aws-amplify/amplify-cli/issues/1607)
* **cli:** remove unnecessary stack trace log when adding services ([#4610](https://github.com/aws-amplify/amplify-cli/issues/4610)) ([56efb32](https://github.com/aws-amplify/amplify-cli/commit/56efb32b79c47839cb9506a9300d40a01875a9fc))


### Features

* add support for listing Amazon Cognito groups ([#5109](https://github.com/aws-amplify/amplify-cli/issues/5109)) ([3157652](https://github.com/aws-amplify/amplify-cli/commit/3157652ecf51171b1a7375351bee1ba4af9d5f18))
* adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c1927da10f8c54f38a523021187361131c))
* Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
* feature flag implementation ([#4891](https://github.com/aws-amplify/amplify-cli/issues/4891)) ([6d1c632](https://github.com/aws-amplify/amplify-cli/commit/6d1c632952a49cb56670c11c9cb0c3620d0eb332))
* headless add auth ([#5224](https://github.com/aws-amplify/amplify-cli/issues/5224)) ([9f80512](https://github.com/aws-amplify/amplify-cli/commit/9f805128a8232278bb27d4fb1eaa5fecf7aa7a63))
* headless update auth ([#5308](https://github.com/aws-amplify/amplify-cli/issues/5308)) ([b942f35](https://github.com/aws-amplify/amplify-cli/commit/b942f3589f1df1361ae7eb6e42f18dbf6900d1bf))
* Lambda layers ([#4697](https://github.com/aws-amplify/amplify-cli/issues/4697)) ([4e97400](https://github.com/aws-amplify/amplify-cli/commit/4e974007d95c894ab4108a2dff8d5996e7e3ce25))
* storage import ([#5893](https://github.com/aws-amplify/amplify-cli/issues/5893)) ([ad7b028](https://github.com/aws-amplify/amplify-cli/commit/ad7b028330bcee64d5124be7f27a8494dc8e9400))
* support importing of auth resources ([#5591](https://github.com/aws-amplify/amplify-cli/issues/5591)) ([7903246](https://github.com/aws-amplify/amplify-cli/commit/790324680544fe18481f91390001f9f07a144203))
* **amplify-category-auth:** export lambda trigger roles in template ([#2894](https://github.com/aws-amplify/amplify-cli/issues/2894)) ([3d07717](https://github.com/aws-amplify/amplify-cli/commit/3d077179c28db7e2c8114bd88f27c99b08062313)), closes [#2303](https://github.com/aws-amplify/amplify-cli/issues/2303)
* **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))
* **cli:** usage measurement ([#3641](https://github.com/aws-amplify/amplify-cli/issues/3641)) ([a755863](https://github.com/aws-amplify/amplify-cli/commit/a7558637fbb791dc22e0a91ae16f1b96fe4e99df))
* User Pool Groups, Admin Auth Support, Custom Group Role Policies ([#2443](https://github.com/aws-amplify/amplify-cli/issues/2443)) ([09aecfd](https://github.com/aws-amplify/amplify-cli/commit/09aecfd0cb3dae2c17d1c512946cc733c4fe3d4c))
* **cli:** new plugin platform ([#2254](https://github.com/aws-amplify/amplify-cli/issues/2254)) ([7ec29dd](https://github.com/aws-amplify/amplify-cli/commit/7ec29dd4f2da8c90727b36469eca646d289877b6))


### Performance Improvements

* fulfill promises to upload files to S3 concurrently ([#4575](https://github.com/aws-amplify/amplify-cli/issues/4575)) ([9fbee8a](https://github.com/aws-amplify/amplify-cli/commit/9fbee8a71b4bf941dbda9d2f76fbedd73ab754ef)), closes [#4158](https://github.com/aws-amplify/amplify-cli/issues/4158)


### Reverts

* Revert "For the better security best practice, added PreventUserExistenceErrors: ENABLED. (#3534)" (#5736) ([3423228](https://github.com/aws-amplify/amplify-cli/commit/34232287c2e4dc466866528065c1900ac2954512)), closes [#3534](https://github.com/aws-amplify/amplify-cli/issues/3534) [#5736](https://github.com/aws-amplify/amplify-cli/issues/5736)
* Revert problematic PRs (#4803) ([f21a0f4](https://github.com/aws-amplify/amplify-cli/commit/f21a0f449a23c0c80a6f3280eef76bcbf3e9cb7c)), closes [#4803](https://github.com/aws-amplify/amplify-cli/issues/4803) [#4796](https://github.com/aws-amplify/amplify-cli/issues/4796) [#4576](https://github.com/aws-amplify/amplify-cli/issues/4576) [#4575](https://github.com/aws-amplify/amplify-cli/issues/4575) [#4610](https://github.com/aws-amplify/amplify-cli/issues/4610)





## [2.22.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.22.1...amplify-category-auth@2.22.4) (2020-11-20)


### Bug Fixes

* remove app client secret as best practice ([#5731](https://github.com/aws-amplify/amplify-cli/issues/5731)) ([8bc0dd2](https://github.com/aws-amplify/amplify-cli/commit/8bc0dd2434b93c9a2cb1ff3bfad9cedd2d356c30))
* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))





## [2.22.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.22.1...amplify-category-auth@2.22.3) (2020-11-20)


### Bug Fixes

* remove app client secret as best practice ([#5731](https://github.com/aws-amplify/amplify-cli/issues/5731)) ([8bc0dd2](https://github.com/aws-amplify/amplify-cli/commit/8bc0dd2434b93c9a2cb1ff3bfad9cedd2d356c30))
* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))





## [2.22.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.22.1...amplify-category-auth@2.22.2) (2020-11-19)


### Bug Fixes

* remove app client secret as best practice ([#5731](https://github.com/aws-amplify/amplify-cli/issues/5731)) ([8bc0dd2](https://github.com/aws-amplify/amplify-cli/commit/8bc0dd2434b93c9a2cb1ff3bfad9cedd2d356c30))
* team provider migration ([#5733](https://github.com/aws-amplify/amplify-cli/issues/5733)) ([d18f795](https://github.com/aws-amplify/amplify-cli/commit/d18f795560f0e671f63f1dcbe38931c951794619))





## [2.22.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.22.0...amplify-category-auth@2.22.1) (2020-11-08)

**Note:** Version bump only for package amplify-category-auth





# [2.22.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.21.2...amplify-category-auth@2.22.0) (2020-10-30)


### Features

* add support for listing Amazon Cognito groups ([#5109](https://github.com/aws-amplify/amplify-cli/issues/5109)) ([3157652](https://github.com/aws-amplify/amplify-cli/commit/3157652ecf51171b1a7375351bee1ba4af9d5f18))


### Reverts

* Revert "For the better security best practice, added PreventUserExistenceErrors: ENABLED. (#3534)" (#5736) ([3423228](https://github.com/aws-amplify/amplify-cli/commit/34232287c2e4dc466866528065c1900ac2954512)), closes [#3534](https://github.com/aws-amplify/amplify-cli/issues/3534) [#5736](https://github.com/aws-amplify/amplify-cli/issues/5736)





## [2.21.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.21.1...amplify-category-auth@2.21.2) (2020-10-27)

**Note:** Version bump only for package amplify-category-auth





## [2.21.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.21.0...amplify-category-auth@2.21.1) (2020-10-22)


### Bug Fixes

* refactor mobile hub migration checks ([#5632](https://github.com/aws-amplify/amplify-cli/issues/5632)) ([b796eb8](https://github.com/aws-amplify/amplify-cli/commit/b796eb8303bb903f5f531506254441a63eba2962))
* update current-cloud backend-config on resource removal ([#5658](https://github.com/aws-amplify/amplify-cli/issues/5658)) ([592f694](https://github.com/aws-amplify/amplify-cli/commit/592f694530dd61302ff790fbcf5b3ea135812c47))





# [2.21.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.20.2...amplify-category-auth@2.21.0) (2020-10-17)


### Bug Fixes

* store oauthMetadata properly on headless update ([#5597](https://github.com/aws-amplify/amplify-cli/issues/5597)) ([bdadafc](https://github.com/aws-amplify/amplify-cli/commit/bdadafca991bf9227046dba22cb196ac66e26cc6))


### Features

* support importing of auth resources ([#5591](https://github.com/aws-amplify/amplify-cli/issues/5591)) ([7903246](https://github.com/aws-amplify/amplify-cli/commit/790324680544fe18481f91390001f9f07a144203))





## [2.20.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.20.1...amplify-category-auth@2.20.2) (2020-10-07)


### Bug Fixes

* headless auth required attributes must be an array ([#5467](https://github.com/aws-amplify/amplify-cli/issues/5467)) ([dbde67c](https://github.com/aws-amplify/amplify-cli/commit/dbde67c3c39ecb14b32da82546927cee14405a0b))
* username is default signin, doesn't need to be specified ([#5474](https://github.com/aws-amplify/amplify-cli/issues/5474)) ([4c42ad5](https://github.com/aws-amplify/amplify-cli/commit/4c42ad59db93144e131193c41c5f3d4aa4db1b92))





## [2.20.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.20.0...amplify-category-auth@2.20.1) (2020-10-01)


### Bug Fixes

* **amplify-category-auth:** fix auth console ([#5408](https://github.com/aws-amplify/amplify-cli/issues/5408)) ([afbe065](https://github.com/aws-amplify/amplify-cli/commit/afbe065757ce488c1769848d0db3d03465a9b6c9)), closes [#5364](https://github.com/aws-amplify/amplify-cli/issues/5364)
* add support for mobile hub migrated resources ([#5407](https://github.com/aws-amplify/amplify-cli/issues/5407)) ([5dfe287](https://github.com/aws-amplify/amplify-cli/commit/5dfe2872c153047ebdc56bc4f671fd57c12379d9))
* added exit code on remove ([#5427](https://github.com/aws-amplify/amplify-cli/issues/5427)) ([33132f7](https://github.com/aws-amplify/amplify-cli/commit/33132f764b290cafd345720409a5db8ea6088069))





# [2.20.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.19.1...amplify-category-auth@2.20.0) (2020-09-25)


### Bug Fixes

* data inconsitency ([#5344](https://github.com/aws-amplify/amplify-cli/issues/5344)) ([bfe1903](https://github.com/aws-amplify/amplify-cli/commit/bfe19038b5b676056f45d7ffcc4c2460057936d8))


### Features

* headless update auth ([#5308](https://github.com/aws-amplify/amplify-cli/issues/5308)) ([b942f35](https://github.com/aws-amplify/amplify-cli/commit/b942f3589f1df1361ae7eb6e42f18dbf6900d1bf))





## [2.19.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.19.0...amplify-category-auth@2.19.1) (2020-09-16)


### Bug Fixes

* translate include oAuthMetadata and fix hostedUI meta ([#5304](https://github.com/aws-amplify/amplify-cli/issues/5304)) ([3c44c11](https://github.com/aws-amplify/amplify-cli/commit/3c44c110964907be203c4c70ee4e80122956fe85))





# [2.19.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.18.6...amplify-category-auth@2.19.0) (2020-09-09)


### Bug Fixes

* imports and addResource return val ([#5279](https://github.com/aws-amplify/amplify-cli/issues/5279)) ([963b47c](https://github.com/aws-amplify/amplify-cli/commit/963b47c476113a7ba50646f01d7e57add11ad920))
* internal add auth entry point ([#5281](https://github.com/aws-amplify/amplify-cli/issues/5281)) ([59734ac](https://github.com/aws-amplify/amplify-cli/commit/59734ac41f120771abdb31a1f6f796c852fe23b7))


### Features

* headless add auth ([#5224](https://github.com/aws-amplify/amplify-cli/issues/5224)) ([9f80512](https://github.com/aws-amplify/amplify-cli/commit/9f805128a8232278bb27d4fb1eaa5fecf7aa7a63))





## [2.18.6](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.18.5...amplify-category-auth@2.18.6) (2020-09-03)

**Note:** Version bump only for package amplify-category-auth





## [2.18.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.18.4...amplify-category-auth@2.18.5) (2020-09-03)


### Bug Fixes

* change trigger assets path ([#5223](https://github.com/aws-amplify/amplify-cli/issues/5223)) ([f3eb615](https://github.com/aws-amplify/amplify-cli/commit/f3eb615a40bdb279938f9722d32468833d20f7b0))





## [2.18.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.18.3...amplify-category-auth@2.18.4) (2020-08-31)


### Bug Fixes

* update auth supported services path ([#5184](https://github.com/aws-amplify/amplify-cli/issues/5184)) ([f8ff81d](https://github.com/aws-amplify/amplify-cli/commit/f8ff81da52f7a5376b5a36bdfed20d973b301f0f))





## [2.18.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.18.2...amplify-category-auth@2.18.3) (2020-08-20)


### Bug Fixes

* admin queries typo ([#5038](https://github.com/aws-amplify/amplify-cli/issues/5038)) ([1f37437](https://github.com/aws-amplify/amplify-cli/commit/1f374373061fff59b97e0f7ab3b3b84d1412416e))





## [2.18.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.18.1...amplify-category-auth@2.18.2) (2020-08-14)


### Bug Fixes

* Added check to stop prompts for cognito triggers while using env commands ([#5039](https://github.com/aws-amplify/amplify-cli/issues/5039)) ([744dbc4](https://github.com/aws-amplify/amplify-cli/commit/744dbc42e847e273160caf3672365391f055191b))





## [2.18.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.18.0...amplify-category-auth@2.18.1) (2020-08-11)

**Note:** Version bump only for package amplify-category-auth





# [2.18.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.16.5...amplify-category-auth@2.18.0) (2020-07-29)


### Features

* feature flag implementation ([#4891](https://github.com/aws-amplify/amplify-cli/issues/4891)) ([6d1c632](https://github.com/aws-amplify/amplify-cli/commit/6d1c632952a49cb56670c11c9cb0c3620d0eb332))





# [2.17.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.16.5...amplify-category-auth@2.17.0) (2020-07-23)


### Features

* feature flag implementation ([#4891](https://github.com/aws-amplify/amplify-cli/issues/4891)) ([4639450](https://github.com/aws-amplify/amplify-cli/commit/463945029cfe861f74986d9a8b9af6b827d2063d))





## [2.16.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.16.4...amplify-category-auth@2.16.5) (2020-07-18)

**Note:** Version bump only for package amplify-category-auth





## [2.16.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.16.3...amplify-category-auth@2.16.4) (2020-07-15)

**Note:** Version bump only for package amplify-category-auth





## [2.16.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.16.2...amplify-category-auth@2.16.3) (2020-07-14)

**Note:** Version bump only for package amplify-category-auth





## [2.16.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.16.1...amplify-category-auth@2.16.2) (2020-07-11)


### Bug Fixes

* **cli:** remove unnecessary stack trace log when adding services ([#4610](https://github.com/aws-amplify/amplify-cli/issues/4610)) ([5bee574](https://github.com/aws-amplify/amplify-cli/commit/5bee574bbcd956c032e7714b0813aedd7914a6cb))
* warning added for identity pool deletion ([#4731](https://github.com/aws-amplify/amplify-cli/issues/4731)) ([d555674](https://github.com/aws-amplify/amplify-cli/commit/d555674e4968cceab6fddd34f1b016dd57d506ea))


### Performance Improvements

* fulfill promises to upload files to S3 concurrently ([#4575](https://github.com/aws-amplify/amplify-cli/issues/4575)) ([96d1914](https://github.com/aws-amplify/amplify-cli/commit/96d1914f26507184f14371294d31b3a5e5c94954)), closes [#4158](https://github.com/aws-amplify/amplify-cli/issues/4158)


### Reverts

* Revert problematic PRs (#4803) ([7f38d81](https://github.com/aws-amplify/amplify-cli/commit/7f38d81ef2f890c25d39b02407c5255c8760c511)), closes [#4803](https://github.com/aws-amplify/amplify-cli/issues/4803) [#4796](https://github.com/aws-amplify/amplify-cli/issues/4796) [#4576](https://github.com/aws-amplify/amplify-cli/issues/4576) [#4575](https://github.com/aws-amplify/amplify-cli/issues/4575) [#4610](https://github.com/aws-amplify/amplify-cli/issues/4610)





## [2.16.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.16.0...amplify-category-auth@2.16.1) (2020-07-09)

**Note:** Version bump only for package amplify-category-auth





# [2.16.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.15.8...amplify-category-auth@2.16.0) (2020-07-07)


### Features

* **cli:** usage measurement ([#3641](https://github.com/aws-amplify/amplify-cli/issues/3641)) ([30a7fe7](https://github.com/aws-amplify/amplify-cli/commit/30a7fe70f5838a766631befcc720a721e801bc5f))
* Lambda layers ([#4697](https://github.com/aws-amplify/amplify-cli/issues/4697)) ([c55b2e0](https://github.com/aws-amplify/amplify-cli/commit/c55b2e0c3377127aaf887591d7bc20d7240ef11d))





## [2.15.8](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.15.7...amplify-category-auth@2.15.8) (2020-06-18)


### Bug Fixes

* occurred spelling mistake ([#4595](https://github.com/aws-amplify/amplify-cli/issues/4595)) ([eaf08e0](https://github.com/aws-amplify/amplify-cli/commit/eaf08e00841830e9654fea61ce901f2cb478eebe))





## [2.15.7](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.15.6...amplify-category-auth@2.15.7) (2020-05-26)


### Bug Fixes

* deleted extra carriageReturn calls, fixed grammar in Auth dx ([#4237](https://github.com/aws-amplify/amplify-cli/issues/4237)) ([4322a32](https://github.com/aws-amplify/amplify-cli/commit/4322a326df8c5c0a89de5f5e8f46bcfd4e1ad770))





## [2.15.6](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.15.5...amplify-category-auth@2.15.6) (2020-05-15)


### Bug Fixes

* **amplify-category-auth:** adding unique Id to Role name ([#4231](https://github.com/aws-amplify/amplify-cli/issues/4231)) ([21de1af](https://github.com/aws-amplify/amplify-cli/commit/21de1affd89142598a1f8022c387b3c04994b1e0))





## [2.15.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.15.4...amplify-category-auth@2.15.5) (2020-05-08)


### Bug Fixes

* change auth method copy [#4184](https://github.com/aws-amplify/amplify-cli/issues/4184) ([#4198](https://github.com/aws-amplify/amplify-cli/issues/4198)) ([8097671](https://github.com/aws-amplify/amplify-cli/commit/809767143ebf7dd6868279407461d0657e83073a))
* prevent naming conflicts with new env names ([#3875](https://github.com/aws-amplify/amplify-cli/issues/3875)) ([a7734ae](https://github.com/aws-amplify/amplify-cli/commit/a7734aedb8e846620874ae69e5c38da393dbbe30)), closes [#3854](https://github.com/aws-amplify/amplify-cli/issues/3854)





## [2.15.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.15.3...amplify-category-auth@2.15.4) (2020-04-06)


### Bug Fixes

* **amplify-category-auth:** fixed issue with updating urls in auth ([#3791](https://github.com/aws-amplify/amplify-cli/issues/3791)) ([236cd7a](https://github.com/aws-amplify/amplify-cli/commit/236cd7aecbdc2cbbb0dc9c565aae4e79ff40ebae))





## [2.15.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.15.2...amplify-category-auth@2.15.3) (2020-03-22)


### Bug Fixes

* enable only-userpool flow without idp and addition of groups without roles tied to idp ([#3662](https://github.com/aws-amplify/amplify-cli/issues/3662)) ([67e0401](https://github.com/aws-amplify/amplify-cli/commit/67e04018d758e617374c4b8ba2298872e728d01e))





## [2.15.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.15.1...amplify-category-auth@2.15.2) (2020-03-10)


### Bug Fixes

* Fix string literal to be a `Ref` in the cloud formation template ([#3630](https://github.com/aws-amplify/amplify-cli/issues/3630)) ([61e4ac9](https://github.com/aws-amplify/amplify-cli/commit/61e4ac95acc728c46440927c79c158b35abe0e39))





## [2.15.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.13.3...amplify-category-auth@2.15.1) (2020-03-07)


### Bug Fixes

* scoping down user pool group IAM roles and adding --force to amplify push command ([#3609](https://github.com/aws-amplify/amplify-cli/issues/3609)) ([2e10a2f](https://github.com/aws-amplify/amplify-cli/commit/2e10a2ff62b61f57b2d513a7cfd0e4478f429f1f))





## [2.14.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.13.5-beta.0...amplify-category-auth@2.14.1) (2020-03-05)

**Note:** Version bump only for package amplify-category-auth





## [2.13.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.13.2...amplify-category-auth@2.13.3) (2020-02-13)

**Note:** Version bump only for package amplify-category-auth





## [2.13.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.13.1...amplify-category-auth@2.13.2) (2020-02-07)

**Note:** Version bump only for package amplify-category-auth





## [2.13.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@2.13.0...amplify-category-auth@2.13.1) (2020-01-24)

**Note:** Version bump only for package amplify-category-auth





# [2.13.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.30.0...amplify-category-auth@2.13.0) (2020-01-23)

### Bug Fixes

- randomize role-names and bucket-name for auth and storage category ([#2709](https://github.com/aws-amplify/amplify-cli/issues/2709)) ([fe0e979](https://github.com/aws-amplify/amplify-cli/commit/fe0e979812bd3142a56a62bf15444cbb3dbbb6bb))
- **amplify-cli:** updating path in trigger indexes for node10 ([c4b1082](https://github.com/aws-amplify/amplify-cli/commit/c4b10820232e614a2951d840a6307031df73aebd)), closes [#3083](https://github.com/aws-amplify/amplify-cli/issues/3083)

### Features

- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **amplify-category-auth:** export lambda trigger roles in template ([#2894](https://github.com/aws-amplify/amplify-cli/issues/2894)) ([3d07717](https://github.com/aws-amplify/amplify-cli/commit/3d077179c28db7e2c8114bd88f27c99b08062313)), closes [#2303](https://github.com/aws-amplify/amplify-cli/issues/2303)
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.12.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.30.0...amplify-category-auth@2.12.0) (2020-01-09)

### Bug Fixes

- randomize role-names and bucket-name for auth and storage category ([#2709](https://github.com/aws-amplify/amplify-cli/issues/2709)) ([fe0e979](https://github.com/aws-amplify/amplify-cli/commit/fe0e979812bd3142a56a62bf15444cbb3dbbb6bb))
- **amplify-cli:** updating path in trigger indexes for node10 ([c4b1082](https://github.com/aws-amplify/amplify-cli/commit/c4b10820232e614a2951d840a6307031df73aebd)), closes [#3083](https://github.com/aws-amplify/amplify-cli/issues/3083)

### Features

- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **amplify-category-auth:** export lambda trigger roles in template ([#2894](https://github.com/aws-amplify/amplify-cli/issues/2894)) ([3d07717](https://github.com/aws-amplify/amplify-cli/commit/3d077179c28db7e2c8114bd88f27c99b08062313)), closes [#2303](https://github.com/aws-amplify/amplify-cli/issues/2303)
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.11.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.30.0...amplify-category-auth@2.11.0) (2019-12-31)

### Bug Fixes

- randomize role-names and bucket-name for auth and storage category ([#2709](https://github.com/aws-amplify/amplify-cli/issues/2709)) ([fe0e979](https://github.com/aws-amplify/amplify-cli/commit/fe0e979812bd3142a56a62bf15444cbb3dbbb6bb))
- **amplify-cli:** updating path in trigger indexes for node10 ([c4b1082](https://github.com/aws-amplify/amplify-cli/commit/c4b10820232e614a2951d840a6307031df73aebd)), closes [#3083](https://github.com/aws-amplify/amplify-cli/issues/3083)

### Features

- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **amplify-category-auth:** export lambda trigger roles in template ([#2894](https://github.com/aws-amplify/amplify-cli/issues/2894)) ([3d07717](https://github.com/aws-amplify/amplify-cli/commit/3d077179c28db7e2c8114bd88f27c99b08062313)), closes [#2303](https://github.com/aws-amplify/amplify-cli/issues/2303)
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.10.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.30.0...amplify-category-auth@2.10.0) (2019-12-28)

### Bug Fixes

- randomize role-names and bucket-name for auth and storage category ([#2709](https://github.com/aws-amplify/amplify-cli/issues/2709)) ([fe0e979](https://github.com/aws-amplify/amplify-cli/commit/fe0e979812bd3142a56a62bf15444cbb3dbbb6bb))
- **amplify-cli:** updating path in trigger indexes for node10 ([c4b1082](https://github.com/aws-amplify/amplify-cli/commit/c4b10820232e614a2951d840a6307031df73aebd)), closes [#3083](https://github.com/aws-amplify/amplify-cli/issues/3083)

### Features

- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **amplify-category-auth:** export lambda trigger roles in template ([#2894](https://github.com/aws-amplify/amplify-cli/issues/2894)) ([3d07717](https://github.com/aws-amplify/amplify-cli/commit/3d077179c28db7e2c8114bd88f27c99b08062313)), closes [#2303](https://github.com/aws-amplify/amplify-cli/issues/2303)
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.9.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.30.0...amplify-category-auth@2.9.0) (2019-12-26)

### Bug Fixes

- randomize role-names and bucket-name for auth and storage category ([#2709](https://github.com/aws-amplify/amplify-cli/issues/2709)) ([fe0e979](https://github.com/aws-amplify/amplify-cli/commit/fe0e979812bd3142a56a62bf15444cbb3dbbb6bb))

### Features

- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **amplify-category-auth:** export lambda trigger roles in template ([#2894](https://github.com/aws-amplify/amplify-cli/issues/2894)) ([3d07717](https://github.com/aws-amplify/amplify-cli/commit/3d077179c28db7e2c8114bd88f27c99b08062313)), closes [#2303](https://github.com/aws-amplify/amplify-cli/issues/2303)
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.8.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.30.0...amplify-category-auth@2.8.0) (2019-12-25)

### Bug Fixes

- randomize role-names and bucket-name for auth and storage category ([#2709](https://github.com/aws-amplify/amplify-cli/issues/2709)) ([fe0e979](https://github.com/aws-amplify/amplify-cli/commit/fe0e979812bd3142a56a62bf15444cbb3dbbb6bb))

### Features

- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **amplify-category-auth:** export lambda trigger roles in template ([#2894](https://github.com/aws-amplify/amplify-cli/issues/2894)) ([3d07717](https://github.com/aws-amplify/amplify-cli/commit/3d077179c28db7e2c8114bd88f27c99b08062313)), closes [#2303](https://github.com/aws-amplify/amplify-cli/issues/2303)
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.7.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.30.0...amplify-category-auth@2.7.0) (2019-12-20)

### Bug Fixes

- randomize role-names and bucket-name for auth and storage category ([#2709](https://github.com/aws-amplify/amplify-cli/issues/2709)) ([fe0e979](https://github.com/aws-amplify/amplify-cli/commit/fe0e979812bd3142a56a62bf15444cbb3dbbb6bb))

### Features

- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **amplify-category-auth:** export lambda trigger roles in template ([#2894](https://github.com/aws-amplify/amplify-cli/issues/2894)) ([3d07717](https://github.com/aws-amplify/amplify-cli/commit/3d077179c28db7e2c8114bd88f27c99b08062313)), closes [#2303](https://github.com/aws-amplify/amplify-cli/issues/2303)
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.6.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.30.0...amplify-category-auth@2.6.0) (2019-12-10)

### Bug Fixes

- randomize role-names and bucket-name for auth and storage category ([#2709](https://github.com/aws-amplify/amplify-cli/issues/2709)) ([fe0e979](https://github.com/aws-amplify/amplify-cli/commit/fe0e979812bd3142a56a62bf15444cbb3dbbb6bb))

### Features

- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.4.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.30.0...amplify-category-auth@2.4.0) (2019-12-03)

### Bug Fixes

- randomize role-names and bucket-name for auth and storage category ([#2709](https://github.com/aws-amplify/amplify-cli/issues/2709)) ([fe0e979](https://github.com/aws-amplify/amplify-cli/commit/fe0e979812bd3142a56a62bf15444cbb3dbbb6bb))

### Features

- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.3.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.30.0...amplify-category-auth@2.3.0) (2019-12-01)

### Bug Fixes

- randomize role-names and bucket-name for auth and storage category ([#2709](https://github.com/aws-amplify/amplify-cli/issues/2709)) ([fe0e979](https://github.com/aws-amplify/amplify-cli/commit/fe0e979812bd3142a56a62bf15444cbb3dbbb6bb))

### Features

- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.2.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.30.0...amplify-category-auth@2.2.0) (2019-11-27)

### Bug Fixes

- randomize role-names and bucket-name for auth and storage category ([#2709](https://github.com/aws-amplify/amplify-cli/issues/2709)) ([fe0e979](https://github.com/aws-amplify/amplify-cli/commit/fe0e979812bd3142a56a62bf15444cbb3dbbb6bb))

### Features

- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [2.1.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.30.0...amplify-category-auth@2.1.0) (2019-11-27)

### Bug Fixes

- randomize role-names and bucket-name for auth and storage category ([#2709](https://github.com/aws-amplify/amplify-cli/issues/2709)) ([fe0e979](https://github.com/aws-amplify/amplify-cli/commit/fe0e979812bd3142a56a62bf15444cbb3dbbb6bb))

### Features

- Delete all ([#2615](https://github.com/aws-amplify/amplify-cli/issues/2615)) ([5467679](https://github.com/aws-amplify/amplify-cli/commit/54676797b913d4a2c284c62244c8ccf8e55a44d8))
- **cli:** cLI updates and new features for Amplify Console ([#2742](https://github.com/aws-amplify/amplify-cli/issues/2742)) ([0fd0dd5](https://github.com/aws-amplify/amplify-cli/commit/0fd0dd5102177766c454c8715fa5acac32385048))

# [1.13.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.7.3...amplify-category-auth@1.13.0) (2019-08-30)

### Bug Fixes

- **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad8))
- [#1056](https://github.com/aws-amplify/amplify-cli/issues/1056), dedup environment file reading ([#2088](https://github.com/aws-amplify/amplify-cli/issues/2088)) ([940deaa](https://github.com/aws-amplify/amplify-cli/commit/940deaa))
- [#429](https://github.com/aws-amplify/amplify-cli/issues/429) - Editor hanging bug ([#2086](https://github.com/aws-amplify/amplify-cli/issues/2086)) ([6767445](https://github.com/aws-amplify/amplify-cli/commit/6767445))
- move test package dependencies to devDependencies ([#2034](https://github.com/aws-amplify/amplify-cli/issues/2034)) ([f5623d0](https://github.com/aws-amplify/amplify-cli/commit/f5623d0))

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))

# [1.12.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.7.3...amplify-category-auth@1.12.0) (2019-08-28)

### Bug Fixes

- **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad8))
- [#1056](https://github.com/aws-amplify/amplify-cli/issues/1056), dedup environment file reading ([#2088](https://github.com/aws-amplify/amplify-cli/issues/2088)) ([940deaa](https://github.com/aws-amplify/amplify-cli/commit/940deaa))
- [#429](https://github.com/aws-amplify/amplify-cli/issues/429) - Editor hanging bug ([#2086](https://github.com/aws-amplify/amplify-cli/issues/2086)) ([6767445](https://github.com/aws-amplify/amplify-cli/commit/6767445))
- move test package dependencies to devDependencies ([#2034](https://github.com/aws-amplify/amplify-cli/issues/2034)) ([f5623d0](https://github.com/aws-amplify/amplify-cli/commit/f5623d0))

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))

# [1.11.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.7.3...amplify-category-auth@1.11.0) (2019-08-13)

### Bug Fixes

- **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad8))

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))

# [1.10.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.7.3...amplify-category-auth@1.10.0) (2019-08-07)

### Bug Fixes

- **amplify-category-auth:** consolidates parameters below limit ([#1948](https://github.com/aws-amplify/amplify-cli/issues/1948)) ([3cdbad8](https://github.com/aws-amplify/amplify-cli/commit/3cdbad8))

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))

# [1.9.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.7.3...amplify-category-auth@1.9.0) (2019-08-02)

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))

# [1.8.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.7.3...amplify-category-auth@1.8.0) (2019-07-31)

### Features

- adding amplify cli predictions category ([#1936](https://github.com/aws-amplify/amplify-cli/issues/1936)) ([b7b7c2c](https://github.com/aws-amplify/amplify-cli/commit/b7b7c2c))

## [1.7.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.7.1...amplify-category-auth@1.7.3) (2019-07-23)

### Bug Fixes

- **amplify-category-auth:** adding PreAuthentication trigger ([42ee201](https://github.com/aws-amplify/amplify-cli/commit/42ee201)), closes [#1838](https://github.com/aws-amplify/amplify-cli/issues/1838)

## [1.7.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.7.0...amplify-category-auth@1.7.1) (2019-07-10)

**Note:** Version bump only for package amplify-category-auth

# [1.7.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.6.3...amplify-category-auth@1.7.0) (2019-07-09)

### Bug Fixes

- replacing rel paths with plugin func ([71f553f](https://github.com/aws-amplify/amplify-cli/commit/71f553f))

### Features

- cognito + s3 + dyanmodb lambda trigger support ([#1783](https://github.com/aws-amplify/amplify-cli/issues/1783)) ([c6fc838](https://github.com/aws-amplify/amplify-cli/commit/c6fc838))

## [1.6.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.6.2...amplify-category-auth@1.6.3) (2019-06-20)

### Bug Fixes

- **cli:** fix inquirer version ([#1690](https://github.com/aws-amplify/amplify-cli/issues/1690)) ([9246032](https://github.com/aws-amplify/amplify-cli/commit/9246032)), closes [#1688](https://github.com/aws-amplify/amplify-cli/issues/1688)

## [1.6.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.6.1...amplify-category-auth@1.6.2) (2019-06-11)

### Bug Fixes

- **amplify-category-auth:** provide correct arn in permission policies ([#1610](https://github.com/aws-amplify/amplify-cli/issues/1610)) ([27fd157](https://github.com/aws-amplify/amplify-cli/commit/27fd157))

## [1.6.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.6.0...amplify-category-auth@1.6.1) (2019-06-06)

### Bug Fixes

- **amplify-category-auth:** fix domain reserved words ([#1544](https://github.com/aws-amplify/amplify-cli/issues/1544)) ([31d4a89](https://github.com/aws-amplify/amplify-cli/commit/31d4a89)), closes [#1513](https://github.com/aws-amplify/amplify-cli/issues/1513)

# [1.6.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.5.6...amplify-category-auth@1.6.0) (2019-05-29)

### Bug Fixes

- **amplify-category-auth:** match cognito token expiration date range ([eb4c9ee](https://github.com/aws-amplify/amplify-cli/commit/eb4c9ee)), closes [#1385](https://github.com/aws-amplify/amplify-cli/issues/1385)

### Features

- flow to add policies to access amplify resources from Lambda ([#1462](https://github.com/aws-amplify/amplify-cli/issues/1462)) ([fee247c](https://github.com/aws-amplify/amplify-cli/commit/fee247c))

## [1.5.6](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.5.5...amplify-category-auth@1.5.6) (2019-05-21)

### Bug Fixes

- **amplify-category-auth:** add policy name char length limit ([#1492](https://github.com/aws-amplify/amplify-cli/issues/1492)) ([d6a8785](https://github.com/aws-amplify/amplify-cli/commit/d6a8785)), closes [#1199](https://github.com/aws-amplify/amplify-cli/issues/1199)

## [1.5.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.5.4...amplify-category-auth@1.5.5) (2019-05-17)

### Bug Fixes

- fixes [#1471](https://github.com/aws-amplify/amplify-cli/issues/1471) ([52b26cb](https://github.com/aws-amplify/amplify-cli/commit/52b26cb))

## [1.5.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.5.3...amplify-category-auth@1.5.4) (2019-04-30)

### Bug Fixes

- update CLI to handle UTF8 BOM ([#1357](https://github.com/aws-amplify/amplify-cli/issues/1357)) ([b0afa07](https://github.com/aws-amplify/amplify-cli/commit/b0afa07)), closes [#1355](https://github.com/aws-amplify/amplify-cli/issues/1355) [#1122](https://github.com/aws-amplify/amplify-cli/issues/1122)

## [1.5.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.5.2...amplify-category-auth@1.5.3) (2019-04-25)

### Bug Fixes

- **amplify-category-auth:** uses public_profile for FB scopes ([c9af7b7](https://github.com/aws-amplify/amplify-cli/commit/c9af7b7)), closes [#1335](https://github.com/aws-amplify/amplify-cli/issues/1335)

## [1.5.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.5.1...amplify-category-auth@1.5.2) (2019-04-16)

### Bug Fixes

- fix [#1254](https://github.com/aws-amplify/amplify-cli/issues/1254) ([0962650](https://github.com/aws-amplify/amplify-cli/commit/0962650))
- **amplify-category-auth:** fixes cloudformation template ([706de43](https://github.com/aws-amplify/amplify-cli/commit/706de43)), closes [#1247](https://github.com/aws-amplify/amplify-cli/issues/1247)
- fix [#1264](https://github.com/aws-amplify/amplify-cli/issues/1264) ([d901daf](https://github.com/aws-amplify/amplify-cli/commit/d901daf))

## [1.5.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.4.0...amplify-category-auth@1.5.1) (2019-04-09)

**Note:** Version bump only for package amplify-category-auth

# [1.4.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.0.7...amplify-category-auth@1.4.0) (2019-04-03)

### Bug Fixes

- fix redirect URI regex ([eaec6c2](https://github.com/aws-amplify/amplify-cli/commit/eaec6c2))

### Features

- support for provisioning Cognito Hosted UI and support CRUD operations in Storage and API categories ([729b0de](https://github.com/aws-amplify/amplify-cli/commit/729b0de))

## [1.0.7](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.0.6...amplify-category-auth@1.0.7) (2019-03-22)

### Bug Fixes

- **amplify-category-auth:** use right response signal of cfn-response ([572ca45](https://github.com/aws-amplify/amplify-cli/commit/572ca45))

## [1.0.6](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.0.5...amplify-category-auth@1.0.6) (2019-02-26)

### Bug Fixes

- **amplify-category-auth:** update auth cfn template to quote string ([1ff9e16](https://github.com/aws-amplify/amplify-cli/commit/1ff9e16)), closes [#882](https://github.com/aws-amplify/amplify-cli/issues/882)

## [1.0.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.0.3-beta.0...amplify-category-auth@1.0.5) (2019-02-11)

**Note:** Version bump only for package amplify-category-auth

## [1.0.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.0.3-beta.0...amplify-category-auth@1.0.3) (2019-02-11)

**Note:** Version bump only for package amplify-category-auth

## [1.0.3-beta.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@1.0.2...amplify-category-auth@1.0.3-beta.0) (2019-02-11)

**Note:** Version bump only for package amplify-category-auth

<a name="0.2.1-multienv.4"></a>

## [0.2.1-multienv.4](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@0.2.1-multienv.3...amplify-category-auth@0.2.1-multienv.4) (2019-01-30)

**Note:** Version bump only for package amplify-category-auth

<a name="0.2.1-multienv.3"></a>

## [0.2.1-multienv.3](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@0.2.1-multienv.2...amplify-category-auth@0.2.1-multienv.3) (2018-12-28)

### Features

- **amplify-category-auth:** console ([#636](https://github.com/aws-amplify/amplify-cli/issues/636)) ([dea38aa](https://github.com/aws-amplify/amplify-cli/commit/dea38aa))

<a name="0.2.1-multienv.2"></a>

## [0.2.1-multienv.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@0.2.1-multienv.1...amplify-category-auth@0.2.1-multienv.2) (2018-12-21)

**Note:** Version bump only for package amplify-category-auth

<a name="0.2.1-multienv.1"></a>

## [0.2.1-multienv.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@0.2.1-multienv.0...amplify-category-auth@0.2.1-multienv.1) (2018-11-28)

### Features

- Multienv auth migrate ([#498](https://github.com/aws-amplify/amplify-cli/issues/498)) ([ef3e3b3](https://github.com/aws-amplify/amplify-cli/commit/ef3e3b3))

<a name="0.2.1-multienv.0"></a>

## [0.2.1-multienv.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@0.1.34-multienv.2...amplify-category-auth@0.2.1-multienv.0) (2018-11-21)

**Note:** Version bump only for package amplify-category-auth

<a name="0.1.34-multienv.2"></a>

## [0.1.34-multienv.2](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@0.1.34-multienv.1...amplify-category-auth@0.1.34-multienv.2) (2018-11-19)

### Bug Fixes

- **amplify-category-auth:** get env specific data in externalAuthEnable ([#473](https://github.com/aws-amplify/amplify-cli/issues/473)) ([6aa66cb](https://github.com/aws-amplify/amplify-cli/commit/6aa66cb))

<a name="0.1.34-multienv.1"></a>

## [0.1.34-multienv.1](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@0.1.34-multienv.0...amplify-category-auth@0.1.34-multienv.1) (2018-11-19)

**Note:** Version bump only for package amplify-category-auth

<a name="0.1.34-multienv.0"></a>

## [0.1.34-multienv.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@0.1.33...amplify-category-auth@0.1.34-multienv.0) (2018-11-16)

### Features

- headless Init and configure ([#371](https://github.com/aws-amplify/amplify-cli/issues/371)) ([acd14a8](https://github.com/aws-amplify/amplify-cli/commit/acd14a8))
- headless Init and configure ([#371](https://github.com/aws-amplify/amplify-cli/issues/371)) ([8780400](https://github.com/aws-amplify/amplify-cli/commit/8780400))
- **amplify-category-auth:** add headless init support for auth ([#465](https://github.com/aws-amplify/amplify-cli/issues/465)) ([18410f2](https://github.com/aws-amplify/amplify-cli/commit/18410f2))

<a name="0.1.33"></a>

## [0.1.33](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@0.1.33-beta.0...amplify-category-auth@0.1.33) (2018-11-09)

**Note:** Version bump only for package amplify-category-auth

<a name="0.1.33-beta.0"></a>

## [0.1.33-beta.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@0.1.13...amplify-category-auth@0.1.33-beta.0) (2018-11-09)

### Bug Fixes

- **amplify-category-auth:** Fix auth add not found on Windows. ([d9202fe](https://github.com/aws-amplify/amplify-cli/commit/d9202fe))

<a name="0.1.32"></a>

## [0.1.32](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@0.1.32-beta.0...amplify-category-auth@0.1.32) (2018-11-05)

**Note:** Version bump only for package amplify-category-auth

<a name="0.1.32-beta.0"></a>

## [0.1.32-beta.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@0.1.13...amplify-category-auth@0.1.32-beta.0) (2018-11-05)

### Bug Fixes

- **amplify-category-auth:** Fix auth add not found on Windows. ([d9202fe](https://github.com/aws-amplify/amplify-cli/commit/d9202fe))

<a name="0.1.31"></a>

## [0.1.31](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@0.1.13...amplify-category-auth@0.1.31) (2018-11-02)

### Bug Fixes

- **amplify-category-auth:** Fix auth add not found on Windows. ([d9202fe](https://github.com/aws-amplify/amplify-cli/commit/d9202fe))

<a name="0.1.30"></a>

## [0.1.30](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@0.1.30-beta.0...amplify-category-auth@0.1.30) (2018-11-02)

**Note:** Version bump only for package amplify-category-auth

<a name="0.1.30-beta.0"></a>

## [0.1.30-beta.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@0.1.13...amplify-category-auth@0.1.30-beta.0) (2018-11-02)

### Bug Fixes

- **amplify-category-auth:** Fix auth add not found on Windows. ([d9202fe](https://github.com/aws-amplify/amplify-cli/commit/d9202fe))

<a name="0.1.29"></a>

## [0.1.29](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@0.1.29-beta.0...amplify-category-auth@0.1.29) (2018-10-23)

**Note:** Version bump only for package amplify-category-auth

<a name="0.1.29-beta.0"></a>

## [0.1.29-beta.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@0.1.13...amplify-category-auth@0.1.29-beta.0) (2018-10-23)

### Bug Fixes

- **amplify-category-auth:** Fix auth add not found on Windows. ([d9202fe](https://github.com/aws-amplify/amplify-cli/commit/d9202fe))

<a name="0.1.28"></a>

## [0.1.28](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@0.1.28-beta.0...amplify-category-auth@0.1.28) (2018-10-18)

**Note:** Version bump only for package amplify-category-auth

<a name="0.1.28-beta.0"></a>

## [0.1.28-beta.0](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@0.1.13...amplify-category-auth@0.1.28-beta.0) (2018-10-12)

### Bug Fixes

- **amplify-category-auth:** Fix auth add not found on Windows. ([d9202fe](https://github.com/aws-amplify/amplify-cli/commit/d9202fe))

<a name="0.1.13"></a>

## [0.1.13](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@0.1.12...amplify-category-auth@0.1.13) (2018-08-23)

**Note:** Version bump only for package amplify-category-auth

<a name="0.1.12"></a>

## [0.1.12](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@0.1.11...amplify-category-auth@0.1.12) (2018-08-23)

**Note:** Version bump only for package amplify-category-auth

<a name="0.1.11"></a>

## [0.1.11](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@0.1.9...amplify-category-auth@0.1.11) (2018-08-23)

**Note:** Version bump only for package amplify-category-auth

<a name="0.1.10"></a>

## [0.1.10](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@0.1.9...amplify-category-auth@0.1.10) (2018-08-23)

**Note:** Version bump only for package amplify-category-auth

<a name="0.1.9"></a>

## [0.1.9](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@0.1.8...amplify-category-auth@0.1.9) (2018-08-23)

**Note:** Version bump only for package amplify-category-auth

<a name="0.1.8"></a>

## [0.1.8](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@0.1.7...amplify-category-auth@0.1.8) (2018-08-23)

**Note:** Version bump only for package amplify-category-auth

<a name="0.1.7"></a>

## [0.1.7](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@0.1.6...amplify-category-auth@0.1.7) (2018-08-23)

**Note:** Version bump only for package amplify-category-auth

<a name="0.1.6"></a>

## [0.1.6](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@0.1.5...amplify-category-auth@0.1.6) (2018-08-23)

**Note:** Version bump only for package amplify-category-auth

<a name="0.1.5"></a>

## [0.1.5](https://github.com/aws-amplify/amplify-cli/compare/amplify-category-auth@0.1.4...amplify-category-auth@0.1.5) (2018-08-23)

**Note:** Version bump only for package amplify-category-auth

<a name="0.1.4"></a>

## 0.1.4 (2018-08-23)

**Note:** Version bump only for package amplify-category-auth

<a name="0.1.3"></a>

## 0.1.3 (2018-08-23)

**Note:** Version bump only for package amplify-category-auth

<a name="0.1.2"></a>

## 0.1.2 (2018-08-23)

**Note:** Version bump only for package amplify-category-auth

<a name="0.1.1"></a>

## 0.1.1 (2018-08-23)

**Note:** Version bump only for package amplify-category-auth
