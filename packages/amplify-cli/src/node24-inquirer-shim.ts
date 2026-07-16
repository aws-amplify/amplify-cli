/* eslint-disable @typescript-eslint/no-var-requires, global-require */
import type { Interface as ReadlineInterface } from 'readline';

const NODE24_PATCH_FLAG = '__node24Patched';

interface PatchableUI {
  rl?: (ReadlineInterface & { closed?: boolean; output?: { end?: () => void; unmute?: () => void } }) | undefined;
  activePrompt?: { close?: () => void } | null;
  onForceClose?: (() => void) | undefined;
}

type PatchableUIProto = {
  close?: (this: PatchableUI) => void;
  [NODE24_PATCH_FLAG]?: boolean;
};

/**
 * Guards inquirer's base `UI.close()` so it never calls `rl.pause()` on an
 * already-closed readline interface. On Node 24 that call throws
 * `ERR_USE_AFTER_CLOSE`, which surfaces as a crash when a prompt is torn down;
 * on Node <= 22 `pause()` was a silent no-op.
 *
 * The override is installed once (idempotent via a prototype flag) and replaces
 * `baseUI`'s prototype `close`. When the readline is still open it delegates to
 * the original implementation; otherwise it replicates the teardown best-effort
 * without touching `pause()`. Safe to call multiple times and a no-op if the
 * `inquirer/lib/ui/baseUI` module cannot be resolved.
 */
export const installInquirerNode24Shim = (): void => {
  let baseUIModule: { default?: unknown } | (new (...args: unknown[]) => unknown);
  try {
    baseUIModule = require('inquirer/lib/ui/baseUI');
  } catch {
    return;
  }

  const UI = ((baseUIModule as { default?: unknown }).default ?? baseUIModule) as (new (...args: unknown[]) => unknown) | undefined;
  const proto = UI?.prototype as PatchableUIProto | undefined;
  if (!proto || typeof proto.close !== 'function' || proto[NODE24_PATCH_FLAG]) {
    return;
  }

  const originalClose = proto.close;
  proto.close = function patchedClose(this: PatchableUI): void {
    const rl = this.rl;
    if (rl && rl.closed !== true) {
      originalClose.call(this);
      return;
    }

    // Readline already closed: mirror baseUI teardown but skip rl.pause() to
    // avoid ERR_USE_AFTER_CLOSE on Node 24.
    if (rl && this.onForceClose) {
      rl.removeListener?.('SIGINT', this.onForceClose);
      process.removeListener('exit', this.onForceClose);
    }
    rl?.output?.unmute?.();
    this.activePrompt?.close?.();
    rl?.output?.end?.();
    rl?.close?.();
  };
  proto[NODE24_PATCH_FLAG] = true;
};
