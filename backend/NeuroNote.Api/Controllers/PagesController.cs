using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NeuroNote.Api.Dtos;
using NeuroNote.Api.Services;

namespace NeuroNote.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/pages")]
public class PagesController : ControllerBase
{
    private readonly IPageService pageService;

    public PagesController(IPageService pageService)
    {
        this.pageService = pageService;
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<PageDto>> Get(int id, CancellationToken cancellationToken)
    {
        var page = await pageService.GetByIdAsync(id, cancellationToken);
        return page is null ? NotFound() : Ok(page);
    }

    [HttpGet("by-workspace/{workspaceId:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<PageDto>>> ListByWorkspace(int workspaceId, CancellationToken cancellationToken)
    {
        var pages = await pageService.ListByWorkspaceAsync(workspaceId, cancellationToken);
        return Ok(pages);
    }

    [HttpPost]
    public async Task<ActionResult<PageDto>> Create([FromBody] CreatePageRequest request, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "A valid user session is required." });
        }

        var page = await pageService.CreateAsync(request, userId.Value, cancellationToken);
        return page is null ? BadRequest(new { message = "Workspace, parent page, or user is invalid." }) : CreatedAtAction(nameof(Get), new { id = page.Id }, page);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<PageDto>> Update(int id, [FromBody] UpdatePageRequest request, CancellationToken cancellationToken)
    {
        var page = await pageService.UpdateAsync(id, request, cancellationToken);
        return page is null ? NotFound() : Ok(page);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var ok = await pageService.DeleteAsync(id, cancellationToken);
        return ok ? NoContent() : NotFound();
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
