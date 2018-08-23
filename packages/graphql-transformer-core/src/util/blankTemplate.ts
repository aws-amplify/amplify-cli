import Template from 'cloudform/types/template'

export default function blankTemplate(description?: string): Template {
    return {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: description,
        Metadata: {},
        Parameters: {},
        Resources: {},
        Outputs: {}
    }
}
