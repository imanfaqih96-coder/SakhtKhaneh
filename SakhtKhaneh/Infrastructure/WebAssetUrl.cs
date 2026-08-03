namespace SakhtKhaneh.Infrastructure;

public static class WebAssetUrl
{
    private const string LegacyHttpOrigin = "http://sakhtekhaneh.ir";
    private const string SecureOrigin = "https://sakhtekhaneh.ir";

    public static string Normalize(string? value, string fallback = "")
    {
        if (string.IsNullOrWhiteSpace(value))
            return fallback;

        return value.Trim().Replace(LegacyHttpOrigin, SecureOrigin, StringComparison.OrdinalIgnoreCase);
    }

    public static string Absolute(string? value, string siteBaseUrl, string fallback = "/assets/img/banner.jpg")
    {
        var normalized = Normalize(value, fallback);
        return normalized.StartsWith("http", StringComparison.OrdinalIgnoreCase)
            ? normalized
            : $"{siteBaseUrl.TrimEnd('/')}/{normalized.TrimStart('/')}";
    }
}
