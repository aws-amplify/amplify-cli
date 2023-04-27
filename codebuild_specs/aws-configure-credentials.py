import os

AWS_ACCESS_KEY_ID = os.environ['AWS_ACCESS_KEY_ID']
AWS_SECRET_ACCESS_KEY = os.environ['AWS_SECRET_ACCESS_KEY']
AWS_SESSION_TOKEN = os.environ['AWS_SESSION_TOKEN']

credentials_file_contents = '''[default]
aws_access_key_id={AWS_ACCESS_KEY_ID}
aws_secret_access_key={AWS_SECRET_ACCESS_KEY}
aws_session_token={AWS_SESSION_TOKEN}

'''

config_file_contents = '''[default]
region=us-west-2

'''

with open('/root/.aws/credentials', 'w') as f:
  f.write(credentials_file_contents)

with open('/root/.aws/config', 'w') as f:
  f.write(config_file_contents)
