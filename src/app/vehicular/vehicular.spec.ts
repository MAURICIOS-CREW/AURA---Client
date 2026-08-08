import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Vehicular } from './vehicular';

describe('Vehicular', () => {
  let component: Vehicular;
  let fixture: ComponentFixture<Vehicular>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Vehicular],
    }).compileComponents();

    fixture = TestBed.createComponent(Vehicular);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
