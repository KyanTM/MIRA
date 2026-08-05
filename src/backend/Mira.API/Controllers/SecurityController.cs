using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Antiforgery;

namespace Mira.API.Controllers
{
    [ApiController]
    [Route("api/security")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public sealed class SecurityController(IAntiforgery antiforgery) : ControllerBase
    {
        [AllowAnonymous]
        [HttpGet("antiforgery")]
        public IActionResult GetAntiForgeryToken()
        {
            var tokens = antiforgery.GetAndStoreTokens(HttpContext);

            return Ok(new
            {
                token = tokens.RequestToken
            });
        }
    }
}
