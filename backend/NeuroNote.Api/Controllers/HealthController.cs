using Microsoft.AspNetCore.Mvc;

namespace NeuroNote.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new { status = "ok", service = "NeuroNote.Api" });
}
