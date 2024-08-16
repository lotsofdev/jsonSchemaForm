export type TJsonSchemaFormSettings = {
  classPrefix: string;
};

export type TJsonSchemaFormUpdateEvent = {
  values: any;
  update: TJsonSchemaFormUpdateObject;
};

export type TJsonSchemaFormUpdateObject = {
  path: string[];
  value: any;
};

export type TJsonSchemaFormWidget = {
  id: string;
  tag: string;
};
