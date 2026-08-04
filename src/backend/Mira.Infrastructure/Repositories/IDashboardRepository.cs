namespace Mira.Infrastructure.Repositories;

public interface IDashboardRepository
{
    Task<DashboardSnapshot> GetDashboardAsync(
        Guid userId,
        DateOnly today,
        int horizonDays,
        int recentItemCount,
        int attentionItemCount,
        CancellationToken cancellationToken = default);
}

public sealed record DashboardSnapshot(
    DashboardCounts Counts,
    IReadOnlyList<DashboardRecentItem> RecentItems,
    IReadOnlyList<DashboardAttentionItem> AttentionItems);

public sealed record DashboardCounts(
    int Assets,
    int Documents,
    int Warranties,
    int Contracts,
    int Subscriptions);

public sealed record DashboardRecentItem(
    Guid Id,
    string Name,
    string ItemType,
    string Status,
    DateTimeOffset CreatedAt);

public sealed record DashboardAttentionItem(
    Guid ItemId,
    string ItemName,
    string ItemType,
    string EventType,
    DateOnly DueOn);
