/**
 * Returns a boolean of whether or not the CLI is running as a native executable.
 * Uses the fact that the root of __dirname will be the snapshot filesystem created by pkg when packaged natively
 * See https://github.com/vercel/pkg#snapshot-filesystem
 *
 * This function is exported as part of index, but it can also be imported at 'amplify-cli-core/lib/is-native
 */
export const isNative = !!['/snapshot', 'C:\\snapshot'].find(prefix => __dirname.startsWith(prefix));
