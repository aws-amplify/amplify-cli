import { CastableType } from '..';
import { GeneralValidator } from './command';
/**
 * Options for command options.
 */
export interface OptionOptions<T> {
    /**
     * Option name shown on usage, defaults to hyphenated name of correspondent
     * property.
     */
    name?: string;
    /** A single character as the shorthand of the option. */
    flag?: string;
    /** The placeholder shown on usage as `--option <placeholder>`. */
    placeholder?: string;
    /** Parameter type, defaults to type of emitted "design:type" metadata. */
    type?: CastableType<T>;
    /** Indicates whether this option is required, defaults to `false`. */
    required?: boolean;
    /**
     * The option validator, could be either a regular expression or an object
     * that matches `Validator` interface.
     */
    validator?: GeneralValidator<T>;
    /** The option validators. */
    validators?: GeneralValidator<T>[];
    /** Indicates whether this is a switch. */
    toggle?: boolean;
    /** Default value for this option. */
    default?: T | string;
    /** Description shown on usage. */
    description?: string;
}
/**
 * The abstract `Options` class to be extended.
 */
export declare abstract class Options {
}
/**
 * The `option()` decorator that decorates concrete class of `Options`.
 */
export declare function option<T>({name: optionName, flag, placeholder, toggle, type, required, validator, validators, default: defaultValue, description}?: OptionOptions<T>): (target: Options, name: string) => void;
