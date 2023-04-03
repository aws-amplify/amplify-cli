export declare const supportedServices: {
    S3: {
        inputs: {
            key: string;
            question: string;
            validation: {
                operator: string;
                value: string;
                onErrorMsg: string;
            };
            required: boolean;
        }[];
        alias: string;
        defaultValuesFilename: string;
        serviceWalkthroughFilename: string;
        cfnFilename: string;
        provider: string;
    };
    DynamoDB: {
        inputs: ({
            key: string;
            type: string;
            question: string;
            validation: {
                operator: string;
                value: string;
                onErrorMsg: string;
            };
            required: boolean;
        } | {
            key: string;
            type: string;
            question: string;
            required: boolean;
            validation?: undefined;
        } | {
            key: string;
            type: string;
            question: string;
            validation?: undefined;
            required?: undefined;
        })[];
        alias: string;
        defaultValuesFilename: string;
        serviceWalkthroughFilename: string;
        cfnFilename: string;
        provider: string;
    };
};
//# sourceMappingURL=supported-services.d.ts.map