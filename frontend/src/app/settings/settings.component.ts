import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SlideBarComponent } from '../slide-bar/slide-bar.component';
import { SettingsService, UserProfile } from '../services/settings.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, SlideBarComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  @ViewChild('avatarInput') avatarInput?: ElementRef<HTMLInputElement>;

  userId = 1;
  isSaving = false;
  statusMessage = '';
  isDarkMode = false;
  isCompactLayout = true;

  profile: UserProfile = {
    id: 1,
    fullName: '',
    email: '',
    bio: '',
    avatarUrl: ''
  };

  constructor(
    private readonly settingsService: SettingsService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser;
    if (user) {
      this.userId = user.userId;
    }
    this.isDarkMode = localStorage.getItem('theme') === 'dark';
    this.isCompactLayout = localStorage.getItem('compactLayout') !== 'false';
    this.applyTheme();

    this.settingsService.getProfile(this.userId).subscribe(profile => {
      this.profile = profile;
    });
  }

  saveProfile(): void {
    this.isSaving = true;
    this.statusMessage = '';

    this.settingsService.updateProfile(this.userId, {
      fullName: this.profile.fullName,
      email: this.profile.email,
      bio: this.profile.bio
    }).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.isSaving = false;
        this.statusMessage = 'Changes saved';

        // Update AuthService current user so the name changes globally in all views instantly
        const user = this.authService.currentUser;
        if (user) {
          const updatedUser = { ...user, fullName: profile.fullName, email: profile.email };
          localStorage.setItem('auth_user', JSON.stringify(updatedUser));
          // Trigger behavior subject updates
          (this.authService as any).currentUserSubject.next(updatedUser);
        }
      },
      error: () => {
        this.isSaving = false;
        this.statusMessage = 'Failed to save changes';
      }
    });
  }

  getAvatarCharacter(): string {
    if (!this.profile.fullName) return 'A';
    const trimmed = this.profile.fullName.trim();
    return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : 'A';
  }

  openAvatarPicker(): void {
    this.avatarInput?.nativeElement.click();
  }

  updateAvatar(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (file.size > 1024 * 1024) {
      this.statusMessage = 'Avatar must be 1MB max';
      input.value = '';
      return;
    }

    this.isSaving = true;
    this.settingsService.updateAvatar(this.userId, file).subscribe(profile => {
      this.profile = profile;
      this.isSaving = false;
      this.statusMessage = 'Avatar updated';
      input.value = '';
    });
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  toggleCompactLayout(): void {
    this.isCompactLayout = !this.isCompactLayout;
    localStorage.setItem('compactLayout', String(this.isCompactLayout));
    document.body.classList.toggle('compact-layout', this.isCompactLayout);
  }

  onLogout(): void {
    if (confirm('Are you sure you want to log out?')) {
      this.authService.logout();
    }
  }

  private applyTheme(): void {
    document.body.classList.toggle('dark-theme', this.isDarkMode);
    document.body.classList.toggle('compact-layout', this.isCompactLayout);
  }
}
