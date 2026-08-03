using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using SakhtKhaneh.Services;

namespace SakhtKhaneh.Controllers;

public class PublicController : Controller
{
    private readonly ITemplateDataManagementService _templateDataManagementService;

    public PublicController(ITemplateDataManagementService templateDataManagementService)
    {
        _templateDataManagementService = templateDataManagementService;
    }

    [HttpGet("/")]
    [OutputCache(Duration = 1800)]
    public async Task<IActionResult> Index()
    {
        var model = await _templateDataManagementService.GetHomeData();
        return View(model);
    }

    [HttpGet("/Public/Index")]
    [HttpGet("/Public")]
    public IActionResult LegacyIndex() => RedirectPermanent("/");

    [HttpGet("/Public/About")]
    [OutputCache(Duration = 600)]
    public async Task<IActionResult> About()
    {
        var model = await _templateDataManagementService.GetAboutSectionInfo();
        return View(model);
    }

    [HttpGet("/Public/Contacts")]
    [OutputCache(Duration = 300)]
    public async Task<IActionResult> Contacts()
    {
        var model = await _templateDataManagementService.GetContacts();
        return View(model);
    }

    [HttpGet("/Blog")]
    [OutputCache(Duration = 300)]
    public async Task<IActionResult> Blog()
    {
        var model = await _templateDataManagementService.GetBlogGridPosts();
        return View("Blog", model);
    }

    [HttpGet("/Blog/Category/{slug}")]
    [OutputCache(Duration = 300)]
    public async Task<IActionResult> BlogCategory(string slug)
    {
        var model = await _templateDataManagementService.GetBlogPostsByCategory(slug);
        return model is null ? NotFound() : View("BlogCategory", model);
    }

    [HttpGet("/Blog/{pathName}")]
    [OutputCache(Duration = 300)]
    public async Task<IActionResult> Blog(string pathName)
    {
        var model = await _templateDataManagementService.GetSingleBlogItem(pathName);
        return model is null ? NotFound() : View("_SingleBlogPage", model);
    }

    [HttpGet("/Projects")]
    [OutputCache(Duration = 300)]
    public async Task<IActionResult> Projects()
    {
        var model = await _templateDataManagementService.GetProjectsGridItems();
        return View("Projects", model);
    }

    [HttpGet("/Projects/Category/{slug}")]
    [OutputCache(Duration = 300)]
    public async Task<IActionResult> ProjectCategory(string slug)
    {
        var model = await _templateDataManagementService.GetProjectsByCategory(slug);
        return model is null ? NotFound() : View("ProjectCategory", model);
    }

    [HttpGet("/Projects/{pathName}")]
    [OutputCache(Duration = 300)]
    public async Task<IActionResult> Projects(string pathName)
    {
        var model = await _templateDataManagementService.GetSingleProjectItem(pathName);
        return model is null ? NotFound() : View("_SingleProjectPage", model);
    }

    [HttpGet("/Journals")]
    [OutputCache(Duration = 300)]
    public async Task<IActionResult> Journals()
    {
        var model = await _templateDataManagementService.GetJournalGridItems();
        return View("Journals", model);
    }

    [HttpGet("/Journals/{pathName}")]
    [OutputCache(Duration = 300)]
    public async Task<IActionResult> Journals(string pathName)
    {
        var model = await _templateDataManagementService.GetSingleJournalItem(pathName);
        return model is null ? NotFound() : View("_SingleJournalPage", model);
    }

    [HttpGet("/Services")]
    [OutputCache(Duration = 600)]
    public async Task<IActionResult> Services()
    {
        var model = await _templateDataManagementService.GetServices();
        return View("Services", model);
    }

    [HttpGet("/404")]
    public IActionResult NotFoundPage()
    {
        Response.StatusCode = StatusCodes.Status404NotFound;
        return View("NotFound");
    }

    public IActionResult CommingSoon() => View();
}
