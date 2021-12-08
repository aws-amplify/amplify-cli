import base64
import json
import logging
import os
import time
import traceback
from urllib.parse import urlparse, quote

from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
from botocore.credentials import get_credentials
from botocore.endpoint import BotocoreHTTPSession
from botocore.session import Session
from boto3.dynamodb.types import TypeDeserializer


# The following parameters are required to configure the OpenSearch cluster
OPENSEARCH_ENDPOINT = os.environ['OPENSEARCH_ENDPOINT']
OPENSEARCH_REGION = os.environ['OPENSEARCH_REGION']
DEBUG = True if os.environ['DEBUG'] == "1" else False
OPENSEARCH_USE_EXTERNAL_VERSIONING = True if os.environ['OPENSEARCH_USE_EXTERNAL_VERSIONING'] == "true" else False

# Multiple mapping types in an index is deprecated. Default to doc.
DOC_TYPE = 'doc'
OPENSEARCH_MAX_RETRIES = 3 # Max number of retries for exponential backoff

logger = logging.getLogger()
logger.setLevel(logging.DEBUG if DEBUG else logging.INFO)
logger.info("Streaming to OpenSearch")

# custom encoder changes
# - sets to lists
class DDBTypesEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, set):
            return list(obj)
        return json.JSONEncoder.default(self, obj)

# Subclass of boto's TypeDeserializer for DynamoDB to adjust for DynamoDB Stream format.
class StreamTypeDeserializer(TypeDeserializer):
    def _deserialize_n(self, value):
        val = float(value)
        if (val.is_integer()):
            return int(value)
        else:
            return val

    def _deserialize_b(self, value):
        return value  # Already in Base64


class Searchable_Exception(Exception):
    '''Capture status_code from request'''
    status_code = 0
    payload = ''

    def __init__(self, status_code, payload):
        self.status_code = status_code
        self.payload = payload
        Exception.__init__(
            self, 'Searchable_Exception: status_code={}, payload={}'.format(status_code, payload))


# Low-level POST data to Amazon OpenSearch Service generating a Sigv4 signed request
def post_data_to_opensearch(payload, region, creds, host, path, method='POST', proto='https://'):
    '''Post data to OpenSearch endpoint with SigV4 signed http headers'''
    req = AWSRequest(method=method, url=proto + host +
                    quote(path), data=payload, headers={'Host': host, 'Content-Type': 'application/json'})
    # SigV4Auth may be expecting 'es' but need to swap with 'os' or 'OpenSearch'
    SigV4Auth(creds, 'es', region).add_auth(req)
    http_session = BotocoreHTTPSession()
    res = http_session.send(req.prepare())
    if res.status_code >= 200 and res.status_code <= 299:
        return res._content
    else:
        raise Searchable_Exception(res.status_code, res._content)


# High-level POST data to Amazon OpenSearch Service with exponential backoff
# according to suggested algorithm: http://docs.aws.amazon.com/general/latest/gr/api-retries.html
def post_to_opensearch(payload):
    '''Post data to OpenSearch cluster with exponential backoff'''

    # Get aws_region and credentials to post signed URL to OpenSearch
    opensearch_region = OPENSEARCH_REGION or os.environ['AWS_REGION']
    session = Session({'region': opensearch_region})
    creds = get_credentials(session)
    opensearch_url = urlparse(OPENSEARCH_ENDPOINT)
    # Extract the domain name in OPENSEARCH_ENDPOINT
    opensearch_endpoint = opensearch_url.netloc or opensearch_url.path

    # Post data with exponential backoff
    retries = 0
    while retries < OPENSEARCH_MAX_RETRIES:
        if retries > 0:
            seconds = (2 ** retries) * .1
            logger.debug('Waiting for %.1f seconds', seconds)
            time.sleep(seconds)

        try:
            opensearch_ret_str = post_data_to_opensearch(
                payload, opensearch_region, creds, opensearch_endpoint, '/_bulk')
            logger.debug('Return from OpenSearch: %s', opensearch_ret_str)
            opensearch_ret = json.loads(opensearch_ret_str)

            if opensearch_ret['errors']:
                logger.error(
                    'OpenSearch post unsuccessful, errors present, took=%sms', opensearch_ret['took'])
                # Filter errors
                opensearch_errors = [item for item in opensearch_ret['items']
                            if item.get('index', {}).get('error')]
                logger.error('List of items with errors: %s',
                            json.dumps(opensearch_errors))
            else:
                logger.info('OpenSearch post successful, took=%sms', opensearch_ret['took'])
            break  # Sending to OpenSearch was ok, break retry loop
        except Searchable_Exception as e:
            if (e.status_code >= 500) and (e.status_code <= 599):
                retries += 1  # Candidate for retry
            else:
                raise  # Stop retrying, re-raise exception


# Extracts the DynamoDB table from an ARN
# ex: arn:aws:dynamodb:eu-west-1:123456789012:table/table-name/stream/2015-11-13T09:23:17.104 should return 'table-name'
def get_table_name_from_arn(arn):
    return arn.split(':')[5].split('/')[1]


# Compute a compound doc index from the key(s) of the object in lexicographic order: "k1=key_val1|k2=key_val2"
def compute_doc_index(keys_raw, deserializer, formatIndex=False):
    index = []
    for key in sorted(keys_raw):
        if formatIndex:
            index.append('{}={}'.format(
                key, deserializer.deserialize(keys_raw[key])))
        else:
            index.append(deserializer.deserialize(keys_raw[key]))
    return '|'.join(map(str,index))

