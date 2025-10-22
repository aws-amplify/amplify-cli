import { Renderer } from '../render_pipeline';
export declare class EnsureDirectory implements Renderer {
    private directory;
    constructor(directory: string);
    render: () => Promise<void>;
}
//# sourceMappingURL=ensure_directory.d.ts.map