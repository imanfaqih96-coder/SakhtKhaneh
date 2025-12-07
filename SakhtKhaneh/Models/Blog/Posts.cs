namespace SakhtKhaneh.Models.Blog
{
    public class BlogPost
    {
        public Guid Id { get; set;  }
        public int CategoryId { get; set;  }
        public string EndpointPath { get; set; }
        public string Title { get; set; } 
        public string Description { get; set; }
        public string Author { get; set; }
        public string ImageUrl { get; set;  }
        public DateTime CreationDate { get; set; }
        public DateTime? LastUpdateDate { get; set; }
        public string Content { get; set; }
        public BlogCategory Category { get; set;  }
    }
}
