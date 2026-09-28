import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { fakeJwt } from '../testing/fake-jwt';
import { API_BASE_URL } from './apiservice';
import { AuthService } from './auth.service';

const BASE_URL = 'http://api.test/api';

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

  it('stores the token returned by login', () => {
    const auth = setup();
    const token = fakeJwt({ exp: Date.now() / 1000 + 3600 });

    auth.login({ username: 'marco', password: 'secret' }).subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/auth/login`);
    expect(req.request.body).toEqual({ username: 'marco', password: 'secret' });
    req.flush({ jwtAccessToken: token });

    expect(auth.accessToken()).toBe(token);
    expect(localStorage.getItem('packrat.accessToken')).toBe(token);
  });

  it('restores a valid token from storage', () => {
    const token = fakeJwt({ exp: Date.now() / 1000 + 3600 });
    localStorage.setItem('packrat.accessToken', token);

    expect(setup().isAuthenticated()).toBe(true);
  });

  it('treats expired, exp-less and malformed tokens as absent', () => {
    for (const token of [fakeJwt({ exp: Date.now() / 1000 - 1 }), fakeJwt({}), 'not-a-jwt']) {
      TestBed.resetTestingModule();
      localStorage.setItem('packrat.accessToken', token);
      expect(setup().accessToken()).toBeNull();
    }
  });

  it('clears the token and navigates to login on logout', () => {
    localStorage.setItem('packrat.accessToken', fakeJwt({ exp: Date.now() / 1000 + 3600 }));
    const auth = setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    auth.logout();

    expect(auth.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('packrat.accessToken')).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
