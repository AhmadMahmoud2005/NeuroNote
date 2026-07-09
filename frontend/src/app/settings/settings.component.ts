import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SlideBarComponent } from '../slide-bar/slide-bar.component';
import { WorkspaceTopbarComponent } from '../workspace-topbar/workspace-topbar.component';
import { SettingsService, UserProfile } from '../services/settings.service';
import { ThemeService } from '../services/theme.service';

type SettingsSection = 'profile' | 'appearance';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, SlideBarComponent, WorkspaceTopbarComponent],
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
  activeSection: SettingsSection = 'profile';

  profile: UserProfile = {
    id: 1,
    fullName: '',
    email: '',
    bio: '',
    avatarUrl: ''
  };

  constructor(
    private readonly settingsService: SettingsService,
    private readonly themeService: ThemeService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.userId = Number(localStorage.getItem('userId')) || 1;
    this.isDarkMode = this.themeService.isDarkMode();
    this.isCompactLayout = this.themeService.isCompactLayout();

    this.route.fragment.subscribe(fragment => {
      if (fragment === 'appearance') {
        this.activeSection = 'appearance';
        this.scrollToSection('appearance');
      } else {
        this.activeSection = 'profile';
      }
    });

    this.settingsService.getProfile(this.userId).subscribe(profile => {
      this.profile = profile;
    });
  }

  showSection(section: SettingsSection): void {
    this.activeSection = section;
    this.scrollToSection(section);
  }

  saveProfile(): void {
    this.isSaving = true;
    this.statusMessage = '';

    this.settingsService.updateProfile(this.userId, {
      fullName: this.profile.fullName,
      email: this.profile.email,
      bio: this.profile.bio
    }).subscribe(profile => {
      this.profile = profile;
      this.isSaving = false;
      this.statusMessage = 'Changes saved';
    });
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
    this.isDarkMode = this.themeService.toggleDarkMode();
  }

  toggleCompactLayout(): void {
    this.isCompactLayout = this.themeService.toggleCompactLayout();
  }

  private scrollToSection(section: SettingsSection): void {
    window.setTimeout(() => {
      document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }
}
