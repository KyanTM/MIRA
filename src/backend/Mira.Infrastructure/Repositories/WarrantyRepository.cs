using Microsoft.EntityFrameworkCore;
using Mira.Domain.Entities;
using Mira.Domain.Enums;
using Mira.Infrastructure.DbContexts;

namespace Mira.Infrastructure.Repositories;

public class WarrantyRepository : IWarrantyRepository
{
    private readonly MiraContext _context;

    public WarrantyRepository(MiraContext context)
    {
        _context = context;
    }

    public void AddWarranty(Warranty warranty)
    {
        _context.Warranties.Add(warranty);
    }

    public async Task<Warranty?> GetWarrantyAsync(
        Guid userId,
        Guid warrantyId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Warranties
            .Include(warranty => warranty.Asset)
            .FirstOrDefaultAsync(
                warranty => warranty.Id == warrantyId &&
                    warranty.UserId == userId,
                cancellationToken);
    }

    public async Task<IReadOnlyList<Warranty>> GetWarrantiesAsync(
        Guid userId,
        bool includeArchived = false,
        Guid? assetId = null,
        CancellationToken cancellationToken = default)
    {
        var warranties = _context.Warranties
            .AsNoTracking()
            .Include(warranty => warranty.Asset)
            .Where(warranty => warranty.UserId == userId);

        if (!includeArchived)
        {
            warranties = warranties.Where(
                warranty => warranty.Status != ItemStatus.Archived);
        }

        if (assetId.HasValue)
        {
            warranties = warranties.Where(
                warranty => warranty.AssetId == assetId.Value);
        }

        return await warranties
            .OrderBy(warranty => warranty.EndsOn)
            .ThenBy(warranty => warranty.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken) > 0;
    }
}
