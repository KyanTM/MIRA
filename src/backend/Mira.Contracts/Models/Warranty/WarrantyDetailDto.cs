namespace Mira.Contracts.Models.Warranty;

public sealed record WarrantyDetailDto(
    Guid Id,
    Guid AssetId,
    string AssetName,
    string Name,
    string? Description,
    string Provider,
    DateOnly StartsOn,
    DateOnly EndsOn,
    string? WarrantyType,
    string? Terms,
    string? ClaimInstructions,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    DateTimeOffset? ArchivedAt);
