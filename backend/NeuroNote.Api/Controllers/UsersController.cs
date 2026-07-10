using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NeuroNote.Api.Data;
using NeuroNote.Api.DTOs.Users;
using NeuroNote.Api.Models;
using NeuroNote.Api.Services;

namespace NeuroNote.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class UsersController : ControllerBase
{
    private readonly NeuroNoteDbContext _context;
    private readonly CloudinaryService _cloudinaryService;

    public UsersController(NeuroNoteDbContext context, CloudinaryService cloudinaryService)
    {
        _context = context;
        _cloudinaryService = cloudinaryService;
    }

    [HttpGet("{userId}/profile")]
    public async Task<IActionResult> GetProfile(int userId)
    {
        var user = await _context.Users.FindAsync(userId);

        if (user == null)
            return NotFound(new { message = "User not found." });

        return Ok(new UserProfileDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Bio = user.Bio,
            AvatarUrl = user.AvatarUrl
        });
    }

    [HttpPut("{userId}/profile")]
    public async Task<IActionResult> UpdateProfile(int userId, [FromBody] UpdateProfileRequestDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = await _context.Users.FindAsync(userId);

        if (user == null)
            return NotFound(new { message = "User not found." });

        // Update properties
        user.FullName = dto.FullName;
        user.Email = dto.Email;
        user.Bio = dto.Bio;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new UserProfileDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Bio = user.Bio,
            AvatarUrl = user.AvatarUrl
        });
    }

    [HttpPost("{userId}/avatar")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadAvatar(int userId, IFormFile avatar)
    {
        if (avatar == null || avatar.Length == 0)
            return BadRequest(new { message = "No file was provided." });

        // Validate file type
        var allowed = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
        if (!allowed.Contains(avatar.ContentType.ToLowerInvariant()))
            return BadRequest(new { message = "Only JPG, PNG, GIF and WebP images are accepted." });

        // 2 MB max
        if (avatar.Length > 2 * 1024 * 1024)
            return BadRequest(new { message = "Image must be 2 MB or smaller." });

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return NotFound(new { message = "User not found." });

        try
        {
            // Upload to Cloudinary — only the URL is stored, no binary data in DB
            var secureUrl = await _cloudinaryService.UploadAvatarAsync(avatar);

            user.AvatarUrl = secureUrl;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new UserProfileDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Bio = user.Bio,
                AvatarUrl = user.AvatarUrl
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Upload failed: {ex.Message}" });
        }
    }
}
