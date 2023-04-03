export declare const runPinpointConfigTest: (projectRoot: string, envName: string, frontendConfig: {
    frontend: string;
    config?: {
        ResDir?: string;
    };
}, validate: (projectRoot: string, channels: string[]) => void) => Promise<void>;
export declare const iosValidate: (projectRoot: string, channels: string[]) => void;
export declare const androidValidate: (projectRoot: string, channels: string[]) => void;
export declare const flutterValidate: (projectRoot: string, channels: string[]) => void;
export declare const javascriptValidate: (projectRoot: string, channels: string[]) => void;
