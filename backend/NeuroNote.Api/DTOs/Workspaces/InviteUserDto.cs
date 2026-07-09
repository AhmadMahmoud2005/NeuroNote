using System.ComponentModel.DataAnnotations;

namespace NeuroNote.Api.DTOs.Workspaces;

public class InviteUserDto
{
    [Required]
    public string UsernameOrEmail { get; set; } = string.Empty;

    [Required]
    public string Role { get; set; } = "Member"; // "Member", "Editor", "Admin"
}
