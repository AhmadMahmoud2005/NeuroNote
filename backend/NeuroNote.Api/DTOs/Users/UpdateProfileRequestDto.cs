using System.ComponentModel.DataAnnotations;

namespace NeuroNote.Api.DTOs.Users;

public class UpdateProfileRequestDto
{
    [Required]
    [StringLength(150, MinimumLength = 3)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(200)]
    public string Email { get; set; } = string.Empty;

    [StringLength(500)]
    public string Bio { get; set; } = string.Empty;
}
