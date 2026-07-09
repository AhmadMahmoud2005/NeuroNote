namespace NeuroNote.Api.DTOs.Pages;

public class PageResponseDto
{
    public int Id { get; set; }
    public int WorkspaceId { get; set; }
    public int? ParentPageId { get; set; }
    public int CreatedByUserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Content { get; set; }
    public string? PlainText { get; set; }
    public bool IsArchived { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
