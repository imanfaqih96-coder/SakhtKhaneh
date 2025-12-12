using Microsoft.AspNetCore.Mvc;
using SakhtKhaneh.Data;
using SakhtKhaneh.Models.Template.ViewModels;
using SakhtKhaneh.Services;
using System.Threading.Tasks;

namespace SakhtKhaneh.Controllers
{
    public class PublicController : Controller
    {
        public ITemplateDataManagementService _templateDataManagementService;
        public PublicController(ITemplateDataManagementService templateDataManagementService)
        {
            _templateDataManagementService = templateDataManagementService;
        }
        public async Task<IActionResult> Index()
        {
            var model = await _templateDataManagementService.GetHomeData();
            return View(model);
        }
        public async Task<IActionResult> About()
        {
            var model = await _templateDataManagementService.GetAboutSectionInfo();
            return View(model);
        }
        public async Task<IActionResult> Contacts()
        {
            var model = await _templateDataManagementService.GetContacts();
            return View(model);
        }
        [Route("Blog")]
        public async Task<IActionResult> Blog()
        {
            var model = await _templateDataManagementService.GetBlogGridPosts();
            return View("Blog", model);
        }
        [Route("Blog/{pathName}")]
        public async Task<IActionResult> Blog(string? pathName)
        {
            if (pathName != null)
            {
                var model = await _templateDataManagementService.GetSingleBlogItem(pathName);
                return View("_SingleBlogPage", model);
            }
            else
            {
                var model = await _templateDataManagementService.GetBlogGridPosts();
                return View("Blog", model);
            }
        }
        [Route("Projects")]
        public async Task<IActionResult> Projects()
        {
            var model = await _templateDataManagementService.GetProjectsGridItems();
            return View("Projects", model);
        }
        [Route("Projects/{pathName}")]
        public async Task<IActionResult> Projects(string? pathName)
        {
            if (pathName != null)
            {
                var model = await _templateDataManagementService.GetSingleProjectItem(pathName);
                return View("_SingleProjectPage", model);
            }
            else
            {
                var model = await _templateDataManagementService.GetProjectsGridItems();
                return View("Projects", model);
            }
        }
        public IActionResult CommingSoon()
        {
            return View();
        }
    }
}
