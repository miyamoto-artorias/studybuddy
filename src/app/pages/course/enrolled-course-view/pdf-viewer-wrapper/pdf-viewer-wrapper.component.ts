import { 
  Component, 
  OnInit, 
  OnChanges, 
  SimpleChanges, 
  ViewChild, 
  ViewContainerRef, 
  ComponentFactoryResolver,
  Inject, 
  PLATFORM_ID, 
  Input 
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-pdf-viewer-wrapper',
  template: `<ng-container #pdfContainer></ng-container>`
})
export class PdfViewerWrapperComponent implements OnInit, OnChanges {
  @ViewChild('pdfContainer', { read: ViewContainerRef, static: true })
  container!: ViewContainerRef;

  // Expect a string blob URL for src
  @Input() src!: string;
  @Input() renderText = true;
  @Input() originalSize = false;
  @Input() customStyle = '';

  // Store the ComponentRef of PdfViewerComponent
  private pdfViewerComponentRef: any = null; 
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
    // Only update viewer if the PDF component has been loaded
    if (this.pdfViewerComponentRef && changes['src']) {
      this.updateViewerSettings();
    }
  }

  private async loadPdfViewer() {
    try {
      // Dynamically import the PDF viewer from ng2-pdf-viewer
      const { PdfViewerComponent } = await import('ng2-pdf-viewer');
      const factory = this.cfr.resolveComponentFactory(PdfViewerComponent);
      this.pdfViewerComponentRef = this.container.createComponent(factory);
      console.log('PDF viewer component loaded', this.pdfViewerComponentRef);
    } catch (error) {
      console.error('PDF viewer load error:', error);
    }
  }

  private updateViewerSettings() {
    if (!this.pdfViewerComponentRef) return;
    
    const pdfComponentInstance = this.pdfViewerComponentRef.instance;
    console.log('Updating PDF viewer settings with src:', this.src);
    
    pdfComponentInstance.src = this.src;
    pdfComponentInstance.renderText = this.renderText;
    pdfComponentInstance.originalSize = this.originalSize;
    
    // Apply any custom styles to the host element if provided
    if (this.customStyle) {
      this.pdfViewerComponentRef.location.nativeElement.setAttribute('style', this.customStyle);
    }
    
    // Only invoke detectChanges() if changeDetectorRef is defined
    if (this.pdfViewerComponentRef.changeDetectorRef) {
      this.pdfViewerComponentRef.changeDetectorRef.detectChanges();
    } else {
      console.warn('pdfViewerComponentRef.changeDetectorRef is undefined.');
    }
  }
}
