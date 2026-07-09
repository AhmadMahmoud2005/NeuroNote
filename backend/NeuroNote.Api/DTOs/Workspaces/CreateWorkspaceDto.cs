using System.ComponentModel.DataAnnotations;

namespace NeuroNote.Api.DTOs.Workspaces;

public class CreateWorkspaceDto
{
    [Required]
    [StringLength(100, MinimumLength = 3)]
    public string Name { get; set; } = string.Empty;

    [StringLength(250)]
    public string? Description { get; set; }
}
