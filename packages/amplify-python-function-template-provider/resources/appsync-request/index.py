import json
import requests
import os
import boto3
from requests_aws4auth import AWS4Auth

def handler(event, context):
  APPSYNC_API_ENDPOINT_URL = ""
  
  for key, value in os.environ.items():
    if "GRAPHQLAPIENDPOINTOUTPUT" in key:
      APPSYNC_API_ENDPOINT_URL = value
  
  session = requests.Session()
  credentials = boto3.session.Session().get_credentials()
  
  session.auth = AWS4Auth(
    credentials.access_key,
    credentials.secret_key,
    boto3.session.Session().region_name,
    'appsync',
    session_token=credentials.token
    )
    
  query = """
    query MyQuery {
      listTodos {
        items {
          id
          description
          name
        }
      }
    }
    """
    
  response = session.request(
    url=APPSYNC_API_ENDPOINT_URL,
    method='POST',
    json={'query': query}
    )
  
  return {
      'statusCode': 200,
      'headers': {
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
      },
      'body': json.dumps(response.json())
  }