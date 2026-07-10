using System;

namespace NeuroNote.Api.DTOs.Tasks;

public class TaskResponseDto
{
    public int Id { get; set; }
    public int WorkspaceId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Priority { get; set; } = "Medium";
    public string Complexity { get; set; } = "Medium";
    public DateTime? DueDate { get; set; }
    public bool IsCompleted { get; set; }
    public int CreatedByUserId { get; set; }
    public string CreatedByUsername { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
