using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NeuroNote.Api.Data;
using NeuroNote.Api.DTOs.Search;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace NeuroNote.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class SearchController : ControllerBase
{
    private readonly NeuroNoteDbContext _context;

    public SearchController(NeuroNoteDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string query)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);
        var q = (query ?? "").Trim();

        var results = new SearchResultDto();

        if (string.IsNullOrEmpty(q))
        {
            return Ok(results);
        }

        // 1. Fetch user's workspaces
        var userWorkspaceIds = await _context.Workspaces
            .Where(w => w.OwnerUserId == userId)
            .Select(w => w.Id)
            .Union(_context.WorkspaceMembers.Where(m => m.UserId == userId).Select(m => m.WorkspaceId))
            .ToListAsync();

        // 2. Search Notes (Case-insensitive database contains search)
        results.Notes = await _context.Pages
            .Include(p => p.Workspace)
            .Where(p => userWorkspaceIds.Contains(p.WorkspaceId) && (p.Title.Contains(q) || (p.PlainText != null && p.PlainText.Contains(q))))
            .OrderByDescending(p => p.UpdatedAt ?? p.CreatedAt)
            .Take(15)
            .Select(p => new SearchNoteDto
            {
                Id = p.Id,
                Title = p.Title,
                Excerpt = p.PlainText ?? string.Empty,
                UpdatedAt = p.UpdatedAt.HasValue ? p.UpdatedAt.Value.AddHours(3) : p.CreatedAt.AddHours(3), // Cairo timezone offset
                WorkspaceName = p.Workspace.Name
            })
            .ToListAsync();

        // 3. Search Tasks
        results.Tasks = await _context.TeamTasks
            .Where(t => (t.CreatedByUserId == userId || userWorkspaceIds.Contains(t.WorkspaceId)) && (t.Title.Contains(q) || (t.Description != null && t.Description.Contains(q))))
            .OrderByDescending(t => t.CreatedAt)
            .Take(15)
            .Select(t => new SearchTaskDto
            {
                Id = t.Id,
                Title = t.Title,
                Description = t.Description ?? string.Empty,
                IsCompleted = t.IsCompleted,
                DueDate = t.DueDate.HasValue ? t.DueDate.Value.AddHours(3) : null // Cairo timezone offset
            })
            .ToListAsync();

        // 4. Search Workspaces
        results.Workspaces = await _context.Workspaces
            .Include(w => w.OwnerUser)
            .Where(w => userWorkspaceIds.Contains(w.Id) && (w.Name.Contains(q) || (w.Description != null && w.Description.Contains(q))))
            .Take(10)
            .Select(w => new SearchWorkspaceDto
            {
                Id = w.Id,
                Name = w.Name,
                Description = w.Description ?? string.Empty,
                OwnerUsername = w.OwnerUser.Username
            })
            .ToListAsync();

        return Ok(results);
    }
}
