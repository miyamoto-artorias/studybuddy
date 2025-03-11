import { Component, forwardRef, input, OnInit } from '@angular/core';
import { RAIL_NAV, RailNavAPI } from '../types';

@Component({
  selector: 'emr-rail-nav',
  exportAs: 'emrRailNav',
  imports: [],
  templateUrl: './rail-nav.component.html',
  styleUrl: './rail-nav.component.scss',
  providers: [
    {
      provide: RAIL_NAV,
      useExisting: forwardRef(() => RailNavComponent),
    }
  ],
  host: {
    'class': 'emr-rail-nav'
  }
})
export class RailNavComponent implements OnInit {
  activeKey = input();

  private _activeKey: any;

  readonly api: RailNavAPI = {
    activateItem: (key: any) => {
      this._activeKey = key;
    },
    getActiveKey: () => this._activeKey,
    isActive: (key: any) => key === this._activeKey,
  };

  ngOnInit() {
    this._activeKey = this.activeKey();
  }
}
