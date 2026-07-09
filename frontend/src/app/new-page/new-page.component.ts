import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { SlideBarComponent } from '../slide-bar/slide-bar.component';
import { PageService } from '../services/page.service';
import { AuthService } from '../services/auth.service';
import { AuthUser } from '../models/auth.model';

interface JsonSpan {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  highlight?: string;
  size?: string;
}

interface JsonBlock {
  type: string; // 'h2', 'p', etc.
  spans: JsonSpan[];
}

@Component({
  selector: 'app-new-page',
  standalone: true,
  imports: [CommonModule, FormsModule, SlideBarComponent, RouterLink],
  templateUrl: './new-page.component.html',
  styleUrl: './new-page.component.css'
})
export class NewPageComponent implements OnInit, OnDestroy {
  @ViewChild('editor') editor?: ElementRef<HTMLDivElement>;
  @ViewChild('imageInput') imageInput?: ElementRef<HTMLInputElement>;

  activeWorkspaceId = 1;
  pageId: number | null = null;
  title = '';
  contentHtml = '';
  imageDataUrl = '';
  lastSavedLabel = 'Page load complete';
  currentUser: AuthUser | null = null;

  // Formatting and Selection States
  showToolbar = false;
  currentFontSize = 16;
  showColorDropdown = false;
  showHighlightDropdown = false;
  isInteractingWithToolbar = false;

  // Warn on Leave States
  isDirty = false;
  showLeaveWarning = false;
  private leaveSubject = new Subject<boolean>();

