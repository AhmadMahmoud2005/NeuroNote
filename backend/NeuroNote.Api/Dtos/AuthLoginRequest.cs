using System.ComponentModel.DataAnnotations;

namespace NeuroNote.Api.Dtos;

public class AuthLoginRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;
}
