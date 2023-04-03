export declare function post({ body, ...options }: {
    [x: string]: any;
    body: any;
}): Promise<unknown>;
export declare function get(url: string): Promise<import("node-fetch").Response>;
