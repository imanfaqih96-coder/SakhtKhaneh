namespace SakhtKhaneh.Models.Blog;

public class BlogPost
{
    public Guid Id { get; set; }
    public int CategoryId { get; set; }
    public string EndpointPath { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Author { get; set; } = "حسین کنعانی";
    public string ImageUrl { get; set; } = string.Empty;
    public DateTime CreationDate { get; set; }
    public DateTime? LastUpdateDate { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? Tags { get; set; }
    public string? SeoTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? ImageAlt { get; set; }
    public BlogCategory Category { get; set; } = null!;
}
