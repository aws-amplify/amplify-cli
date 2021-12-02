import { FrontendManagerTemplateRenderer, FrontendManagerTheme, FrontendManagerComponent } from './codegen-ui';
import { ReactRenderConfig } from './react-render-config';
import { ImportCollection } from './import-collection';
import { ReactOutputManager } from './react-output-manager';
import { defaultRenderConfig } from './react-frontend-manager-template-renderer-helper';
import { RequiredKeys } from './utils/type-utils';
declare type FrontendManagerSchema = FrontendManagerComponent | FrontendManagerTheme;
export declare class ReactIndexFrontendManagerTemplateRenderer extends FrontendManagerTemplateRenderer<string, FrontendManagerSchema[], ReactOutputManager, {
    componentText: string;
    renderComponentToFilesystem: (outputPath: string) => Promise<void>;
}> {
    protected importCollection: ImportCollection;
    protected renderConfig: RequiredKeys<ReactRenderConfig, keyof typeof defaultRenderConfig>;
    fileName: string;
    constructor(schemas: FrontendManagerSchema[], renderConfig: ReactRenderConfig);
    renderComponentInternal(): {
        componentText: string;
        renderComponentToFilesystem: (outputPath: string) => Promise<void>;
    };
    private buildExports;
}
export {};
