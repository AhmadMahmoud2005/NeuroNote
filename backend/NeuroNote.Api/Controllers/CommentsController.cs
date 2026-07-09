using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NeuroNote.Api.Dtos;
using NeuroNote.Api.Services;

namespace NeuroNote.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1")]
public class CommentsController : ControllerBase
{
    private readonly ICommentService commentService;

    public CommentsController(ICommentService commentService)
    {
        this.commentService = commentService;
    }

    [HttpGet("pages/{pageId:int}/comments")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<CommentDto>>> ListByPage(int pageId, CancellationToken cancellationToken)
    {
        var comments = await commentService.ListByPageAsync(pageId, cancellationToken);
        return Ok(comments);
    }

    [HttpPost("pages/{pageId:int}/comments")]
    public async Task<ActionResult<CommentDto>> Create(int pageId, [FromBody] CreateCommentRequest request, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "A valid user session is required." });
        }

        var comment = await commentService.CreateAsync(pageId, userId.Value, request, cancellationToken);
        return comment is null ? NotFound(new { message = "Page or user was not found." }) : CreatedAtAction(nameof(ListByPage), new { pageId }, comment);
    }

    [HttpPut("comments/{id:int}")]
    public async Task<ActionResult<CommentDto>> Update(int id, [FromBody] UpdateCommentRequest request, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "A valid user session is required." });
        }

        var comment = await commentService.UpdateAsync(id, userId.Value, request, cancellationToken);
        return comment is null ? NotFound() : Ok(comment);
    }

    [HttpDelete("comments/{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "A valid user session is required." });
        }

        var deleted = await commentService.DeleteAsync(id, userId.Value, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
