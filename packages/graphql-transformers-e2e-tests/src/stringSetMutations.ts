import { DeploymentResources } from 'graphql-transformer-core';

/**
 * Used with SearchableModelTransformer Tests
 * Changes userItems list to stringsets in dynamo so the lambda function can support it
 */

const createStringSetVTL = `
## [Start] Prepare DynamoDB PutItem Request. **
$util.qr($context.args.input.put("createdAt", $util.defaultIfNull($ctx.args.input.createdAt, $util.time.nowISO8601())))
$util.qr($context.args.input.put("updatedAt", $util.defaultIfNull($ctx.args.input.updatedAt, $util.time.nowISO8601())))
$util.qr($context.args.input.put("__typename", "Class"))
#set( $condition = {
  "expression": "attribute_not_exists(#id)",
  "expressionNames": {
      "#id": "id"
  }
} )
## CHANGE USERITEMS LIST INTO A STRINGSET
#set($values = $util.dynamodb.toMapValues($context.args.input))
#set($values.userItems = $util.dynamodb.toStringSet($context.args.input.userItems))
#if( $context.args.condition )
  #set( $condition.expressionValues = {} )
  #set( $conditionFilterExpressions = $util.parseJson($util.transform.toDynamoDBConditionExpression($context.args.condition)) )
  $util.qr($condition.put("expression", "($condition.expression) AND $conditionFilterExpressions.expression"))
  $util.qr($condition.expressionNames.putAll($conditionFilterExpressions.expressionNames))
  $util.qr($condition.expressionValues.putAll($conditionFilterExpressions.expressionValues))
#end
#if( $condition.expressionValues && $condition.expressionValues.size() == 0 )
  #set( $condition = {
  "expression": $condition.expression,
  "expressionNames": $condition.expressionNames
} )
#end
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": #if( $modelObjectKey ) $util.toJson($modelObjectKey) #else {
  "id":   $util.dynamodb.toDynamoDBJson($util.defaultIfNullOrBlank($ctx.args.input.id, $util.autoId()))
} #end,
  "attributeValues": $util.toJson($values),
  "condition": $util.toJson($condition)
}
## [End] Prepare DynamoDB PutItem Request. **
`;

