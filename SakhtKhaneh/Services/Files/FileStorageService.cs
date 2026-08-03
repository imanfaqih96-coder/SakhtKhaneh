using System.Buffers;

namespace SakhtKhaneh.Services.Files;

public sealed class FileStorageService : IFileStorageService
{
    private const long MaxFileSize = 10 * 1024 * 1024;
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp"
    };

    private readonly IWebHostEnvironment _environment;

    public FileStorageService(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public async Task<string> SaveImageAsync(IFormFile file, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(file);

        if (file.Length <= 0)
            throw new InvalidOperationException("فایل خالی است.");

        if (file.Length > MaxFileSize)
            throw new InvalidOperationException("حجم هر تصویر نباید بیشتر از ۱۰ مگابایت باشد.");

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
            throw new InvalidOperationException("فرمت تصویر مجاز نیست. فقط JPG، PNG و WEBP قابل قبول است.");

        if (!await HasValidSignatureAsync(file, extension, cancellationToken))
            throw new InvalidOperationException("ساختار واقعی فایل با فرمت اعلام‌شده مطابقت ندارد.");

        var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var uploadDirectory = Path.Combine(webRoot, "uploads");
        Directory.CreateDirectory(uploadDirectory);

        var fileName = $"{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(uploadDirectory, fileName);

        await using var stream = new FileStream(
            filePath,
            FileMode.CreateNew,
            FileAccess.Write,
            FileShare.None,
            81920,
            FileOptions.Asynchronous | FileOptions.SequentialScan);

        await file.CopyToAsync(stream, cancellationToken);

        // Relative URLs remain valid after domain, protocol or server changes.
        return $"/uploads/{fileName}";
    }

    public async Task<IReadOnlyList<string>> SaveImagesAsync(
        IEnumerable<IFormFile> files,
        CancellationToken cancellationToken = default)
    {
        var fileList = files.Where(f => f is { Length: > 0 }).Take(30).ToList();
        if (fileList.Count == 0)
            throw new InvalidOperationException("هیچ تصویر معتبری ارسال نشده است.");

        var result = new List<string>(fileList.Count);
        try
        {
            foreach (var file in fileList)
                result.Add(await SaveImageAsync(file, cancellationToken));

            return result;
        }
        catch
        {
            var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
            foreach (var url in result)
            {
                var fileName = Path.GetFileName(url);
                var path = Path.Combine(webRoot, "uploads", fileName);
                if (File.Exists(path))
                    File.Delete(path);
            }

            throw;
        }
    }

    private static async Task<bool> HasValidSignatureAsync(
        IFormFile file,
        string extension,
        CancellationToken cancellationToken)
    {
        var buffer = ArrayPool<byte>.Shared.Rent(16);
        try
        {
            await using var stream = file.OpenReadStream();
            var read = await stream.ReadAsync(buffer.AsMemory(0, 16), cancellationToken);
            if (read < 4)
                return false;

            return extension switch
            {
                ".jpg" or ".jpeg" => buffer[0] == 0xFF && buffer[1] == 0xD8 && buffer[2] == 0xFF,
                ".png" => read >= 8 && buffer[0] == 0x89 && buffer[1] == 0x50 && buffer[2] == 0x4E && buffer[3] == 0x47
                          && buffer[4] == 0x0D && buffer[5] == 0x0A && buffer[6] == 0x1A && buffer[7] == 0x0A,
                ".webp" => read >= 12 && buffer[0] == (byte)'R' && buffer[1] == (byte)'I' && buffer[2] == (byte)'F'
                           && buffer[3] == (byte)'F' && buffer[8] == (byte)'W' && buffer[9] == (byte)'E'
                           && buffer[10] == (byte)'B' && buffer[11] == (byte)'P',
                _ => false
            };
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(buffer);
        }
    }
}
