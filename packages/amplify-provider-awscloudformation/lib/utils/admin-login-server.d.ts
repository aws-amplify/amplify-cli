import { Printer } from '@aws-amplify/amplify-prompts';
import { AdminAuthPayload } from './auth-types';
export declare class AdminLoginServer {
    private app;
    private appId;
    private port;
    private server;
    private print;
    private host;
    private corsOptions;
    constructor(appId: string, originUrl: string, print: Printer);
    startServer(callback: () => void): Promise<void>;
    private getHost;
    private getPort;
    private getIdentityId;
    private setupRoute;
    private validateTokens;
    storeTokens(payload: AdminAuthPayload, appId: string): Promise<void>;
    shutdown(): void;
}
//# sourceMappingURL=admin-login-server.d.ts.map