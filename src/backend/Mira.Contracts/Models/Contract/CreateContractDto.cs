using System;
using System.ComponentModel.DataAnnotations;

namespace Mira.Contracts.Models.Contract
{
    public sealed class CreateContractDto : IValidatableObject
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(2_000)]
        public string? Description { get; set; }

        [Required]
        [MaxLength(200)]
        public string ContractParty { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? ContractNumber { get; set; }

        public DateOnly StartsOn { get; set; }

        public DateOnly? EndsOn { get; set; }

        [Range(0, int.MaxValue)]
        public int? CancellationNoticeDays { get; set; }

        public DateOnly? CancellationDeadline { get; set; }

        public bool AutomaticallyRenews { get; set; }

        [Range(1, int.MaxValue)]
        public int? RenewalPeriodMonths { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? Cost { get; set; }

        [MaxLength(32)]
        [AllowedValues(
            "Weekly",
            "Monthly",
            "Quarterly",
            "SemiAnnually",
            "Yearly")]
        public string? BillingFrequency { get; set; }

        public IEnumerable<ValidationResult> Validate(
            ValidationContext validationContext)
        {
            if (EndsOn.HasValue && EndsOn < StartsOn)
            {
                yield return new ValidationResult(
                    "EndsOn mag niet vóór StartsOn liggen.",
                    [nameof(EndsOn)]);
            }
        }
    }
}
