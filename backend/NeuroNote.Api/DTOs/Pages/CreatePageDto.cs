using System.ComponentModel.DataAnnotations;

namespace NeuroNote.Api.DTOs.Pages;

public class CreatePageDto
{
    [Required]
    public int WorkspaceId { get; set; }

    [Required]
    [StringLength(250)]
    public string Title { get; set; } = string.Empty;

    public string? Content { get; set; }

    public int? ParentPageId { get; set; }
}
