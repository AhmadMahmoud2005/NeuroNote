namespace NeuroNote.Api.Dtos;

public class CommentDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int PageId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
