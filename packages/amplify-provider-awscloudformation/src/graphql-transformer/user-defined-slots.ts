import { UserDefinedSlot, UserDefinedResolver } from '@aws-amplify/graphql-transformer-core';
import _ from 'lodash';

export const SLOT_NAMES = new Set([
  'init',
  'preAuth',
  'auth',
  'postAuth',
  'preDataLoad',
  'preUpdate',
  'preSubscribe',
  'postDataLoad',
  'postUpdate',
  'finish',
]);

const EXCLUDE_FILES = new Set(['README.md']);

export function parseUserDefinedSlots(userDefinedTemplates: Record<string, string>): Record<string, UserDefinedSlot[]> {
  type ResolverKey = string;
  type ResolverOrder = number;
  const groupedResolversMap: Record<ResolverKey, Record<ResolverOrder, UserDefinedSlot>> = {};

  Object.entries(userDefinedTemplates)
    // filter out non-resolver files
    .filter(([fileName]) => !EXCLUDE_FILES.has(fileName))
    .forEach(([fileName, template]) => {
      const slicedSlotName = fileName.split('.');
      const isSlot = SLOT_NAMES.has(slicedSlotName[2]);

      if (!isSlot) {
        return;
      }
      const resolverType = slicedSlotName[slicedSlotName.length - 2] === 'res' ? 'responseResolver' : 'requestResolver';
      const resolverName = [slicedSlotName[0], slicedSlotName[1]].join('.');
      const slotName = slicedSlotName[2];
      const resolverOrder = `order${Number(slicedSlotName[3]) || 0}`;
      const resolver: UserDefinedResolver = {
        fileName,
        template,
      };
      // because a slot can have a request and response resolver, we need to group corresponding request and response resolvers
      if (_.has(groupedResolversMap, [`${resolverName}#${slotName}`, resolverOrder])) {
        _.set(groupedResolversMap, [`${resolverName}#${slotName}`, resolverOrder, resolverType], resolver);
      } else {
        const slot = {
          resolverTypeName: slicedSlotName[0],
          resolverFieldName: slicedSlotName[1],
          slotName,
          [resolverType]: resolver,
        };
        _.set(groupedResolversMap, [`${resolverName}#${slotName}`, resolverOrder], slot);
      }
    });

  return Object.entries(groupedResolversMap)
    .map(([resolverNameKey, numberedSlots]) => ({
      orderedSlots: Object.entries(numberedSlots)
        .sort(([i], [j]) => i.localeCompare(j))
        .map(([_, slot]) => slot),
      resolverName: resolverNameKey.split('#')[0],
    }))
    .reduce((acc, { orderedSlots, resolverName }) => {
      if (acc[resolverName]) {
        acc[resolverName].push(...orderedSlots);
      } else {
        acc[resolverName] = orderedSlots;
      }
      return acc;
    }, {} as Record<string, UserDefinedSlot[]>);
}
