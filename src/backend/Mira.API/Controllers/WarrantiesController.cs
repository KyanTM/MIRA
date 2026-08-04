using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Mira.Contracts.Models.Warranty;
using Mira.Domain.Entities;
using Mira.Domain.Enums;
using Mira.Infrastructure.Repositories;

namespace Mira.API.Controllers;

[ApiController]
[Route("api/warranties")]
public class WarrantiesController : ControllerBase
{
    private readonly IAssetRepository _assetRepository;
    private readonly IMapper _mapper;
    private readonly IWarrantyRepository _warrantyRepository;

    public WarrantiesController(
        IWarrantyRepository warrantyRepository,
        IAssetRepository assetRepository,
        IMapper mapper)
    {
        _warrantyRepository = warrantyRepository;
        _assetRepository = assetRepository;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WarrantySummaryDto>>> GetWarranties(
        [FromQuery] bool includeArchived = false,
        [FromQuery] Guid? assetId = null,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        if (assetId == Guid.Empty)
        {
            ModelState.AddModelError(
                nameof(assetId),
                "AssetId moet een geldige identifier bevatten.");
            return ValidationProblem(ModelState);
        }

        var warranties = await _warrantyRepository.GetWarrantiesAsync(
            userId,
            includeArchived,
            assetId,
            cancellationToken);

        return Ok(_mapper.Map<IEnumerable<WarrantySummaryDto>>(warranties));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<WarrantyDetailDto>> GetWarranty(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        var warranty = await _warrantyRepository.GetWarrantyAsync(
            userId,
            id,
            cancellationToken);

        if (warranty is null)
        {
            return NotFound();
        }

        return Ok(_mapper.Map<WarrantyDetailDto>(warranty));
    }

    [HttpPost]
    public async Task<ActionResult<WarrantyDetailDto>> CreateWarranty(
        CreateWarrantyDto createWarrantyDto,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        var asset = await _assetRepository.GetAssetAsync(
            userId,
            createWarrantyDto.AssetId);

        if (asset is null)
        {
            ModelState.AddModelError(
                nameof(createWarrantyDto.AssetId),
                "De opgegeven asset bestaat niet.");
            return ValidationProblem(ModelState);
        }

        if (asset.Status == ItemStatus.Archived)
        {
            return Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "De asset is gearchiveerd.",
                detail: "Herstel de asset voordat je er een garantie aan koppelt.");
        }

        var warranty = _mapper.Map<Warranty>(createWarrantyDto);
        warranty.UserId = userId;
        warranty.Asset = asset;
        warranty.Name = warranty.Name.Trim();
        warranty.Provider = warranty.Provider.Trim();

        _warrantyRepository.AddWarranty(warranty);

        if (!await _warrantyRepository.SaveChangesAsync(cancellationToken))
        {
            return Problem(
                detail: "De garantie kon niet worden opgeslagen.");
        }

        var createdWarrantyDto = _mapper.Map<WarrantyDetailDto>(warranty);

        return CreatedAtAction(
            nameof(GetWarranty),
            new { id = warranty.Id },
            createdWarrantyDto);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<WarrantyDetailDto>> UpdateWarranty(
        Guid id,
        UpdateWarrantyDto updateWarrantyDto,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        var warranty = await _warrantyRepository.GetWarrantyAsync(
            userId,
            id,
            cancellationToken);

        if (warranty is null)
        {
            return NotFound();
        }

        var asset = await _assetRepository.GetAssetAsync(
            userId,
            updateWarrantyDto.AssetId);

        if (asset is null)
        {
            ModelState.AddModelError(
                nameof(updateWarrantyDto.AssetId),
                "De opgegeven asset bestaat niet.");
            return ValidationProblem(ModelState);
        }

        if (asset.Status == ItemStatus.Archived)
        {
            return Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "De asset is gearchiveerd.",
                detail: "Herstel de asset voordat je er een garantie aan koppelt.");
        }

        _mapper.Map(updateWarrantyDto, warranty);
        warranty.Asset = asset;
        warranty.Name = warranty.Name.Trim();
        warranty.Provider = warranty.Provider.Trim();
        warranty.UpdatedAt = DateTimeOffset.UtcNow;

        if (!await _warrantyRepository.SaveChangesAsync(cancellationToken))
        {
            return Problem(
                detail: "De garantie kon niet worden bijgewerkt.");
        }

        return Ok(_mapper.Map<WarrantyDetailDto>(warranty));
    }

    [HttpPatch("{id:guid}/archive")]
    public async Task<ActionResult<WarrantyDetailDto>> ArchiveWarranty(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        var warranty = await _warrantyRepository.GetWarrantyAsync(
            userId,
            id,
            cancellationToken);

        if (warranty is null)
        {
            return NotFound();
        }

        if (warranty.Status == ItemStatus.Archived)
        {
            return Ok(_mapper.Map<WarrantyDetailDto>(warranty));
        }

        var archivedAt = DateTimeOffset.UtcNow;
        warranty.Status = ItemStatus.Archived;
        warranty.ArchivedAt = archivedAt;
        warranty.UpdatedAt = archivedAt;

        if (!await _warrantyRepository.SaveChangesAsync(cancellationToken))
        {
            return Problem(
                detail: "De garantie kon niet worden gearchiveerd.");
        }

        return Ok(_mapper.Map<WarrantyDetailDto>(warranty));
    }

    [HttpPatch("{id:guid}/restore")]
    public async Task<ActionResult<WarrantyDetailDto>> RestoreWarranty(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        var warranty = await _warrantyRepository.GetWarrantyAsync(
            userId,
            id,
            cancellationToken);

        if (warranty is null)
        {
            return NotFound();
        }

        if (warranty.Status != ItemStatus.Archived)
        {
            return Ok(_mapper.Map<WarrantyDetailDto>(warranty));
        }

        warranty.Status = ItemStatus.Active;
        warranty.ArchivedAt = null;
        warranty.UpdatedAt = DateTimeOffset.UtcNow;

        if (!await _warrantyRepository.SaveChangesAsync(cancellationToken))
        {
            return Problem(
                detail: "De garantie kon niet worden hersteld.");
        }

        return Ok(_mapper.Map<WarrantyDetailDto>(warranty));
    }

    private bool TryGetCurrentUserId(out Guid userId)
    {
        return Guid.TryParse(
            User.FindFirstValue(ClaimTypes.NameIdentifier),
            out userId);
    }
}
