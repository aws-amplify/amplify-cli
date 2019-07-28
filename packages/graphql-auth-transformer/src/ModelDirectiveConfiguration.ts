import { getDirectiveArguments } from 'graphql-transformer-core'
import { graphqlName, toUpper, plurality } from 'graphql-transformer-common'
import { ModelQuery, ModelMutation } from './AuthRule';
import { DirectiveNode, ObjectTypeDefinitionNode } from 'graphql';

interface QueryNameMap {
    get?: string;
    list?: string;
}

interface MutationNameMap {
    create?: string;
    update?: string;
    delete?: string;
}

interface SubscriptionNameMap {
    onCreate?: string;
    onUpdate?: string;
    onDelete?: string;
}

interface ModelDirectiveArgs {
    queries?: QueryNameMap,
    mutations?: MutationNameMap,
    subscriptions?: SubscriptionNameMap
}

export type ModelDirectiveOperationType = ModelQuery | ModelMutation | 'onCreate' | 'onUpdate' | 'onDelete';

type ModelDirectiveOperation = {
    shouldHave: boolean,
    name: string
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
        let createName: string;
        let updateName: string;
        let deleteName: string;
        let getName: string;
        let listName: string;
        let onCreateName: string;
        let onUpdateName: string;
        let onDeleteName: string;

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

        if (directiveArguments.subscriptions === null) {
            shouldHaveOnCreate = false;
            shouldHaveOnUpdate = false;
            shouldHaveOnDelete = false;
        } else if (directiveArguments.subscriptions) {
            if (!directiveArguments.subscriptions.onCreate) {
                shouldHaveOnCreate = false;
            } else {
                onCreateName = makeName('onCreate', directiveArguments.subscriptions.onCreate);
            }
            if (!directiveArguments.subscriptions.onUpdate) {
                shouldHaveOnUpdate = false;
            } else {
                onUpdateName = makeName('onUpdate', directiveArguments.subscriptions.onUpdate);
            }
            if (!directiveArguments.subscriptions.onDelete) {
                shouldHaveOnDelete = false;
            } else {
                onDeleteName = makeName('onDelete', directiveArguments.subscriptions.onDelete);
            }
        } else {
            onCreateName = makeName('onCreate');
            onUpdateName = makeName('onUpdate');
            onDeleteName = makeName('onDelete');
        }

        this.map.set('create', { shouldHave: shouldHaveCreate, name: createName });
        this.map.set('update', { shouldHave: shouldHaveUpdate, name: updateName });
        this.map.set('delete', { shouldHave: shouldHaveDelete, name: deleteName });
        this.map.set('get', { shouldHave: shouldHaveGet, name: getName });
        this.map.set('list', { shouldHave: shouldHaveList, name: listName });
        this.map.set('onCreate', { shouldHave: shouldHaveOnCreate, name: onCreateName });
        this.map.set('onUpdate', { shouldHave: shouldHaveOnUpdate, name: onCreateName });
        this.map.set('onDelete', { shouldHave: shouldHaveOnDelete, name: onCreateName });
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
}
