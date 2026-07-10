using System;
using System.ComponentModel.DataAnnotations;

namespace NeuroNote.Api.DTOs.Tasks;

public class CreateTaskDto
{
    [Required]
    [StringLength(250)]
    public string Title { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Description { get; set; }

    [Required]
    [StringLength(50)]
    public string Priority { get; set; } = "Medium"; // Low, Medium, High

    [Required]
    [StringLength(50)]
    public string Complexity { get; set; } = "Medium"; // Easy, Medium, Hard

    public DateTime? DueDate { get; set; }
}
