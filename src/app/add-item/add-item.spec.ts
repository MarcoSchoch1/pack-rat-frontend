import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { API_BASE_URL } from '../service/apiservice';
import { AddItem } from './add-item';

const BASE_URL = 'http://api.test/api';

describe('AddItem', () => {
  let httpMock: HttpTestingController;
  let component: AddItem;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AddItem],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    component = TestBed.createComponent(AddItem).componentInstance;
    component['form'].setValue({
      name: 'Luffy Alt Art',
      selfPulled: false,
      pricePaid: 45,
      currency: 'EUR',
      priceNow: null,
      dateAcquired: '2026-03-14',
      condition: 'NEAR_MINT',
      marketPlaceLink: '',
    });
  });

  afterEach(() => httpMock.verify());

  function saveWithPicture(): void {
    component['pickPicture']([
      new File(['x'], 'luffy.png', { type: 'image/png' }),
    ] as unknown as FileList);
    component.submit();
    httpMock.expectOne(`${BASE_URL}/collections`).flush([{ id: 'c1' }]);
    const create = httpMock.expectOne(`${BASE_URL}/collections/c1/items`);
    expect(create.request.body).toEqual({
      name: 'Luffy Alt Art',
      selfPulled: false,
      pricePaid: 45,
      currency: 'EUR',
      priceNow: null,
      dateAcquired: '2026-03-14',
      condition: 'NEAR_MINT',
      marketPlaceLink: '',
    });
    create.flush({ id: 'i1' });
  }

  it('creates the item, uploads the picture, then goes to the dashboard', () => {
    saveWithPicture();
    const upload = httpMock.expectOne(`${BASE_URL}/items/i1/images`);
    expect((upload.request.body as FormData).get('file')).toBeInstanceOf(File);
    upload.flush({ id: 'img1' });

    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('goes to the saved item when only the picture upload fails', () => {
    saveWithPicture();
    httpMock
      .expectOne(`${BASE_URL}/items/i1/images`)
      .flush(null, { status: 500, statusText: 'Server Error' });

    expect(router.navigateByUrl).toHaveBeenCalledWith('/items/i1');
  });

  it('does not send anything while required fields are empty', () => {
    component['form'].controls.name.setValue('');
    component.submit();

    httpMock.expectNone(`${BASE_URL}/collections`);
    expect(component['form'].controls.name.touched).toBe(true);
  });
});

describe('AddItem editing', () => {
  let httpMock: HttpTestingController;
  let component: AddItem;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AddItem],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'i1' }) } } },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    component = TestBed.createComponent(AddItem).componentInstance;
  });

  afterEach(() => httpMock.verify());

  it('prefills the form, patches the item, then goes back to it', () => {
    httpMock.expectOne(`${BASE_URL}/items/i1`).flush({
      id: 'i1',
      collectionId: 'c1',
      name: 'Luffy Alt Art',
      selfPulled: true,
      pricePaid: 0,
      priceNow: 980,
      currency: 'CHF',
      dateAcquired: '2026-03-14',
      condition: 'MINT',
      marketPlaceLink: '',
      createdAt: '2026-03-14T10:00:00',
      updatedAt: '2026-03-14T10:00:00',
    });
    expect(component['form'].controls.pricePaid.disabled).toBe(true);

    component['form'].controls.name.setValue('Luffy Manga');
    component.submit();

    const patch = httpMock.expectOne(`${BASE_URL}/items/i1`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toMatchObject({ name: 'Luffy Manga', selfPulled: true, pricePaid: 0 });
    patch.flush({ id: 'i1' });

    expect(router.navigateByUrl).toHaveBeenCalledWith('/items/i1');
  });
});
