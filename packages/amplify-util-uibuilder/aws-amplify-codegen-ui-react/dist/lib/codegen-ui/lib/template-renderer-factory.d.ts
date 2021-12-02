import { FrameworkOutputManager } from './framework-output-manager';
import { FrontendManagerTemplateRenderer } from './frontend-manager-template-renderer';
import { RenderTextComponentResponse } from './render-component-response';
/**
 * This class is used to wrap the created of renderers due to each renderer
 * only being used for one component.
 */
export declare class FrontendManagerTemplateRendererFactory<TSource, TFrontendManagerType, TOutputManager extends FrameworkOutputManager<TSource>, TRenderOutput extends RenderTextComponentResponse, TRenderer extends FrontendManagerTemplateRenderer<TSource, TFrontendManagerType, TOutputManager, TRenderOutput>> {
    private renderer;
    constructor(renderer: (component: TFrontendManagerType) => TRenderer);
    buildRenderer(component: TFrontendManagerType): TRenderer;
}
