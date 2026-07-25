using System.ComponentModel.DataAnnotations;

namespace Mira.Contracts.Authentication;

public sealed record RegisterRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);
