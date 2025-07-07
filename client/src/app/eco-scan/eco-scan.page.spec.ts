import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EcoScanPage } from './eco-scan.page';

describe('EcoScanPage', () => {
  let component: EcoScanPage;
  let fixture: ComponentFixture<EcoScanPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EcoScanPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
