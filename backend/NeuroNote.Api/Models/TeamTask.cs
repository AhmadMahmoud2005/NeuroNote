using System;

namespace NeuroNote.Api.Models;

public class TeamTask
{
    public int Id { get; set; }
    
    public int WorkspaceId { get; set; }
    public Workspace Workspace { get; set; } = null!;

    public int CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Priority { get; set; } = "Medium"; // Low, Medium, High
    public string Complexity { get; set; } = "Medium"; // Easy, Medium, Hard
    public DateTime? DueDate { get; set; }
    public bool IsCompleted { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
