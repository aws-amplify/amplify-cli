export type CustomIAMPolicies = {
    policies:  CustomIAMPolicy[];
}

export type CustomIAMPolicy = {
    Action: string[];
    Effect: string;
    Resource: string[];
}


export const CustomIAMPolicySchema = {
    type: "object",
    properties: {
        policies: {
            type: "array",
            minItems: 1,
            items: {
                type: "object",
                properties: {
                    "Action": { type: "array", items: { type: "string" }, minItems: 1, nullable: false },
                    "Effect": { type: "string",  nullable: false, default: "Allow" },
                    "Resource": { type: "array", items: { type: "string" }, minItems: 1, nullable: false },
                },
                required: ["Resource", "Action"],
                additionalProperties: false
            },
        }
    }
}





