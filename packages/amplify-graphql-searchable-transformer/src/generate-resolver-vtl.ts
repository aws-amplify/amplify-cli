import {
  SearchableMappingTemplate,
  print,
  str,
  ref,
  obj,
  set,
  iff,
  list,
  raw,
  forEach,
  compoundExpression,
  qref,
  toJson,
  ifElse,
  int,
  Expression,
  bool,
  methodCall,
  isNullOrEmpty,
  not,
} from 'graphql-mapping-template';
import { ResourceConstants } from 'graphql-transformer-common';

const authFilter = ref('ctx.stash.authFilter');

export function requestTemplate(primaryKey: string, nonKeywordFields: Expression[], includeVersion: boolean = false, type: string): string {
  return print(
    compoundExpression([
      set(ref('indexPath'), str(`/${type.toLowerCase()}/doc/_search`)),
      set(ref('nonKeywordFields'), list(nonKeywordFields)),
      set(ref('sortValues'), list([])),
      set(ref('aggregateValues'), obj({})),
      set(ref('primaryKey'), str(primaryKey)),
      ifElse(
        ref('util.isNullOrEmpty($context.args.sort)'),
        compoundExpression([
          ifElse(
            ref('nonKeywordFields.contains($primaryKey)'),
            set(ref('sortField'), ref('util.toJson($primaryKey)')),
            set(ref('sortField'), ref('util.toJson("${primaryKey}.keyword")')),
          ),
          set(ref('sortDirection'), ref('util.toJson({"order": "desc"})')),
          qref('$sortValues.add("{$sortField: $sortDirection}")'),
        ]),
        forEach(ref('sortItem'), ref('context.args.sort'), [
          ifElse(
            ref('util.isNullOrEmpty($sortItem.field)'),
            ifElse(
              ref('nonKeywordFields.contains($primaryKey)'),
              set(ref('sortField'), ref('util.toJson($primaryKey)')),
              set(ref('sortField'), ref('util.toJson("${primaryKey}.keyword")')),
            ),
            ifElse(
              ref('nonKeywordFields.contains($sortItem.field)'),
              set(ref('sortField'), ref('util.toJson($sortItem.field)')),
              set(ref('sortField'), ref('util.toJson("${sortItem.field}.keyword")')),
            ),
          ),
          set(ref('sortDirection'), ref('util.toJson({"order": $sortItem.direction})')),
          qref('$sortValues.add("{$sortField: $sortDirection}")'),
        ]),
      ),
      forEach(ref('aggItem'), ref('context.args.aggregates'), [
        ifElse(
          ref('nonKeywordFields.contains($aggItem.field)'),
          qref('$aggregateValues.put("$aggItem.name", {"$aggItem.type": {"field": "$aggItem.field"}})'),
          qref('$aggregateValues.put("$aggItem.name", {"$aggItem.type": {"field": "${aggItem.field}.keyword"}})'),
        ),
      ]),
      ifElse(
        not(isNullOrEmpty(authFilter)),
        compoundExpression([
          set(ref('filter'), authFilter),
          iff(
            not(isNullOrEmpty(ref('ctx.args.filter'))),
            set(
              ref('filter'),
              list([
                obj({
                  bool: obj({ must: list([ref('ctx.stash.authFilter'), ref('util.transform.toElasticsearchQueryDSL($ctx.args.filter)')]) }),
                }),
              ]),
            ),
          ),
        ]),
        iff(not(isNullOrEmpty(ref('ctx.args.filter'))), set(ref('filter'), ref('ctx.args.filter'))),
      ),
      iff(isNullOrEmpty(ref('filter')), set(ref('filter'), obj({ match_all: obj({}) }))),
      SearchableMappingTemplate.searchTemplate({
        path: str('$indexPath'),
        size: ifElse(ref('context.args.limit'), ref('context.args.limit'), int(ResourceConstants.DEFAULT_SEARCHABLE_PAGE_LIMIT), true),
        search_after: ref('util.base64Decode($context.args.nextToken)'),
        from: ref('context.args.from'),
        version: bool(includeVersion),
        query: methodCall(ref('util.toJson'), ref('filter')),
        sort: ref('sortValues'),
        aggs: ref('util.toJson($aggregateValues)'),
      }),
    ]),
  );
}

export function responseTemplate(includeVersion = false) {
  return print(
    compoundExpression([
      set(ref('es_items'), list([])),
      set(ref('aggregateValues'), list([])),
      forEach(ref('entry'), ref('context.result.hits.hits'), [
        iff(raw('!$foreach.hasNext'), set(ref('nextToken'), ref('util.base64Encode($util.toJson($entry.sort))'))),
        ...getSourceMapper(includeVersion),
      ]),
      forEach(ref('aggItem'), ref('context.result.aggregations.keySet()'), [
        set(ref('aggResult'), obj({})),
        set(ref('aggResultValue'), obj({})),
        qref('$aggResult.put("name", $aggItem)'),
        iff(
          raw('!$util.isNullOrEmpty($context.result.aggregations)'),
          compoundExpression([
            iff(
              raw('!$util.isNullOrEmpty($context.result.aggregations.get($aggItem).buckets)'),
              compoundExpression([
                qref('$aggResultValue.put("__typename", "SearchableAggregateBucketResult")'),
                qref('$aggResultValue.put("buckets", $context.result.aggregations.get($aggItem).buckets)'),
              ]),
            ),
            iff(
              raw('!$util.isNullOrEmpty($context.result.aggregations.get($aggItem).value)'),
              compoundExpression([
                qref('$aggResultValue.put("__typename", "SearchableAggregateScalarResult")'),
                qref('$aggResultValue.put("value", $context.result.aggregations.get($aggItem).value)'),
              ]),
            ),
          ]),
        ),
        qref('$aggResult.put("result", $aggResultValue)'),
        qref('$aggregateValues.add($aggResult)'),
      ]),
      toJson(
        obj({
          items: ref('es_items'),
          total: ref('ctx.result.hits.total.value'),
          nextToken: ref('nextToken'),
          aggregateItems: ref('aggregateValues'),
        }),
      ),
    ]),
  );
}

function getSourceMapper(includeVersion: boolean) {
  if (includeVersion) {
    return [
      set(ref('row'), methodCall(ref('entry.get'), str('_source'))),
      qref('$row.put("_version", $entry.get("_version"))'),
      qref('$es_items.add($row)'),
    ];
  }
  return [qref('$es_items.add($entry.get("_source"))')];
}
