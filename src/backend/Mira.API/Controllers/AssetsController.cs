using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Mira.Infrastructure.Repositories;
using Mira.Contracts.Models.Asset;
using Mira.Domain.Entities;
using Mira.Domain.Enums;
using AutoMapper;

namespace Mira.API.Controllers;

[ApiController]
[Route("api/assets")]
public class AssetsController : ControllerBase
{
    private readonly IAssetRepository _assetRepository;
    private readonly IMapper _mapper;

    public AssetsController(IAssetRepository assetRepository, IMapper mapper)
    {
        _assetRepository = assetRepository;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AssetSummaryDto>>> GetAssets(
        [FromQuery] bool includeArchived = false)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var assets = await _assetRepository.GetAssetsAsync(
            userId,
            includeArchived);

        var assetDtos = _mapper.Map<IEnumerable<AssetSummaryDto>>(assets);

        return Ok(assetDtos);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AssetDetailDto>> GetAsset(Guid id)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var asset = await _assetRepository.GetAssetAsync(userId, id);

        if (asset is null)
        {
            return NotFound();
        }

        var assetDto = _mapper.Map<AssetDetailDto>(asset);

        return Ok(assetDto);
    }

    [HttpPost]
    public async Task<ActionResult<AssetDetailDto>> CreateAsset(
        CreateAssetDto createAssetDto)
    {
        var userIdValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var asset = _mapper.Map<Asset>(createAssetDto);

        asset.UserId = userId;

        _assetRepository.AddAsset(asset);

        var wasSaved = await _assetRepository.SaveChangesAsync();

        if (!wasSaved)
        {
            return Problem(
                detail: "De asset kon niet worden opgeslagen.");
        }

        var createdAssetDto =
            _mapper.Map<AssetDetailDto>(asset);

        return CreatedAtAction(
            nameof(GetAsset),
            new { id = asset.Id },
            createdAssetDto);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AssetDetailDto>> UpdateAsset(
        Guid id,
        UpdateAssetDto updateAssetDto)
    {
        var userIdValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var asset = await _assetRepository.GetAssetAsync(userId, id);

        if (asset is null)
        {
            return NotFound();
        }

        _mapper.Map(updateAssetDto, asset);
        asset.UpdatedAt = DateTimeOffset.UtcNow;

        var wasSaved = await _assetRepository.SaveChangesAsync();

        if (!wasSaved)
        {
            return Problem(
                detail: "De asset kon niet worden bijgewerkt.");
        }

        var updatedAssetDto =
            _mapper.Map<AssetDetailDto>(asset);

        return Ok(updatedAssetDto);
    }

    [HttpPatch("{id:guid}/archive")]
    public async Task<ActionResult<AssetDetailDto>> ArchiveAsset(Guid id)
    {
        var userIdValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var asset = await _assetRepository.GetAssetAsync(userId, id);

        if (asset is null)
        {
            return NotFound();
        }

        if (asset.Status == ItemStatus.Archived)
        {
            var alreadyArchivedDto =
                _mapper.Map<AssetDetailDto>(asset);

            return Ok(alreadyArchivedDto);
        }

        var archivedAt = DateTimeOffset.UtcNow;

        asset.Status = ItemStatus.Archived;
        asset.ArchivedAt = archivedAt;
        asset.UpdatedAt = archivedAt;

        var wasSaved = await _assetRepository.SaveChangesAsync();

        if (!wasSaved)
        {
            return Problem(
                detail: "De asset kon niet worden gearchiveerd.");
        }

        var archivedAssetDto =
            _mapper.Map<AssetDetailDto>(asset);

        return Ok(archivedAssetDto);
    }

    [HttpPatch("{id:guid}/restore")]
    public async Task<ActionResult<AssetDetailDto>> RestoreAsset(Guid id)
    {
        var userIdValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var asset = await _assetRepository.GetAssetAsync(userId, id);

        if (asset is null)
        {
            return NotFound();
        }

        if (asset.Status != ItemStatus.Archived)
        {
            var alreadyRestoredDto =
                _mapper.Map<AssetDetailDto>(asset);

            return Ok(alreadyRestoredDto);
        }

        asset.Status = ItemStatus.Active;
        asset.ArchivedAt = null;
        asset.UpdatedAt = DateTimeOffset.UtcNow;

        var wasSaved = await _assetRepository.SaveChangesAsync();

        if (!wasSaved)
        {
            return Problem(
                detail: "De asset kon niet worden hersteld.");
        }

        var restoredAssetDto =
            _mapper.Map<AssetDetailDto>(asset);

        return Ok(restoredAssetDto);
    }
}
