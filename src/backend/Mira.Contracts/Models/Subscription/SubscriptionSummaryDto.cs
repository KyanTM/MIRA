namespace Mira.Contracts.Models.Subscription;

public sealed record SubscriptionSummaryDto(
    Guid Id,
    string Name,
    string Provider,
    decimal Price,
    string BillingFrequency,
    DateOnly? NextBillingDate,
    bool AutomaticallyRenews,
    bool IsActive,
    string Status,
    DateTimeOffset CreatedAt);
