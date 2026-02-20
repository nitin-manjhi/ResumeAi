import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class LocationService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = '/api/locations';

    getStates(): Observable<string[]> {
        return this.http.get<string[]>(`${this.baseUrl}/states`);
    }

    getCities(stateName: string): Observable<string[]> {
        return this.http.get<string[]>(`${this.baseUrl}/cities/${stateName}`);
    }
}
