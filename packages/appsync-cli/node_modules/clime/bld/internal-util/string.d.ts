export declare type TableRow = (string | undefined)[];
export declare function buildTableOutput(rows: TableRow[], {separators, indent}?: {
    separators?: string | string[];
    indent?: string | number;
}): string;
export declare function indent(text: string, indent: number | string): string;
