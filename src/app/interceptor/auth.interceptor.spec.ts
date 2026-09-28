import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '../service/apiservice';
import { fakeJwt } from '../testing/fake-jwt';
import { authInterceptor } from './auth.interceptor';

const BASE_URL = 'https://api.test/api';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  function setup(token: string | null): void {
    if (token !== null) {
      localStorage.setItem('packrat.accessToken', token);
    }
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
  }

  const validToken = () => fakeJwt({ exp: Date.now() / 1000 + 3600 });

  beforeEach(() => localStorage.clear());
  afterEach(() => httpMock.verify());

  it('attaches the bearer token to API requests', () => {
    const token = validToken();
    setup(token);

    http.get(`${BASE_URL}/collections`).subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/collections`);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    req.flush([]);
  });

  it('never sends the token to other hosts, including look-alike prefixes', () => {
    setup(validToken());

    for (const url of ['https://example.com/data', 'https://api.test/api.evil.com/steal']) {
      http.get(url).subscribe();
      const req = httpMock.expectOne(url);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    }
  });

  it('sends no header when the token is expired', () => {
    setup(fakeJwt({ exp: Date.now() / 1000 - 60 }));

    http.get(`${BASE_URL}/collections`).subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/collections`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('logs out when the backend rejects the token', () => {
    setup(validToken());
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    http.get(`${BASE_URL}/collections`).subscribe({ error: () => {} });
    httpMock
      .expectOne(`${BASE_URL}/collections`)
      .flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(localStorage.getItem('packrat.accessToken')).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
