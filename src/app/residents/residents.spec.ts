import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Residents } from './residents';

describe('Residents', () => {
  let component: Residents;
  let fixture: ComponentFixture<Residents>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Residents],
    }).compileComponents();

    fixture = TestBed.createComponent(Residents);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
