export declare const schema: string;
export declare const func = "\n//#error: context.done is deprecated, use async and return\nexports.handler = async event => {\n  return event.arguments.msg;\n};\n";
export declare const query = "\n#extra\nquery Echo {\n  echo(msg: \"query message\")\n}\n";
export declare const expected_result_query: {
    data: {
        echo: string;
    };
};
