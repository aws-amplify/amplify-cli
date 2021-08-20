export declare const supportedServices: {
  Cognito: {
    inputs: (
      | {
          key: string;
          prefix: string;
          question: string;
          type: string;
          default: boolean;
          learnMore: string;
          map: string;
          andConditions: {
            preventEdit: string;
          }[];
          filter?: undefined;
          validation?: undefined;
          required?: undefined;
          temp?: undefined;
          prefixColor?: undefined;
          options?: undefined;
          requiredOptionsMsg?: undefined;
          orConditions?: undefined;
          requiredOptions?: undefined;
          addAnotherLoop?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
          concatKey?: undefined;
        }
      | {
          key: string;
          question: string;
          type: string;
          default: boolean;
          filter: string;
          learnMore: string;
          map: string;
          andConditions: {
            onCreate: string;
          }[];
          prefix?: undefined;
          validation?: undefined;
          required?: undefined;
          temp?: undefined;
          prefixColor?: undefined;
          options?: undefined;
          requiredOptionsMsg?: undefined;
          orConditions?: undefined;
          requiredOptions?: undefined;
          addAnotherLoop?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
          concatKey?: undefined;
        }
      | {
          key: string;
          question: string;
          andConditions: (
            | {
                preventEdit: string;
                key?: undefined;
                value?: undefined;
                operator?: undefined;
              }
            | {
                key: string;
                value: string;
                operator: string;
                preventEdit?: undefined;
              }
          )[];
          validation: {
            operator: string;
            value: string;
            onErrorMsg: string;
          };
          required: boolean;
          prefix?: undefined;
          type?: undefined;
          default?: undefined;
          learnMore?: undefined;
          map?: undefined;
          filter?: undefined;
          temp?: undefined;
          prefixColor?: undefined;
          options?: undefined;
          requiredOptionsMsg?: undefined;
          orConditions?: undefined;
          requiredOptions?: undefined;
          addAnotherLoop?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
          concatKey?: undefined;
        }
      | {
          key: string;
          question: string;
          required: boolean;
          learnMore: string;
          validation: {
            operator: string;
            value: string;
            onErrorMsg: string;
          };
          andConditions: (
            | {
                key: string;
                value: string;
                operator: string;
                preventEdit?: undefined;
              }
            | {
                preventEdit: string;
                key: string;
                value?: undefined;
                operator?: undefined;
              }
          )[];
          prefix?: undefined;
          type?: undefined;
          default?: undefined;
          map?: undefined;
          filter?: undefined;
          temp?: undefined;
          prefixColor?: undefined;
          options?: undefined;
          requiredOptionsMsg?: undefined;
          orConditions?: undefined;
          requiredOptions?: undefined;
          addAnotherLoop?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
          concatKey?: undefined;
        }
      | {
          key: string;
          question: string;
          learnMore: string;
          temp: boolean;
          type: string;
          map: string;
          required: boolean;
          andConditions: {
            key: string;
            value: string;
            operator: string;
          }[];
          prefix?: undefined;
          default?: undefined;
          filter?: undefined;
          validation?: undefined;
          prefixColor?: undefined;
          options?: undefined;
          requiredOptionsMsg?: undefined;
          orConditions?: undefined;
          requiredOptions?: undefined;
          addAnotherLoop?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
          concatKey?: undefined;
        }
      | {
          key: string;
          question: string;
          temp: boolean;
          type: string;
          map: string;
          required: boolean;
          andConditions: (
            | {
                key: string;
                value: string;
                operator: string;
              }
            | {
                key: string;
                value: boolean;
                operator: string;
              }
          )[];
          prefix?: undefined;
          default?: undefined;
          learnMore?: undefined;
          filter?: undefined;
          validation?: undefined;
          prefixColor?: undefined;
          options?: undefined;
          requiredOptionsMsg?: undefined;
          orConditions?: undefined;
          requiredOptions?: undefined;
          addAnotherLoop?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
          concatKey?: undefined;
        }
      | {
          key: string;
          prefix: string;
          question: string;
          required: boolean;
          andConditions: {
            key: string;
            value: string;
            operator: string;
          }[];
          type?: undefined;
          default?: undefined;
          learnMore?: undefined;
          map?: undefined;
          filter?: undefined;
          validation?: undefined;
          temp?: undefined;
          prefixColor?: undefined;
          options?: undefined;
          requiredOptionsMsg?: undefined;
          orConditions?: undefined;
          requiredOptions?: undefined;
          addAnotherLoop?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
          concatKey?: undefined;
        }
      | {
          key: string;
          question: string;
          required: boolean;
          validation: {
            operator: string;
            value: string;
            onErrorMsg: string;
          };
          andConditions: (
            | {
                key: string;
                value: string;
                operator: string;
                preventEdit?: undefined;
              }
            | {
                preventEdit: string;
                key: string;
                value?: undefined;
                operator?: undefined;
              }
          )[];
          prefix?: undefined;
          type?: undefined;
          default?: undefined;
          learnMore?: undefined;
          map?: undefined;
          filter?: undefined;
          temp?: undefined;
          prefixColor?: undefined;
          options?: undefined;
          requiredOptionsMsg?: undefined;
          orConditions?: undefined;
          requiredOptions?: undefined;
          addAnotherLoop?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
          concatKey?: undefined;
        }
      | {
          key: string;
          question: string;
          type: string;
          map: string;
          prefix: string;
          prefixColor: string;
          learnMore: string;
          required: boolean;
          andConditions: (
            | {
                key: string;
                value: string;
                operator: string;
                preventEdit?: undefined;
              }
            | {
                preventEdit: string;
                key?: undefined;
                value?: undefined;
                operator?: undefined;
              }
          )[];
          default?: undefined;
          filter?: undefined;
          validation?: undefined;
          temp?: undefined;
          options?: undefined;
          requiredOptionsMsg?: undefined;
          orConditions?: undefined;
          requiredOptions?: undefined;
          addAnotherLoop?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
          concatKey?: undefined;
        }
      | {
          key: string;
          question: string;
          type: string;
          map: string;
          required: boolean;
          andConditions: (
            | {
                key: string;
                value: string;
                operator: string;
                preventEdit?: undefined;
              }
            | {
                preventEdit: string;
                key?: undefined;
                value?: undefined;
                operator?: undefined;
              }
          )[];
          prefix?: undefined;
          default?: undefined;
          learnMore?: undefined;
          filter?: undefined;
          validation?: undefined;
          temp?: undefined;
          prefixColor?: undefined;
          options?: undefined;
          requiredOptionsMsg?: undefined;
          orConditions?: undefined;
          requiredOptions?: undefined;
          addAnotherLoop?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
          concatKey?: undefined;
        }
      | {
          key: string;
          question: string;
          required: boolean;
          type: string;
          map: string;
          andConditions: (
            | {
                key: string;
                value: string;
                operator: string;
                preventEdit?: undefined;
              }
            | {
                key: string;
                value: string;
                preventEdit: string;
                operator?: undefined;
              }
          )[];
          learnMore: string;
          prefix?: undefined;
          default?: undefined;
          filter?: undefined;
          validation?: undefined;
          temp?: undefined;
          prefixColor?: undefined;
          options?: undefined;
          requiredOptionsMsg?: undefined;
          orConditions?: undefined;
          requiredOptions?: undefined;
          addAnotherLoop?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
          concatKey?: undefined;
        }
      | {
          key: string;
          question: string;
          required: boolean;
          type: string;
          map: string;
          andConditions: {
            key: string;
            value: string;
            operator: string;
          }[];
          validation: {
            operator: string;
            onErrorMsg: string;
            value?: undefined;
          };
          prefix?: undefined;
          default?: undefined;
          learnMore?: undefined;
          filter?: undefined;
          temp?: undefined;
          prefixColor?: undefined;
          options?: undefined;
          requiredOptionsMsg?: undefined;
          orConditions?: undefined;
          requiredOptions?: undefined;
          addAnotherLoop?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
          concatKey?: undefined;
        }
      | {
          key: string;
          question: string;
          required: boolean;
          type: string;
          validation: {
            operator: string;
            value: string;
            onErrorMsg: string;
          };
          andConditions: {
            key: string;
            value: string;
            operator: string;
          }[];
          prefix?: undefined;
          default?: undefined;
          learnMore?: undefined;
          map?: undefined;
          filter?: undefined;
          temp?: undefined;
          prefixColor?: undefined;
          options?: undefined;
          requiredOptionsMsg?: undefined;
          orConditions?: undefined;
          requiredOptions?: undefined;
          addAnotherLoop?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
          concatKey?: undefined;
        }
      | {
          key: string;
          question: string;
          required: boolean;
          type: string;
          andConditions: {
            key: string;
            value: string;
            operator: string;
          }[];
          prefix?: undefined;
          default?: undefined;
          learnMore?: undefined;
          map?: undefined;
          filter?: undefined;
          validation?: undefined;
          temp?: undefined;
          prefixColor?: undefined;
          options?: undefined;
          requiredOptionsMsg?: undefined;
          orConditions?: undefined;
          requiredOptions?: undefined;
          addAnotherLoop?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
          concatKey?: undefined;
        }
      | {
          key: string;
          question: string;
          temp: boolean;
          required: boolean;
          type: string;
          andConditions: {
            key: string;
            value: string;
            operator: string;
          }[];
          prefix?: undefined;
          default?: undefined;
          learnMore?: undefined;
          map?: undefined;
          filter?: undefined;
          validation?: undefined;
          prefixColor?: undefined;
          options?: undefined;
          requiredOptionsMsg?: undefined;
          orConditions?: undefined;
          requiredOptions?: undefined;
          addAnotherLoop?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
          concatKey?: undefined;
        }
      | {
          key: string;
          question: string;
          required: boolean;
          type: string;
          validation: {
            operator: string;
            value: {
              min: number;
              max: number;
            };
            onErrorMsg: string;
          };
          andConditions: (
            | {
                key: string;
                value: string;
                operator: string;
              }
            | {
                key: string;
                value: boolean;
                operator: string;
              }
          )[];
          prefix?: undefined;
          default?: undefined;
          learnMore?: undefined;
          map?: undefined;
          filter?: undefined;
          temp?: undefined;
          prefixColor?: undefined;
          options?: undefined;
          requiredOptionsMsg?: undefined;
          orConditions?: undefined;
          requiredOptions?: undefined;
          addAnotherLoop?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
          concatKey?: undefined;
        }
      | {
          key: string;
          question: string;
          required: boolean;
          type: string;
          options: string[];
          andConditions: (
            | {
                key: string;
                value: string;
                operator: string;
              }
            | {
                key: string;
                value: boolean;
                operator: string;
              }
          )[];
          prefix?: undefined;
          default?: undefined;
          learnMore?: undefined;
          map?: undefined;
          filter?: undefined;
          validation?: undefined;
          temp?: undefined;
          prefixColor?: undefined;
          requiredOptionsMsg?: undefined;
          orConditions?: undefined;
          requiredOptions?: undefined;
          addAnotherLoop?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
          concatKey?: undefined;
        }
      | {
          key: string;
          question: string;
          prefix: string;
          prefixColor: string;
          required: boolean;
          filter: string;
          requiredOptionsMsg: string;
          type: string;
          map: string;
          andConditions: (
            | {
                preventEdit: string;
                key: string;
                value?: undefined;
                operator?: undefined;
              }
            | {
                key: string;
                value: string;
                operator: string;
                preventEdit?: undefined;
              }
          )[];
          orConditions: {
            key: string;
            value: string;
            operator: string;
          }[];
          default?: undefined;
          learnMore?: undefined;
          validation?: undefined;
          temp?: undefined;
          options?: undefined;
          requiredOptions?: undefined;
          addAnotherLoop?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
          concatKey?: undefined;
        }
      | {
          key: string;
          question: string;
          required: boolean;
          andConditions: {
            key: string;
            value: string;
            operator: string;
          }[];
          validation: {
            operator: string;
            value: {
              min: number;
              max: number;
            };
            onErrorMsg: string;
          };
          prefix?: undefined;
          type?: undefined;
          default?: undefined;
          learnMore?: undefined;
          map?: undefined;
          filter?: undefined;
          temp?: undefined;
          prefixColor?: undefined;
          options?: undefined;
          requiredOptionsMsg?: undefined;
          orConditions?: undefined;
          requiredOptions?: undefined;
          addAnotherLoop?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
          concatKey?: undefined;
        }
      | {
          key: string;
          question: string;
          required: boolean;
          type: string;
          map: string;
          andConditions: (
            | {
                key: string;
                value: string;
                operator: string;
              }
            | {
                key: string;
                value: boolean;
                operator: string;
              }
          )[];
          prefix?: undefined;
          default?: undefined;
          learnMore?: undefined;
          filter?: undefined;
          validation?: undefined;
          temp?: undefined;
          prefixColor?: undefined;
          options?: undefined;
          requiredOptionsMsg?: undefined;
          orConditions?: undefined;
          requiredOptions?: undefined;
          addAnotherLoop?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
          concatKey?: undefined;
        }
      | {
          key: string;
          question: string;
          required: boolean;
          type: string;
          map: string;
          requiredOptions: string[];
          requiredOptionsMsg: string;
          andConditions: (
            | {
                key: string;
                value: string;
                operator: string;
              }
            | {
                key: string;
                value: boolean;
                operator: string;
              }
          )[];
          prefix?: undefined;
          default?: undefined;
          learnMore?: undefined;
          filter?: undefined;
          validation?: undefined;
          temp?: undefined;
          prefixColor?: undefined;
          options?: undefined;
          orConditions?: undefined;
          addAnotherLoop?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
          concatKey?: undefined;
        }
      | {
          key: string;
          question: string;
          required: boolean;
          type: string;
          map: string;
          andConditions: {
            key: string;
            value: string;
            operator: string;
          }[];
          orConditions: {
            key: string;
            value: string;
            operator: string;
          }[];
          prefix?: undefined;
          default?: undefined;
          learnMore?: undefined;
          filter?: undefined;
          validation?: undefined;
          temp?: undefined;
          prefixColor?: undefined;
          options?: undefined;
          requiredOptionsMsg?: undefined;
          requiredOptions?: undefined;
          addAnotherLoop?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
          concatKey?: undefined;
        }
      | {
          key: string;
          question: string;
          required: boolean;
          andConditions: {
            key: string;
            value: boolean;
            operator: string;
          }[];
          validation: {
            operator: string;
            value: string;
            onErrorMsg: string;
          };
          prefix?: undefined;
          type?: undefined;
          default?: undefined;
          learnMore?: undefined;
          map?: undefined;
          filter?: undefined;
          temp?: undefined;
          prefixColor?: undefined;
          options?: undefined;
          requiredOptionsMsg?: undefined;
          orConditions?: undefined;
          requiredOptions?: undefined;
          addAnotherLoop?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
          concatKey?: undefined;
        }
      | {
          key: string;
          question: string;
          required: boolean;
          addAnotherLoop: string;
          andConditions: (
            | {
                key: string;
                value: boolean;
                operator: string;
                preventEdit?: undefined;
              }
            | {
                preventEdit: string;
                key: string;
                value?: undefined;
                operator?: undefined;
              }
          )[];
          validation: {
            operator: string;
            value: string;
            onErrorMsg: string;
          };
          prefix?: undefined;
          type?: undefined;
          default?: undefined;
          learnMore?: undefined;
          map?: undefined;
          filter?: undefined;
          temp?: undefined;
          prefixColor?: undefined;
          options?: undefined;
          requiredOptionsMsg?: undefined;
          orConditions?: undefined;
          requiredOptions?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
          concatKey?: undefined;
        }
      | {
          key: string;
          question: string;
          type: string;
          iterator: string;
          iteratorValidation: {
            operator: string;
            value: string;
            onErrorMsg: string;
          };
          andConditions: (
            | {
                key: string;
                operator: string;
                onCreate?: undefined;
              }
            | {
                onCreate: string;
                key?: undefined;
                operator?: undefined;
              }
          )[];
          orConditions: (
            | {
                key: string;
                value: boolean;
                operator: string;
              }
            | {
                key: string;
                value: string;
                operator: string;
              }
          )[];
          prefix?: undefined;
          default?: undefined;
          learnMore?: undefined;
          map?: undefined;
          filter?: undefined;
          validation?: undefined;
          required?: undefined;
          temp?: undefined;
          prefixColor?: undefined;
          options?: undefined;
          requiredOptionsMsg?: undefined;
          requiredOptions?: undefined;
          addAnotherLoop?: undefined;
          concatKey?: undefined;
        }
      | {
          key: string;
          question: string;
          required: boolean;
          type: string;
          andConditions: (
            | {
                onCreate: string;
                preventEdit?: undefined;
                key?: undefined;
              }
            | {
                preventEdit: string;
                key: string;
                onCreate?: undefined;
              }
          )[];
          orConditions: (
            | {
                key: string;
                value: boolean;
                operator: string;
              }
            | {
                key: string;
                value: string;
                operator: string;
              }
          )[];
          prefix?: undefined;
          default?: undefined;
          learnMore?: undefined;
          map?: undefined;
          filter?: undefined;
          validation?: undefined;
          temp?: undefined;
          prefixColor?: undefined;
          options?: undefined;
          requiredOptionsMsg?: undefined;
          requiredOptions?: undefined;
          addAnotherLoop?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
          concatKey?: undefined;
        }
      | {
          key: string;
          question: string;
          required: boolean;
          concatKey: string;
          addAnotherLoop: string;
          andConditions: (
            | {
                key: string;
                value: boolean;
                operator: string;
                onCreate?: undefined;
              }
            | {
                onCreate: string;
                key?: undefined;
                value?: undefined;
                operator?: undefined;
              }
          )[];
          validation: {
            operator: string;
            value: string;
            onErrorMsg: string;
          };
          prefix?: undefined;
          type?: undefined;
          default?: undefined;
          learnMore?: undefined;
          map?: undefined;
          filter?: undefined;
          temp?: undefined;
          prefixColor?: undefined;
          options?: undefined;
          requiredOptionsMsg?: undefined;
          orConditions?: undefined;
          requiredOptions?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
        }
      | {
          key: string;
          question: string;
          temp: boolean;
          type: string;
          filter: string;
          map: string;
          required: boolean;
          andConditions: (
            | {
                key: string;
                value: string;
                operator: string;
                preventEdit?: undefined;
              }
            | {
                key: string;
                value: boolean;
                operator: string;
                preventEdit?: undefined;
              }
            | {
                preventEdit: string;
                key?: undefined;
                value?: undefined;
                operator?: undefined;
              }
          )[];
          prefix?: undefined;
          default?: undefined;
          learnMore?: undefined;
          validation?: undefined;
          prefixColor?: undefined;
          options?: undefined;
          requiredOptionsMsg?: undefined;
          orConditions?: undefined;
          requiredOptions?: undefined;
          addAnotherLoop?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
          concatKey?: undefined;
        }
      | {
          key: string;
          question: string;
          temp: boolean;
          type: string;
          map: string;
          required: boolean;
          andConditions: {
            onCreate: string;
          }[];
          orConditions: (
            | {
                key: string;
                value: boolean;
                operator: string;
              }
            | {
                key: string;
                value: string;
                operator: string;
              }
          )[];
          prefix?: undefined;
          default?: undefined;
          learnMore?: undefined;
          filter?: undefined;
          validation?: undefined;
          prefixColor?: undefined;
          options?: undefined;
          requiredOptionsMsg?: undefined;
          requiredOptions?: undefined;
          addAnotherLoop?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
          concatKey?: undefined;
        }
      | {
          key: string;
          question: string;
          required: boolean;
          andConditions: {
            key: string;
            value: string;
            operator: string;
          }[];
          prefix?: undefined;
          type?: undefined;
          default?: undefined;
          learnMore?: undefined;
          map?: undefined;
          filter?: undefined;
          validation?: undefined;
          temp?: undefined;
          prefixColor?: undefined;
          options?: undefined;
          requiredOptionsMsg?: undefined;
          orConditions?: undefined;
          requiredOptions?: undefined;
          addAnotherLoop?: undefined;
          iterator?: undefined;
          iteratorValidation?: undefined;
          concatKey?: undefined;
        }
    )[];
    cfnFilename: string;
    defaultValuesFilename: string;
    serviceWalkthroughFilename: string;
    stringMapsFilename: string;
    provider: string;
  };
};
//# sourceMappingURL=supported-services.d.ts.map
