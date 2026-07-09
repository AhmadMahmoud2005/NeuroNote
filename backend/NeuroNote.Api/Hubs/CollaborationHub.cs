using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace NeuroNote.Api.Hubs;

[Authorize]
public class CollaborationHub : Hub
{
    public Task JoinPage(int pageId)
    {
        return Groups.AddToGroupAsync(Context.ConnectionId, PageGroup(pageId));
    }

    public Task LeavePage(int pageId)
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, PageGroup(pageId));
    }

    public static string PageGroup(int pageId) => $"page:{pageId}";
}
