namespace NeuroNote.Api.Dtos;

public class BlockDto
{
    public int Id { get; set; }
    public int PageId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? Content { get; set; }
    public int SortOrder { get; set; }
    public int? ParentBlockId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
