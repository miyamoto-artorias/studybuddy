import {
  AfterContentInit,
  Component,
  contentChild,
  contentChildren,
  input,
  TemplateRef
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NotificationDefDirective } from '../notification-def.directive';
import { NotificationControlsDefDirective } from '../notification-controls-def.directive';
import { Notification } from '../types';

@Component({
  selector: 'emr-notification-list',
  exportAs: 'emrNotificationList',
  imports: [
    NgTemplateOutlet
  ],
  templateUrl: './notification-list.component.html',
  styleUrl: './notification-list.component.scss',
  host: {
    'class': 'emr-notification-list'
  }
})
export class NotificationListComponent<T extends Notification> implements AfterContentInit {
  readonly defs = contentChildren(NotificationDefDirective);
  readonly controlsDef = contentChild(NotificationControlsDefDirective);

  notifications = input<T[]>([]);

  protected _initialized = false;
  protected _defsMap = new Map<string, TemplateRef<any>>();

  get controlsTpl(): TemplateRef<any> {
    return this.controlsDef()?.templateRef as TemplateRef<any>;
  }

  ngAfterContentInit() {
    this.defs().forEach((def: NotificationDefDirective) => {
      this._defsMap.set(def.emrNotificationDef(), def.templateRef);
    });
    this._initialized = true;
  }

  getNotificationTemplate(type: string): TemplateRef<any> {
    if (!this._defsMap.has(type)) {
      throw new Error(`Invalid type "${type}" for notification def`);
    }

    return this._defsMap.get(type) as TemplateRef<any>;
  }
}
