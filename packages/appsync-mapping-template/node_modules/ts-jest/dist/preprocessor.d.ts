import { JestConfig, Path, TransformOptions } from './jest-types';
export declare function process(src: string, filePath: Path, jestConfig: JestConfig, transformOptions?: TransformOptions): string;
export declare function getCacheKey(fileData: string, filePath: Path, jestConfigStr: string, transformOptions?: TransformOptions): string;
