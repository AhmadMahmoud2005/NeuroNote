using Microsoft.EntityFrameworkCore;
using NeuroNote.Api.Data;
using NeuroNote.Api.Dtos;
using NeuroNote.Api.Models;

namespace NeuroNote.Api.Services;

public class CommentService : ICommentService
{
    private readonly NeuroNoteDbContext dbContext;
    private readonly IActivityLogService activityLogService;

    public CommentService(NeuroNoteDbContext dbContext, IActivityLogService activityLogService)
    {
        this.dbContext = dbContext;
        this.activityLogService = activityLogService;
    }

    public async Task<IEnumerable<CommentDto>> ListByPageAsync(int pageId, CancellationToken cancellationToken = default)
    {
        var comments = await dbContext.Comments
            .AsNoTracking()
            .Where(comment => comment.PageId == pageId)
            .OrderByDescending(comment => comment.CreatedAt)
            .ToListAsync(cancellationToken);

        return comments.Select(Map);
    }

    public async Task<CommentDto?> CreateAsync(int pageId, int userId, CreateCommentRequest request, CancellationToken cancellationToken = default)
    {
        var pageExists = await dbContext.Pages.AnyAsync(page => page.Id == pageId, cancellationToken);
        var userExists = await dbContext.Users.AnyAsync(user => user.Id == userId, cancellationToken);

        if (!pageExists || !userExists)
        {
            return null;
        }

        var comment = new Comment
        {
            PageId = pageId,
            UserId = userId,
            Content = request.Content.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Comments.Add(comment);
        await dbContext.SaveChangesAsync(cancellationToken);

        var workspaceId = await dbContext.Pages
            .Where(page => page.Id == pageId)
            .Select(page => page.WorkspaceId)
            .FirstAsync(cancellationToken);

        await activityLogService.RecordAsync(
            userId,
            "CommentCreated",
            "A comment was added.",
            workspaceId,
            pageId,
            cancellationToken: cancellationToken);

        return Map(comment);
    }

    public async Task<CommentDto?> UpdateAsync(int id, int userId, UpdateCommentRequest request, CancellationToken cancellationToken = default)
    {
        var comment = await dbContext.Comments
            .Include(candidate => candidate.Page)
            .FirstOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        if (comment is null || comment.UserId != userId)
        {
            return null;
        }

        comment.Content = request.Content.Trim();
        comment.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        await activityLogService.RecordAsync(
            userId,
            "CommentUpdated",
            "A comment was updated.",
            comment.Page.WorkspaceId,
            comment.PageId,
            cancellationToken: cancellationToken);

        return Map(comment);
    }

    public async Task<bool> DeleteAsync(int id, int userId, CancellationToken cancellationToken = default)
    {
        var comment = await dbContext.Comments
            .Include(candidate => candidate.Page)
            .FirstOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        if (comment is null || comment.UserId != userId)
        {
            return false;
        }

        dbContext.Comments.Remove(comment);
        await dbContext.SaveChangesAsync(cancellationToken);

        await activityLogService.RecordAsync(
            userId,
            "CommentDeleted",
            "A comment was deleted.",
            comment.Page.WorkspaceId,
            comment.PageId,
            cancellationToken: cancellationToken);
        return true;
    }

    private static CommentDto Map(Comment comment) => new()
    {
        Id = comment.Id,
        UserId = comment.UserId,
        PageId = comment.PageId,
        Content = comment.Content,
        CreatedAt = comment.CreatedAt,
        UpdatedAt = comment.UpdatedAt
    };
}
