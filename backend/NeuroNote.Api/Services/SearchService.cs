using Microsoft.EntityFrameworkCore;
using NeuroNote.Api.Data;
using NeuroNote.Api.Dtos;

namespace NeuroNote.Api.Services;

public class SearchService : ISearchService
{
    private const int MaxResults = 25;
    private readonly NeuroNoteDbContext dbContext;

    public SearchService(NeuroNoteDbContext dbContext)
    {
        this.dbContext = dbContext;
    }

    public async Task<SearchResultDto> SearchAsync(string query, int? workspaceId, CancellationToken cancellationToken = default)
    {
        var normalizedQuery = query.Trim();
        if (string.IsNullOrWhiteSpace(normalizedQuery))
        {
            return new SearchResultDto();
        }

        var pagesQuery = dbContext.Pages.AsNoTracking().Where(page => !page.IsArchived);
        var blocksQuery = dbContext.Blocks.AsNoTracking().Include(block => block.Page).Where(block => !block.Page.IsArchived);

        if (workspaceId.HasValue)
        {
            pagesQuery = pagesQuery.Where(page => page.WorkspaceId == workspaceId.Value);
            blocksQuery = blocksQuery.Where(block => block.Page.WorkspaceId == workspaceId.Value);
        }

        var pages = await pagesQuery
            .Where(page => page.Title.Contains(normalizedQuery) || page.Slug.Contains(normalizedQuery))
            .OrderByDescending(page => page.UpdatedAt ?? page.CreatedAt)
            .Take(MaxResults)
            .Select(page => new PageSearchResultDto
            {
                Id = page.Id,
                WorkspaceId = page.WorkspaceId,
                Title = page.Title,
                Slug = page.Slug,
                CreatedAt = page.CreatedAt,
                UpdatedAt = page.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        var blocks = await blocksQuery
            .Where(block => block.Content != null && block.Content.Contains(normalizedQuery))
            .OrderBy(block => block.PageId)
            .ThenBy(block => block.SortOrder)
            .Take(MaxResults)
            .Select(block => new BlockSearchResultDto
            {
                Id = block.Id,
                PageId = block.PageId,
                WorkspaceId = block.Page.WorkspaceId,
                PageTitle = block.Page.Title,
                Type = block.Type,
                Content = block.Content,
                SortOrder = block.SortOrder
            })
            .ToListAsync(cancellationToken);

        return new SearchResultDto
        {
            Pages = pages,
            Blocks = blocks
        };
    }
}
