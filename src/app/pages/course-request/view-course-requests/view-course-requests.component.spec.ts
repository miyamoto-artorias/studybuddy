import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewCourseRequestsComponent } from './view-course-requests.component';

describe('ViewCourseRequestsComponent', () => {
  let component: ViewCourseRequestsComponent;
  let fixture: ComponentFixture<ViewCourseRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewCourseRequestsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewCourseRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
