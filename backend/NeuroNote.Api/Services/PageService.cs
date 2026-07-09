using Microsoft.EntityFrameworkCore;
using NeuroNote.Api.Data;
using NeuroNote.Api.Dtos;
using NeuroNote.Api.Models;

namespace NeuroNote.Api.Services;

public class PageService : IPageService
{
    private readonly NeuroNoteDbContext db;
    private readonly IActivityLogService activityLogService;

    public PageService(NeuroNoteDbContext db, IActivityLogService activityLogService)
    {
        this.db = db;
        this.activityLogService = activityLogService;
    }

    public async Task<PageDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var page = await db.Pages.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        return page is null ? null : Map(page);
    }

    public async Task<IEnumerable<PageDto>> ListByWorkspaceAsync(int workspaceId, CancellationToken cancellationToken = default)
    {
        var pages = await db.Pages.AsNoTracking().Where(p => p.WorkspaceId == workspaceId && !p.IsArchived).OrderBy(p => p.SortOrder).ToListAsync(cancellationToken);
        return pages.Select(Map);
    }

    public async Task<PageDto?> CreateAsync(CreatePageRequest request, int createdByUserId, CancellationToken cancellationToken = default)
    {
        var workspaceExists = await db.Workspaces.AnyAsync(workspace => workspace.Id == request.WorkspaceId, cancellationToken);
        var userExists = await db.Users.AnyAsync(user => user.Id == createdByUserId, cancellationToken);
        var parentPageIsValid = !request.ParentPageId.HasValue || await db.Pages.AnyAsync(
            page => page.Id == request.ParentPageId.Value && page.WorkspaceId == request.WorkspaceId,
            cancellationToken);

        if (!workspaceExists || !userExists || !parentPageIsValid)
        {
            return null;
        }

        var slug = string.IsNullOrWhiteSpace(request.Slug) ? GenerateSlug(request.Title) : GenerateSlug(request.Slug);
        var slugIsTaken = await db.Pages.AnyAsync(
            page => page.WorkspaceId == request.WorkspaceId && page.Slug == slug,
            cancellationToken);

        if (slugIsTaken)
        {
            slug = $"{slug}-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
        }

        var page = new Page
        {
            WorkspaceId = request.WorkspaceId,
            ParentPageId = request.ParentPageId,
            CreatedByUserId = createdByUserId,
            Title = request.Title.Trim(),
            Slug = slug,
            CreatedAt = DateTime.UtcNow,
            SortOrder = 0,
            IsArchived = false
        };

        db.Pages.Add(page);
        await db.SaveChangesAsync(cancellationToken);

        await activityLogService.RecordAsync(
            createdByUserId,
            "PageCreated",
            $"Page {page.Title} was created.",
            page.WorkspaceId,
            page.Id,
            cancellationToken: cancellationToken);

        return Map(page);
    }

    public async Task<PageDto?> UpdateAsync(int id, UpdatePageRequest request, CancellationToken cancellationToken = default)
    {
        var page = await db.Pages.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (page is null) return null;

        page.Title = request.Title.Trim();
        page.Slug = string.IsNullOrWhiteSpace(request.Slug) ? page.Slug : request.Slug.Trim();
        page.MetadataJson = request.MetadataJson;
        page.IsArchived = request.IsArchived;
        page.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        await activityLogService.RecordAsync(
            page.CreatedByUserId,
            "PageUpdated",
            $"Page {page.Title} was updated.",
            page.WorkspaceId,
            page.Id,
            cancellationToken: cancellationToken);

        return Map(page);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var page = await db.Pages.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (page is null) return false;

        db.Pages.Remove(page);
        await db.SaveChangesAsync(cancellationToken);

        await activityLogService.RecordAsync(
            page.CreatedByUserId,
            "PageDeleted",
            $"Page {page.Title} was deleted.",
            page.WorkspaceId,
            id,
            cancellationToken: cancellationToken);

        return true;
    }

    private static PageDto Map(Page p) => new()
    {
        Id = p.Id,
        WorkspaceId = p.WorkspaceId,
        ParentPageId = p.ParentPageId,
        CreatedByUserId = p.CreatedByUserId,
        Title = p.Title,
        Slug = p.Slug,
        MetadataJson = p.MetadataJson,
        SortOrder = p.SortOrder,
        IsArchived = p.IsArchived,
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt
    };

    private static string GenerateSlug(string title)
    {
        var normalized = title.Trim().ToLowerInvariant();
        var builder = new System.Text.StringBuilder();

        foreach (var character in normalized)
        {
            if (char.IsLetterOrDigit(character) || character == '-')
            {
                builder.Append(character);
            }
            else if (char.IsWhiteSpace(character) || character == '_')
            {
                builder.Append('-');
            }
        }

        var slug = builder.ToString();
        while (slug.Contains("--"))
        {
            slug = slug.Replace("--", "-");
        }

        return string.IsNullOrWhiteSpace(slug.Trim('-')) ? "untitled" : slug.Trim('-');
    }
}
