using Mira.Domain.Enums;

namespace Mira.Domain.Entities;

public class ItemDocument
{
    public Guid ItemId { get; set; }

    public Item? Item { get; set; }

    public Guid DocumentId { get; set; }

    public Document? Document { get; set; }

    public ItemDocumentRole Role { get; set; } = ItemDocumentRole.Attachment;

    public DateTimeOffset LinkedAt { get; set; } = DateTimeOffset.UtcNow;
}
