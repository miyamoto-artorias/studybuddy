import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

interface FileData {
  id: number;
  fileName: string;
  fileType: string;
  filePath: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private uploadUrl = 'http://localhost:8081/files/upload';
  private downloadUrl = 'http://localhost:8081/files/';
  private allDataUrl = 'http://localhost:8081/files/all';

  constructor(private http: HttpClient) {}

  uploadFile(file: globalThis.File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file); // Use 'image' as the key
  
    return this.http.post(this.uploadUrl, formData);
  }
  
  getAll(filename: string): Observable<Blob> {
    return this.http.get(`${this.downloadUrl}all`, { responseType: 'blob' });
  }

  getAllFiles(): Observable<FileData[]> {
    return this.http.get<FileData[]>(this.allDataUrl);
  }

  


  downloadFile(filename: string): Observable<Blob> {
    return this.http.get(`${this.downloadUrl}${filename}`, { responseType: 'blob' });
  }
  

}
