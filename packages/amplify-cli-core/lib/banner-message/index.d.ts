export type Message = {
    message: string;
    id: string;
    conditions?: {
        enabled: boolean;
        cliVersions?: string;
        startTime?: string;
        endTime?: string;
    };
};
export declare const AWS_AMPLIFY_DEFAULT_BANNER_URL = "https://aws-amplify.github.io/amplify-cli/banner-message.json";
export declare class BannerMessage {
    private cliVersion;
    private static instance?;
    private messages;
    static initialize: (cliVersion: string) => BannerMessage;
    private static ensureInitialized;
    private constructor();
    private fetchMessages;
    static getMessage: (messageId: string) => Promise<string | undefined>;
    getMessages: (messageId: string) => Promise<string | undefined>;
}
//# sourceMappingURL=index.d.ts.map