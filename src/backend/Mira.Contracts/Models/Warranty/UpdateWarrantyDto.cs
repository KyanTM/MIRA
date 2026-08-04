using System.ComponentModel.DataAnnotations;

namespace Mira.Contracts.Models.Warranty;

public sealed class UpdateWarrantyDto : IValidatableObject
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(2_000)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(200)]
    public string Provider { get; set; } = string.Empty;

    public DateOnly StartsOn { get; set; }

    public DateOnly EndsOn { get; set; }

    [MaxLength(100)]
    public string? WarrantyType { get; set; }

    [MaxLength(4_000)]
    public string? Terms { get; set; }

    [MaxLength(2_000)]
    public string? ClaimInstructions { get; set; }

    public Guid AssetId { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (AssetId == Guid.Empty)
        {
            yield return new ValidationResult(
                "AssetId moet een geldige identifier bevatten.",
                [nameof(AssetId)]);
        }

        if (EndsOn < StartsOn)
        {
            yield return new ValidationResult(
                "EndsOn mag niet vóór StartsOn liggen.",
                [nameof(EndsOn)]);
        }
    }
}
