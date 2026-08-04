namespace Mira.Contracts.Models.Document;

public sealed record DocumentLinkDto(
    Guid ItemId,
    string ItemName,
    string ItemType,
    string Role,
    DateTimeOffset LinkedAt);
