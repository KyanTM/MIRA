namespace Mira.Contracts.Models.Warranty;

public sealed record WarrantySummaryDto(
    Guid Id,
    Guid AssetId,
    string AssetName,
    string Name,
    string Provider,
    DateOnly StartsOn,
    DateOnly EndsOn,
    string? WarrantyType,
    string Status,
    DateTimeOffset CreatedAt);
