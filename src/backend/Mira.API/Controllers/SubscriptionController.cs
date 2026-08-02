using Microsoft.AspNetCore.Mvc;
using Mira.Domain.Entities;
using Mira.Infrastructure.Repositories;
using System.Security.Claims;
using Mira.Contracts.Models.Subscription;
using AutoMapper;


namespace Mira.API.Controllers
{
    [ApiController]
    [Route("/api/subscription")]
    public class SubscriptionController : Controller
    {
        private readonly ISubscriptionRepository _subscriptionRepository;
        private readonly IMapper _mapper;

        public SubscriptionController(ISubscriptionRepository subscriptionRepository, IMapper mapper)
        {
            _subscriptionRepository = subscriptionRepository;
            _mapper = mapper;
        }

        public async Task<ActionResult<IEnumerable<SubscriptionSummaryDto>>> GetSubscriptions([FromQuery] bool includeArchived = false)
        {
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(userIdValue, out var userId)) {
                return Unauthorized();
            }

            var subscriptions = await _subscriptionRepository.GetSubscriptionsAsync(userId, includeArchived);
            
            var subscriptionDtos = _mapper.Map<IEnumerable<SubscriptionSummaryDto>>(subscriptions);

            return Ok(subscriptionDtos);
        }

        public async Task<ActionResult<SubscriptionDetailDto>> GetSubscription(Guid id)
        {
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(userIdValue, out var userId))
            {
                return Unauthorized();
            }

            var subscription = _subscriptionRepository.GetSubscriptionAsync(userId, id);

            if (subscription is null)
            {
                return NotFound();
            }

            var subscriptionDto = _mapper.Map<SubscriptionDetailDto>(subscription);

            return Ok(subscriptionDto);
        }
        
            
        }
    }

