export declare function runFunctionTest(projectDir: string, testModule: any): Promise<void>;
export declare function addSimpleFunction(projectDir: string, testModule: any, funcName: string): Promise<string>;
export declare function randomizedFunctionName(functionName: string): string;
export declare function updateFunctionNameInSchema(projectDir: string, functionNamePlaceHolder: string, functionName: string): void;
