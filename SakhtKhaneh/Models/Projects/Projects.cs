namespace SakhtKhaneh.Models.Projects;

public enum ProjectStatus
{
    InDesign = 0,
    UnderConstruction = 1,
    Completed = 2
}

public class Project
{
    public Guid Id { get; set; }
    public string Endpoint_Path { get; set; } = string.Empty;
    public string CoverImageUrl { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Time { get; set; }
    public string? Location { get; set; }
    public string? Owner { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? SeoTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? CoverImageAlt { get; set; }
    public Guid? CategoryId { get; set; }
    public ProjectCategory? Category { get; set; }
    public ProjectStatus Status { get; set; } = ProjectStatus.Completed;
    public List<ProjectGalleryItem>? Gallery { get; set; }
}

public class ProjectGalleryItem
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
}

public class ProjectCoreDto
{
    public Guid? id { get; set; }
    public string endpoint_Path { get; set; } = string.Empty;
    public string coverImageUrl { get; set; } = string.Empty;
    public string title { get; set; } = string.Empty;
    public string? description { get; set; }
    public string? time { get; set; }
    public string? location { get; set; }
    public string? owner { get; set; }
    public string content { get; set; } = string.Empty;
    public string? seoTitle { get; set; }
    public string? metaDescription { get; set; }
    public string? coverImageAlt { get; set; }
    public Guid? categoryId { get; set; }
    public ProjectStatus status { get; set; } = ProjectStatus.Completed;
    public List<ProjectGalleryItemDto>? gallery { get; set; }
}

public class ProjectGalleryItemDto
{
    public string url { get; set; } = string.Empty;
}
