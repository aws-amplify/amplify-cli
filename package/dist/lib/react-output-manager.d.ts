import { FrameworkOutputManager } from './codegen-ui';
export declare class ReactOutputManager extends FrameworkOutputManager<string> {
    writeComponent(input: string, outputPath: string): Promise<void>;
}
