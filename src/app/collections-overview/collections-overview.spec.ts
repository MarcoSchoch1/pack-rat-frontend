import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '../service/apiservice';
import { Collection } from '../service/collection.service';
import { CollectionsOverview } from './collections-overview';

const BASE_URL = 'http://api.test/api';

const onePiece: Collection = {
  id: 'c1',
  userId: 'u1',
  name: 'My One Piece Collection',
  itemCount: 42,
  totalPricePaid: 1240.5,
  totalPriceNow: 980,
};
const pokemon: Collection = {
  id: 'c2',
  userId: 'u1',
  name: 'Pokémon',
  itemCount: 7,
  totalPricePaid: 85,
  totalPriceNow: null,
};

describe('CollectionsOverview', () => {
  let httpMock: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CollectionsOverview],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => httpMock.verify());

  it('sends users without a collection to create one', () => {
    TestBed.createComponent(CollectionsOverview);
    httpMock.expectOne(`${BASE_URL}/collections`).flush([]);

    expect(navigate).toHaveBeenCalledWith('/collections/new', { replaceUrl: true });
  });

  it('sends users with one collection straight to its dashboard', () => {
    TestBed.createComponent(CollectionsOverview);
    httpMock.expectOne(`${BASE_URL}/collections`).flush([onePiece]);

    expect(navigate).toHaveBeenCalledWith('/collections/c1', { replaceUrl: true });
  });

  it('lists 2 or more collections with grand totals summed from theirs', async () => {
    const fixture = TestBed.createComponent(CollectionsOverview);
    httpMock.expectOne(`${BASE_URL}/collections`).flush([onePiece, pokemon]);
    await fixture.whenStable();

    expect(navigate).not.toHaveBeenCalled();
    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('My One Piece Collection');
    expect(text).toContain('42 items');
    expect(text).toContain('Pokémon');
    expect(text).toContain('2 collections');
    // Paid: 1240.50 + 85. Now: only One Piece has one, so its 980 is the total.
    expect(text).toContain('CHF1,325.50');
    expect(text).toContain('CHF980.00');
  });
});