  // Available Colors
  readonly textColors = [
    { name: 'Default', value: '#0F172A' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' }
  ];

  readonly highlightColors = [
    { name: 'None', value: 'transparent' },
    { name: 'Yellow', value: '#FEF08A' },
    { name: 'Green', value: '#BBF7D0' },
    { name: 'Blue', value: '#BFDBFE' },
    { name: 'Pink', value: '#FECDD3' },
    { name: 'Purple', value: '#E9D5FF' }
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly pageService: PageService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.activeWorkspaceId = Number(localStorage.getItem('activeWorkspaceId')) || 1;

    this.route.queryParams.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.pageId = Number(id);
        this.loadPage(this.pageId);
      } else {
        this.pageId = null;
        this.title = 'Untitled';
        const defaultBlocks: JsonBlock[] = [
          {
            type: 'h2',
            spans: [{ text: 'Overview & Objectives', size: '24px', bold: true }]
          },
          {
            type: 'p',
            spans: [{ text: 'Start writing your thoughts here...', size: '16px' }]
          }
        ];
        this.contentHtml = this.jsonToHtml(JSON.stringify(defaultBlocks));
        this.isDirty = false;
        setTimeout(() => {
          if (this.editor) {
            this.editor.nativeElement.innerHTML = this.contentHtml;
          }
        });
      }
    });

    window.addEventListener('beforeunload', this.saveBeforeUnload);
  }

  ngOnDestroy(): void {
    window.removeEventListener('beforeunload', this.saveBeforeUnload);
  }

  onToolbarFocus() {
    this.isInteractingWithToolbar = true;
  }

  onToolbarBlur() {
    setTimeout(() => {
      this.isInteractingWithToolbar = false;
      this.onSelectionChange();
    }, 150);
  }

  // Detect selection changes to toggle the formatting toolbar
  @HostListener('document:selectionchange')
  onSelectionChange() {
    if (this.isInteractingWithToolbar) {
      return;
    }

    const selection = window.getSelection();
    // Only show the toolbar if text is selected inside the editor
    if (selection && selection.rangeCount > 0 && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      const editorElement = this.editor?.nativeElement;
      if (editorElement && (editorElement.contains(range.commonAncestorContainer) || editorElement === range.commonAncestorContainer)) {
        this.showToolbar = true;

        // Try to detect the active font size of the selection to set the size control
        let parent: HTMLElement | null = range.commonAncestorContainer as HTMLElement;
        if (parent.nodeType === Node.TEXT_NODE) {
          parent = parent.parentElement;
        }
        if (parent) {
          const fontSizeStr = window.getComputedStyle(parent).fontSize;
          if (fontSizeStr) {
            const size = parseInt(fontSizeStr);
            if (!isNaN(size)) {
              this.currentFontSize = size;
            }
          }
        }
        return;
      }
    }
    this.showToolbar = false;
    this.showColorDropdown = false;
    this.showHighlightDropdown = false;
  }

  getAvatarCharacter(): string {
    if (!this.currentUser || !this.currentUser.fullName) return 'A';
    const trimmed = this.currentUser.fullName.trim();
    return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : 'A';
  }

  onContentInput() {
    this.isDirty = true;
  }

  onTitleChange() {
    this.isDirty = true;
  }

  // Manual save trigger
  savePage() {
    if (!this.editor) return;
    const currentTitle = this.title.trim() || 'Untitled';
    const jsonContent = this.htmlToJson(this.editor.nativeElement);

    if (this.pageId) {
      // Update existing page
      this.pageService.updatePage(this.pageId, {
        title: currentTitle,
        content: jsonContent
      }).subscribe({
        next: () => {
          this.isDirty = false;
          this.lastSavedLabel = `Saved ${new Date().toLocaleTimeString()}`;
        },
        error: (err) => {
          console.error('Error saving page:', err);
          this.lastSavedLabel = 'Failed to save page';
        }
      });
    } else {
      // Create new page
      this.pageService.createPage({
        workspaceId: this.activeWorkspaceId,
        title: currentTitle,
        content: jsonContent
      }).subscribe({
        next: (page) => {
          this.pageId = page.id;
          this.isDirty = false;
          this.lastSavedLabel = `Saved ${new Date().toLocaleTimeString()}`;
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { id: page.id },
            queryParamsHandling: 'merge'
          });
        },
        error: (err) => {
          console.error('Error creating page:', err);
          this.lastSavedLabel = 'Error creating page on server';
        }
      });
    }
  }

  // Routing Leave Warning Logic
  canDeactivate(): Observable<boolean> | boolean {
    if (!this.isDirty) {
      return true;
    }
    this.showLeaveWarning = true;
    return this.leaveSubject.asObservable();
  }

  confirmLeave() {
    this.showLeaveWarning = false;
    this.isDirty = false;
    this.leaveSubject.next(true);
    this.leaveSubject.complete();
    this.leaveSubject = new Subject<boolean>();
  }

  cancelLeave() {
    this.showLeaveWarning = false;
    this.leaveSubject.next(false);
    this.leaveSubject = new Subject<boolean>();
  }

  // Formatting Actions
  format(command: 'bold' | 'italic' | 'underline') {
    document.execCommand(command);
    this.isDirty = true;
  }

  // Custom Font Size controls
  increaseSize() {
    this.currentFontSize = Math.min(72, this.currentFontSize + 2);
    this.applyFontSize();
  }

  decreaseSize() {
    this.currentFontSize = Math.max(8, this.currentFontSize - 2);
    this.applyFontSize();
  }

  onFontSizeChange() {
    if (this.currentFontSize < 8) this.currentFontSize = 8;
    if (this.currentFontSize > 72) this.currentFontSize = 72;
    this.applyFontSize();
  }

  applyFontSize() {
    this.applySelectionStyle('font-size', `${this.currentFontSize}px`);
  }

  applyTextColor(color: string) {
    document.execCommand('foreColor', false, color);
    this.showColorDropdown = false;
    this.isDirty = true;
  }

  applyHighlightColor(color: string) {
    document.execCommand('hiliteColor', false, color);
    this.showHighlightDropdown = false;
    this.isDirty = true;
  }

  private applySelectionStyle(styleName: string, value: string) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.toString().length === 0) return;

    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style.setProperty(styleName, value);

    try {
      range.surroundContents(span);
    } catch (e) {
      // Cross-nodes selection fallback
      const content = range.extractContents();
      span.appendChild(content);
      range.insertNode(span);
    }

    selection.removeAllRanges();
    this.isDirty = true;
  }

  openImagePicker(): void {
    this.imageInput?.nativeElement.click();
  }

  addImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.imageDataUrl = String(reader.result);
      this.isDirty = true;
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  removeImage(): void {
    this.imageDataUrl = '';
    this.isDirty = true;
  }

  clearPage(): void {
    this.title = 'Untitled';
    this.contentHtml = '<p><span style="font-size: 16px;">Start typing...</span></p>';
    this.imageDataUrl = '';

    if (this.editor) {
      this.editor.nativeElement.innerHTML = this.contentHtml;
    }
    this.isDirty = true;
  }

  private loadPage(id: number): void {
    this.pageService.getPage(id).subscribe({
      next: (page) => {
        this.title = page.title;
        // Parse the stored JSON content back into styled HTML to render in editor
        this.contentHtml = this.jsonToHtml(page.content || '');
        this.lastSavedLabel = `Saved ${new Date(page.updatedAt || page.createdAt).toLocaleTimeString()}`;
        this.isDirty = false;

        if (this.editor) {
          this.editor.nativeElement.innerHTML = this.contentHtml;
        }
      },
      error: (err) => {
        console.error('Error loading page:', err);
        this.lastSavedLabel = 'Error loading page';
      }
    });
  }

  resetFormat() {
    document.execCommand('removeFormat');
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && selection.toString().length > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = '16px';
      span.style.color = '#0F172A';
      try {
        range.surroundContents(span);
      } catch (e) {
        const content = range.extractContents();
        span.appendChild(content);
        range.insertNode(span);
      }
      this.currentFontSize = 16;
    }
    this.isDirty = true;
  }

  private htmlToJson(element: HTMLElement): string {
    const blocks: JsonBlock[] = [];
    const children = element.childNodes;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent || '';
        if (text.trim() || text === '\n') {
          blocks.push({
            type: 'p',
            spans: [{ text: text, size: '16px' }]
          });
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        const tag = el.tagName.toLowerCase();

        if (el.classList.contains('toolbar') || el.classList.contains('modal-overlay')) {
          continue;
        }

        if (['p', 'div', 'h2', 'h1', 'h3', 'ul', 'ol', 'li'].includes(tag)) {
          const text = el.innerText || '';
          const hasBr = el.querySelector('br') !== null;

          if (!text.replace(/\u200B/g, '').trim() && (hasBr || el.innerHTML === '')) {
            blocks.push({
              type: tag,
              spans: [{ text: '\n', size: tag === 'h2' ? '24px' : '16px' }]
            });
          } else {
            const spans = this.parseBlockSpans(el, tag);
            blocks.push({
              type: tag,
              spans: spans.length > 0 ? spans : [{ text: '\n', size: tag === 'h2' ? '24px' : '16px' }]
            });
          }
        } else if (tag === 'br') {
          blocks.push({
            type: 'p',
            spans: [{ text: '\n', size: '16px' }]
          });
        } else {
          const spans = this.parseBlockSpans(el, 'p');
          blocks.push({
            type: 'p',
            spans: spans
          });
        }
      }
    }

    if (blocks.length === 0) {
      blocks.push({
        type: 'p',
        spans: [{ text: 'Start writing...', size: '16px' }]
      });
    }

    return JSON.stringify(blocks);
  }

  private parseBlockSpans(blockElement: HTMLElement, type: string): JsonSpan[] {
    const spans: JsonSpan[] = [];

    const traverse = (node: Node, inheritedStyles: Partial<JsonSpan>) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (text) {
          spans.push({
            text: text,
            ...inheritedStyles
          });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tagName = el.tagName.toUpperCase();

        if (tagName === 'BR') {
          return;
        }

        const localStyles: Partial<JsonSpan> = { ...inheritedStyles };
        const style = el.style;

        if (tagName === 'B' || tagName === 'STRONG') localStyles.bold = true;
        if (tagName === 'I' || tagName === 'EM') localStyles.italic = true;
        if (tagName === 'U') localStyles.underline = true;

        if (style.fontWeight === 'bold' || style.fontWeight === '700') localStyles.bold = true;
        if (style.fontStyle === 'italic') localStyles.italic = true;
        if (style.textDecoration && style.textDecoration.includes('underline')) localStyles.underline = true;

        if (style.fontSize) localStyles.size = style.fontSize;
        if (style.color) localStyles.color = style.color;

        if (style.backgroundColor && style.backgroundColor !== 'transparent') {
          localStyles.highlight = style.backgroundColor;
        }

        const childNodes = el.childNodes;
        for (let i = 0; i < childNodes.length; i++) {
          traverse(childNodes[i], localStyles);
        }
      }
    };

    const children = blockElement.childNodes;
    for (let i = 0; i < children.length; i++) {
      traverse(children[i], {
        size: type === 'h2' ? '24px' : '16px'
      });
    }

    return spans;
  }

  private jsonToHtml(jsonStr: string): string {
    if (!jsonStr) return '<p><br></p>';
    try {
      const blocks = JSON.parse(jsonStr);
      if (!Array.isArray(blocks)) return '<p><br></p>';

      let html = '';
      for (const block of blocks) {
        const tag = block.type || 'p';
        let blockContent = '';

        const spans = block.spans || [];
        for (const span of spans) {
          if (span.text === '\n') {
            blockContent += '<br>';
            continue;
          }

          let styles = '';
          if (span.size) styles += `font-size: ${span.size};`;
          if (span.bold) styles += `font-weight: bold;`;
          if (span.italic) styles += `font-style: italic;`;
          if (span.underline) styles += `text-decoration: underline;`;
          if (span.color) styles += `color: ${span.color};`;
          if (span.highlight) styles += `background-color: ${span.highlight};`;

          blockContent += `<span style="${styles}">${this.escapeHtml(span.text)}</span>`;
        }

        if (blockContent === '' || blockContent === '<br>') {
          blockContent = '<br>';
        }

        html += `<${tag}>${blockContent}</${tag}>`;
      }
      return html;
    } catch (e) {
      console.error('Error parsing JSON content:', e);
      return '<p><br></p>';
    }
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private readonly saveBeforeUnload = (event: any): void => {
    if (this.isDirty) {
      event.preventDefault();
      event.returnValue = true;
    }
  };
}
