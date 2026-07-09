using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NeuroNote.Api.Dtos;
using NeuroNote.Api.Services;

namespace NeuroNote.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1")]
public class InvitationsController : ControllerBase
{
    private readonly IInvitationService invitationService;

    public InvitationsController(IInvitationService invitationService)
    {
        this.invitationService = invitationService;
    }

    [HttpPost("workspaces/{workspaceId:int}/invitations")]
    public async Task<ActionResult<InvitationDto>> Create(int workspaceId, [FromBody] CreateInvitationRequest request, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "A valid user session is required." });
        }

        var invitation = await invitationService.CreateAsync(workspaceId, userId.Value, request, cancellationToken);
        return invitation is null
            ? Forbid()
            : CreatedAtAction(nameof(GetNotifications), new { }, invitation);
    }

    [HttpGet("notifications")]
    public async Task<ActionResult<IEnumerable<NotificationDto>>> GetNotifications(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "A valid user session is required." });
        }

        var notifications = await invitationService.ListNotificationsAsync(userId.Value, cancellationToken);
        return Ok(notifications);
    }

    [HttpPost("invitations/{token}/accept")]
    public async Task<ActionResult<InvitationDto>> Accept(string token, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "A valid user session is required." });
        }

        var invitation = await invitationService.AcceptAsync(token, userId.Value, cancellationToken);
        return invitation is null ? NotFound(new { message = "Invitation was not found or is no longer valid." }) : Ok(invitation);
    }

    [HttpPost("invitations/{token}/decline")]
    public async Task<ActionResult<InvitationDto>> Decline(string token, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "A valid user session is required." });
        }

        var invitation = await invitationService.DeclineAsync(token, userId.Value, cancellationToken);
        return invitation is null ? NotFound(new { message = "Invitation was not found or is no longer valid." }) : Ok(invitation);
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
