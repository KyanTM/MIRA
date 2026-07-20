using System.ComponentModel.DataAnnotations;
using Mira.Domain.Enums;

namespace Mira.Domain.Entities;

public abstract class Item
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public required Guid UserId { get; set; }

    [Required]
    [MaxLength(200)]
    public required string Name { get; set; }

    [MaxLength(2_000)]
    public string? Description { get; set; }

    public ItemStatus Status { get; set; } = ItemStatus.Active;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? UpdatedAt { get; set; }

    public DateTimeOffset? ArchivedAt { get; set; }

    public ICollection<ItemDocument> DocumentLinks { get; set; } = [];
}
