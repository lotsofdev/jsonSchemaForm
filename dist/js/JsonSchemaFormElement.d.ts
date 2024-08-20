import __LitElement from '@lotsof/lit-element';
import '../../src/css/JsonSchemaFormElement.bare.css';
import { TJsonSchemaFormWidget } from '../shared/JsonSchemaForm.types.js';
export default class JsonSchemaFormElement extends __LitElement {
    static widgets: Record<string, TJsonSchemaFormWidget>;
    static registerWidget(widget: TJsonSchemaFormWidget): void;
    accessor schema: any;
    accessor values: any;
    accessor formClasses: boolean;
    accessor buttonClasses: boolean | string;
    accessor widgets: Record<string, TJsonSchemaFormWidget>;
    private _registeredWidgets;
    private _errorsByPath;
    constructor();
    mount(): Promise<void>;
    private _findInSchema;
    private _validateValues;
    private _renderComponentValueErrors;
    private _renderComponentValueEditWidget;
    private _emitUpdate;
    private _createComponentDefaultValuesFromSchema;
    getIdFromPath(path: string[]): string;
    private _renderComponentValuesPreview;
    protected render(): import("lit-html").TemplateResult<1> | undefined;
}
