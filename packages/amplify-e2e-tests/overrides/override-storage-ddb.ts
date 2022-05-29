export function override(props: any) {
  props.dynamoDBTable.streamSpecification = {
    streamViewType: 'NEW_AND_OLD_IMAGES',
  };
}
