import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnergyTradingPage } from './energy-trading.page';

describe('EnergyTradingPage', () => {
  let component: EnergyTradingPage;
  let fixture: ComponentFixture<EnergyTradingPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EnergyTradingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
