namespace Mira.Contracts.Models.Subscription;

public sealed record SubscriptionDetailDto(
    Guid Id,
    string Name,
    string? Description,
    string Provider,
    decimal Price,
    string BillingFrequency,
    DateOnly? StartDate,
    DateOnly? EndDate,
    DateOnly? NextBillingDate,
    DateOnly? TrialEndsOn,
    bool AutomaticallyRenews,
    int? CancellationNoticeDays,
    string? PaymentMethod,
    bool IsActive,
    string? Notes,
    Guid? ContractId,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    DateTimeOffset? ArchivedAt);
