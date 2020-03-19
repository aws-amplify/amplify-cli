import json

def handler(event, context):
  return {
    'message': 'received event: ' + json.dumps(event)
  }
