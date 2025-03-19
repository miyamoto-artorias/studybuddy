import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private uploadUrl = 'http://localhost:8081/files/upload';
  private downloadUrl = 'http://localhost:8081/files/';

  constructor(private http: HttpClient) {}

  uploadFile(file: globalThis.File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file); // Use 'image' as the key
  
    return this.http.post(this.uploadUrl, formData);
  }
  

  downloadFile(filename: string): Observable<Blob> {
    return this.http.get(`${this.downloadUrl}${filename}`, { responseType: 'blob' });
  }

}
