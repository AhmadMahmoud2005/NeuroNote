import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SlideBarComponent } from '../slide-bar/slide-bar.component';

type TaskPriority = 'Low' | 'Medium' | 'High';

interface TaskItem {
  id: number;
  workspaceId: number;
  title: string;
  priority: TaskPriority;
  dueDate: string;
  isCompleted: boolean;
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, SlideBarComponent],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css'
})
export class TasksComponent implements OnInit {
  activeWorkspaceId = 1;
  tasks: TaskItem[] = [];

  newTask = {
    title: '',
    priority: 'Medium' as TaskPriority,
    dueDate: ''
  };

  readonly priorities: TaskPriority[] = ['Low', 'Medium', 'High'];

  ngOnInit(): void {
    this.activeWorkspaceId = Number(localStorage.getItem('activeWorkspaceId')) || 1;
    this.tasks = this.loadTasks();
  }

  get workspaceTasks(): TaskItem[] {
    return this.tasks.filter(task => task.workspaceId === this.activeWorkspaceId);
  }

  get openTasksCount(): number {
    return this.workspaceTasks.filter(task => !task.isCompleted).length;
  }

  createTask(): void {
    const title = this.newTask.title.trim();

    if (!title) {
      return;
    }

    const task: TaskItem = {
      id: Date.now(),
      workspaceId: this.activeWorkspaceId,
      title,
      priority: this.newTask.priority,
      dueDate: this.newTask.dueDate,
      isCompleted: false
    };

    this.tasks = [task, ...this.tasks];
    this.saveTasks();
    this.newTask = { title: '', priority: 'Medium', dueDate: '' };
  }

  toggleTask(taskId: number): void {
    this.tasks = this.tasks.map(task =>
      task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
    );
    this.saveTasks();
  }

  private loadTasks(): TaskItem[] {
    const storedTasks = localStorage.getItem('tasks');

    if (storedTasks) {
      try {
        const parsedTasks = JSON.parse(storedTasks) as TaskItem[];

        if (Array.isArray(parsedTasks)) {
          return parsedTasks;
        }
      } catch {
        localStorage.removeItem('tasks');
      }
    }

    const defaultTasks: TaskItem[] = [
      {
        id: 1,
        workspaceId: 1,
        title: 'Review Q4 roadmap notes',
        priority: 'High',
        dueDate: '2026-07-12',
        isCompleted: false
      },
      {
        id: 2,
        workspaceId: 1,
        title: 'Prepare design system checklist',
        priority: 'Medium',
        dueDate: '2026-07-15',
        isCompleted: true
      }
    ];

    localStorage.setItem('tasks', JSON.stringify(defaultTasks));
    return defaultTasks;
  }

  private saveTasks(): void {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
  }
}
