using SakhtKhaneh.Models.Blog;

namespace SakhtKhaneh.Models.Dto.Blog
{
    public class BlogPostCoreDto
    {
        public Guid? id { get; set; }
        public string endpointPath { get; set; }
        public int categoryId { get; set; }
        public string title { get; set; }
        public string description { get; set; }
        public string author { get; set; }
        public string imageUrl { get; set; }
        public DateTime? creationDate { get; set; }
        public DateTime? lastUpdateDate { get; set; }
        public string content { get; set; }
        public BlogCategory? category { get; set; }
    }

    public class BlogCategoryCoreDto
    {
        public int? id { get; set; }
        public string title { get; set; }
    }

}
