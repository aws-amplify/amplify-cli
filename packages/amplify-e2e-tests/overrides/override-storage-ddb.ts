export function overrideProps(props: any) {
  props.dynamoDBTable.streamSpecification = {
    streamViewType: 'NEW_AND_OLD_IMAGES',
  };
  return props;
}
