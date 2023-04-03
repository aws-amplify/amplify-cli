export declare const runPinpointConfigTest: (projectRoot: string, envName: string, frontendConfig: {
    frontend: string;
    config?: {
        ResDir?: string;
    };
}, validate: (projectRoot: string, hasAnalytics: boolean) => void) => Promise<void>;
export declare const iosValidate: (projectRoot: string, hasAnalytics: boolean) => void;
export declare const androidValidate: (projectRoot: string, hasAnalytics: boolean) => void;
export declare const flutterValidate: (projectRoot: string, hasAnalytics: boolean) => void;
export declare const javascriptValidate: (projectRoot: string, hasAnalytics: boolean) => void;
