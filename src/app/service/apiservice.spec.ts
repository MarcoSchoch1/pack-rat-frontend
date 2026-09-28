import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL, ApiError, ApiService } from './apiservice';

const BASE_URL = 'http://api.test/api';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
      ],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('prefixes paths with the base URL and passes query params', () => {
    let result: unknown;
    service.get('/collections', { page: 2 }).subscribe((body) => (result = body));

    const req = httpMock.expectOne(`${BASE_URL}/collections?page=2`);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: '1' }]);

    expect(result).toEqual([{ id: '1' }]);
  });

  it('sends the body for writes', () => {
    service.post('collections', { name: 'Pokémon' }).subscribe();
    service.put('items/1', { name: 'Charizard' }).subscribe();
    service.delete('items/1').subscribe();

    const post = httpMock.expectOne({ method: 'POST', url: `${BASE_URL}/collections` });
    expect(post.request.body).toEqual({ name: 'Pokémon' });
    const put = httpMock.expectOne({ method: 'PUT', url: `${BASE_URL}/items/1` });
    expect(put.request.body).toEqual({ name: 'Charizard' });
    httpMock.expectOne({ method: 'DELETE', url: `${BASE_URL}/items/1` }).flush(null);
    post.flush({});
    put.flush({});
  });

  it('maps the backend error body to an ApiError', () => {
    let error: ApiError | undefined;
    service.post('items', {}).subscribe({ error: (e: ApiError) => (error = e) });

    httpMock
      .expectOne(`${BASE_URL}/items`)
      .flush(
        { error: 'VALIDATION_ERROR', message: 'pricePaid must be positive', field: 'pricePaid' },
        { status: 400, statusText: 'Bad Request' },
      );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'pricePaid must be positive',
      field: 'pricePaid',
    });
  });

  it('maps a network failure to NETWORK_ERROR', () => {
    let error: ApiError | undefined;
    service.get('collections').subscribe({ error: (e: ApiError) => (error = e) });

    httpMock.expectOne(`${BASE_URL}/collections`).error(new ProgressEvent('error'));

    expect(error).toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });
});
