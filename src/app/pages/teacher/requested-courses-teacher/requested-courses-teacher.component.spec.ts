import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestedCoursesTeacherComponent } from './requested-courses-teacher.component';

describe('RequestedCoursesTeacherComponent', () => {
  let component: RequestedCoursesTeacherComponent;
  let fixture: ComponentFixture<RequestedCoursesTeacherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestedCoursesTeacherComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestedCoursesTeacherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
