using Microsoft.EntityFrameworkCore;
using Mira.Domain.Entities;
using Mira.Domain.Enums;
using Mira.Infrastructure.DbContexts;

namespace Mira.Infrastructure.Repositories;

public class ContractRepository : IContractRepository
{
    private readonly MiraContext _context;

    public ContractRepository(MiraContext context)
    {
        _context = context;
    }

    public void AddContract(Contract contract)
    {
        _context.Contracts.Add(contract);
    }

    public async Task<bool> ContractExistsAsync(Guid userId, Guid contractId)
    {
        return await _context.Contracts.AnyAsync(contract =>
            contract.Id == contractId && contract.UserId == userId);
    }

    public async Task<Contract?> GetContractAsync(
        Guid userId,
        Guid contractId)
    {
        return await _context.Contracts.FirstOrDefaultAsync(contract =>
            contract.Id == contractId && contract.UserId == userId);
    }

    public async Task<IEnumerable<Contract>> GetContractsAsync(
        Guid userId,
        bool includeArchived = false)
    {
        var contracts = _context.Contracts
            .AsNoTracking()
            .Where(contract => contract.UserId == userId);

        if (!includeArchived)
        {
            contracts = contracts.Where(
                contract => contract.Status != ItemStatus.Archived);
        }

        return await contracts
            .OrderBy(contract => contract.Name)
            .ToListAsync();
    }

    public async Task<bool> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync() > 0;
    }
}
