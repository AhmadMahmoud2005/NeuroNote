using Microsoft.AspNetCore.Mvc;
using NeuroNote.Api.Dtos;
using NeuroNote.Api.Services;

namespace NeuroNote.Api.Controllers;

[ApiController]
[Route("api/v1/search")]
public class SearchController : ControllerBase
{
    private readonly ISearchService searchService;

    public SearchController(ISearchService searchService)
    {
        this.searchService = searchService;
    }

    [HttpGet]
    public async Task<ActionResult<SearchResultDto>> Search([FromQuery] string query, [FromQuery] int? workspaceId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest(new { message = "Search query is required." });
        }

        var results = await searchService.SearchAsync(query, workspaceId, cancellationToken);
        return Ok(results);
    }
}
