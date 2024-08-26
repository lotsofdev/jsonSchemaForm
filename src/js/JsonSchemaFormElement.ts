import __LitElement from '@lotsof/lit-element';

import { Draft, Draft2019, JsonError } from 'json-schema-library';

// import '../components/wysiwygWidget/wysiwygWidget.js';

import { html, nothing, PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { literal, html as staticHtml, unsafeStatic } from 'lit/static-html.js';

import { __deepMap, __get, __set } from '@lotsof/sugar/object';

import '../../src/css/JsonSchemaFormElement.bare.css';
import {
  TJsonSchemaFormUpdateObject,
  TJsonSchemaFormWidget,
} from '../shared/JsonSchemaForm.types.js';

export default class JsonSchemaFormElement extends __LitElement {
  public static widgets: Record<string, TJsonSchemaFormWidget> = {};
  public static registerWidget(widget: TJsonSchemaFormWidget): void {
    this.widgets[widget.id] = widget;
  }

  @property({ type: Object })
  accessor schema: any = {};

  @property({ type: Object })
  accessor values: any = {};

  @property({ type: Boolean })
  accessor formClasses: boolean = false;

  @property()
  accessor buttonClasses: boolean | string = false;

  @property({ type: Object })
  accessor widgets: Record<string, TJsonSchemaFormWidget> = {};

  private _registeredWidgets: Record<string, TJsonSchemaFormWidget> = {};

  private _errorsByPath: Record<string, JsonError[]> = {};

  constructor() {
    super('s-json-schema-form');
  }

  public get $form(): HTMLFormElement | null {
    const $field = this.querySelector('input, select, textarea') as any;
    return $field?.form ?? null;
  }

  async mount() {
    // handle the widgets
    this._registeredWidgets = {
      wysiwyg: {
        id: 'wysiwyg',
        tag: 's-json-schema-form-wysiwyg-widget',
      },
      ...this.widgets,
      ...JsonSchemaFormElement.widgets,
    };
  }

  protected update(changedProperties: PropertyValues): void {
    super.update(changedProperties);

    // handle the "-invalid" class on the form
    if (this.$form) {
      if (this.$form.checkValidity()) {
        this.$form.classList.remove('-invalid');
      } else {
        this.$form.classList.add('-invalid');
      }
    }
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    // handle form submit.
    // this will prevent the form to be submitted if
    // any field is invalid
    this._handleFormSubmit();
  }

  private _handleFormSubmit(): void {
    const $form = this.$form;
    if (!$form) return;
    // override the "checkValidity" method to check
    // if there's any errors in the form
    const originalCheck = $form.checkValidity;
    $form.checkValidity = () => {
      if (!originalCheck.call($form)) {
        return false;
      }
      if (Object.keys(this._errorsByPath).length) {
        return false;
      }
      return true;
    };
  }

  private _findInSchema(schema: any, path: string[]): any {
    const foundSchema = path.reduce((acc, key) => {
      if (acc?.properties?.[key]) {
        return acc.properties[key];
      }
      if (acc?.items?.properties?.[key]) {
        return acc.items.properties[key];
      }
      if (acc?.[key] !== undefined) {
        return acc[key];
      }
      return null;
    }, schema);

    return foundSchema;
  }

  private _validateValues(schema: any, value: any): JsonError[] {
    const jsonSchema: Draft = new Draft2019(schema),
      errors: JsonError[] = jsonSchema.validate(value);
    return errors;
  }

  private _renderComponentValueErrors(path: string[]): any {
    const errors = this._errorsByPath[path.join('.')] ?? [];

    if (!errors.length) return '';

    return html`
      <ul class=${`${this.cls('_values-errors')} errors`}>
        ${errors.map(
          (error) => html`
            <li class=${`${this.cls('_values-error error')} error`}>
              ${error.message
                .replace('in `#`', '')
                .replace('at `#`', '')
                .trim()}
            </li>
          `,
        )}
      </ul>
    `;
  }

  private _renderComponentValueEditWidget(value: any, path: string[]): any {
    // remove the numerical indexes in the path.
    // this is due to the fact that the schema is not
    // aware of the array indexes
    const pathWithoutIndexes = path.filter((p) => isNaN(parseInt(p)));

    // get the schema for the current path
    const schema = this._findInSchema(this.schema, pathWithoutIndexes);

    // get the field name
    const fieldName = path[path.length - 1];

    // handle default value
    if (value === null && schema.default !== undefined) {
      __set(this.values, path, schema.default);
      value = schema.default;
    }

    // validate the value
    let renderedErrors = '';
    const errors = this._validateValues(schema, value);
    if (errors.length) {
      this._errorsByPath[path.join('.')] = errors;
      this.requestUpdate();
    } else {
      delete this._errorsByPath[path.join('.')];
    }

    if (schema) {
      switch (true) {
        case schema.enum !== undefined:
          return html`<select
              id="${this.getIdFromPath(path)}"
              name=${fieldName}
              class=${`${this.cls('_values-select')} ${
                this.formClasses ? 'form-select' : ''
              }`}
              autofocus=${schema.autofocus ?? nothing}
              @change=${(e) => {
                __set(this.values, path, e.target.value);
                this._emitUpdate({
                  value: e.target.value,
                  path,
                });
              }}
            >
              ${schema.enum.map((v) => {
                return html`<option value=${v} ?selected=${v === value}>
                  ${v}
                </option>`;
              })}
            </select>
            ${renderedErrors} `;
          break;
        case schema.type === 'string':
          return html`<input
            type="text"
            name=${fieldName}
            .value=${value ?? ''}
            id="${this.getIdFromPath(path)}"
            class=${`${this.cls('_values-input')} ${
              this.formClasses ? 'form-input' : ''
            }`}
            autofocus=${schema.autofocus ?? nothing}
            placeholder=${schema.placeholder ?? ''}
            @input=${(e: any) => {
              __set(this.values, path, e.target.value);
            }}
            @change=${(e) => {
              this._emitUpdate({
                value: e.target.value,
                path,
              });
            }}
          />`;
          break;
        case schema.type === 'boolean':
          return html`<input
            type="checkbox"
            name=${fieldName}
            .checked=${value}
            id="${this.getIdFromPath(path)}"
            class=${`${this.cls('_values-checkbox')} ${
              this.formClasses ? 'form-checkbox' : ''
            }`}
            autofocus=${schema.autofocus ?? nothing}
            @change=${(e) => {
              __set(this.values, path, e.target.checked);
              this._emitUpdate({
                value: e.target.checked,
                path,
              });
            }}
          />`;
          break;
        case schema.type === 'number':
          return html`<input
            type="number"
            name=${fieldName}
            .value=${value}
            min=${schema.minimum}
            max=${schema.maximum}
            id="${this.getIdFromPath(path)}"
            class=${`${this.cls('_values-input')} ${
              this.formClasses ? 'form-input form-number' : ''
            }`}
            autofocus=${schema.autofocus ?? nothing}
            @input=${(e: any) => {
              __set(this.values, path, parseFloat(e.target.value));
            }}
            @change=${(e) => {
              this._emitUpdate({
                value: e.target.value,
                path,
              });
            }}
          />`;
          break;
      }
    }

    return typeof value === 'number'
      ? html`<span class="-number">${value}</span>`
      : value === true
      ? html`<span class="-true">true</span>`
      : value === false
      ? html`<span class="-false">false</span>`
      : value === null
      ? html`<span class="-null">null</span>`
      : value === undefined
      ? html`<span class="-undefined">undefined</span>`
      : value;
  }

  private async _emitUpdate(
    update: TJsonSchemaFormUpdateObject,
  ): Promise<void> {
    // dispatch the update
    this.dispatch('update', {
      detail: {
        values: this.values,
        update,
      },
    });

    // update the component
    this.requestUpdate();
  }

  private _createComponentDefaultValuesFromSchema(schema: any): any {
    const newValues: any = {};

    __deepMap(schema, ({ object, prop, value, path }) => {
      if (object.type !== 'object' && prop === 'type') {
        const finalPath = path
          .split('.')
          .filter((p) => p !== 'properties' && p !== 'items' && p !== 'type');
        let newValue: any = object.default;

        if (newValue === undefined) {
          switch (true) {
            case object.enum !== undefined:
              newValue = object.enum[0];
              break;
              break;
            case value === 'string':
              newValue = '';
              break;
            case value === 'boolean':
              newValue = false;
              break;
            case value === 'number':
              if (object.minimum !== undefined) {
                newValue = object.minimum;
              } else {
                newValue = 0;
              }

              break;
          }
        }

        __set(newValues, finalPath, newValue);
      }
      return value;
    });

    return newValues;
  }

  public getIdFromPath(path: string[]): string {
    return `${this.tagName.toLowerCase()}-value-${path.join('-')}`;
  }

  private _renderComponentValuesPreview(schema: any, path: string[] = []): any {
    // get the values for the current path
    const values = __get(this.values, path);

    // check if we have a widget specified and that it is available
    if (schema.widget) {
      if (!this._registeredWidgets[schema.widget]) {
        throw new Error(
          `The widget "${schema.widget}" is not registered in carpenter. Make sure to register it using SCarpenterElement.registerWidget static method...`,
        );
      }
      const tag = literal`${unsafeStatic(
        this._registeredWidgets[schema.widget].tag,
      )}`;
      return staticHtml`
        <${tag} @s-carpenter.update=${(e) => {
        __set(this.values, path, e.detail);
        this._emitUpdate({
          value: e.detail,
          path,
        });
      }}></${tag}>
      `;
    }

    switch (true) {
      case schema.type === 'object' && schema.properties !== undefined:
        return html`
          <ul class=${this.cls('_values-object')}>
            ${Object.entries(schema.properties).map(([key, value]) => {
              if (value.type === 'object') {
                return html`
                  <li class=${this.cls('_values-object-item')}>
                    <header class="${this.cls('_values-object-item-header')}">
                      <h3 class="${this.cls('_values-object-item-title')}">
                        ${(<any>value).title ?? key}
                      </h3>
                    </header>
                    ${this._renderComponentValuesPreview(
                      schema.properties[key],
                      [...path, key],
                    )}
                    ${this._renderComponentValueErrors([...path, key])}
                  </li>
                `;
              } else {
                return html`
                  <li class=${this.cls('_values-item _values-item-object')}>
                    <label
                      for="${this.getIdFromPath([...path, key])}"
                      class="${this.cls('_values-label')} ${this.formClasses
                        ? 'form-label'
                        : ''}"
                    >
                      <div
                        class=${this.cls('_values-prop')}
                        style="--prop-length: ${key.length}"
                      >
                        ${(<any>value).title ?? key}
                      </div>
                    </label>
                    ${this._renderComponentValuesPreview(
                      schema.properties[key],
                      [...path, key],
                    )}
                    ${this._renderComponentValueErrors([...path, key])}
                  </li>
                `;
              }
            })}
          </ul>
        `;
        break;
      case schema.type === 'array' && schema.items !== undefined:
        return html`
          <ul class=${this.cls('_values-array')}>
            ${values?.length &&
            values.map(
              (value, i) => html`
                <li class=${this.cls('_values-array-item')}>
                  <div class=${this.cls('_values-array-item-header')}>
                    ${value.id
                      ? html`
                          <h3 class="${this.cls('_values-array-item-index')}">
                            ${i}
                          </h3>
                          <h4 class="${this.cls('_values-array-item-id')}">
                            ${value.id}
                          </h4>
                        `
                      : html`
                          <span class="${this.cls('_values-array-item-index')}"
                            >${i}</span
                          >
                        `}
                  </div>
                  ${this._renderComponentValuesPreview(schema.items, [
                    ...path,
                    `${i}`,
                  ])}
                  ${this._renderComponentValueErrors([...path, `${i}`])}
                </li>
              `,
            )}
            <button
              class=${`${this.cls('_values-add')} ${
                this.buttonClasses === true
                  ? 'button -outline'
                  : typeof this.buttonClasses === 'string'
                  ? this.buttonClasses
                  : ''
              }`}
              @click=${() => {
                const newValues = this._createComponentDefaultValuesFromSchema(
                  schema.items,
                );
                if (!values) {
                  __set(this.values, path, [newValues]);
                } else {
                  values.push(newValues);
                }
                this.requestUpdate();
              }}
            >
              Add a ${schema.items.title?.toLowerCase() ?? 'new item'}
            </button>
          </ul>
        `;
        break;
      default:
        return html`
          <div class=${this.cls('_values-value')}>
            ${this._renderComponentValueEditWidget(values, path)}
          </div>
        `;
        break;
    }
  }

  protected render() {
    if (this.schema) {
      return html`
        <div class=${this.cls('_inner')}>
          <div class=${this.cls('_values')}>
            ${this._renderComponentValuesPreview(this.schema)}
          </div>
        </div>
      `;
    }
  }
}

JsonSchemaFormElement.define('s-json-schema-form', JsonSchemaFormElement, {});
