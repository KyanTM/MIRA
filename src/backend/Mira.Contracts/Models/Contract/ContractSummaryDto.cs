namespace Mira.Contracts.Models.Contract;

public sealed record ContractSummaryDto(
    Guid Id,
    string Name,
    string ContractParty,
    string? ContractNumber,
    DateOnly StartsOn,
    DateOnly? EndsOn,
    decimal? Cost,
    string? BillingFrequency,
    bool AutomaticallyRenews,
    string Status,
    DateTimeOffset CreatedAt);
