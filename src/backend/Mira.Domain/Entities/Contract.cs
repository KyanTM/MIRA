using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Mira.Domain.Enums;

namespace Mira.Domain.Entities;

public class Contract : Item
{
    [Required]
    [MaxLength(200)]
    public required string ContractParty { get; set; }

    [MaxLength(100)]
    public string? ContractNumber { get; set; }

    public DateOnly StartsOn { get; set; }

    public DateOnly? EndsOn { get; set; }

    public int? CancellationNoticeDays { get; set; }

    public DateOnly? CancellationDeadline { get; set; }

    public bool AutomaticallyRenews { get; set; }

    public int? RenewalPeriodMonths { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? Cost { get; set; }

    public BillingFrequency? BillingFrequency { get; set; }

    public ICollection<Subscription> Subscriptions { get; set; } = [];
}
