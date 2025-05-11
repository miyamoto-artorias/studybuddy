import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnrolledCoursesListComponent } from './enrolled-courses-list.component';

describe('EnrolledCoursesListComponent', () => {
  let component: EnrolledCoursesListComponent;
  let fixture: ComponentFixture<EnrolledCoursesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnrolledCoursesListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnrolledCoursesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
