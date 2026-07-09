using System.ComponentModel.DataAnnotations;

namespace NeuroNote.Api.Dtos;

public class CreateCommentRequest
{
    [Required]
    [StringLength(2000, MinimumLength = 1)]
    public string Content { get; set; } = string.Empty;
}
