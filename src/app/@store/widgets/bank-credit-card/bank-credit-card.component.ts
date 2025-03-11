import { Component, inject, input, OnInit } from '@angular/core';
import { DASHBOARD, Widget } from '@elementar-ui/components';

@Component({
    selector: 'emr-bank-credit-card',
    imports: [],
    templateUrl: './bank-credit-card.component.html',
    styleUrl: './bank-credit-card.component.scss'
})
export class BankCreditCardComponent implements OnInit {
  private _dashboard = inject<any>(DASHBOARD, { optional: true });

  widget = input<Widget>();

  ngOnInit() {
    if (this._dashboard && this.widget()) {
      this._dashboard.markWidgetAsLoaded(this.widget()?.id);
    }
  }
}
