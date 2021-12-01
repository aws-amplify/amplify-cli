import { InternalError, InvalidInputError } from './error-types';
export declare const transformCodegenError: (error: any | unknown) => InternalError | InvalidInputError;
export declare const handleCodegenErrors: (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
