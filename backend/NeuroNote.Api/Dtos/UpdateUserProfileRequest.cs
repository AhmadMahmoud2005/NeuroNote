using System.ComponentModel.DataAnnotations;

namespace NeuroNote.Api.Dtos;

public class UpdateUserProfileRequest
{
    [Required]
    [StringLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(200)]
    public string Email { get; set; } = string.Empty;

    [StringLength(1000)]
    public string Bio { get; set; } = string.Empty;
}
