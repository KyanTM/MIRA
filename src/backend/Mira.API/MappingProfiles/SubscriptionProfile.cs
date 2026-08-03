using AutoMapper;
using Mira.Contracts.Models.Subscription;
using Mira.Domain.Enums;
using SubscriptionEntity = Mira.Domain.Entities.Subscription;

namespace Mira.API.MappingProfiles;

public class SubscriptionProfile : Profile
{
    public SubscriptionProfile()
    {
        CreateMap<SubscriptionEntity, SubscriptionSummaryDto>()
            .ForCtorParam(
                nameof(SubscriptionSummaryDto.BillingFrequency),
                options => options.MapFrom(
                    subscription => subscription.BillingFrequency.ToString()))
            .ForCtorParam(
                nameof(SubscriptionSummaryDto.Status),
                options => options.MapFrom(
                    subscription => subscription.Status.ToString()));

        CreateMap<SubscriptionEntity, SubscriptionDetailDto>()
            .ForCtorParam(
                nameof(SubscriptionDetailDto.BillingFrequency),
                options => options.MapFrom(
                    subscription => subscription.BillingFrequency.ToString()))
            .ForCtorParam(
                nameof(SubscriptionDetailDto.Status),
                options => options.MapFrom(
                    subscription => subscription.Status.ToString()));

        CreateMap<CreateSubscriptionDto, SubscriptionEntity>()
            .ForMember(
                subscription => subscription.BillingFrequency,
                options => options.MapFrom(
                    dto => Enum.Parse<BillingFrequency>(
                        dto.BillingFrequency)));

        CreateMap<UpdateSubscriptionDto, SubscriptionEntity>()
            .ForMember(
                subscription => subscription.BillingFrequency,
                options => options.MapFrom(
                    dto => Enum.Parse<BillingFrequency>(
                        dto.BillingFrequency)));
    }
}
