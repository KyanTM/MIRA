using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Mira.Domain.Enums;

namespace Mira.Domain.Entities;

public class Subscription : Item
{
    [Required]
    [MaxLength(200)]
    public required string Provider { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    public required BillingFrequency BillingFrequency { get; set; }

    public DateOnly? StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    public DateOnly? NextBillingDate { get; set; }

    public DateOnly? TrialEndsOn { get; set; }

    public bool AutomaticallyRenews { get; set; }

    public int? CancellationNoticeDays { get; set; }

    [MaxLength(100)]
    public string? PaymentMethod { get; set; }

    public bool IsActive { get; set; } = true;

    [MaxLength(2_000)]
    public string? Notes { get; set; }

    public Guid? ContractId { get; set; }

    public Contract? Contract { get; set; }
}
