import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin, switchMap } from 'rxjs';
import { SlideBarComponent } from '../slide-bar/slide-bar.component';
import { WorkspaceTopbarComponent } from '../workspace-topbar/workspace-topbar.component';
import { BlocksService } from '../services/blocks.service';
import { PagesService } from '../services/pages.service';
import { WorkspacesService, Workspace } from '../services/workspaces.service';

interface DraftPage {
  title: string;
  contentHtml: string;
  imageDataUrl: string;
  updatedAt: string;
}

@Component({
  selector: 'app-new-page',
  standalone: true,
  imports: [CommonModule, FormsModule, SlideBarComponent, WorkspaceTopbarComponent],
  templateUrl: './new-page.component.html',
  styleUrl: './new-page.component.css'
})
export class NewPageComponent implements OnInit, OnDestroy {
  @ViewChild('editor') editor?: ElementRef<HTMLDivElement>;
  @ViewChild('imageInput') imageInput?: ElementRef<HTMLInputElement>;

  activeWorkspaceId = 1;
  workspaceName = 'Workspace';
  pageId: number | null = null;
  primaryBlockId: number | null = null;
  title = '';
  contentHtml = '';
  imageDataUrl = '';
  lastSavedLabel = 'Draft saved locally';
  isPublishing = false;
  publishMessage = '';
  publishError = '';
  isEditMode = false;

  private saveTimer?: number;

  constructor(
    private readonly pagesService: PagesService,
    private readonly blocksService: BlocksService,
    private readonly workspacesService: WorkspacesService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.activeWorkspaceId = Number(localStorage.getItem('activeWorkspaceId')) || 1;
    this.loadWorkspaceName();

    const routePageId = Number(this.route.snapshot.paramMap.get('id'));
    if (routePageId) {
      this.isEditMode = true;
      this.pageId = routePageId;
      this.loadExistingPage(routePageId);
    } else {
      this.restoreDraft();
    }

    window.addEventListener('beforeunload', this.saveBeforeUnload);
  }

  ngAfterViewInit(): void {
    if (this.editor && this.contentHtml) {
      this.editor.nativeElement.innerHTML = this.contentHtml;
    }
  }

  ngOnDestroy(): void {
    if (!this.isEditMode) {
      this.saveDraft();
    }
    window.removeEventListener('beforeunload', this.saveBeforeUnload);
  }

  get draftKey(): string {
    return `newPageDraft-${this.activeWorkspaceId}`;
  }

  updateContent(): void {
    if (this.editor) {
      this.contentHtml = this.editor.nativeElement.innerHTML;
      this.scheduleSave();
    }
  }

