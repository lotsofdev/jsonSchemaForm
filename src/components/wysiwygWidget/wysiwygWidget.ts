import __LitElement from '@lotsof/lit-element';

import __EditorJS from '@editorjs/editorjs';
import __Embed from '@editorjs/embed';
import __Header from '@editorjs/header';
import __Link from '@editorjs/link';
import __NestedList from '@editorjs/nested-list';
import __Paragraph from '@editorjs/paragraph';
import __Quote from '@editorjs/quote';
import __Underline from '@editorjs/underline';

import { html, PropertyValues } from 'lit';

import { customElement } from 'lit/decorators.js';

import '../../../src/components/wysiwygWidget/wysiwygWidget.css';

@customElement('s-carpenter-wysiwyg-widget')
export default class CarpenterWysiwygWidget extends __LitElement {
  // @ts-ignore
  private _editor: __EditorJS;

  constructor() {
    super();
  }

  async mount() {}

  public firstUpdated(_changedProperties: PropertyValues): void {
    // init editor js
    // @ts-ignore
    this._editor = new __EditorJS({
      placeholder: 'Let`s write an awesome story!',
      holder: 's-json-schema-form-wysiwyg-widget-editor-js',
      tools: {
        header: __Header,
        paragraph: {
          class: __Paragraph,
          inlineToolbar: true,
        },
        list: {
          class: __NestedList,
          inlineToolbar: true,
          config: {
            defaultStyle: 'unordered',
          },
        },
        quote: {
          class: __Quote,
          inlineToolbar: true,
        },
        link: __Link,
        embed: __Embed,
        underline: __Underline,
      },
    });
  }

  protected render(): any {
    return html` <div id="s-json-schema-form-wysiwyg-widget-editor-js"></div>`;
  }
}
