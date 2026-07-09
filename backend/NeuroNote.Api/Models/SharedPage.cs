using System;

namespace NeuroNote.Api.Models;

public class SharedPage
{
    public int Id { get; set; }
    public int PageId { get; set; }
    public Page Page { get; set; } = null!;

    public int SharedWithUserId { get; set; }
    public User SharedWithUser { get; set; } = null!;

    public string Permission { get; set; } = "Read"; // "Read", "Write"
    public string Status { get; set; } = "Pending"; // "Pending", "Accepted", "Declined"
    public DateTime SharedAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public DateTime? DeclinedAt { get; set; }
}
