import json
import logging
import argparse
import boto3
import boto3.dynamodb.table
from boto3 import Session

logging.basicConfig()
client = boto3.client('lambda', region_name='us-east-1')
reports = []
object_amount = 0
partSize = 0

def main():
  global client
  parser = argparse.ArgumentParser(description='Set-up importing to dynamodb')
  parser.add_argument('--rn', metavar='R', help='AWS region', required=True)
  parser.add_argument('--tn', metavar='T', help='table name', required=True)
  parser.add_argument('--lf', metavar='LF', help='lambda function that posts data to es', required=True)
  parser.add_argument('--esarn', metavar='ESARN', help='event source ARN', required=True)
  parser.add_argument('--ak', metavar='AK', help='aws access key')
  parser.add_argument('--sk', metavar='AS', help='aws secret key')
  parser.add_argument('--st', metavar='AT', help='aws session token')
  args = parser.parse_args()
  scan_limit = 300

  if (args.ak is None or args.sk is None):
    credentials = boto3.Session().get_credentials()
    args.sk = args.sk or credentials.secret_key
    args.ak = args.ak or credentials.access_key
    args.st = args.st or credentials.token

  session = Session(
    aws_access_key_id=args.ak,
    aws_secret_access_key=args.sk,
    aws_session_token=args.st,
    region_name=args.rn,
  )
  client = session.client('lambda', region_name=args.rn)
  import_dynamodb_items_to_es(args.tn, args.sk, args.ak, args.st, args.rn, args.esarn, args.lf, scan_limit)

def import_dynamodb_items_to_es(table_name, aws_secret, aws_access, aws_token, aws_region, event_source_arn, lambda_f, scan_limit):
  global reports
  global partSize
  global object_amount

  logger = logging.getLogger()
  logger.setLevel(logging.INFO)
  session = Session(aws_access_key_id=aws_access, aws_secret_access_key=aws_secret, aws_session_token=aws_token, region_name=aws_region)
  dynamodb = session.resource('dynamodb')
  logger.info('dynamodb: %s', dynamodb)
  ddb_table_name = table_name
  table = dynamodb.Table(ddb_table_name)
  logger.info('table: %s', table)
  ddb_keys_name = [a['AttributeName'] for a in table.key_schema]
  logger.info('ddb_keys_name: %s', ddb_keys_name)
  response = None

  while True:
      if not response:
        response = table.scan(Limit=scan_limit)
      else:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'], Limit=scan_limit)
      for i in response["Items"]:
        ddb_keys = {k: i[k] for k in i if k in ddb_keys_name}
        ddb_data = boto3.dynamodb.types.TypeSerializer().serialize(i)["M"]
        ddb_keys = boto3.dynamodb.types.TypeSerializer().serialize(ddb_keys)["M"]
        record = {
          "dynamodb": {"SequenceNumber": "0000", "Keys": ddb_keys, "NewImage": ddb_data},
          "awsRegion": aws_region,
          "eventName": "MODIFY",
          "eventSourceARN": event_source_arn,
          "eventSource": "aws:dynamodb"
        }
        partSize += 1
        object_amount += 1
        logger.info(object_amount)
        reports.append(record)
        if partSize >= 100:
          send_to_eslambda(reports, lambda_f)
      if 'LastEvaluatedKey' not in response:
        break
  if partSize > 0:
    send_to_eslambda(reports, lambda_f)

def send_to_eslambda(items, lambda_f):
  global reports
  global partSize
  records_data = {
      "Records": items
  }
  records = json.dumps(records_data)
  lambda_response = client.invoke(
      FunctionName=lambda_f,
      Payload=records
  )
  reports = []
  partSize = 0
  print(lambda_response)

if __name__ == "__main__":
    main()
