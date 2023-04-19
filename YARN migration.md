# Yarn Migration Notes

## [Why should you upgrade to Yarn Modern?](https://yarnpkg.com/getting-started/qa#why-should-you-upgrade-to-yarn-modern)

New Features, Extensibility, Efficiency, Stability, and Future-Proofing.

## Callout
- Yarn 2 Zero-Installs may require changes to your project's scripts, as the location of dependencies changes from a local node_modules directory to a global cache.
- Arbitrary pre/post-scripts are deprecated, --frozen-lockfile was renamed into --immutable. We only have 4 places were these are used, so it should be easy to migrate.


## Steps
1. `npm i -g yarn` update yarn to latest version
2. go to category package
3. Run `yarn set version berry`
4. Add `nodeLinker: node-modules` to `.yarnrc.yml` or execute `yarn config set nodeLinker node-modules`
5. Run `yarn install`
6. Add files to `.gitignore` (see below .gitignore section)
7. Commit changes
8. Repeat steps 2-7 for each package in the monorepo

## Plug'n'Play
- `Plug'n'Play enforces strict dependency rules. In particular, you'll hit problems if you (or your dependencies) rely on unlisted dependencies.`
- This step is optional, but recommended. It will make your project more stable and faster.
- It requires that problems listed by `yarn dlx @yarnpkg/doctor` are fixed. See `yarn-doctor.list` for a list of problems that needs to be fixed.
- To enable Plug'n'Play, remove `nodeLinker` line from `.yarnrc.yml` or set it to `pnp` and then `yarn install`
- Run `yarn dlx @yarnpkg/sdks vscode`

Notes

*Now you should have a working Yarn Plug'n'Play setup, but your repository might still need some extra care. Some things to keep in mind:*

- *There is no node_modules folder and no .bin folder. If you relied on these, call yarn run instead.*
- *Replace any calls to node that are not inside a Yarn script with yarn node*
- *Custom pre-hooks (e.g. prestart) need to be called manually now*

- `yarn test` fails due to typescript errors

## Options

### Migrate the entire project in one go
### Migrate the project package by package
### Use Yarn 2 Zero-Installs [Y/N]

## .gitingore
Which files should be gitignored?

- If you're using Zero-Installs:
```
.yarn/*
!.yarn/cache <--- this will increase the number of items checked in to git but are meant to speed up the build
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/sdks
!.yarn/versions
```

- If you're not using Zero-Installs:
```
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/sdks
!.yarn/versions
```

`.yarn/cache` and `.pnp.*` may be safely ignored, but you'll need to run yarn install to regenerate them between each branch switch - which would be optional otherwise, cf Zero-Installs.

Add this to `.gitattributes` to inform git that the files in `.yarn/releases` and `.yarn/plugins` are binary:
```
/.yarn/releases/** binary
/.yarn/plugins/** binary
```

## Questions
- Can this be done in multiple steps, for each project in the monorepo?
- Are there particular steps that needs to be taken in the circleCI environment?

## References
- [Yarn Migration Guide](https://yarnpkg.com/getting-started/migration)
- [Migrating to Yarn 2](https://devcenter.heroku.com/articles/migrating-to-yarn-2)
- [Migrating Monorepo to Yarn 2](https://www.dolthub.com/blog/2022-03-18-migrating-to-yarn-2/)

## To investigate
- difference between `yarn install` and `yarn`? -- no difference
- difference between `nodeLinker: node-modules` and `nodeLinker: pnp`?
1. nodeLinker: node-modules: This is the default node linker in Yarn. When nodeLinker is set to node-modules, Yarn installs dependencies in the traditional node_modules directory within the project's root directory. This approach is similar to how npm, the other popular JavaScript package manager, installs dependencies.

2. nodeLinker: pnp: This stands for "Plug'n'Play", and it is an alternative to the traditional node_modules approach. When nodeLinker is set to pnp, Yarn uses a different approach where dependencies are installed in a global .yarn directory outside of the project's root directory, and symbolic links are used to make them available to the project. This approach is designed to provide better performance and improved disk space usage compared to the traditional node_modules approach.

- difference between `yarn dlx` and `yarn run`?

Yarn dlx is used for downloading and running a package's binary executable, while yarn run is used for running scripts defined in the package.json file of your project.

- difference between `yarn run` and `yarn`? -- they are equivalent
- local build, circleCI build, local test, circleCI test, packaging, publishing, release, etc.

## Error Codes
- YN0000
- YN0009
- YN0007
- YN0002 - majority: https://yarnpkg.com/advanced/error-codes#yn0002---missing_peer_dependency
- YN0060

## Nx Support
> There is no Nx support for yarn 2 Plug'n'Play yet. See [this issue](https://github.com/nrwl/nx/issues/2386) for more information.

## Other Packages Not Supporting Zero-Installs
- ESLint, ~~dependabot~~ [now supported](https://github.com/dependabot/dependabot-core/issues/1297)
- Some tools (mostly React Native and Flow) will require downgrading to the node_modules install strategy by setting the nodeLinker setting to node-modules. TypeScript doesn't have this problem.

## Unit Test Fail with Yarn 2
- 16/69 targets failed

## Yarn 1 End of Life
> After Yarn 1.22, the 1.x branch will officially enter maintenance mode - meaning that it won't receive further releases from me except when absolutely required to patch vulnerabilities. New features will be developed exclusively against Yarn 2.

## Yarn 2 non Zero-Installs performance tweaks .yarnrc.yml
```
compressionLevel: 0
nmMode: hardlinks-local
enableGlobalCache: true
```

# Nx Alternatives

## [Bit](https://bit.dev/)

# Yarn Alternatives

## [pnpm](https://pnpm.io/)
- [Benchmark Comparison](https://pnpm.io/benchmarks)

## [npm](https://www.npmjs.com/)
