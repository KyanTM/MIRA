using Mira.Domain.Entities;

namespace Mira.Infrastructure.Repositories
{
    public interface IAssetRepository
    {
        Task<IEnumerable<Asset>> GetAssetsAsync(
            Guid userId,
            bool includeArchived = false);

        Task<Asset?> GetAssetAsync(Guid userId, Guid assetId);

        void AddAsset(Asset asset);

        Task<bool> SaveChangesAsync();
    }
}
