using System;

namespace NeuroNote.Api.DTOs.Workspaces;

public class WorkspaceInvitationDto
{
    public int Id { get; set; }
    public int WorkspaceId { get; set; }
    public string WorkspaceName { get; set; } = string.Empty;
    public string InvitedByUsername { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
