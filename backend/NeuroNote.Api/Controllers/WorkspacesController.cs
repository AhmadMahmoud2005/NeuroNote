using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NeuroNote.Api.Data;
using NeuroNote.Api.DTOs.Workspaces;
using NeuroNote.Api.Models;
using System.Security.Claims;

namespace NeuroNote.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class WorkspacesController : ControllerBase
{
    private readonly NeuroNoteDbContext _context;

    public WorkspacesController(NeuroNoteDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetWorkspaces()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);

        var workspaces = await _context.Workspaces
            .Where(w => w.OwnerUserId == userId || w.Members.Any(m => m.UserId == userId))
            .OrderByDescending(w => w.CreatedAt)
            .Select(w => new WorkspaceResponseDto
            {
                Id = w.Id,
                Name = w.Name,
                Slug = w.Slug,
                Description = w.Description,
                OwnerUserId = w.OwnerUserId,
                CreatedAt = w.CreatedAt
            })
            .ToListAsync();

        return Ok(workspaces);
    }

    [HttpPost]
    public async Task<IActionResult> CreateWorkspace([FromBody] CreateWorkspaceDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);

        var slug = await GenerateUniqueWorkspaceSlugAsync(dto.Name);

        var workspace = new Workspace
        {
            Name = dto.Name,
            Description = dto.Description,
            Slug = slug,
            OwnerUserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Workspaces.Add(workspace);
        await _context.SaveChangesAsync();

        return Ok(new WorkspaceResponseDto
        {
            Id = workspace.Id,
            Name = workspace.Name,
            Slug = workspace.Slug,
            Description = workspace.Description,
            OwnerUserId = workspace.OwnerUserId,
            CreatedAt = workspace.CreatedAt
        });
    }

    private string GenerateSlug(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return "workspace";

        var slug = name.ToLowerInvariant().Trim();
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"\s+", "-");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"-+", "-");
        return slug;
    }

    private async Task<string> GenerateUniqueWorkspaceSlugAsync(string name)
    {
        var baseSlug = GenerateSlug(name);
        var slug = baseSlug;
        int suffix = 1;

        while (await _context.Workspaces.AnyAsync(w => w.Slug == slug))
        {
            slug = $"{baseSlug}-{suffix}";
            suffix++;
        }
        return slug;
    }
}
