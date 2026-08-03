using Microsoft.EntityFrameworkCore;
using Mira.Infrastructure.DbContexts;

namespace Mira.Infrastructure.Repositories;

public class ContractRepository : IContractRepository
{
    private readonly MiraContext _context;

    public ContractRepository(MiraContext context)
    {
        _context = context;
    }

    public async Task<bool> ContractExistsAsync(Guid userId, Guid contractId)
    {
        return await _context.Contracts.AnyAsync(contract =>
            contract.Id == contractId && contract.UserId == userId);
    }
}
