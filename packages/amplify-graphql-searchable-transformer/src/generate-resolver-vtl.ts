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
  notEquals,
  printBlock,
} from 'graphql-mapping-template';
import { ResourceConstants } from 'graphql-transformer-common';

const authFilter = ref('ctx.stash.authFilter');
const API_KEY = 'API Key Authorization';
const allowedAggFieldsList = 'allowedAggFields';

export function requestTemplate(primaryKey: string, nonKeywordFields: Expression[], includeVersion: boolean = false, type: string): string {
  return print(
    compoundExpression([
      set(ref('indexPath'), str(`/${type.toLowerCase()}/doc/_search`)),
      set(ref('allowedAggFields'), methodCall(ref('util.defaultIfNull'), ref('ctx.stash.allowedAggFields'), list([]))),
      set(ref('aggFieldsFilterMap'), methodCall(ref('util.defaultIfNull'), ref('ctx.stash.aggFieldsFilterMap'), obj({}))),
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
          ifElse(
            ref('util.isNullOrEmpty($sortItem.direction)'),
            set(ref('sortDirection'), ref('util.toJson({"order": "desc"})')),
            set(ref('sortDirection'), ref('util.toJson({"order": $sortItem.direction})')),
          ),
          qref('$sortValues.add("{$sortField: $sortDirection}")'),
        ]),
      ),
      forEach(ref('aggItem'), ref('context.args.aggregates'), [
        raw(
          '#if( $allowedAggFields.contains($aggItem.field) )\n' +
            '    #set( $aggFilter = { "match_all": {} } )\n' +
            '  #elseif( $aggFieldsFilterMap.containsKey($aggItem.field) )\n' +
            '    #set( $aggFilter = { "bool": { "should": $aggFieldsFilterMap.get($aggItem.field) } } )\n' +
            '  #else\n' +
            '    $util.error("Unauthorized to run aggregation on field: ${aggItem.field}", "Unauthorized")\n' +
            '  #end',
        ),
        ifElse(
          ref('nonKeywordFields.contains($aggItem.field)'),
          qref(
            '$aggregateValues.put("$aggItem.name", { "filter": $aggFilter, "aggs": { "$aggItem.name": { "$aggItem.type": { "field": "$aggItem.field" }}} })',
          ),
          qref(
            '$aggregateValues.put("$aggItem.name", { "filter": $aggFilter, "aggs": { "$aggItem.name": { "$aggItem.type": { "field": "${aggItem.field}.keyword" }}} })',
          ),
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
              obj({
                bool: obj({
                  must: list([
                    ref('ctx.stash.authFilter'),
                    ref('util.parseJson($util.transform.toElasticsearchQueryDSL($ctx.args.filter))'),
                  ]),
                }),
              }),
            ),
          ),
        ]),
        iff(
          not(isNullOrEmpty(ref('ctx.args.filter'))),
          set(ref('filter'), ref('util.parseJson($util.transform.toElasticsearchQueryDSL($ctx.args.filter))')),
        ),
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
        set(ref('currentAggItem'), ref('ctx.result.aggregations.get($aggItem)')),
        qref('$aggResult.put("name", $aggItem)'),
        iff(
          raw('!$util.isNullOrEmpty($currentAggItem)'),
          compoundExpression([
            iff(
              raw('!$util.isNullOrEmpty($currentAggItem.get($aggItem).buckets)'),
              compoundExpression([
                qref('$aggResultValue.put("__typename", "SearchableAggregateBucketResult")'),
                qref('$aggResultValue.put("buckets", $currentAggItem.get($aggItem).buckets)'),
              ]),
            ),
            iff(
              raw('!$util.isNullOrEmpty($currentAggItem.get($aggItem).value)'),
              compoundExpression([
                qref('$aggResultValue.put("__typename", "SearchableAggregateScalarResult")'),
                qref('$aggResultValue.put("value", $currentAggItem.get($aggItem).value)'),
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

export function sandboxMappingTemplate(enabled: boolean, fields: Array<string>) {
  let sandboxExp: Expression;
  if (enabled) {
    sandboxExp = ifElse(
      notEquals(methodCall(ref('util.authType')), str(API_KEY)),
      methodCall(ref('util.unauthorized')),
      qref(methodCall(ref('ctx.stash.put'), str(allowedAggFieldsList), raw(JSON.stringify(fields)))),
    );
  } else {
    sandboxExp = methodCall(ref('util.unauthorized'));
  }
  return printBlock(`Sandbox Mode ${enabled ? 'Enabled' : 'Disabled'}`)(
    compoundExpression([iff(not(ref('ctx.stash.get("hasAuth")')), sandboxExp), toJson(obj({}))]),
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
