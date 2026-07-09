using System.ComponentModel.DataAnnotations;

namespace NeuroNote.Api.DTOs.Pages;

public class UpdatePageDto
{
    [Required]
    [StringLength(250)]
    public string Title { get; set; } = string.Empty;

    public string? Content { get; set; }
}
