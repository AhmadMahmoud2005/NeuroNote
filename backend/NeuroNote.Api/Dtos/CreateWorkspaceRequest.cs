using System.ComponentModel.DataAnnotations;

namespace NeuroNote.Api.Dtos;

public class CreateWorkspaceRequest
{
    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }
}
