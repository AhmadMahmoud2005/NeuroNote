namespace NeuroNote.Api.Models;

public class Page
{
    public int Id { get; set; }
    public int WorkspaceId { get; set; }
    public Workspace Workspace { get; set; } = null!;

    public int? ParentPageId { get; set; }
    public Page? ParentPage { get; set; }
    public ICollection<Page> Children { get; set; } = new List<Page>();

    public int CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Content { get; set; }
    public string? PlainText { get; set; }
    public string? MetadataJson { get; set; }
    public int SortOrder { get; set; }
    public bool IsArchived { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public ICollection<Block> Blocks { get; set; } = new List<Block>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<ActivityLog> ActivityLogs { get; set; } = new List<ActivityLog>();
}
