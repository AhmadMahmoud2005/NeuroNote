using NeuroNote.Api.Dtos;

namespace NeuroNote.Api.Services;

public interface IAuthService
{
    Task<AuthResponse?> LoginAsync(AuthLoginRequest request, CancellationToken cancellationToken = default);

    Task<AuthResponse?> RegisterAsync(AuthRegisterRequest request, CancellationToken cancellationToken = default);
}
