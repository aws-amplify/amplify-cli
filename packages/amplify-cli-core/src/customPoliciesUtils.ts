export type CustomIAMPolicy = {
    Action: string[];
    Effect: string;
    Resource: string[];
}


export const CustomIAMPolicySchema = {
        type: "object",
        properties: {
            Action: {type: "array", items: {type: "string"}, minItems: 1, nullable: false},
            Effect: {type: "string", items: {type: "string"}, minItems: 1, nullable: false, default: "Allow"},
            Resource: {type: "array", items: {type: "string"}, minItems: 1, nullable: false},
        },
        required: ["Resource", "Action"],
        additionalProperties: false
}




