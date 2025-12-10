using Microsoft.AspNetCore.Mvc;
using SakhtKhaneh.Data;
using SakhtKhaneh.Models.Template.ViewModels;
using SakhtKhaneh.Services;
using System.Threading.Tasks;

namespace SakhtKhaneh.Controllers
{
    public class PublicController : Controller
    {
        public TemplateDataManagementService _templateDataManagementService;
        public PublicController(IServiceScopeFactory scopeFactory)
        {
            using (var scope = scopeFactory.CreateScope())
            {
                var templateDataManagementService = scope.ServiceProvider.GetRequiredService<TemplateDataManagementService>();
                _templateDataManagementService = templateDataManagementService;
            }
        }
        public async Task<IActionResult> Index()
        {
            var sliderItems = await _templateDataManagementService.GetSliderItems();

            var aboutInfo = await _templateDataManagementService.GetAboutSectionInfo();

            var homeProjects = await _templateDataManagementService.GetHomeViewProjects();

            var model = new HomeDataViewModel
            {
                Slider = sliderItems,
                AboutInfo = aboutInfo,
                Projects = homeProjects
            };

            return View(model);
        }

        public IActionResult CommingSoon()
        {
            return View();
        }
    }
}
