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
    return this.http.get<any[]>('http://localhost:8081/api/payments/byUser', { params: { userId: userId } });
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
}
