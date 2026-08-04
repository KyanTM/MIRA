using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Mira.API.Models.Documents;
using Mira.API.Services.Documents;
using Mira.Contracts.Models.Document;
using Mira.Domain.Entities;
using Mira.Domain.Enums;
using Mira.Infrastructure.Repositories;
using Mira.Infrastructure.Storage;
using DocumentEntity = Mira.Domain.Entities.Document;

namespace Mira.API.Controllers;

[ApiController]
[Route("api/documents")]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentRepository _documentRepository;
    private readonly IDocumentUploadValidator _documentUploadValidator;
    private readonly IPrivateFileStorage _fileStorage;
    private readonly ILogger<DocumentsController> _logger;
    private readonly IMapper _mapper;
    private readonly DocumentUploadOptions _uploadOptions;

    public DocumentsController(
        IDocumentRepository documentRepository,
        IDocumentUploadValidator documentUploadValidator,
        IPrivateFileStorage fileStorage,
        IOptions<DocumentUploadOptions> uploadOptions,
        IMapper mapper,
        ILogger<DocumentsController> logger)
    {
        _documentRepository = documentRepository;
        _documentUploadValidator = documentUploadValidator;
        _fileStorage = fileStorage;
        _uploadOptions = uploadOptions.Value;
        _mapper = mapper;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<DocumentSummaryDto>>> GetDocuments(
        [FromQuery] bool includeArchived = false,
        [FromQuery] string? search = null,
        [FromQuery] string? documentType = null,
        [FromQuery] Guid? itemId = null,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        if (search?.Length > 200)
        {
            ModelState.AddModelError(
                nameof(search),
                "De zoekterm mag maximaal 200 tekens bevatten.");
        }

        if (itemId == Guid.Empty)
        {
            ModelState.AddModelError(
                nameof(itemId),
                "ItemId moet een geldige identifier bevatten.");
        }

        DocumentType? parsedDocumentType = null;

        if (!string.IsNullOrWhiteSpace(documentType))
        {
            if (!Enum.TryParse<DocumentType>(
                    documentType,
                    ignoreCase: true,
                    out var parsedValue) ||
                !Enum.IsDefined(parsedValue))
            {
                ModelState.AddModelError(
                    nameof(documentType),
                    "Het documenttype is ongeldig.");
            }
            else
            {
                parsedDocumentType = parsedValue;
            }
        }

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var documents = await _documentRepository.GetDocumentsAsync(
            userId,
            includeArchived,
            search,
            parsedDocumentType,
            itemId,
            cancellationToken);

        return Ok(_mapper.Map<IEnumerable<DocumentSummaryDto>>(documents));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<DocumentDetailDto>> GetDocument(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        var document = await _documentRepository.GetDocumentAsync(
            userId,
            id,
            asTracking: false,
            cancellationToken);

        if (document is null)
        {
            return NotFound();
        }

        return Ok(_mapper.Map<DocumentDetailDto>(document));
    }

    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> DownloadDocument(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        var document = await _documentRepository.GetDocumentAsync(
            userId,
            id,
            asTracking: false,
            cancellationToken);

        if (document is null)
        {
            return NotFound();
        }

        var stream = await _fileStorage.OpenReadAsync(
            document.StorageKey,
            cancellationToken);

        if (stream is null)
        {
            _logger.LogError(
                "Private file for document {DocumentId} was not found.",
                document.Id);

            return Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Het bestand is niet beschikbaar.",
                detail: "De metadata bestaat, maar het private bestand ontbreekt.");
        }

        Response.Headers["Cache-Control"] = "private, no-store";
        Response.Headers["X-Content-Type-Options"] = "nosniff";

        return File(
            stream,
            document.MimeType,
            document.OriginalFileName,
            enableRangeProcessing: true);
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<DocumentDetailDto>> UploadDocument(
        [FromForm] UploadDocumentRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        var validation = await _documentUploadValidator.ValidateAsync(
            request.File!,
            cancellationToken);

        if (!validation.IsValid)
        {
            ModelState.AddModelError(
                nameof(request.File),
                validation.Error!);
            return ValidationProblem(ModelState);
        }

        var validatedUpload = validation.Upload!;
        var parsedDocumentType = Enum.Parse<DocumentType>(request.DocumentType);
        var parsedRole = Enum.Parse<ItemDocumentRole>(request.Role);

        if (parsedDocumentType == DocumentType.Image &&
            !validatedUpload.MimeType.StartsWith(
                "image/",
                StringComparison.OrdinalIgnoreCase))
        {
            ModelState.AddModelError(
                nameof(request.DocumentType),
                "DocumentType Image vereist een echt afbeeldingsbestand.");
            return ValidationProblem(ModelState);
        }

        Item? targetItem = null;

        if (request.ItemId.HasValue)
        {
            targetItem = await _documentRepository.GetOwnedItemAsync(
                userId,
                request.ItemId.Value,
                cancellationToken);

            var relationshipError = ValidateRelationship(
                targetItem,
                request.ItemId.Value,
                parsedRole,
                validatedUpload.MimeType);

            if (relationshipError is not null)
            {
                return relationshipError;
            }

            if (parsedRole == ItemDocumentRole.PrimaryImage &&
                await _documentRepository.HasPrimaryImageAsync(
                    userId,
                    targetItem!.Id,
                    Guid.Empty,
                    cancellationToken))
            {
                return PrimaryImageConflict();
            }
        }

        StoredFile storedFile;

        try
        {
            await using var source = request.File!.OpenReadStream();
            storedFile = await _fileStorage.SaveAsync(
                source,
                validatedUpload.Extension,
                _uploadOptions.MaxFileSizeBytes,
                cancellationToken);
        }
        catch (InvalidDataException exception)
        {
            ModelState.AddModelError(
                nameof(request.File),
                exception.Message);
            return ValidationProblem(ModelState);
        }

        var document = new DocumentEntity
        {
            UserId = userId,
            Name = ResolveDocumentName(
                request.Name,
                validatedUpload.OriginalFileName),
            Description = NullIfWhiteSpace(request.Description),
            DocumentType = parsedDocumentType,
            OriginalFileName = validatedUpload.OriginalFileName,
            StorageKey = storedFile.StorageKey,
            MimeType = validatedUpload.MimeType,
            FileSizeBytes = storedFile.FileSizeBytes,
            Checksum = storedFile.Checksum,
            IssuedOn = request.IssuedOn,
            ExpiresOn = request.ExpiresOn,
            Issuer = NullIfWhiteSpace(request.Issuer)
        };

        if (targetItem is not null)
        {
            document.ItemLinks.Add(new ItemDocument
            {
                ItemId = targetItem.Id,
                Item = targetItem,
                DocumentId = document.Id,
                Document = document,
                Role = parsedRole
            });
        }

        _documentRepository.AddDocument(document);

        try
        {
            if (!await _documentRepository.SaveChangesAsync(cancellationToken))
            {
                await DeleteFailedUploadAsync(storedFile.StorageKey);
                return Problem(
                    detail: "Het document kon niet worden opgeslagen.");
            }
        }
        catch (DbUpdateException exception)
        {
            await DeleteFailedUploadAsync(storedFile.StorageKey);
            _logger.LogWarning(
                exception,
                "Document metadata could not be persisted for user {UserId}.",
                userId);

            return Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "Het document kon niet worden gekoppeld.",
                detail: "De relatie conflicteert met bestaande documentgegevens.");
        }

        var createdDocumentDto = _mapper.Map<DocumentDetailDto>(document);

        return CreatedAtAction(
            nameof(GetDocument),
            new { id = document.Id },
            createdDocumentDto);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<DocumentDetailDto>> UpdateDocument(
        Guid id,
        UpdateDocumentDto updateDocumentDto,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        var document = await _documentRepository.GetDocumentAsync(
            userId,
            id,
            asTracking: true,
            cancellationToken);

        if (document is null)
        {
            return NotFound();
        }

        var documentType = Enum.Parse<DocumentType>(
            updateDocumentDto.DocumentType);

        if (documentType == DocumentType.Image &&
            !document.MimeType.StartsWith(
                "image/",
                StringComparison.OrdinalIgnoreCase))
        {
            ModelState.AddModelError(
                nameof(updateDocumentDto.DocumentType),
                "DocumentType Image vereist een echt afbeeldingsbestand.");
            return ValidationProblem(ModelState);
        }

        _mapper.Map(updateDocumentDto, document);
        document.Name = document.Name.Trim();
        document.Description = NullIfWhiteSpace(document.Description);
        document.Issuer = NullIfWhiteSpace(document.Issuer);
        document.UpdatedAt = DateTimeOffset.UtcNow;

        if (!await _documentRepository.SaveChangesAsync(cancellationToken))
        {
            return Problem(
                detail: "Het document kon niet worden bijgewerkt.");
        }

        return Ok(_mapper.Map<DocumentDetailDto>(document));
    }

    [HttpPut("{documentId:guid}/links/{itemId:guid}")]
    public async Task<ActionResult<DocumentLinkDto>> SetDocumentLink(
        Guid documentId,
        Guid itemId,
        SetDocumentLinkDto setDocumentLinkDto,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        var document = await _documentRepository.GetDocumentAsync(
            userId,
            documentId,
            asTracking: true,
            cancellationToken);

        if (document is null)
        {
            return NotFound();
        }

        if (document.Status == ItemStatus.Archived)
        {
            return Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "Het document is gearchiveerd.",
                detail: "Herstel het document voordat je koppelingen wijzigt.");
        }

        var targetItem = await _documentRepository.GetOwnedItemAsync(
            userId,
            itemId,
            cancellationToken);
        var role = Enum.Parse<ItemDocumentRole>(setDocumentLinkDto.Role);
        var relationshipError = ValidateRelationship(
            targetItem,
            itemId,
            role,
            document.MimeType);

        if (relationshipError is not null)
        {
            return relationshipError;
        }

        if (role == ItemDocumentRole.PrimaryImage &&
            await _documentRepository.HasPrimaryImageAsync(
                userId,
                itemId,
                documentId,
                cancellationToken))
        {
            return PrimaryImageConflict();
        }

        var link = await _documentRepository.GetLinkAsync(
            documentId,
            itemId,
            cancellationToken);

        if (link is not null && link.Role == role)
        {
            return Ok(_mapper.Map<DocumentLinkDto>(link));
        }

        if (link is null)
        {
            link = new ItemDocument
            {
                ItemId = itemId,
                Item = targetItem,
                DocumentId = documentId,
                Document = document,
                Role = role
            };

            _documentRepository.AddLink(link);
        }
        else
        {
            link.Role = role;
        }

        document.UpdatedAt = DateTimeOffset.UtcNow;

        try
        {
            if (!await _documentRepository.SaveChangesAsync(cancellationToken))
            {
                return Problem(
                    detail: "De documentkoppeling kon niet worden opgeslagen.");
            }
        }
        catch (DbUpdateException exception)
        {
            _logger.LogWarning(
                exception,
                "Document {DocumentId} could not be linked to item {ItemId}.",
                documentId,
                itemId);

            return PrimaryImageConflict();
        }

        return Ok(_mapper.Map<DocumentLinkDto>(link));
    }

    [HttpDelete("{documentId:guid}/links/{itemId:guid}")]
    public async Task<IActionResult> DeleteDocumentLink(
        Guid documentId,
        Guid itemId,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        var document = await _documentRepository.GetDocumentAsync(
            userId,
            documentId,
            asTracking: true,
            cancellationToken);

        if (document is null)
        {
            return NotFound();
        }

        var targetItem = await _documentRepository.GetOwnedItemAsync(
            userId,
            itemId,
            cancellationToken);

        if (targetItem is null)
        {
            return NotFound();
        }

        var link = await _documentRepository.GetLinkAsync(
            documentId,
            itemId,
            cancellationToken);

        if (link is null)
        {
            return NotFound();
        }

        _documentRepository.RemoveLink(link);
        document.UpdatedAt = DateTimeOffset.UtcNow;

        if (!await _documentRepository.SaveChangesAsync(cancellationToken))
        {
            return Problem(
                detail: "De documentkoppeling kon niet worden verwijderd.");
        }

        return NoContent();
    }

    [HttpPatch("{id:guid}/archive")]
    public async Task<ActionResult<DocumentDetailDto>> ArchiveDocument(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        var document = await _documentRepository.GetDocumentAsync(
            userId,
            id,
            asTracking: true,
            cancellationToken);

        if (document is null)
        {
            return NotFound();
        }

        if (document.Status == ItemStatus.Archived)
        {
            return Ok(_mapper.Map<DocumentDetailDto>(document));
        }

        var archivedAt = DateTimeOffset.UtcNow;
        document.Status = ItemStatus.Archived;
        document.ArchivedAt = archivedAt;
        document.UpdatedAt = archivedAt;

        if (!await _documentRepository.SaveChangesAsync(cancellationToken))
        {
            return Problem(
                detail: "Het document kon niet worden gearchiveerd.");
        }

        return Ok(_mapper.Map<DocumentDetailDto>(document));
    }

    [HttpPatch("{id:guid}/restore")]
    public async Task<ActionResult<DocumentDetailDto>> RestoreDocument(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        var document = await _documentRepository.GetDocumentAsync(
            userId,
            id,
            asTracking: true,
            cancellationToken);

        if (document is null)
        {
            return NotFound();
        }

        if (document.Status != ItemStatus.Archived)
        {
            return Ok(_mapper.Map<DocumentDetailDto>(document));
        }

        document.Status = ItemStatus.Active;
        document.ArchivedAt = null;
        document.UpdatedAt = DateTimeOffset.UtcNow;

        if (!await _documentRepository.SaveChangesAsync(cancellationToken))
        {
            return Problem(
                detail: "Het document kon niet worden hersteld.");
        }

        return Ok(_mapper.Map<DocumentDetailDto>(document));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteDocument(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        var document = await _documentRepository.GetDocumentAsync(
            userId,
            id,
            asTracking: true,
            cancellationToken);

        if (document is null)
        {
            return NotFound();
        }

        if (document.Status != ItemStatus.Archived)
        {
            return Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "Archiveer het document eerst.",
                detail: "Permanent verwijderen is alleen toegestaan voor een gearchiveerd document.");
        }

        var storageKey = document.StorageKey;

        await _documentRepository.DeleteDocumentAsync(
            document,
            cancellationToken);

        if (!await _documentRepository.SaveChangesAsync(cancellationToken))
        {
            return Problem(
                detail: "Het document kon niet permanent worden verwijderd.");
        }

        try
        {
            var wasDeleted = await _fileStorage.DeleteAsync(
                storageKey,
                CancellationToken.None);

            if (!wasDeleted)
            {
                _logger.LogWarning(
                    "Private file for deleted document {DocumentId} was already missing.",
                    id);
            }
        }
        catch (Exception exception) when (
            exception is IOException or UnauthorizedAccessException)
        {
            _logger.LogCritical(
                exception,
                "Database record {DocumentId} was deleted, but private file cleanup failed.",
                id);
        }

        return NoContent();
    }

    private async Task DeleteFailedUploadAsync(string storageKey)
    {
        try
        {
            await _fileStorage.DeleteAsync(
                storageKey,
                CancellationToken.None);
        }
        catch (Exception exception) when (
            exception is IOException or UnauthorizedAccessException)
        {
            _logger.LogError(
                exception,
                "Cleanup failed for uncommitted private file {StorageKey}.",
                storageKey);
        }
    }

    private ActionResult? ValidateRelationship(
        Item? targetItem,
        Guid itemId,
        ItemDocumentRole role,
        string mimeType)
    {
        if (targetItem is null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Het doelitem bestaat niet.",
                Detail = $"Item {itemId} is niet beschikbaar.",
                Status = StatusCodes.Status404NotFound
            });
        }

        if (targetItem is DocumentEntity)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Deze koppeling is niet toegestaan.",
                Detail = "Een document kan niet aan een ander document worden gekoppeld.",
                Status = StatusCodes.Status400BadRequest
            });
        }

        if (targetItem.Status == ItemStatus.Archived)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Het doelitem is gearchiveerd.",
                Detail = "Herstel het item voordat je er een document aan koppelt.",
                Status = StatusCodes.Status409Conflict
            });
        }

        if (role is ItemDocumentRole.PrimaryImage or
            ItemDocumentRole.GalleryImage &&
            !mimeType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "De afbeeldingsrol is ongeldig.",
                Detail = "PrimaryImage en GalleryImage vereisen een echt afbeeldingsbestand.",
                Status = StatusCodes.Status400BadRequest
            });
        }

        return null;
    }

    private ActionResult PrimaryImageConflict()
    {
        return Conflict(new ProblemDetails
        {
            Title = "Er bestaat al een hoofdafbeelding.",
            Detail = "Verwijder of wijzig eerst de bestaande PrimaryImage-koppeling.",
            Status = StatusCodes.Status409Conflict
        });
    }

    private bool TryGetCurrentUserId(out Guid userId)
    {
        return Guid.TryParse(
            User.FindFirstValue(ClaimTypes.NameIdentifier),
            out userId);
    }

    private static string ResolveDocumentName(
        string? requestedName,
        string originalFileName)
    {
        var name = string.IsNullOrWhiteSpace(requestedName)
            ? Path.GetFileNameWithoutExtension(originalFileName)
            : requestedName.Trim();

        if (string.IsNullOrWhiteSpace(name))
        {
            name = "Document";
        }

        return name.Length <= 200 ? name : name[..200];
    }

    private static string? NullIfWhiteSpace(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
