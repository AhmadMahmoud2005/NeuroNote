using System.ComponentModel.DataAnnotations;

namespace NeuroNote.Api.DTOs.Pages;

public class SharePageDto
{
    [Required]
    public string UsernameOrEmail { get; set; } = string.Empty;

    [Required]
    public string Permission { get; set; } = "Read"; // "Read", "Write"
}
