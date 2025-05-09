import {
  Component,
  inject,
  OnDestroy
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // Import Router
import {
  SuggestionBlockComponent,
  SuggestionComponent,
  SuggestionIconDirective,
  SuggestionsComponent,
  SuggestionThumbDirective
} from '@elementar-ui/components';
import { AvatarComponent } from '@elementar-ui/components';

@Component({
  selector: 'emr-assistant-search',
  imports: [
    MatIcon,
    SuggestionsComponent,
    SuggestionBlockComponent,
    SuggestionComponent,
    MatButton,
    SuggestionIconDirective,
    SuggestionThumbDirective,
    FormsModule,
    MatIconButton,
    AvatarComponent,
  ],
  templateUrl: './assistant-search.component.html',
  styleUrl: './assistant-search.component.scss',
  host: {
    'class': 'assistant-search'
  }
})
export class AssistantSearchComponent implements OnDestroy {
  private _router = inject(Router); // Inject Router
  protected searchText = '';

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  performSearch(): void {
    if (this.searchText && this.searchText.trim() !== '') {
      // Navigate to the correct nested route within the pages layout
      this._router.navigate(['/pages/course/courses'], { queryParams: { search: this.searchText.trim() } });
    }
  }

  clearText() {
    this.searchText = '';
  }
}
