using NeuroNote.Api.Dtos;

namespace NeuroNote.Api.Services;

public interface IPageService
{
    Task<PageDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<PageDto>> ListByWorkspaceAsync(int workspaceId, CancellationToken cancellationToken = default);
    Task<PageDto?> CreateAsync(CreatePageRequest request, int createdByUserId, CancellationToken cancellationToken = default);
    Task<PageDto?> UpdateAsync(int id, UpdatePageRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
}
