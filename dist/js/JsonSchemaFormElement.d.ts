import __LitElement from '@lotsof/litElement';
import '../components/wysiwygWidget/wysiwygWidget.js';
import '../../src/css/JsonSchemaFormElement.bare.css';
import { IJsonSchemaFormWidget } from '../shared/JsonSchemaForm.types.js';
export default class JsonSchemaFormElement extends __LitElement {
    static widgets: Record<string, IJsonSchemaFormWidget>;
    static registerWidget(widget: IJsonSchemaFormWidget): void;
    accessor schema: any;
    accessor values: any;
    accessor classPrefix: string;
    accessor widgets: Record<string, IJsonSchemaFormWidget>;
    private _registeredWidgets;
    constructor();
    mount(): Promise<void>;
    private _findInSchema;
    private _validateValues;
    private _renderComponentValueErrors;
    private _renderComponentValueEditWidget;
    private _emitUpdate;
    private _createComponentDefaultValuesFromSchema;
    private _renderComponentValuesPreview;
    protected render(): import("lit-html").TemplateResult<1> | undefined;
}
