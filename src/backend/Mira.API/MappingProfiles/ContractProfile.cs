using AutoMapper;
using Mira.Contracts.Models.Contract;
using Mira.Domain.Enums;
using ContractEntity = Mira.Domain.Entities.Contract;

namespace Mira.API.MappingProfiles;

public class ContractProfile : Profile
{
    public ContractProfile()
    {
        CreateMap<ContractEntity, ContractSummaryDto>()
            .ForCtorParam(
                nameof(ContractSummaryDto.BillingFrequency),
                options => options.MapFrom(contract =>
                    contract.BillingFrequency.HasValue
                        ? contract.BillingFrequency.Value.ToString()
                        : null))
            .ForCtorParam(
                nameof(ContractSummaryDto.Status),
                options => options.MapFrom(
                    contract => contract.Status.ToString()));

        CreateMap<ContractEntity, ContractDetailDto>()
            .ForCtorParam(
                nameof(ContractDetailDto.BillingFrequency),
                options => options.MapFrom(contract =>
                    contract.BillingFrequency.HasValue
                        ? contract.BillingFrequency.Value.ToString()
                        : null))
            .ForCtorParam(
                nameof(ContractDetailDto.Status),
                options => options.MapFrom(
                    contract => contract.Status.ToString()));

        CreateMap<CreateContractDto, ContractEntity>()
            .ForMember(
                contract => contract.BillingFrequency,
                options => options.MapFrom(dto =>
                    string.IsNullOrWhiteSpace(dto.BillingFrequency)
                        ? (BillingFrequency?)null
                        : Enum.Parse<BillingFrequency>(dto.BillingFrequency)));

        CreateMap<UpdateContractDto, ContractEntity>()
            .ForMember(
                contract => contract.BillingFrequency,
                options => options.MapFrom(dto =>
                    string.IsNullOrWhiteSpace(dto.BillingFrequency)
                        ? (BillingFrequency?)null
                        : Enum.Parse<BillingFrequency>(dto.BillingFrequency)));
    }
}
