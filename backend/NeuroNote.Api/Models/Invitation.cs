namespace NeuroNote.Api.Models;

public class Invitation
{
    public int Id { get; set; }
    public int WorkspaceId { get; set; }
    public Workspace Workspace { get; set; } = null!;

    public string Email { get; set; } = string.Empty;
    public int InvitedByUserId { get; set; }
    public User InvitedByUser { get; set; } = null!;
    public string MemberRole { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public DateTime? DeclinedAt { get; set; }
}
