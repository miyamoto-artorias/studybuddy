import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MakeCourseRequestComponent } from './make-course-request.component';

describe('MakeCourseRequestComponent', () => {
  let component: MakeCourseRequestComponent;
  let fixture: ComponentFixture<MakeCourseRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MakeCourseRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MakeCourseRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
