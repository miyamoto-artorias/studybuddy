import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentAndCreditService } from '../../../services/payment-and-credit.service';
import { AuthService } from '../../../services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-credit-card',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './credit-card.component.html',
  styleUrls: ['./credit-card.component.scss']
})
export class CreditCardComponent implements OnInit {
  card: any = null;
  loading = true;
  error: string | null = null;
  cardForm: FormGroup;
  addingCard = false;

  constructor(
    private paymentService: PaymentAndCreditService,
    private authService: AuthService,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.cardForm = this.fb.group({
      cardNumber: ['', [Validators.required, Validators.pattern('^[0-9]{4}$')]],
      password: ['', Validators.required]
    });
  }

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

  addCard(): void {
    if (this.cardForm.invalid) return;

    const cardData = this.cardForm.value;
    this.addingCard = true;
    this.http.post('http://localhost:8081/api/cards/validate-card', cardData).subscribe({
      next: (response: any) => {
        console.log('Card validated successfully:', response);
        const userId = this.authService.getUserId();
        const cardId = response.id;

        this.http.put(`http://localhost:8081/api/cards/${cardId}/user/${userId}`, {}).subscribe({
          next: () => {
            console.log('Card assigned to user successfully');
            this.card = response;
            this.addingCard = false;
            this.error = null;
          },
          error: (err) => {
            console.error('Failed to assign card to user:', err);
            this.error = 'Failed to assign card to user';
            this.addingCard = false;
          }
        });
      },
      error: (err: HttpErrorResponse) => {
        console.error('Card validation failed:', err);
        this.error = err.status === 401 ? 'Invalid card details' : 'Failed to validate card';
        this.addingCard = false;
      }
    });
  }
}
