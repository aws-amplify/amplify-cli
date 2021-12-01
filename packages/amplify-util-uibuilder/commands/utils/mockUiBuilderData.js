// This file provides mocks for manual testing
const mockUiBuilderComponents = {
  entities: [
    {
      appId: 'd2o18y21obnmoz',
      bindingProperties: {},
      children: [
        {
          children: [],
          componentType: 'Box',
          properties: {
            width: {
              value: '133px',
            },
            padding: {
              value: '0px 0px 0px 0px',
            },
            backgroundColor: {
              value: 'rgb(255,255,255)',
            },
            height: {
              value: '55px',
            },
          },
        },
      ],
      componentType: 'Box',
      environmentName: 'staging',
      id: 'c-65Dz5ryFZKFnfNj8Si',
      name: 'Frame1',
      overrides: {},
      properties: {
        width: {
          value: '291px',
        },
        padding: {
          value: '0px 0px 0px 0px',
        },
        backgroundColor: {
          value: 'rgb(255,255,0)',
        },
        height: {
          value: '158px',
        },
      },
      variants: [],
    },
  ],
  nextToken: '',
};

const mockUiBuilderThemes = {
  entities: [
    {
      id: '1234-5678-9010',
      name: 'MyTheme',
      values: [
        {
          key: 'tokens',
          value: {
            children: [
              {
                key: 'colors',
                value: {
                  children: [
                    {
                      key: 'font',
                      value: {
                        children: [
                          {
                            key: 'primary',
                            value: {
                              children: [
                                {
                                  key: 'value',
                                  value: {
                                    value: '#008080',
                                  },
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
      overrides: [
        {
          key: 'colorMode',
          value: {
            value: 'dark',
          },
        },
        {
          key: 'tokens',
          value: {
            children: [
              {
                key: 'colors',
                value: {
                  children: [
                    {
                      key: 'black',
                      value: {
                        children: [
                          {
                            key: 'value',
                            value: {
                              value: '#fff',
                            },
                          },
                        ],
                      },
                    },
                    {
                      key: 'white',
                      value: {
                        children: [
                          {
                            key: 'value',
                            value: {
                              value: '#000',
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  ],
  nextToken: '',
};

module.exports = {
  mockUiBuilderComponents,
  mockUiBuilderThemes,
};
