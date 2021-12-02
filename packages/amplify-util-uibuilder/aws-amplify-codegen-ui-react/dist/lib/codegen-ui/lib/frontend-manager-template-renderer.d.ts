import { FrameworkOutputManager } from './framework-output-manager';
import { FrameworkRenderConfig } from './framework-render-config';
import { RenderTextComponentResponse } from './render-component-response';
export declare abstract class FrontendManagerTemplateRenderer<TSource, TFrontendManagerType, TOutputManager extends FrameworkOutputManager<TSource>, TRenderOutput extends RenderTextComponentResponse> {
    protected component: TFrontendManagerType;
    protected outputManager: TOutputManager;
    protected renderConfig: FrameworkRenderConfig;
    /**
     *
     * @param component The first order component to be rendered.
     */
    constructor(component: TFrontendManagerType, outputManager: TOutputManager, renderConfig: FrameworkRenderConfig);
    /**
     * Renders the entire first order component. It returns the
     * component text and a method for saving the component to the filesystem.
     */
    renderComponent(): TRenderOutput;
    protected abstract renderComponentInternal(): TRenderOutput;
    renderComponentToFilesystem(componentContent: TSource): (fileName: string) => (outputPath: string) => Promise<void>;
}
