import { CreateComponentData } from '@aws-sdk/client-amplifyuibuilder';

// MyIcon used from AmplifyUIKit
// Source: https://www.figma.com/community/file/1047600760128127424

export const myIconComponent: CreateComponentData = {
  name: 'MyIcon',
  componentType: 'Icon',
  schemaVersion: '1.0',
  sourceId: '2976:7004',
  overrides: {},
  bindingProperties: {},
  properties: {
    width: {
      value: '24px',
    },
    height: {
      value: '24px',
    },
    overflow: {
      value: 'hidden',
    },
    position: {
      value: 'relative',
    },
    padding: {
      value: '0px 0px 0px 0px',
    },
    viewBox: {
      type: 'object',
      value: '{"minX":0,"minY":0,"width":24,"height":24}',
    },
    paths: {
      type: 'object',
      value:
        '[{"d":"M0 19L22 19L11 0L0 19ZM12 16L10 16L10 14L12 14L12 16ZM12 12L10 12L10 8L12 8L12 12Z","fill":"rgba(13,26,38,1)","fillRule":"nonzero","style":{"transform":"translate(4.17%, 12.5%)"}}]',
    },
  },
  variants: [
    {
      overrides: {
        MyIcon: {},
      },
      variantValues: {
        type: 'warning',
      },
    },
    {
      overrides: {
        MyIcon: {
          paths:
            '[{"d":"M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15L9 15L9 13L11 13L11 15ZM11 11L9 11L9 5L11 5L11 11Z","fill":"rgba(13,26,38,1)","fillRule":"nonzero","style":{"transform":"translate(8.33%, 8.33%)"}}]',
        },
      },
      variantValues: {
        type: 'alert',
      },
    },
    {
      overrides: {
        MyIcon: {
          paths:
            '[{"d":"M9 5L11 5L11 7L9 7L9 5ZM9 9L11 9L11 15L9 15L9 9ZM10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM10 18C5.59 18 2 14.41 2 10C2 5.59 5.59 2 10 2C14.41 2 18 5.59 18 10C18 14.41 14.41 18 10 18Z","fill":"rgba(13,26,38,1)","fillRule":"nonzero","style":{"transform":"translate(8.33%, 8.33%)"}}]',
        },
      },
      variantValues: {
        type: 'info',
      },
    },
    {
      overrides: {
        MyIcon: {
          paths:
            '[{"d":"M2 2L18 2L18 14L3.17 14L2 15.17L2 2ZM2 0C0.9 0 0.00999999 0.9 0.00999999 2L0 20L4 16L18 16C19.1 16 20 15.1 20 14L20 2C20 0.9 19.1 0 18 0L2 0ZM4 10L12 10L12 12L4 12L4 10ZM4 7L16 7L16 9L4 9L4 7ZM4 4L16 4L16 6L4 6L4 4Z","fill":"rgba(13,26,38,1)","fillRule":"nonzero","style":{"transform":"translate(8.33%, 8.33%)"}}]',
        },
      },
      variantValues: {
        type: 'chat',
      },
    },
    {
      overrides: {
        MyIcon: {
          paths:
            '[{"d":"M5.59 10.58L1.42 6.41L0 7.82L5.59 13.41L17.59 1.41L16.18 0L5.59 10.58Z","fill":"rgba(13,26,38,1)","fillRule":"nonzero","style":{"transform":"translate(14.21%, 23.29%)"}}]',
        },
      },
      variantValues: {
        type: 'checkmark',
      },
    },
    {
      overrides: {
        MyIcon: {
          paths:
            '[{"d":"M14.5 0C12.76 0 11.09 0.81 10 2.09C8.91 0.81 7.24 0 5.5 0C2.42 0 0 2.42 0 5.5C0 9.28 3.4 12.36 8.55 17.04L10 18.35L11.45 17.03C16.6 12.36 20 9.28 20 5.5C20 2.42 17.58 0 14.5 0ZM10.1 15.55L10 15.65L9.9 15.55C5.14 11.24 2 8.39 2 5.5C2 3.5 3.5 2 5.5 2C7.04 2 8.54 2.99 9.07 4.36L10.94 4.36C11.46 2.99 12.96 2 14.5 2C16.5 2 18 3.5 18 5.5C18 8.39 14.86 11.24 10.1 15.55Z","fill":"rgba(13,26,38,1)","fillRule":"nonzero","style":{"transform":"translate(8.33%, 14.58%)"}}]',
        },
      },
      variantValues: {
        type: 'favorite_border',
      },
    },
    {
      overrides: {
        MyIcon: {
          paths:
            '[{"d":"M2 4C3.1 4 4 3.1 4 2C4 0.9 3.1 0 2 0C0.9 0 0 0.9 0 2C0 3.1 0.9 4 2 4ZM2 6C0.9 6 0 6.9 0 8C0 9.1 0.9 10 2 10C3.1 10 4 9.1 4 8C4 6.9 3.1 6 2 6ZM2 12C0.9 12 0 12.9 0 14C0 15.1 0.9 16 2 16C3.1 16 4 15.1 4 14C4 12.9 3.1 12 2 12Z","fill":"rgba(13,26,38,1)","fillRule":"nonzero","style":{"transform":"translate(41.67%, 18.75%)"}}]',
        },
      },
      variantValues: {
        type: 'more_vert',
      },
    },
    {
      overrides: {
        MyIcon: {
          paths:
            '[{"d":"M12 0L2 0C0.9 0 0 0.9 0 2L0 18L7 15L14 18L14 2C14 0.9 13.1 0 12 0ZM12 15L7 12.82L2 15L2 2L12 2L12 15Z","fill":"rgba(13,26,38,1)","fillRule":"nonzero","style":{"transform":"translate(20.83%, 12.5%)"}}]',
        },
      },
      variantValues: {
        type: 'bookmark_border',
      },
    },
    {
      overrides: {
        MyIcon: {
          paths:
            '[{"d":"M15 14.08C14.24 14.08 13.56 14.38 13.04 14.85L5.91 10.7C5.96 10.47 6 10.24 6 10C6 9.76 5.96 9.53 5.91 9.3L12.96 5.19C13.5 5.69 14.21 6 15 6C16.66 6 18 4.66 18 3C18 1.34 16.66 0 15 0C13.34 0 12 1.34 12 3C12 3.24 12.04 3.47 12.09 3.7L5.04 7.81C4.5 7.31 3.79 7 3 7C1.34 7 0 8.34 0 10C0 11.66 1.34 13 3 13C3.79 13 4.5 12.69 5.04 12.19L12.16 16.35C12.11 16.56 12.08 16.78 12.08 17C12.08 18.61 13.39 19.92 15 19.92C16.61 19.92 17.92 18.61 17.92 17C17.92 15.39 16.61 14.08 15 14.08ZM15 2C15.55 2 16 2.45 16 3C16 3.55 15.55 4 15 4C14.45 4 14 3.55 14 3C14 2.45 14.45 2 15 2ZM3 11C2.45 11 2 10.55 2 10C2 9.45 2.45 9 3 9C3.55 9 4 9.45 4 10C4 10.55 3.55 11 3 11ZM15 18.02C14.45 18.02 14 17.57 14 17.02C14 16.47 14.45 16.02 15 16.02C15.55 16.02 16 16.47 16 17.02C16 17.57 15.55 18.02 15 18.02Z","fill":"rgba(13,26,38,1)","fillRule":"nonzero","style":{"transform":"translate(12.5%, 8.33%)"}}]',
        },
      },
      variantValues: {
        type: 'share',
      },
    },
    {
      overrides: {
        MyIcon: {
          paths:
            '[{"d":"M8 0L6.59 1.41L12.17 7L0 7L0 9L12.17 9L6.59 14.59L8 16L16 8L8 0Z","fill":"rgba(13,26,38,1)","fillRule":"nonzero","style":{"transform":"translate(16.67%, 16.67%)"}}]',
        },
      },
      variantValues: {
        type: 'arrow-right',
      },
    },
    {
      overrides: {
        MyIcon: {
          paths:
            '[{"d":"M7 4L7 0L0 7L7 14L7 9.9C12 9.9 15.5 11.5 18 15C17 10 14 5 7 4Z","fill":"rgba(13,26,38,1)","fillRule":"nonzero","style":{"transform":"translate(12.5%, 20.83%)"}}]',
        },
      },
      variantValues: {
        type: 'reply',
      },
    },
    {
      overrides: {
        MyIcon: {
          paths:
            '[{"d":"M18 0L2 0C0.9 0 0 0.9 0 2L0 20L4 16L18 16C19.1 16 20 15.1 20 14L20 2C20 0.9 19.1 0 18 0ZM18 14L4 14L2 16L2 2L18 2L18 14Z","fill":"rgba(13,26,38,1)","fillRule":"nonzero","style":{"transform":"translate(8.33%, 8.33%)"}}]',
        },
      },
      variantValues: {
        type: 'chat-bubble-outline',
      },
    },
    {
      overrides: {
        MyIcon: {
          paths:
            '[{"d":"M2.01 3.03L9.52 6.25L2 5.25L2.01 3.03L2.01 3.03ZM9.51 11.75L2 14.97L2 12.75L9.51 11.75L9.51 11.75ZM0.00999999 0L0 7L15 9L0 11L0.00999999 18L21 9L0.00999999 0Z","fill":"rgba(13,26,38,1)","fillRule":"nonzero","style":{"transform":"translate(8.33%, 12.5%)"}}]',
        },
      },
      variantValues: {
        type: 'send',
      },
    },
    {
      overrides: {
        MyIcon: {
          paths:
            '[{"d":"M10 18.35L8.55 17.03C3.4 12.36 0 9.28 0 5.5C0 2.42 2.42 0 5.5 0C7.24 0 8.91 0.81 10 2.09C11.09 0.81 12.76 0 14.5 0C17.58 0 20 2.42 20 5.5C20 9.28 16.6 12.36 11.45 17.04L10 18.35Z","fill":"rgba(13,26,38,1)","fillRule":"nonzero","style":{"transform":"translate(8.33%, 12.5%)"}}]',
        },
      },
      variantValues: {
        type: 'favorite',
      },
    },
    {
      overrides: {
        MyIcon: {
          paths:
            '[{"d":"M6.59 5.17L1.41 0L0 1.41L5.17 6.58L6.59 5.17ZM10.5 0L12.54 2.04L0 14.59L1.41 16L13.96 3.46L16 5.5L16 0L10.5 0ZM10.83 9.41L9.42 10.82L12.55 13.95L10.5 16L16 16L16 10.5L13.96 12.54L10.83 9.41L10.83 9.41Z","fill":"rgba(13,26,38,1)","fillRule":"nonzero","style":{"transform":"translate(16.67%, 16.67%)"}}]',
        },
      },
      variantValues: {
        type: 'shuffle',
      },
    },
    {
      overrides: {
        MyIcon: {
          paths:
            '[{"d":"M2 0C0.9 0 0 0.9 0 2C0 3.1 0.9 4 2 4C3.1 4 4 3.1 4 2C4 0.9 3.1 0 2 0ZM14 0C12.9 0 12 0.9 12 2C12 3.1 12.9 4 14 4C15.1 4 16 3.1 16 2C16 0.9 15.1 0 14 0ZM8 0C6.9 0 6 0.9 6 2C6 3.1 6.9 4 8 4C9.1 4 10 3.1 10 2C10 0.9 9.1 0 8 0Z","fill":"rgba(13,26,38,1)","fillRule":"nonzero","style":{"transform":"translate(16.67%, 41.67%)"}}]',
        },
      },
      variantValues: {
        type: 'more_horiz',
      },
    },
    {
      overrides: {
        MyIcon: {
          paths:
            '[{"d":"M7 8.75C4.66 8.75 0 9.92 0 12.25L0 14L14 14L14 12.25C14 9.92 9.34 8.75 7 8.75ZM2.34 12C3.18 11.42 5.21 10.75 7 10.75C8.79 10.75 10.82 11.42 11.66 12L2.34 12ZM7 7C8.93 7 10.5 5.43 10.5 3.5C10.5 1.57 8.93 0 7 0C5.07 0 3.5 1.57 3.5 3.5C3.5 5.43 5.07 7 7 7ZM7 2C7.83 2 8.5 2.67 8.5 3.5C8.5 4.33 7.83 5 7 5C6.17 5 5.5 4.33 5.5 3.5C5.5 2.67 6.17 2 7 2ZM14.04 8.81C15.2 9.65 16 10.77 16 12.25L16 14L20 14L20 12.25C20 10.23 16.5 9.08 14.04 8.81L14.04 8.81ZM13 7C14.93 7 16.5 5.43 16.5 3.5C16.5 1.57 14.93 0 13 0C12.46 0 11.96 0.13 11.5 0.35C12.13 1.24 12.5 2.33 12.5 3.5C12.5 4.67 12.13 5.76 11.5 6.65C11.96 6.87 12.46 7 13 7Z","fill":"rgba(13,26,38,1)","fillRule":"nonzero","style":{"transform":"translate(8.33%, 20.83%)"}}]',
        },
      },
      variantValues: {
        type: 'group',
      },
    },
    {
      overrides: {
        MyIcon: {
          paths:
            '[{"d":"M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z","fill":"rgba(13,26,38,1)","fillRule":"nonzero","style":{"transform":"translate(20.83%, 20.83%)"}}]',
        },
      },
      variantValues: {
        type: 'close',
      },
    },
    {
      overrides: {
        MyIcon: {
          paths:
            '[{"d":"M14 4L12 4C12 1.79 10.21 0 8 0C5.79 0 4 1.79 4 4L2 4C0.9 4 0 4.9 0 6L0 18C0 19.1 0.9 20 2 20L14 20C15.1 20 16 19.1 16 18L16 6C16 4.9 15.1 4 14 4ZM8 2C9.1 2 10 2.9 10 4L6 4C6 2.9 6.9 2 8 2ZM14 18L2 18L2 6L4 6L4 8C4 8.55 4.45 9 5 9C5.55 9 6 8.55 6 8L6 6L10 6L10 8C10 8.55 10.45 9 11 9C11.55 9 12 8.55 12 8L12 6L14 6L14 18Z","fill":"rgba(13,26,38,1)","fillRule":"nonzero","style":{"transform":"translate(16.67%, 8.33%)"}}]',
        },
      },
      variantValues: {
        type: 'shopping_bag',
      },
    },
    {
      overrides: {
        MyIcon: {
          paths:
            '[{"d":"M11 6L11 16L3 16L3 6L11 6ZM9.5 0L4.5 0L3.5 1L0 1L0 3L14 3L14 1L10.5 1L9.5 0ZM13 4L1 4L1 16C1 17.1 1.9 18 3 18L11 18C12.1 18 13 17.1 13 16L13 4Z","fill":"rgba(13,26,38,1)","fillRule":"nonzero","style":{"transform":"translate(20.83%, 12.5%)"}}]',
        },
      },
      variantValues: {
        type: 'delete',
      },
    },
  ],
  children: [],
};
