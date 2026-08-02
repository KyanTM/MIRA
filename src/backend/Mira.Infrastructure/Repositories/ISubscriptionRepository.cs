using System;
using System.Collections.Generic;
using System.Text;
using Mira.Domain.Entities;

namespace Mira.Infrastructure.Repositories
{
    public interface ISubscriptionRepository
    {
        Task<IEnumerable<Subscription>> GetSubscriptionsAsync(Guid userId, bool includeArchived = false);

        Task<Subscription?> GetSubscriptionAsync(Guid userId, Guid subscriptionId);

        void AddSubscription(Subscription subscription);

        Task<bool> SaveChangesAsync();

    }
}
