import { camelCase } from "change-case";
import { CodeGenModelMap } from "../visitors/appsync-visitor";

export function validateFieldName(models: CodeGenModelMap) : void {
  Object.entries(models).forEach(([modelName, model]) => {
    let validateMap: any = {};
    model.fields.forEach(field => {
      const key = camelCase(field.name)
      if (key in validateMap) {
        throw new Error(`Fields "${field.name}" and "${validateMap[key]}" in ${model.name} cannot be used at the same time which will result in the duplicate builder method.`);
      }
      validateMap[key] = field.name;
    });
  });
}