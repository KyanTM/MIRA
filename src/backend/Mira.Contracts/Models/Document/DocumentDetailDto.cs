namespace Mira.Contracts.Models.Document;

public sealed record DocumentDetailDto(
    Guid Id,
    string Name,
    string? Description,
    string OriginalFileName,
    string DocumentType,
    string MimeType,
    long FileSizeBytes,
    string Checksum,
    DateOnly? IssuedOn,
    DateOnly? ExpiresOn,
    string? Issuer,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    DateTimeOffset? ArchivedAt,
    IReadOnlyCollection<DocumentLinkDto> Links);
