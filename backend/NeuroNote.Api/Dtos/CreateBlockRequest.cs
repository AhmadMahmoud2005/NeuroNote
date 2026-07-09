using System.ComponentModel.DataAnnotations;

namespace NeuroNote.Api.Dtos;

public class CreateBlockRequest
{
    [Required]
    public int PageId { get; set; }

    [Required]
    [StringLength(80)]
    public string Type { get; set; } = string.Empty;

    public string? Content { get; set; }

    public int SortOrder { get; set; }

    public int? ParentBlockId { get; set; }
}
