using System.Net;
using System.Net.Http.Json;
using SakhtKhaneh.Models.GeoLocation;

namespace SakhtKhaneh.Services;

public sealed class IpGeolocationService : IIpGeolocationService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<IpGeolocationService> _logger;

    public IpGeolocationService(HttpClient httpClient, IConfiguration configuration, ILogger<IpGeolocationService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<Geo?> ResolveAsync(string? ipAddress, CancellationToken cancellationToken = default)
    {
        var apiKey = _configuration["Geolocation:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(ipAddress))
            return null;

        if (!IPAddress.TryParse(ipAddress, out var ip) || IPAddress.IsLoopback(ip))
            return null;

        try
        {
            var endpoint = $"https://api.ipgeolocation.io/v2/ipgeo?apiKey={Uri.EscapeDataString(apiKey)}&ip={Uri.EscapeDataString(ipAddress)}";
            return await _httpClient.GetFromJsonAsync<Geo>(endpoint, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "IP geolocation lookup failed for {IpAddress}", ipAddress);
            return null;
        }
    }
}
