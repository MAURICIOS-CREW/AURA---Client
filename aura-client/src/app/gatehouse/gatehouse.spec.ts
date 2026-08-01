import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Gatehouse } from './gatehouse';

describe('Gatehouse', () => {
  let component: Gatehouse;
  let fixture: ComponentFixture<Gatehouse>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Gatehouse],
    }).compileComponents();

    fixture = TestBed.createComponent(Gatehouse);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
