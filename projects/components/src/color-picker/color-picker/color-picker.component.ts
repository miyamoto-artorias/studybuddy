import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component, DestroyRef,
  forwardRef,
  inject, input,
  model,
  OnInit, output, signal
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import { ColorPickerControl } from '../helpers/control';
import { UltColorPickerChangeFormat } from '../properties';
import { Color } from '../helpers/color';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SaturationComponent } from '../saturation/saturation.component';
import { HueComponent } from '../hue/hue.component';
import { AlphaComponent } from '../alpha/alpha.component';

@Component({
  selector: 'emr-color-picker',
  exportAs: 'emrColorPicker',
  imports: [
    SaturationComponent,
    HueComponent,
    AlphaComponent
  ],
  templateUrl: './color-picker.component.html',
  styleUrl: './color-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ColorPickerComponent),
      multi: true
    }
  ],
  host: {
    'class': 'emr-color-picker',
    '[class.is-disabled]': 'disabled()',
    '(contextmenu)': '_handleContextMenu($event)'
  }
})
export class ColorPickerComponent implements OnInit, ControlValueAccessor {
  private _destroyRef = inject(DestroyRef);

  controlColor = model<string>('', {
    alias: 'color',
  });
  controlDisabled = input(false, {
    alias: 'disabled',
    transform: booleanAttribute
  });
  changeFormat = input<UltColorPickerChangeFormat>('hex-alpha');

  readonly colorChange = output<string>();
  readonly rawColorChange = output<Color>();

  protected color = signal(this.controlColor());
  protected disabled = signal(this.controlDisabled());
  readonly control = new ColorPickerControl();
  private _formatMap: Record<UltColorPickerChangeFormat, string> = {
    'hex': '_hex',
    'hex-alpha': '_hexAlpha',
    'rgb': '_rgb',
    'rgb-alpha': '_rgbAlpha',
    'hsl': 'hsl',
    'hsl-alpha': '_hslAlpha',
    'hsv': '_hsv',
    'hsv-alpha': '_hsvAlpha',
  };

  protected _handleContextMenu(event: PointerEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: string) {
    this.color.set(value);
  }

  registerOnChange(fn: any) {
    this.onChange = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: BooleanInput) {
    this.disabled.set(coerceBooleanProperty(isDisabled));
  }

  ngOnInit() {
    if (this.color()) {
      this.control.setValueFrom(this.color());
    }

    const self: any = this;
    this.control
      .valueChanges
      .pipe(
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe(color => {
        const method = this._formatMap[this.changeFormat()];
        const result = self[method](color);
        this.onChange(result);
        this.onTouched(result);
        this.colorChange.emit(result);
        this.rawColorChange.emit(color);
      })
    ;
  }

  private _hex(color: Color) {
    return color.toHexString();
  }

  private _hexAlpha(color: Color) {
    return color.toHexString(true);
  }

  private _rgb(color: Color) {
    return color.toRgbString();
  }

  private _rgbAlpha(color: Color) {
    return color.toRgbaString();
  }

  private _hsl(color: Color) {
    return color.toHslString();
  }

  private _hslAlpha(color: Color) {
    return color.toHslaString();
  }

  private _hsv(color: Color) {
    return color.toHsvString();
  }

  private _hsvAlpha(color: Color) {
    return color.toHsvaString();
  }
}
