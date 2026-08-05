namespace Mira.Contracts.Models.Document;

public sealed record DocumentSummaryDto(
    Guid Id,
    string Name,
    string OriginalFileName,
    string DocumentType,
    string MimeType,
    long FileSizeBytes,
    DateOnly? IssuedOn,
    DateOnly? ExpiresOn,
    string? Issuer,
    string Status,
    DateTimeOffset CreatedAt);
