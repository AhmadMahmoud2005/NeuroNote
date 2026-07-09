using NeuroNote.Api.Dtos;

namespace NeuroNote.Api.Services;

public interface ISearchService
{
    Task<SearchResultDto> SearchAsync(string query, int? workspaceId, CancellationToken cancellationToken = default);
}
