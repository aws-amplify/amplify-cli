export interface Renderer {
    render(): Promise<void>;
}
export declare class RenderPipeline implements Renderer {
    private renderers;
    constructor(renderers: Renderer[]);
    render: () => Promise<void>;
}
//# sourceMappingURL=render_pipeline.d.ts.map