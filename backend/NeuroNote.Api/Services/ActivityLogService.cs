using NeuroNote.Api.Data;
using NeuroNote.Api.Models;

namespace NeuroNote.Api.Services;

public class ActivityLogService : IActivityLogService
{
    private readonly NeuroNoteDbContext dbContext;
    private readonly ILogger<ActivityLogService> logger;

    public ActivityLogService(NeuroNoteDbContext dbContext, ILogger<ActivityLogService> logger)
    {
        this.dbContext = dbContext;
        this.logger = logger;
    }

    public async Task RecordAsync(
        int userId,
        string actionType,
        string description,
        int? workspaceId = null,
        int? pageId = null,
        string? metadataJson = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            dbContext.ActivityLogs.Add(new ActivityLog
            {
                UserId = userId,
                WorkspaceId = workspaceId,
                PageId = pageId,
                ActionType = actionType,
                Description = description,
                MetadataJson = metadataJson,
                CreatedAt = DateTime.UtcNow
            });

            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Failed to record activity {ActionType} for user {UserId}.", actionType, userId);
        }
    }
}
