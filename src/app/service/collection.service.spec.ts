import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from './apiservice';
import { Collection, CollectionService } from './collection.service';

const BASE_URL = 'http://api.test/api';

describe('CollectionService', () => {
  let httpMock: HttpTestingController;
  let service: CollectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(CollectionService);
  });

  afterEach(() => httpMock.verify());

  it('lists the current user collections', () => {
    const collections: Collection[] = [
      { id: 'c1', userId: 'u1', name: 'One Piece', totalPricePaid: 45, totalPriceNow: null },
    ];
    let result: Collection[] | undefined;

    service.list().subscribe((c) => (result = c));
    const req = httpMock.expectOne(`${BASE_URL}/collections`);
    expect(req.request.method).toBe('GET');
    req.flush(collections);

    expect(result).toEqual(collections);
  });
});
