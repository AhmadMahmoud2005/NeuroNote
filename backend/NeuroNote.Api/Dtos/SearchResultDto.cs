namespace NeuroNote.Api.Dtos;

public class SearchResultDto
{
    public IEnumerable<PageSearchResultDto> Pages { get; set; } = Array.Empty<PageSearchResultDto>();
    public IEnumerable<BlockSearchResultDto> Blocks { get; set; } = Array.Empty<BlockSearchResultDto>();
}

public class PageSearchResultDto
{
    public int Id { get; set; }
    public int WorkspaceId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class BlockSearchResultDto
{
    public int Id { get; set; }
    public int PageId { get; set; }
    public int WorkspaceId { get; set; }
    public string PageTitle { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? Content { get; set; }
    public int SortOrder { get; set; }
}
