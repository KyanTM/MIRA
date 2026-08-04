using AutoMapper;
using Mira.Contracts.Models.Dashboard;
using Mira.Infrastructure.Repositories;

namespace Mira.API.MappingProfiles;

public class DashboardProfile : Profile
{
    public DashboardProfile()
    {
        CreateMap<DashboardCounts, DashboardCountsDto>();
        CreateMap<DashboardRecentItem, DashboardRecentItemDto>();
        CreateMap<DashboardAttentionItem, DashboardAttentionItemDto>();

        CreateMap<DashboardMappingSource, DashboardDto>()
            .ForCtorParam(
                nameof(DashboardDto.Counts),
                options => options.MapFrom(
                    source => source.Snapshot.Counts))
            .ForCtorParam(
                nameof(DashboardDto.RecentItems),
                options => options.MapFrom(
                    source => source.Snapshot.RecentItems))
            .ForCtorParam(
                nameof(DashboardDto.AttentionItems),
                options => options.MapFrom(
                    source => source.Snapshot.AttentionItems));
    }
}

public sealed record DashboardMappingSource(
    DateTimeOffset GeneratedAt,
    DateOnly AttentionThrough,
    DashboardSnapshot Snapshot);
