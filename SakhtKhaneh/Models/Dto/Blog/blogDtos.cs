using SakhtKhaneh.Models.Blog;

namespace SakhtKhaneh.Models.Dto.Blog;

public class BlogPostCoreDto
{
    public Guid? id { get; set; }
    public string endpointPath { get; set; } = string.Empty;
    public int categoryId { get; set; }
    public string title { get; set; } = string.Empty;
    public string description { get; set; } = string.Empty;
    public string author { get; set; } = string.Empty;
    public string imageUrl { get; set; } = string.Empty;
    public DateTime? creationDate { get; set; }
    public DateTime? lastUpdateDate { get; set; }
    public string content { get; set; } = string.Empty;
    public string? tags { get; set; }
    public string? seoTitle { get; set; }
    public string? metaDescription { get; set; }
    public string? imageAlt { get; set; }
    public BlogCategory? category { get; set; }
}

public class BlogCategoryCoreDto
{
    public int? id { get; set; }
    public int? parentId { get; set; }
    public string title { get; set; } = string.Empty;
    public string slug { get; set; } = string.Empty;
    public int sortOrder { get; set; }
    public bool isVisible { get; set; } = true;
}

public class BlogCategoryTreeDto : BlogCategoryCoreDto
{
    public int postCount { get; set; }
    public List<BlogCategoryTreeDto> children { get; set; } = new();
}
