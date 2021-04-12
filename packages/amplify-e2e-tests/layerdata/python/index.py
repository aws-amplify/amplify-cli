import string
def handler(event, context):
  print('received event:', event)
  return {
    'message': string.ascii_lowercase
  }
