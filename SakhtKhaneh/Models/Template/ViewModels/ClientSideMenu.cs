using SakhtKhaneh.Models.Blog;
using SakhtKhaneh.Models.Journals;
using SakhtKhaneh.Models.Projects;
using SakhtKhaneh.Models.Services;
using SakhtKhaneh.Models.Template;

namespace SakhtKhaneh.Models.Template.ViewModels;

public class TemplateMenuItem
{
    public string Path { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public List<TemplateMenuItem>? Children { get; set; }
}


public sealed class MenuTreeRenderModel
{
    public IReadOnlyList<TemplateMenuItem> Items { get; set; } = Array.Empty<TemplateMenuItem>();
    public bool IsMobile { get; set; }
    public int Level { get; set; }
    public string CurrentPath { get; set; } = "/";
}

public class SliderItem
{
    public string ImageUrl { get; set; } = string.Empty;
}

public class AboutSectionInfoViewModel
{
    public string title { get; set; } = string.Empty;
    public string content { get; set; } = string.Empty;
    public string imageUrl { get; set; } = string.Empty;
}

public class HomeDataViewModel
{
    public List<SliderItem> Slider { get; set; } = new();
    public AboutSectionInfoViewModel? AboutInfo { get; set; }
    public List<Project> Projects { get; set; } = new();
    public List<Service> Services { get; set; } = new();
    public List<BlogPost> Posts { get; set; } = new();
    public List<Journal> Journals { get; set; } = new();
}

public class ContactDataViewModel
{
    public string Description { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public List<SocialLink> SocialLinks { get; set; } = new();
    public List<TemplateMenuItem> ProjectCategories { get; set; } = new();
}

public sealed class ProjectCategoryPageViewModel
{
    public ProjectCategoryDto Category { get; set; } = new();
    public List<Project> Projects { get; set; } = new();
}

public sealed class BlogCategoryPageViewModel
{
    public BlogCategory Category { get; set; } = new();
    public List<BlogPost> Posts { get; set; } = new();
}
