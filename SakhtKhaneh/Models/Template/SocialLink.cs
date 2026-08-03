namespace SakhtKhaneh.Models.Template;

public sealed class SocialLink
{
    public Guid Id { get; set; }
    public string Platform { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string? Username { get; set; }
    public string? IconName { get; set; }
    public int SortOrder { get; set; }
    public bool IsVisible { get; set; } = true;
}

public sealed class SocialLinkDto
{
    public Guid? Id { get; set; }
    public string Platform { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string? Username { get; set; }
    public string? IconName { get; set; }
    public int SortOrder { get; set; }
    public bool IsVisible { get; set; } = true;
}
