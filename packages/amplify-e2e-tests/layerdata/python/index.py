from testfunc import testString
def handler(event, context):
  print('received event:')
  print(event)
  return {
    'message': testString
  }
