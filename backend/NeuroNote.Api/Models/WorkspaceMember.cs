namespace NeuroNote.Api.Models;

public class WorkspaceMember
{
    public int WorkspaceId { get; set; }
    public Workspace Workspace { get; set; } = null!;

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public string MemberRole { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }
}
