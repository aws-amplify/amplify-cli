import { FrameworkOutputManager } from './framework-output-manager';
import { FrontendManagerTemplateRenderer } from './frontend-manager-template-renderer';
import { FrontendManagerTemplateRendererFactory } from './template-renderer-factory';
import { FrameworkOutputConfig } from './framework-output-config';
import { RenderTextComponentResponse } from './render-component-response';
/**
 * This is a class for genercially rendering FrontendManager templates.
 * The output is determined by the renderer passed into the constructor.
 */
export declare class FrontendManagerTemplateRendererManager<TSource, TFrontendManagerType, TOutputManager extends FrameworkOutputManager<TSource>, TRenderOutput extends RenderTextComponentResponse, TRenderer extends FrontendManagerTemplateRenderer<TSource, TFrontendManagerType, TOutputManager, TRenderOutput>> {
    private renderer;
    private outputConfig;
    constructor(renderer: FrontendManagerTemplateRendererFactory<TSource, TFrontendManagerType, TOutputManager, TRenderOutput, TRenderer>, outputConfig: FrameworkOutputConfig);
    renderSchemaToTemplate(component: TFrontendManagerType | undefined): TRenderOutput;
    renderSchemaToTemplates(jsonSchema: TFrontendManagerType[] | undefined): void;
}
