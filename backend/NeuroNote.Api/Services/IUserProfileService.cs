using NeuroNote.Api.Dtos;

namespace NeuroNote.Api.Services;

public interface IUserProfileService
{
    Task<UserProfileDto?> GetProfileAsync(int userId, CancellationToken cancellationToken = default);

    Task<UserProfileDto?> UpdateProfileAsync(
        int userId,
        UpdateUserProfileRequest request,
        CancellationToken cancellationToken = default);

    Task<UserProfileDto?> UpdateAvatarAsync(
        int userId,
        IFormFile avatar,
        CancellationToken cancellationToken = default);
}
