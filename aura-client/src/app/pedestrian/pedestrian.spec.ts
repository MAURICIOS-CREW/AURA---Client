import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Pedestrian } from './pedestrian';

describe('Pedestrian', () => {
  let component: Pedestrian;
  let fixture: ComponentFixture<Pedestrian>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pedestrian],
    }).compileComponents();

    fixture = TestBed.createComponent(Pedestrian);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
