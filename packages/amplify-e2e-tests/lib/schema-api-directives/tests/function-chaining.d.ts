export declare function runTest(projectDir: string, testModule: any): Promise<void>;
export declare const schema: string;
export declare const func1 = "\n//#extra\nexports.handler = async event => {\n  return event.arguments.msg + '|processed by worker-function';\n};\n";
export declare const func2 = "\n//#extra\nexports.handler = async event => {\n  return event.prev.result + '|processed by audit function';\n};\n";
export declare const query = "\n#extra\nquery DoSomeWork {\n  doSomeWork(msg: \"initial mutation message\")\n}\n";
export declare const expected_result_query: {
    data: {
        doSomeWork: string;
    };
};
