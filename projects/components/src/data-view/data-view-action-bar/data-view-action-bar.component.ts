import { booleanAttribute, Component, input } from '@angular/core';
import { DataViewActionBarAPI } from '../types';

@Component({
  selector: 'emr-data-view-action-bar',
  exportAs: 'emrDataViewActionBar',
  templateUrl: './data-view-action-bar.component.html',
  styleUrl: './data-view-action-bar.component.scss',
  host: {
    'class': 'emr-data-view-action-bar',
    '[class.force-visible]': 'forceVisible() || _forceVisible'
  }
})
export class DataViewActionBarComponent {
  forceVisible = input(false, {
    transform: booleanAttribute
  });
  protected _forceVisible = false;

  get api(): DataViewActionBarAPI {
    return {
      setForceVisible: (forceVisible: boolean): void => {
        this._forceVisible = forceVisible;
      },
    }
  }
}
