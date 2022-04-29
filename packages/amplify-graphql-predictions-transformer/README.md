# GraphQL @predictions Transformer

# Reference Documentation

### @predictions

The `@predictions` directive allows you to query an orchestration of AI/ML services such as Amazon Rekognition, Amazon Translate, and/or Amazon Polly.

#### Definition

```graphql
directive @predictions(actions: [PredictionsActions!]!) on FIELD_DEFINITION
enum PredictionsActions {
  identifyText # uses Amazon Rekognition to detect text
  identifyLabels # uses Amazon Rekognition to detect labels
  convertTextToSpeech # uses Amazon Polly in a lambda to output a presigned url to synthesized speech
  translateText # uses Amazon Translate to translate text from source to target language
}
```
