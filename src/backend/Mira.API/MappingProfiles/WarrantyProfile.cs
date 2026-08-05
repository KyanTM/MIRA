using AutoMapper;
using Mira.Contracts.Models.Warranty;
using Mira.Domain.Entities;

namespace Mira.API.MappingProfiles;

public class WarrantyProfile : Profile
{
    public WarrantyProfile()
    {
        CreateMap<Warranty, WarrantySummaryDto>()
            .ForCtorParam(
                nameof(WarrantySummaryDto.AssetName),
                options => options.MapFrom(
                    warranty => warranty.Asset!.Name))
            .ForCtorParam(
                nameof(WarrantySummaryDto.Status),
                options => options.MapFrom(
                    warranty => warranty.Status.ToString()));

        CreateMap<Warranty, WarrantyDetailDto>()
            .ForCtorParam(
                nameof(WarrantyDetailDto.AssetName),
                options => options.MapFrom(
                    warranty => warranty.Asset!.Name))
            .ForCtorParam(
                nameof(WarrantyDetailDto.Status),
                options => options.MapFrom(
                    warranty => warranty.Status.ToString()));

        CreateMap<CreateWarrantyDto, Warranty>();
        CreateMap<UpdateWarrantyDto, Warranty>();
    }
}
