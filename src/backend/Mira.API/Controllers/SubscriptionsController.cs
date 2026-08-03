using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Mira.Contracts.Models.Subscription;
using Mira.Domain.Entities;
using Mira.Domain.Enums;
using Mira.Infrastructure.Repositories;
using System.Security.Claims;


namespace Mira.API.Controllers
{
    [ApiController]
    [Route("api/subscriptions")]
    public class SubscriptionsController : ControllerBase
    {
        private readonly ISubscriptionRepository _subscriptionRepository;
        private readonly IContractRepository _contractRepository;
        private readonly IMapper _mapper;

        public SubscriptionsController(
            ISubscriptionRepository subscriptionRepository,
            IContractRepository contractRepository,
            IMapper mapper)
        {
            _subscriptionRepository = subscriptionRepository;
            _contractRepository = contractRepository;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<SubscriptionSummaryDto>>> GetSubscriptions([FromQuery] bool includeArchived = false)
        {
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(userIdValue, out var userId))
            {
                return Unauthorized();
            }

            var subscriptions = await _subscriptionRepository.GetSubscriptionsAsync(userId, includeArchived);

            var subscriptionDtos = _mapper.Map<IEnumerable<SubscriptionSummaryDto>>(subscriptions);

            return Ok(subscriptionDtos);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<SubscriptionDetailDto>> GetSubscription(Guid id)
        {
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(userIdValue, out var userId))
            {
                return Unauthorized();
            }

            var subscription = await _subscriptionRepository.GetSubscriptionAsync(userId, id);

            if (subscription is null)
            {
                return NotFound();
            }

            var subscriptionDto = _mapper.Map<SubscriptionDetailDto>(subscription);

            return Ok(subscriptionDto);
        }

        [HttpPost]
        public async Task<ActionResult<SubscriptionDetailDto>> CreateSubscription(CreateSubscriptionDto createSubscriptionDto)
        {
            var userIdValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(userIdValue, out var userId))
            {
                return Unauthorized();
            }

            if (createSubscriptionDto.ContractId.HasValue)
            {
                var contractExists = await _contractRepository.ContractExistsAsync(
                    userId,
                    createSubscriptionDto.ContractId.Value);

                if (!contractExists)
                {
                    return BadRequest(
                        "Het opgegeven contract bestaat niet.");
                }
            }

            var subscription = _mapper.Map<Subscription>(createSubscriptionDto);

            subscription.UserId = userId;

            _subscriptionRepository.AddSubscription(subscription);

            var wasSaved = await _subscriptionRepository.SaveChangesAsync();

            if (!wasSaved)
            {
                return Problem(
                detail: "Het abonnement kon niet worden opgeslagen.");
            }

            var createdSubscriptionDto = _mapper.Map<SubscriptionDetailDto>(subscription);

            return CreatedAtAction(nameof(GetSubscription), new { id = subscription.Id }, createdSubscriptionDto);
        }

        [HttpPut("{id:guid}")]
        public async Task<ActionResult<SubscriptionDetailDto>> UpdateSubscription(Guid id, UpdateSubscriptionDto updateSubscriptionDto)
        {
            var userIdValue =
                User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(userIdValue, out var userId))
            {
                return Unauthorized();
            }

            var subscription =
                await _subscriptionRepository.GetSubscriptionAsync(userId, id);

            if (subscription is null)
            {
                return NotFound();
            }

            if (updateSubscriptionDto.ContractId.HasValue)
            {
                var contractExists =
                    await _contractRepository.ContractExistsAsync(
                        userId,
                        updateSubscriptionDto.ContractId.Value);

                if (!contractExists)
                {
                    return BadRequest(
                        "Het opgegeven contract bestaat niet.");
                }
            }

            _mapper.Map(updateSubscriptionDto, subscription);

            subscription.UpdatedAt = DateTimeOffset.UtcNow;

            var wasSaved =
                await _subscriptionRepository.SaveChangesAsync();

            if (!wasSaved)
            {
                return Problem(
                    detail: "Het abonnement kon niet worden bijgewerkt.");
            }

            var updatedSubscriptionDto =
                _mapper.Map<SubscriptionDetailDto>(subscription);

            return Ok(updatedSubscriptionDto);
        }

        [HttpPatch("{id:guid}/archive")]
        public async Task<ActionResult<SubscriptionDetailDto>> ArchiveSubscription(Guid id)
        {
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(userIdValue, out var userId))
            {
                return Unauthorized();
            }

            var subscription = await _subscriptionRepository.GetSubscriptionAsync(userId, id);

            if (subscription is null)
            {
                return NotFound();
            }

            if (subscription.Status == ItemStatus.Archived)
            {
                var alreadyArchivedDto =
                    _mapper.Map<SubscriptionDetailDto>(subscription);

                return Ok(alreadyArchivedDto);
            }

            var archivedAt = DateTimeOffset.UtcNow;

            subscription.Status = ItemStatus.Archived;
            subscription.ArchivedAt = archivedAt;
            subscription.UpdatedAt = archivedAt;

            var wasSaved = await _subscriptionRepository.SaveChangesAsync();

            if (!wasSaved)
            {
                return Problem(
                    detail: "Het abonnement kon niet worden gearchiveerd.");
            }

            var archivedSubscriptionDto =
                _mapper.Map<SubscriptionDetailDto>(subscription);

            return Ok(archivedSubscriptionDto);
        }

        [HttpPatch("{id:guid}/restore")]
        public async Task<ActionResult<SubscriptionDetailDto>> RestoreSubscription(Guid id)
        {
            var userIdValue =
                User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(userIdValue, out var userId))
            {
                return Unauthorized();
            }

            var subscription =
                await _subscriptionRepository.GetSubscriptionAsync(userId, id);

            if (subscription is null)
            {
                return NotFound();
            }

            if (subscription.Status != ItemStatus.Archived)
            {
                var alreadyRestoredDto =
                    _mapper.Map<SubscriptionDetailDto>(subscription);

                return Ok(alreadyRestoredDto);
            }

            subscription.Status = ItemStatus.Active;
            subscription.ArchivedAt = null;
            subscription.UpdatedAt = DateTimeOffset.UtcNow;

            var wasSaved =
                await _subscriptionRepository.SaveChangesAsync();

            if (!wasSaved)
            {
                return Problem(
                    detail: "Het abonnement kon niet worden hersteld.");
            }

            var restoredSubscriptionDto =
                _mapper.Map<SubscriptionDetailDto>(subscription);

            return Ok(restoredSubscriptionDto);
        }
    }
}
