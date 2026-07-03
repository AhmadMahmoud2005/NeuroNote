namespace NeuroNote.Api.Models;

public class ActivityLog
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public int? WorkspaceId { get; set; }
    public Workspace? Workspace { get; set; }

    public int? PageId { get; set; }
    public Page? Page { get; set; }

    public string ActionType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? MetadataJson { get; set; }
    public DateTime CreatedAt { get; set; }
}
