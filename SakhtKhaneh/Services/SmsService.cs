using System.Net.Http.Json;

namespace SakhtKhaneh.Services;

public sealed class SmsService : ISmsService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmsService> _logger;

    public SmsService(HttpClient httpClient, IConfiguration configuration, ILogger<SmsService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<bool> SendAsync(string target, string message, CancellationToken cancellationToken = default)
    {
        var apiKey = _configuration["Sms:ApiKey"];
        var username = _configuration["Sms:Username"];
        var lineNumber = _configuration["Sms:LineNumber"];
        var endpoint = _configuration["Sms:Endpoint"] ?? "https://api.sms.ir/v1/send";

        if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(lineNumber))
        {
            _logger.LogWarning("SMS settings are missing. The contact message was stored but no SMS was sent.");
            return false;
        }

        try
        {
            // Keep provider compatibility while preventing credentials from being exposed by a public controller.
            var url = $"{endpoint}?username={Uri.EscapeDataString(username)}" +
                      $"&password={Uri.EscapeDataString(apiKey)}" +
                      $"&mobile={Uri.EscapeDataString(target)}" +
                      $"&line={Uri.EscapeDataString(lineNumber)}" +
                      $"&text={Uri.EscapeDataString(message)}";

            using var response = await _httpClient.GetAsync(url, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("SMS provider returned {StatusCode}", response.StatusCode);
                return false;
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SMS sending failed.");
            return false;
        }
    }
}
