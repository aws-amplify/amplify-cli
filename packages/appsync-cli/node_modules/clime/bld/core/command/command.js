"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
/**
 * Command context.
 */
class Context {
    constructor({ cwd, commands, }) {
        this.cwd = cwd;
        this.commands = commands;
    }
}
exports.Context = Context;
/**
 * The abstract `Command` class to be extended.
 */
class Command {
    /**
     * Get the help object of current command.
     */
    static getHelp() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield _1.HelpInfo.build(this);
        });
    }
}
/** @internal */
Command.decorated = false;
/** @internal */
Command.requiredParamsNumber = 0;
exports.Command = Command;
/**
 * The `command()` decorator that decorates concrete class of `Command`.
 */
function command(options = {}) {
    return (target) => {
        target.brief = options.brief;
        target.description = options.description;
        // Validate param definitions.
        let paramDefinitions = target.paramDefinitions || [];
        let paramsDefinition = target.paramsDefinition;
        let variadicParamsRequired = paramsDefinition && paramsDefinition.required;
        if (paramDefinitions.length) {
            let hasOptional = false;
            for (let i = 0; i < paramDefinitions.length; i++) {
                let definition = paramDefinitions[i];
                if (!definition) {
                    throw new Error(`Expecting parameter definition at position ${i}`);
                }
                if (hasOptional) {
                    if (definition.required) {
                        throw new Error('Required parameter cannot follow optional ones');
                    }
                }
                else {
                    if (definition.required) {
                        target.requiredParamsNumber++;
                    }
                    else {
                        if (variadicParamsRequired) {
                            throw new Error('Parameter cannot be optional if variadic parameters are required');
                        }
                        hasOptional = true;
                    }
                }
            }
        }
        if (paramsDefinition && paramsDefinition.index !== paramDefinitions.length) {
            throw new Error('Expecting variadic parameters to be adjacent to other parameters');
        }
        // Prepare option definitions.
        let types = Reflect.getMetadata('design:paramtypes', target.prototype, 'execute');
        if (!types) {
            throw new Error('No parameter type information found, please add `@metadata` decorator to method `execute` \
if no other decorator applied');
        }
        let optionsConstructorCandidateIndex = paramDefinitions.length + (target.paramsDefinition ? 1 : 0);
        let optionsConstructorCandidate = types[optionsConstructorCandidateIndex];
        let contextConstructorCandidateIndex;
        if (optionsConstructorCandidate && optionsConstructorCandidate.prototype instanceof _1.Options) {
            target.optionsConstructor = optionsConstructorCandidate;
            target.optionDefinitions = optionsConstructorCandidate.definitions;
            contextConstructorCandidateIndex = optionsConstructorCandidateIndex + 1;
        }
        else {
            contextConstructorCandidateIndex = optionsConstructorCandidateIndex;
        }
        let contextConstructorCandidate = types[contextConstructorCandidateIndex];
        if (contextConstructorCandidate && (contextConstructorCandidate === Context ||
            contextConstructorCandidate.prototype instanceof Context)) {
            target.contextConstructor = contextConstructorCandidate;
        }
        target.decorated = true;
    };
}
exports.command = command;
/**
 * The `metadata` decorator does nothing at runtime. It is only used to have
 * TypeScript emits type metadata for `execute` method that has no other
 * decorators.
 */
exports.metadata = () => { };
//# sourceMappingURL=command.js.map