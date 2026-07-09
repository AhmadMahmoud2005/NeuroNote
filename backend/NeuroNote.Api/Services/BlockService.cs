using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using NeuroNote.Api.Data;
using NeuroNote.Api.Dtos;
using NeuroNote.Api.Hubs;
using NeuroNote.Api.Models;

namespace NeuroNote.Api.Services;

public class BlockService : IBlockService
{
    private readonly NeuroNoteDbContext db;
    private readonly IHubContext<CollaborationHub> collaborationHub;

    public BlockService(NeuroNoteDbContext db, IHubContext<CollaborationHub> collaborationHub)
    {
        this.db = db;
        this.collaborationHub = collaborationHub;
    }

    public async Task<IEnumerable<BlockDto>> ListByPageAsync(int pageId, CancellationToken cancellationToken = default)
    {
        var blocks = await db.Blocks.AsNoTracking().Where(b => b.PageId == pageId).OrderBy(b => b.SortOrder).ToListAsync(cancellationToken);
        return blocks.Select(Map);
    }

    public async Task<BlockDto?> CreateAsync(CreateBlockRequest request, CancellationToken cancellationToken = default)
    {
        var pageExists = await db.Pages.AnyAsync(page => page.Id == request.PageId, cancellationToken);
        var parentBlockIsValid = !request.ParentBlockId.HasValue || await db.Blocks.AnyAsync(
            block => block.Id == request.ParentBlockId.Value && block.PageId == request.PageId,
            cancellationToken);

        if (!pageExists || !parentBlockIsValid)
        {
            return null;
        }

        var block = new Block
        {
            PageId = request.PageId,
            Type = request.Type.Trim(),
            Content = request.Content,
            ParentBlockId = request.ParentBlockId,
            SortOrder = request.SortOrder,
            CreatedAt = DateTime.UtcNow
        };

        db.Blocks.Add(block);
        await db.SaveChangesAsync(cancellationToken);

        await NotifyPageChangedAsync(block.PageId, "BlockCreated", cancellationToken);

        return Map(block);
    }

    public async Task<BlockDto?> UpdateAsync(int id, UpdateBlockRequest request, CancellationToken cancellationToken = default)
    {
        var block = await db.Blocks.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
        if (block is null) return null;

        if (request.Type is not null) block.Type = request.Type;
        if (request.Content is not null) block.Content = request.Content;
        if (request.SortOrder.HasValue) block.SortOrder = request.SortOrder.Value;
        block.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
        await NotifyPageChangedAsync(block.PageId, "BlockUpdated", cancellationToken);
        return Map(block);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var block = await db.Blocks.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
        if (block is null) return false;

        db.Blocks.Remove(block);
        await db.SaveChangesAsync(cancellationToken);
        await NotifyPageChangedAsync(block.PageId, "BlockDeleted", cancellationToken);
        return true;
    }

    private static BlockDto Map(Block b) => new()
    {
        Id = b.Id,
        PageId = b.PageId,
        Type = b.Type,
        Content = b.Content,
        SortOrder = b.SortOrder,
        ParentBlockId = b.ParentBlockId,
        CreatedAt = b.CreatedAt,
        UpdatedAt = b.UpdatedAt
    };

    private Task NotifyPageChangedAsync(int pageId, string eventType, CancellationToken cancellationToken)
    {
        return collaborationHub.Clients
            .Group(CollaborationHub.PageGroup(pageId))
            .SendAsync("PageChanged", new { pageId, eventType }, cancellationToken);
    }
}
