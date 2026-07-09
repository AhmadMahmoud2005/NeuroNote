using Microsoft.AspNetCore.Mvc;
using NeuroNote.Api.Dtos;
using NeuroNote.Api.Services;

namespace NeuroNote.Api.Controllers;

[ApiController]
[Route("api/v1")]
public class BlocksController : ControllerBase
{
    private readonly IBlockService blockService;

    public BlocksController(IBlockService blockService)
    {
        this.blockService = blockService;
    }

    [HttpGet("pages/{pageId:int}/blocks")]
    public async Task<ActionResult<IEnumerable<BlockDto>>> ListByPage(int pageId)
    {
        var blocks = await blockService.ListByPageAsync(pageId);
        return Ok(blocks);
    }

    [HttpPost("pages/{pageId:int}/blocks")]
    public async Task<ActionResult<BlockDto>> Create(int pageId, [FromBody] CreateBlockRequest request)
    {
        if (request.PageId != pageId) return BadRequest(new { message = "PageId mismatch." });

        var block = await blockService.CreateAsync(request);
        return block is null ? BadRequest(new { message = "Page or parent block is invalid." }) : CreatedAtAction(nameof(ListByPage), new { pageId = pageId }, block);
    }

    [HttpPut("blocks/{id:int}")]
    public async Task<ActionResult<BlockDto>> Update(int id, [FromBody] UpdateBlockRequest request)
    {
        var block = await blockService.UpdateAsync(id, request);
        return block is null ? NotFound() : Ok(block);
    }

    [HttpDelete("blocks/{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await blockService.DeleteAsync(id);
        return ok ? NoContent() : NotFound();
    }
}
