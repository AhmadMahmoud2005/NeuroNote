using System;

namespace NeuroNote.Api.DTOs.Pages;

public class PageInvitationDto
{
    public int Id { get; set; }
    public int PageId { get; set; }
    public string PageTitle { get; set; } = string.Empty;
    public string SharedByUsername { get; set; } = string.Empty;
    public string Permission { get; set; } = string.Empty;
    public DateTime SharedAt { get; set; }
}
