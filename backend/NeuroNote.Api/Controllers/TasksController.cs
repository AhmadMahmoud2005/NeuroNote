using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NeuroNote.Api.Data;
using NeuroNote.Api.DTOs.Tasks;
using NeuroNote.Api.Models;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace NeuroNote.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class TasksController : ControllerBase
{
    private readonly NeuroNoteDbContext _context;

    public TasksController(NeuroNoteDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetTasks([FromQuery] int? workspaceId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);

        var query = _context.TeamTasks.Include(t => t.CreatedByUser).AsQueryable();

        if (workspaceId.HasValue && workspaceId.Value > 0)
        {
            var wsId = workspaceId.Value;
            // Authorize workspace access
            var hasAccess = await _context.WorkspaceMembers.AnyAsync(m => m.WorkspaceId == wsId && m.UserId == userId)
                || await _context.Workspaces.AnyAsync(w => w.Id == wsId && w.OwnerUserId == userId);

            if (!hasAccess)
                return Forbid();

            query = query.Where(t => t.WorkspaceId == wsId);
        }
        else
        {
            // If no workspace ID provided, load every task the logged-in user has (i.e. created by them)
            query = query.Where(t => t.CreatedByUserId == userId);
        }

        var tasks = await query
            .OrderBy(t => t.IsCompleted)
            .ThenByDescending(t => t.CreatedAt)
            .Select(t => new TaskResponseDto
            {
                Id = t.Id,
                WorkspaceId = t.WorkspaceId,
                Title = t.Title,
                Description = t.Description,
                Priority = t.Priority,
                Complexity = t.Complexity,
                DueDate = t.DueDate.HasValue ? t.DueDate.Value.AddHours(3) : null, // Add Cairo timezone offset (UTC+3)
                IsCompleted = t.IsCompleted,
                CreatedByUserId = t.CreatedByUserId,
                CreatedByUsername = t.CreatedByUser.Username,
                CreatedAt = t.CreatedAt.AddHours(3) // Add Cairo timezone offset (UTC+3)
            })
            .ToListAsync();

        return Ok(tasks);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTask([FromQuery] int? workspaceId, [FromBody] CreateTaskDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);
        int finalWorkspaceId = 0;

        if (workspaceId.HasValue && workspaceId.Value > 0)
        {
            finalWorkspaceId = workspaceId.Value;
            // Authorize workspace access
            var hasAccess = await _context.WorkspaceMembers.AnyAsync(m => m.WorkspaceId == finalWorkspaceId && m.UserId == userId)
                || await _context.Workspaces.AnyAsync(w => w.Id == finalWorkspaceId && w.OwnerUserId == userId);

            if (!hasAccess)
                return Forbid();
        }
        else
        {
            // If no workspace ID, find the user's first/default workspace
            var defaultWs = await _context.Workspaces
                .Where(w => w.OwnerUserId == userId)
                .OrderBy(w => w.Id)
                .FirstOrDefaultAsync();

            if (defaultWs == null)
            {
                // Fallback to first joined workspace
                var joinedWs = await _context.WorkspaceMembers
                    .Where(m => m.UserId == userId)
                    .OrderBy(m => m.JoinedAt)
                    .FirstOrDefaultAsync();

                if (joinedWs == null)
                {
                    return BadRequest(new { message = "You must have at least one workspace to create tasks." });
                }
                finalWorkspaceId = joinedWs.WorkspaceId;
            }
            else
            {
                finalWorkspaceId = defaultWs.Id;
            }
        }

        var task = new TeamTask
        {
            WorkspaceId = finalWorkspaceId,
            CreatedByUserId = userId,
            Title = dto.Title,
            Description = dto.Description,
            Priority = dto.Priority,
            Complexity = dto.Complexity,
            DueDate = dto.DueDate,
            IsCompleted = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.TeamTasks.Add(task);
        await _context.SaveChangesAsync();

        var createdTask = await _context.TeamTasks
            .Include(t => t.CreatedByUser)
            .FirstAsync(t => t.Id == task.Id);

        return Ok(new TaskResponseDto
        {
            Id = createdTask.Id,
            WorkspaceId = createdTask.WorkspaceId,
            Title = createdTask.Title,
            Description = createdTask.Description,
            Priority = createdTask.Priority,
            Complexity = createdTask.Complexity,
            DueDate = createdTask.DueDate.HasValue ? createdTask.DueDate.Value.AddHours(3) : null, // Add Cairo timezone offset (UTC+3)
            IsCompleted = createdTask.IsCompleted,
            CreatedByUserId = createdTask.CreatedByUserId,
            CreatedByUsername = createdTask.CreatedByUser.Username,
            CreatedAt = createdTask.CreatedAt.AddHours(3) // Add Cairo timezone offset (UTC+3)
        });
    }

    [HttpPut("{id}/toggle")]
    public async Task<IActionResult> ToggleTask(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);

        var task = await _context.TeamTasks.FindAsync(id);
        if (task == null)
            return NotFound(new { message = "Task not found." });

        // Authorize workspace access
        var hasAccess = await _context.WorkspaceMembers.AnyAsync(m => m.WorkspaceId == task.WorkspaceId && m.UserId == userId)
            || await _context.Workspaces.AnyAsync(w => w.Id == task.WorkspaceId && w.OwnerUserId == userId);

        if (!hasAccess)
            return Forbid();

        task.IsCompleted = !task.IsCompleted;
        task.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Task status toggled successfully.", isCompleted = task.IsCompleted });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTask(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);

        var task = await _context.TeamTasks.FindAsync(id);
        if (task == null)
            return NotFound(new { message = "Task not found." });

        // Authorize workspace access
        var hasAccess = await _context.WorkspaceMembers.AnyAsync(m => m.WorkspaceId == task.WorkspaceId && m.UserId == userId)
            || await _context.Workspaces.AnyAsync(w => w.Id == task.WorkspaceId && w.OwnerUserId == userId);

        if (!hasAccess)
            return Forbid();

        _context.TeamTasks.Remove(task);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
