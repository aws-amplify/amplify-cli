from testfunc import testString
def handler(event, context):
  print('received event:', event)
  return {
    'message': testString
  }
