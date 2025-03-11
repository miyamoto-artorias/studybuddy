import { Component, inject, OnInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import {
  DataView,
  DataViewActionBarComponent, DataViewActionBarDirective, DataViewAPI,
  DataViewCellRenderer,
  DataViewColumnDef,
  DataViewComponent, DataViewEmptyDataDirective, DataViewEmptyFilterResultsDirective,
  DataViewRowSelectionEvent
} from '@elementar-ui/components';
import { VerticalDividerComponent } from '@elementar-ui/components';
import { SegmentedButtonComponent, SegmentedComponent } from '@elementar-ui/components';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import {
  BlockStateActionsComponent,
  BlockStateComponent,
  BlockStateContentComponent, BlockStateIconComponent,
  BlockStateImageComponent
} from '@elementar-ui/components';
import {
  PanelBodyComponent,
  PanelComponent,
  PanelFooterComponent,
  PanelHeaderComponent
} from '@elementar-ui/components';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  avatarUrl: string;
}

export interface Post {
  id: string;
  title: string;
  author: User;
  status: string;
  createdAt: Date;
  publishedAt?: Date;
}

@Component({
  imports: [
    DataViewComponent,
    MatPaginator,
    FormsModule,
    MatButton,
    MatIcon,
    VerticalDividerComponent,
    MatIconButton,
    SegmentedButtonComponent,
    SegmentedComponent,
    DataViewActionBarComponent,
    DataViewActionBarDirective,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    BlockStateComponent,
    DataViewEmptyDataDirective,
    BlockStateContentComponent,
    DataViewEmptyFilterResultsDirective,
    BlockStateIconComponent,
    PanelHeaderComponent,
    PanelComponent,
    PanelFooterComponent,
    PanelBodyComponent,
  ],
  templateUrl: './post-list.component.html',
  styleUrl: './post-list.component.scss'
})
export class PostListComponent implements OnInit {
  private _httpClient = inject(HttpClient);

  status = 'all';
  columnDefs: DataViewColumnDef[] = [
    {
      name: 'Id',
      dataField: 'id',
      visible: false
    },
    {
      name: 'Title',
      dataField: 'title',
      visible: true
    },
    {
      name: 'Author',
      dataField: 'author',
      dataRenderer: 'author',
      visible: true
    },
    {
      name: 'Created At',
      dataField: 'createdAt',
      dataRenderer: 'date',
      visible: true
    },
    {
      name: 'Published At',
      dataField: 'publishedAt',
      dataRenderer: 'date',
      visible: true
    }
  ];
  data: Post[] = [];
  selectedRows: Post[] = [];
  cellRenderers: DataViewCellRenderer[] = [
    {
      dataRenderer: 'author',
      component: () => import('../_renderers/dv-author-renderer/dv-author-renderer.component').then(c => c.DvAuthorRendererComponent)
    },
    {
      dataRenderer: 'date',
      component: () => import('../_renderers/dv-date-renderer/dv-date-renderer.component').then(c => c.DvDateRendererComponent)
    }
  ];
  search = '';


   MyData: Post[] = [
    {
      id: '1',
      title: 'Java Course',
      author: {
        id: '1',
        username: 'john_doe',
        name: 'John Doe',
        email: 'john@example.com',
        avatarUrl: 'https://example.com/avatar1.png'
      },
      status: 'published',
      createdAt: new Date('2025-01-01T10:00:00Z'),
      publishedAt: new Date('2025-01-02T10:00:00Z')
    },
    {
      id: '2',
      title: 'Angular Course',
      author: {
        id: '2',
        username: 'jane_doe',
        name: 'Jane Doe',
        email: 'jane@example.com',
        avatarUrl: 'https://example.com/avatar2.png'
      },
      status: 'draft',
      createdAt: new Date('2025-02-01T10:00:00Z')
    },
    {
      id: '3',
      title: 'UML course',
      author: {
        id: '3',
        username: 'alice_smith',
        name: 'Alice Smith',
        email: 'alice@example.com',
        avatarUrl: 'https://example.com/avatar3.png'
      },
      status: 'published',
      createdAt: new Date('2025-03-01T10:00:00Z'),
      publishedAt: new Date('2025-03-02T10:00:00Z')
    }
  ];

  ngOnInit() {
    this._httpClient
      .get<Post[]>('/assets/mockdata/content-post-list.json')
      .subscribe(data => {
        this.data = this.MyData;
      })
    ;
  }

  rowSelectionChanged(event: DataViewRowSelectionEvent<Post>): void {
    // console.log(event.checked);
  }

  selectionChanged(rows: Post[]): void {
    this.selectedRows = rows;
  }

  allRowsSelectionChanged(isAllSelected: boolean): void {
    // console.log(isAllSelected);
  }
}
