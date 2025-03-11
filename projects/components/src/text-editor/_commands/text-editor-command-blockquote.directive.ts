import { Directive, inject } from '@angular/core';
import { TEXT_EDITOR, TextEditor } from '../types';

@Directive({
  selector: '[emrTextEditorCommandBlockquote]',
  exportAs: 'emrTextEditorCommandBlockquote',
  host: {
    '[disabled]': `textEditor && textEditor.api.isCommandDisabled('toggleBlockquote')`,
    '[class.active]': `textEditor && textEditor.api.isActive('blockquote')`,
    '(click)': `onClick()`
  }
})
export class TextEditorCommandBlockquoteDirective {
  protected textEditor = inject<TextEditor>(TEXT_EDITOR);

  protected onClick() {
    this.textEditor.api.runCommand('toggleBlockquote');
  }
}
