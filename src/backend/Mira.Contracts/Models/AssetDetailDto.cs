namespace Mira.Contracts.Models
{
    public sealed record AssetDetailDto(
        Guid Id,
        string Name,
        string? Description,
        string? Brand,
        string? Model,
        string? SerialNumber,
        DateOnly? PurchaseDate,
        decimal? PurchasePrice,
        string? Seller,
        string? Location,
        decimal? CurrentValue,
        string Status,
        DateTimeOffset CreatedAt,
        DateTimeOffset? UpdatedAt,
        DateTimeOffset? ArchivedAt);
}
