import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentAndCreditService } from '../../../services/payment-and-credit.service';
import { AuthService } from '../../../services/auth.service';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-credit-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './credit-card.component.html',
  styleUrls: ['./credit-card.component.scss']
})
export class CreditCardComponent implements OnInit {
  card: any = null;
  loading = true;
  error: string | null = null;
  cardForm: FormGroup;
  addingCard = false;
  cardAnimation = false;

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
    this.loadCardDetails();
  }
  
  loadCardDetails(): void {
    this.loading = true;
    this.error = null;
    
    const userId = this.authService.getUserId();
    this.paymentService.getCardDetails(userId).subscribe({
      next: (card) => {
        this.card = this.processCardData(card);
        this.loading = false;
        
        // Trigger card animation after loading
        setTimeout(() => {
          this.cardAnimation = true;
        }, 200);
      },
      error: (err) => {
        console.error('Failed to load card details:', err);
        this.error = 'Failed to load credit card details';
        this.loading = false;
      }
    });
  }
  
  // Process and format card data for display
  private processCardData(card: any): any {
    if (!card) return null;
    
    // Format card number if present (keep only last 4 digits)
    if (card.cardNumber) {
      card.maskedCardNumber = '••••';
      card.lastFourDigits = card.cardNumber.toString().slice(-4);
    } else {
      card.maskedCardNumber = '••••';
      card.lastFourDigits = '0000';
    }
    
    // Format balance for display
    if (card.balance) {
      card.formattedBalance = parseFloat(card.balance).toFixed(2);
    }
    
    return card;
  }
  addCard(): void {
    if (this.cardForm.invalid) {
      // Mark all fields as touched to show validation errors
      this.cardForm.markAllAsTouched();
      return;
    }

    const cardData = this.cardForm.value;
    this.addingCard = true;
    this.error = null;
    
    // First validate the card
    this.http.post('http://localhost:8081/api/cards/validate-card', cardData).subscribe({
      next: (response: any) => {
        console.log('Card validated successfully:', response);
        const userId = this.authService.getUserId();
        const cardId = response.id;

        // Then assign the card to the user
        this.http.put(`http://localhost:8081/api/cards/${cardId}/user/${userId}`, {}).subscribe({
          next: () => {
            console.log('Card assigned to user successfully');
            
            // Process the card data for display
            this.card = this.processCardData(response);
            this.addingCard = false;
            this.error = null;
            
            // Reset the form
            this.cardForm.reset();
            
            // Trigger card animation after loading
            setTimeout(() => {
              this.cardAnimation = true;
            }, 200);
          },
          error: (err) => {
            console.error('Failed to assign card to user:', err);
            this.error = 'Failed to assign card to your account. Please try again.';
            this.addingCard = false;
          }
        });
      },
      error: (err: HttpErrorResponse) => {
        console.error('Card validation failed:', err);
        if (err.status === 401) {
          this.error = 'Invalid card credentials. Please check your card number and password.';
        } else if (err.status === 404) {
          this.error = 'Card not found. Please enter a valid card number.';
        } else {
          this.error = 'Failed to validate card. Please try again later.';
        }
        this.addingCard = false;
      }
    });
  }
}
