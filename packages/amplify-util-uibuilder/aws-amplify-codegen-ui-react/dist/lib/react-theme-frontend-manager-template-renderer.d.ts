import { FrontendManagerTemplateRenderer, FrontendManagerTheme } from './codegen-ui';
import { ReactRenderConfig } from './react-render-config';
import { ImportCollection } from './import-collection';
import { ReactOutputManager } from './react-output-manager';
import { defaultRenderConfig } from './react-frontend-manager-template-renderer-helper';
import { RequiredKeys } from './utils/type-utils';
export declare class ReactThemeFrontendManagerTemplateRenderer extends FrontendManagerTemplateRenderer<string, FrontendManagerTheme, ReactOutputManager, {
    componentText: string;
    renderComponentToFilesystem: (outputPath: string) => Promise<void>;
}> {
    protected importCollection: ImportCollection;
    protected renderConfig: RequiredKeys<ReactRenderConfig, keyof typeof defaultRenderConfig>;
    fileName: string;
    constructor(theme: FrontendManagerTheme, renderConfig: ReactRenderConfig);
    renderComponentInternal(): {
        componentText: string;
        renderComponentToFilesystem: (outputPath: string) => Promise<void>;
    };
    private buildImports;
    private buildTheme;
    private buildThemeObject;
    private buildThemeValues;
    private buildThemeValue;
    private buildThemeOverrides;
}
