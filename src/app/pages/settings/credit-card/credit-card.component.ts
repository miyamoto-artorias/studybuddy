import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentAndCreditService } from '../../../services/payment-and-credit.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-credit-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './credit-card.component.html',
  styleUrls: ['./credit-card.component.scss']
})
export class CreditCardComponent implements OnInit {
  card: any = null;
  loading = true;
  error: string | null = null;

  constructor(
    private paymentService: PaymentAndCreditService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getUserId();
    this.paymentService.getCardDetails(userId).subscribe({
      next: (card) => {
        this.card = card;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load card details:', err);
        this.error = 'Failed to load credit card details';
        this.loading = false;
      }
    });
  }
}
