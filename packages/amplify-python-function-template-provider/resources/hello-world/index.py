def handler(event, context):
  print('received event:')
  print(event)
  return {
    'message': 'Hello from your new Amplify Python lambda!'
  }