  scheduleSave(): void {
    if (this.isEditMode) {
      return;
    }

    window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => this.saveDraft(), 350);
  }

  format(command: 'bold' | 'italic' | 'underline' | 'createLink'): void {
    if (command === 'createLink') {
      const url = window.prompt('Paste link URL');

      if (!url) {
        return;
      }

      document.execCommand(command, false, url);
    } else {
      document.execCommand(command);
    }

    this.updateContent();
  }

  setBlock(type: 'p' | 'h2'): void {
    document.execCommand('formatBlock', false, type);
    this.updateContent();
  }

  openImagePicker(): void {
    this.imageInput?.nativeElement.click();
  }

  addImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.imageDataUrl = String(reader.result);
      if (!this.isEditMode) {
        this.saveDraft();
      }
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  removeImage(): void {
    this.imageDataUrl = '';
    if (!this.isEditMode) {
      this.saveDraft();
    }
  }

  clearPage(): void {
    this.title = '';
    this.contentHtml = '';
    this.imageDataUrl = '';

    if (this.editor) {
      this.editor.nativeElement.innerHTML = '';
    }

    if (!this.isEditMode) {
      this.saveDraft();
    }
  }

  publishPage(): void {
    const title = this.title.trim() || 'Untitled';
    const content = this.editor?.nativeElement.innerHTML ?? this.contentHtml;

    this.isPublishing = true;
    this.publishMessage = '';
    this.publishError = '';

    if (this.isEditMode && this.pageId) {
      const updatePage$ = this.pagesService.update(this.pageId, {
        title,
        isArchived: false
      });

      const updateBlock$ = this.primaryBlockId
        ? this.blocksService.update(this.primaryBlockId, { content })
        : this.blocksService.create(this.pageId, {
            pageId: this.pageId,
            type: 'paragraph',
            content,
            sortOrder: 0
          });

      forkJoin([updatePage$, updateBlock$]).pipe(
        finalize(() => {
          this.isPublishing = false;
        })
      ).subscribe({
        next: () => {
          this.publishMessage = 'Page saved successfully.';
          this.lastSavedLabel = 'Saved to workspace';
        },
        error: () => {
          this.publishError = 'Could not save the page. Please sign in and try again.';
        }
      });
      return;
    }

    this.pagesService.create({ workspaceId: this.activeWorkspaceId, title }).pipe(
      switchMap(page => this.blocksService.create(page.id, {
        pageId: page.id,
        type: 'paragraph',
        content,
        sortOrder: 0
      })),
      finalize(() => {
        this.isPublishing = false;
      })
    ).subscribe({
      next: () => {
        localStorage.removeItem(this.draftKey);
        this.publishMessage = 'Page published successfully.';
        this.lastSavedLabel = 'Published to workspace';
        this.router.navigate(['/all-pages']);
      },
      error: () => {
        this.publishError = 'Could not publish the page. Please sign in and try again.';
      }
    });
  }

  private loadExistingPage(pageId: number): void {
    forkJoin([
      this.pagesService.get(pageId),
      this.blocksService.listByPage(pageId)
    ]).subscribe({
      next: ([page, blocks]) => {
        this.title = page.title;
        this.activeWorkspaceId = page.workspaceId;
        this.loadWorkspaceName();
        const primaryBlock = blocks.sort((a, b) => a.sortOrder - b.sortOrder)[0];
        this.primaryBlockId = primaryBlock?.id ?? null;
        this.contentHtml = primaryBlock?.content ?? '';
        this.lastSavedLabel = 'Loaded from workspace';

        if (this.editor) {
          this.editor.nativeElement.innerHTML = this.contentHtml;
        }
      },
      error: () => {
        this.publishError = 'Could not load this page.';
      }
    });
  }

  private loadWorkspaceName(): void {
    this.workspacesService.getAll().subscribe({
      next: workspaces => {
        this.workspaceName = workspaces.find(workspace => workspace.id === this.activeWorkspaceId)?.name ?? 'Workspace';
      },
      error: () => {
        this.workspaceName = 'Workspace';
      }
    });
  }

  private restoreDraft(): void {
    const storedDraft = localStorage.getItem(this.draftKey);

    if (!storedDraft) {
      return;
    }

    try {
      const draft = JSON.parse(storedDraft) as DraftPage;
      this.title = draft.title;
      this.contentHtml = draft.contentHtml;
      this.imageDataUrl = draft.imageDataUrl;
      this.lastSavedLabel = draft.updatedAt ? `Draft saved ${new Date(draft.updatedAt).toLocaleTimeString()}` : this.lastSavedLabel;

      if (this.editor) {
        this.editor.nativeElement.innerHTML = this.contentHtml;
      }
    } catch {
      localStorage.removeItem(this.draftKey);
    }
  }

  private saveDraft(): void {
    const draft: DraftPage = {
      title: this.title,
      contentHtml: this.editor?.nativeElement.innerHTML ?? this.contentHtml,
      imageDataUrl: this.imageDataUrl,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(this.draftKey, JSON.stringify(draft));
    this.lastSavedLabel = `Draft saved ${new Date(draft.updatedAt).toLocaleTimeString()}`;
  }

  private readonly saveBeforeUnload = (): void => {
    if (!this.isEditMode) {
      this.saveDraft();
    }
  };
}
