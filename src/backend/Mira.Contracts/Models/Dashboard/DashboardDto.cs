namespace Mira.Contracts.Models.Dashboard;

public sealed record DashboardDto(
    DateTimeOffset GeneratedAt,
    DateOnly AttentionThrough,
    DashboardCountsDto Counts,
    IReadOnlyCollection<DashboardRecentItemDto> RecentItems,
    IReadOnlyCollection<DashboardAttentionItemDto> AttentionItems);

public sealed record DashboardCountsDto(
    int Assets,
    int Documents,
    int Warranties,
    int Contracts,
    int Subscriptions);

public sealed record DashboardRecentItemDto(
    Guid Id,
    string Name,
    string ItemType,
    string Status,
    DateTimeOffset CreatedAt);

public sealed record DashboardAttentionItemDto(
    Guid ItemId,
    string ItemName,
    string ItemType,
    string EventType,
    DateOnly DueOn);
