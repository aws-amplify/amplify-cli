export declare type RenderTextComponentResponse = {
    /**
     * The test for of a rendered component.
     */
    componentText: string;
    /**
     * Used to render a component to the filesystem.
     */
    renderComponentToFilesystem: (outputPath: string) => Promise<void>;
};
