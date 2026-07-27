using Mira.Infrastructure.DbContexts;
using Microsoft.EntityFrameworkCore;
using Mira.Domain.Entities;
using Mira.Domain.Enums;

namespace Mira.Infrastructure.Repositories
{
    public class AssetRepository : IAssetRepository
    {
        private readonly MiraContext _context;

        public AssetRepository(MiraContext context)
        {
            _context = context;
        }

        public void AddAsset(Asset asset)
        {
            _context.Assets.Add(asset);
        }

        public async Task<Asset?> GetAssetAsync(Guid userId, Guid assetId)
        {
            return await _context.Assets
                .FirstOrDefaultAsync(asset =>
                asset.Id == assetId &&
                asset.UserId == userId);
        }

        public async Task<IEnumerable<Asset>> GetAssetsAsync(
            Guid userId,
            bool includeArchived = false)
        {
            var assets = _context.Assets
                .AsNoTracking()
                .Where(asset => asset.UserId == userId);

            if (!includeArchived)
            {
                assets = assets.Where(
                    asset => asset.Status != ItemStatus.Archived);
            }

            return await assets
                .OrderBy(asset => asset.Name)
                .ToListAsync();
        }

        public async Task<bool> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync() > 0;
        }
    }
}
