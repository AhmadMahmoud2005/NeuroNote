using NeuroNote.Api.Dtos;

namespace NeuroNote.Api.Services;

public interface IInvitationService
{
    Task<InvitationDto?> CreateAsync(int workspaceId, int invitedByUserId, CreateInvitationRequest request, CancellationToken cancellationToken = default);
    Task<IEnumerable<NotificationDto>> ListNotificationsAsync(int userId, CancellationToken cancellationToken = default);
    Task<InvitationDto?> AcceptAsync(string token, int userId, CancellationToken cancellationToken = default);
    Task<InvitationDto?> DeclineAsync(string token, int userId, CancellationToken cancellationToken = default);
}
