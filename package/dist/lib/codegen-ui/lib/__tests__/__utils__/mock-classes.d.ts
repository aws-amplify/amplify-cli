import { FrontendManagerComponent } from '../../types';
import { FrontendManagerTemplateRenderer } from '../../frontend-manager-template-renderer';
import { FrameworkOutputManager } from '../../framework-output-manager';
export declare class MockOutputManager extends FrameworkOutputManager<string> {
    writeComponent(): Promise<void>;
}
export declare class MockTemplateRenderer extends FrontendManagerTemplateRenderer<string, FrontendManagerComponent, MockOutputManager, {
    componentText: string;
    renderComponentToFilesystem: (outputPath: string) => Promise<void>;
}> {
    renderComponentInternal(): {
        componentText: string;
        renderComponentToFilesystem: jest.Mock<any, any>;
    };
}
