using NeuroNote.Api.Dtos;

namespace NeuroNote.Api.Services;

public interface ICommentService
{
    Task<IEnumerable<CommentDto>> ListByPageAsync(int pageId, CancellationToken cancellationToken = default);
    Task<CommentDto?> CreateAsync(int pageId, int userId, CreateCommentRequest request, CancellationToken cancellationToken = default);
    Task<CommentDto?> UpdateAsync(int id, int userId, UpdateCommentRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, int userId, CancellationToken cancellationToken = default);
}
