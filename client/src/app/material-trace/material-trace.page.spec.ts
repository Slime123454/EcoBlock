import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MaterialTracePage } from './material-trace.page';

describe('MaterialTracePage', () => {
  let component: MaterialTracePage;
  let fixture: ComponentFixture<MaterialTracePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MaterialTracePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
