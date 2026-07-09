using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NeuroNote.Api.Data;
using NeuroNote.Api.DTOs.Users;
using NeuroNote.Api.Models;

namespace NeuroNote.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class UsersController : ControllerBase
{
    private readonly NeuroNoteDbContext _context;

    public UsersController(NeuroNoteDbContext context)
    {
        _context = context;
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
}
