import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { API_BASE_URL } from '../service/apiservice';
import { Register } from './register';

const BASE_URL = 'http://api.test/api';

describe('Register', () => {
  let httpMock: HttpTestingController;

  async function setup(invite: string | null) {
    TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: BASE_URL },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(invite ? { invite } : {}) } },
        },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Register);
    await fixture.whenStable();
    return fixture;
  }

  async function fillAndSubmit(fixture: Awaited<ReturnType<typeof setup>>, confirm = 'at-least-8') {
    const el: HTMLElement = fixture.nativeElement;
    for (const [id, value] of [
      ['username', 'zoro'],
      ['password', 'at-least-8'],
      ['confirm-password', confirm],
    ]) {
      const input = el.querySelector<HTMLInputElement>(`#${id}`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => httpMock.verify());

  it('shows only the dead-link message without a token', async () => {
    const fixture = await setup(null);
    expect(fixture.nativeElement.textContent).toContain('invalid or expired');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('shows only the dead-link message when the invite is rejected', async () => {
    const fixture = await setup('dead');
    httpMock
      .expectOne(`${BASE_URL}/invites/dead`)
      .flush({ error: 'not found' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('invalid or expired');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('keeps the input and marks a taken username', async () => {
    const fixture = await setup('t1');
    httpMock
      .expectOne(`${BASE_URL}/invites/t1`)
      .flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();

    await fillAndSubmit(fixture);
    httpMock
      .expectOne(`${BASE_URL}/auth/register`)
      .flush({ error: 'taken' }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Username already taken');
    expect(el.querySelector<HTMLInputElement>('#username')!.value).toBe('zoro');
  });

  it('does not submit when the passwords differ', async () => {
    const fixture = await setup('t1');
    httpMock
      .expectOne(`${BASE_URL}/invites/t1`)
      .flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();

    await fillAndSubmit(fixture, 'something-else');
    httpMock.expectNone(`${BASE_URL}/auth/register`);
    expect(fixture.nativeElement.textContent).toContain("Passwords don't match");
  });

  it('registers with the invite token and goes to create collection', async () => {
    const fixture = await setup('t1');
    httpMock
      .expectOne(`${BASE_URL}/invites/t1`)
      .flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    await fillAndSubmit(fixture);
    const req = httpMock.expectOne(`${BASE_URL}/auth/register`);
    expect(req.request.body).toEqual({
      inviteToken: 't1',
      username: 'zoro',
      password: 'at-least-8',
    });
    req.flush({ expiresAt: new Date(Date.now() + 3_600_000).toISOString() });

    expect(navigate).toHaveBeenCalledWith('/collections/new');
  });
});
