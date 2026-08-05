using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Mira.Contracts.Authentication;
using Mira.Infrastructure.Identity;

namespace Mira.API.Controllers
{

    [ApiController]
    [Route("api/auth")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public sealed class AuthController(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager) : ControllerBase
    {

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<ActionResult<AuthenticatedUserDto>> Register(RegisterRequest request)
        {
            var email = request.Email.Trim();

            var user = new ApplicationUser
            {
                UserName = email,
                Email = email
            };

            var result = await userManager.CreateAsync(user, request.Password);

            if (!result.Succeeded)
            {
                var errors = result.Errors
                    .GroupBy(error => error.Code)
                    .ToDictionary(
                        group => group.Key,
                        group => group
                            .Select(error => error.Description)
                            .ToArray());

                return ValidationProblem(new ValidationProblemDetails(errors));

            }

            await signInManager.SignInAsync(user, isPersistent: false);

            return Ok(new AuthenticatedUserDto(
                user.Id,
                user.Email));

        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<ActionResult<AuthenticatedUserDto>> Login(LoginRequest request)
        {
            var email = request.Email.Trim();

            var result = await signInManager.PasswordSignInAsync(email, request.Password, request.RememberMe, lockoutOnFailure: true);

            if (!result.Succeeded)
            {
                return Unauthorized(new
                {
                    message = "Email of wachtwoord is onjuist."
                });
            }

            var user = await userManager.FindByEmailAsync(email);

            if (user is null)
            {
                return Unauthorized();
            }

            return Ok(new AuthenticatedUserDto(user.Id, user.Email!));

        }

        [HttpGet("me")]
        public async Task<ActionResult<AuthenticatedUserDto>> Me()
        {
            var user = await userManager.GetUserAsync(User);

            if (user is null)
            {
                return Unauthorized();
            }

            return Ok(new AuthenticatedUserDto(user.Id, user.Email!));
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            await signInManager.SignOutAsync();
            return NoContent();
        }
        
    }
}
