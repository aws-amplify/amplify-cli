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
      set(ref('sortValues'), list([])),
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
        forEach(
          ref('sortItem'),
          ref('context.args.sort'),
          [
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
          ],
        ),
      ),
      ElasticsearchMappingTemplate.searchItem({
        path: str('$indexPath'),
        size: ifElse(ref('context.args.limit'), ref('context.args.limit'), int(ResourceConstants.DEFAULT_SEARCHABLE_PAGE_LIMIT), true),
        search_after: ref('util.base64Decode($context.args.nextToken)'),
        from: ref('context.args.from'),
        version: bool(includeVersion),
        query: ifElse(
          ref('context.args.filter'),
          ref('util.transform.toElasticsearchQueryDSL($ctx.args.filter)'),
          obj({
            match_all: obj({}),
          }),
        ),
        sort: ref('sortValues'),
      }),
    ]),
  );
}

export function responseTemplate(includeVersion = false) {
  return print(
    compoundExpression([
      set(ref('es_items'), list([])),
      forEach(ref('entry'), ref('context.result.hits.hits'), [
        iff(raw('!$foreach.hasNext'), set(ref('nextToken'), ref('util.base64Encode($util.toJson($entry.sort))'))),
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
