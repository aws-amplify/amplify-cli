from titlecase import titlecase
def handler(event, context):
  print('received event:')  
  return {
      'statusCode': 200,
      'body': titlecase('hello from lambda!'),
  }