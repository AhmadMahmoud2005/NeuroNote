using System.ComponentModel.DataAnnotations;

namespace NeuroNote.Api.Dtos;

public class UpdateBlockRequest
{
    [StringLength(80)]
    public string? Type { get; set; }

    public string? Content { get; set; }

    public int? SortOrder { get; set; }
}
