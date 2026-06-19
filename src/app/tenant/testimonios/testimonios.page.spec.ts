import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestimoniosPage } from './testimonios.page';

describe('TestimoniosPage', () => {
  let component: TestimoniosPage;
  let fixture: ComponentFixture<TestimoniosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TestimoniosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
