export type CustomIAMPolicy = {
    Action: string[];
    Effect: string;
    Resource: string[];
}

export type CustomIAMPolicies = {
    policies:  CustomIAMPolicy[];
}