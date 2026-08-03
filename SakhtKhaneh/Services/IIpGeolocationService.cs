using SakhtKhaneh.Models.GeoLocation;

namespace SakhtKhaneh.Services;

public interface IIpGeolocationService
{
    Task<Geo?> ResolveAsync(string? ipAddress, CancellationToken cancellationToken = default);
}
