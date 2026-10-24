import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '../service/apiservice';
import { authInterceptor } from './auth.interceptor';

const BASE_URL = 'https://api.test/api';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: BASE_URL },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });
  afterEach(() => httpMock.verify());

  it('sends API requests with credentials and no Authorization header', () => {
    http.get(`${BASE_URL}/collections`).subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/collections`);
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('never sends credentials to other hosts, including look-alike prefixes', () => {
    for (const url of ['https://example.com/data', 'https://api.test/api.evil.com/steal']) {
      http.get(url).subscribe();
      const req = httpMock.expectOne(url);
      expect(req.request.withCredentials).toBe(false);
      req.flush({});
    }
  });

  it('ends the session when the backend answers 401', () => {
    localStorage.setItem('packrat.expiresAt', String(Date.now() + 3_600_000));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    http.get(`${BASE_URL}/collections`).subscribe({ error: () => {} });
    httpMock
      .expectOne(`${BASE_URL}/collections`)
      .flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(localStorage.getItem('packrat.expiresAt')).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
