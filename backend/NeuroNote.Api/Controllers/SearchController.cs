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
    public async Task<IActionResult> Search([FromQuery(Name = "q")] string q, [FromQuery] int? workspaceId = null)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);
        var searchQ = (q ?? "").Trim();

        var results = new SearchResultDto();

        if (string.IsNullOrEmpty(searchQ))
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
        // Includes notes from user's workspaces and notes explicitly shared with the user.
        results.Notes = await _context.Pages
            .Include(p => p.Workspace)
            .Where(p => 
                ((userWorkspaceIds.Contains(p.WorkspaceId) || 
                  _context.SharedPages.Any(sp => sp.PageId == p.Id && sp.SharedWithUserId == userId && sp.Status == "Accepted"))
                 && (!workspaceId.HasValue || p.WorkspaceId == workspaceId.Value)
                 && (p.Title.Contains(searchQ) || (p.PlainText != null && p.PlainText.Contains(searchQ))))
            )
            .OrderByDescending(p => p.UpdatedAt ?? p.CreatedAt)
            .Take(100)
            .Select(p => new SearchNoteDto
            {
                Id = p.Id,
                Title = p.Title,
                Excerpt = p.PlainText ?? string.Empty,
                UpdatedAt = p.UpdatedAt.HasValue ? p.UpdatedAt.Value.AddHours(3) : p.CreatedAt.AddHours(3), // Cairo timezone offset
                WorkspaceName = p.Workspace.Name
            })
            .ToListAsync();

        if (workspaceId.HasValue)
        {
            // If filtering by a workspace, return empty lists for Tasks and Workspaces
            results.Tasks = new List<SearchTaskDto>();
            results.Workspaces = new List<SearchWorkspaceDto>();
        }
        else
        {
            // 3. Search Tasks
            results.Tasks = await _context.TeamTasks
                .Where(t => (t.CreatedByUserId == userId || userWorkspaceIds.Contains(t.WorkspaceId)) && (t.Title.Contains(searchQ) || (t.Description != null && t.Description.Contains(searchQ))))
                .OrderByDescending(t => t.CreatedAt)
                .Take(100)
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
                .Where(w => userWorkspaceIds.Contains(w.Id) && (w.Name.Contains(searchQ) || (w.Description != null && w.Description.Contains(searchQ))))
                .Take(100)
                .Select(w => new SearchWorkspaceDto
                {
                    Id = w.Id,
                    Name = w.Name,
                    Description = w.Description ?? string.Empty,
                    OwnerUsername = w.OwnerUser.Username
                })
                .ToListAsync();
        }

        return Ok(results);
    }
}
