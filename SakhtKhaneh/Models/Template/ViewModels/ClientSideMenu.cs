using SakhtKhaneh.Models.Projects;

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
        public List<SliderItem> Slider { get; set; }
        public AboutSectionInfoViewModel? AboutInfo { get; set; }
        public List<Project>? Projects { get; set; }
    }
}
