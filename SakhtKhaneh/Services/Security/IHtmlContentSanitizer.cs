namespace SakhtKhaneh.Services.Security;

public interface IHtmlContentSanitizer
{
    string Sanitize(string? html);
}
