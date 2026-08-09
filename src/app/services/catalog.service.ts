import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CatalogServiceItem {
  id: number;
  title: string;
  description: string | null;
  price: number | string;
  images: string[] | null;
  image_urls: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCatalogServicePayload {
  title: string;
  description?: string | null;
  price: number;
  is_active?: boolean;
}

export interface CatalogServicesApiResponse {
  status: string;
  data: CatalogServiceItem[];
}

export interface CatalogServiceApiResponse {
  status: string;
  message?: string;
  data: CatalogServiceItem;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/services`;

  getServices(): Observable<CatalogServicesApiResponse> {
    return this.http.get<CatalogServicesApiResponse>(this.apiUrl);
  }

  createService(payload: CreateCatalogServicePayload, images?: File[]): Observable<CatalogServiceApiResponse> {
    const formData = this.toFormData(payload, images);
    return this.http.post<CatalogServiceApiResponse>(this.apiUrl, formData);
  }

  updateService(id: number, payload: Partial<CreateCatalogServicePayload>): Observable<CatalogServiceApiResponse> {
    return this.http.put<CatalogServiceApiResponse>(`${this.apiUrl}/${id}`, payload);
  }

  deleteService(id: number): Observable<{ status: string; message: string }> {
    return this.http.delete<{ status: string; message: string }>(`${this.apiUrl}/${id}`);
  }

  uploadImages(id: number, images: File[]): Observable<CatalogServiceApiResponse> {
    const formData = new FormData();
    images.forEach(image => formData.append('images[]', image));
    return this.http.post<CatalogServiceApiResponse>(`${this.apiUrl}/${id}/images`, formData);
  }

  deleteImage(id: number, imagePath: string): Observable<CatalogServiceApiResponse> {
    return this.http.delete<CatalogServiceApiResponse>(`${this.apiUrl}/${id}/images`, {
      body: { image_path: imagePath },
    });
  }

  private toFormData(payload: CreateCatalogServicePayload, images?: File[]): FormData {
    const formData = new FormData();
    formData.append('title', payload.title);
    if (payload.description) {
      formData.append('description', payload.description);
    }
    formData.append('price', String(payload.price));
    if (payload.is_active !== undefined) {
      formData.append('is_active', payload.is_active ? '1' : '0');
    }
    (images ?? []).forEach(image => formData.append('images[]', image));
    return formData;
  }
}
