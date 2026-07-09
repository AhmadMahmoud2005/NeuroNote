import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

export interface SearchNote {
  id: number;
  title: string;
  excerpt: string;
  updatedAt: string;
  tags: string[];
}

export interface SearchTask {
  id: number;
  title: string;
  dueLabel: string;
  isPending: boolean;
}

export interface SearchFile {
  id: number;
  name: string;
  meta: string;
  type: 'image' | 'pdf' | 'doc';
}

export interface SearchResults {
  notes: SearchNote[];
  tasks: SearchTask[];
  files: SearchFile[];
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  search(query: string, workspaceId: number): Observable<SearchResults> {
    const normalizedQuery = query.trim().toLowerCase();
    const source = this.getMockResults(workspaceId);

    if (!normalizedQuery) {
      return of(source).pipe(delay(120));
    }

    const matches = (value: string): boolean => value.toLowerCase().includes(normalizedQuery);

    return of({
      notes: source.notes.filter(note =>
        matches(note.title) ||
        matches(note.excerpt) ||
        note.tags.some(tag => matches(tag))
      ),
      tasks: source.tasks.filter(task => matches(task.title) || matches(task.dueLabel)),
      files: source.files.filter(file => matches(file.name) || matches(file.meta) || matches(file.type))
    }).pipe(delay(180));
  }

  private getMockResults(workspaceId: number): SearchResults {
    const sharedResults: SearchResults = {
      notes: [
        {
          id: 1,
          title: 'Project Q4 Planning & Strategy',
          excerpt: 'We need to review the initial design specs before moving forward with the engineering phase. Key deliverables include the updated UI kit and component library.',
          updatedAt: '2 hours ago',
          tags: ['Planning', 'Q4', 'Design Specs']
        },
        {
          id: 2,
          title: 'Weekly Sync Meeting Notes',
          excerpt: 'Discussed the new feature rollout. Marketing team will handle the launch campaign. Ensure all design assets are finalized by Friday.',
          updatedAt: 'Yesterday',
          tags: ['Meeting', 'Design Assets']
        },
        {
          id: 3,
          title: 'Product Launch Roadmap',
          excerpt: 'Launch milestones, writing mode improvements, and workspace collaboration ideas for the next product cycle.',
          updatedAt: 'Jul 7',
          tags: ['Roadmap', 'Product']
        }
      ],
      tasks: [
        { id: 1, title: 'Review final design mockups', dueLabel: 'Due Today', isPending: true },
        { id: 2, title: 'Send update to client', dueLabel: 'Tomorrow', isPending: true },
        { id: 3, title: 'Archive old planning docs', dueLabel: 'Done', isPending: false }
      ],
      files: [
        { id: 1, name: 'Q4_Design_Specs_v2.png', meta: '2.4 MB - Oct 12', type: 'image' },
        { id: 2, name: 'Brand_Guidelines.pdf', meta: '1.1 MB - Sep 28', type: 'pdf' },
        { id: 3, name: 'Roadmap_Notes.doc', meta: '740 KB - Jul 7', type: 'doc' }
      ]
    };

    if (workspaceId === 2) {
      return {
        ...sharedResults,
        notes: sharedResults.notes.map(note => ({ ...note, title: `Product Team: ${note.title}` }))
      };
    }

    return sharedResults;
  }
}
