using SakhtKhaneh.Models.Blog;
using SakhtKhaneh.Models.Projects;
using SakhtKhaneh.Models.Services;
using SakhtKhaneh.Models.Template.ViewModels;

public interface ITemplateDataManagementService
{
    Task<List<TemplateMenuItem>?> GetMainMenuItems();
    Task<string> GetTemplateField(string pathName, string fieldName);
    Task<ContactDataViewModel> GetContacts();

    Task<List<SliderItem>?> GetSliderItems();
    Task<AboutSectionInfoViewModel?> GetAboutSectionInfo();
    Task<List<Project>> GetHomeViewProjects();
    Task<List<Service>?> GetHomeServices();
    Task<List<BlogPost>?> GetHomePosts();
    Task<HomeDataViewModel> GetHomeData();
    Task<List<BlogPost>?> GetBlogGridPosts();
    Task<BlogPost?> GetSingleBlogItem(string pathName);
    Task<List<Project>?> GetProjectsGridItems();
    Task<Project?> GetSingleProjectItem(string pathName);
}