export function initCFNTemplate(context: any, templateFilePath: any): void;
export function initMetaFile(context: any, category: any, resourceName: any, type: any): Promise<void>;
export function initCurrBackendMeta(context: any, category: any, resourceName: any, type: any, timeStamp: any): Promise<void>;
export function initHostingEnvParams(context: any, category: any, resourceName: any, type: any): Promise<void>;
export function initBackendConfig(context: any, category: any, resourceName: any, type: any): void;
export function loadConsoleConfigFromTeamProviderinfo(): Promise<Readonly<Record<string, string>>>;
export function deleteHostingEnvParams(): Promise<void>;
export function deleteConsoleConfigFromCurrMeta(context: any): Promise<void>;
//# sourceMappingURL=config-utils.d.ts.map