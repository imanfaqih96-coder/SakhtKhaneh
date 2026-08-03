namespace SakhtKhaneh.Models.ViewModels;

public sealed class PageHeroViewModel
{
    public string Title { get; init; } = string.Empty;
    public string? AccentTitle { get; init; }
    public string? Eyebrow { get; init; }
    public string? Description { get; init; }
    public string CurrentPageTitle { get; init; } = string.Empty;
    public string? ParentTitle { get; init; }
    public string? ParentUrl { get; init; }
    public string BackgroundImage { get; init; } = "/assets/img/banner.jpg";
    public bool Compact { get; init; }
}
