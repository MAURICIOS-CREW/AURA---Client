import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListOfServices } from './list-of-services';

describe('ListOfServices', () => {
  let component: ListOfServices;
  let fixture: ComponentFixture<ListOfServices>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListOfServices],
    }).compileComponents();

    fixture = TestBed.createComponent(ListOfServices);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
