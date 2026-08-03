import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface JournalGalleryItem {
  id?: string;
  journalId?: string;
  imageUrl?: string;
  url: string;
  imageAlt?: string;
  alt?: string;
  sortOrder: number;
}

export interface JournalItem {
  id?: string;
  endpointPath: string;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt?: string;
  tags?: string;
  author?: string;
  creationDate?: string;
  lastUpdateDate?: string;
  isPublished: boolean;
  gallery: JournalGalleryItem[];
}

@Injectable({ providedIn: 'root' })
export class JournalsService {
  private readonly apiUrl = `${window.location.origin}/api`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<JournalItem[]> {
    return this.http.get<JournalItem[]>(`${this.apiUrl}/journals/get`);
  }

  get(id: string): Observable<JournalItem> {
    return this.http.get<JournalItem>(`${this.apiUrl}/journals/get/${id}`);
  }

  create(model: JournalItem): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/journals/create`, this.toRequest(model));
  }

  update(model: JournalItem): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/journals/update`, this.toRequest(model));
  }

  delete(id: string): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/journals/${id}`);
  }

  uploadMany(files: File[]): Observable<HttpEvent<{ urls: string[] }>> {
    const form = new FormData();
    files.forEach(file => form.append('gallery', file));
    return this.http.post<{ urls: string[] }>(
      `${this.apiUrl}/projects/uploadGallery`,
      form,
      { observe: 'events', reportProgress: true }
    );
  }

  normalize(item: JournalItem): JournalItem {
    const gallery: JournalGalleryItem[] = (item.gallery ?? [])
      .map((image, index): JournalGalleryItem => ({
        id: image.id,
        journalId: image.journalId,
        url: image.url || image.imageUrl || '',
        alt: image.alt || image.imageAlt || item.title,
        sortOrder: image.sortOrder ?? index
      }))
      .filter(image => Boolean(image.url));

    if (!gallery.length && item.imageUrl) {
      gallery.push({
        url: item.imageUrl,
        alt: item.imageAlt || item.title,
        sortOrder: 0
      });
    }

    return {
      ...item,
      gallery,
      imageUrl: gallery[0]?.url || item.imageUrl || '',
      imageAlt: gallery[0]?.alt || item.imageAlt || item.title
    };
  }

  private toRequest(model: JournalItem): JournalItem {
    const gallery = model.gallery.map((item, index) => ({
      ...item,
      url: item.url || item.imageUrl || '',
      alt: item.alt || item.imageAlt || model.title,
      sortOrder: index
    }));

    return {
      ...model,
      gallery,
      imageUrl: gallery[0]?.url || model.imageUrl,
      imageAlt: gallery[0]?.alt || model.imageAlt || model.title
    };
  }
}
