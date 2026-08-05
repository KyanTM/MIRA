using Mira.Domain.Entities;

namespace Mira.Infrastructure.Repositories;

public interface IWarrantyRepository
{
    Task<IReadOnlyList<Warranty>> GetWarrantiesAsync(
        Guid userId,
        bool includeArchived = false,
        Guid? assetId = null,
        CancellationToken cancellationToken = default);

    Task<Warranty?> GetWarrantyAsync(
        Guid userId,
        Guid warrantyId,
        CancellationToken cancellationToken = default);

    void AddWarranty(Warranty warranty);

    Task<bool> SaveChangesAsync(
        CancellationToken cancellationToken = default);
}
