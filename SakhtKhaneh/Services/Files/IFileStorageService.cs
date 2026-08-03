namespace SakhtKhaneh.Services.Files;

public interface IFileStorageService
{
    Task<string> SaveImageAsync(IFormFile file, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<string>> SaveImagesAsync(IEnumerable<IFormFile> files, CancellationToken cancellationToken = default);
}
