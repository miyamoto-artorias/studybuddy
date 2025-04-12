import { 
  Component, OnInit, OnChanges, SimpleChanges, 
  ViewChild, ViewContainerRef, ComponentFactoryResolver,
  Inject, PLATFORM_ID, Input 
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PdfViewerComponent } from 'ng2-pdf-viewer';

@Component({
  selector: 'app-pdf-viewer-wrapper',
  template: `<ng-container #pdfContainer></ng-container>`
})
export class PdfViewerWrapperComponent implements OnInit, OnChanges {
  @ViewChild('pdfContainer', { read: ViewContainerRef, static: true }) 
  container!: ViewContainerRef;

  @Input() src!: string | ArrayBuffer;
  @Input() renderText = true;
  @Input() originalSize = false;
  @Input() customStyle = '';

  private pdfViewerRef: any;
  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cfr: ComponentFactoryResolver
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  async ngOnInit() {
    if (!this.isBrowser) return;
    
    await this.loadPdfViewer();
    this.updateViewerSettings();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.pdfViewerRef && changes['src']) {
      this.updateViewerSettings();
    }
  }

  private async loadPdfViewer() {
    try {
      const { PdfViewerComponent } = await import('ng2-pdf-viewer');
      const factory = this.cfr.resolveComponentFactory(PdfViewerComponent);
      this.pdfViewerRef = this.container.createComponent(factory).instance;
    } catch (error) {
      console.error('PDF viewer load error:', error);
    }
  }

  private updateViewerSettings() {
    if (!this.pdfViewerRef) return;

    // Update PDF source
    this.pdfViewerRef.src = this.src;
    
    // Update other properties
    this.pdfViewerRef.renderText = this.renderText;
    this.pdfViewerRef.originalSize = this.originalSize;
    
    // Trigger change detection
    this.pdfViewerRef.changeDetectorRef.detectChanges();
  }
}