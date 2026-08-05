using Microsoft.EntityFrameworkCore;
using Mira.Domain.Entities;
using Mira.Domain.Enums;
using Mira.Infrastructure.DbContexts;

namespace Mira.Infrastructure.Repositories;

public class DashboardRepository : IDashboardRepository
{
    private readonly MiraContext _context;

    public DashboardRepository(MiraContext context)
    {
        _context = context;
    }

    public async Task<DashboardSnapshot> GetDashboardAsync(
        Guid userId,
        DateOnly today,
        int horizonDays,
        int recentItemCount,
        int attentionItemCount,
        CancellationToken cancellationToken = default)
    {
        var attentionThrough = today.AddDays(horizonDays);

        var counts = new DashboardCounts(
            await CountVisibleAsync(_context.Assets, userId, cancellationToken),
            await CountVisibleAsync(_context.Documents, userId, cancellationToken),
            await CountVisibleAsync(_context.Warranties, userId, cancellationToken),
            await CountVisibleAsync(_context.Contracts, userId, cancellationToken),
            await CountVisibleAsync(_context.Subscriptions, userId, cancellationToken));

        var recentEntities = await _context.Items
            .AsNoTracking()
            .Where(item => item.UserId == userId &&
                item.Status != ItemStatus.Archived)
            .OrderByDescending(item => item.CreatedAt)
            .Take(recentItemCount)
            .ToListAsync(cancellationToken);

        var recentItems = recentEntities
            .Select(item => new DashboardRecentItem(
                item.Id,
                item.Name,
                GetItemType(item),
                item.Status.ToString(),
                item.CreatedAt))
            .ToList();

        var attentionItems = new List<DashboardAttentionItem>();

        attentionItems.AddRange(await _context.Warranties
            .AsNoTracking()
            .Where(warranty => warranty.UserId == userId &&
                warranty.Status != ItemStatus.Archived &&
                warranty.EndsOn <= attentionThrough)
            .Select(warranty => new DashboardAttentionItem(
                warranty.Id,
                warranty.Name,
                nameof(Warranty),
                "WarrantyExpires",
                warranty.EndsOn))
            .ToListAsync(cancellationToken));

        attentionItems.AddRange(await _context.Documents
            .AsNoTracking()
            .Where(document => document.UserId == userId &&
                document.Status != ItemStatus.Archived &&
                document.ExpiresOn.HasValue &&
                document.ExpiresOn.Value <= attentionThrough)
            .Select(document => new DashboardAttentionItem(
                document.Id,
                document.Name,
                nameof(Document),
                "DocumentExpires",
                document.ExpiresOn!.Value))
            .ToListAsync(cancellationToken));

        attentionItems.AddRange(await _context.Contracts
            .AsNoTracking()
            .Where(contract => contract.UserId == userId &&
                contract.Status != ItemStatus.Archived &&
                contract.CancellationDeadline.HasValue &&
                contract.CancellationDeadline.Value <= attentionThrough)
            .Select(contract => new DashboardAttentionItem(
                contract.Id,
                contract.Name,
                nameof(Contract),
                "ContractCancellationDeadline",
                contract.CancellationDeadline!.Value))
            .ToListAsync(cancellationToken));

        attentionItems.AddRange(await _context.Contracts
            .AsNoTracking()
            .Where(contract => contract.UserId == userId &&
                contract.Status != ItemStatus.Archived &&
                contract.EndsOn.HasValue &&
                contract.EndsOn.Value <= attentionThrough)
            .Select(contract => new DashboardAttentionItem(
                contract.Id,
                contract.Name,
                nameof(Contract),
                "ContractEnds",
                contract.EndsOn!.Value))
            .ToListAsync(cancellationToken));

        attentionItems.AddRange(await _context.Subscriptions
            .AsNoTracking()
            .Where(subscription => subscription.UserId == userId &&
                subscription.Status != ItemStatus.Archived &&
                subscription.IsActive &&
                subscription.NextBillingDate.HasValue &&
                subscription.NextBillingDate.Value <= attentionThrough)
            .Select(subscription => new DashboardAttentionItem(
                subscription.Id,
                subscription.Name,
                nameof(Subscription),
                "SubscriptionBilling",
                subscription.NextBillingDate!.Value))
            .ToListAsync(cancellationToken));

        var orderedAttentionItems = attentionItems
            .OrderBy(item => item.DueOn)
            .ThenBy(item => item.ItemName)
            .Take(attentionItemCount)
            .ToList();

        return new DashboardSnapshot(
            counts,
            recentItems,
            orderedAttentionItems);
    }

    private static Task<int> CountVisibleAsync<TEntity>(
        IQueryable<TEntity> entities,
        Guid userId,
        CancellationToken cancellationToken)
        where TEntity : Item
    {
        return entities.CountAsync(
            item => item.UserId == userId &&
                item.Status != ItemStatus.Archived,
            cancellationToken);
    }

    private static string GetItemType(Item item)
    {
        return item switch
        {
            Asset => nameof(Asset),
            Document => nameof(Document),
            Warranty => nameof(Warranty),
            Contract => nameof(Contract),
            Subscription => nameof(Subscription),
            _ => nameof(Item)
        };
    }
}
