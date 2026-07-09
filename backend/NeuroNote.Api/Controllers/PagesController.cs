using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NeuroNote.Api.Data;
using NeuroNote.Api.DTOs.Pages;
using NeuroNote.Api.Models;
using System.Security.Claims;

namespace NeuroNote.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class PagesController : ControllerBase
{
    private readonly NeuroNoteDbContext _context;

    public PagesController(NeuroNoteDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetPages([FromQuery] int workspaceId)
    {
        var pages = await _context.Pages
            .Where(p => p.WorkspaceId == workspaceId && !p.IsArchived)
            .OrderBy(p => p.SortOrder)
            .ThenByDescending(p => p.CreatedAt)
            .Select(p => new PageResponseDto
            {
                Id = p.Id,
                WorkspaceId = p.WorkspaceId,
                ParentPageId = p.ParentPageId,
                CreatedByUserId = p.CreatedByUserId,
                Title = p.Title,
                Slug = p.Slug,
                Content = p.Content,
                PlainText = p.PlainText,
                IsArchived = p.IsArchived,
                SortOrder = p.SortOrder,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            })
            .ToListAsync();

        return Ok(pages);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPage(int id)
    {
        var page = await _context.Pages.FindAsync(id);

        if (page == null)
            return NotFound(new { message = "Page not found." });

        return Ok(new PageResponseDto
        {
            Id = page.Id,
            WorkspaceId = page.WorkspaceId,
            ParentPageId = page.ParentPageId,
            CreatedByUserId = page.CreatedByUserId,
            Title = page.Title,
            Slug = page.Slug,
            Content = page.Content,
            PlainText = page.PlainText,
            IsArchived = page.IsArchived,
            SortOrder = page.SortOrder,
            CreatedAt = page.CreatedAt,
            UpdatedAt = page.UpdatedAt
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreatePage([FromBody] CreatePageDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);

        var slug = await GenerateUniqueSlugAsync(dto.WorkspaceId, dto.Title);

        var page = new Page
        {
            WorkspaceId = dto.WorkspaceId,
            ParentPageId = dto.ParentPageId,
            CreatedByUserId = userId,
            Title = dto.Title,
            Slug = slug,
            Content = dto.Content,
            PlainText = ExtractPlainText(dto.Content),
            IsArchived = false,
            SortOrder = 0,
            CreatedAt = DateTime.UtcNow
        };

        _context.Pages.Add(page);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPage), new { id = page.Id }, new PageResponseDto
        {
            Id = page.Id,
            WorkspaceId = page.WorkspaceId,
            ParentPageId = page.ParentPageId,
            CreatedByUserId = page.CreatedByUserId,
            Title = page.Title,
            Slug = page.Slug,
            Content = page.Content,
            PlainText = page.PlainText,
            IsArchived = page.IsArchived,
            SortOrder = page.SortOrder,
            CreatedAt = page.CreatedAt,
            UpdatedAt = page.UpdatedAt
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePage(int id, [FromBody] UpdatePageDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var page = await _context.Pages.FindAsync(id);

        if (page == null)
            return NotFound(new { message = "Page not found." });

        page.Title = dto.Title;
        page.Content = dto.Content;
        page.PlainText = ExtractPlainText(dto.Content);
        page.UpdatedAt = DateTime.UtcNow;

        // If the title changed, we might want to update the slug as well
        page.Slug = await GenerateUniqueSlugAsync(page.WorkspaceId, dto.Title);

        await _context.SaveChangesAsync();

        return Ok(new PageResponseDto
        {
            Id = page.Id,
            WorkspaceId = page.WorkspaceId,
            ParentPageId = page.ParentPageId,
            CreatedByUserId = page.CreatedByUserId,
            Title = page.Title,
            Slug = page.Slug,
            Content = page.Content,
            PlainText = page.PlainText,
            IsArchived = page.IsArchived,
            SortOrder = page.SortOrder,
            CreatedAt = page.CreatedAt,
            UpdatedAt = page.UpdatedAt
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePage(int id)
    {
        var page = await _context.Pages.FindAsync(id);

        if (page == null)
            return NotFound(new { message = "Page not found." });

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);

        // destruction guard: only creator can delete
        if (page.CreatedByUserId != userId)
        {
            return Forbid();
        }

        _context.Pages.Remove(page);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private string GenerateSlug(string title)
    {
        if (string.IsNullOrWhiteSpace(title)) return "untitled";

        var slug = title.ToLowerInvariant().Trim();
        // Remove invalid characters
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        // Replace spaces with hyphens
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"\s+", "-");
        // Replace double hyphens
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"-+", "-");
        return slug;
    }

    private async Task<string> GenerateUniqueSlugAsync(int workspaceId, string title)
    {
        var baseSlug = GenerateSlug(title);
        var slug = baseSlug;
        int suffix = 1;

        while (await _context.Pages.AnyAsync(p => p.WorkspaceId == workspaceId && p.Slug == slug))
        {
            slug = $"{baseSlug}-{suffix}";
            suffix++;
        }
        return slug;
    }

    private string ExtractPlainText(string? jsonContent)
    {
        if (string.IsNullOrWhiteSpace(jsonContent)) return string.Empty;
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(jsonContent);
            if (doc.RootElement.ValueKind != System.Text.Json.JsonValueKind.Array) return string.Empty;

            var sb = new System.Text.StringBuilder();
            foreach (var block in doc.RootElement.EnumerateArray())
            {
                if (block.TryGetProperty("spans", out var spans) && spans.ValueKind == System.Text.Json.JsonValueKind.Array)
                {
                    foreach (var span in spans.EnumerateArray())
                    {
                        if (span.TryGetProperty("text", out var text))
                        {
                            sb.Append(text.GetString());
                        }
                    }
                }
                sb.AppendLine();
            }
            return sb.ToString().Trim();
        }
        catch
        {
            return string.Empty;
        }
    }
}
