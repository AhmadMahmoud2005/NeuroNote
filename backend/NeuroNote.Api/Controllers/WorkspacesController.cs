using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NeuroNote.Api.Data;
using NeuroNote.Api.DTOs.Workspaces;
using NeuroNote.Api.Models;
using System.Security.Claims;

namespace NeuroNote.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class WorkspacesController : ControllerBase
{
    private readonly NeuroNoteDbContext _context;

    public WorkspacesController(NeuroNoteDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetWorkspaces()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);

        var workspaces = await _context.Workspaces
            .Where(w => w.OwnerUserId == userId || w.Members.Any(m => m.UserId == userId))
            .OrderByDescending(w => w.CreatedAt)
            .Select(w => new WorkspaceResponseDto
            {
                Id = w.Id,
                Name = w.Name,
                Slug = w.Slug,
                Description = w.Description,
                OwnerUserId = w.OwnerUserId,
                CreatedAt = w.CreatedAt
            })
            .ToListAsync();

        return Ok(workspaces);
    }

    [HttpPost]
    public async Task<IActionResult> CreateWorkspace([FromBody] CreateWorkspaceDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);

        var slug = await GenerateUniqueWorkspaceSlugAsync(dto.Name);

        var workspace = new Workspace
        {
            Name = dto.Name,
            Description = dto.Description,
            Slug = slug,
            OwnerUserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Workspaces.Add(workspace);
        await _context.SaveChangesAsync();

        return Ok(new WorkspaceResponseDto
        {
            Id = workspace.Id,
            Name = workspace.Name,
            Slug = workspace.Slug,
            Description = workspace.Description,
            OwnerUserId = workspace.OwnerUserId,
            CreatedAt = workspace.CreatedAt
        });
    }

    [HttpGet("invitations")]
    public async Task<IActionResult> GetInvitations()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);
        var currentUser = await _context.Users.FindAsync(userId);
        if (currentUser == null)
            return NotFound();

        var invitations = await _context.Invitations
            .Include(i => i.Workspace)
            .Include(i => i.InvitedByUser)
            .Where(i => (i.Email == currentUser.Email || i.Email == currentUser.Username) && i.Status == "Pending")
            .Select(i => new WorkspaceInvitationDto
            {
                Id = i.Id,
                WorkspaceId = i.WorkspaceId,
                WorkspaceName = i.Workspace.Name,
                InvitedByUsername = i.InvitedByUser.Username,
                Role = i.MemberRole,
                CreatedAt = i.CreatedAt
            })
            .ToListAsync();

        return Ok(invitations);
    }

    [HttpPost("{workspaceId}/invite")]
    public async Task<IActionResult> InviteUser(int workspaceId, [FromBody] InviteUserDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);

        var workspace = await _context.Workspaces.FindAsync(workspaceId);
        if (workspace == null)
            return NotFound(new { message = "Workspace not found." });

        if (workspace.OwnerUserId != userId)
            return Forbid();

        // Check if input is email or username
        User? targetUser = null;
        if (dto.UsernameOrEmail.Contains("@"))
        {
            targetUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.UsernameOrEmail);
        }
        else
        {
            targetUser = await _context.Users.FirstOrDefaultAsync(u => u.Username == dto.UsernameOrEmail);
        }

        if (targetUser == null)
            return NotFound(new { message = "User not found." });

        // Check if user is already a member
        var isMember = await _context.WorkspaceMembers.AnyAsync(m => m.WorkspaceId == workspaceId && m.UserId == targetUser.Id) || workspace.OwnerUserId == targetUser.Id;
        if (isMember)
            return Conflict(new { message = "User is already a member of this workspace." });

        // Check if user is already invited
        var isInvited = await _context.Invitations.AnyAsync(i => i.WorkspaceId == workspaceId && (i.Email == targetUser.Email || i.Email == targetUser.Username) && i.Status == "Pending");
        if (isInvited)
            return Conflict(new { message = "An invitation is already pending for this user." });

        var invitation = new Invitation
        {
            WorkspaceId = workspaceId,
            Email = targetUser.Email,
            InvitedByUserId = userId,
            MemberRole = dto.Role,
            Token = Guid.NewGuid().ToString(),
            Status = "Pending",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };

        _context.Invitations.Add(invitation);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Invitation sent successfully." });
    }

    [HttpPost("invitations/{invitationId}/respond")]
    public async Task<IActionResult> RespondToInvitation(int invitationId, [FromBody] RespondInvitationDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);
        var currentUser = await _context.Users.FindAsync(userId);
        if (currentUser == null)
            return NotFound();

        var invitation = await _context.Invitations.FindAsync(invitationId);
        if (invitation == null)
            return NotFound(new { message = "Invitation not found." });

        if (invitation.Status != "Pending")
            return BadRequest(new { message = "Invitation has already been processed." });

        if (invitation.Email != currentUser.Email && invitation.Email != currentUser.Username)
            return Forbid();

        if (dto.Accept)
        {
            invitation.Status = "Accepted";
            invitation.AcceptedAt = DateTime.UtcNow;

            var member = new WorkspaceMember
            {
                WorkspaceId = invitation.WorkspaceId,
                UserId = userId,
                MemberRole = invitation.MemberRole,
                JoinedAt = DateTime.UtcNow
            };
            _context.WorkspaceMembers.Add(member);
        }
        else
        {
            invitation.Status = "Declined";
            invitation.DeclinedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = dto.Accept ? "Workspace invitation accepted." : "Workspace invitation declined." });
    }

    private string GenerateSlug(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return "workspace";

        var slug = name.ToLowerInvariant().Trim();
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"\s+", "-");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"-+", "-");
        return slug;
    }

    private async Task<string> GenerateUniqueWorkspaceSlugAsync(string name)
    {
        var baseSlug = GenerateSlug(name);
        var slug = baseSlug;
        int suffix = 1;

        while (await _context.Workspaces.AnyAsync(w => w.Slug == slug))
        {
            slug = $"{baseSlug}-{suffix}";
            suffix++;
        }
        return slug;
    }
}
