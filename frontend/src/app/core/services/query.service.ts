import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface QueryPayload {
  farmer_name: string;
  crop_id?: number;
  question: string;
}

export interface QueryResponse {
  id: number;
  farmer_name: string;
  crop_id: number | null;
  question: string;
  status: string;
  submitted_at: string;
}

@Injectable({ providedIn: 'root' })
export class QueryService {
  private apiUrl = 'http://localhost:5000/api/queries';

  constructor(private http: HttpClient) {}

  submit(payload: QueryPayload): Observable<QueryResponse> {
    return this.http.post<QueryResponse>(this.apiUrl, payload);
  }
}
