using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NeuroNote.Api.Dtos;
using NeuroNote.Api.Services;

namespace NeuroNote.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/workspaces")]
public class WorkspacesController : ControllerBase
{
    private readonly IWorkspaceService workspaceService;

    public WorkspacesController(IWorkspaceService workspaceService)
    {
        this.workspaceService = workspaceService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<WorkspaceDto>>> GetAll(CancellationToken cancellationToken)
    {
        var list = await workspaceService.GetAllAsync(cancellationToken);
        return Ok(list);
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<WorkspaceDto>> Get(int id, CancellationToken cancellationToken)
    {
        var workspace = await workspaceService.GetByIdAsync(id, cancellationToken);
        return workspace is null ? NotFound() : Ok(workspace);
    }

    [HttpPost]
    public async Task<ActionResult<WorkspaceDto>> Create([FromBody] CreateWorkspaceRequest request, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "A valid user session is required." });
        }

        var created = await workspaceService.CreateAsync(request, userId.Value, cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<WorkspaceDto>> Update(int id, [FromBody] UpdateWorkspaceRequest request, CancellationToken cancellationToken)
    {
        var updated = await workspaceService.UpdateAsync(id, request, cancellationToken);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var ok = await workspaceService.DeleteAsync(id, cancellationToken);
        return ok ? NoContent() : NotFound();
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
