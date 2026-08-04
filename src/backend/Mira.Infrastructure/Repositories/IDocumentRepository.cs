using Mira.Domain.Entities;
using Mira.Domain.Enums;

namespace Mira.Infrastructure.Repositories;

public interface IDocumentRepository
{
    Task<IReadOnlyList<Document>> GetDocumentsAsync(
        Guid userId,
        bool includeArchived,
        string? search,
        DocumentType? documentType,
        Guid? itemId,
        CancellationToken cancellationToken = default);

    Task<Document?> GetDocumentAsync(
        Guid userId,
        Guid documentId,
        bool asTracking,
        CancellationToken cancellationToken = default);

    Task<Item?> GetOwnedItemAsync(
        Guid userId,
        Guid itemId,
        CancellationToken cancellationToken = default);

    Task<ItemDocument?> GetLinkAsync(
        Guid documentId,
        Guid itemId,
        CancellationToken cancellationToken = default);

    Task<bool> HasPrimaryImageAsync(
        Guid userId,
        Guid itemId,
        Guid excludingDocumentId,
        CancellationToken cancellationToken = default);

    void AddDocument(Document document);

    void AddLink(ItemDocument link);

    void RemoveLink(ItemDocument link);

    Task DeleteDocumentAsync(
        Document document,
        CancellationToken cancellationToken = default);

    Task<bool> SaveChangesAsync(
        CancellationToken cancellationToken = default);
}
