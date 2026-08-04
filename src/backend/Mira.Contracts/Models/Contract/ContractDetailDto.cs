namespace Mira.Contracts.Models.Contract;

public sealed record ContractDetailDto(
    Guid Id,
    string Name,
    string? Description,
    string ContractParty,
    string? ContractNumber,
    DateOnly StartsOn,
    DateOnly? EndsOn,
    int? CancellationNoticeDays,
    DateOnly? CancellationDeadline,
    bool AutomaticallyRenews,
    int? RenewalPeriodMonths,
    decimal? Cost,
    string? BillingFrequency,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    DateTimeOffset? ArchivedAt);
