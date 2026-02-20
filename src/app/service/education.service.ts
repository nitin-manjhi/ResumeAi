import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class EducationService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = '/api/education';

    getDegrees(): Observable<string[]> {
        return this.http.get<string[]>(`${this.baseUrl}/degrees`);
    }

    getCollegesByState(stateName: string): Observable<string[]> {
        return this.http.get<string[]>(`${this.baseUrl}/collgeName/${stateName}`);
    }
}
