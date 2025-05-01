import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import {
  DataViewComponent, DataViewColumnDef, DataViewCellRenderer, DataViewRowSelectionEvent
} from '@elementar-ui/components';
import {
  PanelComponent, PanelHeaderComponent, PanelBodyComponent, PanelFooterComponent
} from '@elementar-ui/components';
import {
  VerticalDividerComponent, SegmentedButtonComponent, SegmentedComponent,
  BlockStateComponent, BlockStateContentComponent, BlockStateIconComponent,
  DataViewEmptyDataDirective, DataViewEmptyFilterResultsDirective,
  DataViewActionBarComponent, DataViewActionBarDirective
} from '@elementar-ui/components';
import { MatIcon } from '@angular/material/icon';

import {  MatButton, MatIconButton } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { PaymentAndCreditService } from '../../../services/payment-and-credit.service';

export interface Payment {
  id: number;
  amount: number;
  date: string;
  status: string;
  courseId: number;
  payerId: number;
  receiverId: number;
  cardId: number;
}

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [
    DataViewComponent,
    MatPaginator,
    FormsModule,
    MatButton,
    MatIcon,
    MatIconButton,
    VerticalDividerComponent,
    SegmentedComponent,
    SegmentedButtonComponent,
    DataViewActionBarComponent,
    DataViewActionBarDirective,
    PanelComponent,
    PanelHeaderComponent,
    PanelBodyComponent,
    PanelFooterComponent,
    BlockStateComponent,
    BlockStateContentComponent,
    BlockStateIconComponent,
    DataViewEmptyDataDirective,
    DataViewEmptyFilterResultsDirective,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger
  ],
  templateUrl: './payment-history.component.html',
  styleUrl: './payment-history.component.scss'
})
export class PaymentHistoryComponent implements OnInit {
  private service = inject(PaymentAndCreditService);

  status = 'all';
  search = '';
  selectedRows: Payment[] = [];
  data: Payment[] = [];

  columnDefs: DataViewColumnDef[] = [
    { name: 'ID', dataField: 'id', visible: true },
    { name: 'Amount', dataField: 'amount', visible: true },
    { name: 'Status', dataField: 'status', visible: true },
    { name: 'Date', dataField: 'date', dataRenderer: 'date', visible: true },
    { name: 'Course ID', dataField: 'courseId', visible: true },
    { name: 'Receiver ID', dataField: 'receiverId', visible: true }
  ];

  cellRenderers: DataViewCellRenderer[] = [
    {
      dataRenderer: 'author',                                                                             //    DvAuthorRendererComponent
      component: () => import('../../../pages/content/_renderers/dv-author-renderer/dv-author-renderer.component').then(m => m.DvAuthorRendererComponent)
    }
  ];

  ngOnInit() {
    const userId = 2;
    this.service.getPaymentsByUser(userId).subscribe({
      next: (res) => (this.data = res),
      error: (err) => console.error('Error fetching payments:', err)
    });
  }

  rowSelectionChanged(event: DataViewRowSelectionEvent<Payment>) {
    if (event && event.row) {
      this.selectedRows = Array.isArray(event.row) ? event.row : [event.row];
    } else {
      this.selectedRows = [];
    }
  }

  selectionChanged(rows: Payment[]) {
    this.selectedRows = rows;
  }

  allRowsSelectionChanged(isSelected: boolean) {
    this.selectedRows = isSelected ? [...this.data] : [];
  }
}
