import {
  ElasticsearchMappingTemplate,
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
} from 'graphql-mapping-template';
import { ResourceConstants } from 'graphql-transformer-common';

export function requestTemplate(primaryKey: string, nonKeywordFields: Expression[], includeVersion: boolean = false, type: string): string {
  return print(
    compoundExpression([
      set(ref('indexPath'), str(`/${type.toLowerCase()}/doc/_search`)),
      set(ref('nonKeywordFields'), list(nonKeywordFields)),
      ifElse(
        ref('util.isNullOrEmpty($context.args.sort)'),
        compoundExpression([set(ref('sortDirection'), str('desc')), set(ref('sortField'), str(primaryKey))]),
        compoundExpression([
          set(ref('sortDirection'), ref('util.defaultIfNull($context.args.sort.direction, "desc")')),
          set(ref('sortField'), ref(`util.defaultIfNull($context.args.sort.field, "${primaryKey}")`)),
        ]),
      ),
      ifElse(
        ref('nonKeywordFields.contains($sortField)'),
        compoundExpression([set(ref('sortField0'), ref('util.toJson($sortField)'))]),
        compoundExpression([set(ref('sortField0'), ref('util.toJson("${sortField}.keyword")'))]),
      ),
      ElasticsearchMappingTemplate.searchItem({
        path: str('$indexPath'),
        size: ifElse(ref('context.args.limit'), ref('context.args.limit'), int(ResourceConstants.DEFAULT_SEARCHABLE_PAGE_LIMIT), true),
        search_after: list([ref('util.toJson($context.args.nextToken)')]),
        from: ref('context.args.from'),
        version: bool(includeVersion),
        query: ifElse(
          ref('context.args.filter'),
          ref('util.transform.toElasticsearchQueryDSL($ctx.args.filter)'),
          obj({
            match_all: obj({}),
          }),
        ),
        sort: list([raw('{$sortField0: { "order" : $util.toJson($sortDirection) }}')]),
      }),
    ]),
  );
}

export function responseTemplate(includeVersion = false) {
  return print(
    compoundExpression([
      set(ref('es_items'), list([])),
      forEach(ref('entry'), ref('context.result.hits.hits'), [
        iff(raw('!$foreach.hasNext'), set(ref('nextToken'), ref('entry.sort.get(0)'))),
        ...getSourceMapper(includeVersion),
      ]),
      toJson(
        obj({
          items: ref('es_items'),
          total: ref('ctx.result.hits.total'),
          nextToken: ref('nextToken'),
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
