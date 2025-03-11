import { Component } from '@angular/core';
import { ExchangeWidgetComponent } from '@store/widgets';

@Component({
    selector: 'app-exchange-example',
    imports: [
        ExchangeWidgetComponent
    ],
    templateUrl: './exchange-example.component.html',
    styleUrl: './exchange-example.component.scss'
})
export class ExchangeExampleComponent {

}
