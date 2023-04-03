"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isHeadless = exports.isInteractiveShell = exports.isYes = exports.isSilent = exports.isDebug = void 0;
exports.isDebug = process.argv.includes('--debug') || process.env.AMPLIFY_ENABLE_DEBUG_OUTPUT === 'true';
exports.isSilent = process.argv.includes('--silent');
exports.isYes = !!['--yes', '-y'].find((yesFlag) => process.argv.includes(yesFlag));
exports.isInteractiveShell = process.stdin.isTTY;
exports.isHeadless = process.argv.includes('--headless');
//# sourceMappingURL=flags.js.map