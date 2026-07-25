namespace Mira.Contracts.Authentication;

public sealed record AuthenticatedUserDto(
    Guid Id,
    string Email);
