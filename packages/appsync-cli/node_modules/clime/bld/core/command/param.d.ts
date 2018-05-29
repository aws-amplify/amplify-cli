import { Command, GeneralValidator } from './command';
import { CastableType } from '..';
/**
 * Options for command parameter.
 */
export interface ParamOptions<T> {
    /**
     * Parameter name shown on usage, defaults to the name of correspondent
     * function parameter.
     */
    name?: string;
    /** Parameter type, defaults to type of emitted "design:type" metadata. */
    type?: CastableType<any>;
    /** Indicates whether this parameter is required, defaults to `false`. */
    required?: boolean;
    /**
     * The parameter validator, could be either a regular expression or an
     * object that matches `Validator` interface.
     */
    validator?: GeneralValidator<T>;
    /** The parameter validators. */
    validators?: GeneralValidator<T>[];
    /** Default value for this parameter. */
    default?: T | string;
    /** Description shown on usage. */
    description?: string;
}
/**
 * The `param()` decorator that decorates parameters of method `execute` on a
 * concrete `Command` class.
 * This decorator could only be applied to continuous parameters of which the
 * index starts from 0.
 */
export declare function param<T>({name: paramName, type, required, validator, validators, default: defaultValue, description}?: ParamOptions<T>): (target: Command, name: "execute", index: number) => void;
