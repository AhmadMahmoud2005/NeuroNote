namespace NeuroNote.Api.Dtos;

public class PageDto
{
    public int Id { get; set; }
    public int WorkspaceId { get; set; }
    public int? ParentPageId { get; set; }
    public int CreatedByUserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? MetadataJson { get; set; }
    public int SortOrder { get; set; }
    public bool IsArchived { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
