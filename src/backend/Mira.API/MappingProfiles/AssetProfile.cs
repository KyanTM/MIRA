using AutoMapper;
using Mira.Contracts.Models.Asset;
using Mira.Domain.Entities;

namespace Mira.API.MappingProfiles;

public class AssetProfile : Profile
{
    public AssetProfile()
    {
        CreateMap<Asset, AssetSummaryDto>()
            .ForCtorParam(
                nameof(AssetSummaryDto.Status),
                options => options.MapFrom(
                    asset => asset.Status.ToString()));

        CreateMap<Asset, AssetDetailDto>()
            .ForCtorParam(
                nameof(AssetDetailDto.Status),
                options => options.MapFrom(
                    asset => asset.Status.ToString()));

        CreateMap<CreateAssetDto, Asset>();
        CreateMap<UpdateAssetDto, Asset>();
    }
}
