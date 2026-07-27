namespace Mira.Contracts.Models
{
    public sealed record AssetSummaryDto(
        Guid Id,
        string Name,
        string? Brand,
        string? Model,
        string? SerialNumber,
        DateOnly? PurchaseDate,
        decimal? PurchasePrice,
        string Status,
        DateTimeOffset CreatedAt);
}
