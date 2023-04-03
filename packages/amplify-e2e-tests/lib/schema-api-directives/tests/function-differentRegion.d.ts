export declare function runTest(projectDir: string, testModule: any): Promise<void>;
export declare const schema = "\n#change: replace the dummy function name with  \"<function-name>\" placeholder, the test will replace it with the actual function name\n#change: replaced the dummy region \"us-east-1\" with the  \"<function-region>\" placeholder, the test will replace is with the actual region of the function\ntype Query {\n  echo(msg: String): String @function(name: \"<function-name>\", region: \"<function-region>\")\n}\n";
export declare const func = "\n//#extra\n//create the lambda function in region other than the amplify project region\nexports.handler = async event => {\n  return event.arguments.msg;\n};\n";
export declare const query = "\n#extra\nquery Echo {\n  echo(msg: \"query message echoed from different region.\")\n}\n";
export declare const expected_result_query: {
    data: {
        echo: string;
    };
};
