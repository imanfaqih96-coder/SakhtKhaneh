using System.ComponentModel.DataAnnotations.Schema;

namespace SakhtKhaneh.Models.Projects
{
    public class Project
    {
        public Project()
        {
            Gallery = null;
        }
        public Guid Id { get; set; }
        public string Endpoint_Path { get; set; }
        public string CoverImageUrl { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Location { get; set; }
        public string? Owner { get; set; }
        public string Content { get; set; }
        public List<ProjectGalleryItem>? Gallery { get; set; }
    }
    public class ProjectGalleryItem
    {
        public Guid Id { get; set; }
        [ForeignKey("Id")]
        public Guid ProjectId { get; set; }
        public string ImageUrl { get; set; }
    }
}
