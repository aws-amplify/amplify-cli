import { join } from 'path';

// Reusable go runtime specific string literals
export const BIN_LOCAL = 'bin-local';
export const BIN = 'bin';
export const SRC = 'src';
export const DIST = 'dist';
export const MAIN_SOURCE = 'main.go';
export const MAIN_BINARY = 'bootstrap';
export const MAIN_BINARY_WIN = 'bootstrap.exe';

export const BASE_PORT = 8900;
export const MAX_PORT = 9999;

export const packageName = 'amplify-go-function-runtime-provider';
export const relativeShimSrcPath = join('resources', 'localinvoke');
