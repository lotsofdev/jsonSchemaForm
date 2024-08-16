import __LitElement from '@lotsof/lit-element';

import { Draft, Draft2019, JsonError } from 'json-schema-library';

// import '../components/wysiwygWidget/wysiwygWidget.js';

import { html } from 'lit';
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

  @property({ type: String })
  accessor classPrefix: string = 's-json-schema-form';

  @property({ type: Object })
  accessor widgets: Record<string, TJsonSchemaFormWidget> = {};

  private _registeredWidgets: Record<string, TJsonSchemaFormWidget> = {};

  constructor() {
    super('json-schema-form');
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

  private _renderComponentValueErrors(errors: JsonError[]): any {
    return html`
      <ul class=${this.cls('_values-errors')}>
        ${errors.map(
          (error) => html`
            <li class=${this.cls('_values-error')}>
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

    // handle default value
    if (value === null && schema.default !== undefined) {
      __set(this.values, path, schema.default);
      value = schema.default;
    }

    // validate the value
    let renderedErrors = '';
    const errors = this._validateValues(schema, value);
    if (errors.length) {
      renderedErrors = this._renderComponentValueErrors(errors);
    }

    if (schema) {
      switch (true) {
        case schema.enum !== undefined:
          return html`<select
              class=${`${this.cls('_values-select')} form-select`}
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
              .value=${value ?? ''}
              class=${this.cls('_values-input')}
              @input=${(e: any) => {
                __set(this.values, path, e.target.value);
              }}
              @change=${(e) => {
                this._emitUpdate({
                  value: e.target.value,
                  path,
                });
              }}
            />
            ${renderedErrors} `;
          break;
        case schema.type === 'boolean':
          return html`<input
            type="checkbox"
            .checked=${value}
            class=${`${this.cls('_values-checkbox')} form-checkbox`}
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
            .value=${value}
            min=${schema.minimum}
            max=${schema.maximum}
            class=${`${this.cls('_values-input')} form-input form-number`}
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
            ${Object.entries(schema.properties).map(
              ([key, value]) => html`
                <li class=${this.cls('_values-item')}>
                  <div
                    class=${this.cls('_values-prop')}
                    style="--prop-length: ${key.length}"
                  >
                    ${(<any>value).title ?? key}
                  </div>
                  ${this._renderComponentValuesPreview(schema.properties[key], [
                    ...path,
                    key,
                  ])}
                </li>
              `,
            )}
          </ul>
        `;
        break;
      case schema.type === 'array' && schema.items !== undefined:
        return html`
          <ul class=${this.cls('_values-array')}>
            ${values?.length &&
            values.map(
              (value, i) => html`
                <li class=${this.cls('_values-item')}>
                  <div class=${this.cls('_values-index')}>${i}</div>
                  ${this._renderComponentValuesPreview(schema.items, [
                    ...path,
                    `${i}`,
                  ])}
                </li>
              `,
            )}
            <button
              class=${this.cls('_values-add')}
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
              Add
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
    console.log('SSS', this.schema);

    if (this.schema) {
      return html`
        <div class=${this.cls('_component')}>
          <div class=${this.cls('_values')}>
            ${this._renderComponentValuesPreview(this.schema)}
          </div>
        </div>
      `;
    }
  }
}

JsonSchemaFormElement.define('s-json-schema-form', JsonSchemaFormElement, {});
