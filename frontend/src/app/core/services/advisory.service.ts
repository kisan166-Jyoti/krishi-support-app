import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Advisory {
  id: number;
  crop_id: number;
  crop_name: string;
  crop_icon: string;
  title: string;
  type: 'disease' | 'pest' | 'management';
  summary: string;
  symptoms: string;
  cause: string;
  solution: string;
  severity: 'low' | 'medium' | 'high';
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class AdvisoryService {
  private apiUrl = `${environment.apiBaseUrl}/advisories`;

  constructor(private http: HttpClient) {}

  getAll(cropId?: number, type?: string): Observable<Advisory[]> {
    let url = this.apiUrl;
    const params: string[] = [];
    if (cropId) params.push(`cropId=${cropId}`);
    if (type) params.push(`type=${type}`);
    if (params.length) url += '?' + params.join('&');
    return this.http.get<Advisory[]>(url);
  }

  getById(id: number): Observable<Advisory> {
    return this.http.get<Advisory>(`${this.apiUrl}/${id}`);
  }
}
