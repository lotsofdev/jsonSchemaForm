export interface IJsonSchemaFormSettings {
  classPrefix: string;
}

export interface IJsonSchemaFormUpdateEvent {
  values: any;
  update: IJsonSchemaFormUpdateObject;
}

export interface IJsonSchemaFormUpdateObject {
  path: string[];
  value: any;
}

export interface IJsonSchemaFormWidget {
  id: string;
  tag: string;
}
