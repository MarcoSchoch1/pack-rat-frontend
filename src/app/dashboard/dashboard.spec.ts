import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '../service/apiservice';
import { Dashboard } from './dashboard';

const BASE_URL = 'http://api.test/api';

describe('Dashboard', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('shows the collection with totals converted to CHF', async () => {
    const fixture = TestBed.createComponent(Dashboard);
    const collection = {
      id: 'c1',
      userId: 'u1',
      name: 'One Piece',
      totalPricePaid: null,
      totalPriceNow: null,
    };

    httpMock.expectOne(`${BASE_URL}/collections`).flush([collection]);
    httpMock.expectOne(`${BASE_URL}/collections/c1/items`).flush([
      { id: 'i1', name: 'Luffy Alt Art', pricePaid: 45, priceNow: null, currency: 'CHF' },
      { id: 'i2', name: 'Zoro OP04', pricePaid: 100, priceNow: 200, currency: 'EUR' },
    ]);
    httpMock.expectOne(`${BASE_URL}/items/i1/images`).flush([{ id: 'img1', itemId: 'i1' }]);
    httpMock.expectOne(`${BASE_URL}/items/i2/images`).flush([]);
    await fixture.whenStable();

    const images = (fixture.nativeElement as HTMLElement).querySelectorAll('img');
    expect(images.length).toBe(1);
    expect(images[0].getAttribute('src')).toBe(`${BASE_URL}/images/img1`);

    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('One Piece');
    expect(text).toContain('Luffy Alt Art');
    // Paid: 45 CHF + 100 EUR (94 CHF). Now: only the EUR item has a price, 200 EUR (188 CHF).
    expect(text).toContain('CHF139.00');
    expect(text).toContain('CHF188.00');
    expect(text).toContain('2 items');
  });

  it('sends users without a collection to create one', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    TestBed.createComponent(Dashboard);

    httpMock.expectOne(`${BASE_URL}/collections`).flush([]);

    expect(navigate).toHaveBeenCalledWith('/collections/new');
  });
});