const updateStringSetVTL = `
#if( $authCondition && $authCondition.expression != "" )
  #set( $condition = $authCondition )
  #if( $modelObjectKey )
    #foreach( $entry in $modelObjectKey.entrySet() )
      $util.qr($condition.put("expression", "$condition.expression AND attribute_exists(#keyCondition$velocityCount)"))
      $util.qr($condition.expressionNames.put("#keyCondition$velocityCount", "$entry.key"))
    #end
  #else
    $util.qr($condition.put("expression", "$condition.expression AND attribute_exists(#id)"))
    $util.qr($condition.expressionNames.put("#id", "id"))
  #end
#else
  #if( $modelObjectKey )
    #set( $condition = {
  "expression": "",
  "expressionNames": {},
  "expressionValues": {}
} )
    #foreach( $entry in $modelObjectKey.entrySet() )
      #if( $velocityCount == 1 )
        $util.qr($condition.put("expression", "attribute_exists(#keyCondition$velocityCount)"))
      #else
        $util.qr($condition.put("expression", "$condition.expression AND attribute_exists(#keyCondition$velocityCount)"))
      #end
      $util.qr($condition.expressionNames.put("#keyCondition$velocityCount", "$entry.key"))
    #end
  #else
    #set( $condition = {
  "expression": "attribute_exists(#id)",
  "expressionNames": {
      "#id": "id"
  },
  "expressionValues": {}
} )
  #end
#end
## Automatically set the updatedAt timestamp. **
$util.qr($context.args.input.put("updatedAt", $util.defaultIfNull($ctx.args.input.updatedAt, $util.time.nowISO8601())))
$util.qr($context.args.input.put("__typename", "Class"))
## Update condition if type is @versioned **
#if( $versionedCondition )
  $util.qr($condition.put("expression", "($condition.expression) AND $versionedCondition.expression"))
  $util.qr($condition.expressionNames.putAll($versionedCondition.expressionNames))
  $util.qr($condition.expressionValues.putAll($versionedCondition.expressionValues))
#end
#if( $context.args.condition )
  #set( $conditionFilterExpressions = $util.parseJson($util.transform.toDynamoDBConditionExpression($context.args.condition)) )
  $util.qr($condition.put("expression", "($condition.expression) AND $conditionFilterExpressions.expression"))
  $util.qr($condition.expressionNames.putAll($conditionFilterExpressions.expressionNames))
  $util.qr($condition.expressionValues.putAll($conditionFilterExpressions.expressionValues))
#end
#if( $condition.expressionValues && $condition.expressionValues.size() == 0 )
  #set( $condition = {
  "expression": $condition.expression,
  "expressionNames": $condition.expressionNames
} )
#end
#set( $expNames = {} )
#set( $expValues = {} )
#set( $expSet = {} )
#set( $expAdd = {} )
#set( $expRemove = [] )
#if( $modelObjectKey )
  #set( $keyFields = [] )
  #foreach( $entry in $modelObjectKey.entrySet() )
    $util.qr($keyFields.add("$entry.key"))
  #end
#else
  #set( $keyFields = ["id"] )
#end
#foreach( $entry in $util.map.copyAndRemoveAllKeys($context.args.input, $keyFields).entrySet() )
  #if( !$util.isNull($dynamodbNameOverrideMap) && $dynamodbNameOverrideMap.containsKey("$entry.key") )
    #set( $entryKeyAttributeName = $dynamodbNameOverrideMap.get("$entry.key") )
  #else
    #set( $entryKeyAttributeName = $entry.key )
  #end
  #if( $util.isNull($entry.value) )
    #set( $discard = $expRemove.add("#$entryKeyAttributeName") )
    $util.qr($expNames.put("#$entryKeyAttributeName", "$entry.key"))
  #else
    $util.qr($expSet.put("#$entryKeyAttributeName", ":$entryKeyAttributeName"))
    $util.qr($expNames.put("#$entryKeyAttributeName", "$entry.key"))
    ## CHANGE THIS VALUE IN THE INPUT INTO STRING SET
    #if($entry.key == "userItems")
    $util.qr($expValues.put(":$entryKeyAttributeName", $util.dynamodb.toStringSet($entry.value)))
	#else
    $util.qr($expValues.put(":$entryKeyAttributeName", $util.dynamodb.toDynamoDB($entry.value)))
    #end
  #end
#end
#set( $expression = "" )
#if( !$expSet.isEmpty() )
  #set( $expression = "SET" )
  #foreach( $entry in $expSet.entrySet() )
    #set( $expression = "$expression $entry.key = $entry.value" )
    #if( $foreach.hasNext() )
      #set( $expression = "$expression," )
    #end
  #end
#end
#if( !$expAdd.isEmpty() )
  #set( $expression = "$expression ADD" )
  #foreach( $entry in $expAdd.entrySet() )
    #set( $expression = "$expression $entry.key $entry.value" )
    #if( $foreach.hasNext() )
      #set( $expression = "$expression," )
    #end
  #end
#end
#if( !$expRemove.isEmpty() )
  #set( $expression = "$expression REMOVE" )
  #foreach( $entry in $expRemove )
    #set( $expression = "$expression $entry" )
    #if( $foreach.hasNext() )
      #set( $expression = "$expression," )
    #end
  #end
#end
#set( $update = {} )
$util.qr($update.put("expression", "$expression"))
#if( !$expNames.isEmpty() )
  $util.qr($update.put("expressionNames", $expNames))
#end
#if( !$expValues.isEmpty() )
  $util.qr($update.put("expressionValues", $expValues))
#end
{
  "version": "2018-05-29",
  "operation": "UpdateItem",
  "key": #if( $modelObjectKey ) $util.toJson($modelObjectKey) #else {
  "id": {
      "S": "$context.args.input.id"
  }
} #end,
  "update": $util.toJson($update),
  "condition": $util.toJson($condition)
}
`;
// replace create/update vtl functions
function addStringSets(out: DeploymentResources) {
  out.resolvers['Mutation.createUser.req.vtl'] = createStringSetVTL;
  out.resolvers['Mutation.updateUser.req.vtl'] = updateStringSetVTL;
  return out;
}

export default addStringSets;
