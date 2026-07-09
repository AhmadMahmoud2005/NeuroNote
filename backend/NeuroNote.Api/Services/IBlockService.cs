using NeuroNote.Api.Dtos;

namespace NeuroNote.Api.Services;

public interface IBlockService
{
    Task<IEnumerable<BlockDto>> ListByPageAsync(int pageId, CancellationToken cancellationToken = default);
    Task<BlockDto?> CreateAsync(CreateBlockRequest request, CancellationToken cancellationToken = default);
    Task<BlockDto?> UpdateAsync(int id, UpdateBlockRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
}
