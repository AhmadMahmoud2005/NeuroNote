using System;
using System.Collections.Generic;

namespace NeuroNote.Api.DTOs.Search;

public class SearchResultDto
{
    public List<SearchNoteDto> Notes { get; set; } = new();
    public List<SearchTaskDto> Tasks { get; set; } = new();
    public List<SearchWorkspaceDto> Workspaces { get; set; } = new();
}

public class SearchNoteDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Excerpt { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
    public string WorkspaceName { get; set; } = string.Empty;
}

public class SearchTaskDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public DateTime? DueDate { get; set; }
}

public class SearchWorkspaceDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string OwnerUsername { get; set; } = string.Empty;
}
