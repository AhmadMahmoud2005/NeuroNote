using System.ComponentModel.DataAnnotations;

namespace NeuroNote.Api.DTOs.Workspaces;

public class RespondInvitationDto
{
    [Required]
    public bool Accept { get; set; }
}
