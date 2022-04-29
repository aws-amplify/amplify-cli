import { plurality, toCamelCase } from 'graphql-transformer-common';
import md5 from 'md5';

const toPrefixedCamelCase = (prefix: string) => (base: string) => toCamelCase([prefix, base]);

const truncateSubscriptionName = (name: string): string => {
  if (name.length <= 50) return name;

  return name.slice(0, 45) + md5(name).slice(0, 5);
};

type Operation = 'get' | 'list' | 'sync' | 'create' | 'update' | 'delete' | 'onCreate' | 'onUpdate' | 'onDelete';

const fieldNameFuncMap: Record<Operation, (typeName: string) => string> = {
  get: toPrefixedCamelCase('get'),
  create: toPrefixedCamelCase('create'),
  update: toPrefixedCamelCase('update'),
  delete: toPrefixedCamelCase('delete'),
  list: (typeName: string) => toPrefixedCamelCase('list')(plurality(typeName, true)),
  sync: (typeName: string) => toPrefixedCamelCase('sync')(plurality(typeName, true)),
  onCreate: (typeName: string) => truncateSubscriptionName(toPrefixedCamelCase('onCreate')(typeName)),
  onUpdate: (typeName: string) => truncateSubscriptionName(toPrefixedCamelCase('onUpdate')(typeName)),
  onDelete: (typeName: string) => truncateSubscriptionName(toPrefixedCamelCase('onDelete')(typeName)),
};

export const getFieldNameFor = (op: Operation, typeName: string): string => fieldNameFuncMap[op](typeName);
