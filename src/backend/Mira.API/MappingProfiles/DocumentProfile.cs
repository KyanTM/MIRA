using AutoMapper;
using Mira.Contracts.Models.Document;
using Mira.Domain.Entities;
using Mira.Domain.Enums;

namespace Mira.API.MappingProfiles;

public class DocumentProfile : Profile
{
    public DocumentProfile()
    {
        CreateMap<Document, DocumentSummaryDto>()
            .ForCtorParam(
                nameof(DocumentSummaryDto.DocumentType),
                options => options.MapFrom(
                    document => document.DocumentType.ToString()))
            .ForCtorParam(
                nameof(DocumentSummaryDto.Status),
                options => options.MapFrom(
                    document => document.Status.ToString()));

        CreateMap<Document, DocumentDetailDto>()
            .ForCtorParam(
                nameof(DocumentDetailDto.DocumentType),
                options => options.MapFrom(
                    document => document.DocumentType.ToString()))
            .ForCtorParam(
                nameof(DocumentDetailDto.Status),
                options => options.MapFrom(
                    document => document.Status.ToString()))
            .ForCtorParam(
                nameof(DocumentDetailDto.Links),
                options => options.MapFrom(
                    document => document.ItemLinks));

        CreateMap<ItemDocument, DocumentLinkDto>()
            .ForCtorParam(
                nameof(DocumentLinkDto.ItemName),
                options => options.MapFrom(link => link.Item!.Name))
            .ForCtorParam(
                nameof(DocumentLinkDto.ItemType),
                options => options.MapFrom(
                    link => link.Item!.GetType().Name))
            .ForCtorParam(
                nameof(DocumentLinkDto.Role),
                options => options.MapFrom(link => link.Role.ToString()));

        CreateMap<UpdateDocumentDto, Document>()
            .ForMember(
                document => document.DocumentType,
                options => options.MapFrom(dto =>
                    Enum.Parse<DocumentType>(dto.DocumentType)));
    }
}
