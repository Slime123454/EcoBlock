import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecycleRewardsPage } from './recycle-rewards.page';

describe('RecycleRewardsPage', () => {
  let component: RecycleRewardsPage;
  let fixture: ComponentFixture<RecycleRewardsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RecycleRewardsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
