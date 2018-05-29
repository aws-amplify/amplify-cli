export interface Options {
    connector?: string;
    lowerCase?: boolean;
}
export declare function hyphenate(original: string, {connector, lowerCase}?: Options): string;
export default hyphenate;
