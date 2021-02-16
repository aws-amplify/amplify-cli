import awsgi
import os
import boto3

from uuid import uuid4
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

client = boto3.client('dynamodb')

# Change to your API Gateway base route
BASE_ROUTE = "/items"

# Change to your dynamodb table name
TABLE_NAME = "flaskamplifyitems"
ENV = os.environ.get("ENV")
TABLE = TABLE_NAME + "-" + ENV

@app.route(BASE_ROUTE + '/<item_id>', methods=['DELETE'])
def delete_item(item_id):
    client.delete_item(
        TableName=TABLE,
        Key={'id': {'S': item_id}}
    )
    return jsonify(message="item deleted")


@app.route(BASE_ROUTE + '/<item_id>', methods=['PUT'])
def update_item(item_id):
    # Change to your fields
    client.update_item(
        TableName=TABLE,
        Key={'id': {'S': item_id}},
        UpdateExpression='SET #name = :val',
        ExpressionAttributeValues={
            ':val': {'S': request.json['text']}
        },
        ExpressionAttributeNames={
            '#name': 'text'
        }
    )
    return jsonify(message="item updated")


@app.route(BASE_ROUTE + '/', methods=['POST'])
def create_item():
    request_json = request.get_json()
    # Change to your fields
    client.put_item(TableName=TABLE, Item={
        'id': { 'S': str(uuid4()) },
        'text': { 'S': request_json.get("text")}
    })
    return jsonify(message="item created")


@app.route(BASE_ROUTE + '/<item_id>', methods=['GET'])
def get_item(item_id):
    item = client.get_item(TableName=TABLE, Key={
        'id': {
            'S': item_id
        }
    })
    return jsonify(data=item)


@app.route(BASE_ROUTE + '/', methods=['GET'])
def list_items():
    return jsonify(data=client.scan(TableName=TABLE))


def handler(event, context):
    return awsgi.response(app, event, context)
