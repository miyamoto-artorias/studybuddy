import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PaymentAndCreditService {

  constructor(private http: HttpClient) { }


  getPaymentsByUser(userId: number) {
    return this.http.post<any[]>('http://localhost:8081/api/payments/byUser', { userId: userId });
  }
  

  // Fetch credit card details for a user
  getCardDetails(userId: number): Observable<any> {
    const url = `http://localhost:8081/api/cards/user/${userId}`;
    return this.http.get<any>(url).pipe(
      tap(card => console.log('Fetched card details:', card)),
      catchError(error => {
        console.error('Error fetching card details:', error);
        return throwError(() => error);
      })
    );
  }

  validateCard(cardData: { cardNumber: string; password: string }): Observable<any> {
    const url = 'http://localhost:8081/api/cards/validate-card';
    return this.http.post<any>(url, cardData).pipe(
      tap(response => console.log('Card validated successfully:', response)),
      catchError(error => {
        console.error('Card validation failed:', error);
        return throwError(() => error);
      })
    );
  }

  assignCardToUser(cardId: number, userId: number): Observable<any> {
    const url = `http://localhost:8081/api/cards/${cardId}/user/${userId}`;
    return this.http.put<any>(url, {}).pipe(
      tap(response => console.log('Card assigned to user successfully:', response)),
      catchError(error => {
        console.error('Failed to assign card to user:', error);
        return throwError(() => error);
      })
    );
  }
}
