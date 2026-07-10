import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { SlideBarComponent } from '../slide-bar/slide-bar.component';
import { PageService, PageInvitation } from '../services/page.service';
import { AuthService } from '../services/auth.service';
import { WorkspaceService, WorkspaceInvitation } from '../services/workspace.service';
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
  @ViewChild('inlinePhotoInput') inlinePhotoInput?: ElementRef<HTMLInputElement>;

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
  showHeadingDropdown = false;
  isInteractingWithToolbar = false;
  savedRange: Range | null = null;

  // Warn on Leave States
  isDirty = false;
  showLeaveWarning = false;
  private leaveSubject = new Subject<boolean>();

  // Custom Delete Confirm State
  showDeleteConfirm = false;

  // Share Modal States
  showShareModal = false;
  shareUsernameOrEmail = '';
  sharePermission = 'Read';
  sharedUsers: any[] = [];
  shareSuccessMessage = '';
  shareErrorMessage = '';
  isSharing = false;
  pageOwnerUsername = '';
  isOwnerOfPage = true;

  // Notifications State
  isNotificationsOpen = false;
  pendingInvitations: WorkspaceInvitation[] = [];
  pendingPageInvitations: PageInvitation[] = [];

  // Available Colors (using var(--color-neutral) as default for light/dark mode adaptability)
  readonly textColors = [
    { name: 'Default', value: 'var(--color-neutral)' },
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
    private readonly authService: AuthService,
    private readonly workspaceService: WorkspaceService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.activeWorkspaceId = Number(localStorage.getItem('activeWorkspaceId')) || 1;
    this.loadInvitations();

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
    }, 200); // slightly higher delay to ensure focus shifts
  }

  restoreSelection() {
    if (this.savedRange) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(this.savedRange.cloneRange());
      }
    }
  }

  formatToCairoTime(dateStr: string | Date | null | undefined): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-US', {
      timeZone: 'Africa/Cairo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
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
        this.savedRange = range.cloneRange(); // Save range!
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
    
    // Selection cleared completely outside toolbar interaction
    this.showToolbar = false;
    this.showColorDropdown = false;
    this.showHighlightDropdown = false;
    this.showHeadingDropdown = false;
    this.savedRange = null;
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
          this.lastSavedLabel = `Saved ${this.formatToCairoTime(new Date())}`;
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
          this.lastSavedLabel = `Saved ${this.formatToCairoTime(new Date())}`;
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

  deletePage(): void {
    if (!this.pageId || !this.isOwnerOfPage) return;
    this.showDeleteConfirm = true;
  }

  confirmDeletePage(): void {
    if (!this.pageId) return;
    this.pageService.deletePage(this.pageId).subscribe({
      next: () => {
        this.isDirty = false;
        this.showDeleteConfirm = false;
        this.router.navigate(['/workspace-detail'], { queryParams: { id: this.activeWorkspaceId } });
      },
      error: (err) => {
        console.error('Error deleting page:', err);
        this.showDeleteConfirm = false;
        alert('Failed to delete page. Please try again.');
      }
    });
  }

  closeDeleteModal(): void {
    this.showDeleteConfirm = false;
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

  // Share Modal Operations
  openShareModal(): void {
    if (!this.pageId) return;
    this.showShareModal = true;
    this.shareSuccessMessage = '';
    this.shareErrorMessage = '';
    this.loadSharedUsers();
  }

  closeShareModal(): void {
    this.showShareModal = false;
    this.shareUsernameOrEmail = '';
    this.shareSuccessMessage = '';
    this.shareErrorMessage = '';
  }

  loadSharedUsers(): void {
    if (!this.pageId) return;
    this.pageService.getSharedUsers(this.pageId).subscribe({
      next: (users) => {
        this.sharedUsers = users;
      },
      error: (err) => {
        console.error('Error loading shared users:', err);
      }
    });
  }

  sharePageWithUser(): void {
    const input = this.shareUsernameOrEmail.trim();
    if (!input || !this.pageId) return;

    this.isSharing = true;
    this.shareSuccessMessage = '';
    this.shareErrorMessage = '';

    this.pageService.sharePage(this.pageId, input, this.sharePermission).subscribe({
      next: (res) => {
        this.isSharing = false;
        this.shareSuccessMessage = res.message || 'Page shared successfully!';
        this.shareUsernameOrEmail = '';
        this.loadSharedUsers();
      },
      error: (err) => {
        this.isSharing = false;
        this.shareErrorMessage = err.error?.message || 'Failed to share page. Make sure the user exists and is not already shared.';
      }
    });
  }

  revokeShare(sharedUserId: number): void {
    if (!this.pageId) return;
    this.pageService.revokePageShare(this.pageId, sharedUserId).subscribe({
      next: () => {
        this.loadSharedUsers();
      },
      error: (err) => {
        console.error('Error revoking page share:', err);
      }
    });
  }

  // Formatting Actions
  format(command: 'bold' | 'italic' | 'underline') {
    this.restoreSelection();
    document.execCommand(command);
    this.isDirty = true;
  }

  getDefaultSizeForBlockType(tag: string): string {
    switch (tag.toLowerCase()) {
      case 'h1': return '30px';
      case 'h2': return '24px';
      case 'h3': return '20px';
      default: return '16px';
    }
  }

  setBlockType(tag: string) {
    this.restoreSelection();
    this.showHeadingDropdown = false;
    this.isDirty = true;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    // Walk up the DOM to find the nearest block-level ancestor inside the editor
    let blockEl: HTMLElement | null = range.startContainer as HTMLElement;
    if (blockEl.nodeType === Node.TEXT_NODE) {
      blockEl = blockEl.parentElement;
    }
    const editorEl = this.editor?.nativeElement;
    // Traverse up until we hit a direct child of the editor
    while (blockEl && blockEl.parentElement !== editorEl) {
      blockEl = blockEl.parentElement;
    }

    if (!blockEl || !editorEl) {
      // Fallback to execCommand if no suitable block found
      document.execCommand('formatBlock', false, tag);
      return;
    }

    const defaultSizes: { [key: string]: string } = {
      'h1': '30px',
      'h2': '24px',
      'h3': '20px',
      'p': '16px',
      'div': '16px'
    };
    const oldDefaultSize = defaultSizes[blockEl.tagName.toLowerCase()] || '16px';
    const newDefaultSize = defaultSizes[tag.toLowerCase()] || '16px';

    // Create new element with target tag, preserving all inner content
    const newEl = document.createElement(tag);
    // Move all children from old block to the new element
    while (blockEl.firstChild) {
      newEl.appendChild(blockEl.firstChild);
    }

    // Find all span elements inside newEl and update their size if they used old default size
    const spans = newEl.querySelectorAll('span');
    spans.forEach(span => {
      const currentSize = span.style.fontSize;
      if (!currentSize || currentSize === oldDefaultSize) {
        span.style.fontSize = newDefaultSize;
      }
    });

    // Replace old element with the new one in the DOM
    editorEl.replaceChild(newEl, blockEl);

    // Restore selection inside the new element
    const newRange = document.createRange();
    newRange.selectNodeContents(newEl);
    selection.removeAllRanges();
    selection.addRange(newRange);
    this.savedRange = newRange;
  }

  // Custom Font Size controls
  increaseSize() {
    // Keep toolbar visible during interaction
    this.isInteractingWithToolbar = true;
    this.restoreSelection();
    this.currentFontSize = Math.min(72, this.currentFontSize + 2);
    this.applyFontSize();
    setTimeout(() => { this.isInteractingWithToolbar = false; }, 300);
  }

  decreaseSize() {
    // Keep toolbar visible during interaction
    this.isInteractingWithToolbar = true;
    this.restoreSelection();
    this.currentFontSize = Math.max(8, this.currentFontSize - 2);
    this.applyFontSize();
    setTimeout(() => { this.isInteractingWithToolbar = false; }, 300);
  }

  onFontSizeChange() {
    this.isInteractingWithToolbar = true;
    this.restoreSelection();
    if (this.currentFontSize < 8) this.currentFontSize = 8;
    if (this.currentFontSize > 72) this.currentFontSize = 72;
    this.applyFontSize();
    setTimeout(() => { this.isInteractingWithToolbar = false; }, 300);
  }

  applyFontSize() {
    this.restoreSelection();
    this.applySelectionStyle('font-size', `${this.currentFontSize}px`);
  }

  applyTextColor(color: string) {
    this.restoreSelection();
    document.execCommand('foreColor', false, color);
    this.showColorDropdown = false;
    this.isDirty = true;
  }

  applyHighlightColor(color: string) {
    this.restoreSelection();
    document.execCommand('hiliteColor', false, color);
    this.showHighlightDropdown = false;
    this.isDirty = true;
  }

  private applySelectionStyle(styleName: string, value: string) {
    this.restoreSelection();
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

    // Re-select the span so the toolbar sees a valid selection and stays visible
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    selection.removeAllRanges();
    selection.addRange(newRange);
    this.savedRange = newRange.cloneRange();
    this.showToolbar = true;

    this.isDirty = true;
  }

  openImagePicker(): void {
    this.imageInput?.nativeElement.click();
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
        this.lastSavedLabel = `Saved ${this.formatToCairoTime(page.updatedAt || page.createdAt)}`;
        this.isDirty = false;

        const currentUserId = this.authService.currentUser?.userId || 0;
        this.isOwnerOfPage = page.createdByUserId === currentUserId;
        this.pageOwnerUsername = page.createdByUsername;

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
    // Lock out onSelectionChange so it cannot overwrite our explicit size=16
    this.isInteractingWithToolbar = true;
    this.restoreSelection();
    document.execCommand('removeFormat');
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && selection.toString().length > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = '16px';
      span.style.color = 'var(--color-neutral)';
      span.style.fontWeight = 'normal';
      span.style.fontStyle = 'normal';
      span.style.textDecoration = 'none';
      span.style.backgroundColor = 'transparent';
      try {
        range.surroundContents(span);
      } catch (e) {
        const content = range.extractContents();
        span.appendChild(content);
        range.insertNode(span);
      }
      // Explicitly set the displayed size to 16 BEFORE releasing the lock
      this.currentFontSize = 16;

      const newRange = document.createRange();
      newRange.selectNode(span);
      selection.removeAllRanges();
      selection.addRange(newRange);
      this.savedRange = newRange.cloneRange();
      this.showToolbar = true;
    }
    this.isDirty = true;
    // Release lock after a tick so Angular has rendered the new value
    setTimeout(() => { this.isInteractingWithToolbar = false; }, 100);
  }

  // Inline and Cover Image Picker Actions
  openInlineImagePicker(): void {
    this.inlinePhotoInput?.nativeElement.click();
  }

  addInlineImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert('Photo must be 1MB max');
      input.value = '';
      return;
    }

    this.isDirty = true;
    this.lastSavedLabel = 'Uploading image...';

    const formData = new FormData();
    formData.append('file', file);

    this.pageService.uploadImage(formData).subscribe({
      next: (res: any) => {
        if (this.editor && res.url) {
          const imgHtml = `<figure class="editor-inline-image" style="margin: 1rem 0; text-align: center;"><img src="${res.url}" style="max-width: 100%; max-height: 400px; border-radius: 0.5rem; display: inline-block;" /></figure><p><br></p>`;
          this.editor.nativeElement.innerHTML += imgHtml;
          this.lastSavedLabel = 'Image uploaded successfully';
        }
        input.value = '';
      },
      error: (err) => {
        console.error('Error uploading image:', err);
        this.lastSavedLabel = 'Failed to upload image';
        alert('Failed to upload image. Please try again.');
        input.value = '';
      }
    });
  }

  addImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert('Photo must be 1MB max');
      input.value = '';
      return;
    }

    this.isDirty = true;
    this.lastSavedLabel = 'Uploading cover image...';

    const formData = new FormData();
    formData.append('file', file);

    this.pageService.uploadImage(formData).subscribe({
      next: (res: any) => {
        if (res.url) {
          this.imageDataUrl = res.url;
          this.lastSavedLabel = 'Cover image uploaded';
        }
        input.value = '';
      },
      error: (err) => {
        console.error('Error uploading cover image:', err);
        this.lastSavedLabel = 'Failed to upload cover image';
        alert('Failed to upload cover image. Please try again.');
        input.value = '';
      }
    });
  }

  // Notifications bell actions
  toggleNotifications(): void {
    this.isNotificationsOpen = !this.isNotificationsOpen;
  }

  loadInvitations(): void {
    this.workspaceService.getInvitations().subscribe({
      next: (invitations) => {
        this.pendingInvitations = invitations;
      },
      error: (err) => {
        console.error('Error loading workspace invitations:', err);
      }
    });

    this.pageService.getPageInvitations().subscribe({
      next: (invitations) => {
        this.pendingPageInvitations = invitations;
      },
      error: (err) => {
        console.error('Error loading page invitations:', err);
      }
    });
  }

  respondInvitation(invitation: WorkspaceInvitation, accept: boolean): void {
    this.workspaceService.respondToInvitation(invitation.id, accept).subscribe({
      next: () => {
        this.loadInvitations();
        if (accept) {
          localStorage.setItem('activeWorkspaceId', String(invitation.workspaceId));
          window.location.reload();
        }
      },
      error: (err) => {
        console.error('Error responding to workspace invitation:', err);
      }
    });
  }

  respondPageInvitation(invitation: PageInvitation, accept: boolean): void {
    this.pageService.respondToPageInvitation(invitation.id, accept).subscribe({
      next: () => {
        this.loadInvitations();
      },
      error: (err) => {
        console.error('Error responding to page invitation:', err);
      }
    });
  }

  private htmlToJson(element: HTMLElement): string {
    const blocks: JsonBlock[] = [];

    // Prepend cover photo block if it is present!
    if (this.imageDataUrl) {
      blocks.push({
        type: 'cover',
        spans: [{ text: this.imageDataUrl, size: '16px' }]
      });
    }

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

        if (tag === 'img') {
          blocks.push({
            type: 'img',
            spans: [{ text: el.getAttribute('src') || '', size: '16px' }]
          });
        } else if (tag === 'figure' && el.querySelector('img')) {
          const img = el.querySelector('img');
          blocks.push({
            type: 'img',
            spans: [{ text: img?.getAttribute('src') || '', size: '16px' }]
          });
        } else if (['p', 'div', 'h2', 'h1', 'h3', 'ul', 'ol', 'li'].includes(tag)) {
          // Check if this block contains an inline image
          const nestedImg = el.querySelector('img');
          if (nestedImg) {
            blocks.push({
              type: 'img',
              spans: [{ text: nestedImg.getAttribute('src') || '', size: '16px' }]
            });
          } else {
            const text = el.innerText || '';
            const hasBr = el.querySelector('br') !== null;
            const defSize = this.getDefaultSizeForBlockType(tag);

            if (!text.replace(/\u200B/g, '').trim() && (hasBr || el.innerHTML === '')) {
              blocks.push({
                type: tag,
                spans: [{ text: '\n', size: defSize }]
              });
            } else {
              const spans = this.parseBlockSpans(el, tag);
              blocks.push({
                type: tag,
                spans: spans.length > 0 ? spans : [{ text: '\n', size: defSize }]
              });
            }
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
        if (tagName === 'FONT') {
          const fontColor = el.getAttribute('color');
          if (fontColor) localStyles.color = fontColor;
        }

        if (style.fontWeight === 'bold' || style.fontWeight === '700') localStyles.bold = true;
        if (style.fontStyle === 'italic') localStyles.italic = true;
        if (style.textDecoration && style.textDecoration.includes('underline')) localStyles.underline = true;

        if (style.fontSize) localStyles.size = style.fontSize;
        if (style.color) {
          localStyles.color = style.color;
        } else if (tagName === 'FONT') {
          const fontColor = el.getAttribute('color');
          if (fontColor) localStyles.color = fontColor;
        }

        if (style.backgroundColor && style.backgroundColor !== 'transparent') {
          localStyles.highlight = style.backgroundColor;
        }

        const childNodes = el.childNodes;
        for (let i = 0; i < childNodes.length; i++) {
          traverse(childNodes[i], localStyles);
        }
      }
    };

    const defSize = this.getDefaultSizeForBlockType(type);

    // Also inherit styles from blockElement itself!
    const blockStyle = blockElement.style;
    const initialStyles: Partial<JsonSpan> = {
      size: blockStyle.fontSize || defSize
    };
    if (blockStyle.fontWeight === 'bold' || blockStyle.fontWeight === '700') initialStyles.bold = true;
    if (blockStyle.fontStyle === 'italic') initialStyles.italic = true;
    if (blockStyle.textDecoration && blockStyle.textDecoration.includes('underline')) initialStyles.underline = true;
    if (blockStyle.color) initialStyles.color = blockStyle.color;
    if (blockStyle.backgroundColor && blockStyle.backgroundColor !== 'transparent') initialStyles.highlight = blockStyle.backgroundColor;

    const children = blockElement.childNodes;
    for (let i = 0; i < children.length; i++) {
      traverse(children[i], initialStyles);
    }

    return spans;
  }

  private jsonToHtml(jsonStr: string): string {
    if (!jsonStr) return '<p><br></p>';
    try {
      const blocks = JSON.parse(jsonStr);
      if (!Array.isArray(blocks)) return '<p><br></p>';

      let html = '';
      this.imageDataUrl = ''; // reset first

      for (const block of blocks) {
        const tag = block.type || 'p';

        // Check if cover photo block
        if (tag === 'cover') {
          if (block.spans && block.spans[0]) {
            this.imageDataUrl = block.spans[0].text;
          }
          continue;
        }

        // Check if inline image block
        if (tag === 'img') {
          const src = block.spans && block.spans[0] ? block.spans[0].text : '';
          html += `<figure class="editor-inline-image" style="margin: 1rem 0; text-align: center;"><img src="${src}" style="max-width: 100%; max-height: 400px; border-radius: 0.5rem; display: inline-block;" /></figure>`;
          continue;
        }

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
