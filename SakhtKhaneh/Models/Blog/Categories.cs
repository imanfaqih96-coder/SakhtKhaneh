using System.Text.Json.Serialization;

namespace SakhtKhaneh.Models.Blog;

public class BlogCategory
{
    public int Id { get; set; }
    public int? ParentId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsVisible { get; set; } = true;

    [JsonIgnore]
    public BlogCategory? Parent { get; set; }

    [JsonIgnore]
    public List<BlogCategory> Children { get; set; } = new();
}
