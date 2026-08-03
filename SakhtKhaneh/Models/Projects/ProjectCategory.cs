using System.Text.Json.Serialization;

namespace SakhtKhaneh.Models.Projects;

public sealed class ProjectCategory
{
    public Guid Id { get; set; }
    public Guid? ParentId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsVisible { get; set; } = true;

    [JsonIgnore]
    public ProjectCategory? Parent { get; set; }

    [JsonIgnore]
    public List<ProjectCategory> Children { get; set; } = new();

    [JsonIgnore]
    public List<Project> Projects { get; set; } = new();
}

public sealed class ProjectCategoryDto
{
    public Guid? Id { get; set; }
    public Guid? ParentId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsVisible { get; set; } = true;
    public int ProjectCount { get; set; }
    public List<ProjectCategoryDto> Children { get; set; } = new();
}
