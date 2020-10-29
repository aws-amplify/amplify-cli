// This is sample code. Please update this to suite your schema

exports.handler = async (event, context, callback) => {
  console.log('Received event {}', JSON.stringify(event, 3));
  let action, item;
  switch (event.resolver.field) {
    case 'updatePost':
      if (event.existingItem.postId === '1') {
        action = 'RESOLVE';
        item = event.newItem;
      } else {
        action = 'REJECT';
      }
      break;
    case 'deletePost':
      if (event.existingItem.postId === '1') {
        action = 'REMOVE';
      } else {
        action = 'REJECT';
      }
      break;
    case 'addPost':
      if (event.existingItem.postId === '1') {
        action = 'RESOLVE';
        item = event.newItem;
      } else {
        action = 'REJECT';
      }
      break;
    default:
      throw new Error('Unknown Resolver');
  }
  return {
    action,
    item,
  };
};
