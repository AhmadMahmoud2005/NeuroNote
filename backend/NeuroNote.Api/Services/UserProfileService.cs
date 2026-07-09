using Microsoft.EntityFrameworkCore;
using NeuroNote.Api.Data;
using NeuroNote.Api.Dtos;
using NeuroNote.Api.Models;

namespace NeuroNote.Api.Services;

public class UserProfileService : IUserProfileService
{
    private readonly NeuroNoteDbContext dbContext;
    private readonly IActivityLogService activityLogService;

    public UserProfileService(NeuroNoteDbContext dbContext, IActivityLogService activityLogService)
    {
        this.dbContext = dbContext;
        this.activityLogService = activityLogService;
    }

    public async Task<UserProfileDto?> GetProfileAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(candidate => candidate.Id == userId, cancellationToken);

        return user is null ? null : Map(user);
    }

    public async Task<UserProfileDto?> UpdateProfileAsync(
        int userId,
        UpdateUserProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(candidate => candidate.Id == userId, cancellationToken);

        if (user is null)
        {
            return null;
        }

        user.FullName = request.FullName.Trim();
        user.Email = request.Email.Trim().ToLowerInvariant();
        user.Bio = request.Bio.Trim();
        user.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        await activityLogService.RecordAsync(
            user.Id,
            "ProfileUpdated",
            $"{user.FullName} updated their profile.",
            cancellationToken: cancellationToken);

        return Map(user);
    }

    public async Task<UserProfileDto?> UpdateAvatarAsync(
        int userId,
        IFormFile avatar,
        CancellationToken cancellationToken = default)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(candidate => candidate.Id == userId, cancellationToken);

        if (user is null)
        {
            return null;
        }

        await using var memoryStream = new MemoryStream();
        await avatar.CopyToAsync(memoryStream, cancellationToken);

        var contentType = string.IsNullOrWhiteSpace(avatar.ContentType) ? "application/octet-stream" : avatar.ContentType;
        user.AvatarUrl = $"data:{contentType};base64,{Convert.ToBase64String(memoryStream.ToArray())}";
        user.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        await activityLogService.RecordAsync(
            user.Id,
            "AvatarUpdated",
            $"{user.FullName} updated their avatar.",
            cancellationToken: cancellationToken);

        return Map(user);
    }

    private static UserProfileDto Map(User user)
    {
        return new UserProfileDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Bio = user.Bio,
            AvatarUrl = user.AvatarUrl
        };
    }
}