def _lambda_handler(event, context):
    logger.debug('Event: %s', event)
    records = event['Records']

    ddb_deserializer = StreamTypeDeserializer()
    opensearch_actions = []  # Items to be added/updated/removed from OpenSearch - for bulk API
    cnt_insert = cnt_modify = cnt_remove = 0

    for record in records:
        # Handle both native DynamoDB Streams or Streams data from Kinesis (for manual replay)
        logger.debug('Record: %s', record)
        if record.get('eventSource') == 'aws:dynamodb':
            ddb = record['dynamodb']
            ddb_table_name = get_table_name_from_arn(record['eventSourceARN'])
            doc_seq = ddb['SequenceNumber']
        elif record.get('eventSource') == 'aws:kinesis':
            ddb = json.loads(base64.b64decode(record['kinesis']['data']))
            ddb_table_name = ddb['SourceTable']
            doc_seq = record['kinesis']['sequenceNumber']
        else:
            logger.error('Ignoring non-DynamoDB event sources: %s',
                        record.get('eventSource'))
            continue

        # Compute DynamoDB table, type and index for item
        doc_table = ddb_table_name.lower()
        doc_type = DOC_TYPE
        doc_table_parts = doc_table.split('-')
        doc_opensearch_index_name = doc_table_parts[0] if len(doc_table_parts) > 0  else doc_table

        # Dispatch according to event TYPE
        event_name = record['eventName'].upper()  # INSERT, MODIFY, REMOVE
        logger.debug('doc_table=%s, event_name=%s, seq=%s',
                    doc_table, event_name, doc_seq)

        # Treat events from a Kinesis stream as INSERTs
        if event_name == 'AWS:KINESIS:RECORD':
            event_name = 'INSERT'

        is_ddb_insert_or_update = (event_name == 'INSERT') or (event_name == 'MODIFY')
        is_ddb_delete = event_name == 'REMOVE'
        image_name = 'NewImage' if is_ddb_insert_or_update else 'OldImage'

        if image_name not in ddb:
            logger.warning(
                'Cannot process stream if it does not contain ' + image_name)
            continue
        logger.debug(image_name + ': %s', ddb[image_name])
        # Deserialize DynamoDB type to Python types
        doc_fields = ddb_deserializer.deserialize({'M': ddb[image_name]})
        
        # Sync enabled APIs do soft delete. We need to delete the record in OpenSearch if _deleted field is set
        if OPENSEARCH_USE_EXTERNAL_VERSIONING and event_name == 'MODIFY' and '_deleted' in  doc_fields and doc_fields['_deleted']:
            is_ddb_insert_or_update = False
            is_ddb_delete = True
            
         # Update counters
        if event_name == 'INSERT':
            cnt_insert += 1
        elif event_name == 'MODIFY':
            cnt_modify += 1
        elif event_name == 'REMOVE':
            cnt_remove += 1
        else:
            logger.warning('Unsupported event_name: %s', event_name)

        logger.debug('Deserialized doc_fields: %s', doc_fields)

        if ('Keys' in ddb):
            doc_id = compute_doc_index(ddb['Keys'], ddb_deserializer)
        else:
            logger.error('Cannot find keys in ddb record')

        # If DynamoDB INSERT or MODIFY, send 'index' to OpenSearch
        if is_ddb_insert_or_update:
            # Generate OpenSearch payload for item
            action = {'index': {'_index': doc_opensearch_index_name,
                                '_type': doc_type,
                                '_id': doc_id}}
            # Add external versioning if necessary
            if OPENSEARCH_USE_EXTERNAL_VERSIONING and '_version' in doc_fields:
                action['index'].update([
                    ('version_type', 'external'),
                    ('version', doc_fields['_version'])
                ])
                doc_fields.pop('_ttl', None)
                doc_fields.pop('_version', None)
            # Append OpenSearch Action line with 'index' directive
            opensearch_actions.append(json.dumps(action))
            # Append JSON payload
            opensearch_actions.append(json.dumps(doc_fields, cls=DDBTypesEncoder))
            # migration step remove old key if it exists
            if ('id' in doc_fields) and (event_name == 'MODIFY') :
                action = {'delete': {'_index': doc_opensearch_index_name, '_type': doc_type,
                    '_id': compute_doc_index(ddb['Keys'], ddb_deserializer, True)}}
                opensearch_actions.append(json.dumps(action))
        # If DynamoDB REMOVE, send 'delete' to OpenSearch
        elif is_ddb_delete:
            action = {'delete': {'_index': doc_opensearch_index_name,
                                '_type': doc_type, '_id': doc_id}}
            if OPENSEARCH_USE_EXTERNAL_VERSIONING and '_version' in doc_fields:
                action['delete'].update([
                    ('version_type', 'external'),
                    ('version', doc_fields['_version'])
                ])
            # Action line with 'delete' directive
            opensearch_actions.append(json.dumps(action))

    # Prepare bulk payload
    opensearch_actions.append('')  # Add one empty line to force final \n
    opensearch_payload = '\n'.join(opensearch_actions)
    logger.info('Posting to OpenSearch: inserts=%s updates=%s deletes=%s, total_lines=%s, bytes_total=%s',
                cnt_insert, cnt_modify, cnt_remove, len(opensearch_actions) - 1, len(opensearch_payload))
    post_to_opensearch(opensearch_payload)  # Post to OpenSearch with exponential backoff


# Global lambda handler - catches all exceptions to avoid dead letter in the DynamoDB Stream
def lambda_handler(event, context):
    try:
        return _lambda_handler(event, context)
    except Exception:
        logger.error(traceback.format_exc())
