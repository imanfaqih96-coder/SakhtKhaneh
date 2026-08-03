using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SakhtKhaneh.Models.Messages;
using SakhtKhaneh.Services;

namespace SakhtKhaneh.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = AdminSeedService.AdministratorRole)]
public class SmsController : ControllerBase
{
    private readonly ISmsService _smsService;

    public SmsController(ISmsService smsService)
    {
        _smsService = smsService;
    }

    [HttpPost("Send")]
    public async Task<IActionResult> SendSms([FromBody] SendSmsModel model, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(model.Target) || string.IsNullOrWhiteSpace(model.Message))
            return BadRequest();

        var success = await _smsService.SendAsync(model.Target.Trim(), model.Message.Trim(), cancellationToken);
        return success ? Ok() : StatusCode(StatusCodes.Status502BadGateway);
    }
}
