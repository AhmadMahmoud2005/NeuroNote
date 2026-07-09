using System.ComponentModel.DataAnnotations;

namespace NeuroNote.Api.Dtos;

public class CreatePageRequest
{
    [Required]
    public int WorkspaceId { get; set; }

    public int? ParentPageId { get; set; }

    [Required]
    [StringLength(250)]
    public string Title { get; set; } = string.Empty;

    [StringLength(250)]
    public string? Slug { get; set; }
}
