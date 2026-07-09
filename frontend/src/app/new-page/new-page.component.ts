import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SlideBarComponent } from '../slide-bar/slide-bar.component';

interface DraftPage {
  title: string;
  contentHtml: string;
  imageDataUrl: string;
  updatedAt: string;
}

@Component({
  selector: 'app-new-page',
  standalone: true,
  imports: [CommonModule, FormsModule, SlideBarComponent],
  templateUrl: './new-page.component.html',
  styleUrl: './new-page.component.css'
})
export class NewPageComponent implements OnInit, OnDestroy {
  @ViewChild('editor') editor?: ElementRef<HTMLDivElement>;
  @ViewChild('imageInput') imageInput?: ElementRef<HTMLInputElement>;

  activeWorkspaceId = 1;
  title = 'Product Launch Roadmap';
  contentHtml = `
    <h2>Overview &amp; Objectives</h2>
    <p>The upcoming Q3 product launch is centered around enhancing our core cognitive flow experience. We are introducing ambient noise generation, deep work timers, and distraction-free writing modes.</p>
  `;
  imageDataUrl = '';
  lastSavedLabel = 'Draft saved locally';

  private saveTimer?: number;

  ngOnInit(): void {
    this.activeWorkspaceId = Number(localStorage.getItem('activeWorkspaceId')) || 1;
    this.restoreDraft();
    window.addEventListener('beforeunload', this.saveBeforeUnload);
  }

  ngAfterViewInit(): void {
    // Set initial content once to avoid cursor jump issues with [innerHTML]
    if (this.editor) {
      this.editor.nativeElement.innerHTML = this.contentHtml;
    }
  }

  ngOnDestroy(): void {
    this.saveDraft();
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
      this.saveDraft();
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  removeImage(): void {
    this.imageDataUrl = '';
    this.saveDraft();
  }

  clearPage(): void {
    this.title = '';
    this.contentHtml = '';
    this.imageDataUrl = '';

    if (this.editor) {
      this.editor.nativeElement.innerHTML = '';
    }

    this.saveDraft();
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
      
      // Update editor content if it exists
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
    this.saveDraft();
  };
}
