import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from './apiservice';
import { AuthService } from './auth.service';

const BASE_URL = 'http://api.test/api';
const inOneHour = () => new Date(Date.now() + 3_600_000).toISOString();

describe('AuthService', () => {
  let httpMock: HttpTestingController;

  function setup(): AuthService {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: BASE_URL },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    return TestBed.inject(AuthService);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => httpMock.verify());

  it('stores only expiresAt from login', () => {
    const auth = setup();
    const expiresAt = inOneHour();

    auth.login({ username: 'marco', password: 'secret' }).subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/auth/login`);
    expect(req.request.body).toEqual({ username: 'marco', password: 'secret' });
    req.flush({ expiresAt });

    expect(auth.isAuthenticated()).toBe(true);
    expect(localStorage.getItem('packrat.expiresAt')).toBe(String(Date.parse(expiresAt)));
  });

  it('restores a live session from storage', () => {
    localStorage.setItem('packrat.expiresAt', String(Date.now() + 3_600_000));
    expect(setup().isAuthenticated()).toBe(true);
  });

  it('treats expired, missing and garbage expiry as logged out', () => {
    for (const stored of [String(Date.now() - 1), null, 'garbage']) {
      TestBed.resetTestingModule();
      localStorage.clear();
      if (stored !== null) localStorage.setItem('packrat.expiresAt', stored);
      expect(setup().isAuthenticated()).toBe(false);
    }
  });

  it('removes a token left by the old version', () => {
    localStorage.setItem('packrat.accessToken', 'old.jwt.value');
    setup();
    expect(localStorage.getItem('packrat.accessToken')).toBeNull();
  });

  it('calls the backend, clears the session and navigates to login on logout', () => {
    localStorage.setItem('packrat.expiresAt', String(Date.now() + 3_600_000));
    const auth = setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    auth.logout();
    httpMock.expectOne({ method: 'POST', url: `${BASE_URL}/auth/logout` }).flush(null);

    expect(auth.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('packrat.expiresAt')).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('still ends the local session when the logout call fails', () => {
    localStorage.setItem('packrat.expiresAt', String(Date.now() + 3_600_000));
    const auth = setup();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    auth.logout();
    httpMock
      .expectOne(`${BASE_URL}/auth/logout`)
      .flush(null, { status: 500, statusText: 'Server Error' });

    expect(auth.isAuthenticated()).toBe(false);
  });
});
