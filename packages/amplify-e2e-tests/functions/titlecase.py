from titlecase import titlecase
import json

def handler(event, context):
  f = open('/opt/data.txt', 'r')
  optContent = f.read()

  return {
    'statusCode': 200,
    'body': json.dumps(titlecase('{{testString}} ') + optContent)
  }
