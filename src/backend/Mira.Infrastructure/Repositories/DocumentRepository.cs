using Microsoft.EntityFrameworkCore;
using Mira.Domain.Entities;
using Mira.Domain.Enums;
using Mira.Infrastructure.DbContexts;

namespace Mira.Infrastructure.Repositories;

public class DocumentRepository : IDocumentRepository
{
    private readonly MiraContext _context;

    public DocumentRepository(MiraContext context)
    {
        _context = context;
    }

    public void AddDocument(Document document)
    {
        _context.Documents.Add(document);
    }

    public void AddLink(ItemDocument link)
    {
        _context.ItemDocuments.Add(link);
    }

    public async Task DeleteDocumentAsync(
        Document document,
        CancellationToken cancellationToken = default)
    {
        var links = await _context.ItemDocuments
            .Where(link =>
                link.DocumentId == document.Id ||
                link.ItemId == document.Id)
            .ToListAsync(cancellationToken);

        _context.ItemDocuments.RemoveRange(links);
        _context.Documents.Remove(document);
    }

    public async Task<Document?> GetDocumentAsync(
        Guid userId,
        Guid documentId,
        bool asTracking,
        CancellationToken cancellationToken = default)
    {
        IQueryable<Document> documents = _context.Documents
            .Include(document => document.ItemLinks)
            .ThenInclude(link => link.Item);

        if (!asTracking)
        {
            documents = documents.AsNoTracking();
        }

        return await documents.FirstOrDefaultAsync(
            document => document.Id == documentId &&
                document.UserId == userId,
            cancellationToken);
    }

    public async Task<IReadOnlyList<Document>> GetDocumentsAsync(
        Guid userId,
        bool includeArchived,
        string? search,
        DocumentType? documentType,
        Guid? itemId,
        CancellationToken cancellationToken = default)
    {
        var documents = _context.Documents
            .AsNoTracking()
            .Where(document => document.UserId == userId);

        if (!includeArchived)
        {
            documents = documents.Where(
                document => document.Status != ItemStatus.Archived);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.Trim();

            documents = documents.Where(document =>
                document.Name.Contains(normalizedSearch) ||
                document.OriginalFileName.Contains(normalizedSearch) ||
                (document.Issuer != null &&
                    document.Issuer.Contains(normalizedSearch)));
        }

        if (documentType.HasValue)
        {
            documents = documents.Where(
                document => document.DocumentType == documentType.Value);
        }

        if (itemId.HasValue)
        {
            documents = documents.Where(document =>
                document.ItemLinks.Any(
                    link => link.ItemId == itemId.Value));
        }

        return await documents
            .OrderByDescending(document => document.CreatedAt)
            .ThenBy(document => document.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<ItemDocument?> GetLinkAsync(
        Guid documentId,
        Guid itemId,
        CancellationToken cancellationToken = default)
    {
        return await _context.ItemDocuments
            .Include(link => link.Item)
            .FirstOrDefaultAsync(
                link => link.DocumentId == documentId &&
                    link.ItemId == itemId,
                cancellationToken);
    }

    public async Task<Item?> GetOwnedItemAsync(
        Guid userId,
        Guid itemId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Items.FirstOrDefaultAsync(
            item => item.Id == itemId && item.UserId == userId,
            cancellationToken);
    }

    public async Task<bool> HasPrimaryImageAsync(
        Guid userId,
        Guid itemId,
        Guid excludingDocumentId,
        CancellationToken cancellationToken = default)
    {
        return await _context.ItemDocuments.AnyAsync(
            link => link.ItemId == itemId &&
                link.DocumentId != excludingDocumentId &&
                link.Role == ItemDocumentRole.PrimaryImage &&
                link.Item!.UserId == userId,
            cancellationToken);
    }

    public void RemoveLink(ItemDocument link)
    {
        _context.ItemDocuments.Remove(link);
    }

    public async Task<bool> SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken) > 0;
    }
}
