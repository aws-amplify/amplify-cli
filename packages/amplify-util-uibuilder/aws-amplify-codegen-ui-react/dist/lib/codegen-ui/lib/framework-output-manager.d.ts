export declare abstract class FrameworkOutputManager<TSource> {
    abstract writeComponent(input: TSource, outputPath: string): Promise<void>;
}
