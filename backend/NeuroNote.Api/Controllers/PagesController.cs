using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NeuroNote.Api.Data;
using NeuroNote.Api.DTOs.Pages;
using NeuroNote.Api.DTOs.Workspaces;
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
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);

        // Enforce workspace membership auth
        var hasAccess = await _context.WorkspaceMembers.AnyAsync(m => m.WorkspaceId == workspaceId && m.UserId == userId)
            || await _context.Workspaces.AnyAsync(w => w.Id == workspaceId && w.OwnerUserId == userId);

        if (!hasAccess)
            return Forbid();

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
                CreatedByUsername = p.CreatedByUser.Username,
                Title = p.Title,
                Slug = p.Slug,
                Content = p.Content,
                PlainText = p.PlainText,
                IsArchived = p.IsArchived,
                SortOrder = p.SortOrder,
                CreatedAt = p.CreatedAt.AddHours(3), // Add Cairo timezone offset (UTC+3)
                UpdatedAt = p.UpdatedAt.HasValue ? p.UpdatedAt.Value.AddHours(3) : null
            })
            .ToListAsync();

        return Ok(pages);
    }

    [HttpGet("shared")]
    public async Task<IActionResult> GetSharedPages()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);

        // Only return pages where status is Accepted
        var pages = await _context.SharedPages
            .Where(sp => sp.SharedWithUserId == userId && sp.Status == "Accepted")
            .Include(sp => sp.Page)
            .ThenInclude(p => p.CreatedByUser)
            .Select(sp => new PageResponseDto
            {
                Id = sp.Page.Id,
                WorkspaceId = sp.Page.WorkspaceId,
                ParentPageId = sp.Page.ParentPageId,
                CreatedByUserId = sp.Page.CreatedByUserId,
                CreatedByUsername = sp.Page.CreatedByUser.Username,
                Title = sp.Page.Title,
                Slug = sp.Page.Slug,
                Content = sp.Page.Content,
                PlainText = sp.Page.PlainText,
                IsArchived = sp.Page.IsArchived,
                SortOrder = sp.Page.SortOrder,
                CreatedAt = sp.Page.CreatedAt.AddHours(3), // Add Cairo timezone offset (UTC+3)
                UpdatedAt = sp.Page.UpdatedAt.HasValue ? sp.Page.UpdatedAt.Value.AddHours(3) : null
            })
            .ToListAsync();

        return Ok(pages);
    }

    [HttpGet("invitations")]
    public async Task<IActionResult> GetPageInvitations()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);

        var invitations = await _context.SharedPages
            .Where(sp => sp.SharedWithUserId == userId && sp.Status == "Pending")
            .Include(sp => sp.Page)
            .ThenInclude(p => p.CreatedByUser)
            .Select(sp => new PageInvitationDto
            {
                Id = sp.Id,
                PageId = sp.PageId,
                PageTitle = sp.Page.Title,
                SharedByUsername = sp.Page.CreatedByUser.Username,
                Permission = sp.Permission,
                SharedAt = sp.SharedAt.AddHours(3) // Add Cairo timezone offset (UTC+3)
            })
            .ToListAsync();

        return Ok(invitations);
    }

    [HttpPost("invitations/{invitationId}/respond")]
    public async Task<IActionResult> RespondToPageInvitation(int invitationId, [FromBody] RespondInvitationDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);

        var sharedPage = await _context.SharedPages.FindAsync(invitationId);
        if (sharedPage == null)
            return NotFound(new { message = "Invitation not found." });

        if (sharedPage.SharedWithUserId != userId)
            return Forbid();

        if (sharedPage.Status != "Pending")
            return BadRequest(new { message = "Invitation has already been processed." });

        if (dto.Accept)
        {
            sharedPage.Status = "Accepted";
            sharedPage.AcceptedAt = DateTime.UtcNow;
        }
        else
        {
            sharedPage.Status = "Declined";
            sharedPage.DeclinedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = dto.Accept ? "Page invitation accepted." : "Page invitation declined." });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPage(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);

        var page = await _context.Pages
            .Include(p => p.CreatedByUser)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (page == null)
            return NotFound(new { message = "Page not found." });

        // Check view permissions (only accepted shares can view)
        var isCreator = page.CreatedByUserId == userId;
        var isWorkspaceMember = await _context.WorkspaceMembers.AnyAsync(m => m.WorkspaceId == page.WorkspaceId && m.UserId == userId)
            || await _context.Workspaces.AnyAsync(w => w.Id == page.WorkspaceId && w.OwnerUserId == userId);
        var isPageShared = await _context.SharedPages.AnyAsync(sp => sp.PageId == id && sp.SharedWithUserId == userId && sp.Status == "Accepted");

        if (!isCreator && !isWorkspaceMember && !isPageShared)
        {
            return Forbid();
        }

        return Ok(new PageResponseDto
        {
            Id = page.Id,
            WorkspaceId = page.WorkspaceId,
            ParentPageId = page.ParentPageId,
            CreatedByUserId = page.CreatedByUserId,
            CreatedByUsername = page.CreatedByUser.Username,
            Title = page.Title,
            Slug = page.Slug,
            Content = page.Content,
            PlainText = page.PlainText,
            IsArchived = page.IsArchived,
            SortOrder = page.SortOrder,
            CreatedAt = page.CreatedAt.AddHours(3), // Add Cairo timezone offset (UTC+3)
            UpdatedAt = page.UpdatedAt.HasValue ? page.UpdatedAt.Value.AddHours(3) : null
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

        // Enforce workspace member constraint on creation
        var hasAccess = await _context.WorkspaceMembers.AnyAsync(m => m.WorkspaceId == dto.WorkspaceId && m.UserId == userId)
            || await _context.Workspaces.AnyAsync(w => w.Id == dto.WorkspaceId && w.OwnerUserId == userId);

        if (!hasAccess)
            return Forbid();

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

        var createdPage = await _context.Pages
            .Include(p => p.CreatedByUser)
            .FirstAsync(p => p.Id == page.Id);

        return CreatedAtAction(nameof(GetPage), new { id = page.Id }, new PageResponseDto
        {
            Id = createdPage.Id,
            WorkspaceId = createdPage.WorkspaceId,
            ParentPageId = createdPage.ParentPageId,
            CreatedByUserId = createdPage.CreatedByUserId,
            CreatedByUsername = createdPage.CreatedByUser.Username,
            Title = createdPage.Title,
            Slug = createdPage.Slug,
            Content = createdPage.Content,
            PlainText = createdPage.PlainText,
            IsArchived = createdPage.IsArchived,
            SortOrder = createdPage.SortOrder,
            CreatedAt = createdPage.CreatedAt.AddHours(3), // Add Cairo timezone offset (UTC+3)
            UpdatedAt = createdPage.UpdatedAt.HasValue ? createdPage.UpdatedAt.Value.AddHours(3) : null
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePage(int id, [FromBody] UpdatePageDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);

        var page = await _context.Pages
            .Include(p => p.CreatedByUser)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (page == null)
            return NotFound(new { message = "Page not found." });

        // Enforce edit permissions: Creator, workspace member, or accepted shared page with "Write" permission
        var isCreator = page.CreatedByUserId == userId;
        var isWorkspaceMember = await _context.WorkspaceMembers.AnyAsync(m => m.WorkspaceId == page.WorkspaceId && m.UserId == userId)
            || await _context.Workspaces.AnyAsync(w => w.Id == page.WorkspaceId && w.OwnerUserId == userId);
        var isSharedWriter = await _context.SharedPages.AnyAsync(sp => sp.PageId == id && sp.SharedWithUserId == userId && sp.Permission == "Write" && sp.Status == "Accepted");

        if (!isCreator && !isWorkspaceMember && !isSharedWriter)
        {
            return Forbid();
        }

        page.Title = dto.Title;
        page.Content = dto.Content;
        page.PlainText = ExtractPlainText(dto.Content);
        page.UpdatedAt = DateTime.UtcNow;

        page.Slug = await GenerateUniqueSlugAsync(page.WorkspaceId, dto.Title);

        await _context.SaveChangesAsync();

        return Ok(new PageResponseDto
        {
            Id = page.Id,
            WorkspaceId = page.WorkspaceId,
            ParentPageId = page.ParentPageId,
            CreatedByUserId = page.CreatedByUserId,
            CreatedByUsername = page.CreatedByUser.Username,
            Title = page.Title,
            Slug = page.Slug,
            Content = page.Content,
            PlainText = page.PlainText,
            IsArchived = page.IsArchived,
            SortOrder = page.SortOrder,
            CreatedAt = page.CreatedAt.AddHours(3), // Add Cairo timezone offset (UTC+3)
            UpdatedAt = page.UpdatedAt.HasValue ? page.UpdatedAt.Value.AddHours(3) : null
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

    [HttpPost("{id}/share")]
    public async Task<IActionResult> SharePage(int id, [FromBody] SharePageDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);

        var page = await _context.Pages.FindAsync(id);
        if (page == null)
            return NotFound(new { message = "Page not found." });

        // Enforce ownership: only owner can share (Requirement 3)
        if (page.CreatedByUserId != userId)
        {
            return BadRequest(new { message = "You cannot share pages you don't own" });
        }

        User? targetUser = null;
        if (dto.UsernameOrEmail.Contains("@"))
        {
            targetUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.UsernameOrEmail);
        }
        else
        {
            targetUser = await _context.Users.FirstOrDefaultAsync(u => u.Username == dto.UsernameOrEmail);
        }

        if (targetUser == null)
            return NotFound(new { message = "User not found." });

        if (targetUser.Id == userId)
            return BadRequest(new { message = "You cannot share a page with yourself." });

        var alreadyShared = await _context.SharedPages.AnyAsync(sp => sp.PageId == id && sp.SharedWithUserId == targetUser.Id);
        if (alreadyShared)
            return Conflict(new { message = "Page is already shared with this user." });

        var sharedPage = new SharedPage
        {
            PageId = id,
            SharedWithUserId = targetUser.Id,
            Permission = dto.Permission,
            Status = "Pending", // Set status to pending (Requirement 1)
            SharedAt = DateTime.UtcNow
        };

        _context.SharedPages.Add(sharedPage);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Invitation sent successfully." });
    }

    [HttpGet("{id}/shared-users")]
    public async Task<IActionResult> GetSharedUsers(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);

        var page = await _context.Pages
            .Include(p => p.CreatedByUser)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (page == null)
            return NotFound(new { message = "Page not found." });

        // If they don't own it, they can still view shared users
        var isCreator = page.CreatedByUserId == userId;
        var isWorkspaceMember = await _context.WorkspaceMembers.AnyAsync(m => m.WorkspaceId == page.WorkspaceId && m.UserId == userId)
            || await _context.Workspaces.AnyAsync(w => w.Id == page.WorkspaceId && w.OwnerUserId == userId);
        var isPageShared = await _context.SharedPages.AnyAsync(sp => sp.PageId == id && sp.SharedWithUserId == userId && sp.Status == "Accepted");

        if (!isCreator && !isWorkspaceMember && !isPageShared)
        {
            return Forbid();
        }

        var sharedUsers = await _context.SharedPages
            .Where(sp => sp.PageId == id)
            .Include(sp => sp.SharedWithUser)
            .Select(sp => new SharedUserDto
            {
                Id = sp.SharedWithUser.Id,
                Username = sp.SharedWithUser.Username,
                FullName = sp.SharedWithUser.FullName,
                Email = sp.SharedWithUser.Email,
                Permission = sp.Permission
            })
            .ToListAsync();

        return Ok(sharedUsers);
    }

    [HttpDelete("{id}/share/{sharedUserId}")]
    public async Task<IActionResult> RevokePageShare(int id, int sharedUserId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);

        var page = await _context.Pages.FindAsync(id);
        if (page == null)
            return NotFound(new { message = "Page not found." });

        if (page.CreatedByUserId != userId)
            return Forbid();

        var sharedPage = await _context.SharedPages.FirstOrDefaultAsync(sp => sp.PageId == id && sp.SharedWithUserId == sharedUserId);
        if (sharedPage == null)
            return NotFound(new { message = "Page is not shared with this user." });

        _context.SharedPages.Remove(sharedPage);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private string GenerateSlug(string title)
    {
        if (string.IsNullOrWhiteSpace(title)) return "untitled";

        var slug = title.ToLowerInvariant().Trim();
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"\s+", "-");
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
                sb.Append(" ");
            }

            var plainText = sb.ToString();
            plainText = plainText.Replace("\r", " ").Replace("\n", " ").Replace("\t", " ");
            plainText = System.Text.RegularExpressions.Regex.Replace(plainText, @"\s+", " ");
            return plainText.Trim();
        }
        catch
        {
            return string.Empty;
        }
    }
}
