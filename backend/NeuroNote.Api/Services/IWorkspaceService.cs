using NeuroNote.Api.Dtos;

namespace NeuroNote.Api.Services;

public interface IWorkspaceService
{
    Task<IEnumerable<WorkspaceDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<WorkspaceDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<WorkspaceDto> CreateAsync(CreateWorkspaceRequest request, int ownerUserId, CancellationToken cancellationToken = default);
    Task<WorkspaceDto?> UpdateAsync(int id, UpdateWorkspaceRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
}
