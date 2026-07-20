using System.ComponentModel.DataAnnotations;

namespace Mira.Domain.Entities;

public class Warranty : Item
{
    [Required]
    [MaxLength(200)]
    public required string Provider { get; set; }

    public DateOnly StartsOn { get; set; }

    public DateOnly EndsOn { get; set; }

    [MaxLength(100)]
    public string? WarrantyType { get; set; }

    [MaxLength(4_000)]
    public string? Terms { get; set; }

    [MaxLength(2_000)]
    public string? ClaimInstructions { get; set; }

    public required Guid AssetId { get; set; }

    public Asset? Asset { get; set; }
}
