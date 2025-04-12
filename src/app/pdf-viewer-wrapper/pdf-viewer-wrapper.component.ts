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
      const componentRef = this.container.createComponent(factory);
      // Store the full componentRef so that you can later access changeDetectorRef
      this.pdfViewerRef = componentRef;
    } catch (error) {
      console.error('PDF viewer load error:', error);
    }
  }
  

  private updateViewerSettings() {
    if (!this.pdfViewerRef) return;
  
    // Get the instance from the full component reference.
    const pdfComponentInstance = this.pdfViewerRef.instance;
  
    // Update PDF source and other properties.
    pdfComponentInstance.src = this.src;
    pdfComponentInstance.renderText = this.renderText;
    pdfComponentInstance.originalSize = this.originalSize;
  
    // Trigger change detection using the componentRef's changeDetectorRef.
    this.pdfViewerRef.changeDetectorRef.detectChanges();
  }
  
}