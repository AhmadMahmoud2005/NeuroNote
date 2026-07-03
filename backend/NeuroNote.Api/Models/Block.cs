namespace NeuroNote.Api.Models;

public class Block
{
    public int Id { get; set; }
    public int PageId { get; set; }
    public Page Page { get; set; } = null!;

    public string Type { get; set; } = string.Empty;
    public string? Content { get; set; }
    public int SortOrder { get; set; }
    public int? ParentBlockId { get; set; }
    public Block? ParentBlock { get; set; }
    public ICollection<Block> Children { get; set; } = new List<Block>();
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
