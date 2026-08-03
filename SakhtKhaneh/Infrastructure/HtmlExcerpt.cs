using System.Net;
using System.Text.RegularExpressions;

namespace SakhtKhaneh.Infrastructure;

public static partial class HtmlExcerpt
{
    public static string FirstParagraphs(string? html, int maximumParagraphs = 2)
    {
        if (string.IsNullOrWhiteSpace(html)) return string.Empty;

        var paragraphs = ParagraphRegex().Matches(html)
            .Select(match => match.Value.Trim())
            .Where(value => !string.IsNullOrWhiteSpace(StripTags(value)))
            .Take(Math.Max(1, maximumParagraphs))
            .ToArray();

        if (paragraphs.Length > 0)
            return string.Join(Environment.NewLine, paragraphs);

        var plain = WebUtility.HtmlDecode(StripTags(html)).Trim();
        if (plain.Length <= 420)
            return $"<p>{WebUtility.HtmlEncode(plain)}</p>";

        var cutoff = plain.LastIndexOf(' ', 420);
        if (cutoff < 240) cutoff = 420;
        return $"<p>{WebUtility.HtmlEncode(plain[..cutoff].Trim())}…</p>";
    }

    private static string StripTags(string value) => TagRegex().Replace(value, " ");

    [GeneratedRegex(@"<p\b[^>]*>.*?</p>", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
    private static partial Regex ParagraphRegex();

    [GeneratedRegex("<[^>]+>", RegexOptions.Singleline)]
    private static partial Regex TagRegex();
}
