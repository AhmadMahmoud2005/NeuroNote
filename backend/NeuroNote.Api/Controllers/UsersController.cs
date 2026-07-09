using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NeuroNote.Api.Data;
using NeuroNote.Api.Dtos;
using NeuroNote.Api.Services;

namespace NeuroNote.Api.Controllers;

[ApiController]
[Route("api/v1/users")]
public class UsersController : ControllerBase
{
    private const long MaxAvatarSizeBytes = 1024 * 1024;

    private static readonly HashSet<string> AllowedAvatarContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/gif"
    };

    private readonly IUserProfileService userProfileService;
    private readonly NeuroNoteDbContext dbContext;

    public UsersController(IUserProfileService userProfileService, NeuroNoteDbContext dbContext)
    {
        this.userProfileService = userProfileService;
        this.dbContext = dbContext;
    }

    [HttpGet("{userId:int}/profile")]
    public async Task<ActionResult<UserProfileDto>> GetProfile(int userId, CancellationToken cancellationToken)
    {
        var profile = await userProfileService.GetProfileAsync(userId, cancellationToken);

        return profile is null ? NotFound() : Ok(profile);
    }

    [HttpPut("{userId:int}/profile")]
    public async Task<ActionResult<UserProfileDto>> UpdateProfile(
        int userId,
        [FromBody] UpdateUserProfileRequest request,
        CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var emailInUse = await dbContext.Users.AnyAsync(
            user => user.Email.ToLower() == normalizedEmail && user.Id != userId,
            cancellationToken);

        if (emailInUse)
        {
            return Conflict(new { message = "Email address is already in use." });
        }

        var profile = await userProfileService.UpdateProfileAsync(userId, request, cancellationToken);

        return profile is null ? NotFound() : Ok(profile);
    }

    [HttpPost("{userId:int}/avatar")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<UserProfileDto>> UpdateAvatar(
        int userId,
        [FromForm] IFormFile avatar,
        CancellationToken cancellationToken)
    {
        if (avatar.Length == 0)
        {
            return BadRequest(new { message = "Avatar file is required." });
        }

        if (avatar.Length > MaxAvatarSizeBytes)
        {
            return BadRequest(new { message = "Avatar must be 1MB max." });
        }

        if (!AllowedAvatarContentTypes.Contains(avatar.ContentType))
        {
            return BadRequest(new { message = "Only PNG, JPEG, and GIF avatars are supported." });
        }

        var profile = await userProfileService.UpdateAvatarAsync(userId, avatar, cancellationToken);

        return profile is null ? NotFound() : Ok(profile);
    }
}
