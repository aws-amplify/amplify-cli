# Action Items — 2026-05-01

Issues solved: #14517, #14487, #14813

## Before creating PRs

- [ ] Review each branch: `git log -p fix/gen2-migration-14517`, `git log -p fix/gen2-migration-14487`, `git log -p fix/gen2-migration-14813`
- [ ] Review PR message files: `pr-message-14517.md`, `pr-message-14487.md`, `pr-message-14813.md`
- [ ] **Rebase #14813 onto #14517** — both modify `function.renderer.ts`, `function.generator.test.ts`, and the `product-catalog/lowstockproducts/resource.ts` snapshot. After rebase, resolve conflicts and run `UPDATE_SNAPSHOTS=1 yarn test` in the package.
- [ ] **Rebase #14813 onto #14487** (or merge order accordingly) — both modify `data.generator.test.ts`. Conflict is minor (both add new test cases at the end of the describe block).
- [ ] After rebasing, run full test suite: `cd packages/amplify-cli && yarn test`

## File conflicts

| File | Branches |
|------|----------|
| `function.renderer.ts` | #14517, #14813 |
| `function.generator.test.ts` | #14517, #14813 |
| `product-catalog/.../lowstockproducts/resource.ts` | #14517, #14813 |
| `data.generator.test.ts` | #14487, #14813 |

## Snapshot conflicts

- **product-catalog** app: `lowstockproducts/resource.ts` snapshot updated by both #14517 (adds `secret()` calls) and #14813 (removes `REGION` env var). The later branch needs rebasing + `UPDATE_SNAPSHOTS=1 yarn test`.
- **9 other apps** updated by #14813 only (REGION removal) — no conflicts.

## Suggested merge order

1. `fix/gen2-migration-14487` — standalone fix to `data.generator.ts`, no overlap with #14517
2. `fix/gen2-migration-14517` — function secrets, touches `function.renderer.ts` and one snapshot
3. `fix/gen2-migration-14813` — rebase onto both #14487 and #14517 first, then run `UPDATE_SNAPSHOTS=1 yarn test` to reconcile snapshots and resolve test file conflicts
