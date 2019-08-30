import { getDirectiveArguments } from 'graphql-transformer-core'
import { graphqlName, toUpper, plurality } from 'graphql-transformer-common'
import { ModelQuery, ModelMutation } from './AuthRule';
import { DirectiveNode, ObjectTypeDefinitionNode } from 'graphql';

export interface QueryNameMap {
    get?: string;
    list?: string;
    query?: string;
}

export interface MutationNameMap {
    create?: string;
    update?: string;
    delete?: string;
}

export type ModelSubscriptionLevel = 'off' | 'public' | 'on';

export interface SubscriptionNameMap {
    onCreate?: string[];
    onUpdate?: string[];
    onDelete?: string[];
    level?: ModelSubscriptionLevel;
}

export interface ModelDirectiveArgs {
    queries?: QueryNameMap,
    mutations?: MutationNameMap,
    subscriptions?: SubscriptionNameMap,
}

export type ModelDirectiveOperationType = ModelQuery | ModelMutation | 'onCreate' | 'onUpdate' | 'onDelete' | 'level';

type ModelDirectiveOperation = {
    shouldHave: boolean,
    name?: string,
    names?: string[]
};

export class ModelDirectiveConfiguration {
    map: Map<ModelDirectiveOperationType, ModelDirectiveOperation> = new Map();

    constructor(directive: DirectiveNode, def: ObjectTypeDefinitionNode) {
        const typeName = def.name.value;
        const directiveArguments: ModelDirectiveArgs = getDirectiveArguments(directive)

        const makeName = (operation: ModelDirectiveOperationType, nameOverride?: string, isList: boolean = false) =>
            nameOverride ? nameOverride : graphqlName(operation + (isList ? plurality(toUpper(typeName)) : toUpper(typeName)));

        let shouldHaveCreate = true;
        let shouldHaveUpdate = true;
        let shouldHaveDelete = true;
        let shouldHaveGet = true;
        let shouldHaveList = true;
        let shouldHaveOnCreate = true;
        let shouldHaveOnUpdate = true;
        let shouldHaveOnDelete = true;
        let shouldHaveLevel = true;
        let createName: string;
        let updateName: string;
        let deleteName: string;
        let getName: string;
        let listName: string;
        let onCreateNames: string[] = [];
        let onUpdateNames: string[] = [];
        let onDeleteNames: string[] = [];
        let level: ModelSubscriptionLevel = "on";

        // Figure out which mutations to make and if they have name overrides
        if (directiveArguments.mutations === null) {
            shouldHaveCreate = false;
            shouldHaveUpdate = false;
            shouldHaveDelete = false;
        } else if (directiveArguments.mutations) {
            if (!directiveArguments.mutations.create) {
                shouldHaveCreate = false;
            } else {
                createName = makeName('create', directiveArguments.mutations.create);
            }
            if (!directiveArguments.mutations.update) {
                shouldHaveUpdate = false;
            } else {
                updateName = makeName('update', directiveArguments.mutations.update);
            }
            if (!directiveArguments.mutations.delete) {
                shouldHaveDelete = false;
            } else {
                deleteName = makeName('delete', directiveArguments.mutations.delete);
            }
        } else {
            createName = makeName('create');
            updateName = makeName('update');
            deleteName = makeName('delete');
        }

        // Figure out which queries to make and if they have name overrides.
        // If queries is undefined (default), create all queries
        // If queries is explicetly set to null, do not create any
        // else if queries is defined, check overrides
        if (directiveArguments.queries === null) {
            shouldHaveGet = false;
            shouldHaveList = false;
        } else if (directiveArguments.queries) {
            if (!directiveArguments.queries.get) {
                shouldHaveGet = false;
            } else {
                getName = makeName('get', directiveArguments.queries.get);
            }
            if (!directiveArguments.queries.list) {
                shouldHaveList = false;
            } else {
                listName = makeName('list', directiveArguments.queries.list, true);
            }
        } else {
            getName = makeName('get');
            listName = makeName('list', null, true);
        }
        const subscriptions = directiveArguments.subscriptions;
        if (subscriptions === null) {
            shouldHaveOnCreate = false;
            shouldHaveOnUpdate = false;
            shouldHaveOnDelete = false;
            level = 'off';
        } else if (subscriptions &&
            (subscriptions.onCreate || subscriptions.onUpdate || subscriptions.onDelete)) {
            if (!directiveArguments.subscriptions.onCreate) {
                shouldHaveOnCreate = false;
            } else {
                directiveArguments.subscriptions.onCreate.forEach( (name) => {
                    onCreateNames.push(makeName('onCreate', name))
                });
            }
            if (!directiveArguments.subscriptions.onUpdate) {
                shouldHaveOnUpdate = false;
            } else {
                directiveArguments.subscriptions.onUpdate.forEach( (name) => {
                    onUpdateNames.push(makeName('onUpdate', name))
                });
            }
            if (!directiveArguments.subscriptions.onDelete) {
                shouldHaveOnDelete = false;
            } else {
                directiveArguments.subscriptions.onDelete.forEach( (name) => {
                    onDeleteNames.push(makeName('onDelete', name))
                });
            }
        } else {
            onCreateNames.push(makeName('onCreate'));
            onUpdateNames.push(makeName('onUpdate'));
            onDeleteNames.push(makeName('onDelete'));
        }

        // seperate check for level to see if it was specified in subscriptions
        if (directiveArguments.subscriptions && directiveArguments.subscriptions.level) {
            level = directiveArguments.subscriptions.level
        }

        // if a mutation operation is missing there shouldn't be subscription operation around it
        shouldHaveOnCreate = shouldHaveCreate;
        shouldHaveOnUpdate = shouldHaveUpdate;
        shouldHaveOnDelete = shouldHaveDelete;

        this.map.set('create', { shouldHave: shouldHaveCreate, name: createName });
        this.map.set('update', { shouldHave: shouldHaveUpdate, name: updateName });
        this.map.set('delete', { shouldHave: shouldHaveDelete, name: deleteName });
        this.map.set('get', { shouldHave: shouldHaveGet, name: getName });
        this.map.set('list', { shouldHave: shouldHaveList, name: listName });
        this.map.set('onCreate', { shouldHave: shouldHaveOnCreate, names: onCreateNames });
        this.map.set('onUpdate', { shouldHave: shouldHaveOnUpdate, names: onUpdateNames });
        this.map.set('onDelete', { shouldHave: shouldHaveOnDelete, names: onDeleteNames });
        this.map.set('level', { shouldHave: shouldHaveLevel, name: level })
    }

    public shouldHave(op: ModelDirectiveOperationType): boolean {
        return this.map.get(op).shouldHave;
    }

    public getName(op: ModelDirectiveOperationType): string | undefined {
        const { shouldHave, name } = this.map.get(op);

        if (shouldHave) {
            return name;
        }
    }

    public getNames(op: ModelDirectiveOperationType): string [] | undefined {
        const { shouldHave, names } = this.map.get(op);

        if (shouldHave) {
            return names;
        }
    }
}
