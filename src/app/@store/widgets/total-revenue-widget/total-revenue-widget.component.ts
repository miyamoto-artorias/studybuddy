import { Component, inject, input, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Dashboard, DASHBOARD, Widget } from '@elementar-ui/components';

@Component({
  selector: 'emr-total-revenue-widget',
  imports: [
    MatIcon,
  ],
  templateUrl: './total-revenue-widget.component.html',
  styleUrl: './total-revenue-widget.component.scss'
})
export class TotalRevenueWidgetComponent implements OnInit {
  private _dashboard = inject<Dashboard>(DASHBOARD, { optional: true });

  widget = input<Widget>();

  ngOnInit() {
    if (this._dashboard && this.widget()) {
      this._dashboard.markWidgetAsLoaded(this.widget()?.id);
    }
  }
}
