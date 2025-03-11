import { Component, inject, input, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { Dashboard, DASHBOARD, Widget } from '@elementar-ui/components';

@Component({
  selector: 'emr-today-sales-widget',
  imports: [
    MatIcon,
    MatButton
  ],
  templateUrl: './today-sales-widget.component.html',
  styleUrl: './today-sales-widget.component.scss'
})
export class TodaySalesWidgetComponent implements OnInit {
  private _dashboard = inject<Dashboard>(DASHBOARD, { optional: true });

  widget = input<Widget>();

  ngOnInit() {
    if (this._dashboard && this.widget()) {
      this._dashboard.markWidgetAsLoaded(this.widget()?.id);
    }
  }
}
