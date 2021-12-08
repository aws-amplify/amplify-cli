import { getAppId, amplifyPull, createNewProjectDir, deleteProject, deleteProjectDir, initJSProjectWithProfile } from 'amplify-e2e-core';
import { getNpxPath } from 'amplify-e2e-core';
import { spawnSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import aws from 'aws-sdk';

describe('amplify pull with uibuilder', () => {
  let projRoot: string;
  let projRoot2: string;
  let projectName: string;
  let appId: string;
  let envName = 'integtest';
  let mockComponent = {
    bindingProperties: {},
    children: [
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    children: [],
                    componentType: 'Text',
                    name: 'Info',
                    properties: {
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      color: {
                        value: 'rgba(0,0,0,1)',
                      },
                      textAlign: {
                        value: 'left',
                      },
                      shrink: {
                        value: '0',
                      },
                      display: {
                        value: 'flex',
                      },
                      label: {
                        value: 'Info',
                      },
                      justifyContent: {
                        value: 'flex-start',
                      },
                      fontFamily: {
                        value: 'Inter',
                      },
                      fontSize: {
                        value: '16px',
                      },
                      lineHeight: {
                        value: '24px',
                      },
                      position: {
                        value: 'relative',
                      },
                      fontWeight: {
                        value: '700',
                      },
                      direction: {
                        value: 'column',
                      },
                    },
                  },
                  {
                    children: [],
                    componentType: 'TextField',
                    name: 'TextFieldqbn',
                    properties: {
                      alignSelf: {
                        value: 'stretch',
                      },
                      label: {
                        value: 'Label',
                      },
                      size: {
                        value: 'large',
                      },
                      shrink: {
                        value: '0',
                      },
                      variation: {
                        value: 'default',
                      },
                      display: {
                        value: 'flex',
                      },
                    },
                  },
                  {
                    children: [],
                    componentType: 'TextField',
                    name: 'TextFieldzul',
                    properties: {
                      alignSelf: {
                        value: 'stretch',
                      },
                      label: {
                        value: 'Label',
                      },
                      size: {
                        value: 'large',
                      },
                      shrink: {
                        value: '0',
                      },
                      variation: {
                        value: 'default',
                      },
                      display: {
                        value: 'flex',
                      },
                    },
                  },
                ],
                componentType: 'Flex',
                name: 'Frame 406',
                properties: {
                  padding: {
                    value: '0px 32px 0px 32px',
                  },
                  alignSelf: {
                    value: 'stretch',
                  },
                  position: {
                    value: 'relative',
                  },
                  shrink: {
                    value: '0',
                  },
                  gap: {
                    value: '24px',
                  },
                  direction: {
                    value: 'column',
                  },
                },
              },
              {
                children: [],
                componentType: 'Divider',
                name: 'Dividerezo',
                properties: {
                  width: {
                    value: '667px',
                  },
                  alignSelf: {
                    value: 'stretch',
                  },
                  orientation: {
                    value: 'horizontal',
                  },
                  size: {
                    value: 'small',
                  },
                  shrink: {
                    value: '0',
                  },
                },
              },
              {
                children: [
                  {
                    children: [],
                    componentType: 'Text',
                    name: 'Shippingbls',
                    properties: {
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      color: {
                        value: 'rgba(0,0,0,1)',
                      },
                      textAlign: {
                        value: 'left',
                      },
                      shrink: {
                        value: '0',
                      },
                      display: {
                        value: 'flex',
                      },
                      label: {
                        value: 'Shipping',
                      },
                      justifyContent: {
                        value: 'flex-start',
                      },
                      fontFamily: {
                        value: 'Inter',
                      },
                      fontSize: {
                        value: '16px',
                      },
                      lineHeight: {
                        value: '24px',
                      },
                      position: {
                        value: 'relative',
                      },
                      fontWeight: {
                        value: '700',
                      },
                      direction: {
                        value: 'column',
                      },
                    },
                  },
                  {
                    children: [],
                    componentType: 'TextField',
                    name: 'TextFieldssh',
                    properties: {
                      alignSelf: {
                        value: 'stretch',
                      },
                      label: {
                        value: 'Label',
                      },
                      size: {
                        value: 'large',
                      },
                      shrink: {
                        value: '0',
                      },
                      variation: {
                        value: 'default',
                      },
                      display: {
                        value: 'flex',
                      },
                    },
                  },
                  {
                    children: [],
                    componentType: 'TextField',
                    name: 'TextFieldbpk',
                    properties: {
                      alignSelf: {
                        value: 'stretch',
                      },
                      label: {
                        value: 'Label',
                      },
                      size: {
                        value: 'large',
                      },
                      shrink: {
                        value: '0',
                      },
                      variation: {
                        value: 'default',
                      },
                      display: {
                        value: 'flex',
                      },
                    },
                  },
                  {
                    children: [
                      {
                        children: [],
                        componentType: 'TextField',
                        name: 'TextFielddbe',
                        properties: {
                          grow: {
                            value: '1',
                          },
                          size: {
                            value: 'large',
                          },
                          display: {
                            value: 'flex',
                          },
                          width: {
                            value: '289.5px',
                          },
                          label: {
                            value: 'Label',
                          },
                          basis: {
                            value: '289.5px',
                          },
                          variation: {
                            value: 'default',
                          },
                          height: {
                            value: '74px',
                          },
                        },
                      },
                      {
                        children: [],
                        componentType: 'SelectField',
                        name: 'SelectFieldjfr',
                        properties: {
                          grow: {
                            value: '1',
                          },
                          size: {
                            value: 'large',
                          },
                          display: {
                            value: 'flex',
                          },
                          width: {
                            value: '289.5px',
                          },
                          label: {
                            value: 'Label',
                          },
                          basis: {
                            value: '289.5px',
                          },
                          variation: {
                            value: 'default',
                          },
                          height: {
                            value: '74px',
                          },
                        },
                      },
                    ],
                    componentType: 'Flex',
                    name: 'Frame 407',
                    properties: {
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      alignSelf: {
                        value: 'stretch',
                      },
                      alignItems: {
                        value: 'flex-start',
                      },
                      shrink: {
                        value: '0',
                      },
                      gap: {
                        value: '24px',
                      },
                      position: {
                        value: 'relative',
                      },
                      direction: {
                        value: 'row',
                      },
                    },
                  },
                  {
                    children: [
                      {
                        children: [],
                        componentType: 'TextField',
                        name: 'TextFieldtvu',
                        properties: {
                          grow: {
                            value: '1',
                          },
                          size: {
                            value: 'large',
                          },
                          display: {
                            value: 'flex',
                          },
                          width: {
                            value: '289.5px',
                          },
                          label: {
                            value: 'Label',
                          },
                          basis: {
                            value: '289.5px',
                          },
                          variation: {
                            value: 'default',
                          },
                          height: {
                            value: '74px',
                          },
                        },
                      },
                      {
                        children: [],
                        componentType: 'SelectField',
                        name: 'SelectFieldsbu',
                        properties: {
                          grow: {
                            value: '1',
                          },
                          size: {
                            value: 'large',
                          },
                          display: {
                            value: 'flex',
                          },
                          width: {
                            value: '289.5px',
                          },
                          label: {
                            value: 'Label',
                          },
                          basis: {
                            value: '289.5px',
                          },
                          variation: {
                            value: 'default',
                          },
                          height: {
                            value: '74px',
                          },
                        },
                      },
                    ],
                    componentType: 'Flex',
                    name: 'Frame 408',
                    properties: {
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      alignSelf: {
                        value: 'stretch',
                      },
                      alignItems: {
                        value: 'flex-start',
                      },
                      shrink: {
                        value: '0',
                      },
                      gap: {
                        value: '24px',
                      },
                      position: {
                        value: 'relative',
                      },
                      direction: {
                        value: 'row',
                      },
                    },
                  },
                ],
                componentType: 'Flex',
                name: 'Frame 409',
                properties: {
                  padding: {
                    value: '0px 32px 0px 32px',
                  },
                  alignSelf: {
                    value: 'stretch',
                  },
                  position: {
                    value: 'relative',
                  },
                  shrink: {
                    value: '0',
                  },
                  gap: {
                    value: '24px',
                  },
                  direction: {
                    value: 'column',
                  },
                },
              },
              {
                children: [],
                componentType: 'Divider',
                name: 'Dividerqbh',
                properties: {
                  width: {
                    value: '667px',
                  },
                  alignSelf: {
                    value: 'stretch',
                  },
                  orientation: {
                    value: 'horizontal',
                  },
                  size: {
                    value: 'small',
                  },
                  shrink: {
                    value: '0',
                  },
                },
              },
              {
                children: [
                  {
                    children: [],
                    componentType: 'Text',
                    name: 'Card info',
                    properties: {
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      color: {
                        value: 'rgba(0,0,0,1)',
                      },
                      textAlign: {
                        value: 'left',
                      },
                      shrink: {
                        value: '0',
                      },
                      display: {
                        value: 'flex',
                      },
                      label: {
                        value: 'Card info',
                      },
                      justifyContent: {
                        value: 'flex-start',
                      },
                      fontFamily: {
                        value: 'Inter',
                      },
                      fontSize: {
                        value: '16px',
                      },
                      lineHeight: {
                        value: '24px',
                      },
                      position: {
                        value: 'relative',
                      },
                      fontWeight: {
                        value: '700',
                      },
                      direction: {
                        value: 'column',
                      },
                    },
                  },
                  {
                    children: [],
                    componentType: 'TextField',
                    name: 'TextFieldebx',
                    properties: {
                      alignSelf: {
                        value: 'stretch',
                      },
                      label: {
                        value: 'Label',
                      },
                      size: {
                        value: 'large',
                      },
                      shrink: {
                        value: '0',
                      },
                      variation: {
                        value: 'default',
                      },
                      display: {
                        value: 'flex',
                      },
                    },
                  },
                  {
                    children: [],
                    componentType: 'TextField',
                    name: 'TextFieldnsx',
                    properties: {
                      alignSelf: {
                        value: 'stretch',
                      },
                      label: {
                        value: 'Label',
                      },
                      size: {
                        value: 'large',
                      },
                      shrink: {
                        value: '0',
                      },
                      variation: {
                        value: 'default',
                      },
                      display: {
                        value: 'flex',
                      },
                    },
                  },
                  {
                    children: [
                      {
                        children: [],
                        componentType: 'SelectField',
                        name: 'SelectFieldbfj',
                        properties: {
                          grow: {
                            value: '1',
                          },
                          size: {
                            value: 'large',
                          },
                          display: {
                            value: 'flex',
                          },
                          width: {
                            value: '289.5px',
                          },
                          label: {
                            value: 'Label',
                          },
                          basis: {
                            value: '289.5px',
                          },
                          variation: {
                            value: 'default',
                          },
                          height: {
                            value: '74px',
                          },
                        },
                      },
                      {
                        children: [],
                        componentType: 'SelectField',
                        name: 'SelectFieldpzs',
                        properties: {
                          grow: {
                            value: '1',
                          },
                          size: {
                            value: 'large',
                          },
                          display: {
                            value: 'flex',
                          },
                          width: {
                            value: '289.5px',
                          },
                          label: {
                            value: 'Label',
                          },
                          basis: {
                            value: '289.5px',
                          },
                          variation: {
                            value: 'default',
                          },
                          height: {
                            value: '74px',
                          },
                        },
                      },
                    ],
                    componentType: 'Flex',
                    name: 'Frame 410',
                    properties: {
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      alignSelf: {
                        value: 'stretch',
                      },
                      alignItems: {
                        value: 'flex-start',
                      },
                      shrink: {
                        value: '0',
                      },
                      gap: {
                        value: '24px',
                      },
                      position: {
                        value: 'relative',
                      },
                      direction: {
                        value: 'row',
                      },
                    },
                  },
                ],
                componentType: 'Flex',
                name: 'Frame 313swr',
                properties: {
                  padding: {
                    value: '0px 32px 0px 32px',
                  },
                  alignSelf: {
                    value: 'stretch',
                  },
                  position: {
                    value: 'relative',
                  },
                  shrink: {
                    value: '0',
                  },
                  gap: {
                    value: '24px',
                  },
                  direction: {
                    value: 'column',
                  },
                },
              },
            ],
            componentType: 'Flex',
            name: 'Frame 313fyh',
            properties: {
              padding: {
                value: '0px 0px 0px 0px',
              },
              grow: {
                value: '1',
              },
              alignItems: {
                value: 'center',
              },
              gap: {
                value: '32px',
              },
              width: {
                value: '667px',
              },
              position: {
                value: 'relative',
              },
              basis: {
                value: '667px',
              },
              justifyContent: {
                value: 'center',
              },
              direction: {
                value: 'column',
              },
              height: {
                value: '1084px',
              },
            },
          },
        ],
        componentType: 'Flex',
        name: 'Frame 411',
        properties: {
          padding: {
            value: '32px 0px 32px 0px',
          },
          backgroundColor: {
            value: 'rgba(255,255,255,1)',
          },
          grow: {
            value: '1',
          },
          alignItems: {
            value: 'flex-start',
          },
          gap: {
            value: '0',
          },
          width: {
            value: '667px',
          },
          position: {
            value: 'relative',
          },
          basis: {
            value: '667px',
          },
          direction: {
            value: 'row',
          },
          height: {
            value: '1148px',
          },
        },
      },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    children: [],
                    componentType: 'Image',
                    name: 'imagetnu',
                    properties: {
                      width: {
                        value: '89px',
                      },
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      position: {
                        value: 'absolute',
                      },
                      top: {
                        value: '0px',
                      },
                      left: {
                        value: '0px',
                      },
                      height: {
                        value: '130px',
                      },
                    },
                  },
                  {
                    children: [],
                    componentType: 'Text',
                    name: 'Order Summaryjoj',
                    properties: {
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      color: {
                        value: 'rgba(13.000000175088644,26.000000350177288,38.0000015348196,1)',
                      },
                      textAlign: {
                        value: 'left',
                      },
                      display: {
                        value: 'flex',
                      },
                      letterSpacing: {
                        value: '0.49px',
                      },
                      label: {
                        value: 'Order Summary',
                      },
                      justifyContent: {
                        value: 'flex-start',
                      },
                      fontFamily: {
                        value: 'Inter',
                      },
                      top: {
                        value: '112px',
                      },
                      left: {
                        value: '121px',
                      },
                      fontSize: {
                        value: '16px',
                      },
                      lineHeight: {
                        value: '20px',
                      },
                      position: {
                        value: 'absolute',
                      },
                      fontWeight: {
                        value: '700',
                      },
                      direction: {
                        value: 'column',
                      },
                    },
                  },
                  {
                    children: [],
                    componentType: 'Text',
                    name: 'Blackifg',
                    properties: {
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      color: {
                        value: 'rgba(128.0000075697899,128.0000075697899,128.0000075697899,1)',
                      },
                      textAlign: {
                        value: 'left',
                      },
                      display: {
                        value: 'flex',
                      },
                      letterSpacing: {
                        value: '0.010000000000000009px',
                      },
                      label: {
                        value: 'Black',
                      },
                      justifyContent: {
                        value: 'flex-start',
                      },
                      fontFamily: {
                        value: 'Inter',
                      },
                      top: {
                        value: '32px',
                      },
                      left: {
                        value: '121px',
                      },
                      fontSize: {
                        value: '16px',
                      },
                      lineHeight: {
                        value: '24px',
                      },
                      position: {
                        value: 'absolute',
                      },
                      fontWeight: {
                        value: '400',
                      },
                      direction: {
                        value: 'column',
                      },
                    },
                  },
                  {
                    children: [],
                    componentType: 'Text',
                    name: 'Basic Teewww',
                    properties: {
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      color: {
                        value: 'rgba(13.000000175088644,26.000000350177288,38.0000015348196,1)',
                      },
                      textAlign: {
                        value: 'left',
                      },
                      display: {
                        value: 'flex',
                      },
                      letterSpacing: {
                        value: '0.010000000000000009px',
                      },
                      label: {
                        value: 'Basic Tee',
                      },
                      justifyContent: {
                        value: 'flex-start',
                      },
                      fontFamily: {
                        value: 'Inter',
                      },
                      top: {
                        value: '0px',
                      },
                      left: {
                        value: '121px',
                      },
                      fontSize: {
                        value: '16px',
                      },
                      lineHeight: {
                        value: '24px',
                      },
                      position: {
                        value: 'absolute',
                      },
                      fontWeight: {
                        value: '400',
                      },
                      direction: {
                        value: 'column',
                      },
                    },
                  },
                  {
                    children: [],
                    componentType: 'Text',
                    name: 'Largeork',
                    properties: {
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      color: {
                        value: 'rgba(128.0000075697899,128.0000075697899,128.0000075697899,1)',
                      },
                      textAlign: {
                        value: 'left',
                      },
                      display: {
                        value: 'flex',
                      },
                      letterSpacing: {
                        value: '0.010000000000000009px',
                      },
                      label: {
                        value: 'Large',
                      },
                      justifyContent: {
                        value: 'flex-start',
                      },
                      fontFamily: {
                        value: 'Inter',
                      },
                      top: {
                        value: '64px',
                      },
                      left: {
                        value: '121px',
                      },
                      fontSize: {
                        value: '16px',
                      },
                      lineHeight: {
                        value: '24px',
                      },
                      position: {
                        value: 'absolute',
                      },
                      fontWeight: {
                        value: '400',
                      },
                      direction: {
                        value: 'column',
                      },
                    },
                  },
                  {
                    children: [],
                    componentType: 'IconDelete',
                    name: 'Iconolf',
                    properties: {
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      overflow: {
                        value: 'hidden',
                      },
                      top: {
                        value: '0px',
                      },
                      color: {
                        value: 'rgba(13.000000175088644,26.000000350177288,38.0000015348196,1)',
                      },
                      left: {
                        value: '381px',
                      },
                      width: {
                        value: '24px',
                      },
                      fontSize: {
                        value: '24px',
                      },
                      position: {
                        value: 'absolute',
                      },
                      type: {
                        value: 'delete',
                      },
                      height: {
                        value: '24px',
                      },
                    },
                  },
                  {
                    children: [],
                    componentType: 'SelectField',
                    name: 'SelectFieldaue',
                    properties: {
                      labelHidden: {
                        value: 'true',
                      },
                      top: {
                        value: '104px',
                      },
                      size: {
                        value: 'small',
                      },
                      left: {
                        value: '341px',
                      },
                      display: {
                        value: 'flex',
                      },
                      width: {
                        value: '64px',
                      },
                      position: {
                        value: 'absolute',
                      },
                      variation: {
                        value: 'default',
                      },
                    },
                  },
                ],
                componentType: 'View',
                name: 'Group 314',
                properties: {
                  width: {
                    value: '405px',
                  },
                  padding: {
                    value: '0px 0px 0px 0px',
                  },
                  position: {
                    value: 'absolute',
                  },
                  top: {
                    value: '194px',
                  },
                  left: {
                    value: '32px',
                  },
                  height: {
                    value: '134px',
                  },
                },
              },
              {
                children: [],
                componentType: 'Divider',
                name: 'Dividercva',
                properties: {
                  width: {
                    value: '469px',
                  },
                  orientation: {
                    value: 'horizontal',
                  },
                  position: {
                    value: 'absolute',
                  },
                  top: {
                    value: '362px',
                  },
                  size: {
                    value: 'small',
                  },
                  left: {
                    value: '0px',
                  },
                },
              },
              {
                children: [],
                componentType: 'Divider',
                name: 'Dividerdzd',
                properties: {
                  width: {
                    value: '469px',
                  },
                  orientation: {
                    value: 'horizontal',
                  },
                  position: {
                    value: 'absolute',
                  },
                  top: {
                    value: '161px',
                  },
                  size: {
                    value: 'small',
                  },
                  left: {
                    value: '0px',
                  },
                },
              },
              {
                children: [],
                componentType: 'Divider',
                name: 'Dividerbqu',
                properties: {
                  width: {
                    value: '469px',
                  },
                  orientation: {
                    value: 'horizontal',
                  },
                  position: {
                    value: 'absolute',
                  },
                  top: {
                    value: '72px',
                  },
                  size: {
                    value: 'small',
                  },
                  left: {
                    value: '0px',
                  },
                },
              },
              {
                children: [
                  {
                    children: [],
                    componentType: 'Image',
                    name: 'imageuho',
                    properties: {
                      width: {
                        value: '89px',
                      },
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      position: {
                        value: 'absolute',
                      },
                      top: {
                        value: '0px',
                      },
                      left: {
                        value: '0px',
                      },
                      height: {
                        value: '130px',
                      },
                    },
                  },
                  {
                    children: [],
                    componentType: 'Text',
                    name: 'Order Summaryljw',
                    properties: {
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      color: {
                        value: 'rgba(13.000000175088644,26.000000350177288,38.0000015348196,1)',
                      },
                      textAlign: {
                        value: 'left',
                      },
                      display: {
                        value: 'flex',
                      },
                      letterSpacing: {
                        value: '0.49px',
                      },
                      label: {
                        value: 'Order Summary',
                      },
                      justifyContent: {
                        value: 'flex-start',
                      },
                      fontFamily: {
                        value: 'Inter',
                      },
                      top: {
                        value: '112px',
                      },
                      left: {
                        value: '121px',
                      },
                      fontSize: {
                        value: '16px',
                      },
                      lineHeight: {
                        value: '20px',
                      },
                      position: {
                        value: 'absolute',
                      },
                      fontWeight: {
                        value: '700',
                      },
                      direction: {
                        value: 'column',
                      },
                    },
                  },
                  {
                    children: [],
                    componentType: 'Text',
                    name: 'Blackpos',
                    properties: {
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      color: {
                        value: 'rgba(128.0000075697899,128.0000075697899,128.0000075697899,1)',
                      },
                      textAlign: {
                        value: 'left',
                      },
                      display: {
                        value: 'flex',
                      },
                      letterSpacing: {
                        value: '0.010000000000000009px',
                      },
                      label: {
                        value: 'Black',
                      },
                      justifyContent: {
                        value: 'flex-start',
                      },
                      fontFamily: {
                        value: 'Inter',
                      },
                      top: {
                        value: '32px',
                      },
                      left: {
                        value: '121px',
                      },
                      fontSize: {
                        value: '16px',
                      },
                      lineHeight: {
                        value: '24px',
                      },
                      position: {
                        value: 'absolute',
                      },
                      fontWeight: {
                        value: '400',
                      },
                      direction: {
                        value: 'column',
                      },
                    },
                  },
                  {
                    children: [],
                    componentType: 'Text',
                    name: 'Basic Teeanh',
                    properties: {
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      color: {
                        value: 'rgba(13.000000175088644,26.000000350177288,38.0000015348196,1)',
                      },
                      textAlign: {
                        value: 'left',
                      },
                      display: {
                        value: 'flex',
                      },
                      letterSpacing: {
                        value: '0.010000000000000009px',
                      },
                      label: {
                        value: 'Basic Tee',
                      },
                      justifyContent: {
                        value: 'flex-start',
                      },
                      fontFamily: {
                        value: 'Inter',
                      },
                      top: {
                        value: '0px',
                      },
                      left: {
                        value: '121px',
                      },
                      fontSize: {
                        value: '16px',
                      },
                      lineHeight: {
                        value: '24px',
                      },
                      position: {
                        value: 'absolute',
                      },
                      fontWeight: {
                        value: '400',
                      },
                      direction: {
                        value: 'column',
                      },
                    },
                  },
                  {
                    children: [],
                    componentType: 'Text',
                    name: 'Largerpt',
                    properties: {
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      color: {
                        value: 'rgba(128.0000075697899,128.0000075697899,128.0000075697899,1)',
                      },
                      textAlign: {
                        value: 'left',
                      },
                      display: {
                        value: 'flex',
                      },
                      letterSpacing: {
                        value: '0.010000000000000009px',
                      },
                      label: {
                        value: 'Large',
                      },
                      justifyContent: {
                        value: 'flex-start',
                      },
                      fontFamily: {
                        value: 'Inter',
                      },
                      top: {
                        value: '64px',
                      },
                      left: {
                        value: '121px',
                      },
                      fontSize: {
                        value: '16px',
                      },
                      lineHeight: {
                        value: '24px',
                      },
                      position: {
                        value: 'absolute',
                      },
                      fontWeight: {
                        value: '400',
                      },
                      direction: {
                        value: 'column',
                      },
                    },
                  },
                  {
                    children: [],
                    componentType: 'IconDelete',
                    name: 'Iconmiq',
                    properties: {
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      overflow: {
                        value: 'hidden',
                      },
                      top: {
                        value: '0px',
                      },
                      color: {
                        value: 'rgba(13.000000175088644,26.000000350177288,38.0000015348196,1)',
                      },
                      left: {
                        value: '381px',
                      },
                      width: {
                        value: '24px',
                      },
                      fontSize: {
                        value: '24px',
                      },
                      position: {
                        value: 'absolute',
                      },
                      type: {
                        value: 'delete',
                      },
                      height: {
                        value: '24px',
                      },
                    },
                  },
                  {
                    children: [],
                    componentType: 'SelectField',
                    name: 'SelectFieldjxl',
                    properties: {
                      labelHidden: {
                        value: 'true',
                      },
                      top: {
                        value: '104px',
                      },
                      size: {
                        value: 'small',
                      },
                      left: {
                        value: '341px',
                      },
                      display: {
                        value: 'flex',
                      },
                      width: {
                        value: '64px',
                      },
                      position: {
                        value: 'absolute',
                      },
                      variation: {
                        value: 'default',
                      },
                    },
                  },
                ],
                componentType: 'View',
                name: 'Group 315',
                properties: {
                  width: {
                    value: '405px',
                  },
                  padding: {
                    value: '0px 0px 0px 0px',
                  },
                  position: {
                    value: 'absolute',
                  },
                  top: {
                    value: '395px',
                  },
                  left: {
                    value: '32px',
                  },
                  height: {
                    value: '134px',
                  },
                },
              },
              {
                children: [],
                componentType: 'Divider',
                name: 'Dividertjr',
                properties: {
                  width: {
                    value: '469px',
                  },
                  orientation: {
                    value: 'horizontal',
                  },
                  position: {
                    value: 'absolute',
                  },
                  top: {
                    value: '563px',
                  },
                  size: {
                    value: 'small',
                  },
                  left: {
                    value: '0px',
                  },
                },
              },
              {
                children: [
                  {
                    children: [],
                    componentType: 'Text',
                    name: 'Subtotal',
                    properties: {
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      color: {
                        value: 'rgba(48.000000938773155,64.00000378489494,80.00000283122063,1)',
                      },
                      textAlign: {
                        value: 'left',
                      },
                      display: {
                        value: 'flex',
                      },
                      letterSpacing: {
                        value: '0.010000000000000009px',
                      },
                      label: {
                        value: 'Subtotal',
                      },
                      justifyContent: {
                        value: 'flex-start',
                      },
                      fontFamily: {
                        value: 'Inter',
                      },
                      top: {
                        value: '0px',
                      },
                      left: {
                        value: '0px',
                      },
                      width: {
                        value: '77.75053405761719px',
                      },
                      fontSize: {
                        value: '16px',
                      },
                      lineHeight: {
                        value: '24px',
                      },
                      position: {
                        value: 'absolute',
                      },
                      fontWeight: {
                        value: '400',
                      },
                      direction: {
                        value: 'column',
                      },
                    },
                  },
                  {
                    children: [],
                    componentType: 'Text',
                    name: '$320.00',
                    properties: {
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      color: {
                        value: 'rgba(13.000000175088644,26.000000350177288,38.0000015348196,1)',
                      },
                      textAlign: {
                        value: 'right',
                      },
                      display: {
                        value: 'flex',
                      },
                      letterSpacing: {
                        value: '0.010000000000000009px',
                      },
                      label: {
                        value: '$320.00',
                      },
                      justifyContent: {
                        value: 'flex-start',
                      },
                      fontFamily: {
                        value: 'Inter',
                      },
                      top: {
                        value: '0px',
                      },
                      left: {
                        value: '340px',
                      },
                      fontSize: {
                        value: '16px',
                      },
                      lineHeight: {
                        value: '24px',
                      },
                      position: {
                        value: 'absolute',
                      },
                      fontWeight: {
                        value: '400',
                      },
                      direction: {
                        value: 'column',
                      },
                    },
                  },
                ],
                componentType: 'View',
                name: 'Group 316',
                properties: {
                  width: {
                    value: '405px',
                  },
                  padding: {
                    value: '0px 0px 0px 0px',
                  },
                  position: {
                    value: 'absolute',
                  },
                  top: {
                    value: '596px',
                  },
                  left: {
                    value: '32px',
                  },
                  height: {
                    value: '24px',
                  },
                },
              },
              {
                children: [
                  {
                    children: [],
                    componentType: 'Text',
                    name: 'Shippingjza',
                    properties: {
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      color: {
                        value: 'rgba(48.000000938773155,64.00000378489494,80.00000283122063,1)',
                      },
                      textAlign: {
                        value: 'left',
                      },
                      display: {
                        value: 'flex',
                      },
                      letterSpacing: {
                        value: '0.010000000000000009px',
                      },
                      label: {
                        value: 'Shipping',
                      },
                      justifyContent: {
                        value: 'flex-start',
                      },
                      fontFamily: {
                        value: 'Inter',
                      },
                      top: {
                        value: '0px',
                      },
                      left: {
                        value: '0px',
                      },
                      width: {
                        value: '80.14285278320312px',
                      },
                      fontSize: {
                        value: '16px',
                      },
                      lineHeight: {
                        value: '24px',
                      },
                      position: {
                        value: 'absolute',
                      },
                      fontWeight: {
                        value: '400',
                      },
                      direction: {
                        value: 'column',
                      },
                    },
                  },
                  {
                    children: [],
                    componentType: 'Text',
                    name: '$15.00',
                    properties: {
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      color: {
                        value: 'rgba(13.000000175088644,26.000000350177288,38.0000015348196,1)',
                      },
                      textAlign: {
                        value: 'right',
                      },
                      display: {
                        value: 'flex',
                      },
                      letterSpacing: {
                        value: '0.010000000000000009px',
                      },
                      label: {
                        value: '$15.00',
                      },
                      justifyContent: {
                        value: 'flex-start',
                      },
                      fontFamily: {
                        value: 'Inter',
                      },
                      top: {
                        value: '0px',
                      },
                      left: {
                        value: '353px',
                      },
                      fontSize: {
                        value: '16px',
                      },
                      lineHeight: {
                        value: '24px',
                      },
                      position: {
                        value: 'absolute',
                      },
                      fontWeight: {
                        value: '400',
                      },
                      direction: {
                        value: 'column',
                      },
                    },
                  },
                ],
                componentType: 'View',
                name: 'Group 317',
                properties: {
                  width: {
                    value: '405px',
                  },
                  padding: {
                    value: '0px 0px 0px 0px',
                  },
                  position: {
                    value: 'absolute',
                  },
                  top: {
                    value: '636px',
                  },
                  left: {
                    value: '32px',
                  },
                  height: {
                    value: '24px',
                  },
                },
              },
              {
                children: [
                  {
                    children: [],
                    componentType: 'Text',
                    name: 'Taxes',
                    properties: {
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      color: {
                        value: 'rgba(48.000000938773155,64.00000378489494,80.00000283122063,1)',
                      },
                      textAlign: {
                        value: 'left',
                      },
                      display: {
                        value: 'flex',
                      },
                      letterSpacing: {
                        value: '0.010000000000000009px',
                      },
                      label: {
                        value: 'Taxes',
                      },
                      justifyContent: {
                        value: 'flex-start',
                      },
                      fontFamily: {
                        value: 'Inter',
                      },
                      top: {
                        value: '0px',
                      },
                      left: {
                        value: '0px',
                      },
                      width: {
                        value: '53.82728958129883px',
                      },
                      fontSize: {
                        value: '16px',
                      },
                      lineHeight: {
                        value: '24px',
                      },
                      position: {
                        value: 'absolute',
                      },
                      fontWeight: {
                        value: '400',
                      },
                      direction: {
                        value: 'column',
                      },
                    },
                  },
                  {
                    children: [],
                    componentType: 'Text',
                    name: '$26.80',
                    properties: {
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      color: {
                        value: 'rgba(13.000000175088644,26.000000350177288,38.0000015348196,1)',
                      },
                      textAlign: {
                        value: 'right',
                      },
                      display: {
                        value: 'flex',
                      },
                      letterSpacing: {
                        value: '0.010000000000000009px',
                      },
                      label: {
                        value: '$26.80',
                      },
                      justifyContent: {
                        value: 'flex-start',
                      },
                      fontFamily: {
                        value: 'Inter',
                      },
                      top: {
                        value: '0px',
                      },
                      left: {
                        value: '350px',
                      },
                      fontSize: {
                        value: '16px',
                      },
                      lineHeight: {
                        value: '24px',
                      },
                      position: {
                        value: 'absolute',
                      },
                      fontWeight: {
                        value: '400',
                      },
                      direction: {
                        value: 'column',
                      },
                    },
                  },
                ],
                componentType: 'View',
                name: 'Group 318',
                properties: {
                  width: {
                    value: '405px',
                  },
                  padding: {
                    value: '0px 0px 0px 0px',
                  },
                  position: {
                    value: 'absolute',
                  },
                  top: {
                    value: '676px',
                  },
                  left: {
                    value: '32px',
                  },
                  height: {
                    value: '24px',
                  },
                },
              },
              {
                children: [],
                componentType: 'Divider',
                name: 'Dividerbdh',
                properties: {
                  width: {
                    value: '405px',
                  },
                  orientation: {
                    value: 'horizontal',
                  },
                  position: {
                    value: 'absolute',
                  },
                  top: {
                    value: '716px',
                  },
                  size: {
                    value: 'small',
                  },
                  left: {
                    value: '32px',
                  },
                },
              },
              {
                children: [
                  {
                    children: [],
                    componentType: 'Text',
                    name: 'Total',
                    properties: {
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      color: {
                        value: 'rgba(13.000000175088644,26.000000350177288,38.0000015348196,1)',
                      },
                      textAlign: {
                        value: 'left',
                      },
                      display: {
                        value: 'flex',
                      },
                      letterSpacing: {
                        value: '0.49px',
                      },
                      label: {
                        value: 'Total',
                      },
                      justifyContent: {
                        value: 'flex-start',
                      },
                      fontFamily: {
                        value: 'Inter',
                      },
                      top: {
                        value: '0px',
                      },
                      left: {
                        value: '0px',
                      },
                      width: {
                        value: '50.23880386352539px',
                      },
                      fontSize: {
                        value: '16px',
                      },
                      lineHeight: {
                        value: '20px',
                      },
                      position: {
                        value: 'absolute',
                      },
                      fontWeight: {
                        value: '700',
                      },
                      direction: {
                        value: 'column',
                      },
                    },
                  },
                  {
                    children: [],
                    componentType: 'Text',
                    name: '$361.80',
                    properties: {
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      color: {
                        value: 'rgba(13.000000175088644,26.000000350177288,38.0000015348196,1)',
                      },
                      textAlign: {
                        value: 'right',
                      },
                      display: {
                        value: 'flex',
                      },
                      letterSpacing: {
                        value: '0.49px',
                      },
                      label: {
                        value: '$361.80',
                      },
                      justifyContent: {
                        value: 'flex-start',
                      },
                      fontFamily: {
                        value: 'Inter',
                      },
                      top: {
                        value: '0px',
                      },
                      left: {
                        value: '336px',
                      },
                      fontSize: {
                        value: '16px',
                      },
                      lineHeight: {
                        value: '20px',
                      },
                      position: {
                        value: 'absolute',
                      },
                      fontWeight: {
                        value: '700',
                      },
                      direction: {
                        value: 'column',
                      },
                    },
                  },
                ],
                componentType: 'View',
                name: 'Group 319',
                properties: {
                  width: {
                    value: '405px',
                  },
                  padding: {
                    value: '0px 0px 0px 0px',
                  },
                  position: {
                    value: 'absolute',
                  },
                  top: {
                    value: '733px',
                  },
                  left: {
                    value: '32px',
                  },
                  height: {
                    value: '20px',
                  },
                },
              },
              {
                children: [],
                componentType: 'Divider',
                name: 'Dividerifc',
                properties: {
                  width: {
                    value: '469px',
                  },
                  orientation: {
                    value: 'horizontal',
                  },
                  position: {
                    value: 'absolute',
                  },
                  top: {
                    value: '789px',
                  },
                  size: {
                    value: 'small',
                  },
                  left: {
                    value: '0px',
                  },
                },
              },
              {
                children: [],
                componentType: 'Button',
                name: 'Button',
                properties: {
                  top: {
                    value: '822px',
                  },
                  size: {
                    value: 'large',
                  },
                  left: {
                    value: '32px',
                  },
                  display: {
                    value: 'flex',
                  },
                  width: {
                    value: '405px',
                  },
                  label: {
                    value: 'Place Order',
                  },
                  position: {
                    value: 'absolute',
                  },
                  variation: {
                    value: 'primary',
                  },
                },
              },
              {
                children: [
                  {
                    children: [],
                    componentType: 'IconShoppingBag',
                    name: 'Iconhsn',
                    properties: {
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      overflow: {
                        value: 'hidden',
                      },
                      top: {
                        value: '0px',
                      },
                      left: {
                        value: '0px',
                      },
                      width: {
                        value: '24px',
                      },
                      fontSize: {
                        value: '24px',
                      },
                      position: {
                        value: 'absolute',
                      },
                      type: {
                        value: 'shopping_bag',
                      },
                      height: {
                        value: '24px',
                      },
                    },
                  },
                  {
                    children: [],
                    componentType: 'Text',
                    name: 'Cart (2)',
                    properties: {
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      color: {
                        value: 'rgba(0,0,0,1)',
                      },
                      textAlign: {
                        value: 'left',
                      },
                      display: {
                        value: 'flex',
                      },
                      label: {
                        value: 'Cart (2)',
                      },
                      justifyContent: {
                        value: 'flex-start',
                      },
                      fontFamily: {
                        value: 'Inter',
                      },
                      top: {
                        value: '0px',
                      },
                      left: {
                        value: '40px',
                      },
                      fontSize: {
                        value: '16px',
                      },
                      lineHeight: {
                        value: '24px',
                      },
                      position: {
                        value: 'absolute',
                      },
                      fontWeight: {
                        value: '700',
                      },
                      direction: {
                        value: 'column',
                      },
                    },
                  },
                  {
                    children: [],
                    componentType: 'Text',
                    name: '$101.70',
                    properties: {
                      padding: {
                        value: '0px 0px 0px 0px',
                      },
                      color: {
                        value: 'rgba(0,0,0,1)',
                      },
                      textAlign: {
                        value: 'right',
                      },
                      display: {
                        value: 'flex',
                      },
                      label: {
                        value: '$101.70',
                      },
                      justifyContent: {
                        value: 'flex-start',
                      },
                      fontFamily: {
                        value: 'Inter',
                      },
                      top: {
                        value: '0px',
                      },
                      left: {
                        value: '343px',
                      },
                      fontSize: {
                        value: '16px',
                      },
                      lineHeight: {
                        value: '24px',
                      },
                      position: {
                        value: 'absolute',
                      },
                      fontWeight: {
                        value: '700',
                      },
                      direction: {
                        value: 'column',
                      },
                    },
                  },
                ],
                componentType: 'View',
                name: 'Group 313',
                properties: {
                  width: {
                    value: '405px',
                  },
                  padding: {
                    value: '0px 0px 0px 0px',
                  },
                  position: {
                    value: 'absolute',
                  },
                  top: {
                    value: '105px',
                  },
                  left: {
                    value: '32px',
                  },
                  height: {
                    value: '24px',
                  },
                },
              },
              {
                children: [],
                componentType: 'Badge',
                name: 'Badge',
                properties: {
                  backgroundColor: {
                    value: 'rgba(214.00000244379044,245.00000059604645,219.0000021457672,1)',
                  },
                  color: {
                    value: 'rgba(54.00000058114529,94.0000019967556,61.00000016391277,1)',
                  },
                  textAlign: {
                    value: 'left',
                  },
                  display: {
                    value: 'flex',
                  },
                  letterSpacing: {
                    value: '0.49px',
                  },
                  label: {
                    value: 'Discount - 10% off',
                  },
                  justifyContent: {
                    value: 'flex-start',
                  },
                  variation: {
                    value: 'success',
                  },
                  fontFamily: {
                    value: 'Inter',
                  },
                  top: {
                    value: '0px',
                  },
                  size: {
                    value: 'default',
                  },
                  left: {
                    value: '32px',
                  },
                  width: {
                    value: '405px',
                  },
                  fontSize: {
                    value: '16px',
                  },
                  lineHeight: {
                    value: '20px',
                  },
                  position: {
                    value: 'absolute',
                  },
                  fontWeight: {
                    value: '700',
                  },
                  direction: {
                    value: 'column',
                  },
                },
              },
            ],
            componentType: 'Flex',
            name: 'Group 320',
            properties: {
              width: {
                value: '469px',
              },
              padding: {
                value: '0px 0px 0px 0px',
              },
              position: {
                value: 'relative',
              },
              shrink: {
                value: '0',
              },
              height: {
                value: '870px',
              },
            },
          },
        ],
        componentType: 'Flex',
        name: 'Frame 412',
        properties: {
          padding: {
            value: '32px 0px 32px 0px',
          },
          backgroundColor: {
            value: 'rgba(255,255,255,1)',
          },
          alignItems: {
            value: 'flex-start',
          },
          shrink: {
            value: '0',
          },
          gap: {
            value: '10px',
          },
          position: {
            value: 'relative',
          },
          direction: {
            value: 'row',
          },
          height: {
            value: '934px',
          },
        },
      },
    ],
    componentType: 'Flex',
    name: 'FormCheckout',
    overrides: {},
    properties: {
      width: {
        value: '1160px',
      },
      padding: {
        value: '0px 0px 0px 0px',
      },
      position: {
        value: 'relative',
      },
      alignItems: {
        value: 'flex-start',
      },
      gap: {
        value: '24px',
      },
      direction: {
        value: 'row',
      },
    },
    sourceId: '1805:2756',
    variants: [],
  };
  beforeEach(async () => {
    projRoot = await createNewProjectDir('pull-uibuilder');
    projRoot2 = await createNewProjectDir('pull-uibuilder-2');
    projectName = path.basename(projRoot) + 'reactapp';
    await initJSProjectWithProfile(projRoot, {
      disableAmplifyAppCreation: false,
      name: 'uibuildertest',
    });

    appId = getAppId(projRoot);

    const amplifyUIBuilder = new aws.AmplifyUIBuilder({ region: 'us-west-2' });
    return await amplifyUIBuilder
      .createComponent({
        appId,
        environmentName: envName,
        componentToCreate: mockComponent,
      })
      .promise();
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
    deleteProjectDir(projRoot2);
  });

  it('appropriate uibiulder files are generated', async () => {
    const projectDir = path.dirname(projRoot2);
    spawnSync(getNpxPath(), ['create-react-app', projectName], { cwd: projectDir });
    await amplifyPull(`${projectDir}/${projectName}`, { appId, envName, emptyDir: true });
    const fileList = fs.readdirSync(`${projectDir}/${projectName}/src/ui-components/`);
    expect(fileList).toContain('FormCheckout.jsx');
    expect(fileList).toContain('FormCheckout.jsx.d.ts');
    expect(fileList).toContain('index.js');
    expect(fileList).toHaveLength(3);
  });
});
