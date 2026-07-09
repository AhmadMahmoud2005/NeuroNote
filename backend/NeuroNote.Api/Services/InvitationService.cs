using Microsoft.EntityFrameworkCore;
using NeuroNote.Api.Data;
using NeuroNote.Api.Dtos;
using NeuroNote.Api.Models;

namespace NeuroNote.Api.Services;

public class InvitationService : IInvitationService
{
    private const string PendingStatus = "Pending";
    private const string AcceptedStatus = "Accepted";
    private const string DeclinedStatus = "Declined";

    private readonly NeuroNoteDbContext dbContext;
    private readonly IActivityLogService activityLogService;

    public InvitationService(NeuroNoteDbContext dbContext, IActivityLogService activityLogService)
    {
        this.dbContext = dbContext;
        this.activityLogService = activityLogService;
    }

    public async Task<InvitationDto?> CreateAsync(int workspaceId, int invitedByUserId, CreateInvitationRequest request, CancellationToken cancellationToken = default)
    {
        var workspace = await dbContext.Workspaces.FirstOrDefaultAsync(candidate => candidate.Id == workspaceId, cancellationToken);
        var inviter = await dbContext.Users.FirstOrDefaultAsync(candidate => candidate.Id == invitedByUserId, cancellationToken);

        if (workspace is null || inviter is null || !await CanManageWorkspaceAsync(workspaceId, invitedByUserId, cancellationToken))
        {
            return null;
        }

        var email = request.Email.Trim().ToLowerInvariant();
        var role = NormalizeMemberRole(request.MemberRole);
        var existingPending = await dbContext.Invitations.FirstOrDefaultAsync(
            invitation => invitation.WorkspaceId == workspaceId && invitation.Email == email && invitation.Status == PendingStatus,
            cancellationToken);

        if (existingPending is not null)
        {
            existingPending.MemberRole = role;
            existingPending.ExpiresAt = DateTime.UtcNow.AddDays(7);
            existingPending.Token = CreateToken();
            await dbContext.SaveChangesAsync(cancellationToken);

            return await MapByIdAsync(existingPending.Id, cancellationToken);
        }

        var invitation = new Invitation
        {
            WorkspaceId = workspaceId,
            Email = email,
            InvitedByUserId = invitedByUserId,
            MemberRole = role,
            Token = CreateToken(),
            Status = PendingStatus,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Invitations.Add(invitation);
        await dbContext.SaveChangesAsync(cancellationToken);

        await activityLogService.RecordAsync(
            invitedByUserId,
            "InvitationCreated",
            $"{inviter.FullName} invited {email} to {workspace.Name}.",
            workspaceId,
            cancellationToken: cancellationToken);

        return await MapByIdAsync(invitation.Id, cancellationToken);
    }

    public async Task<IEnumerable<NotificationDto>> ListNotificationsAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await dbContext.Users.AsNoTracking().FirstOrDefaultAsync(candidate => candidate.Id == userId, cancellationToken);
        if (user is null)
        {
            return Array.Empty<NotificationDto>();
        }

        return await dbContext.Invitations
            .AsNoTracking()
            .Include(invitation => invitation.Workspace)
            .Include(invitation => invitation.InvitedByUser)
            .Where(invitation => invitation.Email == user.Email && invitation.Status == PendingStatus && invitation.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(invitation => invitation.CreatedAt)
            .Select(invitation => new NotificationDto
            {
                Id = invitation.Id,
                Type = "WorkspaceInvitation",
                Message = $"{invitation.InvitedByUser.FullName} invited you to join {invitation.Workspace.Name}",
                WorkspaceId = invitation.WorkspaceId,
                WorkspaceName = invitation.Workspace.Name,
                Token = invitation.Token,
                CreatedAt = invitation.CreatedAt
            })
            .ToListAsync(cancellationToken);
    }

    public Task<InvitationDto?> AcceptAsync(string token, int userId, CancellationToken cancellationToken = default)
    {
        return CompleteAsync(token, userId, AcceptedStatus, cancellationToken);
    }

    public Task<InvitationDto?> DeclineAsync(string token, int userId, CancellationToken cancellationToken = default)
    {
        return CompleteAsync(token, userId, DeclinedStatus, cancellationToken);
    }

    private async Task<InvitationDto?> CompleteAsync(string token, int userId, string status, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(candidate => candidate.Id == userId, cancellationToken);
        var invitation = await dbContext.Invitations
            .Include(candidate => candidate.Workspace)
            .FirstOrDefaultAsync(candidate => candidate.Token == token, cancellationToken);

        if (user is null || invitation is null || invitation.Email != user.Email || invitation.Status != PendingStatus || invitation.ExpiresAt <= DateTime.UtcNow)
        {
            return null;
        }

        invitation.Status = status;

        if (status == AcceptedStatus)
        {
            invitation.AcceptedAt = DateTime.UtcNow;
            var memberExists = await dbContext.WorkspaceMembers.AnyAsync(
                member => member.WorkspaceId == invitation.WorkspaceId && member.UserId == userId,
                cancellationToken);

            if (!memberExists)
            {
                dbContext.WorkspaceMembers.Add(new WorkspaceMember
                {
                    WorkspaceId = invitation.WorkspaceId,
                    UserId = userId,
                    MemberRole = invitation.MemberRole,
                    JoinedAt = DateTime.UtcNow
                });
            }
        }
        else
        {
            invitation.DeclinedAt = DateTime.UtcNow;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        await activityLogService.RecordAsync(
            userId,
            status == AcceptedStatus ? "InvitationAccepted" : "InvitationDeclined",
            $"{user.FullName} {status.ToLowerInvariant()} an invitation to {invitation.Workspace.Name}.",
            invitation.WorkspaceId,
            cancellationToken: cancellationToken);

        return await MapByIdAsync(invitation.Id, cancellationToken);
    }

    private async Task<bool> CanManageWorkspaceAsync(int workspaceId, int userId, CancellationToken cancellationToken)
    {
        return await dbContext.Workspaces.AnyAsync(workspace => workspace.Id == workspaceId && workspace.OwnerUserId == userId, cancellationToken)
            || await dbContext.WorkspaceMembers.AnyAsync(
                member => member.WorkspaceId == workspaceId && member.UserId == userId && member.MemberRole == "Admin",
                cancellationToken);
    }

    private async Task<InvitationDto?> MapByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await dbContext.Invitations
            .AsNoTracking()
            .Include(invitation => invitation.Workspace)
            .Include(invitation => invitation.InvitedByUser)
            .Where(invitation => invitation.Id == id)
            .Select(invitation => new InvitationDto
            {
                Id = invitation.Id,
                WorkspaceId = invitation.WorkspaceId,
                WorkspaceName = invitation.Workspace.Name,
                Email = invitation.Email,
                InvitedByUserId = invitation.InvitedByUserId,
                InvitedByName = invitation.InvitedByUser.FullName,
                MemberRole = invitation.MemberRole,
                Token = invitation.Token,
                Status = invitation.Status,
                ExpiresAt = invitation.ExpiresAt,
                CreatedAt = invitation.CreatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    private static string NormalizeMemberRole(string role)
    {
        return string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase) ? "Admin" : "Member";
    }

    private static string CreateToken()
    {
        return Convert.ToBase64String(Guid.NewGuid().ToByteArray())
            .Replace("+", string.Empty)
            .Replace("/", string.Empty)
            .Replace("=", string.Empty);
    }
}
