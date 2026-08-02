using System.ComponentModel.DataAnnotations;

namespace Mira.Contracts.Models.Subscription;

public sealed class UpdateSubscriptionDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(2_000)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(200)]
    public string Provider { get; set; } = string.Empty;

    [Range(0, double.MaxValue)]
    public decimal Price { get; set; }

    [Required]
    [MaxLength(32)]
    [AllowedValues(
        "Weekly",
        "Monthly",
        "Quarterly",
        "SemiAnnually",
        "Yearly")]
    public string BillingFrequency { get; set; } = string.Empty;

    public DateOnly? StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    public DateOnly? NextBillingDate { get; set; }

    public DateOnly? TrialEndsOn { get; set; }

    public bool AutomaticallyRenews { get; set; }

    [Range(0, int.MaxValue)]
    public int? CancellationNoticeDays { get; set; }

    [MaxLength(100)]
    public string? PaymentMethod { get; set; }

    public bool IsActive { get; set; }

    [MaxLength(2_000)]
    public string? Notes { get; set; }

    public Guid? ContractId { get; set; }
}
