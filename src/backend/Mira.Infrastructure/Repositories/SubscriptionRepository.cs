using Mira.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;
using Mira.Infrastructure.DbContexts;
using Microsoft.EntityFrameworkCore;
using Mira.Domain.Enums;

namespace Mira.Infrastructure.Repositories
{
    public class SubscriptionRepository : ISubscriptionRepository
    {
        private readonly MiraContext _context;

        public SubscriptionRepository(MiraContext context)
        {
            _context = context;
        }

        public void AddSubscription(Subscription subscription)
        {
            _context.Subscriptions.Add(subscription);
        }

        public async Task<Subscription?> GetSubscriptionAsync(Guid userId, Guid subscriptionId)
        {
            return await _context.Subscriptions.FirstOrDefaultAsync(subscription =>
                subscription.Id == subscriptionId && subscription.UserId == userId);
                               
        }

        public async Task<IEnumerable<Subscription>> GetSubscriptionsAsync(Guid userId, bool includeArchived = false)
        {
            var subscriptions = _context.Subscriptions.AsNoTracking().Where(subscription => subscription.UserId == userId);

            if (!includeArchived)
            {
                subscriptions = subscriptions.Where(subscription => subscription.Status != ItemStatus.Archived);
            }

            return await subscriptions.OrderBy(subscription => subscription.Name).ToListAsync();
        }

        public async Task<bool> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync() > 0;
        }
    }
}
