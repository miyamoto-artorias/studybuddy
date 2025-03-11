import { Component, inject, input, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatRipple } from '@angular/material/core';
import { MatTooltip } from '@angular/material/tooltip';
import { Dashboard, DASHBOARD, Widget } from '@elementar-ui/components';

@Component({
    selector: 'emr-avg-click-rate-widget',
    imports: [
        MatIcon,
        MatRipple,
        MatTooltip
    ],
    templateUrl: './avg-click-rate-widget.component.html',
    styleUrl: './avg-click-rate-widget.component.scss'
})
export class AvgClickRateWidgetComponent implements OnInit {
  private _dashboard = inject<Dashboard>(DASHBOARD, { optional: true });

  widget = input<Widget>();

  ngOnInit() {
    if (this._dashboard && this.widget()) {
      this._dashboard.markWidgetAsLoaded(this.widget()?.id);
    }
  }
}
