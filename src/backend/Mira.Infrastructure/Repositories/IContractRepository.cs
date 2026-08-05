using Mira.Domain.Entities;

namespace Mira.Infrastructure.Repositories;

public interface IContractRepository
{
    Task<IEnumerable<Contract>> GetContractsAsync(
        Guid userId,
        bool includeArchived = false);

    Task<Contract?> GetContractAsync(Guid userId, Guid contractId);

    Task<bool> ContractExistsAsync(Guid userId, Guid contractId);

    void AddContract(Contract contract);

    Task<bool> SaveChangesAsync();
}
