using System.ComponentModel.DataAnnotations;

namespace NeuroNote.Api.Dtos;

public class UpdatePageRequest
{
    [Required]
    [StringLength(250)]
    public string Title { get; set; } = string.Empty;

    [StringLength(250)]
    public string? Slug { get; set; }

    public string? MetadataJson { get; set; }
    public bool IsArchived { get; set; }
}
