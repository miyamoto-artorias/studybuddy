import { Component, inject, input, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Dashboard, DASHBOARD, Widget } from '@elementar-ui/components';

@Component({
    selector: 'emr-customer-satisfaction-widget',
    imports: [
        MatIcon
    ],
    templateUrl: './customer-satisfaction-widget.component.html',
    styleUrl: './customer-satisfaction-widget.component.scss'
})
export class CustomerSatisfactionWidgetComponent implements OnInit {
  private _dashboard = inject<Dashboard>(DASHBOARD, { optional: true });

  widget = input<Widget>();

  ngOnInit() {
    if (this._dashboard && this.widget()) {
      this._dashboard.markWidgetAsLoaded(this.widget()?.id);
    }
  }
}
