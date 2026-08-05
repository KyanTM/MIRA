using System.ComponentModel.DataAnnotations;

namespace Mira.Contracts.Models.Document;

public sealed class SetDocumentLinkDto
{
    [Required]
    [AllowedValues("Attachment", "PrimaryImage", "GalleryImage")]
    public string Role { get; set; } = "Attachment";
}
