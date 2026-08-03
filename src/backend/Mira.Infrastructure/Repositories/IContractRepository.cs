namespace Mira.Infrastructure.Repositories;

public interface IContractRepository
{
    Task<bool> ContractExistsAsync(Guid userId, Guid contractId);
}
