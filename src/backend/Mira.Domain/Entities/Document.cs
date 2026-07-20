using System.ComponentModel.DataAnnotations;
using Mira.Domain.Enums;

namespace Mira.Domain.Entities;

public class Document : Item
{
    public DocumentType DocumentType { get; set; } = DocumentType.Other;

    [Required]
    [MaxLength(255)]
    public required string OriginalFileName { get; set; }

    [Required]
    [MaxLength(500)]
    public required string StorageKey { get; set; }

    [Required]
    [MaxLength(100)]
    public required string MimeType { get; set; }

    public long FileSizeBytes { get; set; }

    [Required]
    [MaxLength(128)]
    public required string Checksum { get; set; }

    public DateOnly? IssuedOn { get; set; }

    public DateOnly? ExpiresOn { get; set; }

    [MaxLength(200)]
    public string? Issuer { get; set; }

    public ICollection<ItemDocument> ItemLinks { get; set; } = [];
}
