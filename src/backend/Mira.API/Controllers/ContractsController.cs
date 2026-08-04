using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Mira.Contracts.Models.Contract;
using Mira.Domain.Entities;
using Mira.Domain.Enums;
using Mira.Infrastructure.Repositories;
using System.Security.Claims;

namespace Mira.API.Controllers;

[ApiController]
[Route("api/contracts")]
public class ContractsController : ControllerBase
{
    private readonly IContractRepository _contractRepository;
    private readonly IMapper _mapper;

    public ContractsController(
        IContractRepository contractRepository,
        IMapper mapper)
    {
        _contractRepository = contractRepository;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ContractSummaryDto>>> GetContracts(
        [FromQuery] bool includeArchived = false)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var contracts = await _contractRepository.GetContractsAsync(
            userId,
            includeArchived);

        var contractDtos =
            _mapper.Map<IEnumerable<ContractSummaryDto>>(contracts);

        return Ok(contractDtos);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ContractDetailDto>> GetContract(Guid id)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var contract =
            await _contractRepository.GetContractAsync(userId, id);

        if (contract is null)
        {
            return NotFound();
        }

        var contractDto = _mapper.Map<ContractDetailDto>(contract);

        return Ok(contractDto);
    }

    [HttpPost]
    public async Task<ActionResult<ContractDetailDto>> CreateContract(
        CreateContractDto createContractDto)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var contract = _mapper.Map<Contract>(createContractDto);

        contract.UserId = userId;

        _contractRepository.AddContract(contract);

        var wasSaved = await _contractRepository.SaveChangesAsync();

        if (!wasSaved)
        {
            return Problem(
                detail: "Het contract kon niet worden opgeslagen.");
        }

        var createdContractDto =
            _mapper.Map<ContractDetailDto>(contract);

        return CreatedAtAction(
            nameof(GetContract),
            new { id = contract.Id },
            createdContractDto);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ContractDetailDto>> UpdateContract(
        Guid id,
        UpdateContractDto updateContractDto)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var contract =
            await _contractRepository.GetContractAsync(userId, id);

        if (contract is null)
        {
            return NotFound();
        }

        _mapper.Map(updateContractDto, contract);

        contract.UpdatedAt = DateTimeOffset.UtcNow;

        var wasSaved = await _contractRepository.SaveChangesAsync();

        if (!wasSaved)
        {
            return Problem(
                detail: "Het contract kon niet worden bijgewerkt.");
        }

        var updatedContractDto =
            _mapper.Map<ContractDetailDto>(contract);

        return Ok(updatedContractDto);
    }

    [HttpPatch("{id:guid}/archive")]
    public async Task<ActionResult<ContractDetailDto>> ArchiveContract(Guid id)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var contract =
            await _contractRepository.GetContractAsync(userId, id);

        if (contract is null)
        {
            return NotFound();
        }

        if (contract.Status == ItemStatus.Archived)
        {
            var alreadyArchivedDto =
                _mapper.Map<ContractDetailDto>(contract);

            return Ok(alreadyArchivedDto);
        }

        var archivedAt = DateTimeOffset.UtcNow;

        contract.Status = ItemStatus.Archived;
        contract.ArchivedAt = archivedAt;
        contract.UpdatedAt = archivedAt;

        var wasSaved = await _contractRepository.SaveChangesAsync();

        if (!wasSaved)
        {
            return Problem(
                detail: "Het contract kon niet worden gearchiveerd.");
        }

        var archivedContractDto =
            _mapper.Map<ContractDetailDto>(contract);

        return Ok(archivedContractDto);
    }

    [HttpPatch("{id:guid}/restore")]
    public async Task<ActionResult<ContractDetailDto>> RestoreContract(Guid id)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var contract =
            await _contractRepository.GetContractAsync(userId, id);

        if (contract is null)
        {
            return NotFound();
        }

        if (contract.Status != ItemStatus.Archived)
        {
            var alreadyRestoredDto =
                _mapper.Map<ContractDetailDto>(contract);

            return Ok(alreadyRestoredDto);
        }

        contract.Status = ItemStatus.Active;
        contract.ArchivedAt = null;
        contract.UpdatedAt = DateTimeOffset.UtcNow;

        var wasSaved = await _contractRepository.SaveChangesAsync();

        if (!wasSaved)
        {
            return Problem(
                detail: "Het contract kon niet worden hersteld.");
        }

        var restoredContractDto =
            _mapper.Map<ContractDetailDto>(contract);

        return Ok(restoredContractDto);
    }
}
