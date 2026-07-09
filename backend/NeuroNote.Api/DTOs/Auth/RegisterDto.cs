using System.ComponentModel.DataAnnotations;

namespace NeuroNote.Api.DTOs.Auth;

public class RegisterDto
{
    [Required]
    [StringLength(100, MinimumLength = 3)]
    [RegularExpression(@"^[a-z0-9-]+$", ErrorMessage = "Username can only contain lowercase alphanumeric characters and hyphens (-).")]
    public string Username { get; set; } = string.Empty;

    [Required]
    [StringLength(150, MinimumLength = 3)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;
}
