import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SlideBarComponent } from '../slide-bar/slide-bar.component';
import { TaskService, TaskItem } from '../services/task.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, SlideBarComponent],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css'
})
export class TasksComponent implements OnInit {
  tasks: TaskItem[] = [];
  isLoading = true;

  // Sorting and filtering state
  sortBy = 'createdAt';
  sortOrder = 'desc';
  keepCompletedAtBottom = true;

  newTask = {
    title: '',
    description: '',
    priority: 'Medium',
    complexity: 'Medium',
    dueDate: ''
  };

  readonly priorities = ['Low', 'Medium', 'High'];
  readonly complexities = ['Easy', 'Medium', 'Hard'];

  constructor(
    private readonly taskService: TaskService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.isLoading = true;
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading team tasks:', err);
        this.isLoading = false;
      }
    });
  }

  get openTasksCount(): number {
    return this.tasks.filter(task => !task.isCompleted).length;
  }

  createTask(): void {
    const title = this.newTask.title.trim();
    if (!title) return;

    this.taskService.createTask(null, {
      title,
      description: this.newTask.description.trim() || null,
      priority: this.newTask.priority,
      complexity: this.newTask.complexity,
      dueDate: this.newTask.dueDate ? this.newTask.dueDate : null
    }).subscribe({
      next: () => {
        this.loadTasks();
        this.newTask = { title: '', description: '', priority: 'Medium', complexity: 'Medium', dueDate: '' };
      },
      error: (err) => {
        console.error('Error creating task:', err);
        alert('Failed to create task. Please try again.');
      }
    });
  }

  toggleTask(taskId: number): void {
    this.taskService.toggleTask(taskId).subscribe({
      next: () => {
        this.loadTasks();
      },
      error: (err) => {
        console.error('Error toggling task:', err);
      }
    });
  }

  deleteTask(taskId: number): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(taskId).subscribe({
        next: () => {
          this.loadTasks();
        },
        error: (err) => {
          console.error('Error deleting task:', err);
        }
      });
    }
  }

  getSortedTasks(): TaskItem[] {
    const priorityMap: { [key: string]: number } = { 'Low': 1, 'Medium': 2, 'High': 3 };
    const complexityMap: { [key: string]: number } = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };

    // 1. Sort all tasks based on parameters
    const sorted = [...this.tasks].sort((a, b) => {
      let comparison = 0;
      if (this.sortBy === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (this.sortBy === 'dueDate') {
        if (!a.dueDate && !b.dueDate) comparison = 0;
        else if (!a.dueDate) return 1; // nulls last
        else if (!b.dueDate) return -1;
        else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (this.sortBy === 'priority') {
        const valA = priorityMap[a.priority] || 0;
        const valB = priorityMap[b.priority] || 0;
        comparison = valA - valB;
      } else if (this.sortBy === 'complexity') {
        const valA = complexityMap[a.complexity] || 0;
        const valB = complexityMap[b.complexity] || 0;
        comparison = valA - valB;
      }

      return this.sortOrder === 'desc' ? -comparison : comparison;
    });

    // 2. If keepCompletedAtBottom is true, push completed to the bottom of the list
    if (this.keepCompletedAtBottom) {
      const active = sorted.filter(t => !t.isCompleted);
      const completed = sorted.filter(t => t.isCompleted);
      return [...active, ...completed];
    }

    return sorted;
  }

  formatDateOnly(dateStr: string | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
