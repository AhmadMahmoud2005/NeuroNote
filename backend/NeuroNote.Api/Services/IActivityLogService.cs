namespace NeuroNote.Api.Services;

public interface IActivityLogService
{
    Task RecordAsync(
        int userId,
        string actionType,
        string description,
        int? workspaceId = null,
        int? pageId = null,
        string? metadataJson = null,
        CancellationToken cancellationToken = default);
}
