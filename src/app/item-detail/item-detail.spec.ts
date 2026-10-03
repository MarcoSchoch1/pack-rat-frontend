import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { API_BASE_URL } from '../service/apiservice';
import { ItemDetail } from './item-detail';

describe('ItemDetail', () => {
  let component: ItemDetail;
  let fixture: ComponentFixture<ItemDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemDetail],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://api.test/api' },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'i1' }) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deletes the item, then goes to the dashboard', () => {
    const httpMock = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    component['deleteItem']();
    const del = httpMock.expectOne({ method: 'DELETE', url: 'http://api.test/api/items/i1' });
    del.flush(null, { status: 204, statusText: 'No Content' });

    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });
});
