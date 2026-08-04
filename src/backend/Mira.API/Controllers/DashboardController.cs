using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Mira.API.MappingProfiles;
using Mira.Contracts.Models.Dashboard;
using Mira.Infrastructure.Repositories;

namespace Mira.API.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardRepository _dashboardRepository;
    private readonly TimeProvider _timeProvider;
    private readonly IMapper _mapper;

    public DashboardController(
        IDashboardRepository dashboardRepository,
        TimeProvider timeProvider,
        IMapper mapper)
    {
        _dashboardRepository = dashboardRepository;
        _timeProvider = timeProvider;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<DashboardDto>> GetDashboard(
        [FromQuery, Range(1, 365)] int horizonDays = 30,
        [FromQuery, Range(1, 20)] int recentItemCount = 5,
        CancellationToken cancellationToken = default)
    {
        if (!Guid.TryParse(
                User.FindFirstValue(ClaimTypes.NameIdentifier),
                out var userId))
        {
            return Unauthorized();
        }

        var generatedAt = _timeProvider.GetUtcNow();
        var today = DateOnly.FromDateTime(generatedAt.UtcDateTime);
        var snapshot = await _dashboardRepository.GetDashboardAsync(
            userId,
            today,
            horizonDays,
            recentItemCount,
            attentionItemCount: 12,
            cancellationToken);

        var dashboard = _mapper.Map<DashboardDto>(
            new DashboardMappingSource(
                generatedAt,
                today.AddDays(horizonDays),
                snapshot));

        return Ok(dashboard);
    }
}
