import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CourseListComponent } from './course-list/course-list.component';
import { CourseDetailComponent } from './course-detail/course-detail.component';
import { EnrolledCoursesListComponent } from './enrolled-courses-list/enrolled-courses-list.component';
import { EnrolledCourseViewComponent } from './enrolled-course-view/enrolled-course-view.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'courses',
  },
  {
    path: 'courses',
    component: CourseListComponent
  },
  {
    path: 'course/:id',
    component: CourseDetailComponent
  },
  {
    path: 'enrolled-courses-list',
    component: EnrolledCoursesListComponent
  },
  {
    path: 'enrolled-courses-view/:id',
    component: EnrolledCourseViewComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CourseRoutingModule { }
