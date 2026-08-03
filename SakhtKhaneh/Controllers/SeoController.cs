using System.Text;
using System.Xml.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SakhtKhaneh.Data;

namespace SakhtKhaneh.Controllers;

[ApiController]
public class SeoController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public SeoController(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpGet("/sitemap.xml")]
    [ResponseCache(Duration = 900)]
    public async Task<IActionResult> Sitemap()
    {
        var baseUrl = SiteBaseUrl;
        XNamespace ns = "http://www.sitemaps.org/schemas/sitemap/0.9";
        var root = new XElement(ns + "urlset");

        void AddUrl(string path, DateTime? lastModified = null, string changeFrequency = "monthly", decimal priority = 0.7m)
        {
            var element = new XElement(ns + "url",
                new XElement(ns + "loc", $"{baseUrl}{path}"),
                new XElement(ns + "changefreq", changeFrequency),
                new XElement(ns + "priority", priority.ToString("0.0", System.Globalization.CultureInfo.InvariantCulture)));

            if (lastModified.HasValue)
                element.Add(new XElement(ns + "lastmod", lastModified.Value.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")));

            root.Add(element);
        }

        AddUrl("/", null, "weekly", 1.0m);
        AddUrl("/Projects", null, "weekly", 0.9m);
        AddUrl("/Blog", null, "weekly", 0.9m);
        AddUrl("/Journals", null, "weekly", 0.8m);
        AddUrl("/Services", null, "monthly", 0.8m);
        AddUrl("/Public/About", null, "monthly", 0.6m);
        AddUrl("/Public/Contacts", null, "monthly", 0.6m);

        var posts = await _context.BlogPosts.AsNoTracking()
            .Select(item => new { item.EndpointPath, item.CreationDate, item.LastUpdateDate })
            .ToListAsync();
        foreach (var item in posts)
            AddUrl($"/Blog/{item.EndpointPath}", item.LastUpdateDate ?? item.CreationDate, "monthly", 0.8m);

        var projects = await _context.Projects.AsNoTracking()
            .Select(item => item.Endpoint_Path)
            .ToListAsync();
        foreach (var slug in projects)
            AddUrl($"/Projects/{slug}", null, "monthly", 0.8m);

        var projectCategories = await _context.ProjectCategories.AsNoTracking()
            .Where(item => item.IsVisible)
            .Select(item => item.Slug)
            .ToListAsync();
        foreach (var slug in projectCategories)
            AddUrl($"/Projects/Category/{slug}", null, "weekly", 0.75m);

        var blogCategories = await _context.BlogCategories.AsNoTracking()
            .Where(item => item.IsVisible)
            .Select(item => item.Slug)
            .ToListAsync();
        foreach (var slug in blogCategories)
            AddUrl($"/Blog/Category/{slug}", null, "weekly", 0.75m);

        var journals = await _context.Journals.AsNoTracking()
            .Where(item => item.IsPublished)
            .Select(item => new { item.EndpointPath, item.CreationDate, item.LastUpdateDate })
            .ToListAsync();
        foreach (var item in journals)
            AddUrl($"/Journals/{item.EndpointPath}", item.LastUpdateDate ?? item.CreationDate, "monthly", 0.7m);

        var document = new XDocument(new XDeclaration("1.0", "utf-8", null), root);
        return Content(document.ToString(), "application/xml; charset=utf-8", Encoding.UTF8);
    }

    [HttpGet("/rss.xml")]
    [HttpGet("/feed")]
    [ResponseCache(Duration = 900)]
    public async Task<IActionResult> Rss()
    {
        var baseUrl = SiteBaseUrl;
        var contentAuthor = _configuration["Site:ContentAuthor"] ?? "حسین کنعانی";
        var posts = await _context.BlogPosts.AsNoTracking()
            .OrderByDescending(item => item.CreationDate)
            .Take(30)
            .ToListAsync();

        var channel = new XElement("channel",
            new XElement("title", "ساخت خانه"),
            new XElement("link", baseUrl),
            new XElement("description", "مطالب تخصصی معماری، طراحی داخلی، بازسازی و اجرای ساختمان"),
            new XElement("language", "fa-ir"),
            new XElement("lastBuildDate", DateTimeOffset.UtcNow.ToString("R")));

        foreach (var post in posts)
        {
            var link = $"{baseUrl}/Blog/{post.EndpointPath}";
            channel.Add(new XElement("item",
                new XElement("title", post.Title),
                new XElement("link", link),
                new XElement("guid", link),
                new XElement("description", post.Description),
                new XElement("author", contentAuthor),
                new XElement("pubDate", new DateTimeOffset(DateTime.SpecifyKind(post.CreationDate, DateTimeKind.Utc)).ToString("R"))));
        }

        var document = new XDocument(
            new XDeclaration("1.0", "utf-8", null),
            new XElement("rss", new XAttribute("version", "2.0"), channel));

        return Content(document.ToString(), "application/rss+xml; charset=utf-8", Encoding.UTF8);
    }

    [HttpGet("/robots.txt")]
    [ResponseCache(Duration = 3600)]
    public IActionResult Robots()
    {
        var content = $"User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: {SiteBaseUrl}/sitemap.xml\n";
        return Content(content, "text/plain; charset=utf-8", Encoding.UTF8);
    }

    private string SiteBaseUrl =>
        (_configuration["Site:BaseUrl"] ?? $"{Request.Scheme}://{Request.Host}").TrimEnd('/');
}
