import { $TSAny, $TSContext } from 'amplify-cli-core';
import { DocumentNode } from 'graphql';
export declare const notifyFieldAuthSecurityChange: (context: $TSContext) => Promise<boolean>;
export declare const notifyListQuerySecurityChange: (context: $TSContext) => Promise<boolean>;
export declare const displayAuthNotification: (directiveMap: $TSAny, fieldDirectives: Set<string>) => boolean;
export declare const hasFieldAuthDirectives: (doc: DocumentNode) => Set<string>;
export declare const hasV2AuthDirectives: (doc: DocumentNode) => boolean;
export declare const notifySecurityEnhancement: (context: $TSContext) => Promise<void>;
//# sourceMappingURL=auth-notifications.d.ts.map