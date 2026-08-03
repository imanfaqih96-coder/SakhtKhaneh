using System.Text.RegularExpressions;

namespace SakhtKhaneh.Services.Security;

/// <summary>
/// A dependency-free defensive sanitizer for trusted-editor HTML.
/// It removes executable elements, event attributes and dangerous URL schemes
/// while preserving the formatting tags and Bootstrap classes used by existing content.
/// </summary>
public sealed partial class HtmlContentSanitizer : IHtmlContentSanitizer
{
    private static readonly string[] DangerousTags =
    {
        "script", "style", "iframe", "object", "embed", "applet", "form", "input",
        "button", "textarea", "select", "option", "meta", "link", "base", "svg", "math"
    };

    public string Sanitize(string? html)
    {
        if (string.IsNullOrWhiteSpace(html))
            return string.Empty;

        var result = CommentRegex().Replace(html, string.Empty);

        foreach (var tag in DangerousTags)
        {
            result = Regex.Replace(
                result,
                $@"<\s*{tag}\b[^>]*>.*?<\s*/\s*{tag}\s*>",
                string.Empty,
                RegexOptions.IgnoreCase | RegexOptions.Singleline);

            result = Regex.Replace(
                result,
                $@"<\s*/?\s*{tag}\b[^>]*>",
                string.Empty,
                RegexOptions.IgnoreCase | RegexOptions.Singleline);
        }

        result = EventAttributeRegex().Replace(result, string.Empty);
        result = DangerousUrlRegex().Replace(result, "$1=\"#\"");
        result = DangerousStyleRegex().Replace(result, string.Empty);

        return result.Trim();
    }

    [GeneratedRegex(@"<!--.*?-->", RegexOptions.Singleline)]
    private static partial Regex CommentRegex();

    [GeneratedRegex(@"\s+on[a-z0-9_-]+\s*=\s*(?:""[^""]*""|'[^']*'|[^\s>]+)", RegexOptions.IgnoreCase)]
    private static partial Regex EventAttributeRegex();

    [GeneratedRegex(@"\b(href|src)\s*=\s*[""']?\s*(?:javascript|vbscript|data\s*:\s*text/html)\s*:[^""'\s>]*[""']?", RegexOptions.IgnoreCase)]
    private static partial Regex DangerousUrlRegex();

    [GeneratedRegex(@"\s+style\s*=\s*[""'][^""']*(?:expression\s*\(|javascript\s*:|vbscript\s*:|behavior\s*:|-moz-binding)[^""']*[""']", RegexOptions.IgnoreCase)]
    private static partial Regex DangerousStyleRegex();
}
