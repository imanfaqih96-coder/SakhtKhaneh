using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SakhtKhaneh.Models.Messages;

namespace SakhtKhaneh.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SmsController : ControllerBase
    {
        private string API_KEY = "6Q2ed8peysii7PoP9kv15JejTgspMZ9ygWHVbdZyDu0xuaXt";
        private string USERNAME = "9124058249";
        private string LINE_NUMBER = "30002108014870";

        [HttpPost("Send")]
        public async Task<IActionResult> SendSms(SendSmsModel model)
        {
            try
            {
                HttpClient httpClient = new HttpClient();
                var raw_response = await httpClient.GetAsync(
                "https://api.sms.ir/v1/send?" + 
                "username=" + USERNAME + 
                "&password=" + API_KEY + 
                "&mobile=" + model.Target + 
                "&line=" + LINE_NUMBER +
                "&text=" + model.Message
                );
                var result = await raw_response.Content.ReadAsStringAsync();

                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
