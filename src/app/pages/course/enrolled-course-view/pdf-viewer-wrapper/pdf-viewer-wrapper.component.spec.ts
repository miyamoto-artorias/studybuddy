import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfViewerWrapperComponent } from './pdf-viewer-wrapper.component';

describe('PdfViewerWrapperComponent', () => {
  let component: PdfViewerWrapperComponent;
  let fixture: ComponentFixture<PdfViewerWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfViewerWrapperComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfViewerWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
