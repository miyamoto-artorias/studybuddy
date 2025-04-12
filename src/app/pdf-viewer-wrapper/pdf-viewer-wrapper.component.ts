import {
  Component,
  OnInit,
  ViewChild,
  ViewContainerRef,
  ComponentFactoryResolver,
  Input,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-pdf-viewer-wrapper',
  template: `<ng-container #pdfContainer></ng-container>`
})
export class PdfViewerWrapperComponent implements OnInit {
  @ViewChild('pdfContainer', { read: ViewContainerRef, static: true })
  container!: ViewContainerRef;

  // Inputs to pass to the PDF viewer
  @Input() src!: string;
  @Input() renderText: boolean = true;
  @Input() originalSize: boolean = false;
  @Input() customStyle: string = '';

  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cfr: ComponentFactoryResolver
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async ngOnInit() {
    if (this.isBrowser) {
      // Dynamically import the PdfViewerComponent from ng2-pdf-viewer
      const module = await import('ng2-pdf-viewer');
      const PdfViewerComponent = module.PdfViewerComponent;
      const factory = this.cfr.resolveComponentFactory(PdfViewerComponent);
      const componentRef = this.container.createComponent(factory);

      // Set the inputs for the PDF viewer component
      componentRef.instance.src = this.src;
      componentRef.instance.renderText = this.renderText;
      componentRef.instance.originalSize = this.originalSize;

      if (this.customStyle) {
        (componentRef.location.nativeElement as HTMLElement).setAttribute('style', this.customStyle);
      }
    }
  }
}
