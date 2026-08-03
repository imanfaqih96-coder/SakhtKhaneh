using SakhtKhaneh.Models.Blog;
using SakhtKhaneh.Models.Journals;
using SakhtKhaneh.Models.Messages;
using SakhtKhaneh.Models.Projects;
using SakhtKhaneh.Models.Services;
using SakhtKhaneh.Models.Template.ViewModels;

public interface ITemplateDataManagementService
{
    Task<List<TemplateMenuItem>> GetMainMenuItems();
    Task<string> GetTemplateField(string pathName, string fieldName);
    Task<ContactDataViewModel> GetContacts();
    Task<List<SliderItem>> GetSliderItems();
    Task<AboutSectionInfoViewModel?> GetAboutSectionInfo();
    Task<List<Project>> GetHomeViewProjects();
    Task<List<Service>> GetHomeServices();
    Task<List<BlogPost>> GetHomePosts();
    Task<List<Journal>> GetHomeJournals();
    Task<HomeDataViewModel> GetHomeData();
    Task<List<BlogPost>> GetBlogGridPosts();
    Task<BlogPost?> GetSingleBlogItem(string pathName);
    Task<BlogCategoryPageViewModel?> GetBlogPostsByCategory(string slug);
    Task<List<Project>> GetProjectsGridItems();
    Task<ProjectCategoryPageViewModel?> GetProjectsByCategory(string slug);
    Task<Project?> GetSingleProjectItem(string pathName);
    Task<List<Journal>> GetJournalGridItems();
    Task<Journal?> GetSingleJournalItem(string pathName);
    Task<bool> SendMessageForContacts(MessageDto data);
    Task<List<Service>> GetServices();
}
