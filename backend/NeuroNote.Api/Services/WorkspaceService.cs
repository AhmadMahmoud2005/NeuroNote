using Microsoft.EntityFrameworkCore;
using NeuroNote.Api.Data;
using NeuroNote.Api.Dtos;
using NeuroNote.Api.Models;

namespace NeuroNote.Api.Services;

public class WorkspaceService : IWorkspaceService
{
    private readonly NeuroNoteDbContext dbContext;
    private readonly IActivityLogService activityLogService;

    public WorkspaceService(NeuroNoteDbContext dbContext, IActivityLogService activityLogService)
    {
        this.dbContext = dbContext;
        this.activityLogService = activityLogService;
    }

    public async Task<IEnumerable<WorkspaceDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.Workspaces
            .AsNoTracking()
            .Select(w => new WorkspaceDto
            {
                Id = w.Id,
                Name = w.Name,
                Slug = w.Slug,
                Description = w.Description,
                OwnerUserId = w.OwnerUserId,
                CreatedAt = w.CreatedAt,
                UpdatedAt = w.UpdatedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<WorkspaceDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var w = await dbContext.Workspaces
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (w is null) return null;

        return new WorkspaceDto
        {
            Id = w.Id,
            Name = w.Name,
            Slug = w.Slug,
            Description = w.Description,
            OwnerUserId = w.OwnerUserId,
            CreatedAt = w.CreatedAt,
            UpdatedAt = w.UpdatedAt
        };
    }

    public async Task<WorkspaceDto> CreateAsync(CreateWorkspaceRequest request, int ownerUserId, CancellationToken cancellationToken = default)
    {
        var slug = GenerateSlug(request.Name);
        var slugIsTaken = await dbContext.Workspaces.AnyAsync(workspace => workspace.Slug == slug, cancellationToken);
        if (slugIsTaken)
        {
            slug = $"{slug}-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
        }

        var workspace = new Workspace
        {
            Name = request.Name.Trim(),
            Slug = slug,
            Description = request.Description?.Trim(),
            OwnerUserId = ownerUserId,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Workspaces.Add(workspace);
        await dbContext.SaveChangesAsync(cancellationToken);

        dbContext.WorkspaceMembers.Add(new WorkspaceMember
        {
            WorkspaceId = workspace.Id,
            UserId = ownerUserId,
            MemberRole = "Admin",
            JoinedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync(cancellationToken);

        await activityLogService.RecordAsync(
            ownerUserId,
            "WorkspaceCreated",
            $"Workspace {workspace.Name} was created.",
            workspace.Id,
            cancellationToken: cancellationToken);

        return new WorkspaceDto
        {
            Id = workspace.Id,
            Name = workspace.Name,
            Slug = workspace.Slug,
            Description = workspace.Description,
            OwnerUserId = workspace.OwnerUserId,
            CreatedAt = workspace.CreatedAt,
            UpdatedAt = workspace.UpdatedAt
        };
    }

    public async Task<WorkspaceDto?> UpdateAsync(int id, UpdateWorkspaceRequest request, CancellationToken cancellationToken = default)
    {
        var workspace = await dbContext.Workspaces.FirstOrDefaultAsync(w => w.Id == id, cancellationToken);
        if (workspace is null) return null;

        workspace.Name = request.Name.Trim();
        workspace.Description = request.Description?.Trim();
        workspace.UpdatedAt = DateTime.UtcNow;
        workspace.Slug = GenerateSlug(workspace.Name);

        await dbContext.SaveChangesAsync(cancellationToken);

        await activityLogService.RecordAsync(
            workspace.OwnerUserId,
            "WorkspaceUpdated",
            $"Workspace {workspace.Name} was updated.",
            workspace.Id,
            cancellationToken: cancellationToken);

        return new WorkspaceDto
        {
            Id = workspace.Id,
            Name = workspace.Name,
            Slug = workspace.Slug,
            Description = workspace.Description,
            OwnerUserId = workspace.OwnerUserId,
            CreatedAt = workspace.CreatedAt,
            UpdatedAt = workspace.UpdatedAt
        };
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var workspace = await dbContext.Workspaces.FirstOrDefaultAsync(w => w.Id == id, cancellationToken);
        if (workspace is null) return false;

        dbContext.Workspaces.Remove(workspace);
        await dbContext.SaveChangesAsync(cancellationToken);

        await activityLogService.RecordAsync(
            workspace.OwnerUserId,
            "WorkspaceDeleted",
            $"Workspace {workspace.Name} was deleted.",
            id,
            cancellationToken: cancellationToken);

        return true;
    }

    private static string GenerateSlug(string input)
    {
        var s = input.Trim().ToLowerInvariant();
        var sb = new System.Text.StringBuilder();
        foreach (var ch in s)
        {
            if (char.IsLetterOrDigit(ch) || ch == '-') sb.Append(ch);
            else if (char.IsWhiteSpace(ch) || ch == '_') sb.Append('-');
        }
        var slug = sb.ToString();
        while (slug.Contains("--")) slug = slug.Replace("--", "-");
        return slug.Trim('-');
    }
}
