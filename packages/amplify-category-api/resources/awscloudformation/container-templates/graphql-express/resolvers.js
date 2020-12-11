const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.STORAGE_POSTS_NAME;

const addPostToDDB = async ({ id, title, author, description, topic }) => {
    var params = {
        Item: {
            id: id,
            title: title,
            author: author,
            description: description,
            topic: topic
        },
        TableName: TableName
    }
    try {
        const data = await docClient.put(params).promise()
        return params.Item;
    } catch (err) {
        return err
    }
}

const scanPostsFromDDB = async () => {
    var params = {
        TableName: TableName,
    }

    try {
        const data = await docClient.scan(params).promise();
        return data.Items;
    } catch (err) {
        console.log(err);
        return err;
    }
}

const getPostFromDDB = async (id) => {
    var params = {
        TableName: TableName,
        Key: id,
    }
    try {
        const data = await docClient.get(params).promise()
        return data.Item;
    } catch (err) {
        return err
    }
}

var root = {
    getPost: getPostFromDDB,
    posts: scanPostsFromDDB,
    addPost: addPostToDDB
};

module.exports = root;
