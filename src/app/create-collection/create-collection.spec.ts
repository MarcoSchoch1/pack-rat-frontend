import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateCollection } from './create-collection';

describe('CreateCollection', () => {
  let component: CreateCollection;
  let fixture: ComponentFixture<CreateCollection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateCollection],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateCollection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
