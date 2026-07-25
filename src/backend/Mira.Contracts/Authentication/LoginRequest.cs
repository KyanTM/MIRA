using System.ComponentModel.DataAnnotations;

namespace Mira.Contracts.Authentication;

public sealed record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password,
    bool RememberMe = false);
