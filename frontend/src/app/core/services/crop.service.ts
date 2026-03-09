import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Crop {
  id: number;
  name: string;
  icon: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class CropService {
  private apiUrl = `${environment.apiBaseUrl}/crops`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Crop[]> {
    return this.http.get<Crop[]>(this.apiUrl);
  }

  getById(id: number): Observable<Crop> {
    return this.http.get<Crop>(`${this.apiUrl}/${id}`);
  }
}
