#!/usr/bin/env python3

import sys
import importlib.util
import json

# Amplify Python shim. Can be invoked from commandline with:
# python3 shim.py <lambda handler filename> <handler method name>
# Then waits for a line on stdin and expects that line to contain:
# {"event":"Lambda event serialized as JSON", "context": {...arbitrary context...}}
# The event is de-serialized into a Python dict and passed to the lambda handler along with the context dict
# The result of the handler is written to stdout so that it can be picked up by the node process that invoked the shim
def main(argv):
  # command line inputs
  handlerFile = argv[0]
  handlerName = argv[1]

  # load handler
  spec = importlib.util.spec_from_file_location("module.name", handlerFile)
  handlerModule = importlib.util.module_from_spec(spec)
  sys.modules[spec.name] = handlerModule
  spec.loader.exec_module(handlerModule)
  handler = getattr(handlerModule, handlerName)
  
  # parse lambda event from stdin
  lambdaInput = json.loads(sys.stdin.readline().rstrip())
  event = json.loads(lambdaInput["event"]) # event is already serialized by the platform so need to turn it into a dict here before invoking
  context = lambdaInput["context"]
  if not context:
    class ContextShim:
      def __init__(self):
        self.function_name = handlerName
        self.memory_limit_in_mb = 128
        self.invoked_function_arn = "UNDEFINED"
        self.aws_request_id = "UNDEFINED"
    context = ContextShim()

  
  # execute lambda and return result on stdout
  print('\n') # since we rely on the last line being the result, make sure the handler didn't already write something to the line
  print(json.dumps(handler(event, context)))

if __name__ == "__main__":
  main(sys.argv[1:])
