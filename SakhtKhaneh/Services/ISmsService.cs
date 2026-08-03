namespace SakhtKhaneh.Services;

public interface ISmsService
{
    Task<bool> SendAsync(string target, string message, CancellationToken cancellationToken = default);
}
