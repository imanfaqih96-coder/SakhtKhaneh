using SakhtKhaneh.Models.Blog;
using SakhtKhaneh.Models.Projects;
using SakhtKhaneh.Models.Services;

namespace SakhtKhaneh.Models.Template.ViewModels
{
    public class TemplateMenuItem
    {
        public string Path { get; set; }
        public string Title { get; set; }
        public List<TemplateMenuItem>? Children { get; set; }
    }

    public class SliderItem
    {
        public string ImageUrl { get; set; }
    }

    public class AboutSectionInfoViewModel
    {
        public string title { get; set; }
        public string content { get; set; }
        public string imageUrl { get; set; }
    }

    public class HomeDataViewModel
    {
        public List<SliderItem>? Slider { get; set; }
        public AboutSectionInfoViewModel? AboutInfo { get; set; }
        public List<Project>? Projects { get; set; }
        public List<Service> Services { get; set; }
        public List<BlogPost> Posts { get; set; }
    }

    public class ContactDataViewModel
    {
        public string Description { get; set; }
        public string Content { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
        public string Address { get; set; }
    }
}
