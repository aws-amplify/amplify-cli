import { CodeGenField, CodeGenModel } from '../visitors/appsync-visitor';

export function addFieldToModel(model: CodeGenModel, field: CodeGenField): void {
  const existingField = model.fields.find(f => f.name === field.name);
  if (!existingField) {
    model.fields.push(field);
  }
}
