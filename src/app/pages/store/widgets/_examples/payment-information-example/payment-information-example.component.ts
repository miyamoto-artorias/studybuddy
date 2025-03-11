import { Component } from '@angular/core';
import { PaymentInformationWidgetComponent } from '@store/widgets';

@Component({
    selector: 'app-payment-information-example',
    imports: [
        PaymentInformationWidgetComponent
    ],
    templateUrl: './payment-information-example.component.html',
    styleUrl: './payment-information-example.component.scss'
})
export class PaymentInformationExampleComponent {

}
